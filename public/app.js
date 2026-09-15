let currentAddress = "";
let nextSince = "";
let refreshTimer = null;

const $ = (id) => document.getElementById(id);
const username = $("username");
const domain = $("domain");
const statusEl = $("status");
const inboxEl = $("inbox");
const countEl = $("count");

function randomName() {
  return "guren" + Math.random().toString(36).slice(2, 9);
}

function address() {
  return `${username.value.trim()}@${domain.value}`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

async function api(path, options) {
  const r = await fetch(path, options);
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { msg = (await r.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return r.status === 204 ? null : r.json();
}

async function loadDomains() {
  const data = await api("/api/config");
  const domains = data.domains || data.system_domains || data.available_domains || [];
  domain.innerHTML = "";
  for (const d of domains) {
    const name = typeof d === "string" ? d : (d.domain || d.name);
    if (name) domain.add(new Option(name, name));
  }
  if (!domain.options.length) throw new Error("Mail.cx tidak mengembalikan domain.");
  username.value = randomName();
  currentAddress = address();
  setStatus("Siap: " + currentAddress);
}

function renderInbox(emails = []) {
  countEl.textContent = emails.length;
  if (!emails.length) {
    inboxEl.className = "inbox empty";
    inboxEl.textContent = "Belum ada email.";
    return;
  }
  inboxEl.className = "inbox";
  inboxEl.innerHTML = emails.map(e => `
    <div class="mail" data-id="${encodeURIComponent(e.id)}">
      <div class="mail-top">
        <div class="mail-subject">${esc(e.subject || "(tanpa subject)")}</div>
        <div class="mail-date">${esc(formatDate(e.created_at))}</div>
      </div>
      <div class="mail-from">${esc(e.from_email || "")}</div>
      <div class="preview">${esc(e.preview_text || "")}</div>
    </div>`).join("");
  inboxEl.querySelectorAll(".mail").forEach(el => {
    el.onclick = () => openMail(decodeURIComponent(el.dataset.id));
  });
}

async function refreshInbox() {
  if (!currentAddress) currentAddress = address();
  setStatus("Mengambil inbox...");
  try {
    const url = `/api/inbox/${encodeURIComponent(currentAddress)}${nextSince ? `?since=${encodeURIComponent(nextSince)}` : ""}`;
    const data = await api(url);
    if (data && data.emails) {
      renderInbox(data.emails);
      nextSince = data.next_since || nextSince;
    }
    setStatus("Inbox diperbarui • " + currentAddress);
  } catch (e) {
    setStatus("Gagal: " + e.message);
  }
}

async function openMail(id) {
  try {
    const data = await api(`/api/email/${encodeURIComponent(id)}`);
    $("mailSubject").textContent = data.subject || "(tanpa subject)";
    $("mailMeta").innerHTML =
      `Dari: ${esc(data.from_email || "")}<br>` +
      `Ke: ${esc(data.to_email || "")}<br>` +
      `Tanggal: ${esc(data.created_at || "")}`;
    $("mailText").textContent = data.text || "";
    $("mailFrame").srcdoc = data.html || `<pre>${esc(data.text || "")}</pre>`;
    $("mailDialog").showModal();
  } catch (e) {
    alert("Gagal membuka email: " + e.message);
  }
}

$("newBtn").onclick = async () => {
  username.value = randomName();
  currentAddress = address();
  nextSince = "";
  renderInbox([]);
  setStatus("Email baru: " + currentAddress);
};

$("refreshBtn").onclick = refreshInbox;

$("clearBtn").onclick = async () => {
  if (!currentAddress || !confirm("Hapus semua email di inbox ini?")) return;
  try {
    await api(`/api/inbox/${encodeURIComponent(currentAddress)}`, {method:"DELETE"});
    nextSince = "";
    renderInbox([]);
    setStatus("Inbox dikosongkan.");
  } catch (e) { setStatus("Gagal: " + e.message); }
};

$("copyBtn").onclick = async () => {
  try {
    await navigator.clipboard.writeText(address());
    setStatus("Alamat disalin: " + address());
  } catch { setStatus("Tidak bisa menyalin otomatis."); }
};

$("closeDialog").onclick = () => $("mailDialog").close();

function formatDate(v) {
  if (!v) return "";
  try { return new Date(v).toLocaleString("id-ID"); } catch { return v; }
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

(async function init() {
  try {
    await loadDomains();
    await refreshInbox();
  } catch (e) {
    setStatus("Belum siap: " + e.message);
  }
})();