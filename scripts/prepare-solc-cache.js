#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SOLC_VERSION = '0.8.20';
const BASE_URL = 'https://binaries.soliditylang.org';
const cacheRoot = path.join(os.homedir(), '.cache', 'hardhat-nodejs', 'compilers-v3');

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function download(url, dest) {
  execFileSync('curl', ['-fsSL', url, '-o', dest], { stdio: 'inherit' });
}

function getBuildPath(listPath, version) {
  const list = JSON.parse(readFileSync(listPath, 'utf8'));
  const build = list.builds.find((entry) => entry.version === version);
  if (!build) {
    throw new Error(`Could not find solc ${version} in ${listPath}`);
  }
  return build.path;
}

function ensureCompiler(platform) {
  const platformDir = path.join(cacheRoot, platform);
  ensureDir(platformDir);

  const listPath = path.join(platformDir, 'list.json');
  if (!existsSync(listPath)) {
    download(`${BASE_URL}/${platform}/list.json`, listPath);
  }

  const buildPath = getBuildPath(listPath, SOLC_VERSION);
  const compilerPath = path.join(platformDir, buildPath);
  if (!existsSync(compilerPath)) {
    download(`${BASE_URL}/${platform}/${buildPath}`, compilerPath);
  }

  if (platform === 'linux-amd64') {
    chmodSync(compilerPath, 0o755);
  }
}

ensureCompiler('linux-amd64');
ensureCompiler('wasm');
console.log(`Prepared local solc cache for ${SOLC_VERSION}`);
