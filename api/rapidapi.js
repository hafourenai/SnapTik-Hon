export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, quality } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  const host = process.env.RAPID_API_HOST;
  const key = process.env.RAPID_API_KEY;
  const endpoint = process.env.RAPID_API_ENDPOINT;

  if (!host || !key || !endpoint) {
    return res.status(500).json({ error: 'API not configured. Set RAPID_API_HOST, RAPID_API_KEY, and RAPID_API_ENDPOINT in Vercel environment variables.' });
  }

  try {
    const apiUrl = `${endpoint}?url=${encodeURIComponent(url)}${quality ? `&quality=${quality}` : ''}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': key,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ error: 'Quota API habis, coba lagi nanti' });
      }
      if (response.status === 401) {
        return res.status(401).json({ error: 'API key tidak valid' });
      }
      return res.status(response.status).json({ error: `API error: ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
