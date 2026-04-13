import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based protection
    if (path.startsWith("/admin") && token?.role !== "ADMIN" && token?.role !== "WC" && token?.role !== "CC") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/reports") && token?.role !== "ADMIN" && token?.role !== "WC" && token?.role !== "CC") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/log/:path*", "/reports/:path*"],
};
