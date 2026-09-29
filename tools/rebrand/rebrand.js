#!/usr/bin/env node
/*
 * Rebrand codemod: ports code from upstream Leapp (github.com/Noovolari/leapp) to Hopkey.
 *
 * It rewrites the content of every git-tracked text file and renames tracked paths:
 *   - npm packages   @noovolari/leapp-core -> @hopkey/core, @noovolari/leapp-cli -> @hopkey/cli
 *   - repository     github.com/Noovolari/leapp -> github.com/willroll/hopkey
 *   - docs site      https://docs.leapp.cloud/... -> https://willroll.github.io/hopkey/...
 *   - identifiers    com.leapp.app / cloud.leapp -> io.github.willroll.hopkey[.cli]
 *   - data files     ~/.Leapp/Leapp-lock.json -> ~/.hopkey/hopkey-lock.json
 *   - everything else, case-preserving: LEAPP -> HOPKEY, Leapp -> Hopkey, leapp -> hopkey
 *
 * Links to hosts the project does not control (leapp.cloud, noovolari.com, S3 buckets, the
 * Homebrew tap, ...) are never rewritten: pointing them at a made-up domain would hand the app's
 * traffic to whoever registers it. They are kept verbatim and listed by --report for manual review.
 *
 * The rewrite is idempotent, so it can be re-run after merging upstream changes.
 *
 * Usage:
 *   node tools/rebrand/rebrand.js            apply the changes (uses `git mv` for renames)
 *   node tools/rebrand/rebrand.js --check    exit 1 if anything would change (for CI)
 *   node tools/rebrand/rebrand.js --report   list remaining upstream names left for manual review
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");

const REPO = "willroll/hopkey";
const DOCS_URL = "https://willroll.github.io/hopkey";
const APP_ID = "io.github.willroll.hopkey";

// Never rewritten or renamed (paths relative to the repository root).
const EXCLUDED = [
  /^LICENSE$/,
  /^CHANGELOG\.md$/, // upstream release history is kept verbatim
  /^(README|NOTICE)\.md$/, // hand-maintained, credits upstream Leapp on purpose
  /^dpapi-addon\//, // source of the upstream-published @noovolari/dpapi-addon package
  /^packages\/desktop-app\/electron\/build\//, // committed node-gyp output
  /^packages\/core\/src\/services\/leapp-import-service(\.spec)?\.ts$/, // reads the legacy Leapp data on purpose
  /^tools\/rebrand\//,
];

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".icns", ".webp", ".bmp", ".mp4", ".mov", ".webm",
  ".pdf", ".woff", ".woff2", ".ttf", ".eot", ".otf", ".node", ".zip", ".gz", ".tgz", ".dmg", ".exe",
]);

// URLs, plus third-party names that must survive verbatim. Order matters: URLs come first so that
// a docs.leapp.cloud URL can be mapped before the bare-domain rule protects the host name.
const URL_PATTERN = String.raw`\b(?:git\+)?(?:https?|s3):\/\/[^\s"'<>\x60)\]}|\\^]+`;
const PROTECTED_PATTERNS = [
  String.raw`@noovolari\/dpapi-addon`, // third-party npm dependency
  String.raw`\bleappSessionId\b`, // message field of the upstream multi-console browser extension
  String.raw`\b[Nn]oovolari\/brew\/[\w-]+`, // upstream Homebrew tap
  String.raw`\bnoovolari-leapp[\w-]*`, // upstream S3 buckets
  String.raw`\b[\w.-]*leapp\.cloud\b`, // upstream website, docs, blog and e-mail addresses
  String.raw`\b[\w.-]*noovolari\.(?:com|net)\b`, // upstream services and e-mail addresses
];
const TOKEN_REGEX = new RegExp(`(${URL_PATTERN})|(${PROTECTED_PATTERNS.join("|")})`, "gi");

// Plain-text rules, applied in order outside of URLs and protected names.
const TEXT_RULES = [
  [/@noovolari\/leapp-core/g, "@hopkey/core"],
  [/@noovolari\/leapp-cli/g, "@hopkey/cli"],
  [/\b[Nn]oovolari\/leapp\b(?!-)/g, REPO],
  [/\bcom\.leapp\.app\b/g, APP_ID],
  [/"identifier": "cloud\.leapp"/g, `"identifier": "${APP_ID}.cli"`],
  [/\.Leapp(?![\w-])/g, ".hopkey"], // data directory
  [/\bLeapp-lock\b/g, "hopkey-lock"], // workspace file
  [/LEAPP/g, "HOPKEY"],
  [/Leapp/g, "Hopkey"],
  [/leapp/g, "hopkey"],
];

function transformText(text) {
  let out = "";
  let last = 0;
  for (const match of text.matchAll(TOKEN_REGEX)) {
    out += transformPlain(text.slice(last, match.index));
    out += match[1] !== undefined ? transformUrl(match[1]) : match[2];
    last = match.index + match[0].length;
  }
  return out + transformPlain(text.slice(last));
}

function transformPlain(text) {
  return TEXT_RULES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

function transformUrl(url) {
  let m;
  // Permalinks to a specific upstream commit keep pointing upstream.
  if (/^(?:git\+)?https?:\/\/github\.com\/noovolari\/leapp\/(?:blob|tree)\/[0-9a-f]{40}\//i.test(url)) {
    return url;
  }
  // The repository itself (not sibling repositories such as leapp-plugin-template).
  if ((m = url.match(/^((?:git\+)?https?:\/\/github\.com\/)noovolari\/leapp(?=[/.#?]|$)(.*)$/i))) {
    return m[1] + REPO + transformPlain(m[2]);
  }
  if ((m = url.match(/^https?:\/\/docs\.leapp\.cloud(?=[/#?]|$)(.*)$/i))) {
    return DOCS_URL + transformPlain(m[1]);
  }
  if (/^https?:\/\/(?:www\.)?npmjs\.(?:com|org)\/package\/@noovolari\/leapp-/i.test(url) || /^https?:\/\/img\.shields\.io\//i.test(url)) {
    return transformPlain(url);
  }
  return url; // third-party link: kept verbatim, listed by --report
}

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" })
    .split("\0")
    .filter((file) => file && !EXCLUDED.some((pattern) => pattern.test(file)));
}

function isBinary(file, buffer) {
  return BINARY_EXTENSIONS.has(path.extname(file).toLowerCase()) || buffer.subarray(0, 8000).includes(0);
}

function renamedPath(file) {
  return file
    .split("/")
    .map((segment) => transformPlain(segment))
    .join("/");
}

function report(files) {
  const counts = new Map();
  for (const file of files) {
    const buffer = fs.readFileSync(path.join(ROOT, file));
    if (isBinary(file, buffer)) continue;
    buffer
      .toString("utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const match of line.matchAll(/[\w.@/:-]*(?:leapp|noovolari)[\w.@/:-]*/gi)) {
          const key = match[0];
          if (!counts.has(key)) counts.set(key, []);
          counts.get(key).push(`${file}:${index + 1}`);
        }
      });
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [token, places] of sorted) {
    console.log(`${String(places.length).padStart(4)}  ${token}\n        ${places.slice(0, 3).join("  ")}${places.length > 3 ? "  ..." : ""}`);
  }
  console.log(`\n${sorted.length} distinct upstream names left for manual review.`);
}

