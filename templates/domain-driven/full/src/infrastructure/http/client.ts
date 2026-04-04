/**
 * Infrastructure: HTTP client adapter.
 * Domain code never uses fetch() directly —
 * it calls this adapter, which can be swapped (axios, ky, etc.)
 * without touching any domain logic.
 */
export async function httpGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function httpPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}
