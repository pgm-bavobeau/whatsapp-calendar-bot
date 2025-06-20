// scripts/auth.ts
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.error('❌ Error loading credentials.json', err);
  authorize(JSON.parse(content.toString()));
});

function authorize(credentials: any) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🔗 Visit this URL to authorize:\n', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\n🔐 Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('❌ Error retrieving access token', err);
      oAuth2Client.setCredentials(token!);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error('❌ Error saving token', err);
        console.log('✅ Token saved to', TOKEN_PATH);
      });
    });
  });
}
