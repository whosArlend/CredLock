import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';

function findChrome() {
  const local = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe') : null;
  const c = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', local,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
  const f = c.find(p => p && fs.existsSync(p));
  if (!f) throw new Error('no Chrome found');
  return f;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function captureRouteWithPassword(routeUrl, inputSelector, passwordVal, outPath) {
  const profile = path.join(process.cwd(), '.taste-skill', 'chrome-interactive-' + Date.now());
  fs.mkdirSync(profile, { recursive: true });
  const portFile = path.join(profile, 'DevToolsActivePort');
  try { fs.rmSync(portFile); } catch {}

  const child = spawn(findChrome(), ['--headless=new', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--mute-audio', '--disable-gpu',
    `--window-size=1440,900`, 'about:blank'], { stdio: 'ignore', windowsHide: true });

  const kill = () => { if (child.exitCode != null) return; try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { try { child.kill(); } catch {} } };

  try {
    let port = null;
    for (let i = 0; i < 150 && !port; i++) { await sleep(100); try { port = parseInt(fs.readFileSync(portFile, 'utf8'), 10) || null; } catch {} }
    if (!port) throw new Error('Chrome did not start');
    const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    const ws = new WebSocket(ver.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });

    let id = 0; const pend = new Map(), subs = [];
    ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } else subs.forEach(f => f(m)); });
    const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
    const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
    const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
    const S = async (m, p) => { const r = await send(m, p, sessionId); if (r.error) throw new Error(`${m}: ${r.error.message}`); return r.result; };
    const ev = async x => (await S('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result.value;

    await S('Page.enable');
    await S('Runtime.enable');
    await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    const loaded = new Promise(r => subs.push(m => { if (m.method === 'Page.loadEventFired') r(); }));
    await S('Page.navigate', { url: routeUrl });
    await Promise.race([loaded, sleep(15000)]);
    await sleep(1500);

    await ev(`(async () => {
      const input = document.querySelector('${inputSelector}');
      if (!input) return false;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(input, '${passwordVal}');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 600));
      return true;
    })()`);

    await sleep(1000);
    const { data } = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log('Saved', outPath);

    kill();
  } catch (err) {
    console.error('Error on route', routeUrl, err);
    kill();
  }
}

(async () => {
  await captureRouteWithPassword('http://localhost:4173/', '#hero-password-input', 'Tr0ub4dor&3#StrongKey2026', 'shots/home-password-1440.png');
  await captureRouteWithPassword('http://localhost:4173/analyzer', 'input[type="password"], input[type="text"]', 'Tr0ub4dor&3#StrongKey2026', 'shots/analyzer-password-1440.png');
})();
