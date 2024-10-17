import { NextResponse } from "next/server";

export async function middleware(request) {
  try {
    const { pathname } = request.nextUrl;
    const dashboardPattern = /^\/dashboard\/.+$/;
    const accessToken = request.cookies.get("accessToken")?.value;

    const isDashboardPath = dashboardPattern.test(pathname);
    const isHomePage = pathname === "/";

    if (!accessToken && isDashboardPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (accessToken && isHomePage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
