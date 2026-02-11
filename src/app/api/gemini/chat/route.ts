import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are an assistant that helps ambassadors log their service events.

An event submission requires these fields:
1. **event_name** (string): The name/title of the event (e.g., "Campus Tour", "Family Visit Day")
2. **hours** (number): Hours served (can be decimal, e.g., 1.5)
3. **tour_credits** (integer): Tour credit number (must be a whole number, e.g., 1, 2, 3)
4. **notes** (string): Notes on how the event went

Your job:
- Read the user's message and extract as many of these fields as possible.
- Respond in JSON format ONLY, with two keys:
  - "fields": an object with any fields you could extract (use null for missing ones)
  - "message": a friendly, concise response to the user. If fields are missing, ask for them naturally. If all fields are present, summarize and ask for confirmation.
  - "complete": boolean, true only if ALL four fields are present

Example response:
{"fields":{"event_name":"Campus Tour","hours":2,"tour_credits":1,"notes":null},"message":"Got it — Campus Tour, 2 hours, 1 credit. What are your notes on how it went?","complete":false}

Keep responses short and conversational. Never use markdown in your message. Always respond with valid JSON only, no other text.`;

export async function POST(req: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY not configured" },
            { status: 500 }
        );
    }

    const { messages } = await req.json();

    // Build Gemini request
    const contents = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: '{"fields":{"event_name":null,"hours":null,"tour_credits":null,"notes":null},"message":"Hey! Tell me about the event you want to log — what was it, how long, and how did it go?","complete":false}' }] },
        ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
        })),
    ];

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 500,
                    },
                }),
            }
        );

        if (!res.ok) {
            const err = await res.text();
            console.error("Gemini API error:", err);
            return NextResponse.json({ error: "Gemini API error" }, { status: 500 });
        }

        const data = await res.json();
        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Try to parse the JSON response
        let parsed;
        try {
            // Strip markdown code fences if Gemini wraps it
            const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = {
                fields: {},
                message: text,
                complete: false,
            };
        }

        return NextResponse.json(parsed);
    } catch (err) {
        console.error("Gemini fetch error:", err);
        return NextResponse.json(
            { error: "Failed to reach Gemini" },
            { status: 500 }
        );
    }
}
