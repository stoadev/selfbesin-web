import { Helmet } from "react-helmet-async";
import HeroSection from "./HeroSection";

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Selfbesin – Besin Değerleri ve Kalori Takibi</title>
        <meta
          name="description"
          content="Türkiye'nin en kapsamlı besin değerleri veritabanı. 10.000+ besinin kalori, protein, karbonhidrat ve yağ değerlerini anında öğren."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Selfbesin – Besin Değerleri ve Kalori Takibi" />
        <meta
          property="og:description"
          content="Türkiye'nin en kapsamlı besin değerleri veritabanı. 10.000+ besinin kalori, protein, karbonhidrat ve yağ değerlerini anında öğren."
        />
        <meta property="og:url" content="https://selfbesin.com/" />
        <meta property="og:image" content="https://selfbesin.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://selfbesin.com/og-image.png" />
        <link rel="canonical" href="https://selfbesin.com/" />
      </Helmet>
      <HeroSection />
    </>
  );
}
