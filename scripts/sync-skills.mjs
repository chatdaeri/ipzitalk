#!/usr/bin/env node

import { cp, mkdir, readFile, readdir } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const sourceFlag = args.indexOf('--source');
if (sourceFlag < 0 || !args[sourceFlag + 1]) {
  console.error('Usage: node scripts/sync-skills.mjs --source /path/to/ipzitalk-skill');
  process.exit(2);
}

const root = resolve(import.meta.dirname, '..');
const source = resolve(args[sourceFlag + 1]);
const target = resolve(root, 'plugins/ipzitalk-remote/skills');
const lock = JSON.parse(await readFile(resolve(root, 'source-lock.json'), 'utf8'));
const expectedCommit = lock.sources.skills.commit;
const allowlist = [...lock.sources.skills.allowlist].sort();

if (!expectedCommit || !allowlist.length) throw new Error('skills source lock is empty');

const actualCommit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (actualCommit !== expectedCommit) {
  throw new Error(`source HEAD mismatch: expected ${expectedCommit}, got ${actualCommit}`);
}

async function treeSnapshot(directory) {
  const rows = [];
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        const digest = createHash('sha256').update(await readFile(path)).digest('hex');
        rows.push(`${relative(directory, path)} ${digest}`);
      }
    }
  }
  await visit(directory);
  return rows.sort().join('\n');
}

await mkdir(target, { recursive: true });

for (const skill of allowlist) {
  const from = resolve(source, 'main', skill);
  execFileSync('git', ['-C', source, 'diff', '--quiet', expectedCommit, '--', `main/${skill}`]);
  await cp(from, resolve(target, skill), { recursive: true, force: true });
  const sourceSnapshot = await treeSnapshot(from);
  const targetSnapshot = await treeSnapshot(resolve(target, skill));
  if (targetSnapshot !== sourceSnapshot) throw new Error(`copied skill mismatch: ${skill}`);
}

const copied = (await readdir(target, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (copied.join('\n') !== allowlist.join('\n')) {
  throw new Error(`target allowlist mismatch: ${copied.map(basename).join(', ')}`);
}

console.log(`Synced ${copied.length} skills from ${actualCommit}.`);
