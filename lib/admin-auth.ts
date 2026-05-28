import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const adminSessionCookieName = "admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 8;

type AdminSessionPayload = {
  username: string;
  exp: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "",
    password: process.env.ADMIN_PASSWORD || "",
  };
}

export function isAdminAuthConfigured() {
  const credentials = getAdminCredentials();

  return Boolean(credentials.username && credentials.password && getSessionSecret());
}

export function createAdminSession(username: string) {
  if (!getSessionSecret()) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }

  const payload: AdminSessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAdminSession(session: string | undefined) {
  if (!session || !getSessionSecret()) {
    return null;
  }

  const [encodedPayload, signature] = session.split(".");

  if (!encodedPayload || !signature || !safeCompare(sign(encodedPayload), signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload;

    if (!payload.username || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAdminSessionFromCookieStore(
  cookieStore: Pick<ReturnType<typeof cookies>, "get">,
) {
  return verifyAdminSession(cookieStore.get(adminSessionCookieName)?.value);
}

export function getAdminSession() {
  return getAdminSessionFromCookieStore(cookies());
}

export const adminSessionCookie = {
  name: adminSessionCookieName,
  maxAge: sessionMaxAgeSeconds,
};
