// Lead Management System
class LeadManager {
  constructor() {
    this.leads = this.loadLeads();
    this.currentFilter = "all";
  }

  loadLeads() {
    const stored = localStorage.getItem("redditLeads");
    return stored ? JSON.parse(stored) : [];
  }

  saveLeads() {
    localStorage.setItem("redditLeads", JSON.stringify(this.leads));
    this.updateLeadCount();
  }

  addLead(post) {
    // Check if lead already exists
    const exists = this.leads.find((l) => l.id === post.id);
    if (exists) {
      return { success: false, message: "Lead already saved" };
    }

    const lead = {
      ...post,
      savedAt: new Date().toISOString(),
      status: "new", // new, contacted, interested, not-interested
      notes: "",
      tags: [],
    };

    this.leads.unshift(lead); // Add to beginning
    this.saveLeads();
    return { success: true, message: "Lead saved!" };
  }

  addLeads(posts) {
    let added = 0;
    posts.forEach((post) => {
      const result = this.addLead(post);
      if (result.success) added++;
    });
    return { added, total: posts.length };
  }

  updateLead(id, updates) {
    const lead = this.leads.find((l) => l.id === id);
    if (lead) {
      Object.assign(lead, updates);
      this.saveLeads();
      return true;
    }
    return false;
  }

  deleteLead(id) {
    this.leads = this.leads.filter((l) => l.id !== id);
    this.saveLeads();
  }

  getLeads(filter = "all") {
    if (filter === "all") return this.leads;
    return this.leads.filter((l) => l.status === filter);
  }

  getLeadCounts() {
    return {
      all: this.leads.length,
      new: this.leads.filter((l) => l.status === "new").length,
      contacted: this.leads.filter((l) => l.status === "contacted").length,
      interested: this.leads.filter((l) => l.status === "interested").length,
      "not-interested": this.leads.filter((l) => l.status === "not-interested")
        .length,
    };
  }

  updateLeadCount() {
    const countEl = document.getElementById("leadCount");
    if (countEl) {
      countEl.textContent = this.leads.length;
    }
  }

