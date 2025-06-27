const readline = require('readline');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');

const PAIRING_DB = './pairing.json';

function loadDB() {
    if (fs.existsSync(PAIRING_DB)) {
        return JSON.parse(fs.readFileSync(PAIRING_DB));
    } else {
        return {};
    }
}

function saveDB(data) {
    fs.writeFileSync(PAIRING_DB, JSON.stringify(data, null, 2));
}

function generateCode(length = 6) {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

async function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

async function startBot() {
    console.log('✅ Starting DARK-TEAM-46 MD BOT');

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        browser: ["DARK-TEAM-46", "Chrome", "1.0"]
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        if (qr) {
            console.log('📌 SCAN THIS QR CODE IN WHATSAPP!');
        }
        if (connection === 'open') {
            console.log('✅ BOT CONNECTED');

            /
