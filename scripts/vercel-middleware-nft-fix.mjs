import fs from 'node:fs'
import path from 'node:path'

function fileExists(filePath) {
  try {
    fs.accessSync(filePath)
    return true
  } catch {
    return false
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value))
}

// Vercel's packaging step expects this file to exist:
//   .next/server/middleware.js.nft.json
// With Next 16 + Turbopack, middleware output is edge-based and Next may only emit:
//   .next/server/middleware-manifest.json
//   .next/server/middleware/...
// This script generates a minimal NFT trace JSON to avoid ENOENT.

const projectRoot = process.cwd()
const nextDir = path.join(projectRoot, '.next')
const serverDir = path.join(nextDir, 'server')
const nftPath = path.join(serverDir, 'middleware.js.nft.json')

if (fileExists(nftPath)) {
  process.exit(0)
}

const middlewareManifestPath = path.join(serverDir, 'middleware-manifest.json')
if (!fileExists(middlewareManifestPath)) {
  // Not a build with middleware, or build output structure changed.
  process.exit(0)
}

const middlewareManifest = readJson(middlewareManifestPath)
const rootMiddleware = middlewareManifest?.middleware?.['/']

const files = new Set()

for (const file of rootMiddleware?.files ?? []) {
  if (typeof file !== 'string') continue

  // The manifest uses paths relative to `.next/` like `server/edge/...`.
  // The `.nft.json` file lives in `.next/server/`, so strip `server/`.
  const normalized = file.startsWith('server/') ? file.slice('server/'.length) : file

  // Only include paths that actually exist relative to `.next/server/`.
  const absolute = path.join(serverDir, normalized)
  if (fileExists(absolute)) files.add(normalized)
}

// Include the middleware manifests themselves if present.
for (const extra of ['middleware-manifest.json', 'middleware-build-manifest.js']) {
  const absolute = path.join(serverDir, extra)
  if (fileExists(absolute)) files.add(extra)
}

// If we still have no files, don't write a misleading trace.
if (files.size === 0) {
  process.exit(0)
}

writeJson(nftPath, { version: 1, files: Array.from(files) })
