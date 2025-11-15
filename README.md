# Reddit Lead Finder 🎯

**Automated AI-Powered Lead Generation System for Interview Prep SaaS**

An intelligent lead generation system that automatically monitors Reddit for potential customers, analyzes posts using AI, and presents qualified leads in a modern dashboard with real-time updates.

## 🌟 Features

### Automated Monitoring
- **Background Service**: Automatically searches Reddit every 30 minutes using public JSON endpoints
- **No Authentication Required**: Uses Reddit's public JSON API - no credentials needed
- **Scheduled Searches**: Configurable cron-based scheduling
- **Multi-Keyword & Multi-Subreddit**: Monitor multiple subreddits and keywords simultaneously

### AI-Powered Analysis
- **Gemini AI Integration**: Analyzes each post for relevance to your product
- **Smart Scoring (0-100)**: AI rates each post's potential as a lead
- **Pain Point Detection**: Identifies specific problems mentioned in posts
- **Urgency Assessment**: Determines how urgent the user's need is
- **Personalized Recommendations**: AI suggests how to approach each lead

### Real-Time Dashboard
- **Live Updates**: WebSocket connection pushes new leads instantly
- **Modern UI**: Beautiful Tailwind CSS interface
- **Lead Management**: Track leads through stages: New → Contacted → Interested → Converted
- **Filtering**: Filter by status, minimum score, and more
- **Statistics**: Real-time stats on total posts, analyzed leads, and conversion tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  (Tailwind CSS, Real-time WebSocket Updates)               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────┴────────────────────────────────────────┐
│                  Express Backend (Node.js)                  │
│  - REST API Endpoints                                       │
│  - WebSocket Server                                         │
│  - Monitoring Service (Cron Scheduler)                      │
└──┬──────────────────┬────────────────────┬──────────────────┘
   │                  │                    │
   │                  │                    │
┌──▼──────────┐  ┌───▼────────────┐  ┌───▼──────────────┐
│   Reddit    │  │ Gemini AI API  │  │  SQLite Database │
│ Public JSON │  │  (Analysis)    │  │  (Lead Storage)  │
└─────────────┘  └────────────────┘  └──────────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Required: Gemini AI API Key for analysis
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Server configuration
PORT=3001
```

**Get your free Gemini API key:**
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste into `.env`

### 3. Configure Monitoring

Edit `config.json` to customize what to search for:

```json
{
  "monitoringKeywords": [
    "interview preparation",
    "mock interview",
    "coding interview"
  ],
  "monitoringSubreddits": [
    "cscareerquestions",
    "jobs",
    "careerguidance"
  ],
  "monitoringInterval": "*/30 * * * *",
  "minScoreThreshold": 60
}
```

### 4. Run the Application

**Development mode (runs both backend and frontend):**
```bash
npm run dev
```

**Production mode (backend only):**
```bash
npm start
```

Then in another terminal:
```bash
cd client && npm start
```

### 5. Access the Dashboard

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 📖 How It Works

### 1. Automated Monitoring

The monitoring service runs automatically when you start the server:

```javascript
// Runs on startup, then every 30 minutes
monitoringService.start();
```

**What happens each cycle:**
1. Searches configured subreddits for keywords
2. Finds new posts from the last 24 hours
3. Filters out posts already in database
4. Analyzes new posts with Gemini AI
5. Saves high-scoring leads (score ≥ threshold)
6. Broadcasts new leads to connected clients via WebSocket

### 2. AI Analysis

Each post is analyzed by Gemini AI:

```
Input: Reddit post (title, content, subreddit, author)
  ↓
Gemini AI analyzes for interview prep relevance
  ↓
Output:
  - Score (0-100): How good is this lead?
  - Reasoning: Why this score?
  - Recommendation: How to approach them?
  - Pain Points: What problems did they mention?
  - Urgency: How urgent is their need?
  - Should Reach: yes/maybe/no
```

### 3. Lead Management

Track leads through their lifecycle:

```
New → Contacted → Interested → Converted
            ↓
      Not Interested
```

## 🔧 API Reference

### GET /api/leads

Get all leads with optional filters.

**Query Parameters:**
- `status` - Filter by lead status (new, contacted, interested, not_interested, converted)
- `minScore` - Minimum AI score (0-100)
- `limit` - Max number of results (default: 100)

**Example:**
```bash
GET /api/leads?status=new&minScore=70&limit=50
```

### GET /api/leads/:id

Get a single lead by ID.

### PATCH /api/leads/:id

Update a lead's status.

**Body:**
```json
{
  "status": "contacted",
  "notes": "Sent initial message"
}
```

### GET /api/stats

Get database statistics including status breakdown.

### GET /api/monitoring/status

Get current monitoring service status and configuration.

### POST /api/monitoring/search

Trigger a manual search immediately.

### PATCH /api/monitoring/config

Update monitoring configuration.

**Body:**
```json
{
  "keywords": ["new keyword"],
  "subreddits": ["newsubreddit"],
  "interval": "*/15 * * * *",
  "minScore": 70
}
```

## 📁 Project Structure

```
reddit-keyword-search/
├── server-new.js              # Express server with WebSocket
├── monitoringService.js       # Background monitoring service
├── redditApi.js               # Reddit API client (public JSON)
├── geminiService.js           # Gemini AI integration
├── db.js                      # SQLite database operations
├── config.json                # Monitoring configuration
├── package.json               # Backend dependencies
├── .env                       # Environment variables
├── reddit_leads.db            # SQLite database (auto-created)
│
└── client/                    # React frontend
    ├── src/
    │   ├── App.js            # Main React component
    │   ├── index.js          # React entry point
    │   └── index.css         # Tailwind CSS styles
    ├── public/
    ├── package.json          # Frontend dependencies
    └── .env                  # Frontend environment variables
