
# 📅 WhatsApp Calendar Bot

A chatbot that lets clients **book**, **reschedule**, and **cancel appointments** via WhatsApp. Appointments are synced with a **Google Calendar**, making this ideal for small businesses like therapists, clinics, or salons.

**Stack:**
- Next.js (App Router + TypeScript)
- OpenAI API (for natural language understanding)
- Google Calendar API
- WhatsApp Business Cloud API
- Ngrok (for local development testing)

## 🚀 Features

- Receive and respond to WhatsApp messages
- Understand user intent using AI (OpenAI)
- Automatically create and manage Google Calendar events
- Check for double bookings before confirming
- Prevents loops or message flooding
- Clean and extensible codebase using official APIs only

## 📁 Project Structure

src  
├── app  
│   └── api  
│       └── webhook             # Handles WhatsApp webhook events  
├── lib  
│   ├── openai.ts               # Handles communication with OpenAI API  
│   ├── google.ts               # Handles calendar creation and availability checks  
│   └── whatsapp.ts             # Sends messages via WhatsApp Cloud API  
├── scripts  
│   └── auth.ts                 # Sets up Google OAuth client  
.env.local                      # Environment variables  

## 🛠️ Getting Started

### 1. Clone and install

```bash
git clone https://github.com/yourusername/whatsapp-calendar-bot.git
cd whatsapp-calendar-bot
npm install
```

### 2. Create a `.env.local` file

Add the following:

```env
# Whatsapp Business API Configuration
WHATSAPP_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# OpenAI API Configuration
OPENAI_API_KEY=

# google cloud configuration
CALENDAR_ID=
```

### 3. Start Next.js server

```bash
npm run dev
```

### 4. Expose your local server using Ngrok

```bash
npx ngrok http 3000
```

Copy the HTTPS URL and use it in the **Meta for Developers** dashboard as your WhatsApp webhook:

## 🤖 How It Works

1. A user sends a WhatsApp message.
2. The webhook receives it.
3. The message is sent to OpenAI to detect intent and extract date/time.
4. The bot checks availability via Google Calendar.
5. If free: the appointment is booked. If not: a new time is requested.
6. Confirmation is sent back via WhatsApp.

## ✨ Supported User Intents

| Example Message                          | Intent      |
|------------------------------------------|-------------|
| "Can I book a massage next Tuesday?"     | `book`      |
| "Reschedule my session to 3 PM"          | `reschedule`|
| "Cancel my appointment tomorrow"         | `cancel`    |
| "What is my next appointment?"           | `status`    |

## ✅ Future Improvements

- Support for appointment types
- Admin panel for managing bookings
- Persistent storage/logging of user sessions
- Google Calendar event descriptions and attendees

## 📚 Tech Stack

- [Next.js](https://nextjs.org/)
- [OpenAI API](https://platform.openai.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/)
- [Ngrok](https://ngrok.com/)

## 👤 Author

**Bavo Beaumon**  
_Full Stack Web Developer_  
GitHub: [@pgm-bavobeau](https://github.com/pgm-bavobeau)
