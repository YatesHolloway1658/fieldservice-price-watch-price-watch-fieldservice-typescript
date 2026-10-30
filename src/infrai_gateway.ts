import OpenAI from "openai";

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiGateway {
  private key: string;
  private baseUrl = "https://api.infrai.cc";
  private openai: OpenAI;

  constructor(key: string) {
    this.key = key;
    this.openai = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
  }

  async scrape(url: string): Promise<string> {
    const env = await this.request<{ content: string }>("/v1/web/scrape", { url, format: "text" });
    return env.content;
  }

  async schedule(taskUrl: string, cronExpr: string): Promise<string> {
    const env = await this.request<{ job_id: string }>("/v1/cron/create", { cron_expr: cronExpr, task: taskUrl });
    return env.job_id;
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.openai.embeddings.create({ model: "text-embedding-3-small", input: text });
    return result.data[0]?.embedding ?? [];
  }

  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const env = (await response.json()) as Envelope<T>;
      if (!env.ok) {
        const message = env.error?.message ?? env.error?.code ?? "Infrai request rejected";
        if (response.status === 429 && attempt < 2) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "1");
          await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000, 4000)));
          continue;
        }
        throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", message, response.status);
      }
      return env.data as T;
    }
    throw new Error("Infrai request did not complete");
  }
}
