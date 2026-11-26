import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const TEMP_PROFILE = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_profile_' + Date.now());

async function run() {
  console.log("Fetching auth token for ramesh_farmer...");
  const authRes = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ramesh_farmer", password: "farmer123" })
  });
  if (!authRes.ok) {
    throw new Error(`Login failed with status ${authRes.status}`);
  }
  const authData = await authRes.json();
  const token = authData.token;
  const userStr = JSON.stringify(authData.user);
  console.log("Logged in successfully. Token:", token.slice(0, 10) + "...");

  console.log("Starting Chrome headless with remote debugging port " + PORT + "...");
  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    "--hide-scrollbars",
    "--disable-gpu",
    "http://localhost:5173/"
  ]);

  // Wait for Chrome to listen on port
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        targets = await res.json();
        if (targets && targets.length > 0) break;
      }
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    chromeProc.kill();
    throw new Error("Could not connect to Chrome debugging endpoint");
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log("Found page target:", pageTarget.webSocketDebuggerUrl);

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

  await new Promise((resolve) => ws.onopen = resolve);

  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");

  // Navigate to login or root to set localStorage
  console.log("Setting localStorage credentials...");
  await send("Page.navigate", { url: "http://localhost:5173/login" });
  await new Promise(r => setTimeout(r, 1500));

  await send("Runtime.evaluate", {
    expression: `
      localStorage.setItem('krishi_token', '${token}');
      localStorage.setItem('krishi_user', ${JSON.stringify(userStr)});
    `
  });

  // Navigate to /farmer/overview
  console.log("Navigating to /farmer/overview...");
  await send("Page.navigate", { url: "http://localhost:5173/farmer/overview" });

  // Wait for React to render and data to fetch
  await new Promise(r => setTimeout(r, 4000));

  // 1. Desktop Screenshot (1440x900)
  console.log("Capturing desktop dashboard (1440x900)...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));

  const desktopScr = await send("Page.captureScreenshot", { format: "png" });
  const desktopPath = path.resolve("docs/screenshots/corrected_dashboard_desktop_1440.png");
  fs.writeFileSync(desktopPath, Buffer.from(desktopScr.data, 'base64'));
  console.log("Desktop dashboard saved to", desktopPath, fs.statSync(desktopPath).size, "bytes");

  // 2. Mobile Screenshot (390x844)
  console.log("Capturing mobile dashboard (390x844)...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1500));

  const mobileScr = await send("Page.captureScreenshot", { format: "png" });
  const mobilePath = path.resolve("docs/screenshots/corrected_dashboard_mobile_390.png");
  fs.writeFileSync(mobilePath, Buffer.from(mobileScr.data, 'base64'));
  console.log("Mobile dashboard saved to", mobilePath, fs.statSync(mobilePath).size, "bytes");

  ws.close();
  chromeProc.kill();
  console.log("Completed capturing dashboard screenshots.");
}

run().catch(err => {
  console.error("Error capturing dashboard:", err);
  process.exit(1);
});
