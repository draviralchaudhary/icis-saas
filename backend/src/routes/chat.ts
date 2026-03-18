import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    // ✅ Validate input
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // ✅ OpenAI call (updated + safe model)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are ICIS AI assistant helping businesses automate.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    // ✅ Safe response handling
    const reply =
      response.choices?.[0]?.message?.content || "No response from AI";

    res.json({ reply });

  } catch (error: any) {
    console.error("🔥 OPENAI ERROR:", error?.message || error);

    res.status(500).json({
      error: "AI request failed",
      details: error?.message || "Unknown error",
    });
  }
});

export default router;