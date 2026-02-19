import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../common/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import Button from "../common/Button";
import { User } from "lucide-react";
import AuthModal from "../common/AuthModal";
import ProfileModal from "../common/ProfileModal";

export default function Navbar() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getProfile() {
      if (!user) {
        setAvatarUrl(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`avatar_url`)
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data?.avatar_url) {
          if (data.avatar_url.startsWith("http")) {
            setAvatarUrl(data.avatar_url);
          } else {
            const { data: downloadData, error: downloadError } =
              await supabase.storage.from("avatars").download(data.avatar_url);
            if (downloadError) throw downloadError;
            setAvatarUrl(URL.createObjectURL(downloadData));
          }
        } else if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        } else if (user.user_metadata?.picture) {
          setAvatarUrl(user.user_metadata.picture);
        }
      } catch (error) {
        console.error("Error loading navbar avatar:", error);
      }
    }

    getProfile();
  }, [user]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/5 dark:bg-gray-950/5 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/android-chrome-192x192.png"
                alt="Selfbesin logo"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-xl font-bold bg-black dark:bg-white bg-clip-text text-transparent">
                Selfbesin
              </span>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              <ThemeToggle />

              {user ? (
                <div
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-10 h-10 rounded-full border-2 border-transparent hover:border-emerald-500 overflow-hidden cursor-pointer transition-all shadow-sm flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Giriş Yap
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
