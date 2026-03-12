import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "./constants";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function getSessionSecret() {
  return process.env.OPS_SESSION_SECRET || process.env.ADMIN_PASSWORD || "agentpick-ops-session";
}

function signPassword(password: string) {
  return createHmac("sha256", getSessionSecret()).update(password).digest("hex");
}

export function isValidAdminPassword(password: string) {
  const expected = getAdminPassword();
  if (!expected) return false;
  const actualBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createSessionValue() {
  return signPassword(getAdminPassword());
}

export function isValidSession(value?: string | null) {
  const password = getAdminPassword();
  if (!password || !value) return false;
  const expected = signPassword(password);
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function requireOpsPageAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidSession(session)) {
    redirect("/admin/ops/login");
  }
}

export function authFailure(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function requireOpsApiAuth(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length);
    if (isValidAdminPassword(token)) {
      return;
    }
  }

  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (isValidSession(session)) {
    return;
  }

  throw authFailure();
}

export function setSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createSessionValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
