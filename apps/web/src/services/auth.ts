import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
} from "./session-store";

/**
 * Cognito sign-in without the SDK. USER_PASSWORD_AUTH and the refresh flow
 * are unauthenticated JSON calls, so a fetch wrapper covers the whole admin
 * login in a few dozen lines and the island doesn't ship a hundred kilobytes
 * of AWS client.
 */

const REFRESH_MARGIN_MS = 60_000;

const config = () => ({
  region: import.meta.env.PUBLIC_AWS_REGION || "us-west-1",
  clientId: import.meta.env.PUBLIC_COGNITO_CLIENT_ID || "",
});

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

type AuthResult = {
  IdToken: string;
  AccessToken: string;
  RefreshToken?: string;
  ExpiresIn: number;
};

type CognitoResponse = {
  AuthenticationResult?: AuthResult;
  ChallengeName?: string;
  Session?: string;
  __type?: string;
  message?: string;
};

const call = async (
  target: string,
  body: unknown,
): Promise<CognitoResponse> => {
  const { region } = config();
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as CognitoResponse;
  if (!response.ok) {
    const code = (data.__type ?? "Unknown").split("#").pop() ?? "Unknown";
    throw new AuthError(code, friendlyMessage(code, data.message));
  }
  return data;
};

const friendlyMessage = (code: string, fallback?: string): string => {
  switch (code) {
    case "NotAuthorizedException":
      return "That email and password don't match.";
    case "UserNotFoundException":
      return "No account with that email.";
    case "PasswordResetRequiredException":
      return "Your password needs to be reset — ask for a new temporary one.";
    case "InvalidPasswordException":
      return fallback ?? "That password doesn't meet the requirements.";
    case "TooManyRequestsException":
      return "Too many attempts. Wait a minute and try again.";
    default:
      return fallback ?? "Sign-in failed. Try again.";
  }
};

const store = (
  username: string,
  result: AuthResult,
  previous?: StoredSession | null,
) => {
  const session: StoredSession = {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken ?? previous?.refreshToken,
    expiresAt: Date.now() + result.ExpiresIn * 1000,
    username,
  };
  saveSession(session);
  return session;
};

export type SignInResult =
  | { kind: "signed-in"; username: string }
  | { kind: "new-password-required"; session: string; username: string };

export const signIn = async (
  username: string,
  password: string,
): Promise<SignInResult> => {
  const data = await call("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: config().clientId,
    AuthParameters: { USERNAME: username, PASSWORD: password },
  });
  if (data.AuthenticationResult) {
    store(username, data.AuthenticationResult);
    return { kind: "signed-in", username };
  }
  if (data.ChallengeName === "NEW_PASSWORD_REQUIRED" && data.Session) {
    return { kind: "new-password-required", session: data.Session, username };
  }
  throw new AuthError(
    "UnsupportedChallenge",
    "This account needs a step the site doesn't support.",
  );
};

/** First sign-in on an admin-created account: replace the temporary password. */
export const completeNewPassword = async (
  username: string,
  newPassword: string,
  session: string,
): Promise<void> => {
  const data = await call("RespondToAuthChallenge", {
    ChallengeName: "NEW_PASSWORD_REQUIRED",
    ClientId: config().clientId,
    Session: session,
    ChallengeResponses: { USERNAME: username, NEW_PASSWORD: newPassword },
  });
  if (!data.AuthenticationResult) {
    throw new AuthError(
      "UnsupportedChallenge",
      "Cognito asked for another step.",
    );
  }
  store(username, data.AuthenticationResult);
};

const refresh = async (
  session: StoredSession,
): Promise<StoredSession | null> => {
  if (!session.refreshToken) return null;
  try {
    const data = await call("InitiateAuth", {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: config().clientId,
      AuthParameters: { REFRESH_TOKEN: session.refreshToken },
    });
    return data.AuthenticationResult
      ? store(session.username, data.AuthenticationResult, session)
      : null;
  } catch {
    return null;
  }
};

/** A valid id token, refreshing quietly when it's about to expire; null means sign in again. */
export const getIdToken = async (): Promise<string | null> => {
  const session = loadSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > REFRESH_MARGIN_MS)
    return session.idToken;
  const renewed = await refresh(session);
  if (!renewed) clearSession();
  return renewed?.idToken ?? null;
};

export const currentUsername = (): string | null =>
  loadSession()?.username ?? null;

export const signOut = (): void => clearSession();
