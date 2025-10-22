import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

const projectRoot = process.cwd();
const cloudflareDir = path.resolve(projectRoot, '.svelte-kit/cloudflare');
const pagefindDir = path.join(cloudflareDir, 'pagefind');
const manifestPath = path.resolve(projectRoot, '.svelte-kit/cloudflare-tmp/manifest.js');

async function collectFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const fullPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        return collectFiles(fullPath);
      }
      return fullPath;
    })
  );

  return files.flat();
}

function toManifestPath(file) {
  return file.replace(cloudflareDir + path.sep, '').replace(/\\/g, '/');
}

async function main() {
  try {
    await fs.access(pagefindDir);
  } catch {
    console.warn('[pagefind] No pagefind output found, skipping manifest update.');
    return;
  }

  const manifestContent = await fs.readFile(manifestPath, 'utf-8');
  const assetsMatch = manifestContent.match(/assets:\s*new Set\((\[[^)]*\])\)/s);

  if (!assetsMatch) {
    throw new Error('Could not locate assets Set in Cloudflare manifest.');
  }

  const existingAssets = JSON.parse(assetsMatch[1]);
  const pagefindFiles = await collectFiles(pagefindDir);
  const manifestRelative = pagefindFiles.map((file) => toManifestPath(file));
  const combined = Array.from(new Set([...existingAssets, ...manifestRelative])).sort();
  const replacement = `assets: new Set([${combined.map((asset) => `"${asset}"`).join(',')}])`;
  const updatedManifest = manifestContent.replace(assetsMatch[0], replacement);

  await fs.writeFile(manifestPath, updatedManifest);
  console.log(`[pagefind] Registered ${manifestRelative.length} pagefind asset(s) in manifest.`);
}

main().catch((error) => {
  console.error('[pagefind] Failed to update manifest:', error);
  process.exitCode = 1;
});
