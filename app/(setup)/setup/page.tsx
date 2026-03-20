'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { MODULE_REGISTRY, MODULE_PRESETS, type ModulePreset } from '@/lib/modules'
import dynamic from 'next/dynamic'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const CldUploadWidget = dynamic(
  () => import('next-cloudinary').then(m => m.CldUploadWidget),
  { ssr: false }
)

type FormData = {
  name: string
  logo_url: string
  primary_color: string
  modules_enabled: string[]
  contact_whatsapp_number: string
  bank_name: string
  bank_account: string
  bank_holder: string
}

const STEPS = ['Bisnis', 'Modul', 'Kontak & Bayar', 'Selesai']

function getActivePreset(modules: string[]): ModulePreset | null {
  const sorted = [...modules].sort()
  for (const [key, val] of Object.entries(MODULE_PRESETS)) {
    if (JSON.stringify([...val.modules].sort()) === JSON.stringify(sorted)) {
      return key as ModulePreset
    }
  }
  return null
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    name: '',
    logo_url: '',
    primary_color: '#6366f1',
    modules_enabled: MODULE_PRESETS.bakery.modules as string[],
    contact_whatsapp_number: '',
    bank_name: '',
    bank_account: '',
    bank_holder: '',
  })

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleModule(id: string) {
    setForm(prev => ({
      ...prev,
      modules_enabled: prev.modules_enabled.includes(id)
        ? prev.modules_enabled.filter(m => m !== id)
        : [...prev.modules_enabled, id],
    }))
  }

  function applyPreset(preset: ModulePreset) {
    setField('modules_enabled', MODULE_PRESETS[preset].modules as string[])
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase.from('store_info').insert({
        name: form.name,
        address: '',
        phone: form.contact_whatsapp_number || '',
        email: '',
        opening_hours: '',
        contact_whatsapp_number: form.contact_whatsapp_number,
        logo_url: form.logo_url,
        primary_color: form.primary_color,
        modules_enabled: form.modules_enabled,
        bank_name: form.bank_name,
        bank_account: form.bank_account,
        bank_holder: form.bank_holder,
      })
      if (insertError) throw insertError
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data.')
      setSaving(false)
    }
  }

  const activePreset = getActivePreset(form.modules_enabled)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-6 sm:p-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                    i < step
                      ? 'bg-green-500 border-green-500 text-white'
                      : i === step
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  )}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={clsx(
                    'mt-1 text-xs text-center w-16',
                    i === step ? 'text-indigo-600 font-semibold' : 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={clsx(
                    'h-0.5 w-8 sm:w-12 mb-5 mx-1',
                    i < step ? 'bg-green-400' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Bisnis */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">Informasi Bisnis</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Toko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="Contoh: Sourdoughmu_ya"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Toko</label>
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="w-20 h-20 object-contain mb-2 rounded-lg border" />
              )}
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                onSuccess={(result) => {
                  if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
                    setField('logo_url', (result.info as { secure_url: string }).secure_url)
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {form.logo_url ? 'Ganti Logo' : 'Upload Logo'}
                  </button>
                )}
              </CldUploadWidget>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna Utama</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setField('primary_color', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
                <span className="text-sm text-gray-500 font-mono">{form.primary_color}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Modul */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">Pilih Modul</h2>

            <div>
              <p className="text-sm text-gray-600 mb-2">Preset Bisnis</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(MODULE_PRESETS) as ModulePreset[]).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors',
                      activePreset === preset
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {MODULE_PRESETS[preset].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Atau pilih manual</p>
              <div className="grid grid-cols-2 gap-2">
                {MODULE_REGISTRY.map(mod => (
                  <label key={mod.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.modules_enabled.includes(mod.id)}
                      onChange={() => toggleModule(mod.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Kontak & Bayar */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">Kontak & Pembayaran</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
              <input
                type="text"
                value={form.contact_whatsapp_number}
                onChange={e => setField('contact_whatsapp_number', e.target.value)}
                placeholder="Contoh: 6281234567890"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={e => setField('bank_name', e.target.value)}
                placeholder="Contoh: BCA"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                value={form.bank_account}
                onChange={e => setField('bank_account', e.target.value)}
                placeholder="Contoh: 1234567890"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
              <input
                type="text"
                value={form.bank_holder}
                onChange={e => setField('bank_holder', e.target.value)}
                placeholder="Contoh: John Doe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Step 3: Selesai */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800">Ringkasan Setup</h2>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Toko</span>
                <span className="font-medium text-gray-800">{form.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Warna Utama</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: form.primary_color }} />
                  <span className="font-mono text-gray-800">{form.primary_color}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modul Aktif</span>
                <span className="font-medium text-gray-800">{form.modules_enabled.length} modul</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">WhatsApp</span>
                <span className="font-medium text-gray-800">{form.contact_whatsapp_number || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-800">
                  {form.bank_name ? `${form.bank_name} - ${form.bank_account}` : '-'}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.name.trim()}
              className={clsx(
                'flex items-center gap-1 px-4 py-2 text-sm rounded-lg font-medium transition-colors',
                step === 0 && !form.name.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              Lanjut
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Mulai Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
