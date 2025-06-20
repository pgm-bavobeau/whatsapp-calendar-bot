import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

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
    calendarId: 'd22cc475dffed1336b1576adf79b437d108ff7bbc52554c8b3b5cda65f6e6ed0@group.calendar.google.com',
    requestBody: event,
  });

  return response.data;
}