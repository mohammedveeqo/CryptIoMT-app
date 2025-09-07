export const UserRoles = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  ANALYST: "analyst",
  CUSTOMER: "customer"
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

// Helper functions for role checking
export const isAdminRole = (role: UserRole | null): boolean => {
  return role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN;
};

export const canAccessAdminPanel = (role: UserRole | null): boolean => {
  return isAdminRole(role);
};

export const hasAnalystAccess = (role: UserRole | null): boolean => {
  return role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN || role === UserRoles.ANALYST;
};