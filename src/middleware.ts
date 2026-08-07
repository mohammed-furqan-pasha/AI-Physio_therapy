import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, images, and favicon.
     * Auth-protected route checks happen inside updateSession().
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/).*)",
  ],
};
