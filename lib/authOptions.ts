
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { compare } from "bcryptjs";

export const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("=== LOGIN ATTEMPT ===");
        console.log("Username:", credentials?.username);
        console.log("USE_REAL_DB:", process.env.USE_REAL_DB);
        console.log("MONGODB_URI exists:",
          !!process.env.MONGODB_URI);
        console.log("MONGODB_DB:", process.env.MONGODB_DB);

        if (!credentials?.username || !credentials.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          const db = await getDb();
          console.log("Database connection obtained");
          const user = await db.collection("users").findOne({
            username: credentials.username
          });
          console.log("User found:", user ? "yes" : "no");
          if (user) {
            console.log("User data:", {
              username: user.username,
              name: user.name, hasHash: !!user.passwordHash
            });
          }

          if (!user || !user.passwordHash) {
            console.log("No user or no hash");
            return null;
          }

          const isValid = await compare(credentials.password as
            string, user.passwordHash as string);
          console.log("Password valid:", isValid);

          if (!isValid) return null;

          return {
            id: String(user._id),
            name: user.name as string,
            email: user.username as string
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  trustHost: true
};
