// DOM elements
const keywordsInput = document.getElementById("keywords");
const subredditInput = document.getElementById("subreddit");
const sortSelect = document.getElementById("sort");
const timeSelect = document.getElementById("time");
const limitSelect = document.getElementById("limit");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const resultsSection = document.getElementById("results");
const selectAllBtn = document.getElementById("selectAllBtn");
const saveSelectedBtn = document.getElementById("saveSelectedBtn");

// Load configuration on page load
let config = {};
let currentResults = [];
loadConfig();

// Event listeners
searchBtn.addEventListener("click", handleSearch);
clearBtn.addEventListener("click", clearSearch);
selectAllBtn.addEventListener("click", toggleSelectAll);
saveSelectedBtn.addEventListener("click", saveSelectedLeads);

// Preset buttons
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const search = btn.dataset.search;
    const subreddit = btn.dataset.subreddit || "all";
    keywordsInput.value = search;
    subredditInput.value = subreddit;
    showToast(`Preset loaded: ${search}`, "info");
  });
});

async function loadConfig() {
  try {
    const response = await fetch("/api/config");
    config = await response.json();
  } catch (error) {
    console.error("Failed to load config:", error);
  }
}

function clearSearch() {
  keywordsInput.value = "";
  subredditInput.value = "all";
  currentResults = [];
  resultsSection.innerHTML =
    '<div class="text-center text-gray-500 py-12"><i class="fas fa-search text-4xl mb-4"></i><p>Enter a search term to find potential leads</p></div>';
}

function toggleSelectAll() {
  const checkboxes = document.querySelectorAll(".result-checkbox");
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
  checkboxes.forEach((cb) => (cb.checked = !allChecked));
  updateSaveButtonState();
}

function updateSaveButtonState() {
  const checkedCount = document.querySelectorAll(
    ".result-checkbox:checked"
  ).length;
  saveSelectedBtn.disabled = checkedCount === 0;
  saveSelectedBtn.innerHTML =
    checkedCount > 0
      ? `<i class="fas fa-save"></i> Save Selected (${checkedCount})`
      : '<i class="fas fa-save"></i> Save Selected';
}

function saveSelectedLeads() {
  const checkboxes = document.querySelectorAll(".result-checkbox:checked");
  const selectedPosts = Array.from(checkboxes).map((cb) => {
    const index = parseInt(cb.dataset.index);
    return currentResults[index];
  });

  if (selectedPosts.length === 0) {
    showToast("No posts selected", "error");
    return;
  }

  const result = leadManager.addLeads(selectedPosts);
  showToast(
    `Saved ${result.added} of ${result.total} leads (${
      result.total - result.added
    } already exist)`,
    "success"
  );

  // Uncheck all
  checkboxes.forEach((cb) => (cb.checked = false));
  updateSaveButtonState();
}

async function handleSearch() {
  const keywordsText = keywordsInput.value.trim();

  if (!keywordsText) {
    showToast("Please enter at least one keyword", "error");
    return;
  }

  // Parse keywords (split by newlines or commas)
  const keywords = keywordsText
    .split(/[\n,]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const searchParams = {
    keywords: keywords,
    subreddit: subredditInput.value.trim() || "all",
    sort: sortSelect.value,
    time: timeSelect.value,
    limit: parseInt(limitSelect.value),
  };

  // Update UI
  searchBtn.disabled = true;
  searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
  resultsSection.innerHTML =
    '<div class="text-center text-gray-500 py-12"><i class="fas fa-spinner fa-spin text-4xl mb-4"></i><p>Searching Reddit...</p></div>';

  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchParams),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Search failed");
    }

    // Handle new response format
    const results = data.posts || data.results || [];
    currentResults = results;
    displayResults(results, keywords);

    if (results.length === 0) {
      showToast(
        "No results found. Try different keywords or settings.",
        "info"
      );
    } else {
      showToast(`Found ${results.length} results`, "success");
    }
  } catch (error) {
    console.error("Search error:", error);
    showToast(`Error: ${error.message}`, "error");
    resultsSection.innerHTML =
      '<div class="text-center text-red-500 py-12"><i class="fas fa-exclamation-circle text-4xl mb-4"></i><p>Search failed. Please try again.</p></div>';
  } finally {
    // Reset button
    searchBtn.disabled = false;
    searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
  }
}

