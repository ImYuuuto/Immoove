export function parseNumeric(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}
export function buildUpdate(
  fields: Record<string, unknown>,
  _startIndex = 1,
): { set: string; params: unknown[] } {
  const entries = Object.entries(fields).filter(
    ([, value]) => value !== undefined,
  );
  return {
    set: entries.map(([key]) => `${key} = ?`).join(', '),
    params: entries.map(([, value]) => value),
  };
}
