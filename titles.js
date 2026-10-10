const LANGS = ["Hindi", "English", "Punjabi", "Tamil", "Telugu", "Korean", "Chinese", "Japanese"];

async function showList() {
  const app = document.getElementById("app");
  app.innerHTML = "<h1>ZiShu Admin</h1><div id='msg'></div>" +
    '<div class="bar"><button onclick="showForm()">+ New title</button>' +
    '<button class="sec" onclick="logout()">Logout</button></div>' +
    '<input id="q" placeholder="Search..." oninput="filterList()"><div id="list">Loading...</div>';
  try {
    window._titles = await api("GET",
      "titles?select=id,name,type,year,status&order=created_at.desc&limit=200");
    filterList();
  } catch (e) { flash(e.message, true); }
}

function filterList() {
  const q = (document.getElementById("q").value || "").toLowerCase();
  const rows = (window._titles || []).filter(t => t.name.toLowerCase().includes(q));
  document.getElementById("list").innerHTML = rows.map(t =>
    '<div class="row"><div class="info"><b>' + esc(t.name) + "</b>" +
    '<div class="mut">' + t.type + " | " + (t.year || "-") + " | " + t.status + "</div></div>" +
    "<button onclick=\"showForm('" + t.id + "')\">Edit</button></div>"
  ).join("") || "<p class='mut'>No titles</p>";
}

function val(id) { const v = document.getElementById(id).value.trim(); return v === "" ? null : v; }

async function showForm(id, note) {
  const app = document.getElementById("app");
  app.innerHTML = "Loading...";
  try {
    const cats = await api("GET", "categories?select=id,name&order=sort_order");
    let t = { type: "SERIES", status: "draft", is_free: false, title_languages: [], title_categories: [] };
    if (id) {
      const r = await api("GET",
        "titles?select=*,title_languages(language),title_categories(category_id)&id=eq." + id);
      t = r[0];
    }
    const langs = t.title_languages.map(x => x.language);
    const catIds = t.title_categories.map(x => x.category_id);
    const f = (k) => esc(t[k]);

    app.innerHTML =
      "<h1>" + (id ? "Edit title" : "New title") + "</h1><div id='msg'></div>" +
      '<button class="sec" onclick="showList()">&larr; Back</button>' +
      "<label>Type</label><select id='f_type'><option value='SERIES'" + (t.type === "SERIES" ? " selected" : "") +
      ">Series</option><option value='MOVIE'" + (t.type === "MOVIE" ? " selected" : "") + ">Movie</option></select>" +
      "<label>Name</label><input id='f_name' value=\"" + f("name") + "\">" +
      '<div class="grid2"><div><label>Year</label><input id="f_year" type="number" value="' + f("year") + '"></div>' +
      '<div><label>Rating</label><input id="f_rating" type="number" step="0.1" value="' + f("rating") + '"></div></div>' +
      "<label>Country</label><input id='f_country' value=\"" + f("country") + "\">" +
      "<label>Introduction</label><textarea id='f_intro'>" + f("intro") + "</textarea>" +
      "<label>Cast</label><input id='f_cast' value=\"" + f("cast_names") + "\">" +
      "<label>Director (movie)</label><input id='f_director' value=\"" + f("director") + "\">" +
      "<label>Badge (New, Trending, Free...)</label><input id='f_badge' value=\"" + f("badge") + "\">" +
      "<label><input id='f_free' type='checkbox' style='width:auto' " + (t.is_free ? "checked" : "") + "> Free to watch</label>" +
      "<label>Status</label><select id='f_status'>" +
      ["draft", "published", "hidden"].map(s => "<option" + (t.status === s ? " selected" : "") + ">" + s + "</option>").join("") + "</select>" +
      "<h2>Images (URL)</h2>" +
      "<label>Poster</label><input id='f_poster' value=\"" + f("poster_key") + "\" placeholder='https://...'>" +
      "<label>Background (banner)</label><input id='f_bg' value=\"" + f("background_key") + "\">" +
      "<label>Character PNG (banner)</label><input id='f_char' value=\"" + f("character_key") + "\">" +
      "<label>Title logo PNG</label><input id='f_logo' value=\"" + f("title_logo_key") + "\">" +
      "<h2>Languages</h2><div class='chips'>" +
      LANGS.map(l => "<label><input type='checkbox' class='lang' value='" + l + "'" + (langs.includes(l) ? " checked" : "") + ">" + l + "</label>").join("") + "</div>" +
      "<h2>Tabs (categories)</h2><div class='chips'>" +
      cats.map(c => "<label><input type='checkbox' class='cat' value='" + c.id + "'" + (catIds.includes(c.id) ? " checked" : "") + ">" + esc(c.name) + "</label>").join("") + "</div>" +
      "<button onclick=\"saveTitle(" + (id ? "'" + id + "'" : "null") + ")\">Save</button> " +
      (id ? "<button class='del' onclick=\"delTitle('" + id + "')\">Delete</button>" : "") +
      (id ? "<h2>Episodes / Video</h2><p class='mut'>Movie: add one episode with the video URL.</p><div id='eps'></div>" : "");

    if (note) flash(note);
    if (id) loadEpisodes(id);
  } catch (e) { app.innerHTML = "<div class='msg err'>" + esc(e.message) + "</div>"; }
}

async function saveTitle(id) {
  try {
    const name = val("f_name");
    if (!name) return flash("Name is required", true);
    const body = {
      type: document.getElementById("f_type").value,
      name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + (id ? "" : "-" + Date.now().toString(36)),
      year: val("f_year") ? parseInt(val("f_year")) : null,
      rating: val("f_rating") ? parseFloat(val("f_rating")) : null,
      country: val("f_country"),
      intro: val("f_intro"),
      cast_names: val("f_cast"),
      director: val("f_director"),
      badge: val("f_badge"),
      is_free: document.getElementById("f_free").checked,
      status: document.getElementById("f_status").value,
      poster_key: val("f_poster"),
      background_key: val("f_bg"),
      character_key: val("f_char"),
      title_logo_key: val("f_logo"),
      updated_at: new Date().toISOString()
    };
    if (id) delete body.slug;

    let tid = id;
    if (id) { await api("PATCH", "titles?id=eq." + id, body); }
    else { const r = await api("POST", "titles", body); tid = r[0].id; }

    const langs = [...document.querySelectorAll(".lang:checked")].map(x => x.value);
    await api("DELETE", "title_languages?title_id=eq." + tid);
    if (langs.length) await api("POST", "title_languages", langs.map(l => ({ title_id: tid, language: l })));

    const cats = [...document.querySelectorAll(".cat:checked")].map(x => parseInt(x.value));
    await api("DELETE", "title_categories?title_id=eq." + tid);
    if (cats.length) await api("POST", "title_categories", cats.map(c => ({ title_id: tid, category_id: c })));

    showForm(tid, "Saved");
  } catch (e) { flash(e.message, true); }
}

async function delTitle(id) {
  if (!confirm("Delete this title and its episodes?")) return;
  try { await api("DELETE", "titles?id=eq." + id); showList(); }
  catch (e) { flash(e.message, true); }
}