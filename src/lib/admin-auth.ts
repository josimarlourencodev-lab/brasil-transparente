import { createHash, timingSafeEqual } from "crypto";

const PEPPER = "brasil-transparente:admin:v1";

export function adminHash(): string {
  return createHash("sha256")
    .update(`${process.env.ADMIN_PASSWORD ?? ""}${PEPPER}`)
    .digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function isAdminCookie(value: string | undefined): boolean {
  if (!value) return false;
  return safeEqual(value, adminHash());
}

export function isAdminCookieHeader(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  const match = /(?:^|;\s*)bt_admin=([^;]+)/.exec(cookieHeader);
  if (!match) return false;
  return isAdminCookie(decodeURIComponent(match[1]));
}