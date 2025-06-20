import type { NextApiRequest, NextApiResponse } from 'next';
import { parseWhatsAppPayload } from '@/lib/parseWhatsAppMessage';
import { sendWhatsAppTextMessage } from '@/services/whatsapp';
import { generateReplyFromOpenAI } from '@/services/openai';
import { createCalendarEvent } from '@/lib/google';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Verification handshake from Meta
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Verification failed');
    }
  }

  else if (req.method === 'POST') {
    const body = req.body;

    const changes = body?.entry?.[0]?.changes?.[0];
    const messageObj = changes?.value?.messages?.[0];
    const businessPhoneNumberId = changes?.value?.metadata?.phone_number_id;

    if (!messageObj || messageObj.type !== 'text' || !messageObj.from || messageObj.from === businessPhoneNumberId ) {
      console.log('📭 Not a text message or invalid structure. Ignored.');      
      return res.status(200).end();
    }

    const cleanMessage = parseWhatsAppPayload(req.body);

    if (cleanMessage) {
      const aiRaw = await generateReplyFromOpenAI(cleanMessage.message);

      console.log('🤖 AI response:', aiRaw);
      let structured;
      try {
        structured = JSON.parse(aiRaw);
      } catch (e) {
        console.error('❌ Failed to parse AI response:', aiRaw);
        await sendWhatsAppTextMessage(cleanMessage.from, "Sorry, I couldn't process your request right now.");
        return res.status(200).end();
      }

      if (structured.intent === 'book' && structured.datetime) {
        const startDate = new Date(structured.datetime);
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes later

        const event = await createCalendarEvent({
          summary: structured.summary || 'Afspraak via whatsapp',
          description: structured.description || 'Automatisch geboekte afspraak via de bot',
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
        });

        await sendWhatsAppTextMessage(cleanMessage.from, `${structured.reply} Bekijk details: ${event.htmlLink}`);
        return res.status(200).end();
      } else {
        await sendWhatsAppTextMessage(cleanMessage.from, structured.reply);
        return res.status(200).end();
      }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }}
}