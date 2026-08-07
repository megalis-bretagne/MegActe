import KeycloakProvider from "next-auth/providers/keycloak";
import { NuxtAuthHandler } from "#auth";
import type {JWT} from "next-auth/jwt";

async function refreshAccessToken(token: JWT) {
  try {
    const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    const res = await $fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=refresh_token" +
        `&client_id=${process.env.KEYCLOAK_CLIENT_ID}` +
        `&client_secret=${process.env.KEYCLOAK_CLIENT_SECRET}` +
        `&refresh_token=${token.refreshToken}`,
      // 1s était trop court pour un aller-retour OAuth2 vers Keycloak : la moindre latence
      // réseau déclenchait un RefreshAccessTokenError alors que le refresh token était valide.
      timeout: 10000,
    });

    console.log("Token rafraîchi :", res.access_token);

    return {
      ...token,
      accessToken: res.access_token,
      accessTokenExpiresAt: Date.now() + res.expires_in * 1000,
      refreshToken: res.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Échec du rafraîchissement du token Keycloak", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  providers: [
    KeycloakProvider.default({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.accessTokenExpiresAt = account.expires_at * 1000;
        token.refreshToken = account.refresh_token;
        token.refreshTokenExpiresAt =
          Date.now() + (account.refresh_expires_in as number) * 1000;
        return token;
      }

      // If the access token has not expired we return it
      if (Date.now() < (token.accessTokenExpiresAt as number)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      // Sans ça, un échec de refresh était invisible côté client : accessToken restait
      // présent (l'ancien, expiré), donc rien ne distinguait un token valide d'un stale.
      session.error = token.error;
      return session;
    },
  },
});
