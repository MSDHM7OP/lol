# Deployment Guide - Secure Environment Variables

## Overview

This guide covers deploying the SensEase project safely without exposing API keys. API keys are stored in **backend environment variables only** and accessed through secure proxy endpoints.

---

## Option 1: Render.com

### Frontend Deployment (Vite React App)

1. **Connect Repository**
   - New → Web Service
   - Connect GitHub repo
   - Branch: `main`

2. **Build Settings**
   ```
   Build Command: npm install && npm run build
   Start Command: npm run preview
   Environment: Node
   ```

3. **Environment Variables** (Frontend - Optional)
   ```
   VITE_BACKEND_URL=https://your-backend.onrender.com
   ```
   *Frontend needs NO API keys*

4. **Deploy**
   - Click Deploy
   - Frontend will be available at: `https://your-frontend.onrender.com`

### Backend Deployment (Node.js API)

1. **New Web Service**
   - Connect your backend repository
   - Branch: `main`

2. **Build Settings**
   ```
   Build Command: npm install
   Start Command: node server.js
   Environment: Node
   ```

3. **Environment Variables** (Backend - REQUIRED)
   ```
   OPENAI_API_KEY=sk-...                    # Your OpenAI key
   GEMINI_API_KEY=...                       # Your Gemini key
   DATABASE_URL=postgresql://...           # If needed
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.onrender.com
   ```

4. **Deploy**
   - Backend will be available at: `https://your-backend.onrender.com`

---

## Option 2: Railway.app

### Frontend Deployment

1. **New Project** → GitHub
   - Select frontend repository

2. **Configure**
   - Runtime: Node.js
   - Build: `npm run build`
   - Start: `npm run preview`

3. **Variables** (Optional)
   ```
   VITE_BACKEND_URL=${{ Railway['backend-service'].publicUrl }}
   ```

4. **Deploy**

### Backend Deployment

1. **New Service** → GitHub
   - Select backend repository

2. **Configure**
   - Runtime: Node.js
   - Build: `npm install`
   - Start: `node server.js`

3. **Variables** (REQUIRED)
   ```
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=...
   NODE_ENV=production
   ```

4. **Deploy**

---

## Option 3: Vercel (Frontend Only)

Vercel is best for frontend + serverless functions. Use it for frontend and create serverless proxy functions.

### Frontend Deployment

1. **Import Project**
   - Vercel Dashboard → Add New → Project
   - Select GitHub repo (frontend folder)

2. **Configure**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   ```
   VITE_BACKEND_URL=https://your-backend.com  # URL of deployed backend
   ```

4. **Deploy**

### Backend via Vercel Functions (Optional)

Create `/api` serverless functions:

```javascript
// api/ai/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are SensEase AI.'
          },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    res.status(200).json({
      response: data.choices?.[0]?.message?.content
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**Environment Variables** (in Vercel Project Settings)
```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

---

## Option 4: Netlify (Frontend Only)

### Frontend Deployment

1. **Connect Repository**
   - Netlify Dashboard → New site from Git
   - Select GitHub repo

2. **Build Settings**
   ```
   Build Command: npm run build
   Publish Directory: dist
   ```

3. **Environment Variables**
   ```
   VITE_BACKEND_URL=https://your-backend.com
   ```

4. **Deploy**

### Backend via Netlify Functions

Create `/netlify/functions` directory with serverless functions:

```javascript
// netlify/functions/chat.js
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { message } = JSON.parse(event.body);
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are SensEase AI.'
          },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({
        response: data.choices?.[0]?.message?.content
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
```

**Environment Variables** (Netlify Site Settings)
```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

---

## Environment Variables Checklist

### Frontend (.env.example - Can be public)
```
VITE_BACKEND_URL=http://localhost:5000
WDS_SOCKET_PORT=443
```

### Backend (.env - NEVER commit)
```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend.com
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

---

## Security Best Practices

✅ **DO:**
- Store API keys in backend `.env` only
- Use `process.env` (Node.js) to read keys
- Never commit `.env` to git
- Add `.env` to `.gitignore`
- Use HTTPS for all requests
- Validate input on backend
- Rate limit API endpoints
- Rotate API keys regularly

❌ **DON'T:**
- Hardcode API keys in source code
- Commit `.env` files to git
- Expose API keys in error messages
- Use same key for dev/prod
- Share API keys via Slack/email
- Keep old/unused API keys active

---

## Troubleshooting

### "API key not found" Error
- Verify environment variables are set in deployment platform
- Check variable names match exactly
- Restart the service after setting variables

### CORS Errors
- Ensure `CORS_ORIGIN` matches frontend URL
- Backend proxy should set proper CORS headers
- Test with `curl` from backend first

### Frontend Can't Connect to Backend
- Verify `VITE_BACKEND_URL` is set correctly
- Check backend is accessible from frontend URL
- Look for CORS headers in response

### 401 Unauthorized from OpenAI
- Verify API key is valid and not expired
- Check API key has required permissions
- Ensure key is for correct API (not organization key)

---

## Monitoring & Logs

### Render
- Dashboard → Service → Logs
- Filter by time or search for errors

### Railway
- Service → Logs tab
- Real-time log streaming

### Vercel
- Project Settings → Logs
- Function logs available in Deployments tab

### Netlify
- Site Settings → Functions
- Netlify Analytics for traffic

---

## Next Steps

1. Choose a deployment platform (Render recommended for full-stack)
2. Deploy backend first with API keys in environment
3. Deploy frontend with backend URL configured
4. Test all features end-to-end
5. Set up monitoring and alerts
6. Rotate API keys monthly

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [OpenAI API Guide](https://platform.openai.com/docs)
- [Google Gemini Documentation](https://ai.google.dev)

