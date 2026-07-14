#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function walk(directory) {
  const absolute = resolve(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(absolute, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relative(root, path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function assertInsidePlugin(pluginRoot, candidate) {
  const rel = relative(pluginRoot, candidate);
  assert(rel && !rel.startsWith(`..${sep}`) && rel !== '..', `path escapes plugin root: ${candidate}`);
}

const marketplace = await readJson('.agents/plugins/marketplace.json');
assert(marketplace.name === 'ipzitalk', 'unexpected marketplace name');
assert(marketplace.interface?.displayName === 'Ipzi Talk', 'unexpected marketplace display name');

const expectedEntries = new Map([
  ['ipzitalk', 'ON_USE'],
  ['ipzitalk-remote', 'ON_USE'],
]);
assert(marketplace.plugins?.length === expectedEntries.size, 'unexpected canary plugin count');

for (const entry of marketplace.plugins) {
  assert(expectedEntries.get(entry.name) === entry.policy?.authentication, `unexpected auth policy: ${entry.name}`);
  assert(entry.policy?.installation === 'AVAILABLE', `unexpected install policy: ${entry.name}`);
  assert(entry.source?.source === 'local', `unexpected source type: ${entry.name}`);
  assert(entry.source?.path === `./plugins/${entry.name}`, `unexpected source path: ${entry.name}`);

  const pluginRoot = resolve(root, 'plugins', entry.name);
  const manifestPath = resolve(pluginRoot, '.codex-plugin', 'plugin.json');
  assertInsidePlugin(pluginRoot, manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert(manifest.name === entry.name, `manifest name mismatch: ${entry.name}`);
  assert(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version), `invalid version: ${entry.name}`);
  assert(!JSON.stringify(manifest).includes('[TODO:'), `placeholder in manifest: ${entry.name}`);
}

const launcher = await readJson('plugins/ipzitalk/.codex-plugin/plugin.json');
assert(launcher.skills === './skills/', 'launcher must expose setup skill');
assert(!('mcpServers' in launcher), 'launcher must not expose an MCP server');

const remote = await readJson('plugins/ipzitalk-remote/.codex-plugin/plugin.json');
assert(!('skills' in remote), 'canary remote payload must contain zero skills');
assert(remote.mcpServers === './.mcp.json', 'remote companion path mismatch');

const remoteMcp = await readJson('plugins/ipzitalk-remote/.mcp.json');
assert(Object.keys(remoteMcp.mcpServers ?? {}).join(',') === 'ipzitalk', 'unexpected remote MCP server IDs');
assert(remoteMcp.mcpServers.ipzitalk.type === 'http', 'remote MCP must use HTTP');
assert(remoteMcp.mcpServers.ipzitalk.url === 'https://ipzi-talk.synergylabs.kr/mcp', 'remote MCP URL mismatch');

const sourceLock = await readJson('source-lock.json');
assert(sourceLock.sources.skills.commit === null, 'canary skill lock must be empty');
assert(sourceLock.sources.skills.allowlist.length === 0, 'canary skill allowlist must be empty');

const scannedFiles = [
  ...(await walk('plugins')),
  resolve(root, '.agents/plugins/marketplace.json'),
  resolve(root, 'source-lock.json'),
];
for (const file of scannedFiles) {
  const info = await stat(file);
  if (info.size > 2_000_000) continue;
  const text = await readFile(file, 'utf8');
  assert(!text.includes('/Users/'), `local absolute path found: ${relative(root, file)}`);
  assert(!text.includes('mcp.synergylabs.kr'), `legacy MCP URL found: ${relative(root, file)}`);
  assert(!text.includes('[TODO:'), `placeholder found: ${relative(root, file)}`);
  assert(!/(client_secret|serviceKey|REST_API_KEY)\s*[:=]\s*["'][^<${][^"']+/i.test(text), `possible secret found: ${relative(root, file)}`);
}

console.log('Ipzi Talk package validation passed.');
