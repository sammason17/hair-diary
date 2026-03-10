
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { compare } from "bcryptjs";

export const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || "hair-diary");
        const user = await db.collection("users").findOne({ email: credentials.email });
        if (!user || !user.passwordHash) return null;
        const isValid = await compare(credentials.password, user.passwordHash as string);
        if (!isValid) return null;
        return { id: String(user._id), name: user.name as string, email: user.email as string };
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  }
};
