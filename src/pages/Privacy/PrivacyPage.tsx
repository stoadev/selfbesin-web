import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-5 py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-500 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfaya Dön
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Gizlilik Politikası
        </h1>

        <div className="prose prose-emerald dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              1. Veri Sorumlusu
            </h2>
            <p>
              Selfbesin ("web sitesi") olarak, kullanıcılarımızın gizliliğine
              önem veriyoruz. Bu politika, web sitemizi ziyaret ettiğinizde veya
              hizmetlerimizi kullandığınızda toplanan verilerin nasıl
              işlendiğini açıklar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              2. Toplanan Veriler
            </h2>
            <p>
              Hizmetlerimizi sunabilmek için aşağıdaki verileri toplayabiliriz:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Hesap oluştururken paylaştığınız e-posta adresi ve isim bilgisi.
              </li>
              <li>Oluşturduğunuz öğünler ve seçtiğiniz besinler.</li>
              <li>
                Sitedeki kullanım alışkanlıklarınıza dair anonim analiz
                verileri.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              3. Verilerin Kullanım Amacı
            </h2>
            <p>Toplanan veriler şu amaçlarla kullanılır:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Kişisel öğün takibi hizmetini sunmak.</li>
              <li>Uygulama deneyimini iyileştirmek.</li>
              <li>Güvenliği sağlamak ve hataları tespit etmek.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              4. Verilerin Paylaşımı
            </h2>
            <p>
              Verileriniz, yasal zorunluluklar haricinde üçüncü taraflarla
              ticari amaçlarla paylaşılmaz. Verileriniz güvenli bulut
              sunucularımızda (Supabase) saklanmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              5. Çerezler (Cookies)
            </h2>
            <p>
              Sitemizde oturum yönetimi ve kullanıcı tercihlerini hatırlamak
              amacıyla teknik çerezler kullanılmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              6. İletişim
            </h2>
            <p>
              Gizlilik politikamızla ilgili her türlü soru için bize
              ulaşabilirsiniz.
            </p>
          </section>

          <div className="pt-10 border-t border-gray-100 dark:border-gray-800 text-sm italic">
            Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
          </div>
        </div>
      </div>
    </div>
  );
}
