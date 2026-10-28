import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { handleQuestion } from '../server/handler.js';
import healthHandler from '../api/health.js';

const root = resolve(import.meta.dirname, '..');
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const path = new URL(req.url, 'http://local').pathname;
    if (path === '/api/tanya' && req.method === 'POST') {
      if (!String(req.headers['content-type']).startsWith('application/json')) {
        res.writeHead(415).end();
        return;
      }
      let text = '';
      for await (const chunk of req) {
        text += chunk;
        if (Buffer.byteLength(text) > 24000) {
          res.writeHead(413).end();
          return;
        }
      }
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        res.writeHead(400).end();
        return;
      }
      const result = await handleQuestion(body, { ip: req.socket.remoteAddress });
      res.writeHead(result.code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(result.body));
      return;
    }
    if (path === '/api/health' && req.method === 'GET') {
      const mockRes = {
        setHeader(k, v) { res.setHeader(k, v); },
        status(code) {
          return {
            json(data) {
              res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(data));
            },
          };
        },
      };
      return healthHandler(req, mockRes);
    }
    if (req.method !== 'GET') {
      res.writeHead(405).end();
      return;
    }
    const file = resolve(root, '.' + decodeURIComponent(path === '/' ? '/index.html' : path));
    const rel = file.slice(root.length + 1);
    if (!file.startsWith(root + sep) || !(rel === 'index.html' || ['src/', 'data/', 'assets/', 'docs/'].some(p => rel.startsWith(p)))) {
      res.writeHead(404).end();
      return;
    }
    const b = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(b);
  } catch {
    res.writeHead(404).end();
  }
}).listen(Number(process.env.PORT) || 5173, '0.0.0.0', () => {
  const port = process.env.PORT || 5173;
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.ANTHROPIC_API_KEY);
  console.log(`Transkeu.ID: http://localhost:${port} (AI: ${hasKey ? 'aktif' : 'Mode Dasar (kunci API belum diisi)'})`);
});
