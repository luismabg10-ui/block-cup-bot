const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const START_HOUR = 1;
const EVENT_DURATION_MIN = 15;
const WARNING_MIN = 10;

function getNextEventTime() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const events = [];
  for (let h = START_HOUR; h < 24; h += 2) {
    events.push(h * 60);
  }
  for (const eventMin of events) {
    if (eventMin > currentMinutes) {
      const next = new Date(now);
      next.setHours(Math.floor(eventMin / 60), eventMin % 60, 0, 0);
      return next;
    }
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(START_HOUR, 0, 0, 0);
  return tomorrow;
}

function formatTime(date) {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
}

async function sendNotification(message) {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send(message);
  } catch (err) {
    console.error('Error:', err);
  }
}

function scheduleNotifications() {
  const nextEvent = getNextEventTime();
  const now = new Date();
  const msToEvent = nextEvent - now;
  const msToWarning = msToEvent - WARNING_MIN * 60 * 1000;

  if (msToWarning > 0) {
    setTimeout(async () => {
      await sendNotification(`@here ⚠️ **¡La Copa de Bloques empieza en 10 minutos!**\n🕐 Hora: **${formatTime(nextEvent)}**`);
    }, msToWarning);
  }

  setTimeout(async () => {
    await sendNotification(`@everyone 🏆 **¡La Copa de Bloques ha comenzado!**\n🕐 Hora: **${formatTime(nextEvent)}** — Tienes **${EVENT_DURATION_MIN} minutos** para jugar!`);
    scheduleNotifications();
  }, msToEvent);
}

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  scheduleNotifications();
});

client.login(TOKEN);
