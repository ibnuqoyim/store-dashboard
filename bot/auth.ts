import { getRuntimeConfig } from './runtime-config.ts'

function jidToNumber(jid: string): string {
    return jid.split('@')[0]
}

/**
 * Returns true if the sender is in the allowed numbers list.
 * List is read from runtime config (Supabase) — updates every 5 min without restart.
 */
export function isAllowed(jid: string): boolean {
    const { allowedNumbers } = getRuntimeConfig()
    if (allowedNumbers.length === 0) return false
    const number = jidToNumber(jid)
    return allowedNumbers.includes(number)
}
