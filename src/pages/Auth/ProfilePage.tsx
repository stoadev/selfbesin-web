import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/layout/Navbar";
import { User, Mail, Calendar, Edit2 } from "lucide-react";
import Button from "../../components/common/Button";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getProfile() {
      setLoading(true);

      try {
        if (!user) throw new Error("No user");

        const { data, error, status } = await supabase
          .from("profiles")
          .select(`username, avatar_url, full_name, updated_at`)
          .eq("id", user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setProfile({
            id: user.id,
            ...data,
          } as Profile);

          if (data.avatar_url) downloadImage(data.avatar_url);
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
      if (error) {
        throw error;
      }
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error downloading image: ", error.message);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
          {/* Header / Cover */}
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

          <div className="px-4 py-5 sm:px-6 relative">
            {/* Avatar */}
            <div className="-mt-16 sm:-mt-20 mb-4 inline-block relative">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white dark:ring-gray-900 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300" />
                )}
              </div>
            </div>

            <div className="sm:flex sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {profile?.full_name || user?.email?.split("@")[0]}
                </h1>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  @{profile?.username || user?.email?.split("@")[0]}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-3 ">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    /* Edit logic */
                  }}
                  className="whitespace-nowrap"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Profili Düzenle
                </Button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-800">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> E-posta
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2">
                  {user?.email}
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> Tam İsim
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2">
                  {profile?.full_name || "Belirtilmemiş"}
                </dd>
              </div>

              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Kayıt Tarihi
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions Footer */}
          <div className="bg-gray-50 dark:bg-gray-950/50 px-4 py-4 sm:px-6 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Hesaptan Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
