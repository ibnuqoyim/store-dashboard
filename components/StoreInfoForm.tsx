'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Save, Loader2, Plus, Trash2 } from 'lucide-react'
import { MODULE_REGISTRY, MODULE_PRESETS, type ModulePreset } from '@/lib/modules'
import { CldUploadWidget } from 'next-cloudinary'

type StoreInfo = {
  id: string
  is_active: boolean
  name: string
  address: string
  phone: string
  email: string
  opening_hours: string
  maps_url: string | null
  maps_embed_url: string | null
  hero_kicker: string | null
  hero_title: string | null
  hero_tagline: string | null
  hero_description: string | null
  hero_images: string[]
  hero_stats: Array<{ label: string; value: string }> | null
  tagline_heading: string | null
  tagline_subheading: string | null
  tagline_features: Array<{ title: string; description: string }> | null
  tagline_quote: string | null
  contact_instagram_handle: string | null
  contact_instagram_url: string | null
  contact_whatsapp_number: string | null
  contact_whatsapp_url: string | null
  contact_email: string | null
  bank_name: string | null
  bank_account: string | null
  bank_holder: string | null
  invoice_closing_message: string | null
  invoice_closing_sub: string | null
  whatsapp_greeting_template: string | null
  currency: string | null
  locale: string | null
  modules_enabled: string[] | null
  primary_color: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export default function StoreInfoForm() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [formData, setFormData] = useState<Partial<StoreInfo>>({})

  useEffect(() => {
    fetchStoreInfo()
  }, [])

  const fetchStoreInfo = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('store_info')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setStoreInfo(data)
        setFormData(data)
      } else {
        // Initialize with empty form if no record exists
        setFormData({
          is_active: true,
          name: '',
          address: '',
          phone: '',
          email: '',
          opening_hours: '',
          hero_images: [],
          hero_stats: [],
          tagline_features: []
        })
      }
    } catch (error) {
      console.error('Error fetching store info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (storeInfo) {
        // Update existing
        const { error } = await supabase
          .from('store_info')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', storeInfo.id)

        if (error) throw error
      } else {
        // Create new
        const { data, error } = await supabase
          .from('store_info')
          .insert([formData])
          .select()
          .single()

        if (error) throw error
        setStoreInfo(data)
      }

      alert('Store information saved successfully!')
      await fetchStoreInfo()
    } catch (error) {
      alert('Error saving store info: ' + (error as any).message)
    } finally {
      setIsSaving(false)
    }
  }

  const addHeroStat = () => {
    setFormData({
      ...formData,
      hero_stats: [...(formData.hero_stats || []), { label: '', value: '' }]
    })
  }

  const removeHeroStat = (index: number) => {
    const stats = [...(formData.hero_stats || [])]
    stats.splice(index, 1)
    setFormData({ ...formData, hero_stats: stats })
  }

  const updateHeroStat = (index: number, field: string, value: string) => {
    const stats = [...(formData.hero_stats || [])]
    stats[index] = { ...stats[index], [field]: value }
    setFormData({ ...formData, hero_stats: stats })
  }

  const addTaglineFeature = () => {
    setFormData({
      ...formData,
      tagline_features: [...(formData.tagline_features || []), { title: '', description: '' }]
    })
  }

  const removeTaglineFeature = (index: number) => {
    const features = [...(formData.tagline_features || [])]
    features.splice(index, 1)
    setFormData({ ...formData, tagline_features: features })
  }

  const updateTaglineFeature = (index: number, field: string, value: string) => {
    const features = [...(formData.tagline_features || [])]
    features[index] = { ...features[index], [field]: value }
    setFormData({ ...formData, tagline_features: features })
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading store information...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Core Identity Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Core Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name*</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
            <input
              type="tel"
              required
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours*</label>
            <input
              type="text"
              required
              value={formData.opening_hours || ''}
              onChange={e => setFormData({ ...formData, opening_hours: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="e.g., Mon-Fri 9:00-18:00"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
            <textarea
              required
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Maps Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Maps Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maps URL</label>
            <input
              type="url"
              value={formData.maps_url || ''}
              onChange={e => setFormData({ ...formData, maps_url: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maps Embed URL</label>
            <input
              type="url"
              value={formData.maps_embed_url || ''}
              onChange={e => setFormData({ ...formData, maps_embed_url: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="https://www.google.com/maps/embed?..."
            />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Hero Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Kicker</label>
            <input
              type="text"
              value={formData.hero_kicker || ''}
              onChange={e => setFormData({ ...formData, hero_kicker: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="e.g., Welcome to"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
            <input
              type="text"
              value={formData.hero_title || ''}
              onChange={e => setFormData({ ...formData, hero_title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Main headline"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Tagline</label>
            <input
              type="text"
              value={formData.hero_tagline || ''}
              onChange={e => setFormData({ ...formData, hero_tagline: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Description</label>
            <textarea
              value={formData.hero_description || ''}
              onChange={e => setFormData({ ...formData, hero_description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              rows={3}
            />
          </div>

          {/* Hero Stats */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Hero Stats</label>
              <button
                type="button"
                onClick={addHeroStat}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add Stat
              </button>
            </div>
            <div className="space-y-3">
              {(formData.hero_stats || []).map((stat, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <input
                    type="text"
                    placeholder="Label"
                    value={stat.label || ''}
                    onChange={e => updateHeroStat(idx, 'label', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={stat.value || ''}
                    onChange={e => updateHeroStat(idx, 'value', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeroStat(idx)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tagline/Why Us Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Tagline / Why Us Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline Heading</label>
            <input
              type="text"
              value={formData.tagline_heading || ''}
              onChange={e => setFormData({ ...formData, tagline_heading: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline Subheading</label>
            <input
              type="text"
              value={formData.tagline_subheading || ''}
              onChange={e => setFormData({ ...formData, tagline_subheading: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline Quote</label>
            <textarea
              value={formData.tagline_quote || ''}
              onChange={e => setFormData({ ...formData, tagline_quote: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              rows={2}
            />
          </div>

          {/* Tagline Features */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Features</label>
              <button
                type="button"
                onClick={addTaglineFeature}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add Feature
              </button>
            </div>
            <div className="space-y-3">
              {(formData.tagline_features || []).map((feature, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <input
                    type="text"
                    placeholder="Feature title"
                    value={feature.title || ''}
                    onChange={e => updateTaglineFeature(idx, 'title', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  />
                  <textarea
                    placeholder="Description"
                    value={feature.description || ''}
                    onChange={e => updateTaglineFeature(idx, 'description', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    rows={1}
                  />
                  <button
                    type="button"
                    onClick={() => removeTaglineFeature(idx)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
            <input
              type="text"
              value={formData.contact_instagram_handle || ''}
              onChange={e => setFormData({ ...formData, contact_instagram_handle: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="@your_handle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
            <input
              type="url"
              value={formData.contact_instagram_url || ''}
              onChange={e => setFormData({ ...formData, contact_instagram_url: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <input
              type="tel"
              value={formData.contact_whatsapp_number || ''}
              onChange={e => setFormData({ ...formData, contact_whatsapp_number: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="+62..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp URL</label>
            <input
              type="url"
              value={formData.contact_whatsapp_url || ''}
              onChange={e => setFormData({ ...formData, contact_whatsapp_url: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="https://wa.me/..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={formData.contact_email || ''}
              onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Invoice & Payment Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Informasi Invoice & Pembayaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
            <input
              type="text"
              value={formData.bank_name || ''}
              onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Contoh: BRI, BCA, Mandiri"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening</label>
            <input
              type="text"
              value={formData.bank_account || ''}
              onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Nomor rekening"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
            <input
              type="text"
              value={formData.bank_holder || ''}
              onChange={e => setFormData({ ...formData, bank_holder: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Nama a.n rekening"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Penutup Invoice</label>
            <input
              type="text"
              value={formData.invoice_closing_message || ''}
              onChange={e => setFormData({ ...formData, invoice_closing_message: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Contoh: Terima Kasih"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-pesan Penutup</label>
            <input
              type="text"
              value={formData.invoice_closing_sub || ''}
              onChange={e => setFormData({ ...formData, invoice_closing_sub: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Contoh: Baarakallaahu fiikum"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={formData.currency || 'IDR'}
              onChange={e => setFormData({ ...formData, currency: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            >
              <option value="IDR">IDR (Rupiah)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="SGD">SGD (Singapore Dollar)</option>
              <option value="MYR">MYR (Malaysian Ringgit)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
            <select
              value={formData.locale || 'id-ID'}
              onChange={e => setFormData({ ...formData, locale: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            >
              <option value="id-ID">id-ID (Indonesia)</option>
              <option value="en-US">en-US (US English)</option>
              <option value="en-SG">en-SG (Singapore English)</option>
              <option value="ms-MY">ms-MY (Malaysian)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Template WhatsApp</label>
            <textarea
              value={formData.whatsapp_greeting_template || ''}
              onChange={e => setFormData({ ...formData, whatsapp_greeting_template: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              rows={3}
              placeholder="Gunakan {name}, {invoice}, {total} sebagai variabel. Kosongkan untuk menggunakan template default."
            />
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Toko</label>
            <div className="flex items-center gap-3">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                  No logo
                </div>
              )}
              <div className="flex flex-col gap-1">
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'products'}
                  onSuccess={(result: any) => {
                    setFormData({ ...formData, logo_url: result.info.secure_url })
                  }}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm"
                    >
                      {formData.logo_url ? 'Ganti Logo' : 'Upload Logo'}
                    </button>
                  )}
                </CldUploadWidget>
                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warna Utama</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primary_color || '#6366f1'}
                onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={formData.primary_color || '#6366f1'}
                onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-32 border border-gray-300 rounded-md px-3 py-2 text-gray-900 text-sm font-mono"
                placeholder="#6366f1"
              />
              <div
                className="h-10 w-10 rounded-md shadow-inner"
                style={{ backgroundColor: formData.primary_color || '#6366f1' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Digunakan pada tombol, header tabel, dan aksen UI</p>
          </div>

        </div>
      </div>

      {/* Modul Aktif Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-1 text-gray-900">Modul Aktif</h2>
        <p className="text-sm text-gray-500 mb-4">Pilih modul yang ingin ditampilkan di sidebar. Gunakan preset atau pilih manual.</p>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.entries(MODULE_PRESETS) as [ModulePreset, { label: string; modules: string[] }][]).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData({ ...formData, modules_enabled: preset.modules })}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, modules_enabled: [] })}
            className="px-3 py-1.5 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            Reset Semua
          </button>
        </div>

        {/* Individual Checkboxes */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {MODULE_REGISTRY.map(mod => {
            const enabled = (formData.modules_enabled ?? []).includes(mod.id)
            return (
              <label key={mod.id} className="flex items-center gap-2 p-2 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 select-none">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => {
                    const current = formData.modules_enabled ?? []
                    const next = e.target.checked
                      ? [...current, mod.id]
                      : current.filter(id => id !== mod.id)
                    setFormData({ ...formData, modules_enabled: next })
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{mod.label}</span>
                <span className="text-xs text-gray-400 ml-auto">{mod.category}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 sticky bottom-0 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Store Information
        </button>
      </div>
    </form>
  )
}
