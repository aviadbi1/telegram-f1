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
  Qualifying?: { date: string; time?: string };
  Sprint?: { date: string; time?: string };
}

async function fetchFullCalendar(): Promise<Race[]> {
  const url = 'https://ergast.com/api/f1/current.json';
  const res = await axios.get(url);
  return res.data.MRData.RaceTable.Races as Race[];
}

async function fetchNextRace(): Promise<Race[]> {
  const url = 'https://ergast.com/api/f1/current/next.json';
  const res = await axios.get(url);
  return res.data.MRData.RaceTable.Races as Race[];
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

