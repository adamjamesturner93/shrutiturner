import { auth } from "@/lib/auth";
import { isOwnerAdminRole, isStaffAdminRole } from "@/lib/authz/roles";

export async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}

export async function requireStaffAdminUser() {
  const user = await requireSessionUser();
  if (!isStaffAdminRole(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireOwnerAdminUser() {
  const user = await requireSessionUser();
  if (!isOwnerAdminRole(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
