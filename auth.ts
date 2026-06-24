import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret
    })
  ],
  callbacks: {
    signIn({ account, user }) {
      console.info("Hoodwinked host sign-in", {
        email: user.email,
        provider: account?.provider
      });
      return true;
    }
  },
  logger: {
    error(error) {
      console.error("Hoodwinked auth error", error);
    },
    warn(code) {
      console.warn("Hoodwinked auth warning", code);
    },
    debug(message, metadata) {
      if (process.env.AUTH_DEBUG === "true") {
        console.debug("Hoodwinked auth debug", message, metadata);
      }
    }
  },
  trustHost: true
});