```

## 🎯 Customization for Your Product

This system is currently configured for an **Interview Prep SaaS**. To adapt it for your product:

### 1. Update Keywords in `config.json`

Replace with keywords relevant to your product:

```json
{
  "monitoringKeywords": [
    "your product category",
    "problem your product solves",
    "customer pain point"
  ]
}
```

### 2. Update Subreddits in `config.json`

Target subreddits where your customers hang out:

```json
{
  "monitoringSubreddits": [
    "relevant_subreddit_1",
    "relevant_subreddit_2"
  ]
}
```

### 3. Customize AI Prompt in `geminiService.js`

Update the analysis prompt to match your product:

```javascript
const prompt = `You are an expert sales analyst for [YOUR PRODUCT].

Analyze this Reddit post and determine if the poster is a good lead...`;
```

## ⚙️ Configuration

### Monitoring Interval (Cron Syntax)

Default: `"*/30 * * * *"` (every 30 minutes)

Common patterns:
- Every 15 minutes: `"*/15 * * * *"`
- Every hour: `"0 * * * *"`
- Every 6 hours: `"0 */6 * * *"`
- Daily at 9 AM: `"0 9 * * *"`

### Score Threshold

`minScoreThreshold` in `config.json` determines which leads trigger notifications:
- 60-69: Moderate leads
- 70-79: Good leads
- 80-89: Great leads
- 90-100: Excellent leads

## 🔍 Troubleshooting

### No leads appearing?

1. **Check monitoring status**: Visit http://localhost:3001/api/monitoring/status
2. **Verify Gemini API key**: Check `.env` file
3. **Check database**: Posts are saved even without AI analysis
4. **Trigger manual search**: Click "Manual Search" button in dashboard

### WebSocket not connecting?

1. Ensure backend is running on port 3001
2. Check browser console for WebSocket errors
3. Verify `REACT_APP_WS_URL` in `client/.env`

### AI analysis not working?

1. Verify `GEMINI_API_KEY` in `.env`
2. Check rate limits (30 requests/minute for free tier)
3. Look for errors in server console

## 📊 Database

The app uses SQLite for simplicity. Database file: `reddit_leads.db`

### Schema

```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT,
  selftext TEXT,
  author TEXT,
  subreddit TEXT,
  score INTEGER,
  num_comments INTEGER,
  created_utc INTEGER,
  url TEXT,
  permalink TEXT,
  search_query TEXT,
  analyzed INTEGER,
  ai_score INTEGER,
  ai_reasoning TEXT,
  ai_recommendation TEXT,
  ai_should_reach TEXT,
  ai_pain_points TEXT,
  ai_urgency TEXT,
  lead_status TEXT,
  lead_notes TEXT,
  contacted_at DATETIME,
  created_at DATETIME,
  analyzed_at DATETIME,
  updated_at DATETIME
);
```

## 🚢 Deployment

### Backend Deployment (Node.js)

Deploy to platforms like:
- **Railway**: Easy Node.js deployment
- **Render**: Free tier available
- **Heroku**: Classic PaaS
- **DigitalOcean**: Full control

### Frontend Deployment (React)

Build and deploy frontend:

```bash
cd client
npm run build
```

Deploy `build/` folder to:
- **Vercel**: Best for React apps
- **Netlify**: Great DX
- **GitHub Pages**: Free hosting

Update environment variables for production URLs.

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit PRs.

## ⚠️ Disclaimer

This tool uses Reddit's public JSON API. Please use responsibly and comply with:
- [Reddit API Terms](https://www.reddit.com/wiki/api)
- [Reddit User Agreement](https://www.reddit.com/help/useragreement)
- Respect rate limits and community guidelines

## 💡 Tips for Success

1. **Be Specific with Keywords**: Use long-tail keywords that indicate buying intent
2. **Monitor Niche Subreddits**: Smaller, focused communities often have better leads
3. **Respond Quickly**: Use real-time updates to be first to help
4. **Provide Value First**: Don't just pitch - offer genuine help
5. **Track Everything**: Use the lead management system to avoid duplicate outreach
6. **Adjust AI Threshold**: Lower it to see more leads, raise it for quality over quantity

## 🎓 Use Cases Beyond Interview Prep

- SaaS lead generation
- Product validation
- Market research
- Customer discovery
- Competitive analysis
- Content ideas
- Pain point identification

Happy lead hunting! 🎯
