import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function run() {
  const authRes = await fetch('http://127.0.0.1:8000/api/accounts/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ramesh_farmer', password: 'farmer123' })
  });
  const authData = await authRes.json();
  const token = authData.token;
  const userStr = JSON.stringify(authData.user);

  const chromeProc = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    '--headless=new',
    '--remote-debugging-port=9335',
    '--user-data-dir=' + path.join(process.env.TEMP || 'C:\\Temp', 'chrome_hi_' + Date.now()),
    '--hide-scrollbars',
    'http://localhost:5173/'
  ]);

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://127.0.0.1:9335/json/list');
      if (res.ok) {
        targets = await res.json();
        if (targets && targets.length > 0) break;
      }
    } catch (e) {}
  }
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };
  await new Promise(r => ws.onopen = r);
  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/login' });
  await new Promise(r => setTimeout(r, 1200));
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('krishi_token', '${token}');
      localStorage.setItem('krishi_user', ${JSON.stringify(userStr)});
      localStorage.setItem('krishi_lang', 'hi');
    `
  });
  await send('Page.navigate', { url: 'http://localhost:5173/farmer/overview' });
  await new Promise(r => setTimeout(r, 4000));
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1500));
  const mobileScr = await send('Page.captureScreenshot', { format: 'png' });
  const mobilePath = path.resolve('docs/screenshots/corrected_dashboard_mobile_hindi_390.png');
  fs.writeFileSync(mobilePath, Buffer.from(mobileScr.data, 'base64'));
  console.log('Saved Hindi mobile dashboard to', mobilePath, fs.statSync(mobilePath).size, 'bytes');
  ws.close();
  chromeProc.kill();
}
run().catch(e => { console.error(e); process.exit(1); });
