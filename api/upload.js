/*
 * api/upload.js — Vercel serverless function.
 * Uploads an image (base64) to the site's GitHub repo under assets/uploads/.
 * Keeps the GitHub token server-side so the admin browser never needs it.
 */
var REPO = 'anjanavcare-maker/anjana-dv-portfolio';
var BRANCH = 'main';

function ghHeaders() {
  return {
    Authorization: 'Bearer ' + (process.env.GH_TOKEN || ''),
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if ((req.headers['x-admin-key'] || '') !== (process.env.ADMIN_KEY || '')) {
    return res.status(403).json({ error: 'bad key' });
  }
  var path = String((req.body && req.body.path) || '');
  if (!/^assets\/uploads\/[A-Za-z0-9._-]+$/.test(path)) {
    return res.status(400).json({ error: 'bad path' });
  }
  var content = String((req.body && req.body.content) || '');
  var message = String((req.body && req.body.message) || 'Upload image from visual editor');
  if (!content) return res.status(400).json({ error: 'missing content' });

  var url = 'https://api.github.com/repos/' + REPO + '/contents/' + path;

  async function putWithSha() {
    var sha = null;
    try {
      var g = await fetch(url + '?ref=' + BRANCH, { headers: ghHeaders() });
      if (g.ok) {
        var meta = await g.json();
        if (meta && meta.sha) sha = meta.sha;
      }
    } catch (e) { /* file probably doesn't exist yet */ }
    var body = { message: message, content: content, branch: BRANCH };
    if (sha) body.sha = sha;
    return fetch(url, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
  }

  try {
    var r = await putWithSha();
    var j = await r.json().catch(function () { return {}; });
    res.status(r.status).json(j);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};