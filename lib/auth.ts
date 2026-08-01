import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "../auth.config";
import { db } from "./db";
import { verifyPassword } from "./auth-utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email as string }
          });

          if (!user) {
            return null;
          }

          const isValid = verifyPassword(credentials.password as string, user.password);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email || '',
            name: user.name || '',
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
});
