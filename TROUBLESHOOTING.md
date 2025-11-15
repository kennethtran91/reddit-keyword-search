# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 🚨 "Module not found" errors

**Symptoms:**

```
Error: Cannot find module 'node-cron'
Error: Cannot find module 'ws'
```

**Solution:**

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install
```

---

### 🚨 "AI analysis disabled" / "AI not working"

**Symptoms:**

- Leads have score of 50
- Reasoning says "AI analysis disabled"
- Backend console shows warning about API key

**Solution:**

1. Check if `.env` file exists in root directory:

   ```bash
   ls -la .env
   ```

2. Create if missing:

   ```bash
   echo "GEMINI_API_KEY=your_key_here" > .env
   ```

3. Get API key from: https://aistudio.google.com/app/apikey

4. Verify `.env` format (no quotes around value):

   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key
   ```

5. Restart the server:
   ```bash
   # Stop with Ctrl+C
   npm start
   ```

---

### 🚨 No leads appearing in dashboard

**Possible Causes:**

#### 1. No posts found matching keywords

**Check:**

- Backend console logs show "No posts found for 'keyword'"
- Try different keywords or subreddits

**Solution:**

```bash
# Edit config.json
# Add broader keywords or different subreddits
```

#### 2. All posts already in database

**Check:**

- Backend console: "All posts already in database"
- System only analyzes NEW posts

**Solution:**

- Wait for next scheduled search (30 min by default)
- Or trigger manual search from dashboard
- Or delete database to start fresh:
  ```bash
  rm reddit_leads.db
  npm start
  ```

#### 3. AI scores below threshold

**Check:**

- Backend console shows scores like "Score: 45"
- But minimum threshold is 60

**Solution:**

```json
// config.json
{
  "minScoreThreshold": 40 // Lower threshold
}
```

#### 4. Search hasn't run yet

**Check:**

- Just started the app
- Monitoring service starting up

**Solution:**

- Click "Manual Search" button in dashboard
- Or wait a few minutes for initial search to complete

---

### 🚨 WebSocket connection errors

**Symptoms:**

- Dashboard doesn't update automatically
- Browser console: "WebSocket connection failed"
- "WebSocket disconnected" message

**Causes & Solutions:**

#### Backend not running

```bash
# Check if server is running
curl http://localhost:3001/api/health

# If not, start it
npm start
```

#### Wrong WebSocket URL

```bash
# Check client/.env
cat client/.env

# Should show:
REACT_APP_WS_URL=ws://localhost:3001

# Restart frontend after changes
cd client
npm start
```

#### Port conflict

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill the process or use different port
# Edit .env: PORT=3002
```

---

### 🚨 Frontend won't start

**Symptoms:**

```
npm ERR! missing script: start
```

**Solution:**

```bash
# Make sure you're in the client directory
cd client
npm install
npm start
```

---

### 🚨 "EADDRINUSE" - Port already in use

**Symptoms:**

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**

Find and kill the process:

```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Or use different port in .env
PORT=3002
```

---

### 🚨 Tailwind styles not working

**Symptoms:**

- Dashboard looks plain/unstyled
- No colors or modern design

**Solution:**

1. Verify Tailwind is installed:

   ```bash
   cd client
   npm list tailwindcss
   ```

2. Check `client/src/index.css` has directives:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. Restart development server:
   ```bash
   npm start
   ```

---

### 🚨 Database errors

**Symptoms:**

```
Error: SQLITE_ERROR: no such table: posts
```

**Solution:**

Delete and recreate database:

```bash
rm reddit_leads.db
npm start
# Database will be recreated automatically
```

---

### 🚨 Rate limit errors from Gemini

**Symptoms:**

- Backend console: "429 Too Many Requests"
- Some posts not analyzed

**Understanding:**

- Free tier: 15 requests/minute
- App waits 2.1 seconds between requests (~28 RPM)

**Solution:**

1. Reduce number of posts per search:

   ```json
   // config.json
   {
     "defaultLimit": 10 // Was 25
   }
   ```

2. Reduce keywords/subreddits:

   ```json
   // config.json
   {
     "monitoringKeywords": ["interview prep"], // Just 1
     "monitoringSubreddits": ["cscareerquestions"] // Just 1
   }
   ```

3. Or get paid Gemini tier (60 RPM)

---

### 🚨 Search takes forever

**Symptoms:**

- Manual search button clicked
- Nothing happens for minutes

**Explanation:**

- With 5 keywords × 5 subreddits × 25 posts = 625 potential posts
- At 2 seconds per AI analysis = 20+ minutes
- This is normal!

**Solutions:**

1. **Reduce scope** in `config.json`:

   ```json
   {
     "monitoringKeywords": ["interview prep", "mock interview"],
     "monitoringSubreddits": ["cscareerquestions", "jobs"],
     "defaultLimit": 10
   }
   ```

2. **Watch backend console** for progress:

   ```
   Analyzing post 5/20...
   ✨ Good lead found! Score: 85
   ```

3. **Be patient** - quality analysis takes time!

---

### 🚨 "No response from server"

**Symptoms:**

- Dashboard shows error messages
- API calls fail

**Solution:**

1. Check backend is running:

   ```bash
   curl http://localhost:3001/api/health
   ```

2. Check CORS is enabled:

   ```javascript
   // server-new.js should have:
   app.use(cors());
   ```

3. Verify API URL in frontend:
   ```bash
   cat client/.env
   # Should show: REACT_APP_API_URL=http://localhost:3001
   ```

---

### 🚨 Monitoring service not starting

**Symptoms:**

- Backend console: No "Monitoring service started" message
- Status shows "isRunning: false"

**Check:**

1. Look for errors in `config.json`:

   ```bash
   # Validate JSON syntax
   cat config.json | python -m json.tool
   ```

2. Check file exists:

   ```bash
   ls -la monitoringService.js
   ```

3. Check for JavaScript errors:
   ```bash
   npm start
   # Look for syntax errors in console
   ```

---

### 🚨 Dashboard shows old data

**Symptoms:**

- Lead statuses not updating
- Stats don't change

**Solutions:**

1. Hard refresh browser:

   - Chrome/Firefox: `Cmd/Ctrl + Shift + R`

2. Check WebSocket is connected:

   - Open browser console (F12)
   - Look for "WebSocket connected" message

3. Check backend is actually running:
   ```bash
   curl http://localhost:3001/api/stats
   ```

---

### 🚨 Can't update lead status

**Symptoms:**

- Click "Mark Contacted" button
- Nothing happens

**Check:**

1. Browser console for errors:

   ```
   Press F12 → Console tab
   Look for red error messages
   ```

2. Backend console for errors

3. Test API directly:
   ```bash
   curl -X PATCH http://localhost:3001/api/leads/t3_abc123 \
     -H "Content-Type: application/json" \
     -d '{"status":"contacted"}'
   ```

---

## 📊 Debugging Tips

### Enable Verbose Logging

**Backend:**

```javascript
// Add to server-new.js (top)
process.env.DEBUG = "*";
```

**Frontend:**

```javascript
// Add to App.js
console.log("Leads:", leads);
console.log("Stats:", stats);
```

### Check Database Contents

```bash
# Install sqlite3
brew install sqlite3  # macOS
sudo apt-get install sqlite3  # Linux

