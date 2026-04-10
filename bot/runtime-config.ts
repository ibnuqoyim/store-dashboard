/**
 * Runtime config — loaded from Supabase bot_config table, refreshed every 5 minutes.
 * Falls back to env vars if Supabase is not configured or table is empty.
 */
import { config } from './config.ts'

interface RuntimeConfig {
    isActive: boolean
    systemPrompt: string
    allowedNumbers: string[]
    aiProvider: string
    aiModel: string
}

// Start with env var defaults
let current: RuntimeConfig = buildDefaults()

function buildDefaults(): RuntimeConfig {
    // Derive the active model string from the current provider
    let aiModel = ''
    switch (config.provider) {
        case 'openrouter': aiModel = config.openrouter.model; break
        case 'claude':     aiModel = config.claude.model; break
        case 'openai':     aiModel = config.openai.model; break
        case 'ollama':     aiModel = config.ollama.model; break
    }

    return {
        isActive: true,
        systemPrompt: config.systemPrompt,
        allowedNumbers: config.allowedNumbers,
        aiProvider: config.provider,
        aiModel,
    }
}

async function loadFromSupabase(): Promise<void> {
    // Skip if Supabase not configured
    if (!config.supabase.url || !config.supabase.serviceKey) return

    try {
        // Import lazily to avoid startup errors when Supabase is not configured
        const { getSupabase } = await import('./supabase.ts')
        const sb = getSupabase()

        const { data } = await sb
            .from('bot_config')
            .select('*')
            .limit(1)
            .maybeSingle()

        if (!data) return // table empty — keep env var defaults

        const defaults = buildDefaults()

        current = {
            isActive:       data.is_active ?? defaults.isActive,
            systemPrompt:   data.system_prompt?.trim() || defaults.systemPrompt,
            allowedNumbers: data.allowed_numbers
                ? data.allowed_numbers.split(',').map((n: string) => n.trim()).filter(Boolean)
                : defaults.allowedNumbers,
            aiProvider:     data.ai_provider || defaults.aiProvider,
            aiModel:        data.ai_model    || defaults.aiModel,
        }

        console.log('[config] Runtime config synced from Supabase')
    } catch (err: any) {
        console.warn('[config] Could not sync runtime config from Supabase:', err.message)
    }
}

export function getRuntimeConfig(): RuntimeConfig {
    return current
}

export async function startConfigPolling(intervalMs = 5 * 60 * 1000): Promise<void> {
    await loadFromSupabase()

    setInterval(() => {
        loadFromSupabase().catch(() => {})
    }, intervalMs)
}
