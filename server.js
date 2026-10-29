"use strict";
/* Wildwood Warren online server: serves the game page and relays players over WebSocket. */
const { check } = require("./filter");
const http = require("http"), fs = require("fs"), path = require("path"), { WebSocketServer } = require("ws");
const PORT = process.env.PORT || 3000, MAX_PLAYERS = +process.env.MAX_PLAYERS || 80, PER_IP = +process.env.PER_IP || 6, SEE = 160;
const PUB = process.env.PUB_DIR || path.join(__dirname, "public");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url === "/ww-ping") { res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }); res.end(JSON.stringify({ ww: 1, online: players.size })); return; }
  if (url === "/health") { res.writeHead(200); res.end("ok"); return; }
  let f = url === "/" ? "/index.html" : decodeURIComponent(url);
  f = path.normalize(path.join(PUB, f));
  if (!f.startsWith(PUB)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); res.end("Not found"); return; } res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" }); res.end(data); });
});
const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 4096 });
const players = new Map(); let nextId = 1; const ipCount = new Map();
const num = (v, lim) => (typeof v === "number" && isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : 0);
const str = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, "").slice(0, n) : "");
const col = (v, d) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
function cleanLook(l) { l = l || {}; return { species: str(l.species, 16) || "fox", coat: col(l.coat, "#D98B4A"), accent: col(l.accent, "#FFF6E4"), pattern: str(l.pattern, 16) || "plain", eyes: str(l.eyes, 16) || "amber", hat: l.hat ? str(l.hat, 20) : null }; }
function send(ws, o) { if (ws.readyState === 1) ws.send(JSON.stringify(o)); }
function bcast(o, except) { const m = JSON.stringify(o); for (const p of players.values()) if (p.ws !== except && p.ws.readyState === 1) p.ws.send(m); }
wss.on("connection", (ws, req) => {
  const ip = ((req.headers["x-forwarded-for"] || "").split(",")[0] || req.socket.remoteAddress || "?").trim();
  if (players.size >= MAX_PLAYERS) { send(ws, { t: "full" }); ws.close(); return; }
  if ((ipCount.get(ip) || 0) >= PER_IP) { ws.close(); return; } ipCount.set(ip, (ipCount.get(ip) || 0) + 1);
  const me = { id: nextId++, ws, ip, name: "Animal", look: cleanLook(), x: 0, z: 0, y: 0, yaw: 0, m: 0, a: 0, lastChat: 0, alive: true, hello: false };
  ws.on("pong", () => { me.alive = true; });
  ws.on("message", (raw) => {
    let d; try { d = JSON.parse(raw); } catch (e) { return; } if (!d || typeof d.t !== "string") return;
    if (d.t === "hello") { me.name = str(d.name, 18).trim() || "Animal"; if (check(me.name)) me.name = "Animal"; me.look = cleanLook(d.look); if (!me.hello) { me.hello = true; players.set(me.id, me);
        send(ws, { t: "welcome", id: me.id, online: players.size, players: [...players.values()].filter(p => p !== me).map(p => ({ id: p.id, name: p.name, look: p.look })) });
        bcast({ t: "join", id: me.id, name: me.name, look: me.look }, ws); } else bcast({ t: "join", id: me.id, name: me.name, look: me.look }, ws); return; }
    if (!me.hello) return;
    if (d.t === "p") { me.x = num(d.x, 3000); me.z = num(d.z, 3000); me.y = num(d.y, 60); me.yaw = num(d.yaw, 10); me.m = num(d.m, 2); me.a = d.a ? 1 : 0; return; }
    if (d.t === "c") { const now = Date.now(); if (now - me.lastChat < 800) return; me.lastChat = now; const msg = str(d.msg, 120).trim(); if (!msg) return; const why = check(msg); if (why) { send(ws, { t: "nope", why }); return; } bcast({ t: "c", id: me.id, name: me.name, msg }); return; }
    if (d.t === "e") { const e = str(d.e, 4); if (e) bcast({ t: "e", id: me.id, e }, ws); }
  });
  ws.on("close", () => { ipCount.set(ip, Math.max(0, (ipCount.get(ip) || 1) - 1)); if (players.delete(me.id)) bcast({ t: "leave", id: me.id }); });
  ws.on("error", () => {});
});
setInterval(() => { /* 10 snapshots per second, each player only gets nearby players */
  const list = [...players.values()]; if (!list.length) return;
  for (const p of list) { if (p.ws.readyState !== 1) continue; const out = [];
    for (const q of list) { if (q === p || !q.a) continue; if (Math.abs(q.x - p.x) > SEE * 3 || Math.abs(q.z - p.z) > SEE * 3) continue; out.push([q.id, +q.x.toFixed(2), +q.z.toFixed(2), +q.y.toFixed(2), +q.yaw.toFixed(2), +q.m.toFixed(2)]); }
    p.ws.send(JSON.stringify({ t: "s", p: out, n: list.length })); } }, 100);
setInterval(() => { for (const p of players.values()) { if (!p.alive) { p.ws.terminate(); continue; } p.alive = false; try { p.ws.ping(); } catch (e) {} } }, 25000);
server.listen(PORT, () => console.log("Wildwood Warren online on port " + PORT));
