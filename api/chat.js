export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "الطريقة غير مسموحة" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "لم يتم إعداد مفتاح الذكاء الاصطناعي على الخادم بعد." });
  }

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "اكتب رسالة أولًا." });
  if (message.length > 4000) return res.status(413).json({ error: "الرسالة طويلة جدًا، اختصرها." });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        instructions: "أنت RDAD، مساعد ذكي ودود. أجب باللغة العربية بشكل واضح ومفيد، واستخدم لغة المستخدم إذا كتب بغير العربية.",
        input: message,
        max_output_tokens: 700
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error:", data?.error?.message || response.status);
      return res.status(502).json({ error: "تعذر على المساعد الرد الآن. تحقق من إعدادات خدمة الذكاء الاصطناعي." });
    }

    const reply = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text)
      .join("\n")
      .trim();

    return res.status(200).json({ reply: reply || "ما قدرت أجهز ردًا الآن، جرّب مرة ثانية." });
  } catch (error) {
    console.error("RDAD chat error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء إرسال الرسالة." });
  }
}