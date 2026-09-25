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
assert(setupSkill.includes('제거 명령의 성공 종료 상태만으로는 충분하지 않다'), 'setup must verify state after remove');
assert(setupSkill.includes('Skill 출처 충돌'), 'setup must stop on duplicate or missing Remote Skill provenance');
assert(setupSkill.includes('전역 Skill을 자동으로 삭제하거나 다시 쓰지 않는다'), 'setup must preserve global Skills');
assert(setupSkill.includes('Remote(호스팅형·권장)'), 'setup must expose the Korean Remote choice');
assert(setupSkill.includes('OSS(로컬 실행)'), 'setup must expose the Korean OSS choice');
assert(setupSkill.includes('상태만 확인'), 'setup must expose the Korean status-only choice');
assert(setupSkill.includes('3개 Remote Skill'), 'setup must describe the current Remote Skill count');
assert(!setupSkill.includes('27개 Remote Skill'), 'setup retains the retired Remote Skill count');
assert(setupSkill.includes('claude mcp login plugin:ipzitalk-remote:ipzitalk'), 'setup must use Claude native OAuth login');
assert(setupSkill.includes('codex mcp login ipzitalk'), 'setup must use Codex native OAuth login');
assert(setupSkill.includes('인증 URL·코드·토큰을 출력하거나 기록하지 않는다'), 'setup must protect OAuth material');
assert(setupSkill.includes('npm registry 게시본 `npx -y presale-mcp@0.1.0`'), 'setup must identify the published Local registry command');
assert(!setupSkill.includes('npm 게시 전까지'), 'setup must not describe the published Local package as unpublished');
assert(setupSkill.includes('설치한 같은 실행에서는 로그인 질문을 이어서 하지 않는다'), 'setup must stop before login until plugin reload/application');
assert(setupSkill.includes('사용자가 `/exit`로 현재 Claude Code를 종료한 뒤 같은 터미널'), 'setup must prefer the same interactive terminal for first-login OAuth');
assert(setupSkill.includes('같은 터미널을 사용할 수 없을 때만 새 대화형 터미널'), 'setup must keep a new terminal as a fallback only');
assert(setupSkill.includes('콜백 URL·인가 코드·state를 채팅에 붙여 넣게 하지 않는다'), 'setup must not move one-time OAuth callback material through chat');
assert(setupSkill.includes('`/reload-plugins`만으로 OAuth 상태 갱신을 보장하지 않는다'), 'setup must not promise same-session OAuth refresh');
assert(setupSkill.includes('로그인 명령과 같은 프로필(`CLAUDE_CONFIG_DIR`을 사용했다면 같은 값)'), 'setup must preserve the Claude profile across external login and restart');
assert(setupSkill.includes('같은 터미널에서 `claude`를 다시 실행'), 'setup must restart Claude in the same terminal after OAuth login');
assert(setupSkill.includes('설치 직후 `/reload-plugins`를 먼저 실행한 다음 `/plugin configure ipzitalk-local@ipzitalk`'), 'setup must reload Claude plugins before Local configuration');
assert(setupSkill.includes('실행 패키지를 제거했다고 OAuth 자격증명이 반드시 삭제된다고 단정하지 않는다'), 'setup must verify OAuth reuse after switching');
assert(/[가-힣]/.test(launcher.description), 'Codex launcher description must be Korean');
assert(/[가-힣]/.test(launcher.interface?.shortDescription ?? ''), 'Codex launcher short description must be Korean');
assert(/[가-힣]/.test(launcher.interface?.longDescription ?? ''), 'Codex launcher long description must be Korean');
assert((launcher.interface?.defaultPrompt ?? []).every((prompt) => /[가-힣]/.test(prompt)), 'Codex launcher default prompts must be Korean');
const launcherAgent = await readFile(resolve(root, 'plugins/ipzitalk/skills/setup/agents/openai.yaml'), 'utf8');
assert(launcherAgent.includes('display_name: "입지톡 설정"'), 'Codex setup agent display name must be Korean');
assert(launcherAgent.includes('short_description: "입지톡 Remote 또는 OSS 실행 방식을 선택하고 설정합니다"'), 'Codex setup agent description must be Korean');
assert(launcherAgent.includes('default_prompt: "입지톡 Remote 또는 OSS 실행 방식을 선택하고 설정해 주세요."'), 'Codex setup agent prompt must be Korean');

const remote = await readJson('plugins/ipzitalk-remote/.codex-plugin/plugin.json');
assert(remote.mcpServers === './.mcp.json', 'remote companion path mismatch');
assert(remote.skills === './skills/', 'remote payload must expose the locked skills');
assert(/[가-힣]/.test(remote.description), 'Codex Remote description must be Korean');
assert(/[가-힣]/.test(remote.interface?.shortDescription ?? ''), 'Codex Remote short description must be Korean');
assert(/[가-힣]/.test(remote.interface?.longDescription ?? ''), 'Codex Remote long description must be Korean');
assert((remote.interface?.defaultPrompt ?? []).every((prompt) => /[가-힣]/.test(prompt)), 'Codex Remote default prompts must be Korean');
assert(remote.description.includes('3개 Skill'), 'Codex Remote description must identify three Skills');

