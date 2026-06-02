import KeycloakProvider from "next-auth/providers/keycloak";
import { NuxtAuthHandler } from "#auth";

export default NuxtAuthHandler({
  secret: "secret",
  providers: [
    KeycloakProvider.default({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        console.log("objects:");
        console.log({ token, user, account });
        token.accessToken = account.access_token;
        token.accessTokenExpires = account.expires_at
        token.refreshToken = account.refresh_token
        token.refreshTokenExpires = Date.now() + (account.refresh_expires_in as number) * 1000
      }

      // If the access token has not expired we return it
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // refresh to access token if it has expired
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
