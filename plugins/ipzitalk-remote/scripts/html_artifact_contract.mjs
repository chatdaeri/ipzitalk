#!/usr/bin/env node

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dataMarker = '<script type="application/json" id="ipzi-data">';
const dataEndMarker = "</script>";
const skillNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const forbiddenPatterns = [
  ["DB크로스체크", /DB크로스체크/],
  ["근거대조", /근거대조/],
  ["MCP namespace", /mcp__/],
  ["cache_hit", /cache_hit/],
  ["REF_DB", /REF_DB/],
  ["local absolute path", /(?:\/Users\/|\/home\/|[A-Za-z]:\\\\Users\\\\)/],
];

function splitArtifact(html, label) {
  const dataStart = html.indexOf(dataMarker);
  if (dataStart < 0) throw new Error(`${label}: missing ${dataMarker}`);
  if (html.indexOf(dataMarker, dataStart + dataMarker.length) >= 0) {
    throw new Error(`${label}: multiple ${dataMarker} markers`);
  }

  const dataEnd = html.indexOf(dataEndMarker, dataStart + dataMarker.length);
  if (dataEnd < 0) throw new Error(`${label}: missing JSON data end marker`);

  return {
    prefix: html.slice(0, dataStart + dataMarker.length),
    data: html.slice(dataStart + dataMarker.length, dataEnd),
    suffix: html.slice(dataEnd),
  };
}

function serializeData(data) {
  if (data === undefined) throw new Error("data is required");
  return JSON.stringify(data, null, 2)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export async function renderHtmlArtifact({
  skillDir,
  skillName = basename(resolve(skillDir)),
  data,
  outputRoot = "out",
}) {
  if (!skillNamePattern.test(skillName)) {
    throw new Error(`invalid Skill name: ${skillName}`);
  }

  const templatePath = join(resolve(skillDir), "templates", "result.html");
  const template = await readFile(templatePath, "utf8");
  const parts = splitArtifact(template, templatePath);
  const outputDir = join(resolve(outputRoot), skillName);
  const outputPath = join(outputDir, "result.html");
  const temporaryPath = join(outputDir, `.result.html.tmp-${process.pid}`);
  const rendered = `${parts.prefix}${serializeData(data)}${parts.suffix}`;

  await mkdir(outputDir, { recursive: true });
  await writeFile(temporaryPath, rendered, "utf8");
  await rename(temporaryPath, outputPath);

  return { templatePath, outputPath };
}

export async function validateHtmlArtifact({ templatePath, outputPath }) {
  const [template, output] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(outputPath, "utf8"),
  ]);
  const expected = splitArtifact(template, templatePath);
  const actual = splitArtifact(output, outputPath);

  if (actual.prefix !== expected.prefix) {
    throw new Error("fixed template region changed: prefix");
  }
  if (actual.suffix !== expected.suffix) {
    throw new Error("fixed template region changed: suffix");
  }

  const forbiddenHits = forbiddenPatterns
    .filter(([, pattern]) => pattern.test(actual.data))
    .map(([label]) => label);
  if (forbiddenHits.length) {
    throw new Error(`forbidden user-facing content: ${forbiddenHits.join(", ")}`);
  }

  return {
    outputPath,
    prefixEqual: true,
    suffixEqual: true,
    forbiddenHits,
  };
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("usage: html_artifact_contract.mjs --skill-dir DIR --data FILE [--output-root DIR]");
    }
    values.set(key.slice(2), value);
  }
  if (!values.has("skill-dir") || !values.has("data")) {
    throw new Error("--skill-dir and --data are required");
  }
  return values;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const data = JSON.parse(await readFile(resolve(args.get("data")), "utf8"));
  const result = await renderHtmlArtifact({
    skillDir: resolve(args.get("skill-dir")),
    data,
    outputRoot: resolve(args.get("output-root") ?? "out"),
  });
  await validateHtmlArtifact(result);
  console.log(result.outputPath);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
