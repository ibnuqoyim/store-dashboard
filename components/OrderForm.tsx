
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, ArrowLeft, Truck, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Product = {
    id: string
    name: string
    price: number
}

type OrderItem = {
    product_id: string
    quantity: number
    price: number
}

type Delivery = {
    courier_name: string
    shipping_cost: number
    address: string
    status: string
}

type OrderFormData = {
    invoice_number: string
    date: string
    customer_id: string | null
    customer_name: string
    phone: string
    status: string
    po_id: string
    items: OrderItem[]
    delivery: Delivery | null
}

type Customer = {
    id: string
    name: string
    phone: string | null
    address: string | null
}

export default function OrderForm({
    products,
    batches = [],
    initialOrder
}: {
    products: Product[],
    batches?: any[],
    initialOrder?: any
}) {
    const router = useRouter()
    const supabase = createClient()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasDelivery, setHasDelivery] = useState(false)

    const [formData, setFormData] = useState<OrderFormData>({
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        customer_id: null,
        customer_name: '',
        phone: '',
        status: 'pending',
        po_id: '',
        items: [],
        delivery: null
    })

    const [shippingRates, setShippingRates] = useState<any[]>([])

    const generateInvoiceNumber = async (): Promise<string> => {
        try {
            // Get all orders sorted by invoice_number descending to get the latest one
            const { data: orders, error } = await supabase
                .from('orders')
                .select('invoice_number')
                .order('invoice_number', { ascending: false })
                .limit(1)

            if (error) throw error

            const now = new Date()
            const currentYYYY = String(now.getFullYear())
            const currentMM = String(now.getMonth() + 1).padStart(2, '0')
            const currentYYYYMM = currentYYYY + currentMM

            // If no orders exist, start with YYYYMM00
            if (!orders || orders.length === 0) {
                return currentYYYYMM + '00'
            }

            const lastInvoiceNumber = orders[0].invoice_number
            const lastYYYYMM = lastInvoiceNumber.slice(0, 6)
            const lastXX = parseInt(lastInvoiceNumber.slice(6, 8), 10)

            console.log('Last Invoice:', lastInvoiceNumber, 'Current YYYYMM:', currentYYYYMM)

            // If YYYY``MM is the same, increment XX
            if (lastYYYYMM === currentYYYYMM) {
                const nextXX = lastXX + 1
                if (nextXX > 99) {
                    throw new Error('Invoice number counter exceeded maximum (99)')
                }
                return currentYYYYMM + String(nextXX).padStart(2, '0')
            } else {
                // If YYYYMM is different, reset to YYYYMM00
                return currentYYYYMM + '00'
            }
        } catch (error) {
            console.error('Error generating invoice number:', error)
            // Fallback: generate based on current date
            const now = new Date()
            const yyyy = String(now.getFullYear())
            const mm = String(now.getMonth() + 1).padStart(2, '0')
            return yyyy + mm + '00'
        }
    }

    useEffect(() => {
        const fetchRates = async () => {
            const { data } = await supabase.from('shipping_rates').select('*').order('courier_name', { ascending: true })
            if (data) setShippingRates(data)
        }

        const fetchCustomers = async () => {
            const { data } = await supabase.from('customers').select('id, name, phone, address').order('name', { ascending: true })
            if (data) setCustomers(data)
        }

        const initializeInvoiceNumber = async () => {
            // Only generate invoice number if creating new order (not editing)
            if (!initialOrder) {
                const newInvoiceNumber = await generateInvoiceNumber()
                setFormData(prev => ({ ...prev, invoice_number: newInvoiceNumber }))
            }
        }

        fetchRates()
        fetchCustomers()
        initializeInvoiceNumber()
    }, [])

    useEffect(() => {
        if (initialOrder) {
            setFormData({
                invoice_number: initialOrder.invoice_number,
                date: initialOrder.date,
                customer_id: initialOrder.customer_id || null,
                customer_name: initialOrder.customer_name,
                phone: initialOrder.phone || '',
                status: initialOrder.status || 'pending',
                po_id: initialOrder.po_id || '',
                items: initialOrder.order_items.map((item: any) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                })),
                delivery: initialOrder.deliveries?.[0] ? {
                    courier_name: initialOrder.deliveries[0].courier_name || '',
                    shipping_cost: initialOrder.deliveries[0].shipping_cost || 0,
                    address: initialOrder.deliveries[0].address || '',
                    status: initialOrder.deliveries[0].status || 'pending'
                } : null
            })
            if (initialOrder.deliveries?.[0]) {
                setHasDelivery(true)
            }
        }
    }, [initialOrder])

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product_id: '', quantity: 1, price: 0 }]
        })
    }

    const removeItem = (index: number) => {
        const newItems = [...formData.items]
        newItems.splice(index, 1)
        setFormData({ ...formData, items: newItems })
    }

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...formData.items]
        const item = { ...newItems[index], [field]: value }

        // Auto-update price if product changes
        if (field === 'product_id') {
            const product = products.find(p => p.id === value)
            if (product) {
                item.price = product.price
            }
        }

        newItems[index] = item
        setFormData({ ...formData, items: newItems })
    }

    const recalculateCustomerTotalPurchases = async (customerId: string) => {
        try {
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('order_items(price, quantity)')
                .eq('customer_id', customerId)

            if (ordersError) throw ordersError

            // Sum all order items
            let totalPurchases = 0
            orders.forEach((order: any) => {
                if (order.order_items) {
                    order.order_items.forEach((item: any) => {
                        totalPurchases += (item.price || 0) * (item.quantity || 0)
                    })
                }
            })

            // Update customer with new total
            const { error: updateError } = await supabase
                .from('customers')
                .update({ total_purchases: totalPurchases })
                .eq('id', customerId)

            if (updateError) throw updateError
        } catch (error) {
            console.error('Error recalculating customer total purchases:', error)
        }
    }

    const toggleDelivery = (enable: boolean) => {
        setHasDelivery(enable)
        if (enable && !formData.delivery) {
            // Check if customer has address/courier
            let defaultCourier = ''
            let defaultAddress = ''

            if (formData.customer_id) {
                const customer = customers.find(c => c.id === formData.customer_id)
                if (customer && customer.address) defaultAddress = customer.address
            }

            setFormData({
                ...formData,
                delivery: { courier_name: defaultCourier, shipping_cost: 0, address: defaultAddress, status: 'pending' }
            })
        } else if (!enable) {
            setFormData({ ...formData, delivery: null })
        }
    }

    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const customerId = e.target.value

        if (customerId === 'new') {
            setFormData({
                ...formData,
                customer_id: null,
                customer_name: '',
                phone: ''
            })
            return
        }

        const customer = customers.find(c => c.id === customerId)
        if (customer) {
            setFormData({
                ...formData,
                customer_id: customer.id,
                customer_name: customer.name,
                phone: customer.phone || '',
                // If delivery is enabled, update address
                delivery: hasDelivery && formData.delivery ? {
                    ...formData.delivery,
                    address: customer.address || formData.delivery.address
                } : formData.delivery
            })
        }
    }

    const handleCourierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRate = shippingRates.find(r => r.courier_name === e.target.value)
        setFormData({
            ...formData,
            delivery: {
                ...formData.delivery!,
                courier_name: e.target.value,
                shipping_cost: selectedRate ? selectedRate.cost : 0
            }
        })
    }

    const calculateTotal = () => {
        const itemsTotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const shipping = hasDelivery && formData.delivery ? Number(formData.delivery.shipping_cost) : 0
        return itemsTotal + shipping
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            let customerId = formData.customer_id

            // 1. Create new customer if doesn't exist
            if (!customerId && formData.customer_name.trim()) {
                const { data, error } = await supabase
                    .from('customers')
                    .insert({
                        name: formData.customer_name,
                        phone: formData.phone || null,
                        address: null // Will be set during delivery if needed
                    })
                    .select()
                    .single()

                if (error) {
                    // If customer already exists (unique constraint), try to find it
                    const { data: existingCustomer, error: findError } = await supabase
                        .from('customers')
                        .select('id')
                        .eq('name', formData.customer_name)
                        .eq('phone', formData.phone || null)
                        .single()

                    if (findError) throw error
                    customerId = existingCustomer.id
                } else {
                    customerId = data.id
                }
            }

            // 2. Upsert Order
            const orderPayload = {
                invoice_number: formData.invoice_number,
                date: formData.date,
                customer_id: customerId || null,
                customer_name: formData.customer_name,
                phone: formData.phone,
                status: formData.status,
                po_id: formData.po_id || null
            }

            let orderId = initialOrder?.id

            if (orderId) {
                const { error } = await supabase.from('orders').update(orderPayload).eq('id', orderId)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from('orders').insert(orderPayload).select().single()
                if (error) throw error
                orderId = data.id
            }

            // 3. Manage Items (Delete all and re-insert for simplicity)
            if (initialOrder) {
                await supabase.from('order_items').delete().eq('order_id', orderId)
            }

            if (formData.items.length > 0) {
                const itemsPayload = formData.items.map(item => ({
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                }))
                const { error } = await supabase.from('order_items').insert(itemsPayload)
                if (error) throw error
            }

            // 4. Manage Delivery
            if (initialOrder) {
                await supabase.from('deliveries').delete().eq('order_id', orderId)
            }

            if (hasDelivery && formData.delivery) {
                const { error } = await supabase.from('deliveries').insert({
                    order_id: orderId,
                    courier_name: formData.delivery.courier_name,
                    shipping_cost: formData.delivery.shipping_cost,
                    address: formData.delivery.address,
                    status: formData.delivery.status
                })
                if (error) throw error
            }

            // 5. Recalculate customer total purchases
            if (customerId) {
                await recalculateCustomerTotalPurchases(customerId)
            }

            router.refresh()
            router.push('/orders')

        } catch (error: any) {
            alert('Error saving order: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{initialOrder ? 'Edit Order' : 'New Order'}</h1>
                <Link href="/orders" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to List
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Details */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-bold mb-4 text-gray-900">Order Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                            <input
                                type="text"
                                required
                                value={formData.invoice_number}
                                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 mb-2"
                                value={formData.customer_id || 'new'}
                                onChange={handleCustomerChange}
                            >
                                <option value="new">-- New / Manual Input --</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <input
                                type="text"
                                required
                                value={formData.customer_name}
                                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                placeholder="Customer Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Batch (PO)</label>
                            <select
                                value={formData.po_id}
                                onChange={e => setFormData({ ...formData, po_id: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            >
                                <option value="">Select Batch...</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Items</h2>
                        <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end border-b pb-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                                    <select
                                        required
                                        value={item.product_id}
                                        onChange={e => updateItem(index, 'product_id', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                    >
                                        <option value="">Select Product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - {p.price}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={item.quantity}
                                        onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                    <input
                                        type="number"
                                        required
                                        value={item.price}
                                        onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                                        readOnly
                                    />
                                </div>
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 pb-3">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delivery */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="hasDelivery"
                            checked={hasDelivery}
                            onChange={e => toggleDelivery(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="hasDelivery" className="text-lg font-bold cursor-pointer text-gray-900">Include Delivery</label>
                    </div>

                    {hasDelivery && formData.delivery && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
                                <select
                                    value={formData.delivery.courier_name}
                                    onChange={handleCourierChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                >
                                    <option value="">Select Courier...</option>
                                    {shippingRates.map(rate => (
                                        <option key={rate.id} value={rate.courier_name}>
                                            {rate.courier_name} - {rate.description} ({rate.cost})
                                        </option>
                                    ))}
                                    <option value="Manual">Manual Input</option>
                                </select>
                            </div>
                            {formData.delivery.courier_name === 'Manual' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Manual Courier Name</label>
                                    <input
                                        type="text"
                                        value={formData.delivery.courier_name === 'Manual' ? '' : formData.delivery.courier_name}
                                        onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery!, courier_name: e.target.value } })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                        placeholder="Enter courier name"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost</label>
                                <input
                                    type="number"
                                    value={formData.delivery.shipping_cost}
                                    onChange={e => setFormData({
                                        ...formData,
                                        delivery: { ...formData.delivery!, shipping_cost: Number(e.target.value) }
                                    })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    value={formData.delivery.address}
                                    onChange={e => setFormData({
                                        ...formData,
                                        delivery: { ...formData.delivery!, address: e.target.value }
                                    })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                                <select
                                    value={formData.delivery.status}
                                    onChange={e => setFormData({
                                        ...formData,
                                        delivery: { ...formData.delivery!, status: e.target.value }
                                    })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Footer */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 sticky bottom-0">
                    <div className="text-xl font-bold text-gray-900">
                        Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(calculateTotal())}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Save Order
                    </button>
                </div>
            </form>
        </div>
    )
}
