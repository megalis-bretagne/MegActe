import KeycloakProvider from "next-auth/providers/keycloak";
import { NuxtAuthHandler } from "#auth";
import type { JWT } from "next-auth/jwt";

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

    // Keycloak peut répondre 200 sans access_token (ex: refresh concurrent) : sans ce contrôle,
    // la session restait corrompue silencieusement (accessToken undefined, pas d'erreur).
    if (!res.access_token) {
      throw new Error("Réponse de rafraîchissement Keycloak sans access_token");
    }

    return {
      ...token,
      accessToken: res.access_token,
      accessTokenExpiresAt: Date.now() + res.expires_in * 1000,
      refreshToken: res.refresh_token ?? token.refreshToken,
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
  secret: process.env.NUXT_AUTH_SECRET,
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
        // Nécessaire pour la déconnexion Keycloak (id_token_hint) : sans lui, signOut() ne coupe
        // que la session locale, la session SSO Keycloak resterait active.
        token.idToken = account.id_token;
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
    // AUTH_ORIGIN inclut "/auth" (requis par sidebase) : le redirect par défaut de next-auth
    // concatène baseUrl+url, donc un callbackUrl "/" atterrissait sur ".../auth/" au lieu de "/".
    async redirect({ url, baseUrl }) {
      const appOrigin = new URL(baseUrl).origin;
      if (url.startsWith("/")) return `${appOrigin}${url}`;
      if (new URL(url).origin === appOrigin) return url;
      return appOrigin;
    },
  },
});