const remoteMcp = await readJson('plugins/ipzitalk-remote/.mcp.json');
assert(Object.keys(remoteMcp.mcpServers ?? {}).join(',') === 'ipzitalk', 'unexpected remote MCP server IDs');
assert(remoteMcp.mcpServers.ipzitalk.type === 'http', 'remote MCP must use HTTP');
assert(remoteMcp.mcpServers.ipzitalk.url === 'https://ipzi-talk.synergylabs.kr/mcp', 'remote MCP URL mismatch');

const local = await readJson('plugins/ipzitalk-local/.codex-plugin/plugin.json');
assert(!('skills' in local), 'local payload must contain zero skills');
assert(local.mcpServers === './.mcp.json', 'local companion path mismatch');
assert(/[가-힣]/.test(local.description), 'Codex Local description must be Korean');
assert(/[가-힣]/.test(local.interface?.shortDescription ?? ''), 'Codex Local short description must be Korean');
assert(/[가-힣]/.test(local.interface?.longDescription ?? ''), 'Codex Local long description must be Korean');
assert((local.interface?.defaultPrompt ?? []).every((prompt) => /[가-힣]/.test(prompt)), 'Codex Local default prompts must be Korean');

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
assert(sourceLock.sources.skills.commit === 'ba9407e11885294dfefa95e21fdf89730ecee5de', 'Draft Skill PR 25 source SHA mismatch');
assert(sourceLock.sources.skills.availability === 'private-release', 'private Skill lock must be marked private-release');
assert(sourceLock.sources.remoteMcp.commit === 'e0291ccf6e7dc25b817a7497837206d4cd696448', 'Remote MCP PR 175 merge SHA mismatch');
assert(sourceLock.sources.remoteMcp.url === remoteMcp.mcpServers.ipzitalk.url, 'locked Remote MCP URL mismatch');
assert(sourceLock.plugins.launcher.version === '0.1.7', 'Claude launcher package must be version 0.1.7');
assert(sourceLock.plugins.remote.version === '0.1.21', 'three-Skill Remote package must be version 0.1.21');
assert(sourceLock.plugins.local.version === '0.1.2', 'localized Local package must be version 0.1.2');
assert(launcher.version === '0.1.8', 'Codex launcher package must be version 0.1.8');

const lockedSkills = [...sourceLock.sources.skills.allowlist].sort();
const expectedSkills = [
  'ipzitalk-complex-overview-all',
  'ipzitalk-location-report',
  'ipzitalk-presale-notices',
].sort();
assert(lockedSkills.join('\n') === expectedSkills.join('\n'), 'Remote release must contain exactly the three active Skills');
const lockedSkillPaths = sourceLock.sources.skills.paths ?? {};
assert(Object.keys(lockedSkillPaths).sort().join('\n') === lockedSkills.join('\n'), 'locked Skill paths must match the allowlist');
assert(lockedSkillPaths['ipzitalk-complex-overview-all'] === 'main/ipzitalk-complex-overview-all', 'complex overview path mismatch');
assert(lockedSkillPaths['ipzitalk-location-report'] === 'main/ipzitalk-location-report', 'location report path mismatch');
assert(lockedSkillPaths['ipzitalk-presale-notices'] === 'sub/ipzitalk-presale-notices', 'presale notices path mismatch');
assert((sourceLock.sources.skills.excludedFiles ?? []).length === 0, 'unexpected excluded Skill source files');
assert((sourceLock.sources.skills.artifacts ?? []).length === 0, 'shared Skill artifacts must be empty');
const namespaceSkills = [...(sourceLock.sources.skills.namespaceValidated ?? [])].sort();
assert(namespaceSkills.join('\n') === lockedSkills.join('\n'), 'namespace-validated Skills mismatch');
const templateSkills = [...(sourceLock.sources.skills.templates ?? [])].sort();
assert(templateSkills.join('\n') === lockedSkills.join('\n'), 'template Skills mismatch');
const lockedSkillVersions = sourceLock.sources.skills.versions ?? {};
assert(Object.keys(lockedSkillVersions).sort().join('\n') === lockedSkills.join('\n'), 'locked Skill versions must match the allowlist');
assert(lockedSkillVersions['ipzitalk-complex-overview-all'] === '3.0.1', 'complex-overview-all version mismatch');
assert(lockedSkillVersions['ipzitalk-location-report'] === '1.4.3', 'location-report version mismatch');
assert(lockedSkillVersions['ipzitalk-presale-notices'] === '1.0.1', 'presale-notices version mismatch');
assert(remote.version === sourceLock.plugins.remote.version, 'Codex Remote version mismatch');