  exportToCSV() {
    if (this.leads.length === 0) {
      alert("No leads to export");
      return;
    }

    const headers = [
      "Date Saved",
      "Status",
      "Title",
      "Author",
      "Subreddit",
      "Score",
      "Comments",
      "URL",
      "Notes",
    ];
    const rows = this.leads.map((lead) => [
      new Date(lead.savedAt).toLocaleDateString(),
      lead.status,
      `"${(lead.title || "").replace(/"/g, '""')}"`,
      lead.author,
      lead.subreddit,
      lead.score,
      lead.numComments,
      lead.url,
      `"${(lead.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reddit-leads-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

// Initialize lead manager
const leadManager = new LeadManager();

// View Leads Modal
document.getElementById("viewLeadsBtn").addEventListener("click", () => {
  showLeadsModal();
});

document.getElementById("closeLeadsModal").addEventListener("click", () => {
  document.getElementById("leadsModal").classList.add("hidden");
  document.getElementById("leadsModal").classList.remove("flex");
});

document.getElementById("exportLeadsBtn").addEventListener("click", () => {
  leadManager.exportToCSV();
});

// Filter buttons in modal
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    leadManager.currentFilter = filter;
    renderLeads(filter);
  });
});

function showLeadsModal() {
  document.getElementById("leadsModal").classList.remove("hidden");
  document.getElementById("leadsModal").classList.add("flex");
  updateLeadCounts();
  renderLeads(leadManager.currentFilter);
}

function updateLeadCounts() {
  const counts = leadManager.getLeadCounts();
  document.getElementById("countAll").textContent = counts.all;
  document.getElementById("countNew").textContent = counts.new;
  document.getElementById("countContacted").textContent = counts.contacted;
  document.getElementById("countInterested").textContent = counts.interested;
  document.getElementById("countNotInterested").textContent =
    counts["not-interested"];
}

function renderLeads(filter = "all") {
  const leads = leadManager.getLeads(filter);
  const container = document.getElementById("leadsList");
  const empty = document.getElementById("emptyLeads");

  if (leads.length === 0) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  container.innerHTML = leads
    .map(
      (lead) => `
    <div class="bg-white rounded-lg shadow-md p-4 border-l-4 ${getStatusBorderColor(
      lead.status
    )}">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
              lead.status
            )}">
              ${lead.status.replace("-", " ").toUpperCase()}
            </span>
            <span class="text-xs text-gray-500">
              <i class="far fa-clock"></i> ${formatDate(lead.savedAt)}
            </span>
          </div>
          
          <h3 class="font-semibold text-gray-900 mb-2 leading-tight">
            <a href="${escapeHtml(
              lead.url
            )}" target="_blank" class="hover:text-indigo-600">
              ${escapeHtml(lead.title)}
            </a>
          </h3>
          
          <div class="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span><i class="fas fa-user"></i> u/${escapeHtml(
              lead.author
            )}</span>
            <span><i class="fas fa-comments"></i> r/${escapeHtml(
              lead.subreddit
            )}</span>
            <span><i class="fas fa-arrow-up"></i> ${formatNumber(
              lead.score
            )}</span>
            <span><i class="fas fa-comment"></i> ${formatNumber(
              lead.numComments
            )}</span>
          </div>

          ${
            lead.notes
              ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-gray-700 mb-2">
              <i class="fas fa-sticky-note text-yellow-600"></i> ${escapeHtml(
                lead.notes
              )}
            </div>
          `
              : ""
          }
        </div>

        <div class="flex flex-col gap-2">
          <select class="text-xs border rounded px-2 py-1" onchange="updateLeadStatus('${
            lead.id
          }', this.value)">
            <option value="new" ${
              lead.status === "new" ? "selected" : ""
            }>New</option>
            <option value="contacted" ${
              lead.status === "contacted" ? "selected" : ""
            }>Contacted</option>
            <option value="interested" ${
              lead.status === "interested" ? "selected" : ""
            }>Interested</option>
            <option value="not-interested" ${
              lead.status === "not-interested" ? "selected" : ""
            }>Not Interested</option>
          </select>
          
          <button onclick="addLeadNote('${
            lead.id
          }')" class="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
            <i class="fas fa-edit"></i> Note
          </button>
          
          <button onclick="copyPostUrl('${escapeHtml(
            lead.url
          )}')" class="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
            <i class="fas fa-copy"></i> URL
          </button>
          
          <button onclick="deleteLead('${
            lead.id
          }')" class="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function getStatusBorderColor(status) {
  const colors = {
    new: "border-blue-500",
    contacted: "border-purple-500",
    interested: "border-green-500",
    "not-interested": "border-gray-400",
  };
  return colors[status] || "border-gray-300";
}

function getStatusBadgeColor(status) {
  const colors = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-purple-100 text-purple-800",
    interested: "bg-green-100 text-green-800",
    "not-interested": "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// Global functions for inline onclick handlers
window.updateLeadStatus = function (id, status) {
  leadManager.updateLead(id, { status });
  updateLeadCounts();
  renderLeads(leadManager.currentFilter);
};

window.addLeadNote = function (id) {
  const lead = leadManager.leads.find((l) => l.id === id);
  const note = prompt("Add a note for this lead:", lead?.notes || "");
  if (note !== null) {
    leadManager.updateLead(id, { notes: note });
    renderLeads(leadManager.currentFilter);
  }
};

window.copyPostUrl = function (url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast("URL copied to clipboard!", "success");
  });
};

window.deleteLead = function (id) {
  if (confirm("Are you sure you want to delete this lead?")) {
    leadManager.deleteLead(id);
    updateLeadCounts();
    renderLeads(leadManager.currentFilter);
  }
};

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500"
  }`;
  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// Initialize lead count
leadManager.updateLeadCount();

// Helper functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
