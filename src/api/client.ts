const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

export interface APICallOptions {
  systemPrompt: string;
  userPrompt: string;
  apiKey: string;
  onChunk?: (text: string) => void;
}

export async function callClaude(options: APICallOptions): Promise<string> {
  const { systemPrompt, userPrompt, apiKey, onChunk } = options;

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `API error ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  const text = data.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  if (onChunk) onChunk(text);
  return text;
}

export function parseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─────────────────────────────────────────────────
// FastAPI backend stub — swap in when backend is live
// Change BACKEND_URL in env and flip USE_BACKEND to true
// ─────────────────────────────────────────────────

const USE_BACKEND = false;
const BACKEND_URL = (import.meta as Record<string, any>).env?.VITE_BACKEND_URL || "http://localhost:8000";

export async function backendDecompose(input: unknown): Promise<unknown> {
  if (!USE_BACKEND) throw new Error("Backend not enabled");
  const res = await fetch(`${BACKEND_URL}/api/decompose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  return res.json();
}
