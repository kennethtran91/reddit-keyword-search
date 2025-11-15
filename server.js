require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const MonitoringService = require("./monitoringService");
const RedditDatabase = require("./db");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const db = new RedditDatabase();
const monitoringService = new MonitoringService();

// WebSocket connection handling
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("📱 New WebSocket client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("📱 WebSocket client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

// Broadcast new lead to all connected clients
function broadcastNewLead(lead) {
  const message = JSON.stringify({
    type: "NEW_LEAD",
    data: lead,
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Set callback for new leads
monitoringService.setNewLeadCallback((lead) => {
  console.log(`📢 Broadcasting new lead: ${lead.title}`);
  broadcastNewLead(lead);
});

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  const status = monitoringService.getStatus();
  res.json({
    status: "ok",
    monitoring: status,
    timestamp: new Date().toISOString(),
  });
});

// Get all leads
app.get("/api/leads", (req, res) => {
  try {
    const { limit = 100, minScore = 0, status } = req.query;

    let leads;
    if (status) {
      leads = db.getLeadsByStatus(status, parseInt(limit));
    } else {
      leads = db.getAnalyzedPosts(parseInt(limit), parseInt(minScore));
    }

    res.json({
      success: true,
      count: leads.length,
      leads: leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({
      error: "Failed to get leads",
      message: error.message,
    });
  }
});

// Get single lead
app.get("/api/leads/:id", (req, res) => {
  try {
    const lead = db.getPost(req.params.id);

    if (!lead) {
      return res.status(404).json({
        error: "Lead not found",
      });
    }

    res.json({
      success: true,
      lead: lead,
    });
  } catch (error) {
    console.error("Get lead error:", error);
    res.status(500).json({
      error: "Failed to get lead",
      message: error.message,
    });
  }
});

// Update lead status
app.patch("/api/leads/:id", (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    const validStatuses = [
      "new",
      "contacted",
      "interested",
      "not_interested",
      "converted",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updated = db.updateLeadStatus(req.params.id, status, notes);

    if (!updated) {
      return res.status(404).json({
        error: "Lead not found or update failed",
      });
    }

    res.json({
      success: true,
      message: "Lead updated successfully",
    });
  } catch (error) {
    console.error("Update lead error:", error);
    res.status(500).json({
      error: "Failed to update lead",
      message: error.message,
    });
  }
});

// Get database statistics
app.get("/api/stats", (req, res) => {
  try {
    const stats = db.getStats();

    // Get status breakdown
    const statusBreakdown = {
      new: db.getLeadsByStatus("new", 1000).length,
      contacted: db.getLeadsByStatus("contacted", 1000).length,
      interested: db.getLeadsByStatus("interested", 1000).length,
      not_interested: db.getLeadsByStatus("not_interested", 1000).length,
      converted: db.getLeadsByStatus("converted", 1000).length,
    };

    res.json({
      success: true,
      stats: {
        ...stats,
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      error: "Failed to get stats",
      message: error.message,
    });
  }
});

// Get monitoring status
app.get("/api/monitoring/status", (req, res) => {
  try {
    const status = monitoringService.getStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Monitoring status error:", error);
    res.status(500).json({
      error: "Failed to get monitoring status",
      message: error.message,
    });
  }
});

// Trigger manual search
app.post("/api/monitoring/search", async (req, res) => {
  try {
    // Don't wait for completion, respond immediately
    res.json({
      success: true,
      message: "Manual search started",
    });

    // Run search in background
    monitoringService.runManual();
  } catch (error) {
    console.error("Manual search error:", error);
    res.status(500).json({
      error: "Failed to start manual search",
      message: error.message,
    });
  }
});

// Update monitoring configuration
app.patch("/api/monitoring/config", (req, res) => {
  try {
    const { keywords, subreddits, interval, minScore } = req.body;

    const newConfig = {};
    if (keywords) newConfig.keywords = keywords;
    if (subreddits) newConfig.subreddits = subreddits;
    if (interval) newConfig.interval = interval;
    if (minScore !== undefined) newConfig.minScore = minScore;

    monitoringService.updateConfig(newConfig);

    res.json({
      success: true,
      message: "Configuration updated",
      config: monitoringService.config,
    });
  } catch (error) {
    console.error("Update config error:", error);
    res.status(500).json({
      error: "Failed to update configuration",
      message: error.message,
    });
  }
});

// Start server and monitoring
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/leads - Get all leads`);
  console.log(`   GET  /api/leads/:id - Get single lead`);
  console.log(`   PATCH /api/leads/:id - Update lead status`);
  console.log(`   GET  /api/stats - Database statistics`);
  console.log(`   GET  /api/monitoring/status - Monitoring status`);
  console.log(`   POST /api/monitoring/search - Trigger manual search`);
  console.log(`   PATCH /api/monitoring/config - Update configuration`);
  console.log(
    `\n💡 Manual Mode: Click "Find New Leads" button in the dashboard to search`
  );
  console.log(`📊 Open http://localhost:3000 to access the dashboard\n`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down gracefully...");
  monitoringService.stop();
  db.close();
  server.close(() => {
    console.log("✓ Server closed");
    process.exit(0);
  });
});