# Query database
sqlite3 reddit_leads.db

# In sqlite shell:
.tables                                    # Show tables
SELECT COUNT(*) FROM posts;                # Count posts
SELECT title, ai_score FROM posts LIMIT 5; # View posts
SELECT * FROM posts WHERE ai_score > 80;   # Good leads
.exit                                      # Exit
```

### Monitor Network Traffic

**Browser DevTools:**

1. Press F12
2. Go to Network tab
3. Filter by "WS" to see WebSocket
4. Filter by "Fetch/XHR" to see API calls

### Check Process Status

```bash
# List Node.js processes
ps aux | grep node

# Check port usage
lsof -i :3001
lsof -i :3000

# Check if services are responding
curl http://localhost:3001/api/health
curl http://localhost:3000
```

---

## 🆘 Still Having Issues?

### 1. Check all prerequisites:

- [ ] Node.js 14+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Dependencies installed (`npm install` and `cd client && npm install`)
- [ ] `.env` file exists with Gemini API key
- [ ] `config.json` has valid JSON

### 2. Try a clean restart:

```bash
# Stop all processes (Ctrl+C)

# Clean and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install && cd ..

# Start fresh
npm run dev
```

### 3. Check the docs:

- `QUICKSTART.md` - Quick setup
- `SETUP.md` - Detailed setup
- `README-NEW.md` - Full documentation
- `ARCHITECTURE.md` - How it works

### 4. Reset everything:

```bash
# Nuclear option: start from scratch
rm -rf node_modules client/node_modules
rm reddit_leads.db
rm .env

# Reinstall
npm run install-all

# Create .env
echo "GEMINI_API_KEY=your_key" > .env

# Start
npm run dev
```

---

## 💡 Pro Tips

1. **Keep backend console visible** - It shows exactly what's happening
2. **Use manual search first** - Test before relying on automated searches
3. **Start with small scope** - 1-2 keywords in 1-2 subreddits
4. **Be patient** - AI analysis takes time (2 seconds per post)
5. **Check logs regularly** - Errors appear in console, not dashboard

---

## 📞 Last Resort

If nothing works:

1. Copy error messages from console
2. Check file versions: `npm list`
3. Check Node version: `node --version`
4. Describe what you did step-by-step
5. Share relevant console output

Most issues are:

- ✅ Missing dependencies → Run `npm install`
- ✅ Wrong directory → Check `pwd`, should be in project root
- ✅ Missing API key → Add to `.env`
- ✅ Port conflicts → Use different port
- ✅ Syntax errors in config → Validate JSON

Good luck! 🎯
