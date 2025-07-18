import { google, calendar_v3 } from "googleapis";
import fs from "fs";
import path from "path";
import FreeBusyCalendar = calendar_v3.Schema$FreeBusyCalendar;

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const calendarId = process.env.CALENDAR_ID || "primary";

function getOAuthClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

export async function createCalendarEvent({
  summary,
  phoneNumber,
  startDateTime,
  endDateTime,
}: {
  summary: string;
  phoneNumber: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string; // ISO 8601 format
}) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary,
    description: `Afspraak via WhatsApp met telefoonnummer: ${phoneNumber}`,
    start: {
      dateTime: startDateTime,
      timeZone: "Europe/Brussels",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Europe/Brussels",
    },
  };

  const response = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: event,
  });

  return response.data;
}

// List upcoming events from the calendar
export async function listUpcomingEvents(maxResults: number = 5) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
    timeZone: "Europe/Brussels",
  });

  return response.data.items || [];
}

// List time not available for a specific dates
export async function listBusyTimes(startDate: Date, endDate?: Date): Promise<FreeBusyCalendar["busy"]> {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  startDate = new Date(startDate);
  startDate.setHours(0, 0, 0, 0); 

  if (!endDate) { 
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // Default to 1 week later
  } 


  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      timeZone: "Europe/Brussels", 
      items: [{ id: calendarId }],
    },
  });

  return response.data.calendars?.[calendarId].busy;
};

export async function deleteEvent(eventId: string) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: calendarId,
    eventId,
  });
}

export async function updateEventTime(
  eventId: string,
  newStartDateTime: string,
  newEndDateTime: string
) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    start: {
      dateTime: newStartDateTime,
      timeZone: "Europe/Brussels",
    },
    end: {
      dateTime: newEndDateTime,
      timeZone: "Europe/Brussels",
    },
  };

  const response = await calendar.events.patch({
    calendarId: calendarId,
    eventId,
    requestBody: event,
  });

  return response.data;
}
