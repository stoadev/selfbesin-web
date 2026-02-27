import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  avatarUrl: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAvatar: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
