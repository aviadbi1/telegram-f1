import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import moment from 'moment-timezone';

function startBot(): TelegramBot {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('BOT_TOKEN environment variable is required');
    throw new Error('BOT_TOKEN environment variable is required');
  }

  console.log('Starting bot...');
  const bot = new TelegramBot(token, { polling: true });

  console.log('Bot started successfully');

  bot.onText(/\/start/, msg => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      'Welcome to F1-Schedule!\nSend "full calendar" or "next race" to get information.'
    );
  });

  bot.on('message', async msg => {
    const chatId = msg.chat.id;
    const text = msg.text?.toLowerCase();

    console.log(`Received message from ${chatId}: ${text}`);

    if (text === 'full calendar') {
      try {
        const races = await fetchFullCalendar();
        const message = races.map(formatRace).join('\n\n');
        console.log(`Sending response to ${chatId}: ${message.replace(/\n/g, ' | ')}`);
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Failed to load calendar', err);
        bot.sendMessage(chatId, 'Failed to load calendar');
      }
    } else if (text === 'next race') {
      try {
        const races = await fetchNextRace();
        if (races.length === 0) {
          bot.sendMessage(chatId, 'No upcoming races found');
          return;
        }
        const message = races.map(formatRace).join('\n\n');
        console.log(`Sending response to ${chatId}: ${message.replace(/\n/g, ' | ')}`);
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Failed to load next race', err);
        bot.sendMessage(chatId, 'Failed to load next race');
      }
    }
  });

  return bot;
}


interface Race {
  raceName: string;
  Circuit: {
    circuitName: string;
  };
  date: string;
  time?: string;
  startTime: string;
  Qualifying?: { date: string; time?: string };
  Sprint?: { date: string; time?: string };
}

interface OpenF1Session {
  meeting_name?: string;
  location?: string;
  country_name?: string;
  circuit_short_name: string;
  session_name: string;
  date_start: string;
}

async function fetchFullCalendar(year = new Date().getFullYear()): Promise<Race[]> {
  const url = `https://api.openf1.org/v1/sessions?session_name=Race&year=${year}`;
  const res = await axios.get<OpenF1Session[]>(url);
  return res.data.map(mapSessionToRace).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

async function fetchNextRace(): Promise<Race[]> {
  const now = new Date();
  let races = await fetchFullCalendar(now.getFullYear());
  let next = races.find(r => new Date(r.startTime) > now);
  if (!next) {
    races = await fetchFullCalendar(now.getFullYear() + 1);
    next = races[0];
  }
  return next ? [next] : [];
}

function mapSessionToRace(session: OpenF1Session): Race {
  const [date, time] = session.date_start.split('T');
  const raceName =
    session.meeting_name ??
    (session.location ? `${session.location} GP` : session.country_name ?? '');

  return {
    raceName,
    Circuit: { circuitName: session.circuit_short_name },
    date,
    time,
    startTime: session.date_start,
  };
}

function formatRace(race: Race): string {
  const jerusalem = 'Asia/Jerusalem';
  const raceDate = convertToTZ(race.date, race.time, jerusalem);
  const qual = race.Qualifying
    ? convertToTZ(race.Qualifying.date, race.Qualifying.time, jerusalem)
    : undefined;
  const sprint = race.Sprint
    ? convertToTZ(race.Sprint.date, race.Sprint.time, jerusalem)
    : undefined;

  let msg = `*${race.raceName}*\nCircuit: ${race.Circuit.circuitName}\nRace: ${raceDate}`;
  if (qual) {
    msg += `\nQualifying: ${qual}`;
  }
  if (sprint) {
    msg += `\nSprint: ${sprint}`;
  }
  return msg;
}

function convertToTZ(date: string, time = '00:00:00Z', tz: string): string {
  const m = moment.tz(`${date}T${time}`, tz);
  return m.format('YYYY-MM-DD HH:mm z');
}

export { startBot, formatRace, convertToTZ };

