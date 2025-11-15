# 📁 Project Structure

## Root Directory

```
reddit-keyword-search/
├── 📄 Core Backend Files
│   ├── server.js              # Express server with WebSocket
│   ├── monitoringService.js   # Automated Reddit monitoring
│   ├── redditApi.js           # Reddit API client (public JSON)
│   ├── geminiService.js       # Gemini AI integration
│   └── db.js                  # SQLite database operations
│
├── ⚙️ Configuration
│   ├── config.json            # Monitoring configuration
│   ├── .env                   # Environment variables (API keys)
│   ├── .env.example           # Template for .env
│   ├── package.json           # Backend dependencies
│   └── .gitignore             # Git ignore rules
│
├── 📊 Data
│   └── reddit_leads.db        # SQLite database (auto-created)
│
├── 📖 Documentation
│   ├── README.md              # Main documentation
│   ├── QUICKSTART.md          # 5-minute setup guide
│   ├── SETUP.md               # Detailed setup instructions
│   ├── ARCHITECTURE.md        # System design & diagrams
│   ├── CHANGES.md             # What changed in rewrite
│   └── TROUBLESHOOTING.md     # Common issues & solutions
│
└── 🎨 Frontend (React App)
    └── client/
        ├── src/
        │   ├── App.js         # Main React component
        │   ├── index.js       # React entry point
        │   └── index.css      # Tailwind CSS styles
        ├── public/
        │   ├── index.html     # HTML template
        │   ├── favicon.ico
        │   └── manifest.json
        ├── package.json       # Frontend dependencies
        ├── tailwind.config.js # Tailwind configuration
        ├── postcss.config.js  # PostCSS configuration
        └── .env               # Frontend environment variables
```

## File Count

- **Backend Files**: 5 core files
- **Configuration**: 4 files
- **Documentation**: 6 guides
- **Frontend**: React app with 3 main files
- **Total**: Clean, organized structure

## Key Files Explained

### Backend Core

| File                   | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `server.js`            | Main Express server, REST API, WebSocket server |
| `monitoringService.js` | Cron-based automated Reddit monitoring          |
| `redditApi.js`         | Reddit public JSON API client (no auth)         |
| `geminiService.js`     | AI post analysis with Gemini                    |
| `db.js`                | SQLite database with lead management            |

### Configuration

| File           | Purpose                                    |
| -------------- | ------------------------------------------ |
| `config.json`  | Keywords, subreddits, schedule, thresholds |
| `.env`         | API keys and port configuration            |
| `package.json` | Dependencies and npm scripts               |

### Frontend

| File                   | Purpose                               |
| ---------------------- | ------------------------------------- |
| `client/src/App.js`    | Complete dashboard UI component       |
| `client/src/index.js`  | React app initialization              |
| `client/src/index.css` | Tailwind directives and global styles |

### Documentation

| File                 | For                       |
| -------------------- | ------------------------- |
| `README.md`          | Complete feature guide    |
| `QUICKSTART.md`      | Fast 5-minute setup       |
| `SETUP.md`           | Step-by-step installation |
| `ARCHITECTURE.md`    | System design & flow      |
| `CHANGES.md`         | Rewrite summary           |
| `TROUBLESHOOTING.md` | Debug guide               |

## Dependencies

### Backend (11 packages)

- express, cors, ws
- node-cron, dotenv
- better-sqlite3, axios
- @google/genai
- concurrently (dev)

### Frontend (React app)

- react, react-dom
- tailwindcss, postcss, autoprefixer
- All standard Create React App dependencies

## What Was Removed

✅ **Old Files Deleted:**

- `public/` - Old vanilla JS frontend
  - `public/index.html`
  - `public/app.js`
  - `public/leads.js`
- `server.js` - Old server (replaced)
- `AI_SETUP.md` - Merged into SETUP.md
- `WORKFLOW.md` - Merged into README.md
- `README.md` - Replaced with comprehensive version
- `client/src/App.test.js` - Unused test file
- `client/src/setupTests.js` - Unused test file
- `client/src/reportWebVitals.js` - Unused performance file
- `client/src/App.css` - Replaced by Tailwind
- `client/src/logo.svg` - Unused logo

## Clean Structure Benefits

✅ **Organized** - Clear separation of concerns
✅ **Documented** - 6 guides covering everything
✅ **No Cruft** - Only files you need
✅ **Modern Stack** - React + Node.js + SQLite
✅ **Easy to Navigate** - Logical file structure

## Quick Navigation

**Starting the app?** → See `QUICKSTART.md`
**First time setup?** → See `SETUP.md`
**Understanding how it works?** → See `ARCHITECTURE.md`
**Having issues?** → See `TROUBLESHOOTING.md`
**Full documentation?** → See `README.md`
**What changed?** → See `CHANGES.md`

---

Everything is organized, documented, and ready to use! 🎯
