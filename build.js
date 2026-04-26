#!/usr/bin/env node
/**
 * build.js — converts _posts/news/*.md frontmatter → data/news.json
 * Run automatically by Netlify before each deployment (see netlify.toml).
 * Run locally:  node build.js
 */

'use strict';

var fs   = require('fs');
var path = require('path');

var POSTS_DIR   = path.join(__dirname, '_posts', 'news');
var OUTPUT_FILE = path.join(__dirname, 'data', 'news.json');

/* ---- Minimal YAML-frontmatter parser (no dependencies) ---- */
function parseFrontmatter(content) {
  var match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  var obj = {};
  match[1].split('\n').forEach(function (line) {
    var colon = line.indexOf(':');
    if (colon === -1) return;
    var key = line.slice(0, colon).trim();
    var val = line.slice(colon + 1).trim();
    // Strip surrounding quotes
    if ((val[0] === '"' && val[val.length - 1] === '"') ||
        (val[0] === "'" && val[val.length - 1] === "'")) {
      val = val.slice(1, -1);
    }
    obj[key] = val;
  });
  return obj;
}

/* ---- Ensure output dir exists ---- */
var dataDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

/* ---- Read posts ---- */
if (!fs.existsSync(POSTS_DIR)) {
  console.log('No _posts/news directory — writing empty news.json');
  fs.writeFileSync(OUTPUT_FILE, '[]', 'utf8');
  process.exit(0);
}

var files = fs.readdirSync(POSTS_DIR).filter(function (f) {
  return f.endsWith('.md');
});

var posts = files
  .map(function (file) {
    var raw  = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    var meta = parseFrontmatter(raw);
    return meta.title ? meta : null;
  })
  .filter(Boolean)
  .sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });

/* ---- Write JSON ---- */
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2), 'utf8');
console.log('Built ' + posts.length + ' news post(s) → data/news.json');
