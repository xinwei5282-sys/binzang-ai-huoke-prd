import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function readServedSource(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function ensurePrototypeServer(root, { port = 8010, startIfMissing = true } = {}) {
  const url = `http://127.0.0.1:${port}/index.html`;
  const local = readFileSync(resolve(root, 'prototype/index.html'));
  const localSha = sha256(local);
  try {
    const served = await readServedSource(url);
    const servedSha = sha256(served);
    if (servedSha !== localSha) throw new Error(`port ${port} serves different content (${servedSha} != ${localSha})`);
    return { url, sha256: localSha, server: 'reused' };
  } catch (error) {
    if (!startIfMissing || /serves different content/.test(error.message)) throw error;
  }

  const serverProcess = spawn('python3', ['-m', 'http.server', String(port), '--directory', resolve(root, 'prototype')], { cwd: root, detached: true, stdio: 'ignore' });
  serverProcess.unref();
  const deadline = Date.now() + 8000;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const served = await readServedSource(url);
      const servedSha = sha256(served);
      if (servedSha !== localSha) throw new Error(`started server content mismatch (${servedSha} != ${localSha})`);
      return { url, sha256: localSha, server: 'started', pid: serverProcess.pid };
    } catch (error) {
      lastError = error.message;
    }
    await new Promise(resolveWait => setTimeout(resolveWait, 120));
  }
  throw new Error(`prototype server did not become ready: ${lastError}`);
}
