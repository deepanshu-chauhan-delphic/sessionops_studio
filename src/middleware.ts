import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/assistants/:path*",
    "/sessions/:path*",
    "/audit/:path*",
  ],
};
