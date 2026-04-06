import type { UserRole } from "@prisma/client";

export function isStaffAdminRole(role: UserRole | string | null | undefined) {
  return role === "owner_admin" || role === "admin";
}

export function isOwnerAdminRole(role: UserRole | string | null | undefined) {
  return role === "owner_admin";
}

export function isMemberRole(role: UserRole | string | null | undefined) {
  return role === "member" || role === "student";
}
