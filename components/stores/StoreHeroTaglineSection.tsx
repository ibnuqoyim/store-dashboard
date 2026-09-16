'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { StoreInfo, HeroStat, TaglineFeature } from './store-types'

interface StoreHeroTaglineSectionProps {
  formData: Partial<StoreInfo>
  setFormData: React.Dispatch<React.SetStateAction<Partial<StoreInfo>>>
}

export default function StoreHeroTaglineSection({
  formData,
  setFormData,
}: StoreHeroTaglineSectionProps) {
  // Hero Stats helpers
  const addHeroStat = () => {
    setFormData(prev => ({
      ...prev,
      hero_stats: [...(prev.hero_stats || []), { label: '', value: '' }],
    }))
  }

  const updateHeroStat = (index: number, field: keyof HeroStat, value: string) => {
    setFormData(prev => {
      const stats = [...(prev.hero_stats || [])]
      stats[index] = { ...stats[index], [field]: value }
      return { ...prev, hero_stats: stats }
    })
  }

  const removeHeroStat = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hero_stats: (prev.hero_stats || []).filter((_, i) => i !== index),
    }))
  }

  // Tagline Features helpers
  const addTaglineFeature = () => {
    setFormData(prev => ({
      ...prev,
      tagline_features: [...(prev.tagline_features || []), { title: '', description: '' }],
    }))
  }

  const updateTaglineFeature = (index: number, field: keyof TaglineFeature, value: string) => {
    setFormData(prev => {
      const features = [...(prev.tagline_features || [])]
      features[index] = { ...features[index], [field]: value }
      return { ...prev, tagline_features: features }
    })
  }

  const removeTaglineFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tagline_features: (prev.tagline_features || []).filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Hero Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Kicker</label>
            <input
              type="text"
              value={formData.hero_kicker || ''}
              onChange={e => setFormData(prev => ({ ...prev, hero_kicker: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="e.g., Welcome to"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
            <input
              type="text"
              value={formData.hero_title || ''}
              onChange={e => setFormData(prev => ({ ...prev, hero_title: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Main headline"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Tagline</label>
            <input
              type="text"
              value={formData.hero_tagline || ''}
              onChange={e => setFormData(prev => ({ ...prev, hero_tagline: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Description</label>
            <textarea
              value={formData.hero_description || ''}
              onChange={e => setFormData(prev => ({ ...prev, hero_description: e.target.value }))}
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
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 cursor-pointer"
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
                    className="text-red-600 hover:text-red-800 p-2 cursor-pointer"
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
              onChange={e => setFormData(prev => ({ ...prev, tagline_heading: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline Subheading</label>
            <input
              type="text"
              value={formData.tagline_subheading || ''}
              onChange={e => setFormData(prev => ({ ...prev, tagline_subheading: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline Quote</label>
            <textarea
              value={formData.tagline_quote || ''}
              onChange={e => setFormData(prev => ({ ...prev, tagline_quote: e.target.value }))}
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
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 cursor-pointer"
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
                    className="text-red-600 hover:text-red-800 p-2 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
