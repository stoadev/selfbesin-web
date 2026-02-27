import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContextBase";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAvatar = async (currUser: User | null) => {
    if (!currUser) {
      setAvatarUrl(null);
      return;
    }

    try {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", currUser.id)
        .limit(1);

      const profile = data?.[0];
      if (profile?.avatar_url && typeof profile.avatar_url === "string") {
        if (profile.avatar_url.startsWith("http")) {
          setAvatarUrl(profile.avatar_url);
        } else {
          const { data: dl } = await supabase.storage
            .from("avatars")
            .download(profile.avatar_url);
          if (dl) setAvatarUrl(URL.createObjectURL(dl));
        }
      } else if (currUser.user_metadata?.avatar_url) {
        setAvatarUrl(currUser.user_metadata.avatar_url);
      } else if (currUser.user_metadata?.picture) {
        setAvatarUrl(currUser.user_metadata.picture);
      }
    } catch (e) {
      console.error("Avatar cache error:", e);
    }
  };

  useEffect(() => {
    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) fetchAvatar(s.user);
    });

    // Oturum değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        fetchAvatar(s.user);
      } else {
        setAvatarUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setAvatarUrl(null);
  };

  const refreshAvatar = () => fetchAvatar(user);

  return (
    <AuthContext.Provider
      value={{ session, user, avatarUrl, loading, signOut, refreshAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
}
