import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";

export function AdminGuardWrapper({ children }: { children: React.ReactNode }) {
  const { authStatus, isSigningOut, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === "loading" || isSigningOut) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [authStatus, isSigningOut, isAuthenticated, isAdmin, pathname, router]);

  if (authStatus === "loading" || isSigningOut) {
    return null;
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
