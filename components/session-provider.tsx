"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { showToast } from "./toast";

type User = {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
} | null;

interface SessionContextType {
  user: User;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Session error:", error.message);
          setIsLoading(false);
          return;
        }

        if (!session) {
          setIsLoading(false);
          const path = window.location.pathname;

          if (path !== "/login" && !/^\/sessions\/embed\/[^/]+$/.test(path)) {
            window.location.href = "/login";
          }

          return;
        }

        const userData = {
          id: session.user.id,
          email: session.user.email ?? "",
          username:
            session.user.user_metadata?.username ||
            session.user.email?.split("@")[0] ||
            "User",
          first_name: session.user.user_metadata?.first_name,
          last_name: session.user.user_metadata?.last_name,
        };

        if (mounted) {
          setUser(userData);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error("Failed to get session:", error);
          setIsLoading(false);
        }
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (session) {
        const userData = {
          id: session.user.id,
          email: session.user.email ?? "",
          username:
            session.user.user_metadata?.username ||
            session.user.email?.split("@")[0] ||
            "User",
          first_name: session.user.user_metadata?.first_name,
          last_name: session.user.user_metadata?.last_name,
        };
        setUser(userData);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Prevent Enter key inside inputs from submitting
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
        if (e.target.type !== "textarea") {
          e.preventDefault();
        }
      }
    };

    // Prevent all forms from submitting
    const submitHandler = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", keyHandler);
    document.addEventListener("submit", submitHandler, true); // capture phase

    return () => {
      document.removeEventListener("keydown", keyHandler);
      document.removeEventListener("submit", submitHandler, true);
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      showToast("success", "Signed out successfully!");
      router.push("/login");
    } catch (error) {
      showToast("error", "Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  return (
    <SessionContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
