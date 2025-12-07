# Vercel Deployment Fix: Serverless API Routes

## ✅ What Was Fixed

Your 404 errors were caused by the frontend trying to call `/api/*` routes that didn't exist on Vercel. This update implements **Vercel serverless functions** to proxy all API calls to your backend service.

## 📁 New File Structure

```
frontend/
├── api/                          ← NEW: Vercel serverless functions
│   ├── ai/
│   │   ├── chat.js              ← /api/ai/chat (proxy)
│   │   └── transcribe.js         ← /api/ai/transcribe (proxy)
│   └── student/
│       ├── [studentId].js        ← /api/student/:id (proxy)
│       └── realtime-session.js   ← /api/student/realtime-session (proxy)
├── vercel.json                   ← NEW: Vercel configuration
└── src/
    └── components/
        └── dashboard/
            └── StudentDashboard.jsx  ← UPDATED: Use /api routes
```

## 🔄 How It Works

```
Frontend Request
  ↓
Vercel Serverless Function (/api/*)
  ↓
Proxies to Backend Service (BACKEND_URL env var)
  ↓
Backend Response
  ↓
Frontend
```

## 🚀 Deployment Steps

### 1. **Set Environment Variable on Vercel**

In your Vercel Dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add new variable:
   - **Name:** `BACKEND_URL`
   - **Value:** Your backend URL (e.g., `https://your-backend.render.com`)
   - **Environments:** Select all (Production, Preview, Development)

```
BACKEND_URL = https://your-backend-service.render.com
```

### 2. **Redeploy on Vercel**

The serverless functions will now be available:
- `https://your-vercel-app.vercel.app/api/ai/chat`
- `https://your-vercel-app.vercel.app/api/ai/transcribe`
- `https://your-vercel-app.vercel.app/api/student/realtime-session`
- `https://your-vercel-app.vercel.app/api/student/:id`

### 3. **Verify API Routes Work Locally**

```bash
cd frontend
npm install
npm run build
npm run preview
```

Then test an API call:
```bash
curl -X POST http://localhost:4173/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## 🔐 Security Notes

✅ **What's Protected:**
- API keys are NOT in frontend code
- Sensitive endpoints hidden from browser
- All API calls go through serverless proxies
- Backend URL can be changed via environment variables

⚠️ **What You Need:**
1. Backend service running at `BACKEND_URL`
2. Backend must implement:
   - `POST /api/ai/chat`
   - `POST /api/ai/transcribe`
   - `POST /api/student/realtime-session`
   - `GET/POST /api/student/:id`

## 📋 Backend Requirements

Your backend service must handle these requests:

### `POST /api/ai/chat`
```javascript
{
  "message": "user message"
}
```
Response: `{ "text": "bot response" }`

### `POST /api/ai/transcribe`
```
FormData with "file" field containing audio blob
```
Response: `{ "text": "transcribed text" }`

### `POST /api/student/realtime-session`
```javascript
{}
```
Response: `{ "data": { "client_secret": "..." } }`

### `GET /api/student/:id`
Response: `{ "name": "...", "data": {...} }`

## 🐛 Troubleshooting

### Still Getting 404?

**Check 1:** Is `BACKEND_URL` set on Vercel?
```bash
# View environment variables
vercel env ls
```

**Check 2:** Is your backend running?
```bash
# Test backend endpoint
curl https://your-backend.render.com/api/ai/chat
```

**Check 3:** Is CORS enabled on backend?
- Backend must allow requests from Vercel domain
- Add to backend CORS config:
```javascript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

### 500 Error on /api/*?

Check serverless function logs:
1. Go to Vercel Dashboard → Deployments
2. Click latest deployment
3. View Function Logs for `/api/ai/chat` etc.
4. See what error the proxy is returning

## 🔄 Git Workflow

1. Commit the changes:
```bash
cd frontend
git add -A
git commit -m "Add Vercel serverless API proxies"
git push
```

2. Vercel will auto-deploy
3. Set environment variables on Vercel dashboard
4. Redeploy to apply env vars

## 📚 Related Files

- `BACKEND_PROXY_SETUP.md` - Backend implementation examples
- `DEPLOYMENT_GUIDE.md` - Full platform deployment guide
- `vercel.json` - Vercel configuration

## ✨ Next Steps

1. ✅ Push these changes to GitHub
2. ✅ Redeploy on Vercel
3. ✅ Add `BACKEND_URL` environment variable
4. ✅ Test `/api/ai/chat` endpoint
5. ✅ Verify frontend can reach backend

Your 404 errors should now be resolved! 🎉
