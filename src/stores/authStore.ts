/* ======================================
   AUTH STORE — Zustand slice for authentication
   ====================================== */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/models';
import { db } from '@/db/database';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const user = await db.users
          .where('email')
          .equals(email)
          .first();

        if (user && user.passwordHash === password) {
          // Update last login
          if (user.id) {
            await db.users.update(user.id, {
              lastLoginAt: new Date().toISOString(),
            });
          }
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true, isLoading: false });
      },

      checkSession: async () => {
        const { user } = get();
        if (user?.id) {
          const dbUser = await db.users.get(user.id);
          if (dbUser) {
            set({ user: dbUser, isAuthenticated: true, isLoading: false });
            return;
          }
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'khatabook-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
