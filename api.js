const API = "https://zishu-api-01.zishutv29.workers.dev";

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function token() { return localStorage.getItem("zs_token") || ""; }

async function api(method, path, body) {
  const r = await fetch(API + "/admin/" + path, {
    method,
    headers: { "Content-Type": "application/json", "x-admin-token": token() },
    body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  let d;
  try { d = JSON.parse(t); } catch (e) { d = t; }
  if (!r.ok) throw new Error(d && d.error ? d.error : t);
  return d;
}

function flash(text, isErr) {
  const m = document.getElementById("msg");
  if (m) m.innerHTML = '<div class="msg ' + (isErr ? "err" : "") + '">' + esc(text) + "</div>";
}