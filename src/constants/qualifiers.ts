export interface QualifierEntry {
  id: number;
  display_name: string;
  priority: number;
}

export const QUALIFIER_LIST: QualifierEntry[] = [
  { id: 1, display_name: "Tam Yağlı", priority: 1 },
  { id: 2, display_name: "Yarım Yağlı", priority: 2 },
  { id: 3, display_name: "Az Yağlı", priority: 3 },
  { id: 4, display_name: "Düşük Yağlı", priority: 4 },
  { id: 5, display_name: "Yağsız", priority: 5 },
  { id: 6, display_name: "Light", priority: 6 },
  { id: 7, display_name: "Lite", priority: 7 },
  { id: 8, display_name: "Laktozsuz", priority: 8 },
  { id: 9, display_name: "Glutensiz", priority: 9 },
  { id: 10, display_name: "Probiyotik", priority: 10 },
  { id: 11, display_name: "Organik", priority: 11 },
  { id: 12, display_name: "Doğal", priority: 12 },
  { id: 13, display_name: "Diyet", priority: 13 },
  { id: 14, display_name: "Proteinli", priority: 14 },
  { id: 15, display_name: "Yüksek Proteinli", priority: 15 },
  { id: 16, display_name: "Yüksek Lifli", priority: 16 },
  { id: 17, display_name: "Düşük Kalorili", priority: 17 },
  { id: 18, display_name: "Şekersiz", priority: 18 },
  { id: 19, display_name: "Az Şekerli", priority: 19 },
  { id: 20, display_name: "Sade", priority: 20 },
  { id: 21, display_name: "Süzme", priority: 21 },
  { id: 22, display_name: "Tam Buğday", priority: 22 },
  { id: 23, display_name: "Kepekli", priority: 23 },
  { id: 24, display_name: "Taze Sıkılmış", priority: 24 },
  { id: 25, display_name: "Haşlanmış", priority: 25 },
  { id: 26, display_name: "Kızartılmış", priority: 26 },
  { id: 27, display_name: "Izgara", priority: 27 },
  { id: 28, display_name: "Çiğ", priority: 28 },
  { id: 29, display_name: "%1 Yağlı", priority: 29 },
  { id: 30, display_name: "%2 Yağlı", priority: 30 },
  { id: 31, display_name: "%3 Yağlı", priority: 31 },
  { id: 32, display_name: "Ballı", priority: 99 },
  { id: 33, display_name: "Vanilya Aromalı", priority: 999 },
  { id: 34, display_name: "Kakaolu", priority: 98 },
  { id: 35, display_name: "Yer Fıstığı & Muz Aromalı", priority: 998 },
  { id: 36, display_name: "Çilekli", priority: 97 },
  { id: 37, display_name: "Bal & Hardal Aromalı", priority: 997 },
];

/** Lowercase display_name → priority lookup */
export const QUALIFIER_PRIORITY_MAP = new Map<string, number>(
  QUALIFIER_LIST.map((q) => [
    q.display_name.toLocaleLowerCase("tr"),
    q.priority,
  ]),
);
