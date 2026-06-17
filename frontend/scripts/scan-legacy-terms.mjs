import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");

const targets = [
  "README.md",
  "docs",
  path.join("frontend", "app"),
  path.join("frontend", "components"),
  path.join("frontend", "lib"),
];

const allowedTextExtensions = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".css",
]);

const legacyPattern = /PEAK-Lite|peak-lite|learner|learners|instructor|instructors|education/gi;

function isTextFile(filePath) {
  return allowedTextExtensions.has(path.extname(filePath).toLowerCase());
}

function walkFiles(entryPath, results) {
  const stats = fs.statSync(entryPath);

  if (stats.isDirectory()) {
    for (const child of fs.readdirSync(entryPath)) {
      walkFiles(path.join(entryPath, child), results);
    }
    return;
  }

  if (stats.isFile() && isTextFile(entryPath)) {
    results.push(entryPath);
  }
}

function findMatches(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const findings = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const matches = line.match(legacyPattern);
    if (matches) {
      findings.push({
        line: i + 1,
        text: line.trim(),
        terms: Array.from(new Set(matches.map((m) => m.toLowerCase()))),
      });
    }
  }

  return findings;
}

function toRepoRelative(absPath) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

function main() {
  const filesToScan = [];

  for (const target of targets) {
    const absTarget = path.join(repoRoot, target);
    if (fs.existsSync(absTarget)) {
      walkFiles(absTarget, filesToScan);
    }
  }

  const allFindings = [];

  for (const filePath of filesToScan) {
    const findings = findMatches(filePath);
    if (findings.length > 0) {
      allFindings.push({ filePath, findings });
    }
  }

  if (allFindings.length === 0) {
    console.log("PASS: No legacy terms found in scanned source and docs.");
    return;
  }

  console.log("FAIL: Legacy terms found.");
  for (const file of allFindings) {
    console.log(`- ${toRepoRelative(file.filePath)}`);
    for (const finding of file.findings) {
      console.log(`  line ${finding.line}: ${finding.text}`);
    }
  }

  process.exitCode = 1;
}

main();
