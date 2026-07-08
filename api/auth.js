// Checks a submitted password and reports which role it grants.
// Change the passwords by setting APP_PASSWORD / APP_ADMIN_PASSWORD in
// Vercel's Environment Variables — otherwise these defaults apply.

const REGULAR_PASSWORD = process.env.APP_PASSWORD || 'password';
const ADMIN_PASSWORD = process.env.APP_ADMIN_PASSWORD || 'adminpassword';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const password = body && typeof body.password === 'string' ? body.password : '';
  const mode = body && body.mode === 'admin' ? 'admin' : 'user';

  if (mode === 'admin') {
    if (password && password === ADMIN_PASSWORD) {
      res.status(200).json({ role: 'admin' });
      return;
    }
    res.status(401).json({ error: 'Incorrect admin password' });
    return;
  }

  if (password && password === REGULAR_PASSWORD) {
    res.status(200).json({ role: 'user' });
    return;
  }
  res.status(401).json({ error: 'Incorrect password' });
};
