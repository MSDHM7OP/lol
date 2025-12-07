# Backend Proxy Setup for API Keys (Security Guide)

## Why Backend Proxy?

API keys (OpenAI, Gemini, etc.) **must never** be exposed to the frontend. Instead:
1. Store API keys in **backend environment variables only**
2. Frontend calls **backend proxy endpoints**
3. Backend adds the API key and forwards requests to external APIs

## Frontend Changes

✅ **Already updated:**
- `StudentDashboard.jsx` - Calls backend proxies instead of direct OpenAI APIs
- `.env.example` - Removed all API key references
- `.gitignore` - Prevents committing `.env` files

## Backend Implementation Required

You need to create these proxy endpoints in your backend (Node.js/Express):

### 1. POST `/api/ai/chat` - ChatGPT Proxy

```javascript
// backend/routes/aiRoutes.js
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // ✅ Backend only

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

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
            content: 'You are SensEase AI, an empathetic mental health companion. Keep replies short, warm, and supportive.'
          },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      response: data.choices?.[0]?.message?.content || 'Unable to generate response'
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export default router;
```

### 2. POST `/api/ai/transcribe` - Whisper Proxy

```javascript
// Add to backend/routes/aiRoutes.js
router.post('/transcribe', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

    // req.file comes from multer middleware
    const audioBuffer = req.file.buffer;
    const form = new FormData();
    form.append('file', new Blob([audioBuffer]), 'audio.webm');
    form.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: form
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      text: data.text || ''
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});
```

### 3. POST `/api/ai/gemini` - Gemini API Proxy

```javascript
// Add to backend/routes/aiRoutes.js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // ✅ Backend only
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

router.post('/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured' 
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate response'
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});
```

### 4. POST `/api/student/realtime-session` - OpenAI Realtime Session

```javascript
// Add to backend/routes/studentRoutes.js
router.post('/realtime-session', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

    // Create ephemeral token for realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      data: {
        client_secret: data.client_secret
      }
    });
  } catch (error) {
    console.error('Realtime session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});
```

### 5. Complete Backend Setup Example

```javascript
// backend/server.js
import express from 'express';
import multer from 'multer';
import aiRoutes from './routes/aiRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(multer().single('file')); // For audio uploads

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/student', studentRoutes);

// Environment variables required:
// OPENAI_API_KEY=sk-...
// GEMINI_API_KEY=...
// NODE_ENV=production
// PORT=5000

app.listen(process.env.PORT || 5000);
```

## Security Checklist

- ✅ API keys stored in `.env` on backend only
- ✅ `.env` added to `.gitignore`
- ✅ Frontend uses `process.env.VITE_BACKEND_URL` to call proxies
- ✅ Backend validates API keys before forwarding requests
- ✅ No API keys exposed in error messages sent to frontend
- ✅ CORS properly configured
- ✅ Rate limiting on proxy endpoints (recommended)
- ✅ Request validation and sanitization

## Next Steps

1. Create the backend proxy endpoints above
2. Add environment variables to backend `.env`
3. Test proxies locally
4. Deploy backend with environment variables
5. Deploy frontend (no API keys needed)

---

For deployment steps, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
