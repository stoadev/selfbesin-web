import { useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../common/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";
import { User } from "lucide-react";
import AuthModal from "../common/AuthModal";
import ProfileModal from "../common/ProfileModal";

export default function Navbar() {
  const { user, avatarUrl } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <nav className="h-bar bg-white/5 dark:bg-gray-950/5 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
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

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {/* Optional: Add other links here if needed */}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
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
                  variant="cta"
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
