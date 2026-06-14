export type AppUserRole = "owner" | "manager" | "employee";

export type AppUserRecord = {
  id: string;
  full_name: string;
  role: AppUserRole;
  active: boolean;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export function getAppUserRoleLabel(role: AppUserRole) {
  if (role === "owner") return "Admin principal";
  if (role === "manager") return "Manager";
  return "Employe";
}

export function canManageAppUsers(role: AppUserRole) {
  return role === "owner";
}
