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
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

        // Avatar handling with metadata fallback
        if (
          profileData?.avatar_url &&
          typeof profileData.avatar_url === "string"
        ) {
          if (profileData.avatar_url.startsWith("http")) {
            setAvatarUrl(profileData.avatar_url);
          } else {
            downloadImage(profileData.avatar_url);
          }
        } else if (
          user.user_metadata?.avatar_url &&
          typeof user.user_metadata.avatar_url === "string"
        ) {
          setAvatarUrl(user.user_metadata.avatar_url);
        } else if (
          user.user_metadata?.picture &&
          typeof user.user_metadata.picture === "string"
        ) {
          setAvatarUrl(user.user_metadata.picture);
        }
      } catch (error) {
        console.error("Error loading user data!", error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log("Error downloading image: ", error);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Profile Header (Visual) */}
      <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-600 shrink-0"></div>

      <div className="px-6 sm:px-10 pb-8 flex flex-col items-center">
        {/* Avatar */}
        <div className="-mt-12 mb-4 relative group">
          <div className="h-24 w-24 rounded-full ring-4 ring-white dark:ring-gray-950 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-xl">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-gray-300" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg transition-transform hover:scale-110">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Info */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {profile?.full_name || user?.email?.split("@")[0]}
          </h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            @{profile?.username || user?.email?.split("@")[0]}
          </p>
        </div>

        {/* Details List */}
        <div className="w-full space-y-3 mb-8">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                E-posta
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {user?.email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Kayıt Tarihi
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-3">
          <Button
            variant="redSecondary"
            className="flex-1 h-12 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-500 border border-red-500 whitespace-nowrap"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2 shrink-0" />
            Çıkış Yap
          </Button>
          <Button
            variant="secondary"
            className="flex-1 h-12 flex items-center justify-center whitespace-nowrap"
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
