
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Loader2 } from 'lucide-react'
import { Customer } from './CustomerList'

type CustomerModalProps = {
    isOpen: boolean
    onClose: () => void
    onSave: (customer: Customer) => void
    customer: Customer | null
}

export default function CustomerModal({ isOpen, onClose, onSave, customer }: CustomerModalProps) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [defaultCourier, setDefaultCourier] = useState('')
    const [description, setDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (customer) {
            setName(customer.name)
            setPhone(customer.phone || '')
            setAddress(customer.address || '')
            setDefaultCourier(customer.default_courier || '')
            setDescription(customer.description || '')
        } else {
            setName('')
            setPhone('')
            setAddress('')
            setDefaultCourier('')
            setDescription('')
        }
    }, [customer])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const customerData = {
                name,
                phone: phone || null,
                address: address || null,
                default_courier: defaultCourier || null,
                description: description || null
            }

            let result
            if (customer) {
                // Update
                const { data, error } = await supabase
                    .from('customers')
                    .update(customerData)
                    .eq('id', customer.id)
                    .select()
                    .single()

                if (error) throw error
                result = data
            } else {
                // Create
                const { data, error } = await supabase
                    .from('customers')
                    .insert(customerData)
                    .select()
                    .single()

                if (error) throw error
                result = data
            }

            onSave(result)
        } catch (err: any) {
            console.error('Error saving customer:', err)
            setError(err.message || 'Failed to save customer')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {customer ? 'Edit Customer' : 'Add New Customer'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. 08123456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Default Courier
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={defaultCourier}
                                    onChange={(e) => setDefaultCourier(e.target.value)}
                                >
                                    <option value="">Select courier...</option>
                                    <option value="JNE">JNE</option>
                                    <option value="J&T">J&T</option>
                                    <option value="SiCepat">SiCepat</option>
                                    <option value="GoSend">GoSend</option>
                                    <option value="GrabExpress">GrabExpress</option>
                                    <option value="Paxel">Paxel</option>
                                    <option value="Lalamove">Lalamove</option>
                                    <option value="Biteship">Biteship</option>
                                    <option value="Self Pickup">Self Pickup</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes / Description
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Additional notes about customer..."
                                />
                            </div>

                            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row-reverse gap-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Customer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
