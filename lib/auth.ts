import type { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      // twitter's v2 profile shape: profile.data.{id, username, name, profile_image_url}
      if (account && profile) {
        const p: any = (profile as any).data ?? profile;
        token.xId = p.id;
        token.xUsername = p.username;
        token.xImage = p.profile_image_url;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).xId = token.xId;
      (session as any).xUsername = token.xUsername;
      (session as any).xImage = token.xImage;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
