import { NextResponse } from "next/server";

import {
  adminSessionCookie,
  createAdminSession,
  getAdminCredentials,
  isAdminAuthConfigured,
} from "@/lib/admin-auth";

type LoginBody = {
  username?: unknown;
  password?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return jsonError("请求内容不是有效 JSON");
  }

  if (!isAdminAuthConfigured()) {
    return jsonError("后台登录环境变量未配置", 500);
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const credentials = getAdminCredentials();

  if (username !== credentials.username || password !== credentials.password) {
    return jsonError("账号或密码错误", 401);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookie.name, createAdminSession(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: adminSessionCookie.maxAge,
  });

  return response;
}
