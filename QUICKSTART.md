# 🎯 Quick Start - Reddit Lead Finder

## One-Command Setup

```bash
# 1. Install everything
npm run install-all

# 2. Create .env file and add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Run the app
npm run dev
```

## Get Gemini API Key (Free)

https://aistudio.google.com/app/apikey

## Access Dashboard

http://localhost:3000

## What It Does

1. ⏰ **Auto-searches Reddit** every 30 minutes for configured keywords
2. 🤖 **AI analyzes** each post to score lead quality (0-100)
3. 📊 **Dashboard updates** in real-time when new leads are found
4. ✅ **Track leads** from New → Contacted → Interested → Converted

## File You Need to Edit

`config.json` - Configure what to search for:

```json
{
  "monitoringKeywords": ["your", "keywords"],
  "monitoringSubreddits": ["your", "subreddits"],
  "monitoringInterval": "*/30 * * * *",
  "minScoreThreshold": 60
}
```

## Common Commands

```bash
# Development (both backend + frontend)
npm run dev

# Production (backend only)
npm start

# Backend logs show search activity
# Frontend at http://localhost:3000
# Backend API at http://localhost:3001
```

## Lead Flow

```
Reddit Post Found
    ↓
AI Analysis (0-100 score)
    ↓
If score ≥ 60: Save to database
    ↓
Real-time update to dashboard
    ↓
You reach out
    ↓
Track status: New → Contacted → Interested → Converted
```

## Troubleshooting

| Issue              | Solution                               |
| ------------------ | -------------------------------------- |
| No leads appearing | Click "Manual Search" button           |
| AI disabled        | Add `GEMINI_API_KEY` to `.env`         |
| WebSocket error    | Restart backend server                 |
| No new posts       | Already analyzed - wait for next cycle |

## Customization

**For different products:** Edit these files:

- `config.json` - Keywords and subreddits
- `geminiService.js` - AI analysis prompt (line ~40)
- `client/src/App.js` - Dashboard title/branding

## Architecture

```
┌─────────────┐
│   React     │ ← You see this (Dashboard)
│  Dashboard  │
└──────┬──────┘
       │ WebSocket (real-time updates)
┌──────┴──────┐
│   Node.js   │ ← Runs searches automatically
│   Backend   │
└──┬──────┬───┘
   │      │
Reddit  Gemini AI
```

## Monitoring Interval Options

```javascript
"*/15 * * * *"; // Every 15 minutes
"*/30 * * * *"; // Every 30 minutes (default)
"0 * * * *"; // Every hour
"0 */6 * * *"; // Every 6 hours
"0 9 * * *"; // Daily at 9 AM
```

## Full Documentation

- **README-NEW.md** - Complete guide
- **SETUP.md** - Detailed setup instructions
- **config.json** - Configuration options

---

**That's it!** The app will find leads for you automatically. Just keep it running and check the dashboard. 🎯
