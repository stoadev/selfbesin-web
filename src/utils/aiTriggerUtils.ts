const AI_PHRASES = ["ne kadar"];

const AI_EXACT_WORDS = ["mi", "mı", "mu", "mü"];

const AI_PREFIX_WORDS = [
  "kaç",
  "hangi",
  "kalori",
  "protein",
  "karbonhidrat",
  "yağ",
  "makro",
];

const UNIT_PATTERN =
  /\d+(?:[.,]\d+)?\s*(?:gram|gr|g|kilogram|kg|mililitre|ml|litre|lt|l|dilim|porsiyon|adet|tane|paket|kase|bardak|kaşık|avuç|top|kutu)\b/;

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N}.,]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function shouldTriggerAI(query: string): boolean {
  const raw = query.trim();
  if (!raw) return false;

  if (raw.includes("?")) return true;

  const normalized = normalize(raw);
  if (!normalized) return false;

  const words = normalized.split(" ");
  if (words.length >= 3) return true;

  if (AI_PHRASES.some((phrase) => normalized.includes(phrase))) return true;

  if (words.some((word) => AI_EXACT_WORDS.includes(word))) return true;

  if (
    words.some((word) =>
      AI_PREFIX_WORDS.some((keyword) => word.startsWith(keyword)),
    )
  ) {
    return true;
  }

  return UNIT_PATTERN.test(normalized);
}
