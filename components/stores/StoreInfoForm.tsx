'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Save, Loader2, RotateCcw } from 'lucide-react'
import StoreBasicInfoSection from './StoreBasicInfoSection'
import StoreOnlinePresenceSection from './StoreOnlinePresenceSection'
import StoreHeroTaglineSection from './StoreHeroTaglineSection'
import StoreInvoicePaymentSection from './StoreInvoicePaymentSection'
import StoreBrandingSection from './StoreBrandingSection'
import StoreModulesSection from './StoreModulesSection'
import type { StoreInfo } from './store-types'

export type { StoreInfo, HeroStat, TaglineFeature } from './store-types'

export default function StoreInfoForm() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [formData, setFormData] = useState<Partial<StoreInfo>>({})

  const fetchStoreInfo = useCallback(async () => {
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
        setFormData({
          is_active: true,
          name: '',
          address: '',
          phone: '',
          email: '',
          opening_hours: '',
          hero_images: [],
          hero_stats: [],
          tagline_features: [],
        })
      }
    } catch (error) {
      console.error('Error fetching store info:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStoreInfo()
  }, [fetchStoreInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (storeInfo) {
        const { error } = await supabase
          .from('store_info')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', storeInfo.id)

        if (error) throw error
      } else {
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
      alert('Error saving store info: ' + (error instanceof Error ? error.message : 'unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!storeInfo) return
    const confirmed = window.confirm(
      'Ini akan menghapus semua konfigurasi toko dan mengarahkan kembali ke setup wizard.\n\nData produk, pesanan, dan pelanggan TIDAK akan terhapus.\n\nLanjutkan?'
    )
    if (!confirmed) return

    setIsResetting(true)
    try {
      const { error } = await supabase.from('store_info').delete().eq('id', storeInfo.id)
      if (error) throw error
      window.location.href = '/'
    } catch (err) {
      alert('Gagal mereset: ' + (err instanceof Error ? err.message : 'unknown error'))
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Core Identity */}
      <StoreBasicInfoSection formData={formData} setFormData={setFormData} />

      {/* 2. Maps & Social/Contact */}
      <StoreOnlinePresenceSection formData={formData} setFormData={setFormData} />

      {/* 3. Hero & Tagline Sections */}
      <StoreHeroTaglineSection formData={formData} setFormData={setFormData} />

      {/* 4. Invoice & Payment */}
      <StoreInvoicePaymentSection formData={formData} setFormData={setFormData} />

      {/* 5. Branding */}
      <StoreBrandingSection formData={formData} setFormData={setFormData} />

      {/* 6. Active Modules */}
      <StoreModulesSection formData={formData} setFormData={setFormData} />

      {/* Submit / Reset Sticky Toolbar */}
      <div className="flex justify-between gap-3 sticky bottom-0 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium cursor-pointer"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Store Information
        </button>
        {storeInfo && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="text-red-600 border border-red-200 px-4 py-3 rounded-md hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 text-sm cursor-pointer"
          >
            {isResetting ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} />}
            Reset & Setup Ulang
          </button>
        )}
      </div>
    </form>
  )
}
