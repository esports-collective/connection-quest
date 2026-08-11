import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Ask Claude for JSON. Returns parsed value, or null on any failure. */
export async function askJson<T = unknown>(
  system: string,
  user: string,
  maxTokens = 1500,
): Promise<T | null> {
  const client = getAnthropic();
  if (!client) return null;
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const json = extractJson(text);
    return json ? (JSON.parse(json) as T) : null;
  } catch {
    return null;
  }
}

/** Ask Claude for free text. Returns null on any failure. */
export async function askText(
  system: string,
  user: string,
  maxTokens = 1200,
): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  } catch {
    return null;
  }
}

function extractJson(text: string): string | null {
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  let start = -1;
  let open = "{";
  let close = "}";
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    open = "[";
    close = "]";
  } else if (firstObj !== -1) {
    start = firstObj;
  }
  if (start === -1) return null;
  const end = text.lastIndexOf(close);
  if (end <= start) return null;
  return text.slice(start, end + 1);
}
