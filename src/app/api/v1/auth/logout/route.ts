import { NextRequest, NextResponse } from "next/server";
import { logoutUser, clearSessionCookie, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (token) {
      await logoutUser(token);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Çıkış hatası" },
      { status: 500 }
    );
  }
}
