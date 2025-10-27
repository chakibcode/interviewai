import { supabase } from "./supabaseClient";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

class AuthService {
  async getUser(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    const user = data.user;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url,
    };
  }

  async signUp(email: string, password: string, fullName?: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw new Error(error.message);
    const user = data.user!;

    // Attempt to create profile row on signup
    try {
      await supabase.from("profiles").upsert(
        [
          {
            user_id: user.id,
            email: user.email ?? email,
            full_name: fullName,
            onboarding_completed: false,
          },
        ],
        { onConflict: "user_id" },
      );
    } catch (e) {
      console.warn("profiles upsert on signup failed:", e);
    }

    return {
      id: user.id,
      email: user.email ?? email,
      fullName: user.user_metadata?.full_name ?? fullName,
    };
  }

  async signIn(email: string, password: string, remember: boolean = true): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const user = data.user!;

    // Ensure profile exists and update last_login_at
    try {
      await supabase.from("profiles").upsert(
        [
          {
            user_id: user.id,
            email: user.email ?? email,
            full_name: user.user_metadata?.full_name,
            last_login_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id" },
      );
    } catch (e) {
      console.warn("profiles upsert on signIn failed:", e);
    }

    // If not remembering, remove persisted auth token from localStorage
    if (!remember && typeof window !== "undefined") {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) ?? "";
          if (/^sb-.*-auth-token$/.test(key)) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn("Failed to clear persisted session for non-remember login:", e);
      }
    }

    return {
      id: user.id,
      email: user.email ?? email,
      fullName: user.user_metadata?.full_name,
    };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
}

export const authService = new AuthService();