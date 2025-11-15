import React, { useState, useEffect, useCallback } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:3001";

function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [filter, setFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (minScore > 0) params.append("minScore", minScore);

      const response = await fetch(`${API_URL}/api/leads?${params}`);
      const data = await response.json();

      if (data.success) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, minScore]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch monitoring status
  const fetchMonitoringStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/monitoring/status`);
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus(data);
      }
    } catch (error) {
      console.error("Error fetching monitoring status:", error);
    }
  };

  // Update lead status
  const updateLeadStatus = async (leadId, status, notes = null) => {
    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh leads
        fetchLeads();
        fetchStats();
      }
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  // Trigger manual search
  const triggerManualSearch = async () => {
    try {
      setSearching(true);
      const response = await fetch(`${API_URL}/api/monitoring/search`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        // Show success message
        alert(
          "Search started! This may take a few minutes. New leads will appear automatically."
        );
        // Refresh monitoring status
        fetchMonitoringStatus();
      }
    } catch (error) {
      console.error("Error triggering search:", error);
      alert("Failed to start search. Please try again.");
    } finally {
      // Reset searching state after a delay
      setTimeout(() => setSearching(false), 3000);
    }
  };

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "NEW_LEAD") {
        console.log("New lead received:", message.data);
        // Add new lead to the top of the list
        setLeads((prev) => [message.data, ...prev]);
        // Refresh stats
        fetchStats();
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchLeads();
    fetchStats();
    fetchMonitoringStatus();

    // Refresh stats periodically
    const interval = setInterval(() => {
      fetchStats();
      fetchMonitoringStatus();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [fetchLeads]);

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  // Get urgency badge
  const getUrgencyBadge = (urgency) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };
    return colors[urgency] || colors.medium;
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎯 Reddit Lead Finder
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered lead generation for Interview Prep SaaS
              </p>
            </div>
            <button
              onClick={triggerManualSearch}
              disabled={searching || monitoringStatus?.isRunning}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                searching || monitoringStatus?.isRunning
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {searching || monitoringStatus?.isRunning ? (
                <>
                  <span className="inline-block animate-spin mr-2">⚙️</span>
                  Searching...
                </>
              ) : (
                <>🔍 Find New Leads</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Posts</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {stats.analyzed}
              </div>
              <div className="text-sm text-gray-600">Analyzed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {stats.statusBreakdown?.new || 0}
              </div>
              <div className="text-sm text-gray-600">New Leads</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.statusBreakdown?.contacted || 0}
              </div>
              <div className="text-sm text-gray-600">Contacted</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">
                {stats.avg_score ? Math.round(stats.avg_score) : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Status */}
      {monitoringStatus && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div
            className={`border rounded-lg p-4 ${
              monitoringStatus.isRunning
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {monitoringStatus.isRunning ? (
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                ) : (
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <h3
                  className={`text-sm font-medium ${
                    monitoringStatus.isRunning
                      ? "text-green-900"
                      : "text-blue-900"
                  }`}
                >
                  {monitoringStatus.isRunning
                    ? "🔍 Searching & Analyzing..."
                    : "💤 Ready - Click 'Find New Leads' to start"}
                </h3>
                <div
                  className={`mt-2 text-sm ${
                    monitoringStatus.isRunning
                      ? "text-green-700"
                      : "text-blue-700"
                  }`}
                >
                  <p>
                    Subreddits:{" "}
                    {monitoringStatus.config?.subreddits?.join(", ")}
                  </p>
                  <p>
                    Keywords:{" "}
                    {monitoringStatus.config?.keywords?.slice(0, 3).join(", ")}
                    {monitoringStatus.config?.keywords?.length > 3 && "..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">
                Status:
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Leads</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">
                Min Score:
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20"
              />
            </div>
            <div className="text-sm text-gray-600">
              Showing {leads.length} leads
            </div>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading leads...</div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
            <div className="text-gray-600">
              No leads found. Try adjusting your filters or trigger a manual
              search.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreColor(
                          lead.ai_score
                        )}`}
                      >
                        Score: {lead.ai_score}
                      </span>
                      {lead.ai_urgency && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(
                            lead.ai_urgency
                          )}`}
                        >
                          {lead.ai_urgency} urgency
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        r/{lead.subreddit}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {lead.title}
                    </h3>
                    {lead.selftext && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {lead.selftext}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {formatDate(lead.created_utc)}
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Reasoning:
                      </h4>
                      <p className="text-sm text-gray-600">
                        {lead.ai_reasoning}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Recommendation:
                      </h4>
                      <p className="text-sm text-gray-600">
                        {lead.ai_recommendation}
                      </p>
                    </div>
                  </div>

                  {lead.ai_pain_points && lead.ai_pain_points.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Pain Points:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {lead.ai_pain_points.map((point, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <a
                      href={`https://reddit.com${lead.permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View on Reddit
                    </a>
                    <a
                      href={`https://reddit.com/message/compose/?to=${lead.author}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Message u/{lead.author}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    {lead.lead_status === "new" && (
                      <button
                        onClick={() => updateLeadStatus(lead.id, "contacted")}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {lead.lead_status === "contacted" && (
                      <>
                        <button
                          onClick={() =>
                            updateLeadStatus(lead.id, "interested")
                          }
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Interested
                        </button>
                        <button
                          onClick={() =>
                            updateLeadStatus(lead.id, "not_interested")
                          }
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                        >
                          Not Interested
                        </button>
                      </>
                    )}
                    {lead.lead_status === "interested" && (
                      <button
                        onClick={() => updateLeadStatus(lead.id, "converted")}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                      >
                        Mark Converted
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
