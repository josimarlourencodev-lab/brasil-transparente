import { NextResponse } from "next/server";
import { adminHash, safeEqual } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD ?? "";

  if (!safeEqual(body.password ?? "", expected)) {
    return NextResponse.json({ error: "Senha inválida." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("bt_admin", adminHash(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}