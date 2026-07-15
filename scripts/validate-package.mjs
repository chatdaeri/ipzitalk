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
assert(setupSkill.includes('27개 Remote Skill'), 'setup must describe the current Remote Skill count');
assert(setupSkill.includes('claude mcp login plugin:ipzitalk-remote:ipzitalk'), 'setup must use Claude native OAuth login');
assert(setupSkill.includes('codex mcp login ipzitalk'), 'setup must use Codex native OAuth login');
assert(setupSkill.includes('인증 URL·코드·토큰을 출력하거나 기록하지 않는다'), 'setup must protect OAuth material');
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
assert(sourceLock.sources.skills.availability === 'private-release', 'merged private Skill lock must be marked private-release');
assert(sourceLock.plugins.launcher.version === '0.1.2', 'localized launcher package must be version 0.1.2');
assert(sourceLock.plugins.remote.version === '0.1.16', 'localized Remote package must be version 0.1.16');
assert(sourceLock.plugins.local.version === '0.1.2', 'localized Local package must be version 0.1.2');
const lockedSkills = [...sourceLock.sources.skills.allowlist].sort();
assert(lockedSkills.length === 27, 'Remote release must contain exactly 27 skills');
assert(lockedSkills.includes('ipzitalk-recent-market-trend'), 'Remote PoC must package recent-market-trend');
const mainSkillNames = [
  'ipzitalk-complex-overview-all',
  'ipzitalk-location-report',
  'ipzitalk-presale-report',
  'ipzitalk-read-notice-compare',
  'ipzitalk-read-notice-report',
  'ipzitalk-recent-market-trend',
].sort();
const lockedSkillPaths = sourceLock.sources.skills.paths ?? {};
assert(Object.keys(lockedSkillPaths).sort().join('\n') === lockedSkills.join('\n'), 'locked Skill paths must match the allowlist');
const excludedSkillFiles = [...(sourceLock.sources.skills.excludedFiles ?? [])].sort();
assert(JSON.stringify(excludedSkillFiles) === JSON.stringify(['sub/ipzitalk-announcement-search/.DS_Store']), 'unexpected excluded Skill source files');
for (const skill of lockedSkills) {
  assert(lockedSkillPaths[skill] === `main/${skill}` || lockedSkillPaths[skill] === `sub/${skill}`, `invalid locked Skill path: ${skill}`);
}
assert(lockedSkills.filter((skill) => lockedSkillPaths[skill].startsWith('main/')).sort().join('\n') === mainSkillNames.join('\n'), 'locked main Skills mismatch');
assert(lockedSkills.filter((skill) => lockedSkillPaths[skill].startsWith('sub/')).length === 21, 'Remote release must contain 21 sub Skills');
const namespaceSkills = [...(sourceLock.sources.skills.namespaceValidated ?? [])].sort();
assert(namespaceSkills.length === 25, 'Remote release must identify 25 namespace-contract Skills');
assert(namespaceSkills.every((skill) => lockedSkills.includes(skill)), 'namespace-validated Skills must be packaged');
const templateSkills = [...(sourceLock.sources.skills.templates ?? [])].sort();
assert(templateSkills.length === 26, 'Remote release must identify 26 HTML template Skills');
assert(templateSkills.every((skill) => lockedSkills.includes(skill)), 'template Skills must be packaged');
const lockedSkillVersions = sourceLock.sources.skills.versions ?? {};
assert(Object.keys(lockedSkillVersions).sort().join('\n') === lockedSkills.join('\n'), 'locked Skill versions must match the allowlist');
assert(lockedSkillVersions['ipzitalk-complex-overview-all'] === '1.1.5', 'complex-overview-all evidence-guard version mismatch');
assert(lockedSkillVersions['ipzitalk-location-report'] === '1.3.5', 'location-report evidence-guard version mismatch');
assert(lockedSkillVersions['ipzitalk-presale-report'] === '1.1.4', 'presale-report evidence-guard version mismatch');
assert(lockedSkillVersions['ipzitalk-read-notice-compare'] === '1.2.5', 'read-notice-compare evidence-guard version mismatch');
assert(lockedSkillVersions['ipzitalk-read-notice-report'] === '1.2.5', 'read-notice-report evidence-guard version mismatch');
assert(lockedSkillVersions['ipzitalk-recent-market-trend'] === '1.2.6', 'recent-market-trend report-contract version mismatch');
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
const packagedSkillFiles = await walk('plugins/ipzitalk-remote/skills');
assert(!packagedSkillFiles.some((file) => file.endsWith('/.DS_Store')), 'packaged Remote skills must exclude .DS_Store files');
for (const skill of packagedSkills) {
  const skillFiles = (await walk(`plugins/ipzitalk-remote/skills/${skill}`)).filter((file) => file.endsWith('.md'));
  const skillText = (await Promise.all(skillFiles.map((file) => readFile(file, 'utf8')))).join('\n');
  const skillVersion = skillText.match(/^version:\s*([^\s]+)$/m)?.[1];
  assert(skillVersion === lockedSkillVersions[skill], `locked Skill version mismatch: ${skill}`);
  if (namespaceSkills.includes(skill)) {
    assert(skillText.includes('ipzitalk-remote'), `missing Remote provenance rule: ${skill}`);
    assert(skillText.includes('mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>'), `missing plugin namespace fallback: ${skill}`);
    assert(skillText.includes('presale-mcp'), `missing local provenance exclusion: ${skill}`);
  }
  if (mainSkillNames.includes(skill)) {
    assert(skillText.includes('원하는 분석 목적을 한 문장으로 알려주세요'), `missing purpose question: ${skill}`);
    assert(skillText.includes('네이티브 사용자 입력 UI'), `missing native goal UI contract: ${skill}`);
    assert(skillText.includes('지원 가능한 수가 2~3개'), `missing compact goal UI contract: ${skill}`);
    assert(skillText.includes('기타(직접 입력)'), `missing direct goal input contract: ${skill}`);
    assert(skillText.includes('그 턴을 종료해 답을 기다린다'), `missing purpose wait contract: ${skill}`);
    assert(skillText.includes('데이터 조회·수집이 완료된 후에만'), `missing evidence-first summary contract: ${skill}`);
    assert(skillText.includes('../../scripts/html_artifact_contract.mjs'), `missing HTML artifact renderer contract: ${skill}`);
    assert(skillText.includes('--file-name'), `missing target-based artifact filename contract: ${skill}`);
  }
  if (templateSkills.includes(skill)) {
    const template = await readFile(resolve(root, `plugins/ipzitalk-remote/skills/${skill}/templates/result.html`), 'utf8');
    assert(template.includes('<script type="application/json" id="ipzi-data">'), `missing inert JSON data block: ${skill}`);
    assert(!/window\.__DATA__|\b__DATA__\b/.test(template), `legacy data boundary remains: ${skill}`);
  }
}

