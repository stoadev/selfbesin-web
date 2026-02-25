import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white dark:bg-gray-900">
      <Helmet>
        <title>Sayfa Bulunamadı – Selfbesin</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <h1 className="text-6xl font-extrabold text-emerald-600 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Sayfa Bulunamadı
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
        Aradığın sayfa mevcut değil ya da taşınmış olabilir.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          Besin Ara
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
