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
const setupSkill = await readFile(resolve(root, 'plugins/ipzitalk/skills/setup/SKILL.md'), 'utf8');
assert(setupSkill.includes('successful remove exit status alone is insufficient'), 'setup must verify state after remove');
assert(setupSkill.includes('skill provenance conflict'), 'setup must stop on duplicate or missing Remote Skill provenance');
assert(setupSkill.includes('Do not remove or rewrite the global Skill automatically'), 'setup must preserve global Skills');

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
assert(Object.keys(localMcp.mcpServers ?? {}).join(',') === 'presale-mcp', 'unexpected local MCP server IDs');
const localServer = localMcp.mcpServers['presale-mcp'];
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
assert(sourceLock.plugins.remote.version === '0.1.8', 'Remote security test package must be version 0.1.8');
const lockedSkills = [...sourceLock.sources.skills.allowlist].sort();
assert(lockedSkills.length === 6, 'Remote PoC must contain exactly six skills');
assert(lockedSkills.includes('ipzitalk-recent-market-trend'), 'Remote PoC must package recent-market-trend');
const lockedSkillVersions = sourceLock.sources.skills.versions ?? {};
assert(Object.keys(lockedSkillVersions).sort().join('\n') === lockedSkills.join('\n'), 'locked Skill versions must match the allowlist');
assert(lockedSkillVersions['ipzitalk-location-report'] === '1.3.1', 'location-report security version mismatch');
assert(lockedSkillVersions['ipzitalk-read-notice-compare'] === '1.2.1', 'read-notice-compare security version mismatch');
assert(lockedSkillVersions['ipzitalk-read-notice-report'] === '1.2.1', 'read-notice-report security version mismatch');
assert(remote.version === sourceLock.plugins.remote.version, 'Codex Remote version mismatch');
const lockedSkillArtifacts = [...(sourceLock.sources.skills.artifacts ?? [])].sort();
assert(JSON.stringify(lockedSkillArtifacts) === JSON.stringify([
  'scripts/document_extract.py',
  'scripts/html_artifact_contract.mjs',
  'scripts/xlsx_artifact.py',
]), 'unexpected locked Skill artifacts');
const packagedSkills = (await readdir(resolve(root, 'plugins/ipzitalk-remote/skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert(packagedSkills.join('\n') === lockedSkills.join('\n'), 'packaged Remote skills do not match source lock');
for (const skill of packagedSkills) {
  const skillFiles = (await walk(`plugins/ipzitalk-remote/skills/${skill}`)).filter((file) => file.endsWith('.md'));
  const skillText = (await Promise.all(skillFiles.map((file) => readFile(file, 'utf8')))).join('\n');
  const skillVersion = skillText.match(/^version:\s*([^\s]+)$/m)?.[1];
  assert(skillVersion === lockedSkillVersions[skill], `locked Skill version mismatch: ${skill}`);
  assert(skillText.includes('ipzitalk-remote'), `missing Remote provenance rule: ${skill}`);
  assert(skillText.includes('mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>'), `missing plugin namespace fallback: ${skill}`);
  assert(skillText.includes('presale-mcp'), `missing local provenance exclusion: ${skill}`);
  assert(skillText.includes('../../scripts/html_artifact_contract.mjs'), `missing HTML artifact renderer contract: ${skill}`);
  const template = await readFile(resolve(root, `plugins/ipzitalk-remote/skills/${skill}/templates/result.html`), 'utf8');
  assert(template.includes('<script type="application/json" id="ipzi-data">'), `missing inert JSON data block: ${skill}`);
  assert(!/window\.__DATA__|\b__DATA__\b/.test(template), `legacy data boundary remains: ${skill}`);
}
for (const artifact of lockedSkillArtifacts) {
  const content = await readFile(resolve(root, 'plugins/ipzitalk-remote', artifact), 'utf8');
  assert(content.length > 0, `empty packaged Skill artifact: ${artifact}`);
}
const documentExtractor = await readFile(resolve(root, 'plugins/ipzitalk-remote/scripts/document_extract.py'), 'utf8');
assert(documentExtractor.includes('MAX_PDF_PAGES = 500'), 'missing PDF page limit');
assert(documentExtractor.includes('MAX_ZIP_ENTRIES = 256'), 'missing HWPX entry limit');
for (const skill of ['ipzitalk-read-notice-compare', 'ipzitalk-read-notice-report']) {
  const skillText = await readFile(resolve(root, `plugins/ipzitalk-remote/skills/${skill}/SKILL.md`), 'utf8');
  assert(skillText.includes('../../scripts/document_extract.py'), `missing bounded document extractor contract: ${skill}`);
}
assert(sourceLock.plugins.local?.id === 'ipzitalk-local', 'local plugin lock missing');
assert(/^[0-9a-f]{40}$/.test(sourceLock.sources.localMcp.commit), 'local MCP commit must be a full SHA');
assert(sourceLock.sources.localMcp.availability === 'local-only', 'unpublished local MCP lock must be marked local-only');
assert(sourceLock.sources.localMcp.package === 'presale-mcp', 'local MCP package mismatch');
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
  assert(claudeLocal.mcpServers?.['presale-mcp']?.env?.[name] === `\${user_config.${name}}`, `Claude userConfig interpolation mismatch: ${name}`);
}
assert(Object.keys(claudeLocal.mcpServers ?? {}).join(',') === 'presale-mcp', 'unexpected Claude local MCP server IDs');
assert(claudeLocal.mcpServers['presale-mcp'].command === 'npx', 'Claude local MCP command mismatch');
assert(JSON.stringify(claudeLocal.mcpServers['presale-mcp'].args) === JSON.stringify(['-y', 'presale-mcp@0.1.0']), 'Claude local MCP args mismatch');

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
