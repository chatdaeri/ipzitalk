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
  ['ipzitalk-local', 'ON_USE'],
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
assert(remote.mcpServers === './.mcp.json', 'remote companion path mismatch');
assert(remote.skills === './skills/', 'remote payload must expose the locked skills');

const remoteMcp = await readJson('plugins/ipzitalk-remote/.mcp.json');
assert(Object.keys(remoteMcp.mcpServers ?? {}).join(',') === 'ipzitalk', 'unexpected remote MCP server IDs');
assert(remoteMcp.mcpServers.ipzitalk.type === 'http', 'remote MCP must use HTTP');
assert(remoteMcp.mcpServers.ipzitalk.url === 'https://ipzi-talk.synergylabs.kr/mcp', 'remote MCP URL mismatch');

const local = await readJson('plugins/ipzitalk-local/.codex-plugin/plugin.json');
assert(!('skills' in local), 'local payload must contain zero skills');
assert(local.mcpServers === './.mcp.json', 'local companion path mismatch');

const localMcp = await readJson('plugins/ipzitalk-local/.mcp.json');
assert(Object.keys(localMcp.mcpServers ?? {}).join(',') === 'ipzitalk-local', 'unexpected local MCP server IDs');
const localServer = localMcp.mcpServers['ipzitalk-local'];
assert(localServer.command === 'npx', 'local MCP command mismatch');
assert(JSON.stringify(localServer.args) === JSON.stringify(['-y', 'presale-mcp@0.1.0']), 'local MCP args mismatch');
const expectedEnvVars = [
  'KAKAO_REST_API_KEY',
  'NAVER_MAPS_CLIENT_ID',
  'NAVER_MAPS_CLIENT_SECRET',
  'DATA_GO_KR_SERVICE_KEY',
];
assert(JSON.stringify(localServer.env_vars) === JSON.stringify(expectedEnvVars), 'local MCP env_vars mismatch');
assert(!('env' in localServer), 'local MCP must not embed environment values');

const sourceLock = await readJson('source-lock.json');
assert(/^[0-9a-f]{40}$/.test(sourceLock.sources.skills.commit), 'skill commit must be a full SHA');
assert(sourceLock.sources.skills.availability === 'local-only', 'unpublished PoC skill lock must be marked local-only');
const lockedSkills = [...sourceLock.sources.skills.allowlist].sort();
assert(lockedSkills.length === 5, 'Remote PoC must contain exactly five skills');
const packagedSkills = (await readdir(resolve(root, 'plugins/ipzitalk-remote/skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert(packagedSkills.join('\n') === lockedSkills.join('\n'), 'packaged Remote skills do not match source lock');
for (const skill of packagedSkills) {
  const skillFiles = (await walk(`plugins/ipzitalk-remote/skills/${skill}`)).filter((file) => file.endsWith('.md'));
  const skillText = (await Promise.all(skillFiles.map((file) => readFile(file, 'utf8')))).join('\n');
  assert(skillText.includes('ipzitalk-remote'), `missing Remote provenance rule: ${skill}`);
  assert(skillText.includes('mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>'), `missing plugin namespace fallback: ${skill}`);
  assert(skillText.includes('presale-mcp'), `missing local provenance exclusion: ${skill}`);
}
assert(sourceLock.plugins.local?.id === 'ipzitalk-local', 'local plugin lock missing');
assert(/^[0-9a-f]{40}$/.test(sourceLock.sources.localMcp.commit), 'local MCP commit must be a full SHA');
assert(sourceLock.sources.localMcp.availability === 'local-only', 'unpublished local MCP lock must be marked local-only');
assert(sourceLock.sources.localMcp.toolsSnapshotSha256 === '08df02512148d67604a375c5fef689170e795093eeaf2fbe50dc5335a33f26e3', 'local tool snapshot mismatch');

const claudeMarketplace = await readJson('.claude-plugin/marketplace.json');
assert(claudeMarketplace.name === 'ipzitalk', 'unexpected Claude marketplace name');
assert(claudeMarketplace.plugins?.map((entry) => entry.name).join(',') === 'ipzitalk,ipzitalk-remote,ipzitalk-local', 'unexpected Claude marketplace entries');
for (const entry of claudeMarketplace.plugins) {
  assert(entry.source === `./plugins/${entry.name}`, `unexpected Claude source path: ${entry.name}`);
  assert(entry.version === sourceLock.plugins[entry.name === 'ipzitalk' ? 'launcher' : entry.name === 'ipzitalk-remote' ? 'remote' : 'local'].version, `Claude version mismatch: ${entry.name}`);
}

const claudeLauncher = await readJson('plugins/ipzitalk/.claude-plugin/plugin.json');
assert(claudeLauncher.skills === './skills/', 'Claude launcher must expose setup skill');
assert(!('mcpServers' in claudeLauncher), 'Claude launcher must not expose an MCP server');

const claudeRemote = await readJson('plugins/ipzitalk-remote/.claude-plugin/plugin.json');
assert(claudeRemote.skills === './skills/', 'Claude Remote must expose the locked skills');
assert(claudeRemote.mcpServers?.ipzitalk?.type === 'http', 'Claude Remote MCP must use HTTP');
assert(claudeRemote.mcpServers.ipzitalk.url === 'https://ipzi-talk.synergylabs.kr/mcp', 'Claude Remote URL mismatch');

const claudeLocal = await readJson('plugins/ipzitalk-local/.claude-plugin/plugin.json');
assert(!('skills' in claudeLocal), 'Claude local payload must contain zero skills');
assert(Object.keys(claudeLocal.userConfig ?? {}).join(',') === expectedEnvVars.join(','), 'Claude local userConfig keys mismatch');
for (const name of expectedEnvVars) {
  assert(claudeLocal.userConfig[name]?.type === 'string', `Claude userConfig type mismatch: ${name}`);
  assert(claudeLocal.userConfig[name]?.required === true, `Claude userConfig must be required: ${name}`);
  assert(claudeLocal.userConfig[name]?.sensitive === true, `Claude userConfig must be sensitive: ${name}`);
  assert(claudeLocal.mcpServers?.['ipzitalk-local']?.env?.[name] === `\${user_config.${name}}`, `Claude userConfig interpolation mismatch: ${name}`);
}
assert(claudeLocal.mcpServers['ipzitalk-local'].command === 'npx', 'Claude local MCP command mismatch');
assert(JSON.stringify(claudeLocal.mcpServers['ipzitalk-local'].args) === JSON.stringify(['-y', 'presale-mcp@0.1.0']), 'Claude local MCP args mismatch');

const scannedFiles = [
  ...(await walk('plugins')),
  resolve(root, '.agents/plugins/marketplace.json'),
  resolve(root, '.claude-plugin/marketplace.json'),
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
