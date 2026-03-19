import StoreInfoForm from '@/components/StoreInfoForm'

export default function StoreInfoPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Store Information</h1>
        <p className="text-gray-600 mt-1">Manage your store's landing page information</p>
      </div>

      <StoreInfoForm />
    </div>
  )
}
