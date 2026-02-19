import { Flame, BarChart2, CalendarDays, TrendingUp } from "lucide-react";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: <Flame className="text-emerald-600 dark:text-emerald-400 w-8 h-8" />,
    title: "Kalori Takibi",
    description:
      "Günlük kalori alımını kolayca takip et, hedef kalorine göre öğünlerini planla.",
  },
  {
    icon: (
      <BarChart2 className="text-emerald-600 dark:text-emerald-400 w-8 h-8" />
    ),
    title: "Makro Takibi",
    description:
      "Protein, karbonhidrat ve yağ oranlarını anlık olarak görüntüle.",
  },
  {
    icon: (
      <CalendarDays className="text-emerald-600 dark:text-emerald-400 w-8 h-8" />
    ),
    title: "Öğün Planlama",
    description:
      "Kahvaltı, öğle ve akşam öğünlerini ayrı ayrı kaydet ve düzenle.",
  },
  {
    icon: (
      <TrendingUp className="text-emerald-600 dark:text-emerald-400 w-8 h-8" />
    ),
    title: "İlerleme Görüntüleme",
    description:
      "Geçmiş günlere göre beslenme alışkanlıklarındaki değişimi takip et.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-gradient-to-b from-white to-emerald-300 dark:from-gray-950 dark:to-gray-900 py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
          Neden <span className="text-emerald-600">Selfbesin</span>?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-4"
            >
              {feature.icon}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
