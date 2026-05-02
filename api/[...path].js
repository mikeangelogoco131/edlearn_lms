const DEFAULT_BACKEND_BASE = 'https://edlearnlms-production.up.railway.app';

function getBackendBaseUrl() {
  const configured = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || DEFAULT_BACKEND_BASE;
  return configured.replace(/\/$/, '');
}

function buildTargetUrl(requestUrl) {
  const incoming = new URL(requestUrl);
  const target = new URL(getBackendBaseUrl());
  const apiPath = incoming.pathname.replace(/^\/api/, '/api');
  target.pathname = apiPath;
  target.search = incoming.search;
  return target.toString();
}

module.exports = async (req, res) => {
  try {
    const targetUrl = buildTargetUrl(req.url);
    const method = req.method || 'GET';

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value) continue;
      const lower = key.toLowerCase();
      if (['host', 'connection', 'content-length'].includes(lower)) continue;
      headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }

    const hasBody = !['GET', 'HEAD'].includes(method.toUpperCase());
    const body = hasBody ? await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    }) : undefined;

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'manual',
    });

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(key, value);
    });

    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      message: 'Proxy request failed',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
};
