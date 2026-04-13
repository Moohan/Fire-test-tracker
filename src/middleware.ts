import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

    if (isAdminPage && token?.role !== "ADMIN") {
      // If the user is authenticated but not an admin, redirect to login with an error
      // or redirect to dashboard. Aligning with review to avoid confusion.
      // Redirecting to login with a specific error might be overkill if we dont have
      // an error handler for it. Redirecting to dashboard is safe but review said
      // it might be confusing if expectations are to go to login.
      // Actually, if they are logged in, /login usually redirects to / if using middleware.
      // I will stick to /dashboard but make it explicit in comments or consider /login.
      // Review says: "aligning the redirect target ... so behavior matches expectations".
      // Expectations for unauthorized is usually a 403 or redirect to login.
      return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/log/:path*",
  ],
};
