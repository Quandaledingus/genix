const NEWS_API = (window.NEWS_API_BASE ?? "") + "/api/news";

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
}[c]));

const paragraphs = (text) => escapeHtml(text)
  .split(/\n{2,}/)
  .map(p => "<p>" + p.replace(/\n/g, "<br>") + "</p>")
  .join("");

const formatDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const localDay = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
};

const renderItem = (item) => {
  const metaParts = [];

  if (item.category) {
    metaParts.push(`<span class="news-tag">${escapeHtml(item.category)}</span>`);
  }
  if (item.author) {
    metaParts.push(`<span class="news-author">by ${escapeHtml(item.author)}</span>`);
  }
  if (item.createdAt) {
    metaParts.push(`<time datetime="${escapeHtml(item.createdAt)}">${escapeHtml(formatDate(item.createdAt))}</time>`);
  }

  const metaHtml = metaParts.join(' <span class="meta-separator">•</span> ');
  const img = item.imageUrl
    ? `<img class="news-image" src="${escapeHtml(item.imageUrl)}" alt="">`
    : "";

  return `
    <article class="news-item">
      <header class="news-item-head">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="news-meta">${metaHtml}</div>
      </header>
      ${img}
      <div class="news-body">${paragraphs(item.body)}</div>
    </article>
  `;
};

let allItems = [];

const matches = (item, terms, from, to) => {
  const title = String(item.title ?? "").toLowerCase();
  if (!terms.every(t => title.includes(t))) return false;
  if (from || to) {
    const day = localDay(item.createdAt);
    if (!day) return false;
    if (from && day < from) return false;
    if (to && day > to) return false;
  }
  return true;
};

function applyFilters() {
  const status = document.getElementById("news-status");
  const list = document.getElementById("news-list");
  const terms = document.getElementById("filter-keyword").value.toLowerCase().split(/\s+/).filter(Boolean);
  const from = document.getElementById("filter-from").value;
  const to = document.getElementById("filter-to").value;
  const active = terms.length > 0 || from || to;

  const items = allItems.filter(item => matches(item, terms, from, to));
  list.innerHTML = items.map(renderItem).join("");

  if (allItems.length === 0) {
    status.textContent = "No news yet. Check back soon.";
  } else if (items.length === 0) {
    status.textContent = "No posts match your search.";
  } else if (active) {
    status.textContent = `Showing ${items.length} of ${allItems.length} posts.`;
  } else {
    status.textContent = "";
  }
}

function clearFilters() {
  document.getElementById("filter-keyword").value = "";
  document.getElementById("filter-from").value = "";
  document.getElementById("filter-to").value = "";
  applyFilters();
}

async function loadNews() {
  const status = document.getElementById("news-status");
  const list = document.getElementById("news-list");
  try {
    const res = await fetch(NEWS_API, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    allItems = Array.isArray(data.items) ? data.items : [];
    applyFilters();
  } catch (err) {
    status.textContent = "News is currently unavailable.";
    list.innerHTML = "";
  }
}

document.getElementById("filter-keyword").addEventListener("input", applyFilters);
document.getElementById("filter-from").addEventListener("change", applyFilters);
document.getElementById("filter-to").addEventListener("change", applyFilters);
document.getElementById("filter-clear").addEventListener("click", clearFilters);

loadNews();