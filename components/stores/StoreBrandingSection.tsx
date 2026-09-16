'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary'
import type { StoreInfo } from './store-types'

const CldUploadWidget = dynamic(
  () => import('next-cloudinary').then(m => m.CldUploadWidget),
  { ssr: false }
)

interface StoreBrandingSectionProps {
  formData: Partial<StoreInfo>
  setFormData: React.Dispatch<React.SetStateAction<Partial<StoreInfo>>>
}

export default function StoreBrandingSection({
  formData,
  setFormData,
}: StoreBrandingSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4 text-gray-900">Branding</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo Toko</label>
          <div className="flex items-center gap-3">
            {formData.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={formData.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                No logo
              </div>
            )}
            <div className="flex flex-col gap-1">
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'products'}
                onSuccess={(result: CloudinaryUploadWidgetResults) => {
                  const info = result.info
                  if (info && typeof info === 'object' && 'secure_url' in info) {
                    setFormData(prev => ({ ...prev, logo_url: info.secure_url as string }))
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm cursor-pointer"
                  >
                    {formData.logo_url ? 'Ganti Logo' : 'Upload Logo'}
                  </button>
                )}
              </CldUploadWidget>
              {formData.logo_url && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                  className="text-red-500 hover:text-red-700 text-sm cursor-pointer"
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
              onChange={e => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer p-1"
            />
            <span className="text-sm font-mono text-gray-600">
              {formData.primary_color || '#6366f1'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Warna aksen utama untuk tema dashboard dan preview toko.
          </p>
        </div>
      </div>
    </div>
  )
}
