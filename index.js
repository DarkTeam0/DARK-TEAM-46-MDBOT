// ==== IMPORTS ====
const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// ==== DATA FILE FOR PAIRING CODES ====
const PAIRING_DB = './pairing.json';

// ==== LOAD OR CREATE PAIRING DATABASE ====
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

// ==== GENERATE RANDOM 6 or 8 DIGIT CODE ====
function generateCode(length = 6) {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

// ==== MAIN BOT FUNCTION ====
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to', lastDisconnect.error, ', reconnecting', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection
