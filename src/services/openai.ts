const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function generateReplyFromOpenAI(message: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-nano', 
      messages: [
        {
          role: 'system',
          content: `You are a scheduling assistant. 
                    When a user messages you, respond only in this JSON format:

                    {
                      "intent": "book" | "reschedule" | "cancel" | "smalltalk" | "unknown",
                      "datetime": "2025-06-25T15:00:00", // ISO 8601, optional
                      "summary": "Physio appointment with John Doe", // optional
                      "reply": "Your appointment is booked!" // human-friendly message
                    }
                            
                    Always include the 'intent' and 'reply'. Include 'datetime' and 'summary' only if intent is book/reschedule.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.5,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('❌ OpenAI error:', json);
    return "Sorry, I couldn't process your request right now.";
  }

  return json.choices[0].message.content.trim();
}