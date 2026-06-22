export function normalizeSortValue(value: unknown) {
  if (typeof value === "number") return value;
  const text = String(value ?? "");
  const money = Number(text.replace(/[^0-9.-]+/g, ""));
  if (text.includes("¥") && Number.isFinite(money)) return money;
  const time = new Date(text.replace(/\./g, "/")).getTime();
  if (Number.isFinite(time) && /[-/:]/.test(text)) return time;
  return text.toLowerCase();
}

export function compareRecord<T>(
  a: T,
  b: T,
  sortConfig: { key: string; direction: "asc" | "desc" } | null,
): number {
  if (!sortConfig) return 0;
  const { key, direction } = sortConfig;
  const factor = direction === "asc" ? 1 : -1;
  const valueA = normalizeSortValue((a as Record<string, unknown>)[key]);
  const valueB = normalizeSortValue((b as Record<string, unknown>)[key]);
  if (valueA < valueB) return -1 * factor;
  if (valueA > valueB) return 1 * factor;
  return 0;
}
