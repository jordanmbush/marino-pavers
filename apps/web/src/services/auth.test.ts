import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getIdToken, signIn, signOut } from "./auth";
import { loadSession, saveSession } from "./session-store";

const memory = new Map<string, string>();
const fakeStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
};

const respond = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  memory.clear();
  vi.stubGlobal("window", { localStorage: fakeStorage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("signIn", () => {
  it("stores the tokens on success", async () => {
    vi.stubGlobal("fetch", () =>
      respond(200, {
        AuthenticationResult: {
          IdToken: "id",
          AccessToken: "ac",
          RefreshToken: "rf",
          ExpiresIn: 3600,
        },
      }),
    );
    const result = await signIn("Client@Example.com ", "pw");
    expect(result).toEqual({
      kind: "signed-in",
      username: "Client@Example.com ",
    });
    expect(loadSession()?.idToken).toBe("id");
    expect(loadSession()?.refreshToken).toBe("rf");
  });

  it("surfaces the new-password challenge", async () => {
    vi.stubGlobal("fetch", () =>
      respond(200, { ChallengeName: "NEW_PASSWORD_REQUIRED", Session: "s1" }),
    );
    const result = await signIn("a@b.c", "temp");
    expect(result).toEqual({
      kind: "new-password-required",
      session: "s1",
      username: "a@b.c",
    });
    expect(loadSession()).toBeNull();
  });

  it("maps Cognito errors to plain words", async () => {
    vi.stubGlobal("fetch", () =>
      respond(400, {
        __type: "NotAuthorizedException",
        message: "Incorrect username or password.",
      }),
    );
    await expect(signIn("a@b.c", "wrong")).rejects.toThrow("don't match");
  });
});

describe("getIdToken", () => {
  it("returns a fresh token without calling Cognito", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    saveSession({
      idToken: "fresh",
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 10 * 60_000,
      username: "u",
    });
    expect(await getIdToken()).toBe("fresh");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refreshes a token about to expire and keeps the refresh token", async () => {
    vi.stubGlobal("fetch", () =>
      respond(200, {
        AuthenticationResult: {
          IdToken: "renewed",
          AccessToken: "a2",
          ExpiresIn: 3600,
        },
      }),
    );
    saveSession({
      idToken: "stale",
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 10_000,
      username: "u",
    });
    expect(await getIdToken()).toBe("renewed");
    expect(loadSession()?.refreshToken).toBe("r");
  });

  it("clears the session when the refresh is refused", async () => {
    vi.stubGlobal("fetch", () =>
      respond(400, {
        __type: "NotAuthorizedException",
        message: "Refresh Token has expired",
      }),
    );
    saveSession({
      idToken: "stale",
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() - 1,
      username: "u",
    });
    expect(await getIdToken()).toBeNull();
    expect(loadSession()).toBeNull();
  });

  it("is null after sign-out", async () => {
    saveSession({
      idToken: "x",
      accessToken: "a",
      expiresAt: Date.now() + 1e6,
      username: "u",
    });
    signOut();
    expect(await getIdToken()).toBeNull();
  });
});
