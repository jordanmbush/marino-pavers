import { Library } from "./Library";
import { SignIn } from "./SignIn";
import { useSession } from "./useSession";

/** The hidden photo-management page. Mounted client-only: it reads the stored session on start. */
export const AdminApp = () => {
  const { status, login, setPassword, logout } = useSession();

  return (
    <div className="shell py-12 lg:py-16">
      {status.kind === "signed-in" ? (
        <Library username={status.username} onSignOut={logout} />
      ) : status.kind === "new-password" ? (
        <SignIn
          mode="new-password"
          username={status.username}
          onSubmit={setPassword}
        />
      ) : (
        <SignIn mode="sign-in" onSubmit={login} />
      )}
    </div>
  );
};
