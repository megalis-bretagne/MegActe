import KeycloakProvider from "next-auth/providers/keycloak";
import { NuxtAuthHandler } from "#auth";

async function refreshAccessToken(token: JWT) {
  try {
    console.log("refreshAccessToken called");
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
      timeout: 1000,
    });

    console.log("res object");
    console.log(res);
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
        console.log({ token, user, account });
        token.accessToken = account.access_token;
        token.accessTokenExpiresAt = account.expires_at * 1000;
        token.refreshToken = account.refresh_token;
        token.refreshTokenExpiresAt =
          Date.now() + (account.refresh_expires_in as number) * 1000;
        token.userId = account.providerAccountId;
        try {
          console.log("primary call to jwt callback: prefetching data");
          const pastellUser = await getPastellUser(token.accessToken);
          const prefetchStorage = useStorage(token.userId);
          await prefetchStorage.setItem("pastellUser", pastellUser);
        } catch (error) {
          token.pastellUser = null;
          console.error("Error while prefetching user", error);
        }
        return token;
      }

      console.log("jwt callback: token = ", token);
      // If the access token has not expired we return it
      if (Date.now() < (token.accessTokenExpiresAt as number)) {
        console.log("returning token", token.accessToken);
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token.userId) {
        const prefetchStorage = useStorage(token.userId);
        session.pastellUser = await prefetchStorage.getItem("pastellUser");
      } else {
        session.pastellUser = null;
      }
      session.accessToken = token.accessToken;
      console.log("returned session object");
      console.log(session);
      return session;
    },
  },
});
