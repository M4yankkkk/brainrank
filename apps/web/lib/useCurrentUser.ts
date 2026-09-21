"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "./supabaseClient";
import { apiFetch } from "./apiClient";

export interface CurrentUser {
  id: string;
  email: string | null;
  username: string;
  avatarUrl?: string | null;
  createdAt?: string | null;
}

let cachedUser: CurrentUser | null = null;
const listeners = new Set<(user: CurrentUser | null) => void>();

export function clearUserCache() {
  cachedUser = null;
  listeners.forEach((l) => l(null));
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);

  useEffect(() => {
    function handleUpdate(u: CurrentUser | null) {
      setUser(u);
    }
    listeners.add(handleUpdate);

    if (!cachedUser) {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) {
          cachedUser = null;
          listeners.forEach((l) => l(null));
          return;
        }

        const initialUsername =
          (session.user.user_metadata?.username as string) ||
          (session.user.email ? session.user.email.split("@")[0] : session.user.id.slice(0, 8));
        const initial: CurrentUser = {
          id: session.user.id,
          email: session.user.email ?? null,
          username: initialUsername,
          createdAt: session.user.created_at ?? null
        };
        if (!cachedUser) {
          cachedUser = initial;
          listeners.forEach((l) => l(initial));
        }

        try {
          const profile = await apiFetch<CurrentUser>("/auth/me");
          cachedUser = {
            ...profile,
            createdAt: session.user.created_at ?? null
          };
          listeners.forEach((l) => l(cachedUser));
        } catch {
          // Keep initial fallback
        }
      });
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return user;
}
