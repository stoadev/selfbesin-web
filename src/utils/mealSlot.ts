export interface MealSlot {
  key: string;
  name: string;
}

export function getMealSlot(date: Date): MealSlot {
  const hour = date.getHours();

  if (hour >= 4 && hour <= 10) {
    return { key: "kahvalti", name: "Kahvaltı" };
  }

  if (hour >= 11 && hour <= 15) {
    return { key: "ogle", name: "Öğle Yemeği" };
  }

  if (hour >= 16 && hour <= 21) {
    return { key: "aksam", name: "Akşam Yemeği" };
  }

  return { key: "ara", name: "Ara Öğün" };
}
