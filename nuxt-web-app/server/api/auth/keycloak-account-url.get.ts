// Identifiants gérés par Keycloak, pas par cette appli : redirige vers sa console de compte
// plutôt que d'implémenter un formulaire de mot de passe ici.
export default eventHandler(() => {
  const issuer = process.env.KEYCLOAK_ISSUER;

  if (!issuer) {
    return { url: null };
  }

  return { url: `${issuer}/account` };
});
