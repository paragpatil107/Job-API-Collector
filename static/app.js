const searchInput = document.getElementById("search");
const locationInput = document.getElementById("location");
const categoryInput = document.getElementById("category");
const jobTypeInput = document.getElementById("jobType");
const sortInput = document.getElementById("sort");
const remoteInput = document.getElementById("remote");
const jobsContainer = document.getElementById("jobs");
const statusText = document.getElementById("status");
const pageInfo = document.getElementById("pageInfo");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");

const PAGE_SIZE = 8;
let currentPage = 1;
let currentJobs = [];

function showLoading() {
    jobsContainer.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
}

async function loadJobs(page = 1) {
    currentPage = page;
    statusText.textContent = "Loading...";
    showLoading();

    const params = new URLSearchParams({
        search: searchInput.value.trim(),
        location: locationInput.value.trim(),
        category: categoryInput.value,
        job_type: jobTypeInput.value,
        remote: remoteInput.checked,
        sort: sortInput.value,
        limit: "100"
    });

    try {
        const response = await fetch(`/api/jobs?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Something went wrong.");

        currentJobs = data.jobs;
        renderFilterOptions(data.categories, data.job_types);
        renderStats(data.stats);
        renderJobs(currentJobs);
        renderPagination();
        statusText.textContent = `${data.total_matches} matching jobs`;
    } catch (error) {
        currentJobs = [];
        jobsContainer.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
        statusText.textContent = "Could not load jobs";
        pageInfo.textContent = "";
    }
}

function renderFilterOptions(categories, types) {
    const selectedCategory = categoryInput.value;
    const selectedType = jobTypeInput.value;

    categoryInput.innerHTML = '<option value="">All categories</option>' +
        categories.map(value => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`).join("");
    jobTypeInput.innerHTML = '<option value="">All job types</option>' +
        types.map(value => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`).join("");

    categoryInput.value = selectedCategory;
    jobTypeInput.value = selectedType;
}

function renderStats(stats) {
    document.getElementById("total").textContent = stats.total;
    document.getElementById("remoteCount").textContent = stats.remote;
    document.getElementById("categoryCount").textContent = stats.categories.length;
    document.getElementById("openCount").textContent = stats.total;
}

function logo(job) {
    const initials = (job.company || "?").trim().slice(0, 2).toUpperCase();
    if (job.logo && /^https?:\/\//i.test(job.logo.trim())) {
        return `<img class="company-logo" src="${escapeAttribute(job.logo.trim())}" alt="${escapeAttribute(job.company || "Company")}" data-fallback="${escapeAttribute(initials)}">`;
    }
    return `<div class="logo-fallback">${escapeHtml(initials)}</div>`;
}

function renderJobs(jobs) {
    if (!jobs.length) {
        jobsContainer.innerHTML = '<div class="message">No jobs found for the current filters.<br><small>Try a broader keyword or location.</small></div>';
        return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageJobs = jobs.slice(start, start + PAGE_SIZE);

    jobsContainer.innerHTML = pageJobs.map(job => `
        <article class="job-card">
            <div class="job-main">
                ${logo(job)}
                <div class="job-copy">
                    <div class="job-line">
                        <span class="category">${escapeHtml(job.category)}</span>
                        <span>•</span>
                        <span>${formatDate(job.published)}</span>
                    </div>
                    <h3>${escapeHtml(job.title)}</h3>
                    <p class="company">${escapeHtml(job.company)}</p>
                    <div class="job-info">
                        <span>📍 ${escapeHtml(job.location)}</span>
                        <span>💼 ${escapeHtml(job.job_type)}</span>
                        ${job.salary ? `<span class="salary">💰 ${escapeHtml(job.salary)}</span>` : ""}
                    </div>
                    ${job.tags?.length ? `<div class="tags">${job.tags.slice(0, 5).map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
                </div>
            </div>
            <div class="job-actions">
                <button class="details-button" onclick="showDetails(${Number(job.id)})">Details</button>
                <a class="view-button" href="${escapeAttribute(job.url)}" target="_blank" rel="noopener noreferrer">View ↗</a>
            </div>
        </article>
    `).join("");

    jobsContainer.querySelectorAll("img.company-logo").forEach(img => {
        img.addEventListener("error", () => {
            const fallback = document.createElement("div");
            fallback.className = "logo-fallback";
            fallback.textContent = img.dataset.fallback || "?";
            img.replaceWith(fallback);
        }, { once: true });
    });
}

function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(currentJobs.length / PAGE_SIZE));
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
}

function showDetails(id) {
    const job = currentJobs.find(item => String(item.id) === String(id));
    if (!job) {
        alert("This job is no longer available in the current list. Refresh the jobs and try again.");
        return;
    }
    openDetailsWindow(job);
}

