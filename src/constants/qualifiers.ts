export interface QualifierEntry {
  id: number;
  display_name: string;
  priority: number;
}

export const QUALIFIER_LIST: QualifierEntry[] = [
  { id: 1000, display_name: "Tam Yağlı", priority: 1000 },
  { id: 1100, display_name: "Yarım Yağlı", priority: 1100 },
  { id: 1200, display_name: "Az Yağlı", priority: 1200 },
  { id: 1300, display_name: "Düşük Yağlı", priority: 1300 },
  { id: 1400, display_name: "Yağsız", priority: 1400 },
  { id: 1500, display_name: "Light", priority: 1500 },
  { id: 1600, display_name: "Lite", priority: 1600 },
  { id: 1700, display_name: "Laktozsuz", priority: 1700 },
  { id: 1800, display_name: "Glutensiz", priority: 1800 },
  { id: 1900, display_name: "Probiyotik", priority: 1900 },
  { id: 2000, display_name: "Organik", priority: 2000 },
  { id: 2100, display_name: "Doğal", priority: 2100 },
  { id: 2200, display_name: "Diyet", priority: 2200 },
  { id: 2300, display_name: "Proteinli", priority: 2300 },
  { id: 2400, display_name: "Yüksek Proteinli", priority: 2400 },
  { id: 2500, display_name: "Yüksek Lifli", priority: 2500 },
  { id: 2600, display_name: "Düşük Kalorili", priority: 2600 },
  { id: 2700, display_name: "Şekersiz", priority: 2700 },
  { id: 2800, display_name: "Az Şekerli", priority: 2800 },
  { id: 2900, display_name: "Sade", priority: 2900 },
  { id: 3000, display_name: "Süzme", priority: 3000 },
  { id: 3100, display_name: "Tam Buğday", priority: 3100 },
  { id: 3200, display_name: "Kepekli", priority: 3200 },
  { id: 3300, display_name: "Taze Sıkılmış", priority: 3300 },
  { id: 3400, display_name: "Haşlanmış", priority: 3400 },
  { id: 3500, display_name: "Kızartılmış", priority: 3500 },
  { id: 3600, display_name: "Izgara", priority: 3600 },
  { id: 3700, display_name: "Çiğ", priority: 3700 },
  { id: 3800, display_name: "%1 Yağlı", priority: 3800 },
  { id: 3900, display_name: "%2 Yağlı", priority: 3900 },
  { id: 4000, display_name: "%3 Yağlı", priority: 4000 },
  { id: 4100, display_name: "Ballı", priority: 4100 },
  { id: 4200, display_name: "Vanilya Aromalı", priority: 4200 },
  { id: 4300, display_name: "Kakaolu", priority: 4300 },
  { id: 4400, display_name: "Yer Fıstığı & Muz Aromalı", priority: 4400 },
  { id: 4500, display_name: "Çilekli", priority: 4500 },
  { id: 4600, display_name: "Bal & Hardal Aromalı", priority: 4600 },
];

/** Lowercase display_name → priority lookup */
export const QUALIFIER_PRIORITY_MAP = new Map<string, number>(
  QUALIFIER_LIST.map((q) => [
    q.display_name.toLocaleLowerCase("tr"),
    q.priority,
  ]),
);
