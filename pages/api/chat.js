// Free models tried in order - if one fails, the next is attempted
const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
];

async function tryModel(model, messages, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://okr-coach-blue.vercel.app",
        "X-Title": "OKR Coach",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) return null;

    const rawContent = data.choices?.[0]?.message?.content;
    let text = "";
    if (typeof rawContent === "string") text = rawContent.trim();
    else if (Array.isArray(rawContent)) {
      text = rawContent.filter(b => b.type === "text").map(b => b.text).join("").trim();
    }

    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not set in environment variables." });
  }

  const { messages, system } = req.body;
  const openRouterMessages = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages,
  ];

  for (const model of FREE_MODELS) {
    const text = await tryModel(model, openRouterMessages, apiKey);
    if (text) {
      return res.status(200).json({ content: [{ type: "text", text }] });
    }
  }

  return res.status(500).json({
    error: "All free AI models are currently unavailable. Please try again in a moment.",
  });
}
