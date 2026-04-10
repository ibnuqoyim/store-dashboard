'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bot, Save, ToggleLeft, ToggleRight } from 'lucide-react'

interface BotConfig {
    id?: string
    is_active: boolean
    system_prompt: string
    allowed_numbers: string
    ai_provider: string
    ai_model: string
}

const DEFAULT_SYSTEM_PROMPT =
    `Kamu adalah asisten toko sourdough yang membantu pemilik toko via WhatsApp.\nGunakan bahasa Indonesia yang santai tapi sopan.\nJawab pertanyaan singkat dan jelas. Gunakan emoji secukupnya.`

const AI_PROVIDERS = [
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'claude',     label: 'Anthropic Claude' },
    { value: 'openai',     label: 'OpenAI' },
    { value: 'ollama',     label: 'Ollama (lokal)' },
]

export default function BotConfigForm({ initialConfig }: { initialConfig: BotConfig | null }) {
    const supabase = createClient()
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const [form, setForm] = useState<BotConfig>({
        is_active:       initialConfig?.is_active       ?? true,
        system_prompt:   initialConfig?.system_prompt   || DEFAULT_SYSTEM_PROMPT,
        allowed_numbers: initialConfig?.allowed_numbers ?? '',
        ai_provider:     initialConfig?.ai_provider     || 'openrouter',
        ai_model:        initialConfig?.ai_model        || 'openai/gpt-4o-mini',
    })

    const handleSave = async () => {
        setIsSaving(true)
        setSaved(false)

        const payload = {
            ...form,
            updated_at: new Date().toISOString(),
        }

        let error
        if (initialConfig?.id) {
            ;({ error } = await supabase
                .from('bot_config')
                .update(payload)
                .eq('id', initialConfig.id))
        } else {
            ;({ error } = await supabase.from('bot_config').insert(payload))
        }

        setIsSaving(false)
        if (!error) {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } else {
            alert('Gagal menyimpan: ' + error.message)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Bot className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">WhatsApp Bot Config</h1>
                        <p className="text-sm text-gray-500">
                            Perubahan berlaku dalam ~5 menit tanpa restart bot
                        </p>
                    </div>
                </div>

                {/* Active toggle */}
                <button
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        form.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    {form.is_active
                        ? <><ToggleRight className="w-4 h-4" /> Aktif</>
                        : <><ToggleLeft className="w-4 h-4" /> Nonaktif</>
                    }
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">

                {/* Allowed Numbers */}
                <div className="p-5 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Nomor yang Diizinkan
                    </label>
                    <p className="text-xs text-gray-400">
                        Pisahkan dengan koma. Format: nomor internasional tanpa + (contoh: 628123456789,248433927557286)
                    </p>
                    <input
                        type="text"
                        value={form.allowed_numbers}
                        onChange={e => setForm(f => ({ ...f, allowed_numbers: e.target.value }))}
                        placeholder="628123456789,628987654321"
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    />
                </div>

                {/* AI Provider */}
                <div className="p-5 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">AI Provider</label>
                    <div className="grid grid-cols-2 gap-2">
                        {AI_PROVIDERS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setForm(f => ({ ...f, ai_provider: p.value }))}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                                    form.ai_provider === p.value
                                        ? 'bg-green-50 border-green-400 text-green-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI Model */}
                <div className="p-5 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <p className="text-xs text-gray-400">
                        OpenRouter: <code className="bg-gray-100 px-1 rounded">openai/gpt-4o-mini</code> atau{' '}
                        <code className="bg-gray-100 px-1 rounded">google/gemma-3-4b-it:free</code>
                    </p>
                    <input
                        type="text"
                        value={form.ai_model}
                        onChange={e => setForm(f => ({ ...f, ai_model: e.target.value }))}
                        placeholder="openai/gpt-4o-mini"
                        className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    />
                </div>

                {/* System Prompt */}
                <div className="p-5 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">System Prompt</label>
                    <p className="text-xs text-gray-400">
                        Instruksi kepribadian dan perilaku bot
                    </p>
                    <textarea
                        value={form.system_prompt}
                        onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y font-mono"
                    />
                    <button
                        onClick={() => setForm(f => ({ ...f, system_prompt: DEFAULT_SYSTEM_PROMPT }))}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                        Reset ke default
                    </button>
                </div>
            </div>

            {/* Save button */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                    Perubahan akan diambil bot dalam ≤5 menit
                </p>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                        saved
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-900 text-white hover:bg-gray-700'
                    } disabled:opacity-50`}
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan'}
                </button>
            </div>
        </div>
    )
}
