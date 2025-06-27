const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const P = require('pino');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    version
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
      console.log('🟡 Connecting...');
    }

    if (connection === 'open') {
      console.log('✅ Connected as', sock.user.id);
    }

    if (connection === 'close') {
      console.log('❗ Connection closed. Reconnecting...');
      startBot();
    }

    if (!state.creds.registered) {
      console.log('🟠 Waiting for user number to create Pairing Code...');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    console.log(`📩 From ${sender}: ${text}`);

    // COMMANDS
    if (text === '.menu') {
      await sock.sendMessage(sender, {
        image: { url: './darkteam46.jpg' },
        caption: `🌟 *DARK-TEAM-46 BOT MENU* 🌟

✅ Language Selection
✅ Join Group
✅ Get Pairing Code
✅ Admin Powered`,
        footer: 'POWER OF DARK-TEAM-46',
        buttons: [
          { buttonId: '.language', buttonText: { displayText: '🌐 Language' }, type: 1 },
          { buttonId: '.group', buttonText: { displayText: '📌 Join Group' }, type: 1 },
          { buttonId: '.pair', buttonText: { displayText: '🔗 Get Pairing Code' }, type: 1 },
        ],
        headerType: 4
      });
    }

    if (text === '.language') {
      await sock.sendMessage(sender, {
        text: '🌐 *Choose Language*\n\nSelect one:',
        footer: 'DARK-TEAM-46',
        buttons: [
          { buttonId: '.lang en', buttonText: { displayText: 'English' }, type: 1 },
          { buttonId: '.lang ur', buttonText: { displayText: 'اردو' }, type: 1 },
        ],
        headerType: 1
      });
    }

    if (text.startsWith('.lang ')) {
      const lang = text.split(' ')[1];
      await sock.sendMessage(sender, { text: `✅ Language set to: ${lang}` });
    }

    if (text === '.group') {
      await sock.sendMessage(sender, {
        text: '📌 *Join our WhatsApp Group:*\nhttps://chat.whatsapp.com/GfNJRCO9dJ0IkKjGRjekwz',
        footer: 'DARK-TEAM-46',
        buttons: [
          { buttonId: '.done', buttonText: { displayText: '✅ Done' }, type: 1 }
        ],
        headerType: 1
      });
    }

    if (text === '.done') {
      await sock.sendMessage(sender, { text: '✅ Thank you for joining our group!' });
    }

    if (text === '.pair') {
      await sock.sendMessage(sender, {
        text: '📲 *Send your number with country code:*\nExample:\n.pair +923001234567'
      });
    }

    if (text.startsWith('.pair ')) {
      const phoneNumber = text.split(' ')[1];
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        await sock.sendMessage(sender, { text: `✅ Your 6–8 digit Pairing Code:\n${code}` });
      } catch (e) {
        console.error(e);
        await sock.sendMessage(sender, { text: '❗ Error generating pairing code. Try again.' });
      }
    }
  });
}

startBot();