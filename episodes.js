async function loadEpisodes(tid) {
  const box = document.getElementById("eps");
  const rows = await api("GET",
    "episodes?select=*&title_id=eq." + tid + "&order=season_number,episode_number");
  box.innerHTML = rows.map(e =>
    '<div class="row"><div class="info"><b>S' + e.season_number + " E" + e.episode_number +
    "</b> " + esc(e.name || "") + " [" + esc(e.source_type) + "]" +
    '<div class="mut">' + esc(e.video_key || "no video url") + "</div></div>" +
    '<button class="del" onclick="delEp(\'' + e.id + "','" + tid + "\')\">Delete</button></div>"
  ).join("") +
  '<h2>Add episode</h2>' +
  '<div class="grid2"><div><label>Season</label><input id="e_s" type="number" value="1"></div>' +
  '<div><label>Episode no.</label><input id="e_n" type="number" value="' + (rows.length + 1) + '"></div></div>' +
  '<label>Name (optional)</label><input id="e_name">' +
  '<label>Video type</label><select id="e_type"><option>MP4</option><option>HLS</option><option>DASH</option><option>LIVE</option></select>' +
  '<label>Video URL (m3u8 / mpd / mp4)</label><input id="e_url" placeholder="https://...">' +
  '<button onclick="addEp(\'' + tid + "\')\">Add episode</button>";
}

async function addEp(tid) {
  try {
    await api("POST", "episodes", {
      title_id: tid,
      season_number: parseInt(document.getElementById("e_s").value) || 1,
      episode_number: parseInt(document.getElementById("e_n").value) || 1,
      name: document.getElementById("e_name").value.trim() || null,
      source_type: document.getElementById("e_type").value,
      video_key: document.getElementById("e_url").value.trim() || null,
      status: "published"
    });
    await loadEpisodes(tid);
    flash("Episode added");
  } catch (e) { flash(e.message, true); }
}

async function delEp(id, tid) {
  if (!confirm("Delete this episode?")) return;
  try {
    await api("DELETE", "episodes?id=eq." + id);
    await loadEpisodes(tid);
  } catch (e) { flash(e.message, true); }
}