function displayResults(results, keywords) {
  if (results.length === 0) {
    resultsSection.innerHTML =
      '<div class="text-center text-gray-500 py-12"><i class="fas fa-search text-4xl mb-4"></i><p>No results found</p></div>';
    return;
  }

  resultsSection.innerHTML = `
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">
        <i class="fas fa-list"></i> ${results.length} Result${
    results.length !== 1 ? "s" : ""
  }
      </h2>
      <div class="flex gap-2">
        <button id="analyzeWithAIBtn" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
          <i class="fas fa-brain"></i> Analyze with AI
        </button>
        <button id="selectAllBtn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold">
          <i class="fas fa-check-square"></i> Select All
        </button>
        <button id="saveSelectedBtn" disabled class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          <i class="fas fa-save"></i> Save Selected
        </button>
      </div>
    </div>
    <div class="space-y-4" id="resultsContainer">
      ${results
        .map((result, index) => createResultCard(result, index, keywords))
        .join("")}
    </div>
  `;

  // Re-attach event listeners
  document
    .getElementById("analyzeWithAIBtn")
    .addEventListener("click", analyzeResultsWithAI);
  document
    .getElementById("selectAllBtn")
    .addEventListener("click", toggleSelectAll);
  document
    .getElementById("saveSelectedBtn")
    .addEventListener("click", saveSelectedLeads);

  document.querySelectorAll(".result-checkbox").forEach((cb) => {
    cb.addEventListener("change", updateSaveButtonState);
  });

  document.querySelectorAll(".save-lead-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(btn.dataset.index);
      const result = leadManager.addLead(currentResults[index]);
      showToast(result.message, result.success ? "success" : "error");
    });
  });
}