const htmlArtifactRenderer = await readFile(resolve(root, 'plugins/ipzitalk-remote/scripts/html_artifact_contract.mjs'), 'utf8');
assert(htmlArtifactRenderer.includes('sanitizeFileName'), 'missing HTML filename sanitizer');
assert(htmlArtifactRenderer.includes('fileName: args.get("file-name")'), 'missing --file-name CLI forwarding');
const locationTemplate = await readFile(resolve(root, 'plugins/ipzitalk-remote/skills/ipzitalk-location-report/templates/result.html'), 'utf8');
assert(locationTemplate.includes('th.n,td.n'), 'location numeric table headers must align with numeric cells');
assert(locationTemplate.includes('headerCell(c, i, sec.rows)'), 'location section headers must follow numeric cell alignment');
assert(locationTemplate.includes('headerCell(c, i, D.wide.rows)'), 'location wide headers must follow numeric cell alignment');
const recentMarketTrend = await readFile(resolve(root, 'plugins/ipzitalk-remote/skills/ipzitalk-recent-market-trend/SKILL.md'), 'utf8');
assert(recentMarketTrend.includes('검증된 사항은 런타임 fallback 또는 실행값 대체에 사용하지 않는다'), 'missing runtime fixture fallback prohibition');
assert(recentMarketTrend.includes('auditIncomplete:true`이면 정상 완료를 주장하지 않는다'), 'missing incomplete-audit failure contract');
assert(recentMarketTrend.includes('실거래 추이 분석'), 'missing reported-trade trend cross-reference');
const recentMarketTemplate = await readFile(resolve(root, 'plugins/ipzitalk-remote/skills/ipzitalk-recent-market-trend/templates/result.html'), 'utf8');
assert(recentMarketTemplate.includes('th.n,td.n'), 'missing aligned numeric detail columns');
assert(recentMarketTemplate.includes(`i > 0 ? ' class="n"' : ''`), 'missing numeric detail header class');
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
assert(readme.includes('Codex와 Claude Code용 입지톡 플러그인 marketplace입니다.'), 'README introduction must be Korean');
assert(readme.includes('Remote(호스팅형·권장)'), 'README must document the Korean Remote choice');
assert(readme.includes('OSS(로컬 실행)'), 'README must document the Korean OSS choice');
assert(readme.includes('브라우저 로그인을 시작할지 한 번 묻고'), 'README must document the browser-login handoff');

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
