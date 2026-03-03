/* ─── Docilog Local Auth Library (MOCK) ─── */
/* ⚠️ LOCAL PRESET DB - NO SUPABASE CONNECTION */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "docilog_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/* ── Types ── */

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  role: "master_admin" | "project_user";
  avatar_url: string | null;
}

export interface SessionData {
  user: AuthUser;
  token: string;
  expires_at: string;
}

/* ── MOCK DATA ── */

const MOCK_USERS: AuthUser[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    username: "admin",
    display_name: "Master Admin",
    role: "master_admin",
    avatar_url: null,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    username: "cenk",
    display_name: "Cenk Akyoldaş",
    role: "project_user",
    avatar_url: null,
  },
];

const PRESET_CREDENTIALS: Record<string, string> = {
  "admin": "docilog123",
  "cenk": "cenk123",
};

/* ── Login ── */

export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
  // Wait slightly to simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  const validPassword = PRESET_CREDENTIALS[username];
  
  if (!validPassword) {
    return { success: false, error: "Kullanıcı bulunamadı" };
  }

  if (validPassword !== password) {
    return { success: false, error: "Hatalı şifre" };
  }

  const user = MOCK_USERS.find((u) => u.username === username);
  if (!user) {
    return { success: false, error: "Kullanıcı verisi bulunamadı" };
  }

  // Stateless mock token
  const token = `mock_session_${user.id}_${Date.now()}`;

  return { success: true, user, token };
}

/* ── Get current session ── */

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  if (!token.startsWith("mock_session_")) return null;

  const parts = token.split("_");
  const userId = parts[2];

  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) return null;

  return {
    user,
    token,
    expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
  };
}

/* ── Verify request auth (API routes) ── */

export async function verifyAuth(
  request: NextRequest
): Promise<AuthUser | null> {
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token || !token.startsWith("mock_session_")) return null;

  const parts = token.split("_");
  const userId = parts[2];

  const user = MOCK_USERS.find((u) => u.id === userId);
  return user || null;
}

/* ── Check project access ── */

export async function checkProjectAccess(
  user: AuthUser,
  projectSlug: string
): Promise<boolean> {
  if (user.role === "master_admin") return true;

  // Cenk only has access to finance-blog
  if (user.username === "cenk" && projectSlug === "finance-blog") return true;

  return false;
}

/* ── Logout ── */

export async function logoutUser(token: string): Promise<void> {
  // Stateless token so we do nothing here. The cookie clear is handled by the route.
}

/* ── Set session cookie ── */

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/* ── Clear session cookie ── */

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
