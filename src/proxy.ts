import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROUTE_TERPROTEKSI = [
  "/dashboard",
  "/attendance",
  "/overtime",
  "/reports",
  "/settings",
];

const COOKIE_SESI = "mock_session";
const COOKIE_ROLE = "mock_role";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

  const perluProteksi = ROUTE_TERPROTEKSI.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (!perluProteksi) {
    if (pathname === "/login") {
      const sesi = request.cookies.get(COOKIE_SESI)?.value;
      if (sesi) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  if (mockMode) {
    const sesi = request.cookies.get(COOKIE_SESI)?.value;
    if (!sesi) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = request.cookies.get(COOKIE_ROLE)?.value;
    if (pathname.startsWith("/settings") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Fase backend: cek sesi Supabase (dipasang di Fase 5).
  const sesi = request.cookies.get(COOKIE_SESI)?.value;
  if (!sesi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/attendance/:path*",
    "/overtime/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
  ],
};
