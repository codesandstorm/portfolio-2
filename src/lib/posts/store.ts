/**
 * Where live posts are kept: one private JSON file in Vercel Blob in
 * production, a local file in development (no token needed). Server only.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { BlobNotFoundError, get, put } from "@vercel/blob";
import type { LivePost } from "@/content/live";

const BLOB_PATH = "linkedin/posts.json";
const LOCAL_FILE = path.join(process.cwd(), ".data", "linkedin-posts.json");

const blobConfigured = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export class StoreNotConfigured extends Error {
  constructor() {
    super("No Blob store is connected. Create one in Vercel (Storage → Blob) so BLOB_READ_WRITE_TOKEN is set.");
  }
}

export async function readPosts(): Promise<LivePost[]> {
  try {
    if (blobConfigured()) {
      const res = await get(BLOB_PATH, { access: "private", useCache: false });
      if (!res || res.statusCode !== 200) return [];
      return (await new Response(res.stream).json()) as LivePost[];
    }
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")) as LivePost[];
  } catch (e) {
    // Nothing published yet is the normal first state, not an error.
    if (e instanceof BlobNotFoundError || (e as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error("[posts] read failed", e);
    return [];
  }
}

export async function writePosts(posts: LivePost[]) {
  const body = JSON.stringify(posts, null, 2);
  if (blobConfigured()) {
    await put(BLOB_PATH, body, { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
    return;
  }
  // Vercel's file system is read-only: without Blob, publishing only works locally.
  if (process.env.VERCEL) throw new StoreNotConfigured();
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, body);
}
