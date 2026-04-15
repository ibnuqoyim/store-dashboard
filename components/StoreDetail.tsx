'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Bot, Store, ToggleLeft, ToggleRight, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { CldUploadWidget } from 'next-cloudinary'

type StoreRow = {
    id: string
    name: string
    description: string | null
    is_active: boolean
    phone: string | null
    logo_url: string | null
    bank_name: string | null
    bank_account: string | null
    bank_holder: string | null
    invoice_closing_message: string | null
    invoice_closing_sub: string | null
    invoice_prefix: string | null
}

type BotConfigRow = {
    id?: string
    is_active: boolean
    system_prompt: string
    allowed_numbers: string
    ai_provider: string
    ai_model: string
    store_id: string
}

const DEFAULT_SYSTEM_PROMPT =
    `Kamu adalah asisten toko yang membantu pemilik toko via WhatsApp.\nGunakan bahasa Indonesia yang santai tapi sopan.\nJawab pertanyaan singkat dan jelas. Gunakan emoji secukupnya.`

const AI_PROVIDERS = [
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'claude',     label: 'Anthropic Claude' },
    { value: 'openai',     label: 'OpenAI' },
    { value: 'ollama',     label: 'Ollama (lokal)' },
]

export default function StoreDetail({
    store,
    botConfig,
}: {
    store: StoreRow
    botConfig: BotConfigRow | null
}) {
    const supabase = createClient()
    const router = useRouter()

    // ── Store form ───────────────────────────────────────────────────────────
    const [storeForm, setStoreForm] = useState({
        name:                    store.name,
        description:             store.description ?? '',
        is_active:               store.is_active,
        phone:                   store.phone ?? '',
        logo_url:                store.logo_url ?? '',
        bank_name:               store.bank_name ?? '',
        bank_account:            store.bank_account ?? '',
        bank_holder:             store.bank_holder ?? '',
        invoice_closing_message: store.invoice_closing_message ?? 'Terima Kasih',
        invoice_closing_sub:     store.invoice_closing_sub ?? '',
        invoice_prefix:          store.invoice_prefix ?? '',
    })
    const [storeSaving, setStoreSaving] = useState(false)
    const [storeSaved, setStoreSaved]   = useState(false)

    const handleStoreSave = async () => {
        setStoreSaving(true)
        setStoreSaved(false)
        const { error } = await supabase
            .from('stores')
            .update({
                name:                    storeForm.name.trim(),
                description:             storeForm.description.trim() || null,
                is_active:               storeForm.is_active,
                phone:                   storeForm.phone.trim() || null,
                logo_url:                storeForm.logo_url.trim() || null,
                bank_name:               storeForm.bank_name.trim() || null,
                bank_account:            storeForm.bank_account.trim() || null,
                bank_holder:             storeForm.bank_holder.trim() || null,
                invoice_closing_message: storeForm.invoice_closing_message.trim() || null,
                invoice_closing_sub:     storeForm.invoice_closing_sub.trim() || null,
                invoice_prefix:          storeForm.invoice_prefix.trim().toUpperCase() || null,
            })
            .eq('id', store.id)
        setStoreSaving(false)
        if (error) alert('Gagal menyimpan: ' + error.message)
        else {
            setStoreSaved(true)
            setTimeout(() => setStoreSaved(false), 3000)
            router.refresh()
        }
    }

    // ── Bot config form ──────────────────────────────────────────────────────
    const [botForm, setBotForm] = useState<BotConfigRow>({
        is_active:       botConfig?.is_active       ?? true,
        system_prompt:   botConfig?.system_prompt   || DEFAULT_SYSTEM_PROMPT,
        allowed_numbers: botConfig?.allowed_numbers ?? '',
        ai_provider:     botConfig?.ai_provider     || 'openrouter',
        ai_model:        botConfig?.ai_model        || 'openai/gpt-4o-mini',
        store_id:        store.id,
    })
    const [botSaving, setBotSaving] = useState(false)
    const [botSaved, setBotSaved]   = useState(false)

    const handleBotSave = async () => {
        setBotSaving(true)
        setBotSaved(false)
        const payload = { ...botForm, updated_at: new Date().toISOString() }
        let error
        if (botConfig?.id) {
            ;({ error } = await supabase.from('bot_config').update(payload).eq('id', botConfig.id))
        } else {
            ;({ error } = await supabase.from('bot_config').insert(payload))
        }
        setBotSaving(false)
        if (error) alert('Gagal menyimpan bot config: ' + error.message)
        else {
            setBotSaved(true)
            setTimeout(() => setBotSaved(false), 3000)
            router.refresh()
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Back + Header */}
            <div>
                <Link
                    href="/stores"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft size={16} /> Kembali ke Stores
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Store className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">{store.name}</h1>
                        <p className="text-sm text-gray-500">Detail toko &amp; konfigurasi bot</p>
                    </div>
                </div>
            </div>

            {/* ── Section 1: Store Details ──────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-medium text-gray-900">Detail Toko</h2>
                    <button
                        onClick={() => setStoreForm(f => ({ ...f, is_active: !f.is_active }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            storeForm.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {storeForm.is_active
                            ? <><ToggleRight className="w-4 h-4" /> Aktif</>
                            : <><ToggleLeft className="w-4 h-4" /> Nonaktif</>}
                    </button>
                </div>

                <div className="divide-y divide-gray-100">
                    <div className="p-5 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
                            <input
                                type="text"
                                value={storeForm.name}
                                onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                            <input
                                type="text"
                                value={storeForm.description}
                                onChange={e => setStoreForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="mis: Toko di Jl. Sudirman"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                            <input
                                type="text"
                                value={storeForm.phone}
                                onChange={e => setStoreForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="mis: 628123456789"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo Toko</label>
                            <div className="flex items-center gap-3">
                                {storeForm.logo_url && (
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={storeForm.logo_url}
                                            alt="Logo"
                                            className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-gray-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setStoreForm(f => ({ ...f, logo_url: '' }))}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                )}
                                <CldUploadWidget
                                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'products'}
                                    onSuccess={(result: any) => {
                                        setStoreForm(f => ({ ...f, logo_url: result.info.secure_url }))
                                    }}
                                >
                                    {({ open }) => (
                                        <button
                                            type="button"
                                            onClick={() => open()}
                                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {storeForm.logo_url ? 'Ganti Logo' : 'Upload Logo'}
                                        </button>
                                    )}
                                </CldUploadWidget>
                            </div>
                        </div>
                    </div>

                    {/* Bank / Invoice */}
                    <div className="p-5 space-y-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Info Pembayaran (Invoice)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                                <input
                                    type="text"
                                    value={storeForm.bank_name}
                                    onChange={e => setStoreForm(f => ({ ...f, bank_name: e.target.value }))}
                                    placeholder="BCA"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening</label>
                                <input
                                    type="text"
                                    value={storeForm.bank_account}
                                    onChange={e => setStoreForm(f => ({ ...f, bank_account: e.target.value }))}
                                    placeholder="1234567890"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                                <input
                                    type="text"
                                    value={storeForm.bank_holder}
                                    onChange={e => setStoreForm(f => ({ ...f, bank_holder: e.target.value }))}
                                    placeholder="Nama Pemilik Rekening"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Penutup</label>
                                <input
                                    type="text"
                                    value={storeForm.invoice_closing_message}
                                    onChange={e => setStoreForm(f => ({ ...f, invoice_closing_message: e.target.value }))}
                                    placeholder="Terima Kasih"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Penutup</label>
                                <input
                                    type="text"
                                    value={storeForm.invoice_closing_sub}
                                    onChange={e => setStoreForm(f => ({ ...f, invoice_closing_sub: e.target.value }))}
                                    placeholder="opsional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Invoice</label>
                                <input
                                    type="text"
                                    value={storeForm.invoice_prefix}
                                    onChange={e => setStoreForm(f => ({ ...f, invoice_prefix: e.target.value.toUpperCase() }))}
                                    placeholder="mis: SDY → SDY-202604001"
                                    maxLength={10}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-400">Kosongkan jika tidak pakai prefix</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                        Store ID (untuk bot): <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{store.id}</code>
                    </p>
                    <button
                        onClick={handleStoreSave}
                        disabled={storeSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            storeSaved ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
                        } disabled:opacity-50`}
                    >
                        {storeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {storeSaving ? 'Menyimpan...' : storeSaved ? 'Tersimpan!' : 'Simpan Detail'}
                    </button>
                </div>
            </div>

            {/* ── Section 2: Bot Config ─────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-green-600" />
                        <h2 className="font-medium text-gray-900">Bot Config</h2>
                        {!botConfig && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Belum dibuat</span>
                        )}
                    </div>
                    <button
                        onClick={() => setBotForm(f => ({ ...f, is_active: !f.is_active }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            botForm.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {botForm.is_active
                            ? <><ToggleRight className="w-4 h-4" /> Aktif</>
                            : <><ToggleLeft className="w-4 h-4" /> Nonaktif</>}
                    </button>
                </div>

                <div className="divide-y divide-gray-100">
                    {/* Allowed Numbers */}
                    <div className="p-5 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Nomor yang Diizinkan</label>
                        <p className="text-xs text-gray-400">
                            Pisahkan dengan koma. Format internasional tanpa + (mis: 628123456789)
                        </p>
                        <input
                            type="text"
                            value={botForm.allowed_numbers}
                            onChange={e => setBotForm(f => ({ ...f, allowed_numbers: e.target.value }))}
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
                                    onClick={() => setBotForm(f => ({ ...f, ai_provider: p.value }))}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                                        botForm.ai_provider === p.value
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
                        <input
                            type="text"
                            value={botForm.ai_model}
                            onChange={e => setBotForm(f => ({ ...f, ai_model: e.target.value }))}
                            placeholder="openai/gpt-4o-mini"
                            className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                        />
                    </div>

                    {/* System Prompt */}
                    <div className="p-5 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">System Prompt</label>
                        <textarea
                            value={botForm.system_prompt}
                            onChange={e => setBotForm(f => ({ ...f, system_prompt: e.target.value }))}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y font-mono"
                        />
                        <button
                            onClick={() => setBotForm(f => ({ ...f, system_prompt: DEFAULT_SYSTEM_PROMPT }))}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            Reset ke default
                        </button>
                    </div>

                    {/* Deploy hint */}
                    <div className="p-5 bg-gray-50 rounded-b-xl">
                        <p className="text-xs font-medium text-gray-500 mb-2">Setup Fly.io untuk toko ini:</p>
                        <code className="block text-xs bg-white border border-gray-200 rounded p-2 text-gray-700 font-mono">
                            fly secrets set BOT_STORE_ID={store.id}
                        </code>
                        <p className="text-xs text-gray-400 mt-1">
                            Set env var ini di setiap instance bot yang ingin menggunakan toko ini.
                        </p>
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-xs text-gray-400">Perubahan berlaku dalam ≤5 menit</p>
                    <button
                        onClick={handleBotSave}
                        disabled={botSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            botSaved ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
                        } disabled:opacity-50`}
                    >
                        {botSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {botSaving ? 'Menyimpan...' : botSaved ? 'Tersimpan!' : 'Simpan Bot Config'}
                    </button>
                </div>
            </div>
        </div>
    )
}