const packagedSkills = (await readdir(resolve(root, 'plugins/ipzitalk-remote/skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert(packagedSkills.join('\n') === lockedSkills.join('\n'), 'packaged Remote skills do not match source lock');
const remotePayloadEntries = await readdir(resolve(root, 'plugins/ipzitalk-remote'));
assert(!remotePayloadEntries.includes('scripts'), 'retired shared Skill scripts remain');
const packagedSkillFiles = await walk('plugins/ipzitalk-remote/skills');
assert(!packagedSkillFiles.some((file) => file.endsWith('/.DS_Store')), 'packaged Remote skills must exclude .DS_Store files');
for (const skill of packagedSkills) {
  const skillRoot = resolve(root, 'plugins/ipzitalk-remote/skills', skill);
  const skillText = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8');
  const skillVersion = skillText.match(/^metadata:\s*$[\s\S]*?^  version:\s*"([^"]+)"\s*$/m)?.[1];
  assert(skillVersion === lockedSkillVersions[skill], `locked Skill version mismatch: ${skill}`);
  assert(skillText.includes('ipzitalk-remote'), `missing Remote provenance rule: ${skill}`);
  assert(skillText.includes('mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>'), `missing plugin namespace fallback: ${skill}`);
  assert(skillText.includes('presale-mcp'), `missing local provenance exclusion: ${skill}`);
  assert(skillText.includes(`/${skill}`) && skillText.includes(`$${skill}`), `missing direct invocation contract: ${skill}`);
  assert(skillText.includes('이름을 지목해 실행을 명시적으로 지시'), `missing named invocation contract: ${skill}`);
  assert(skillText.includes('scripts/html_artifact_contract.mjs'), `missing self-contained HTML renderer contract: ${skill}`);
  assert(skillText.includes('--file-name'), `missing target-based artifact filename contract: ${skill}`);
  const renderer = await readFile(resolve(skillRoot, 'scripts/html_artifact_contract.mjs'), 'utf8');
  assert(renderer.includes('sanitizeFileName'), `missing HTML filename sanitizer: ${skill}`);
  assert(renderer.includes('fileName: args.get("file-name")'), `missing --file-name CLI forwarding: ${skill}`);
  const template = await readFile(resolve(skillRoot, 'templates/result.html'), 'utf8');
  assert(template.includes('<script type="application/json" id="ipzi-data">'), `missing inert JSON data block: ${skill}`);
  assert(!/window\.__DATA__|\b__DATA__\b/.test(template), `legacy data boundary remains: ${skill}`);
}

const locationTemplate = await readFile(resolve(root, 'plugins/ipzitalk-remote/skills/ipzitalk-location-report/templates/result.html'), 'utf8');
assert(locationTemplate.includes('th.n,td.n'), 'location numeric table headers must align with numeric cells');
assert(locationTemplate.includes('headerCell(c, i, sec.rows)'), 'location section headers must follow numeric cell alignment');
assert(locationTemplate.includes('headerCell(c, i, D.wide.rows)'), 'location wide headers must follow numeric cell alignment');
assert(sourceLock.plugins.local?.id === 'ipzitalk-local', 'local plugin lock missing');
assert(/^[0-9a-f]{40}$/.test(sourceLock.sources.localMcp.commit), 'local MCP commit must be a full SHA');
assert(sourceLock.sources.localMcp.commit === 'a78e7cebbf3fd154b18dfa6fbd1e91142399f8bd', 'published local MCP lock must use the registry source SHA');
assert(sourceLock.sources.localMcp.availability === 'public-registry', 'published local MCP lock must be marked public-registry');
assert(sourceLock.sources.localMcp.package === 'presale-mcp', 'local MCP package mismatch');
assert(sourceLock.sources.localMcp.toolsSnapshotSha256 === '08df02512148d67604a375c5fef689170e795093eeaf2fbe50dc5335a33f26e3', 'local tool snapshot mismatch');

const claudeMarketplace = await readJson('.claude-plugin/marketplace.json');
assert(claudeMarketplace.name === 'ipzitalk', 'unexpected Claude marketplace name');
assert(/[가-힣]/.test(claudeMarketplace.description ?? ''), 'Claude marketplace description must be Korean');
assert(claudeMarketplace.plugins?.map((entry) => entry.name).join(',') === 'ipzitalk,ipzitalk-remote,ipzitalk-local', 'unexpected Claude marketplace entries');
for (const entry of claudeMarketplace.plugins) {
  assert(entry.source === `./plugins/${entry.name}`, `unexpected Claude source path: ${entry.name}`);
  assert(entry.version === sourceLock.plugins[entry.name === 'ipzitalk' ? 'launcher' : entry.name === 'ipzitalk-remote' ? 'remote' : 'local'].version, `Claude version mismatch: ${entry.name}`);
  assert(/[가-힣]/.test(entry.description ?? ''), `Claude marketplace plugin description must be Korean: ${entry.name}`);
}

const claudeLauncher = await readJson('plugins/ipzitalk/.claude-plugin/plugin.json');
assert(claudeLauncher.skills === './skills/', 'Claude launcher must expose setup skill');
assert(!('mcpServers' in claudeLauncher), 'Claude launcher must not expose an MCP server');
assert(/[가-힣]/.test(claudeLauncher.description), 'Claude launcher description must be Korean');

const claudeRemote = await readJson('plugins/ipzitalk-remote/.claude-plugin/plugin.json');
assert(claudeRemote.skills === './skills/', 'Claude Remote must expose the locked skills');
assert(claudeRemote.mcpServers?.ipzitalk?.type === 'http', 'Claude Remote MCP must use HTTP');
assert(claudeRemote.mcpServers.ipzitalk.url === 'https://ipzi-talk.synergylabs.kr/mcp', 'Claude Remote URL mismatch');
assert(/[가-힣]/.test(claudeRemote.description), 'Claude Remote description must be Korean');
assert(claudeRemote.description.includes('3개 Remote Skill'), 'Claude Remote description must identify three Skills');

const claudeLocal = await readJson('plugins/ipzitalk-local/.claude-plugin/plugin.json');
assert(!('skills' in claudeLocal), 'Claude local payload must contain zero skills');
assert(/[가-힣]/.test(claudeLocal.description), 'Claude Local description must be Korean');
assert(Object.keys(claudeLocal.userConfig ?? {}).join(',') === expectedEnvVars.join(','), 'Claude local userConfig keys mismatch');
for (const name of expectedEnvVars) {
  assert(claudeLocal.userConfig[name]?.type === 'string', `Claude userConfig type mismatch: ${name}`);
  assert(claudeLocal.userConfig[name]?.required === true, `Claude userConfig must be required: ${name}`);
  assert(claudeLocal.userConfig[name]?.sensitive === true, `Claude userConfig must be sensitive: ${name}`);
  assert(/[가-힣]/.test(claudeLocal.userConfig[name]?.title ?? ''), `Claude userConfig title must be Korean: ${name}`);
  assert(/[가-힣]/.test(claudeLocal.userConfig[name]?.description ?? ''), `Claude userConfig description must be Korean: ${name}`);
  assert(claudeLocal.mcpServers?.['presale-mcp']?.env?.[name] === `\${user_config.${name}}`, `Claude userConfig interpolation mismatch: ${name}`);
}
assert(Object.keys(claudeLocal.mcpServers ?? {}).join(',') === 'presale-mcp', 'unexpected Claude local MCP server IDs');
assert(claudeLocal.mcpServers['presale-mcp'].command === 'npx', 'Claude local MCP command mismatch');
assert(JSON.stringify(claudeLocal.mcpServers['presale-mcp'].args) === JSON.stringify(['-y', 'presale-mcp@0.1.0']), 'Claude local MCP args mismatch');

const readme = await readFile(resolve(root, 'README.md'), 'utf8');
assert(/[가-힣]/.test(readme) && readme.includes('Claude Code') && readme.includes('Codex'), 'README introduction must be Korean and identify both clients');
assert(readme.includes('Remote (권장)') && readme.includes('OSS (로컬)'), 'README must explain both runtime modes in Korean');
assert(readme.includes('스킬 3종') && readme.includes('공개 도구 10개'), 'README package summary mismatch');
assert(!/스킬 27종|27개 Remote Skill|11개 도구/.test(readme), 'README retains retired package counts');
for (const tool of [
  'get_geocode',
  'get_address',
  'get_region_code',
  'search_by_nearby_category',
  'search_by_nearby_keyword',
  'find_complexes_near_point',
  'get_complex_info_by_query',
  'get_complex_info_batch',
  'search_presale_notices_by_filter',
  'get_map_embed_url',
]) assert(readme.includes(`\`${tool}\``), `README missing public tool: ${tool}`);
const codexSetupDoc = await readFile(resolve(root, 'docs/codex-setup.md'), 'utf8');
const claudeSetupDoc = await readFile(resolve(root, 'docs/claude-setup.md'), 'utf8');
assert(codexSetupDoc.includes('codex mcp login ipzitalk'), 'Codex setup documentation must preserve the official OAuth login command');
assert(claudeSetupDoc.includes('claude mcp login plugin:ipzitalk-remote:ipzitalk'), 'Claude setup documentation must preserve the official OAuth login command');

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
