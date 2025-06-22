import type { NextApiRequest, NextApiResponse } from "next";
import { parseWhatsAppPayload } from "@/lib/parseWhatsAppMessage";
import { isEventAvailable, checkEventAvailability } from "@/lib/checkAvailability";
import { sendWhatsAppTextMessage } from "@/services/whatsapp";
import { generateReplyFromOpenAI, suggestAvailableTimes } from "@/services/openai";
import {
  createCalendarEvent,
  listUpcomingEvents,
  listBusyTimes,
  deleteEvent,
  updateEventTime,
} from "@/services/google";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Verification handshake from Meta
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Verification failed");
    }
  } else if (req.method === "POST") {
    const body = req.body;
    const changes = body?.entry?.[0]?.changes?.[0];
    const messageObj = changes?.value?.messages?.[0];
    const businessPhoneNumberId = changes?.value?.metadata?.phone_number_id;

    if (
      !messageObj ||
      messageObj.type !== "text" ||
      !messageObj.from ||
      messageObj.from === businessPhoneNumberId
    ) {
      console.log("📭 Not a text message or invalid structure. Ignored.");
      return res.status(200).end();
    }

    const cleanMessage = parseWhatsAppPayload(req.body);

    if (cleanMessage) {
      const aiRaw = await generateReplyFromOpenAI(cleanMessage.message);

      let structured;
      try {
        structured = JSON.parse(aiRaw);
      } catch (e) {
        console.error("❌ Failed to parse AI response:", aiRaw);
        await sendWhatsAppTextMessage(
          cleanMessage.from,
          "Sorry, I couldn't process your request right now."
        );
        return res.status(200).end();
      }

      switch (structured.intent) {
        case "book":
          console.log("📅 Booking appointment with structured data:", structured);
          if (structured.datetime) {
            const startDate = new Date(structured.datetime);
            if (isNaN(startDate.getTime())) {
              await sendWhatsAppTextMessage(
                cleanMessage.from,
                "Invalid date format. Please provide a valid date and time."
              );
              return res.status(200).end();
            }
            const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes later
            
            // Check if the date/time is available if not return 3 available times
            const busyTimes = await listBusyTimes(startDate);

            // look through the busy times to see if the requested time is available
            let isAvailable = false;
            if (!busyTimes || busyTimes.length === 0  ) {
              console.log("No busy times found, assuming available");
              isAvailable = true;
            } else{
              isAvailable = isEventAvailable(
                busyTimes,
                startDate,
                endDate
              );
            };
            
            if (isAvailable) {
                const event = await createCalendarEvent({
                summary: structured.summary || "appointment via WhatsApp",
                phoneNumber: cleanMessage.from,
                startDateTime: startDate.toISOString(),
                endDateTime: endDate.toISOString(),
              });

              await sendWhatsAppTextMessage(
                cleanMessage.from,
                `${structured.reply} Details: ${event.htmlLink}`
              )
            } else {
              // Send data to OpenAI to get 3 available times similar to the requested time
              const suggestedTimes = await suggestAvailableTimes(
                busyTimes,
                { start: startDate.toISOString(), end: endDate.toISOString() }
              );
              
              await sendWhatsAppTextMessage(
                cleanMessage.from,
                `The requested time is not available. Here are 3 alternative times you can book: ${suggestedTimes}. Please reply with one of these times to confirm your appointment or provide a new date and time.`
              );

              // TODO: Store the suggested times in a session or database for later confirmation
              // This is important to handle the confirmation in a follow-up message
              return res.status(200).end();
            };
            return res.status(200).end();
          }
          // If no datetime, fall through to default reply
          await sendWhatsAppTextMessage(cleanMessage.from, structured.reply);
          return res.status(200).end();

        case "cancel":
          const events = await listUpcomingEvents(5);

          if (events.length === 0) {
            await sendWhatsAppTextMessage(
              cleanMessage.from,
              "There are no upcoming appointments to cancel."
            );
            return res.status(200).end();
          } else {
            const event = events[0]; // Just cancel the first upcoming event for simplicity
            await deleteEvent(event.id!);
            await sendWhatsAppTextMessage(
              cleanMessage.from,
              `Appointment cancelled: ${event.summary}`
            );
            return res.status(200).end();
          }

        case "reschedule":
          if (structured.datetime) {
            const events = await listUpcomingEvents();

            if (events.length === 0) {
              await sendWhatsAppTextMessage(
                cleanMessage.from,
                "there are no upcoming appointments to reschedule."
              );
              return res.status(200).end();
            } else {
              const event = events[0]; // Just reschedule the first upcoming event for simplicity
              const newStartDateTime = new Date(structured.datetime);
              const newEndDateTime = new Date(
                newStartDateTime.getTime() + 30 * 60 * 1000
              ); // 30 minutes later

              const updatedEvent = await updateEventTime(
                event.id!,
                newStartDateTime.toISOString(),
                newEndDateTime.toISOString()
              );

              await sendWhatsAppTextMessage(
                cleanMessage.from,
                `Appointment moved to ${newStartDateTime.toLocaleString()}. Details: ${
                  updatedEvent.htmlLink
                }`
              );
              return res.status(200).end();
            }
          }

        case "status":
            // TODO: Implement status check logic 
            break;

        default:
          // For unknown intents, just send the AI reply  
          // TODO: Implement more structured handling for unknown intents
          await sendWhatsAppTextMessage(cleanMessage.from, structured.reply);
          return res.status(200).end();
      }
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
}
