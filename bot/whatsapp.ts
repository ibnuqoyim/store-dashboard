import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    isJidBroadcast,
    isJidGroup,
    type WASocket,
    type WAMessage,
    type Contact,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { config } from './config.ts'
import { getRuntimeConfig } from './runtime-config.ts'
import { isAllowed } from './auth.ts'
import { getMessages, appendMessage, resetHistory, historyLength } from './conversation.ts'
import type { AIProvider } from './providers/types.ts'
import { createBatchPO } from './tools/po.ts'
import { createOrder, getOrdersByCustomer, getLatestBatchResume, parseOrderItems } from './tools/order.ts'
import { generateInvoicePDF } from './tools/invoice.ts'
import { addItemsToOrder, updateItemQty, setShipping, markOrderPaid } from './tools/update-order.ts'

// ─── LID → phone JID mapping ──────────────────────────────────────────────────

/**
 * WhatsApp now uses LID (Linked Device ID) for some contacts instead of the
 * phone-based JID. We build a map so we can resolve LID back to a phone JID
 * for whitelist checks.
 *
 * lid  → phoneJid  e.g. "248433927557286@lid" → "628xxx@s.whatsapp.net"
 */
const lidToPhone = new Map<string, string>()

function updateContacts(contacts: Contact[]): void {
    for (const c of contacts) {
        // A contact has both `id` (phone JID) and `lid` (LID JID) when the
        // linked-device feature is active.
        if (c.id && c.lid) {
            lidToPhone.set(c.lid, c.id)
        }
    }
}

/**
 * Resolve the effective JID for auth/history purposes.
 * If the message arrived with a LID, map it back to the phone JID.
 * Falls back to the original JID if no mapping exists yet.
 */
function resolveJid(jid: string): string {
    if (jid.endsWith('@lid')) {
        return lidToPhone.get(jid) ?? jid
    }
    return jid
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract plain text from any WhatsApp message type. */
function extractText(msg: WAMessage): string {
    const m = msg.message
    if (!m) return ''
    return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        ''
    ).trim()
}

/** Send a text reply to a JID. */
async function sendText(sock: WASocket, jid: string, text: string): Promise<void> {
    await sock.sendMessage(jid, { text })
}

// ─── Message handler ──────────────────────────────────────────────────────────