function openDetailsWindow(job) {
    const win = window.open("", "_blank");
    if (!win) {
        alert("The browser blocked the details tab. Allow pop-ups for this site.");
        return;
    }

    const tags = (job.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    const initials = (job.company || "?").trim().slice(0, 2).toUpperCase();
    const companyLogo = job.logo && /^https?:\/\//i.test(job.logo.trim())
        ? `<img class="detail-logo" src="${escapeAttribute(job.logo.trim())}" alt="${escapeAttribute(job.company || "Company")}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'detail-logo-fallback',textContent:'${escapeAttribute(initials)}'}))">`
        : `<div class="detail-logo-fallback">${escapeHtml(initials)}</div>`;

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(job.title)} — Job API Collector</title>
<style>${detailCSS()}</style>
</head>
<body>
<main class="detail-page">
    <div class="detail-nav"><button onclick="window.close()">← Close</button><span>Job API Collector</span></div>
    <article class="detail-card">
        <div class="detail-head">
            ${companyLogo}
            <div>
                <span class="detail-category">${escapeHtml(job.category)}</span>
                <h1>${escapeHtml(job.title)}</h1>
                <p class="detail-company">${escapeHtml(job.company)}</p>
            </div>
        </div>
        <div class="detail-meta">
            <span>📍 ${escapeHtml(job.location)}</span>
            <span>💼 ${escapeHtml(job.job_type)}</span>
            <span>📅 ${formatDate(job.published)}</span>
            ${job.salary ? `<span class="detail-salary">💰 ${escapeHtml(job.salary)}</span>` : ""}
        </div>
        ${tags ? `<div class="detail-tags">${tags}</div>` : ""}
        <div class="detail-body">
            <h2>Job description</h2>
            <div class="description">${sanitizeDescription(job.description)}</div>
        </div>
        <a class="apply" href="${escapeAttribute(job.url)}" target="_blank" rel="noopener noreferrer">Open original job posting ↗</a>
    </article>
</main>
</body>
</html>`);
    win.document.close();
}

function sanitizeDescription(value) {
    const source = document.createElement("div");
    source.innerHTML = value || "<p>No description available.</p>";
    const allowed = new Set(["P", "BR", "UL", "OL", "LI", "STRONG", "B", "EM", "I", "H2", "H3", "H4", "A"]);

    function walk(node) {
        if (node.nodeType === 3) return escapeHtml(node.nodeValue);
        if (node.nodeType !== 1) return "";
        const tag = node.tagName;
        if (!allowed.has(tag)) return Array.from(node.childNodes).map(walk).join("");
        let attrs = "";
        if (tag === "A" && node.getAttribute("href")) {
            attrs = ` href="${escapeAttribute(node.getAttribute("href"))}" target="_blank" rel="noopener noreferrer"`;
        }
        return `<${tag.toLowerCase()}${attrs}>${Array.from(node.childNodes).map(walk).join("")}</${tag.toLowerCase()}>`;
    }
    return Array.from(source.childNodes).map(walk).join("");
}

function detailCSS() {
    return `*{box-sizing:border-box}body{margin:0;background:#f5f7fa;color:#182235;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}.detail-page{width:min(900px,calc(100% - 28px));margin:auto;padding:28px 0 60px}.detail-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;color:#7b8494;font-size:12px}.detail-nav button{border:0;background:transparent;color:#5364d9;cursor:pointer;font:inherit;font-weight:700}.detail-card{background:#fff;border:1px solid #e3e7ee;border-radius:18px;padding:30px;box-shadow:0 15px 45px rgba(23,32,51,.07)}.detail-head{display:flex;gap:15px;align-items:flex-start}.detail-logo,.detail-logo-fallback{width:58px;height:58px;object-fit:contain;border:1px solid #e4e8ef;border-radius:13px;padding:7px}.detail-logo-fallback{display:grid;place-items:center;background:#101827;color:#fff;font-weight:800;font-size:16px}.detail-category{font-size:11px;color:#5364d9;font-weight:800;text-transform:uppercase;letter-spacing:.5px}.detail-head h1{margin:6px 0 4px;font-size:30px;line-height:1.2}.detail-company{margin:0;color:#657084;font-weight:600}.detail-meta,.detail-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.detail-meta span,.detail-tags span{padding:7px 10px;border-radius:8px;background:#f3f5f8;color:#566175;font-size:12px}.detail-salary{color:#13845e!important;font-weight:800}.detail-tags span{background:#eef1ff;color:#4f60d2}.detail-body{border-top:1px solid #e8ebf0;margin-top:26px;padding-top:4px}.detail-body h2{font-size:20px;margin:22px 0 16px}.description{font-size:15px;line-height:1.75;color:#3e495c}.description p{margin:0 0 16px}.description h2,.description h3,.description h4{color:#182235;line-height:1.35;margin:24px 0 10px}.description ul,.description ol{padding-left:24px;margin:8px 0 18px}.description li{margin:7px 0}.description a{color:#5364d9}.apply{display:inline-flex;margin-top:26px;background:#101827;color:#fff;text-decoration:none;border-radius:10px;padding:12px 16px;font-size:13px;font-weight:700}@media(max-width:600px){.detail-card{padding:21px}.detail-head h1{font-size:25px}}`;
}

function formatDate(value) {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

document.getElementById("searchButton").addEventListener("click", () => loadJobs(1));
document.getElementById("refreshButton").addEventListener("click", () => {
    sortInput.value = "random";
    loadJobs(1);
});

[searchInput, locationInput].forEach(input => input.addEventListener("keydown", event => {
    if (event.key === "Enter") loadJobs(1);
}));

[categoryInput, jobTypeInput, sortInput, remoteInput].forEach(input => {
    input.addEventListener("change", () => loadJobs(1));
});

previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderJobs(currentJobs);
        renderPagination();
    }
});

nextButton.addEventListener("click", () => {
    if (currentPage < Math.ceil(currentJobs.length / PAGE_SIZE)) {
        currentPage++;
        renderJobs(currentJobs);
        renderPagination();
    }
});

loadJobs();
