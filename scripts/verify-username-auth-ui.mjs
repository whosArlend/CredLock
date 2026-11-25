import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

function findChrome() {
  const local = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe') : null;
  const c = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    local,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ];
  const f = c.find(p => p && fs.existsSync(p));
  if (!f) throw new Error('no Chrome found');
  return f;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runVerification() {
  // 1. Start Vite preview child process
  console.log('Starting Vite preview server on port 4173...');
  const isWin = process.platform === 'win32';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';
  const preview = spawn(npxCmd, ['vite', 'preview', '--port', '4173', '--strictPort'], {
    stdio: 'pipe',
    shell: isWin
  });

  const killPreview = () => {
    if (preview.exitCode != null) return;
    try {
      execFileSync('taskkill', ['/PID', String(preview.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      try { preview.kill(); } catch {}
    }
  };

  // Wait for server to respond
  let serverReady = false;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const res = await fetch('http://127.0.0.1:4173/');
      if (res.ok || res.status === 200 || res.status === 304) {
        serverReady = true;
        break;
      }
    } catch {}
  }
  if (!serverReady) {
    killPreview();
    throw new Error('Vite preview server failed to start within 10s');
  }
  console.log('Vite preview server is ready on http://localhost:4173/');

  // 2. Start Chrome
  const profile = path.join(process.cwd(), '.taste-skill', 'chrome-username-auth-' + Date.now());
  fs.mkdirSync(profile, { recursive: true });
  const portFile = path.join(profile, 'DevToolsActivePort');
  try { fs.rmSync(portFile); } catch {}

  const chrome = spawn(findChrome(), [
    '--headless=new',
    `--user-data-dir=${profile}`,
    '--remote-debugging-port=0',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-gpu',
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore', windowsHide: true });

  const killChrome = () => {
    if (chrome.exitCode != null) return;
    try { execFileSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); }
    catch { try { chrome.kill(); } catch {} }
  };

  try {
    let port = null;
    for (let i = 0; i < 150 && !port; i++) {
      await sleep(100);
      try { port = parseInt(fs.readFileSync(portFile, 'utf8'), 10) || null; } catch {}
    }
    if (!port) throw new Error('Chrome did not start');

    const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    const ws = new WebSocket(ver.webSocketDebuggerUrl);
    await new Promise((r, j) => {
      ws.addEventListener('open', r, { once: true });
      ws.addEventListener('error', j, { once: true });
    });

    let id = 0;
    const pend = new Map(), subs = [];
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id && pend.has(m.id)) {
        pend.get(m.id)(m);
        pend.delete(m.id);
      } else subs.forEach(f => f(m));
    });

    const send = (method, params = {}, sessionId) => new Promise(r => {
      const i = ++id;
      pend.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params, sessionId }));
    });

    const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
    const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
    const S = async (m, p) => {
      const r = await send(m, p, sessionId);
      if (r.error) throw new Error(`${m}: ${r.error.message}`);
      return r.result;
    };
    const ev = async x => (await S('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result.value;

    await S('Page.enable');
    await S('Runtime.enable');
    fs.mkdirSync('shots', { recursive: true });

    // 1. Desktop 1440x900 on /signup
    console.log('Testing Desktop 1440x900 on /signup...');
    await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await S('Page.navigate', { url: 'http://localhost:4173/signup' });
    await sleep(2000);
    let shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signup-desktop-1440.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signup-desktop-1440.png');

    // 2. Desktop 1440x900 on /signin
    console.log('Testing Desktop 1440x900 on /signin...');
    await S('Page.navigate', { url: 'http://localhost:4173/signin' });
    await sleep(2000);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signin-desktop-1440.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signin-desktop-1440.png');

    // 3. Validation errors on empty /signin submit
    console.log('Testing validation errors on empty submit /signin...');
    await ev(`(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`);
    await sleep(600);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signin-validation-errors.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signin-validation-errors.png');

    // 4. Validation errors on /signup (invalid username with spaces/special chars)
    console.log('Testing validation errors on /signup...');
    await S('Page.navigate', { url: 'http://localhost:4173/signup' });
    await sleep(1500);
    await ev(`(() => {
      const setVal = (input, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const inputs = document.querySelectorAll('input');
      if (inputs[0]) setVal(inputs[0], 'bad user@name');
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`);
    await sleep(600);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signup-validation-errors.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signup-validation-errors.png');

    // 5. Tablet 768x1024 on /signin
    console.log('Testing Tablet 768x1024 on /signin...');
    await S('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 2, mobile: false });
    await S('Page.navigate', { url: 'http://localhost:4173/signin' });
    await sleep(2000);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signin-tablet-768.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signin-tablet-768.png');

    // 6. Tablet 768x1024 on /signup
    console.log('Testing Tablet 768x1024 on /signup...');
    await S('Page.navigate', { url: 'http://localhost:4173/signup' });
    await sleep(2000);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signup-tablet-768.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signup-tablet-768.png');

    // 7. Mobile 390x844 on /signin
    console.log('Testing Mobile 390x844 on /signin...');
    await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await S('Page.navigate', { url: 'http://localhost:4173/signin' });
    await sleep(2000);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signin-mobile-390.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signin-mobile-390.png');

    // 8. Mobile 390x844 on /signup
    console.log('Testing Mobile 390x844 on /signup...');
    await S('Page.navigate', { url: 'http://localhost:4173/signup' });
    await sleep(2000);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signup-mobile-390.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signup-mobile-390.png');

    // 9. Android narrow 360x800 on /signin
    console.log('Testing Android narrow 360x800 on /signin...');
    await S('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 2.5, mobile: true });
    await S('Page.navigate', { url: 'http://localhost:4173/signin' });
    await sleep(2000);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signin-android-360.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signin-android-360.png');

    // 10. Android narrow 360x800 on /signup
    console.log('Testing Android narrow 360x800 on /signup...');
    await S('Page.navigate', { url: 'http://localhost:4173/signup' });
    await sleep(2000);
    shot = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('shots/username-signup-android-360.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-signup-android-360.png');

    // 11. Header guest state on / (1440x900)
    console.log('Testing Header guest state on /...');
    await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await S('Page.navigate', { url: 'http://localhost:4173/' });
    await sleep(2000);
    shot = await S('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 160, scale: 1 }
    });
    fs.writeFileSync('shots/username-header-guest.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved shots/username-header-guest.png');

    console.log('All username-only authentication verification screenshots captured successfully!');
  } finally {
    killChrome();
    killPreview();
  }
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
