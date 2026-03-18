'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Save, Loader2, Star } from 'lucide-react'

type Testimonial = {
  id: string
  name: string
    job: string
  content: string
  rating: number
  created_at: string
}

interface TestimonialModalProps {
  testimonial?: Testimonial | null
  onClose: () => void
  onSave: () => void
}

export default function TestimonialModal({ testimonial, onClose, onSave }: TestimonialModalProps) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    job: '',
    content: '',
    rating: 5
  })

  useEffect(() => {
    if (testimonial) {
      setFormData({
        name: testimonial.name,
        job: testimonial.job,
        content: testimonial.content,
        rating: testimonial.rating
      })
    }
  }, [testimonial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (testimonial) {
        // Update existing
        const { error } = await supabase
          .from('testimonials')
          .update(formData)
          .eq('id', testimonial.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('testimonials')
          .insert([formData])

        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error) {
      alert('Error saving testimonial: ' + (error as any).message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStarSelector = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, rating: star })}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              size={24}
              className={formData.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {testimonial ? 'Edit Testimonial' : 'New Testimonial'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
            <input
              type="text"
              required
              value={formData.job}
              onChange={e => setFormData({ ...formData, job: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Customer job title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            {renderStarSelector()}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial</label>
            <textarea
              required
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Share your experience..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
