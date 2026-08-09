import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const user = req.auth?.user;

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthRoute = nextUrl.pathname === "/login";
  const isLandingRoute = nextUrl.pathname === "/";

  // Allow API routes to be handled separately
  if (isApiRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute || isLandingRoute) {
    if (isLoggedIn) {
      if (user?.role === "DRIVER") {
        return NextResponse.redirect(new URL("/driver", nextUrl));
      } else {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      }
    }
    // Allow access to login or landing page
    return NextResponse.next();
  }

  // Protected route checking
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/admin")) {
    if (user?.role !== "SUPER_ADMIN" && user?.role !== "TRANSPORT_MANAGER") {
      return NextResponse.redirect(new URL("/driver", nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith("/driver")) {
    if (user?.role !== "DRIVER") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|logo\\.png|hero\\.mp4|images|.*\\..*$).*)"],
};