async function handleMessage(
    sock: WASocket,
    msg: WAMessage,
    provider: AIProvider,
): Promise<void> {
    const rawJid = msg.key.remoteJid!
    // Resolve LID → phone JID for auth and conversation history
    const jid = resolveJid(rawJid)
    const text = extractText(msg)

    if (!text) return

    // Bot active check
    if (!getRuntimeConfig().isActive) {
        console.log(`[wa] bot inactive — ignoring message from ${rawJid}`)
        return
    }

    // Whitelist check
    if (!isAllowed(jid)) {
        const num = jid.split('@')[0]
        console.log(`[wa] blocked from ${rawJid} — tambahkan "${num}" ke ALLOWED_WA_NUMBERS jika ini kamu`)
        return
    }

    console.log(`[wa] ← ${jid.split('@')[0]}: ${text.slice(0, 80)}`)

    // Built-in commands (no AI needed)
    if (text.toLowerCase() === '/reset') {
        resetHistory(jid)
        await sendText(sock, rawJid, '🗑️ Riwayat percakapan telah dihapus.')
        return
    }

    if (text.toLowerCase() === '/status') {
        await sendText(
            sock,
            rawJid,
            `✅ Bot aktif\n` +
            `🤖 Provider: ${provider.name}\n` +
            `💬 Riwayat: ${historyLength(jid)} pesan`,
        )
        return
    }

    if (text.toLowerCase() === '/help') {
        await sendText(
            sock,
            rawJid,
            `🤖 *Perintah yang tersedia:*\n\n` +
            `*Data Toko:*\n` +
            `/resume              — ringkasan order di batch terbaru\n` +
            `/cari <nama>         — cari pesanan by nama pemesan\n` +
            `/bayar <nama>        — tandai order lunas\n` +
            `/invoice <nama>      — kirim PDF invoice ke WhatsApp\n` +
            `/order <nama> | <produk:qty,...>  — buat order baru\n` +
            `/update <nama> tambah <produk:qty,...>  — tambah produk\n` +
            `/update <nama> qty <produk>:<qty>       — ganti qty (0=hapus)\n` +
            `/update <nama> ongkir <biaya>           — set ongkir\n` +
            `/update <nama> ongkir <kurir>:<biaya>   — set ongkir + kurir\n` +
            `/po baru <nama>      — buat batch PO baru\n\n` +
            `*Bot:*\n` +
            `/status — status bot\n` +
            `/reset  — hapus riwayat percakapan\n` +
            `/help   — tampilkan pesan ini\n\n` +
            `Contoh order:\n` +
            `/order Budi Santoso | sourdough:2, croissant:1`,
        )
        return
    }

    // ── Store tools ──────────────────────────────────────────────────────────

    if (text.toLowerCase().startsWith('/po baru ')) {
        const name = text.slice('/po baru '.length).trim()
        if (!name) {
            await sendText(sock, rawJid, '⚠️ Format: /po baru <nama batch>')
            return
        }
        try {
            const result = await createBatchPO(name)
            await sendText(sock, rawJid, result)
        } catch (err: any) {
            await sendText(sock, rawJid, `⚠️ ${err.message}`)
        }
        return
    }

    if (text.toLowerCase() === '/resume') {
        try {
            const result = await getLatestBatchResume()
            await sendText(sock, rawJid, result)
        } catch (err: any) {
            await sendText(sock, rawJid, `⚠️ ${err.message}`)
        }
        return
    }

    if (text.toLowerCase().startsWith('/cari ')) {
        const name = text.slice('/cari '.length).trim()
        if (!name) {
            await sendText(sock, rawJid, '⚠️ Format: /cari <nama pemesan>')
            return
        }
        try {
            const result = await getOrdersByCustomer(name)
            await sendText(sock, rawJid, result)
        } catch (err: any) {
            await sendText(sock, rawJid, `⚠️ ${err.message}`)
        }
        return
    }

    if (text.toLowerCase().startsWith('/invoice ')) {
        const name = text.slice('/invoice '.length).trim()
        if (!name) {
            await sendText(sock, rawJid, '⚠️ Format: /invoice <nama pemesan>')
            return
        }
        try {
            await sock.sendPresenceUpdate('composing', rawJid)
            const { buffer, fileName, customerName, invoiceNumber } = await generateInvoicePDF(name)
            await sock.sendMessage(rawJid, {
                document: buffer,
                mimetype: 'application/pdf',
                fileName,
                caption: `📄 Invoice *${invoiceNumber}* untuk *${customerName}*`,
            })
            console.log(`[wa] → ${jid.split('@')[0]}: sent invoice PDF ${fileName}`)
        } catch (err: any) {
            await sendText(sock, rawJid, `⚠️ ${err.message}`)
        }
        return
    }

    if (text.toLowerCase().startsWith('/bayar ')) {
        const name = text.slice('/bayar '.length).trim()
        if (!name) {
            await sendText(sock, rawJid, '⚠️ Format: /bayar <nama pemesan>')
            return
        }
        try {
            const result = await markOrderPaid(name)
            await sendText(sock, rawJid, result)
        } catch (err: any) {
            await sendText(sock, rawJid, `⚠️ ${err.message}`)
        }
        return
    }

    if (text.toLowerCase().startsWith('/update ')) {
        // /update <nama> tambah <produk:qty,...>
        // /update <nama> qty <produk>:<qty>
        // /update <nama> ongkir <biaya>
        // /update <nama> ongkir <kurir>:<biaya>

        const body = text.slice('/update '.length).trim()

        // Split "nama" from "subcommand args" — keyword is tambah | qty | ongkir
        const match = body.match(/^(.+?)\s+(tambah|qty|ongkir)\s+(.+)$/i)
        if (!match) {
            await sendText(
                sock, rawJid,
                '⚠️ Format:\n' +
                '/update <nama> tambah <produk:qty,...>\n' +
                '/update <nama> qty <produk>:<qty>\n' +
                '/update <nama> ongkir <biaya>\n' +
                '/update <nama> ongkir <kurir>:<biaya>',
            )
            return
        }

        const [, customerName, subCmd, args] = match

        try {
            let result: string

            if (subCmd.toLowerCase() === 'tambah') {
                const { parseOrderItems } = await import('./tools/order.ts')
                const items = parseOrderItems(args)
                if (!items) {
                    await sendText(sock, rawJid, '⚠️ Format produk tidak valid. Contoh: sourdough:2, croissant:1')
                    return
                }
                result = await addItemsToOrder(customerName.trim(), items)

            } else if (subCmd.toLowerCase() === 'qty') {
                // args: "<produk>:<qty>"
                const colonIdx = args.lastIndexOf(':')
                if (colonIdx === -1) {
                    await sendText(sock, rawJid, '⚠️ Format: /update <nama> qty <produk>:<qty>\nContoh: /update Budi qty sourdough:3')
                    return
                }
                const productName = args.slice(0, colonIdx).trim()
                const qty = parseInt(args.slice(colonIdx + 1).trim(), 10)
                if (!productName || isNaN(qty) || qty < 0) {
                    await sendText(sock, rawJid, '⚠️ Qty harus berupa angka ≥ 0 (0 = hapus item).')
                    return
                }
                result = await updateItemQty(customerName.trim(), productName, qty)

            } else {
                // ongkir — args: "<biaya>" or "<kurir>:<biaya>"
                const colonIdx = args.lastIndexOf(':')
                let courier: string | null = null
                let cost: number

                if (colonIdx !== -1) {
                    courier = args.slice(0, colonIdx).trim() || null
                    cost = parseInt(args.slice(colonIdx + 1).trim(), 10)
                } else {
                    cost = parseInt(args.trim(), 10)
                }

                if (isNaN(cost) || cost < 0) {
                    await sendText(sock, rawJid, '⚠️ Biaya ongkir harus berupa angka.\nContoh: /update Budi ongkir 15000  atau  /update Budi ongkir JNE:15000')
                    return
                }

                result = await setShipping(customerName.trim(), cost, courier)
            }

            await sendText(sock, rawJid, result)
        } catch (err: any) {
            await sendText(sock, rawJid, `⚠️ ${err.message}`)
        }
        return
    }

    if (text.toLowerCase().startsWith('/order ')) {
        const body = text.slice('/order '.length)
        const pipeIdx = body.indexOf('|')
        if (pipeIdx === -1) {
            await sendText(
                sock, rawJid,
                '⚠️ Format: /order <nama> | <produk:qty,...>\nContoh: /order Budi | sourdough:2, croissant:1',
            )
            return
        }
        const customerName = body.slice(0, pipeIdx).trim()
        const itemsRaw = body.slice(pipeIdx + 1).trim()
        const items = parseOrderItems(itemsRaw)

        if (!customerName) {
            await sendText(sock, rawJid, '⚠️ Nama pemesan tidak boleh kosong.')
            return
        }
        if (!items) {
            await sendText(
                sock, rawJid,
                '⚠️ Format produk tidak valid.\nContoh: sourdough:2, croissant:1',
            )
            return
        }
        try {
            const result = await createOrder(customerName, items)
            await sendText(sock, rawJid, result)
        } catch (err: any) {
            await sendText(sock, rawJid, `⚠️ ${err.message}`)
        }
        return
    }

    // Typing indicator
    await sock.sendPresenceUpdate('composing', rawJid)

    // Build message list and call AI
    appendMessage(jid, 'user', text)
    const messages = getMessages(jid, getRuntimeConfig().systemPrompt)

    let reply: string
    try {
        reply = await provider.chat(messages)
        if (!reply) reply = 'Maaf, saya tidak mendapat respons dari AI. Coba lagi.'
    } catch (err: any) {
        console.error(`[ai] error:`, err.message)
        reply = `⚠️ Terjadi kesalahan: ${err.message}`
    }

    appendMessage(jid, 'assistant', reply)

    await sock.sendPresenceUpdate('paused', rawJid)
    await sendText(sock, rawJid, reply)

    console.log(`[wa] → ${jid.split('@')[0]}: ${reply.slice(0, 80)}`)
}

