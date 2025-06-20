import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const calendarId = process.env.CALENDAR_ID;

function getOAuthClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

export async function createCalendarEvent({
  summary,
  description,
  location,
  startDateTime,
  endDateTime,
}:{
  summary: string;
  description?: string; 
  location?: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string; // ISO 8601 format
}) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary,
    description,
    location,
    start: {
      dateTime: startDateTime,
      timeZone: 'Europe/Brussels',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Europe/Brussels',
    },
  };

  const response = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: event,
  });

  return response.data;
}

export async function listUpcomingEvents(maxResults: number = 5) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
    timeZone: 'Europe/Brussels',
  });

  return response.data.items || [];
}

export async function deleteEvent(eventId: string) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId: calendarId,
    eventId,
  });
}