import TestimonialList from '@/components/TestimonialList'

export default function TestimonialsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Testimonials</h1>
        <p className="text-gray-600 mt-1">Manage customer testimonials and reviews</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <TestimonialList />
      </div>
    </div>
  )
}
