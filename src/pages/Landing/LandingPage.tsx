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
        <meta property="og:title" content="Selfbesin – Besin Değerleri ve Kalori Takibi" />
        <meta
          property="og:description"
          content="Türkiye'nin en kapsamlı besin değerleri veritabanı. 10.000+ besinin kalori, protein, karbonhidrat ve yağ değerlerini anında öğren."
        />
        <meta property="og:url" content="https://selfbesin.com/" />
        <link rel="canonical" href="https://selfbesin.com/" />
      </Helmet>
      <HeroSection />
    </>
  );
}
