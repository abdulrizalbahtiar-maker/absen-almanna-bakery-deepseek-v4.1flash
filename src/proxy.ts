import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROUTE_TERPROTEKSI = [
  "/dashboard",
  "/attendance",
  "/overtime",
  "/reports",
  "/settings",
];

const ROUTE_ADMIN = ["/settings", "/reports"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Verifikasi JWT lokal (tanpa round-trip ke server Supabase).
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as { sub?: string; app_metadata?: { role?: string } } | undefined;
  const userId = claims?.sub ?? null;

  const { pathname } = request.nextUrl;
  const perluProteksi = ROUTE_TERPROTEKSI.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (!perluProteksi) {
    if (pathname === "/login" && userId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Cek role admin-only dari claim JWT (tanpa query DB).
  const adminSaja = ROUTE_ADMIN.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  if (adminSaja) {
    const role = claims?.app_metadata?.role;
    if (role && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Kalau claim role belum ada (user lama), biarkan lewat —
    // guard di halaman + RLS tetap jadi otoritas final.
  }

  return response;
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
