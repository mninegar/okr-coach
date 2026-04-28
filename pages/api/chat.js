export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "MISTRAL_API_KEY is not set in environment variables." });
  }

  try {
    const { messages, system } = req.body;

    const mistralMessages = [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: mistralMessages,
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
      const errMsg = data.message || data.error?.message || `Mistral API error ${response.status}`;
      return res.status(response.status).json({ error: errMsg });
    }

    const text = data.choices?.[0]?.message?.content?.trim() || "";

    if (!text) {
      return res.status(500).json({ error: "Empty response. Please try again." });
    }

    return res.status(200).json({
      content: [{ type: "text", text }],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
