import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";

export function AdminGuardWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isAdmin, pathname, router]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
