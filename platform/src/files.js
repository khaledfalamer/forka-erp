// Private file storage: Cloud Storage bucket (FILES_BUCKET, e.g. forka-apps-files) on Google Cloud,
// or a local folder (FILES_DIR) for tests. Files are never public; the server checks who may open each one.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

let gcs = null;
async function bucket() {
  if (!gcs) { const { Storage } = await import('@google-cloud/storage'); gcs = new Storage().bucket(process.env.FILES_BUCKET); }
  return gcs;
}
const safe = name => String(name).replace(/[^A-Za-z0-9/_.-]/g, '_');

export async function putFile(name, bytes, type, meta = {}) {
  name = safe(name);
  if (process.env.FILES_BUCKET) {
    await (await bucket()).file(name).save(bytes, { contentType: type, resumable: false, metadata: { metadata: meta } });
    return;
  }
  const dir = process.env.FILES_DIR || '/tmp/forka-files', f = path.join(dir, name);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, bytes); writeFileSync(f + '.meta.json', JSON.stringify({ type, meta }));
}

export async function getFile(name) {
  name = safe(name);
  if (process.env.FILES_BUCKET) {
    const file = (await bucket()).file(name);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [[bytes], [md]] = await Promise.all([file.download(), file.getMetadata()]);
    return { bytes, type: md.contentType || 'application/octet-stream', meta: md.metadata || {} };
  }
  const dir = process.env.FILES_DIR || '/tmp/forka-files', f = path.join(dir, name);
  if (!existsSync(f)) return null;
  const m = JSON.parse(readFileSync(f + '.meta.json', 'utf8'));
  return { bytes: readFileSync(f), type: m.type, meta: m.meta || {} };
}
