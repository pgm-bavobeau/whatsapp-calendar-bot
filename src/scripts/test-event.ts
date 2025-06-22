import { createCalendarEvent } from "../services/google";

const now = new Date();
const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

createCalendarEvent({
  summary: "Testafspraak via bot",
  phoneNumber: "+32412345678", // Example phone number
  startDateTime: now.toISOString(),
  endDateTime: inOneHour.toISOString(),
})
  .then((event) => {
    console.log("Event aangemaakt:", event.htmlLink);
  })
  .catch((err) => {
    console.error("Fout bij aanmaken event:", err);
  });
