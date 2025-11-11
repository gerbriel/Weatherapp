#!/usr/bin/env node

// Simple server test script to verify MIME types and routing
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const BASE_PATH = '/Weatherapp';

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'font/eot'
};

const server = http.createServer((req, res) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  let pathname = url.parse(req.url).pathname;
  
  // Remove base path if present
  if (pathname.startsWith(BASE_PATH)) {
    pathname = pathname.substring(BASE_PATH.length) || '/';
  }
  
  // Default to index.html for SPA routing
  if (pathname === '/' || pathname === '/index.html') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, 'dist', pathname);
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  console.log(`${req.method} ${req.url} -> ${filePath} (${contentType})`);
  
  // Check if file exists
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If file not found, serve index.html for SPA routing
      if (err.code === 'ENOENT' && extname === '') {
        const indexPath = path.join(__dirname, 'dist', 'index.html');
        fs.readFile(indexPath, (indexErr, indexData) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(indexData);
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`📍 Base path: ${BASE_PATH}`);
  console.log(`🔧 MIME types configured for ES modules`);
  console.log(`🚀 Visit: http://localhost:${PORT}${BASE_PATH}/`);
});