import type { UserRole } from "@/lib/mock-data";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const STORAGE_KEYS = {
  users: "maison-waret-v2-users",
  session: "maison-waret-v2-session",
} as const;

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredUsers() {
  return readJson<StoredUser[]>(STORAGE_KEYS.users, []);
}

export function saveStoredUsers(users: StoredUser[]) {
  writeJson(STORAGE_KEYS.users, users);
}

export function getStoredSession() {
  return readJson<AdminSession | null>(STORAGE_KEYS.session, null);
}

export function saveStoredSession(session: AdminSession) {
  writeJson(STORAGE_KEYS.session, session);
}

export function clearStoredSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEYS.session);
}

export function buildSession(user: StoredUser): AdminSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function createStoredUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): StoredUser {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
    active: true,
    createdAt: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date()),
  };
}

export function canManageUsers(role: UserRole) {
  return role === "owner";
}

export function getRoleLabel(role: UserRole) {
  if (role === "owner") return "Admin principal";
  if (role === "manager") return "Manager";
  return "Employe";
}
