import { useState, useEffect } from "react";
import { User, Mail, Calendar, LogOut, Edit2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import Button from "./Button";
import Modal from "./Modal";

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

function ProfileModalContent({ onClose }: { onClose: () => void }) {
  const { user, signOut, avatarUrl } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function getProfile() {
      if (!user) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`username, avatar_url, full_name, updated_at`)
          .eq("id", user.id)
          .limit(1);

        if (error) {
          throw error;
        }

        const profileData = data?.[0];

        if (profileData) {
          setProfile({
            id: user.id,
            ...profileData,
          } as Profile);
        }
      } catch (error) {
        console.error("Error loading user data!", error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const Skeleton = ({ className }: { className?: string }) => (
    <div
      className={`shimmer bg-gray-100 dark:bg-gray-800/50 rounded ${className}`}
    />
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-[540px] sm:h-[520px]">
      {/* Profile Header (Visual) */}
      <div className="h-[12dvh] min-h-[80px] bg-gradient-to-r from-emerald-500 to-teal-600 shrink-0"></div>

      <div className="px-[3dvw] sm:px-10 pb-[4dvh] flex-1 flex flex-col items-center">
        {/* Avatar */}
        <div className="-mt-[6dvh] mb-[2dvh] relative group">
          <div className="h-[12dvh] w-[12dvh] min-h-[80px] min-w-[80px] rounded-full ring-4 ring-white dark:ring-gray-950 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-xl">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <User className="h-10 w-10 text-gray-300" />
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg transition-transform hover:scale-110">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Info */}
        <div
          className={`text-center mb-[4dvh] w-full flex flex-col items-center gap-1.5 h-[52px]`}
        >
          {loading ? (
            <>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-full">
                {profile?.full_name || user?.email?.split("@")[0]}
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                @{profile?.username || user?.email?.split("@")[0]}
              </p>
            </>
          )}
        </div>

        {/* Details List */}
        <div className="w-full space-y-[1.5dvh] mb-[4dvh]">
          {/* E-posta Row */}
          <div
            className={`flex items-center gap-[2dvw] p-[2dvh] rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 h-[72px]`}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                E-posta
              </span>
              {loading ? (
                <Skeleton className="h-4 w-40 mt-1" />
              ) : (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {user?.email}
                </span>
              )}
            </div>
          </div>

          {/* Kayıt Tarihi Row */}
          <div
            className={`flex items-center gap-[2dvw] p-[2dvh] rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 h-[72px]`}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Kayıt Tarihi
              </span>
              {loading ? (
                <Skeleton className="h-4 w-32 mt-1" />
              ) : (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-3 mt-auto">
          <Button
            variant="redSecondary"
            className="flex-1 h-[6dvh] min-h-[44px] flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-500 border border-red-500 whitespace-nowrap"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2 shrink-0" />
            Çıkış Yap
          </Button>
          <Button
            variant="secondary"
            className="flex-1 h-[6dvh] min-h-[44px] flex items-center justify-center whitespace-nowrap"
          >
            <Edit2 className="w-4 h-4 mr-2 shrink-0" />
            Düzenle
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[440px]"
      closeButtonClassName="top-4 right-4 text-white/80 hover:bg-white/10"
    >
      <ProfileModalContent onClose={onClose} />
    </Modal>
  );
}
