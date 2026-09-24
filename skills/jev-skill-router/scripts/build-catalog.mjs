#!/usr/bin/env node

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

function args(argv) {
  const result = {};
  for (let i = 2; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    result[key] = next && !next.startsWith("--") ? argv[++i] : true;
  }
  return result;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fields = {};
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!item) continue;
    const key = item[1];
    const value = item[2].trim();
    if (value === ">" || value === "|" || value === ">-" || value === "|-") {
      const parts = [];
      while (index + 1 < lines.length && (/^\s+/.test(lines[index + 1]) || lines[index + 1] === "")) {
        parts.push(lines[++index].trim());
      }
      fields[key] = parts.join(" ").trim();
    } else {
      fields[key] = value.replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  return fields;
}

async function walk(dir, found) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, found);
    else if (entry.isSymbolicLink()) {
      const target = await fs.stat(full).catch(() => null);
      if (target?.isDirectory()) await walk(full, found);
      else if (target?.isFile() && entry.name === "SKILL.md") found.push(full);
    } else if (entry.isFile() && entry.name === "SKILL.md") found.push(full);
  }
}

const options = args(process.argv);
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const defaultRoots = [path.join(codexHome, "skills"), path.join(codexHome, "plugins", "cache")].join(path.delimiter);
const roots = String(options.roots || defaultRoots)
  .split(path.delimiter)
  .map((value) => path.resolve(value));
const output = path.resolve(String(options.output || "skills.catalog.json"));
const files = [];
for (const root of roots) await walk(root, files);

const skillsById = new Map();
for (const file of files.sort()) {
  const metadata = parseFrontmatter(await fs.readFile(file, "utf8"));
  if (!metadata?.name || !metadata?.description || metadata.name === "jev-skill-router") continue;
  skillsById.set(metadata.name, {
    id: metadata.name,
    name: metadata.name,
    description: metadata.description.replace(/\s+/g, " ").slice(0, 600),
    path: file,
  });
}
const skills = [...skillsById.values()].sort((a, b) => a.id.localeCompare(b.id));

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify({ version: new Date().toISOString(), skills }, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output, count: skills.length })}\n`);
