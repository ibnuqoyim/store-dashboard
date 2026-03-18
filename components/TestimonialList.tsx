'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Edit2, Star } from 'lucide-react'
import TestimonialModal from './TestimonialModal'

type Testimonial = {
  id: string
  name: string
  job: string
  content: string
  rating: number
  created_at: string
}

export default function TestimonialList() {
  const supabase = createClient()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTestimonials(data || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTestimonials(testimonials.filter(t => t.id !== id))
    } catch (error) {
      alert('Error deleting testimonial: ' + (error as any).message)
    }
  }

  const handleEdit = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial)
    setShowModal(true)
  }

  const handleAddNew = () => {
    setSelectedTestimonial(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    setShowModal(false)
    await fetchTestimonials()
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading testimonials...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Testimonials</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Add Testimonial
        </button>
      </div>

      {testimonials.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
          No testimonials yet. Create your first one!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="mb-3">
                {renderStars(testimonial.rating)}
              </div>
              <p className="text-gray-700 text-sm mb-3 line-clamp-3">{testimonial.content}</p>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{testimonial.name}</p>
                  <p className="font-medium text-gray-900 text-sm">{testimonial.job}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(testimonial.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TestimonialModal
          testimonial={selectedTestimonial}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
