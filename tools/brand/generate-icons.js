#!/usr/bin/env node
/*
 * Regenerates every raster icon of the app and the docs from the SVG sources in this folder:
 *   icon.svg            app icon (window, installers, docs logo and favicons)
 *   tray-template.svg   macOS menu bar icon, black on transparent
 *   dmg-background.svg  macOS disk image window background
 *
 * Requires rsvg-convert (librsvg) and ImageMagick's convert on the PATH.
 * Usage: node tools/brand/generate-icons.js
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const DESKTOP = path.join(ROOT, "packages", "desktop-app");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "hopkey-icons-"));

function png(source, output, width, height = width) {
  execFileSync("rsvg-convert", ["-w", String(width), "-h", String(height), "-o", output, path.join(__dirname, source)]);
}

function tempPng(size) {
  const file = path.join(TMP, `icon-${size}.png`);
  if (!fs.existsSync(file)) png("icon.svg", file, size);
  return file;
}

function ico(output, sizes) {
  execFileSync("convert", [...sizes.map(tempPng), output]);
}

// PNG-encoded icns entries, understood by macOS 10.7 and later
function icns(output) {
  const entries = [["icp4", 16], ["icp5", 32], ["icp6", 64], ["ic07", 128], ["ic08", 256], ["ic09", 512], ["ic10", 1024], ["ic11", 32], ["ic12", 64], ["ic13", 256], ["ic14", 512]];
  const chunk = (type, data) => {
    const header = Buffer.alloc(8);
    header.write(type, 0, "ascii");
    header.writeUInt32BE(data.length + 8, 4);
    return Buffer.concat([header, data]);
  };
  const body = Buffer.concat(entries.map(([type, size]) => chunk(type, fs.readFileSync(tempPng(size)))));
  fs.writeFileSync(output, chunk("icns", body));
}

const appIcons = ["src/assets/icons/icon", "src/assets/images/Hopkey", "electron/assets/images/Hopkey"];
const outputs = [
  ...appIcons.flatMap((base) => [
    [path.join(DESKTOP, `${base}.png`), (file) => png("icon.svg", file, 1024)],
    [path.join(DESKTOP, `${base}.ico`), (file) => ico(file, [16, 24, 32, 48, 64, 128, 256])],
    [path.join(DESKTOP, `${base}.icns`), icns],
  ]),
  [path.join(DESKTOP, "src/assets/icons/1024x1024.png"), (file) => png("icon.svg", file, 1024)],
  [path.join(DESKTOP, "src/assets/icons/background.png"), (file) => png("dmg-background.svg", file, 540, 380)],
  [path.join(DESKTOP, "src/assets/images/Hopkey-rounded.png"), (file) => png("icon.svg", file, 384)],
  [path.join(DESKTOP, "src/assets/images/HopkeyMini.png"), (file) => png("icon.svg", file, 16)], // Linux tray
  [path.join(DESKTOP, "src/assets/images/HopkeyMini@2x.png"), (file) => png("icon.svg", file, 32)],
  [path.join(DESKTOP, "src/assets/images/HopkeyTemplate.png"), (file) => png("tray-template.svg", file, 16)], // macOS menu bar
  [path.join(DESKTOP, "src/assets/images/HopkeyTemplate@2x.png"), (file) => png("tray-template.svg", file, 32)],
  [path.join(DESKTOP, "src/favicon.ico"), (file) => ico(file, [16, 32, 48])],
  [path.join(ROOT, "docs/images/hopkey.png"), (file) => png("icon.svg", file, 512)],
  [path.join(ROOT, "docs/images/icon.png"), (file) => png("icon.svg", file, 1024)],
  [path.join(ROOT, "docs/images/logo.png"), (file) => png("icon.svg", file, 88)],
  [path.join(ROOT, "docs/images/icon.ico"), (file) => ico(file, [16, 32, 48, 256])],
  [path.join(ROOT, ".github/images/hopkey-icon.png"), (file) => png("icon.svg", file, 256)],
];

for (const [file, generate] of outputs) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  generate(file);
  console.log(`wrote ${path.relative(ROOT, file)}`);
}
fs.rmSync(TMP, { recursive: true, force: true });
