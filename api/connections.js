// Shared storage for the connection graph.
//
// Uses the Upstash Redis REST API. Vercel injects KV_REST_API_URL and
// KV_REST_API_TOKEN automatically once you add the "Upstash for Redis"
// storage integration to this project (Project Settings -> Storage).
// (Also accepts UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, the
// names used if you connect an Upstash database directly instead.)

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'connections';

const REGULAR_PASSWORD = process.env.APP_PASSWORD || 'password';
const ADMIN_PASSWORD = process.env.APP_ADMIN_PASSWORD || 'adminpassword';

async function redisCommand(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Redis error ${res.status}: ${text}`);
  }
  return res.json();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-password');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    res.status(500).json({
      error: 'Missing KV_REST_API_URL / KV_REST_API_TOKEN. Add the "Upstash for Redis" storage integration to this Vercel project (Storage tab), then redeploy.',
    });
    return;
  }

  const pw = req.headers['x-app-password'];
  const isAdmin = !!pw && pw === ADMIN_PASSWORD;
  const isViewer = isAdmin || (!!pw && pw === REGULAR_PASSWORD);

  try {
    if (req.method === 'GET') {
      if (!isViewer) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { result } = await redisCommand(['GET', KEY]);
      const edges = result ? JSON.parse(result) : [];
      res.status(200).json({ edges });
      return;
    }

    if (req.method === 'POST') {
      if (!isAdmin) {
        res.status(403).json({ error: 'Admin password required to edit.' });
        return;
      }
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = null; }
      }
      const edges = body && Array.isArray(body.edges) ? body.edges : null;
      if (!edges) {
        res.status(400).json({ error: 'Expected JSON body { "edges": [[a,b], ...] }' });
        return;
      }

      const clean = edges
        .filter(e => Array.isArray(e) && e.length >= 2 && typeof e[0] === 'string' && typeof e[1] === 'string')
        .map(e => [e[0].trim(), e[1].trim()])
        .filter(e => e[0] && e[1]);

      await redisCommand(['SET', KEY, JSON.stringify(clean)]);
      res.status(200).json({ edges: clean });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unknown server error' });
  }
};
