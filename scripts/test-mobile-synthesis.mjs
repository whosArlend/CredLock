import fs from 'node:fs';
import path from 'node:path';
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

async function runMobileTest() {
  const profile = path.join(process.cwd(), '.taste-skill', 'chrome-mobile-test-' + Date.now());
  fs.mkdirSync(profile, { recursive: true });
  const portFile = path.join(profile, 'DevToolsActivePort');
  try { fs.rmSync(portFile); } catch {}

  const W = 390;
  const VH = 844;

  const child = spawn(findChrome(), ['--headless=new', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--mute-audio', '--disable-gpu',
    `--window-size=${W},${VH}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });

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
    await S('Emulation.setDeviceMetricsOverride', { width: W, height: VH, deviceScaleFactor: 2, mobile: true });

    const loaded = new Promise(r => subs.push(m => { if (m.method === 'Page.loadEventFired') r(); }));
    await S('Page.navigate', { url: 'http://localhost:4173/' });
    await Promise.race([loaded, sleep(15000)]);
    await sleep(1500);

    // 1. Initial view at top
    let shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/mobile-390-before.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/mobile-390-before.png');

    // 2. Scroll down so the Synthesize Test Key button is in view
    await ev(`(() => {
      window.scrollTo(0, 520);
    })()`);
    await sleep(600);

    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/mobile-390-scrolled-at-button.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/mobile-390-scrolled-at-button.png at scrollY =', await ev('window.scrollY'));

    // 3. Click the Synthesize Test Key button
    const clickResult = await ev(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const synthBtn = btns.find(b => b.textContent && b.textContent.includes('Synthesize Test Key'));
      if (!synthBtn) return { success: false, error: 'Button not found' };
      synthBtn.click();
      return { success: true };
    })()`);
    console.log('Click result:', clickResult);

    // Wait for the smooth scroll to finish (typically ~500ms)
    await sleep(1200);

    const postState = await ev(`(() => {
      const input = document.querySelector('#hero-password-input');
      const header = document.querySelector('header');
      const terminal = input ? input.closest('.rounded-2xl') : null;
      const inputRect = input ? input.getBoundingClientRect() : null;
      const headerRect = header ? header.getBoundingClientRect() : null;

      return {
        scrollY: window.scrollY,
        hasPassword: Boolean(input && input.value.length > 0),
        passwordLength: input ? input.value.length : 0,
        headerBottom: headerRect ? headerRect.bottom : 0,
        inputTop: inputRect ? inputRect.top : 0,
        isInputBelowHeader: inputRect && headerRect ? inputRect.top > headerRect.bottom : false,
        inputClearanceBelowHeader: inputRect && headerRect ? inputRect.top - headerRect.bottom : 0
      };
    })()`);
    console.log('Post-synthesis metrics:', postState);

    // 4. Capture after synthesize
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/mobile-390-after-synthesize.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/mobile-390-after-synthesize.png');

    // 5. Test 360px Android viewport
    await S('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 2, mobile: true });
    await S('Page.navigate', { url: 'http://localhost:4173/' });
    await sleep(1500);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/mobile-360-android.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/mobile-360-android.png');

    // 6. Test 1440px desktop regression
    await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await S('Page.navigate', { url: 'http://localhost:4173/' });
    await sleep(1500);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/desktop-1440-regression.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/desktop-1440-regression.png');

    kill();
  } catch (err) {
    console.error('Mobile test error:', err);
    kill();
    process.exit(1);
  }
}

runMobileTest();