function createResultCard(result, index, keywords) {
  const dateStr = formatDate(result.created);
  const isAlreadySaved = leadManager.leads.find((l) => l.id === result.id);

  // AI Analysis badge
  const aiAnalysis = result.aiAnalysis;
  let aiBadge = "";
  if (aiAnalysis) {
    const scoreColor =
      aiAnalysis.score >= 80
        ? "bg-green-100 text-green-800 border-green-300"
        : aiAnalysis.score >= 60
        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
        : "bg-gray-100 text-gray-800 border-gray-300";

    const reachIcon =
      aiAnalysis.shouldReach === "yes"
        ? '<i class="fas fa-check-circle text-green-600"></i>'
        : aiAnalysis.shouldReach === "maybe"
        ? '<i class="fas fa-question-circle text-yellow-600"></i>'
        : '<i class="fas fa-times-circle text-red-600"></i>';

    aiBadge = `
      <div class="mb-3 p-3 border-2 ${scoreColor} rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <i class="fas fa-brain text-purple-600"></i>
            <span class="font-bold">AI Score: ${aiAnalysis.score}/100</span>
            ${reachIcon}
            <span class="text-xs font-semibold uppercase">${
              aiAnalysis.urgency
            } urgency</span>
          </div>
        </div>
        <p class="text-sm mb-1"><strong>Analysis:</strong> ${escapeHtml(
          aiAnalysis.reasoning
        )}</p>
        <p class="text-sm text-indigo-700"><strong>💡 Pitch Tip:</strong> ${escapeHtml(
          aiAnalysis.recommendation
        )}</p>
        ${
          aiAnalysis.painPoints && aiAnalysis.painPoints.length > 0
            ? `
          <div class="mt-2 flex flex-wrap gap-1">
            ${aiAnalysis.painPoints
              .map(
                (p) =>
                  `<span class="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">${escapeHtml(
                    p
                  )}</span>`
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200" data-ai-score="${
      aiAnalysis ? aiAnalysis.score : 50
    }">
      <div class="flex gap-4">
        <div class="flex-shrink-0">
          <input type="checkbox" class="result-checkbox w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" data-index="${index}">
        </div>
        
        <div class="flex-1 min-w-0">
          ${aiBadge}
          
          <h3 class="text-lg font-semibold text-gray-900 mb-2 leading-tight">
            <a href="${escapeHtml(
              result.url
            )}" target="_blank" class="hover:text-indigo-600">
              ${highlightKeywords(escapeHtml(result.title), keywords)}
            </a>
          </h3>
          
          <div class="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
            <span class="inline-flex items-center gap-1">
              <i class="fas fa-user"></i> 
              <span class="font-medium">u/${escapeHtml(result.author)}</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <i class="fas fa-comments"></i> 
              <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold">r/${escapeHtml(
                result.subreddit
              )}</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <i class="far fa-clock"></i> ${dateStr}
            </span>
          </div>

          ${
            result.selftext
              ? `
            <div class="text-gray-700 text-sm mb-3 line-clamp-3">
              ${highlightKeywords(
                escapeHtml(truncate(result.selftext, 300)),
                keywords
              )}
            </div>
          `
              : ""
          }

          <div class="flex items-center justify-between">
            <div class="flex gap-4 text-sm text-gray-600">
              <span class="inline-flex items-center gap-1">
                <i class="fas fa-arrow-up text-green-600"></i>
                <strong>${formatNumber(result.score)}</strong> score
              </span>
              <span class="inline-flex items-center gap-1">
                <i class="fas fa-comment text-blue-600"></i>
                <strong>${formatNumber(result.numComments)}</strong> comments
              </span>
              <span class="inline-flex items-center gap-1">
                <i class="fas fa-percentage text-purple-600"></i>
                <strong>${Math.round(
                  (result.upvoteRatio || 0) * 100
                )}%</strong> upvoted
              </span>
            </div>

            <button 
              class="save-lead-btn px-4 py-2 ${
                isAlreadySaved
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white rounded-lg text-sm font-semibold transition-colors"
              data-index="${index}"
              ${isAlreadySaved ? "disabled" : ""}
            >
              <i class="fas ${
                isAlreadySaved ? "fa-check" : "fa-bookmark"
              }"></i> 
              ${isAlreadySaved ? "Saved" : "Save as Lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function highlightKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return text;

  let highlighted = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${escapeRegex(keyword)})`, "gi");
    highlighted = highlighted.replace(
      regex,
      "<mark class='bg-yellow-200 px-1'>$1</mark>"
    );
  });
  return highlighted;
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500"
  }`;
  toast.innerHTML = `<i class="fas fa-${
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "exclamation-circle"
      : "info-circle"
  }"></i> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// AI Analysis function
async function analyzeResultsWithAI() {
  console.log("🤖 AI Analyze button clicked!");
  console.log("Current results count:", currentResults.length);

  const analyzeBtn = document.getElementById("analyzeWithAIBtn");

  if (currentResults.length === 0) {
    showToast("No results to analyze", "error");
    return;
  }

  // Check if already analyzed
  if (currentResults[0].aiAnalysis) {
    showToast("Results already analyzed! Sorting by AI score...", "info");
    sortByAIScore();
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Analyzing with AI...';

  try {
    showToast(
      `Analyzing ${currentResults.length} posts with Gemini AI... This may take a minute.`,
      "info"
    );

    console.log("📡 Sending analyze request to server...");
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ posts: currentResults }),
    });

    console.log("📥 Response status:", response.status);
    const data = await response.json();
    console.log("📥 Response data:", data);

    if (!response.ok) {
      if (response.status === 503) {
        showToast(
          "⚠️ AI analysis not available. Please add GEMINI_API_KEY to .env file. Get your free key at: https://aistudio.google.com/app/apikey",
          "error"
        );
      } else {
        throw new Error(data.message || "Analysis failed");
      }
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> Analyze with AI';
      return;
    }

    // Update current results with AI analysis
    currentResults = data.posts;

    // Re-render results with AI analysis
    const keywords = keywordsInput.value
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k);

    console.log("✨ Analysis complete! Re-rendering results...");
    displayResults(currentResults, keywords);

    showToast(
      `✨ AI analysis complete! Posts sorted by lead quality. ${
        data.posts.filter((p) => p.aiAnalysis.score >= 70).length
      } high-quality leads found!`,
      "success"
    );
  } catch (error) {
    console.error("❌ AI analysis error:", error);
    showToast(`Error: ${error.message}`, "error");
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> Analyze with AI';
  }
}

function sortByAIScore() {
  currentResults.sort((a, b) => {
    const scoreA = a.aiAnalysis?.score || 0;
    const scoreB = b.aiAnalysis?.score || 0;
    return scoreB - scoreA;
  });

  const keywords = keywordsInput.value
    .split(/[\n,]+/)
    .map((k) => k.trim())
    .filter((k) => k);
  displayResults(currentResults, keywords);
}

// Check API health on load
fetch("/api/health")
  .then((res) => res.json())
  .then((data) => {
    if (data.status === "ok") {
      console.log("✓ Reddit API ready (using public JSON endpoints)");
      if (data.aiEnabled) {
        console.log("✓ Gemini AI enabled");
      } else {
        console.log("⚠️  Gemini AI disabled - add GEMINI_API_KEY to .env");
      }
    }
  })
  .catch((err) => {
    console.error("Health check failed:", err);
  });
