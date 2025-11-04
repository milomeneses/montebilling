"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type UserRole = "owner" | "collaborator";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  timezone: string;
  preferredCurrency: string;
  locale: string;
  phone?: string;
  avatarUrl?: string;
  bankInfo?: string;
  notifications: {
    email: boolean;
    slack: boolean;
  };
};

type AuthContextValue = {
  user: User | null;
  users: User[];
  login: (input: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (email: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    timezone: string;
    preferredCurrency: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (input: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = "monte-auth-user";
const USERS_STORAGE_KEY = "monte-auth-users";

type StoredUser = User & { password: string };

const defaultUsers: StoredUser[] = [
  {
    id: "owner-milo",
    name: "Milo",
    email: "milo@monteanimation.com",
    role: "owner",
    timezone: "America/Argentina/Buenos_Aires",
    preferredCurrency: "USD",
    locale: "es-AR",
    notifications: { email: true, slack: true },
    password: "monte123",
  },
  {
    id: "collab-sergio",
    name: "Sergio",
    email: "sergio@monteanimation.com",
    role: "collaborator",
    timezone: "America/Mexico_City",
    preferredCurrency: "USD",
    locale: "es-MX",
    notifications: { email: true, slack: true },
    password: "monte123",
  },
  {
    id: "collab-camila",
    name: "Camila",
    email: "camila@monteanimation.com",
    role: "collaborator",
    timezone: "America/Bogota",
    preferredCurrency: "COP",
    locale: "es-CO",
    notifications: { email: true, slack: false },
    password: "monte123",
  },
  {
    id: "collab-julian",
    name: "Julián",
    email: "julian@monteanimation.com",
    role: "collaborator",
    timezone: "America/Argentina/Buenos_Aires",
    preferredCurrency: "ARS",
    locale: "es-AR",
    notifications: { email: true, slack: true },
    password: "monte123",
  },
];

function sanitizeUser(stored: StoredUser): User {
  const { password: _password, ...safe } = stored;
  void _password;
  return safe;
}

function loadUsers(): StoredUser[] {
  if (typeof window === "undefined") {
    return defaultUsers;
  }
  const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify(defaultUsers),
    );
    return defaultUsers;
  }
  try {
    const parsed = JSON.parse(stored) as StoredUser[];
    if (parsed.length === 0) {
      window.localStorage.setItem(
        USERS_STORAGE_KEY,
        JSON.stringify(defaultUsers),
      );
      return defaultUsers;
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse stored users", error);
    return defaultUsers;
  }
}

function persistUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function persistAuthUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<StoredUser[]>(defaultUsers);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadedUsers = loadUsers();
    const usersTimeout = setTimeout(() => {
      setUsers(loadedUsers);
    }, 0);
    let userTimeout: ReturnType<typeof setTimeout> | undefined;
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as User;
          userTimeout = setTimeout(() => {
            setUser(parsed);
          }, 0);
        } catch (error) {
          console.error("Failed to parse stored auth user", error);
        }
      }
    }
    const hydrationTimeout = setTimeout(() => {
      setIsHydrated(true);
    }, 0);
    return () => {
      clearTimeout(usersTimeout);
      if (userTimeout) {
        clearTimeout(userTimeout);
      }
      clearTimeout(hydrationTimeout);
    };
  }, []);

  const syncUsers = useCallback((updater: (list: StoredUser[]) => StoredUser[]) => {
    setUsers((prev) => {
      const next = updater(prev);
      persistUsers(next);
      return next;
    });
  }, []);

  const login = useCallback(async ({ email, password }: { email: string; password: string; }) => {
    const nextUsers = loadUsers();
    const found = nextUsers.find(
      (stored) => stored.email.toLowerCase() === email.toLowerCase(),
    );
    if (!found || found.password !== password) {
      throw new Error("Credenciales inválidas. Verifica email y contraseña.");
    }
    const safeUser = sanitizeUser(found);
    setUser(safeUser);
    persistAuthUser(safeUser);
    if (!users.find((u) => u.id === found.id)) {
      syncUsers(() => nextUsers);
    }
  }, [users, syncUsers]);

  const loginWithGoogle = useCallback(async (email: string) => {
    const normalizedEmail = email.toLowerCase();
    const googleRole: UserRole = normalizedEmail === "milo@monteanimation.com"
      ? "owner"
      : "collaborator";
    const existing = loadUsers().find(
      (stored) => stored.email.toLowerCase() === normalizedEmail,
    );
    if (existing) {
      const safeUser = sanitizeUser(existing);
      setUser(safeUser);
      persistAuthUser(safeUser);
      return;
    }
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: email.split("@")[0] ?? "Usuario Monte",
      email: normalizedEmail,
      role: googleRole,
      timezone: "America/Argentina/Buenos_Aires",
      preferredCurrency: "USD",
      locale: "es-AR",
      notifications: { email: true, slack: googleRole === "owner" },
      password: crypto.randomUUID(),
    };
    const safeUser = sanitizeUser(newUser);
    syncUsers((prev) => [...prev, newUser]);
    setUser(safeUser);
    persistAuthUser(safeUser);
  }, [syncUsers]);

  const register = useCallback(async ({
    name,
    email,
    password,
    role,
    timezone,
    preferredCurrency,
  }: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    timezone: string;
    preferredCurrency: string;
  }) => {
    const normalizedEmail = email.toLowerCase();
    const existing = loadUsers().find(
      (stored) => stored.email.toLowerCase() === normalizedEmail,
    );
    if (existing) {
      throw new Error("Ya existe un usuario con ese email.");
    }
    if (role === "owner" && loadUsers().some((stored) => stored.role === "owner")) {
      throw new Error("Solo puede existir un owner. Registra este usuario como colaborador.");
    }
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email: normalizedEmail,
      role,
      timezone,
      preferredCurrency,
      locale: "es-AR",
      notifications: { email: true, slack: role === "owner" },
      password,
    };
    syncUsers((prev) => [...prev, newUser]);
    const safeUser = sanitizeUser(newUser);
    setUser(safeUser);
    persistAuthUser(safeUser);
  }, [syncUsers]);

  const logout = useCallback(() => {
    setUser(null);
    persistAuthUser(null);
  }, []);

  const updateProfile = useCallback((input: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: User = {
        ...prev,
        ...input,
        notifications: {
          ...prev.notifications,
          ...input.notifications,
        },
      };
      persistAuthUser(updated);
      syncUsers((list) =>
        list.map((stored) =>
          stored.id === updated.id
            ? { ...stored, ...updated, password: stored.password }
            : stored,
        ),
      );
      return updated;
    });
  }, [syncUsers]);

  const value = useMemo(
    () => ({
      user,
      users: users.map((stored) => sanitizeUser(stored)),
      login,
      loginWithGoogle,
      logout,
      register,
      updateProfile,
    }),
    [login, loginWithGoogle, logout, register, updateProfile, user, users],
  );

  if (!isHydrated) {
    return <div className="flex min-h-screen items-center justify-center">Cargando…</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }
  return context;
}
