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

  if (nextUrl.pathname === "/register") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (user?.role !== "SUPER_ADMIN" && user?.role !== "TRANSPORT_MANAGER") {
      return NextResponse.redirect(new URL("/driver", nextUrl));
    }
    return NextResponse.next();
  }

  if (isAuthRoute || isLandingRoute) {
    const hasError = nextUrl.searchParams.has("error") || nextUrl.searchParams.has("clear");
    if (isLoggedIn && !hasError) {
      if (user?.role === "DRIVER") {
        return NextResponse.redirect(new URL("/driver", nextUrl));
      } else if (user?.role === "SUPER_ADMIN" || user?.role === "TRANSPORT_MANAGER") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      } else {
        // If logged in but has no valid role, let them stay/continue to avoid loops
        return NextResponse.next();
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
      if (user?.role === "DRIVER") {
        return NextResponse.redirect(new URL("/driver", nextUrl));
      }
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith("/driver")) {
    if (user?.role !== "DRIVER") {
      if (user?.role === "SUPER_ADMIN" || user?.role === "TRANSPORT_MANAGER") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      }
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|logo\\.png|hero\\.mp4|images|.*\\..*$).*)"],
};
