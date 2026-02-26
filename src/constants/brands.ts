export interface BrandEntry {
  id: number;
  name: string;
  priority: number;
}

export const BRAND_LIST: BrandEntry[] = [
  { id: 1, name: "Genel", priority: 1 },
  { id: 2, name: "Sütaş", priority: 2 },
  { id: 3, name: "Pınar", priority: 3 },
  { id: 4, name: "İçim", priority: 4 },
  { id: 5, name: "Torku", priority: 5 },
  { id: 6, name: "Sek", priority: 6 },
  { id: 7, name: "Danone", priority: 7 },
  { id: 8, name: "Eker", priority: 8 },
  { id: 9, name: "Yörükoğlu", priority: 9 },
  { id: 10, name: "Teksüt", priority: 10 },
  { id: 11, name: "Aynes", priority: 11 },
  { id: 12, name: "Tahsildaroğlu", priority: 12 },
  { id: 13, name: "Muratbey", priority: 13 },
  { id: 14, name: "Ekici", priority: 14 },
  { id: 15, name: "Bahçıvan", priority: 15 },
  { id: 16, name: "Kaanlar", priority: 16 },
  { id: 17, name: "Altınkılıç", priority: 17 },
  { id: 18, name: "Yörsan", priority: 18 },
  { id: 19, name: "Kebir", priority: 19 },
  { id: 20, name: "Aknaz", priority: 20 },
  { id: 21, name: "Gazi", priority: 21 },
  { id: 22, name: "President", priority: 22 },
  { id: 23, name: "Baltalı", priority: 23 },
  { id: 24, name: "Mis", priority: 24 },
  { id: 25, name: "Dost", priority: 25 },
  { id: 26, name: "Tarım Kredi", priority: 26 },
  { id: 27, name: "Migros", priority: 27 },
  { id: 28, name: "Milla", priority: 28 },
  { id: 29, name: "Ersan", priority: 29 },
  { id: 30, name: "Gürsüt", priority: 30 },
  { id: 31, name: "Peysan", priority: 31 },
  { id: 32, name: "Sütbeyaz", priority: 32 },
  { id: 33, name: "Berrak", priority: 33 },
  { id: 34, name: "İtimat", priority: 34 },
  { id: 35, name: "Gültekin", priority: 35 },
  { id: 36, name: "Koç Süt", priority: 36 },
  { id: 37, name: "Doğruluk", priority: 37 },
  { id: 38, name: "Kerem", priority: 38 },
  { id: 39, name: "Sarıyer", priority: 39 },
  { id: 40, name: "Alpro", priority: 40 },
  { id: 41, name: "Yayla", priority: 41 },
  { id: 42, name: "Eceabat Süt", priority: 42 },
  { id: 43, name: "Barbaros", priority: 43 },
  { id: 44, name: "Ariste", priority: 44 },
  { id: 45, name: "Güneydoğu", priority: 45 },
  { id: 46, name: "Paysan", priority: 46 },
  { id: 47, name: "Sütoğlu", priority: 47 },
  { id: 48, name: "Namet", priority: 48 },
  { id: 49, name: "Banvit", priority: 49 },
  { id: 50, name: "Lezita", priority: 50 },
  { id: 51, name: "İkbal", priority: 51 },
];

/** Lowercase brand name → priority lookup */
export const BRAND_PRIORITY_MAP = new Map<string, number>(
  BRAND_LIST.map((b) => [b.name.toLocaleLowerCase("tr"), b.priority]),
);
