/**
 * The admin page's lock: one password (ADMIN_PASSWORD, set in Vercel), and a
 * signed, http-only cookie once it has been given. Server only.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "am_admin";
const WEEK = 60 * 60 * 24 * 7;

function secret() {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length >= 8 ? pw : null;
}

const sign = (value: string, key: string) => createHmac("sha256", key).update(value).digest("hex");

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminConfigured() {
  return secret() !== null;
}

export function passwordMatches(input: string) {
  const key = secret();
  // Compare digests so the check takes the same time whatever the input's length.
  return !!key && same(sign(input, "am-admin-password"), sign(key, "am-admin-password"));
}

/** Cookie value: expiry and a signature over it, keyed by the password (changing the password signs everyone out). */
export function newSession() {
  const key = secret()!;
  const exp = String(Math.floor(Date.now() / 1000) + WEEK);
  return { value: `${exp}.${sign(exp, key)}`, maxAge: WEEK };
}

export async function isAdmin() {
  const key = secret();
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!key || !raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return same(sig, sign(exp, key));
}
