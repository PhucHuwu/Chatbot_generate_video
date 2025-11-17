import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Chặn truy cập tới Swagger UI và OpenAPI JSON khi chạy ở môi trường production.
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (process.env.NODE_ENV === "production") {
        if (pathname === "/openapi.json" || pathname.startsWith("/swagger")) {
            // Chuyển hướng về trang chủ (hoặc 404) trong production
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return NextResponse.next();
}

// Chỉ chạy middleware cho các đường dẫn liên quan tới swagger/openapi
export const config = {
    matcher: ["/swagger/:path*", "/openapi.json"],
};
