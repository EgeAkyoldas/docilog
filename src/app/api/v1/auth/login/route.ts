import { NextRequest, NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gerekli" },
        { status: 400 }
      );
    }

    const result = await loginUser(username, password);

    if (!result.success || !result.token || !result.user) {
      return NextResponse.json(
        { error: result.error ?? "Giriş başarısız" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      user: result.user,
    });

    setSessionCookie(response, result.token);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
