import { Link } from "react-router-dom";
import Button from "../../components/common/Button";

export default function CTASection() {
  return (
    <section className="bg-gradient-to-b from-emerald-300 to-white dark:from-gray-900 dark:to-gray-950 py-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
          Beslenmene bugün hâkim ol.
        </h2>
        <p className="text-black dark:text-white text-lg mb-8">
          Ücretsiz hesap oluştur, hemen takibe başla.
        </p>
        <Link to="/register">
          <Button variant="primary" size="lg">
            Ücretsiz Kayıt Ol
          </Button>
        </Link>
      </div>
    </section>
  );
}
