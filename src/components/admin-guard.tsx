import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { AdminShellSkeleton, AdminTablePageSkeleton } from "./dashboard-skeleton";
import { LoadingRegion } from "./loading-region";

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
    return (
      <LoadingRegion label={isSigningOut ? "Signing out" : "Checking administrator access"}>
        <AdminShellSkeleton>
          <AdminTablePageSkeleton />
        </AdminShellSkeleton>
      </LoadingRegion>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
