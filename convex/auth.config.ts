// Clerk -> Convex. Create a JWT template named "convex" in Clerk (Application ID "convex") and add the
// claim  "role": "{{user.public_metadata.role}}"  so admin checks can read it from the identity.
// Until CLERK_JWT_ISSUER_DOMAIN is set in the Convex env, no auth provider is registered.
const domain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

export default {
  providers: domain ? [{ domain, applicationID: "convex" }] : [],
};
