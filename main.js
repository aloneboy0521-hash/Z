function logout() { localStorage.removeItem("zs_token"); showLogin(); }

function showLogin() {
  document.getElementById("app").innerHTML =
    "<h1>ZiShu Admin</h1><div id='msg'></div>" +
    "<label>Admin token</label><input id='tk' type='password' placeholder='ADMIN_TOKEN'>" +
    "<button onclick='doLogin()'>Login</button>";
}

async function doLogin() {
  localStorage.setItem("zs_token", document.getElementById("tk").value.trim());
  try { await api("GET", "categories?select=id&limit=1"); showList(); }
  catch (e) { localStorage.removeItem("zs_token"); flash("Wrong token", true); }
}

if (token()) showList(); else showLogin();