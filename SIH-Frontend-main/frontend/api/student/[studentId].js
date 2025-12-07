// Vercel Serverless Function: Student Data Proxy
// This function proxies student data requests to your backend service

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const { studentId } = req.query;
    
    const response = await fetch(`${backendUrl}/api/student/${studentId}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Student Data Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch student data',
      message: error.message 
    });
  }
}
