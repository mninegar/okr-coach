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

    // 25-second hard timeout so it never hangs forever
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://okr-coach-blue.vercel.app",
          "X-Title": "OKR Coach",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: openRouterMessages,
          max_tokens: 1500,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        return res.status(504).json({ error: "The coach took too long to respond. Please try again." });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || `API error ${response.status}`;
      return res.status(response.status).json({ error: errMsg });
    }

    // Handle both string and array content formats
    const rawContent = data.choices?.[0]?.message?.content;
    let text = "";
    if (typeof rawContent === "string") {
      text = rawContent.trim();
    } else if (Array.isArray(rawContent)) {
      text = rawContent.filter(b => b.type === "text").map(b => b.text).join("").trim();
    }

    if (!text) {
      return res.status(500).json({ error: "The coach returned an empty response. Please try again." });
    }

    return res.status(200).json({
      content: [{ type: "text", text }],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
