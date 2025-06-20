export type WhatsAppMessage = {
  from: string;
  message: string;
  timestamp: string;
};

export function parseWhatsAppPayload(body: any): WhatsAppMessage | null { 
  try {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return null;

    return {
      from: message.from,
      message: message.text?.body || '',
      timestamp: message.timestamp,
    };
  } catch (error) {
    console.error('Error parsing WhatsApp payload:', error);
    return null;
  }
}