// ─── Connection ───────────────────────────────────────────────────────────────

export async function startWhatsApp(provider: AIProvider): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        // Suppress Baileys' verbose pino logs
        logger: pino({ level: 'silent' }) as any,
        // Don't download media we don't need
        getMessage: async () => undefined,
    })

    // Persist credentials whenever they change
    sock.ev.on('creds.update', saveCreds)

    // Build LID → phone mapping from contacts
    sock.ev.on('contacts.upsert', updateContacts)
    sock.ev.on('contacts.update', (updates) => {
        // contacts.update items are Partial<Contact>, filter those with lid
        updateContacts(updates as Contact[])
    })

    // Connection lifecycle
    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('\n[wa] Scan QR code berikut dengan WhatsApp kamu:\n')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            console.log('[wa] ✅ Terhubung ke WhatsApp')
        }

        if (connection === 'close') {
            const code = (lastDisconnect?.error as Boom)?.output?.statusCode
            const loggedOut = code === DisconnectReason.loggedOut

            if (loggedOut) {
                console.log('[wa] ❌ Logged out. Hapus folder session/ dan jalankan ulang untuk scan QR baru.')
                process.exit(1)
            } else {
                console.log(`[wa] Koneksi terputus (code=${code}). Reconnect dalam 5 detik...`)
                setTimeout(() => startWhatsApp(provider), 5_000)
            }
        }
    })

    // Incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return

        for (const msg of messages) {
            // Skip: no content, sent by us, broadcast, group
            if (!msg.message) continue
            if (msg.key.fromMe) continue
            if (!msg.key.remoteJid) continue
            if (isJidBroadcast(msg.key.remoteJid)) continue
            if (isJidGroup(msg.key.remoteJid)) continue

            handleMessage(sock, msg, provider).catch(err =>
                console.error('[wa] Unhandled error in handleMessage:', err)
            )
        }
    })
}
