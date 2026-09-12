import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

type Props =
  | {
      mode: "sign-in";
      onSubmit: (username: string, password: string) => Promise<void>;
    }
  | {
      mode: "new-password";
      username: string;
      onSubmit: (password: string) => Promise<void>;
    };

export const SignIn = (props: Props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (props.mode === "new-password" && password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      if (props.mode === "sign-in") await props.onSubmit(username, password);
      else await props.onSubmit(password);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-tile border border-taupe-900/10 bg-white p-8 shadow-paver"
    >
      <div>
        <span className="eyebrow text-taupe-700">Photo library</span>
        <h1 className="mt-2 text-2xl">
          {props.mode === "sign-in" ? "Sign in" : "Choose a new password"}
        </h1>
        {props.mode === "new-password" && (
          <p className="mt-2 text-sm text-taupe-900/70">
            First sign-in for {props.username}. Pick a password of at least 12
            characters with upper and lower case letters and a number.
          </p>
        )}
      </div>

      {props.mode === "sign-in" && (
        <Field label="Email" htmlFor="username">
          <Input
            id="username"
            type="email"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
      )}

      <Field
        label={props.mode === "sign-in" ? "Password" : "New password"}
        htmlFor="password"
      >
        <Input
          id="password"
          type="password"
          autoComplete={
            props.mode === "sign-in" ? "current-password" : "new-password"
          }
          required
          minLength={props.mode === "new-password" ? 12 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {props.mode === "new-password" && (
        <Field label="Confirm password" htmlFor="confirm">
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      )}

      {error && (
        <p className="text-sm text-taupe-700" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy
          ? "One moment…"
          : props.mode === "sign-in"
            ? "Sign in"
            : "Save password"}
      </Button>
    </form>
  );
};
