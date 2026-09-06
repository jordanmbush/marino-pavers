import { useCallback, useState } from "react";
import {
  completeNewPassword,
  currentUsername,
  signIn,
  signOut,
  type SignInResult,
} from "@/services/auth";

type Status =
  | { kind: "signed-out" }
  | { kind: "new-password"; username: string; session: string }
  | { kind: "signed-in"; username: string };

const initial = (): Status => {
  const username = currentUsername();
  return username ? { kind: "signed-in", username } : { kind: "signed-out" };
};

/** The admin session as UI state. All Cognito traffic goes through services/auth. */
export const useSession = () => {
  const [status, setStatus] = useState<Status>(initial);

  const login = useCallback(async (username: string, password: string) => {
    const result: SignInResult = await signIn(
      username.trim().toLowerCase(),
      password,
    );
    setStatus(
      result.kind === "signed-in"
        ? { kind: "signed-in", username: result.username }
        : {
            kind: "new-password",
            username: result.username,
            session: result.session,
          },
    );
  }, []);

  const setPassword = useCallback(
    async (password: string) => {
      if (status.kind !== "new-password") return;
      await completeNewPassword(status.username, password, status.session);
      setStatus({ kind: "signed-in", username: status.username });
    },
    [status],
  );

  const logout = useCallback(() => {
    signOut();
    setStatus({ kind: "signed-out" });
  }, []);

  return { status, login, setPassword, logout };
};
