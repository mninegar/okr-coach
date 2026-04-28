export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not set in environment variables." });
  }

  try {
    const { messages, system } = req.body;

    const openRouterMessages = [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://okr-coach-blue.vercel.app",
        "X-Title": "OKR Coach",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: openRouterMessages,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || `OpenRouter API error ${response.status}`;
      return res.status(response.status).json({ error: errMsg });
    }

    const text = data.choices?.[0]?.message?.content || "";

    return res.status(200).json({
      content: [{ type: "text", text }],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
