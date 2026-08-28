import { getToken } from "#auth";

// signOut() de next-auth ne coupe que la session locale : sans cet appel end_session à
// Keycloak, la session SSO resterait active et reconnecterait silencieusement l'utilisateur.
export default eventHandler(async (event) => {
  const token = await getToken({ event });
  const issuer = process.env.KEYCLOAK_ISSUER;

  if (!issuer) {
    return { url: null };
  }

  const url = new URL(`${issuer}/protocol/openid-connect/logout`);
  if (token?.idToken) {
    url.searchParams.set("id_token_hint", token.idToken as string);
  } else if (process.env.KEYCLOAK_CLIENT_ID) {
    // Fallback pour les sessions ouvertes avant l'ajout d'idToken au JWT : Keycloak accepte
    // client_id à la place de id_token_hint si post_logout_redirect_uri est fourni.
    url.searchParams.set("client_id", process.env.KEYCLOAK_CLIENT_ID);
  }
  url.searchParams.set("post_logout_redirect_uri", getRequestURL(event).origin);

  return { url: url.toString() };
});
