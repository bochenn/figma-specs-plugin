// Load options for heavy files. Module-level state, like the format options
// (color.ts, valores.ts, espaciado.ts): the generators read it without having to
// thread it through every call.

// Rows documented per section when the limit is on. ponytail: a round number,
// not a measured threshold — lower it if a file still doesn't finish.
export const ROW_LIMIT = 150;

let limit = 0; // 0 = no limit

export function applyRowLimit(on: boolean): void {
  limit = on ? ROW_LIMIT : 0;
}

// Applies the row limit, and reports how many were left out (0 when it's off).
export function capRows<T>(rows: T[]): { rows: T[]; dropped: number } {
  if (limit === 0 || rows.length <= limit) return { rows, dropped: 0 };
  return { rows: rows.slice(0, limit), dropped: rows.length - limit };
}
