import { Link } from "react-router-dom";
import { ThemeToggle } from "../common/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";
import { User } from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
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
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user.email}
                </div>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Çıkış Yap
                </Button>
                <Link to="/profile">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center cursor-pointer hover:ring-2 ring-emerald-500 transition-all">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </Link>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Giriş Yap
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
