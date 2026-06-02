import KeycloakProvider from "next-auth/providers/keycloak";
import { NuxtAuthHandler } from "#auth";

async function refreshAccessToken(token: JWT) {
  try {
    console.log("refreshAccessToken called");
    const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    const req = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=refresh_token" +
        `&client_id=${process.env.KEYCLOAK_CLIENT_ID}` +
        `&client_secret=${process.env.KEYCLOAK_CLIENT_SECRET}` +
        `&refresh_token=${token.refreshToken}`,
    });

    const res = await req.json();
    console.log("new access token", res.access_token);
    return {
      ...token,
      accessToken: res.access_token,
      accessTokenExpiresAt: Date.now() + res.expires_in * 1000,
      refreshToken: res.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error(error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

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
        token.accessTokenExpiresAt = account.expires_at;
        token.refreshToken = account.refresh_token;
        token.refreshTokenExpiresAt =
          Date.now() + (account.refresh_expires_in as number) * 1000;
      }

      // If the access token has not expired we return it
      if (Date.now() < (token.accessTokenExpiresAt as number)) {
        console.log("returning token", token.accessToken);
        return token;
      }

      // refresh to access token if it has expired
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
