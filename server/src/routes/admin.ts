import { Router, Request, Response } from 'express';
import { metricsStore } from '../services/metrics-store';

const router = Router();

// GET /api/admin/metrics
router.get('/metrics', (_req: Request, res: Response) => {
  res.json(metricsStore.getMetrics());
});

// GET /api/admin/logs?limit=100
router.get('/logs', (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 100, 1), 500);
  res.json(metricsStore.getActivityLog(limit));
});

// GET /api/admin/dashboard
router.get('/dashboard', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(dashboardHtml);
});

const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Heavenly Push — Admin Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0F0A1F;
    color: #F0EDFF;
    min-height: 100vh;
    padding: 24px;
  }
  h1 { font-size: 1.5rem; margin-bottom: 4px; }
  .subtitle { color: #A78BFA; font-size: 0.85rem; margin-bottom: 24px; }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .card {
    background: #1A1333;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #2D2250;
  }
  .card-label { font-size: 0.75rem; color: #A78BFA; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .card-value { font-size: 1.8rem; font-weight: 700; }
  .card-sub { font-size: 0.75rem; color: #8B7FC7; margin-top: 4px; }
  .sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }
  .section {
    background: #1A1333;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #2D2250;
  }
  .section h2 { font-size: 1rem; margin-bottom: 16px; color: #A78BFA; }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .bar-label { width: 100px; font-size: 0.85rem; text-align: right; }
  .bar-track { flex: 1; height: 24px; background: #2D2250; border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; background: #A78BFA; border-radius: 6px; transition: width 0.4s ease; min-width: 2px; }
  .bar-count { width: 50px; font-size: 0.85rem; }
  .list-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2D2250; font-size: 0.85rem; }
  .list-item:last-child { border-bottom: none; }
  .list-count { color: #A78BFA; font-weight: 600; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
  .badge-purple { background: #3B2D6B; color: #A78BFA; }
  .badge-red { background: #3B1A1A; color: #F87171; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  th { text-align: left; color: #A78BFA; padding: 10px 8px; border-bottom: 2px solid #2D2250; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 8px; border-bottom: 1px solid #1A1333; }
  .status-2 { color: #4ADE80; }
  .status-4, .status-5 { color: #F87171; }
  .log-section { background: #1A1333; border-radius: 12px; padding: 20px; border: 1px solid #2D2250; overflow-x: auto; }
  .log-section h2 { font-size: 1rem; margin-bottom: 16px; color: #A78BFA; }
  .refresh-note { font-size: 0.7rem; color: #5B5280; text-align: center; margin-top: 16px; }
  .empty { color: #5B5280; font-style: italic; font-size: 0.85rem; }
</style>
</head>
<body>
<h1>Heavenly Push Admin</h1>
<p class="subtitle">Server metrics &amp; activity log</p>

<div class="cards" id="cards">
  <div class="card"><div class="card-label">Total Requests</div><div class="card-value" id="c-requests">—</div></div>
  <div class="card"><div class="card-label">AI Calls</div><div class="card-value" id="c-ai">—</div></div>
  <div class="card"><div class="card-label">AI Errors</div><div class="card-value" id="c-errors">—</div><div class="card-sub" id="c-error-rate"></div></div>
  <div class="card"><div class="card-label">Avg Response</div><div class="card-value" id="c-avg">—</div><div class="card-sub">ms</div></div>
  <div class="card"><div class="card-label">Uptime</div><div class="card-value" id="c-uptime">—</div></div>
</div>

<div class="sections">
  <div class="section">
    <h2>AI Provider Usage</h2>
    <div id="provider-bars"><p class="empty">No AI calls yet</p></div>
    <div style="margin-top:12px">Fallback rate: <span class="badge badge-purple" id="fallback-badge">0%</span></div>
  </div>
  <div class="section">
    <h2>Popular Verses</h2>
    <div id="pop-verses"><p class="empty">No lookups yet</p></div>
  </div>
  <div class="section">
    <h2>Popular Questions</h2>
    <div id="pop-questions"><p class="empty">No questions yet</p></div>
  </div>
</div>

<div class="log-section">
  <h2>Activity Log</h2>
  <table>
    <thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th></tr></thead>
    <tbody id="log-body"><tr><td colspan="5" class="empty">Loading...</td></tr></tbody>
  </table>
</div>

<p class="refresh-note">Auto-refreshes every 30 seconds</p>

<script>
function fmt(n) { return n.toLocaleString(); }
function uptime(started) {
  const ms = Date.now() - new Date(started).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return h + 'h ' + rm + 'm';
  const d = Math.floor(h / 24);
  return d + 'd ' + (h % 24) + 'h';
}
function statusClass(code) {
  if (code >= 200 && code < 300) return 'status-2';
  if (code >= 400 && code < 500) return 'status-4';
  if (code >= 500) return 'status-5';
  return '';
}
function timeStr(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

async function refresh() {
  try {
    const [mRes, lRes] = await Promise.all([
      fetch('/api/admin/metrics'),
      fetch('/api/admin/logs?limit=100')
    ]);
    const metrics = await mRes.json();
    const logs = await lRes.json();

    document.getElementById('c-requests').textContent = fmt(metrics.totalRequests);
    document.getElementById('c-ai').textContent = fmt(metrics.totalAiCalls);
    document.getElementById('c-errors').textContent = fmt(metrics.totalAiErrors);
    const errRate = metrics.totalAiCalls > 0 ? ((metrics.totalAiErrors / metrics.totalAiCalls) * 100).toFixed(1) : '0.0';
    document.getElementById('c-error-rate').textContent = errRate + '% error rate';
    document.getElementById('c-avg').textContent = fmt(metrics.avgResponseTime);
    document.getElementById('c-uptime').textContent = uptime(metrics.startedAt);

    // Provider bars
    const providers = Object.entries(metrics.aiProviderCalls);
    const pDiv = document.getElementById('provider-bars');
    if (providers.length === 0) {
      pDiv.innerHTML = '<p class="empty">No AI calls yet</p>';
    } else {
      const maxVal = Math.max(...providers.map(p => p[1]));
      pDiv.innerHTML = providers.map(([name, count]) =>
        '<div class="bar-row"><div class="bar-label">' + name + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + ((count / maxVal) * 100) + '%"></div></div>' +
        '<div class="bar-count">' + count + '</div></div>'
      ).join('');
    }

    // Fallback
    const fbRate = metrics.totalAiCalls > 0 ? ((metrics.aiFallbackCount / metrics.totalAiCalls) * 100).toFixed(1) : '0.0';
    document.getElementById('fallback-badge').textContent = fbRate + '%';

    // Popular verses
    const vDiv = document.getElementById('pop-verses');
    const verses = metrics.popularVerses.slice(0, 10);
    vDiv.innerHTML = verses.length === 0 ? '<p class="empty">No lookups yet</p>' :
      verses.map(v => '<div class="list-item"><span>' + v.reference + '</span><span class="list-count">' + v.count + '</span></div>').join('');

    // Popular questions
    const qDiv = document.getElementById('pop-questions');
    const qs = metrics.popularQuestions.slice(0, 10);
    qDiv.innerHTML = qs.length === 0 ? '<p class="empty">No questions yet</p>' :
      qs.map(q => '<div class="list-item"><span>' + q.question + '</span><span class="list-count">' + q.count + '</span></div>').join('');

    // Activity log
    const tbody = document.getElementById('log-body');
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No activity yet</td></tr>';
    } else {
      tbody.innerHTML = logs.map(l =>
        '<tr><td>' + timeStr(l.timestamp) + '</td><td>' + l.method + '</td><td>' + l.path + '</td>' +
        '<td class="' + statusClass(l.status) + '">' + l.status + '</td><td>' + l.duration + 'ms</td></tr>'
      ).join('');
    }
  } catch (e) {
    console.error('Dashboard refresh failed:', e);
  }
}

refresh();
setInterval(refresh, 30000);
</script>
</body>
</html>`;

export { router as adminRouter };
