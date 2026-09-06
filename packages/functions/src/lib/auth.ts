import { CognitoJwtVerifier } from "aws-jwt-verify";

export type Principal = { sub: string; email?: string };

export type VerifyToken = (token: string) => Promise<Principal>;

/**
 * Checks the signature, expiry, issuer and audience of a Cognito ID token.
 * The verifier caches the pool's JWKS across invocations, so create it once.
 */
export const createCognitoVerifier = ({
  userPoolId,
  clientId,
}: {
  userPoolId: string;
  clientId: string;
}): VerifyToken => {
  const verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: "id",
  });
  return async (token) => {
    const payload = await verifier.verify(token);
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  };
};
