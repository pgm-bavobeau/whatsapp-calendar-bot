import { log } from "console";

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

// Help choosing a new available time slot out of busy data and a requested time
export async function suggestAvailableTimes(
  busyTimes,
  requestedTime: { start: string; end: string }
) {
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
                    Given the busy times, closed times and a requested time, suggest 3 alternative time slots that are available outside of the closed time zone. try to keep them close to the requested time.

                    Busy times:
                    ${JSON.stringify(busyTimes)}

                    Closed times:
                    every day from 18:00:00 to 08:00:00

                    Requested time:
                    ${JSON.stringify(requestedTime)}

                    Respond with an array of 3 ISO 8601 date strings in the format "2025-06-25T15:00:00" don't worry about timezones.`,
        },
      ],
      temperature: 0.5,
    }), 
  });
  const json = await res.json();

  const content: [string] = JSON.parse(json.choices[0].message.content);

  console.log('OpenAI response:', content);

  const suggestedTimes = content.map(dt => {
      const date = new Date(dt);
      const day = date.toLocaleDateString('nl-BE', { weekday: 'short' });
      const dayNum = date.getDate();
      const month = date.toLocaleDateString('nl-BE', { month: 'short' });
      const time = date.toLocaleTimeString('nl-BE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      return `${day} ${dayNum} ${month} ${time}`;
    })
    .join(', ');

  console.log('Parsed suggested times:', suggestedTimes);

  return suggestedTimes;
}