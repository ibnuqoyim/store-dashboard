'use client'

import React from 'react'
import { MODULE_REGISTRY, MODULE_PRESETS, type ModulePreset } from '@/lib/modules'
import type { StoreInfo } from './store-types'

interface StoreModulesSectionProps {
  formData: Partial<StoreInfo>
  setFormData: React.Dispatch<React.SetStateAction<Partial<StoreInfo>>>
}

export default function StoreModulesSection({
  formData,
  setFormData,
}: StoreModulesSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-1 text-gray-900">Modul Aktif</h2>
      <p className="text-sm text-gray-500 mb-4">
        Pilih modul yang ingin ditampilkan di sidebar. Gunakan preset atau pilih manual.
      </p>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.entries(MODULE_PRESETS) as [ModulePreset, { label: string; modules: string[] }][]).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, modules_enabled: preset.modules }))}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, modules_enabled: [] }))}
          className="px-3 py-1.5 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                  setFormData(prev => ({ ...prev, modules_enabled: next }))
                }}
                className="rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700">{mod.label}</span>
              <span className="text-xs text-gray-400 ml-auto">{mod.category}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