function main() {
  const mode = process.argv[2] || "--apply";
  if (!["--apply", "--check", "--report"].includes(mode)) {
    console.error("usage: rebrand.js [--check | --report]");
    process.exit(2);
  }
  const files = trackedFiles();
  if (mode === "--report") return report(files);

  const changed = [];
  const renames = [];
  for (const file of files) {
    const absolute = path.join(ROOT, file);
    if (!fs.existsSync(absolute)) continue; // deleted in the working tree
    const buffer = fs.readFileSync(absolute);
    if (!isBinary(file, buffer)) {
      const before = buffer.toString("utf8");
      const after = transformText(before);
      if (after !== before) {
        changed.push(file);
        if (mode === "--apply") fs.writeFileSync(absolute, after);
      }
    }
    const target = renamedPath(file);
    if (target !== file) renames.push([file, target]);
  }

  if (mode === "--check") {
    [...changed.map((f) => `rewrite ${f}`), ...renames.map(([f, t]) => `rename  ${f} -> ${t}`)].forEach((l) => console.log(l));
    if (changed.length || renames.length) {
      console.error(`\n${changed.length} file(s) to rewrite and ${renames.length} to rename: run node tools/rebrand/rebrand.js`);
      process.exit(1);
    }
    return console.log("No upstream names left to rebrand.");
  }

  for (const [from, to] of renames) {
    fs.mkdirSync(path.dirname(path.join(ROOT, to)), { recursive: true });
    execFileSync("git", ["mv", from, to], { cwd: ROOT });
    removeEmptyParents(path.dirname(path.join(ROOT, from)));
  }
  console.log(`Rewrote ${changed.length} file(s), renamed ${renames.length} path(s).`);
}

function removeEmptyParents(dir) {
  while (dir.startsWith(ROOT + path.sep) && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

main();
