import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { PRIVILEGED_ROLES } from "./lib/roles";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;
    const role = token?.role as string;

    // Admin-only areas
    if (
      pathname.startsWith("/admin") &&
      !(PRIVILEGED_ROLES as readonly string[]).includes(role)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/log/:path*",
    "/reports/:path*",
  ],
};
