import { useState, useRef, useEffect } from "react";
import { X, Mail, Lock, ArrowRight, Github } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabase";
import { loginSchema, type LoginSchema } from "../../utils/validation";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type AuthView = "options" | "email";

function AuthModalContent({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<AuthView>("options");
  const [authError, setAuthError] = useState<string | null>(null);

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setView("options");
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      onClose();
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setAuthError(error.message);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col items-center relative">
      {view === "email" && (
        <button
          onClick={handleBack}
          aria-label="Geri"
          className="absolute top-4 left-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
      )}
      {/* Logo Area */}
      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-2">
          <img
            src="/android-chrome-192x192.png"
            alt="Selfbesin logo"
            className="w-12 h-12 rounded-xl"
          />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            Selfbesin
          </span>
        </div>
      </div>

      <div className="w-full text-center">
        {view === "options" ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Giriş Yap
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Devam etmek için bir giriş yöntemi seçin.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={signInWithGoogle}
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
                    fill="#EA4335"
                  />
                </svg>
                Google ile devam et
              </button>

              <button
                disabled
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-200 opacity-50 cursor-not-allowed transition-colors"
              >
                <Github className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                GitHub ile devam et (Yakında)
              </button>

              <button
                onClick={() => setView("email")}
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 dark:bg-white text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <Mail className="w-5 h-5" />
                E-posta ve şifre ile giriş yap
              </button>
            </div>
          </>
        ) : (
          <div className="w-full text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              E-posta ile Giriş
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Devam etmek için e-posta bilgilerinizi girin
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-3"
            >
              <div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    className={`w-full pl-12 pr-4 h-12 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-800 focus:ring-emerald-500 focus:border-transparent"
                    }`}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 text-left px-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 h-12 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition ${
                      errors.password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-800 focus:ring-emerald-500 focus:border-transparent"
                    }`}
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 text-left px-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {authError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 px-4 py-3 text-sm text-red-600 dark:text-red-300 text-left">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
              </button>
            </form>
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          Giriş yaparak{" "}
          <a
            href="#"
            className="underline hover:text-gray-600 dark:hover:text-gray-300"
          >
            Kullanım Şartları
          </a>
          'nı ve{" "}
          <a
            href="#"
            className="underline hover:text-gray-600 dark:hover:text-gray-300"
          >
            Gizlilik Politikası
          </a>
          'nı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Body overflow toggle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-max flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        ref={modalRef}
        className="w-full max-w-[530px] max-h-[85vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl flex flex-col relative"
        role="dialog"
      >
        {/* Header/Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <AuthModalContent onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
