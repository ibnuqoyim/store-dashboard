'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useBusinessConfig } from '@/lib/business-config-context'
import { formatCurrency } from '@/lib/config'
import OrderDetailsSection from './OrderDetailsSection'
import OrderItemsSection from './OrderItemsSection'
import OrderDeliverySection from './OrderDeliverySection'
import type {
    Product,
    OrderItem,
    Delivery,
    Store,
    OrderFormData,
    Customer,
    BatchOption,
    ShippingRate,
    InitialOrder,
} from './types'

type CustomerOrderAggregate = {
    order_items: { price: number | null; quantity: number | null }[] | null
}

export default function OrderForm({
    products,
    batches = [],
    stores = [],
    initialOrder,
}: {
    products: Product[]
    batches?: BatchOption[]
    stores?: Store[]
    initialOrder?: InitialOrder
}) {
    const router = useRouter()
    const supabase = createClient()
    const config = useBusinessConfig()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasDelivery, setHasDelivery] = useState(false)
    const [customerSearch, setCustomerSearch] = useState('')
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
    const [productSearch, setProductSearch] = useState<Record<number, string>>({})
    const [showProductSuggestions, setShowProductSuggestions] = useState<Record<number, boolean>>({})

    const [formData, setFormData] = useState<OrderFormData>({
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        customer_id: null,
        customer_name: '',
        phone: '',
        status: 'pending',
        po_id: '',
        store_id: '',
        items: [],
        delivery: null,
    })

    const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])

    const generateInvoiceNumber = async (storeId?: string | null, prefix?: string | null): Promise<string> => {
        try {
            const now = new Date()
            const currentYYYYMM = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, '0')
            const prefixStr = prefix ? `${prefix}-` : ''

            const baseQuery = supabase
                .from('orders')
                .select('invoice_number')
                .order('created_at', { ascending: false })
                .limit(50)

            const { data: orders } = storeId ? await baseQuery.eq('store_id', storeId) : await baseQuery

            let maxSeq = 0
            if (orders && orders.length > 0) {
                const escapedPrefix = prefixStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const regex = new RegExp(`^${escapedPrefix}${currentYYYYMM}(\\d{3})$`)
                for (const o of orders) {
                    const match = o.invoice_number ? o.invoice_number.match(regex) : null
                    if (match) {
                        const seq = parseInt(match[1], 10)
                        if (seq > maxSeq) maxSeq = seq
                    }
                }
            }

            return `${prefixStr}${currentYYYYMM}${String(maxSeq + 1).padStart(3, '0')}`
        } catch (error) {
            console.error('Error generating invoice number:', error)
            const now = new Date()
            const currentYYYYMM = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, '0')
            return `${currentYYYYMM}001`
        }
    }

    const generateAndSetInvoiceNumber = async (storeId?: string | null) => {
        if (initialOrder) return
        const store = stores.find(s => s.id === storeId)
        const num = await generateInvoiceNumber(storeId || null, store?.invoice_prefix || null)
        setFormData(prev => ({ ...prev, invoice_number: num }))
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

        const fetchLatestBatch = async () => {
            const { data } = await supabase.from('batch_po').select('id').order('created_at', { ascending: false }).limit(1)
            if (data && data.length > 0) {
                setFormData(prev => ({ ...prev, po_id: data[0].id }))
            }
        }

        fetchRates()
        fetchCustomers()
        if (!initialOrder) {
            fetchLatestBatch()
            generateAndSetInvoiceNumber(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (initialOrder) {
            const productSearchMap: Record<number, string> = {}
            initialOrder.order_items.forEach((item, idx) => {
                const product = products.find(p => p.id === item.product_id)
                if (product) {
                    productSearchMap[idx] = product.name
                }
            })
            setProductSearch(productSearchMap)

            setFormData({
                invoice_number: initialOrder.invoice_number,
                date: initialOrder.date,
                customer_id: initialOrder.customer_id || null,
                customer_name: initialOrder.customer_name,
                phone: initialOrder.phone || '',
                status: initialOrder.status || 'pending',
                po_id: initialOrder.po_id || '',
                store_id: initialOrder.store_id || '',
                items: initialOrder.order_items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                })),
                delivery: initialOrder.deliveries?.[0]
                    ? {
                          courier_name: initialOrder.deliveries[0].courier_name || '',
                          shipping_cost: initialOrder.deliveries[0].shipping_cost || 0,
                          address: initialOrder.deliveries[0].address || '',
                          status: initialOrder.deliveries[0].status || 'pending',
                      }
                    : null,
            })
            if (initialOrder.deliveries?.[0]) {
                setHasDelivery(true)
            }
            setCustomerSearch(initialOrder.customer_name || '')
        }
    }, [initialOrder, products])

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { product_id: '', quantity: 1, price: 0 }],
        }))
    }

    const removeItem = (index: number) => {
        setFormData(prev => {
            const newItems = [...prev.items]
            newItems.splice(index, 1)
            return { ...prev, items: newItems }
        })
    }

    const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
        setFormData(prev => {
            const newItems = [...prev.items]
            const item = { ...newItems[index], [field]: value }
            if (field === 'product_id') {
                const product = products.find(p => p.id === value)
                if (product) {
                    item.price = product.price
                }
            }
            newItems[index] = item
            return { ...prev, items: newItems }
        })
    }

    const updateDelivery = (field: keyof Delivery, value: string | number) => {
        setFormData(prev => {
            if (!prev.delivery) return prev
            return {
                ...prev,
                delivery: {
                    ...prev.delivery,
                    [field]: value,
                },
            }
        })
    }

    const recalculateCustomerTotalPurchases = async (customerId: string) => {
        try {
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('order_items(price, quantity)')
                .eq('customer_id', customerId)

            if (ordersError) throw ordersError

            let totalPurchases = 0
            ;(orders as CustomerOrderAggregate[]).forEach(order => {
                if (order.order_items) {
                    order.order_items.forEach(item => {
                        totalPurchases += (item.price || 0) * (item.quantity || 0)
                    })
                }
            })

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
            let defaultAddress = ''
            if (formData.customer_id) {
                const customer = customers.find(c => c.id === formData.customer_id)
                if (customer && customer.address) defaultAddress = customer.address
            }

            setFormData(prev => ({
                ...prev,
                delivery: { courier_name: '', shipping_cost: 0, address: defaultAddress, status: 'pending' },
            }))
        } else if (!enable) {
            setFormData(prev => ({ ...prev, delivery: null }))
        }
    }

    const handleCustomerSearch = (value: string) => {
        setCustomerSearch(value)
        setFormData(prev => ({
            ...prev,
            customer_name: value,
            customer_id: null,
        }))
        setShowCustomerSuggestions(value.length > 0)
    }

    const handleSelectCustomer = (customer: Customer) => {
        setCustomerSearch(customer.name)
        setFormData(prev => ({
            ...prev,
            customer_id: customer.id,
            customer_name: customer.name,
            phone: customer.phone || '',
            delivery:
                hasDelivery && prev.delivery
                    ? {
                          ...prev.delivery,
                          address: customer.address || prev.delivery.address,
                      }
                    : prev.delivery,
        }))
        setShowCustomerSuggestions(false)
    }

    const filteredCustomers = customerSearch
        ? customers.filter(
              c =>
                  c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.phone?.includes(customerSearch)
          )
        : []

    const handleProductSearch = (index: number, value: string) => {
        setProductSearch(prev => ({ ...prev, [index]: value }))
        setShowProductSuggestions(prev => ({ ...prev, [index]: value.length > 0 }))
    }

    const handleSelectProduct = (index: number, product: Product) => {
        setProductSearch(prev => ({ ...prev, [index]: product.name }))
        updateItem(index, 'product_id', product.id)
        setShowProductSuggestions(prev => ({ ...prev, [index]: false }))
    }

    const getFilteredProducts = (index: number): Product[] => {
        const search = productSearch[index] || ''
        return search.length > 0
            ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
            : []
    }

    const handleCourierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRate = shippingRates.find(r => r.courier_name === e.target.value)
        setFormData(prev => ({
            ...prev,
            delivery: {
                ...prev.delivery!,
                courier_name: e.target.value,
                shipping_cost: selectedRate ? selectedRate.cost : 0,
            },
        }))
    }

    const calculateTotal = () => {
        const itemsTotal = formData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const shipping = hasDelivery && formData.delivery ? Number(formData.delivery.shipping_cost) : 0
        return itemsTotal + shipping
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            let customerId = formData.customer_id

            if (!customerId && formData.customer_name.trim()) {
                const { data, error } = await supabase
                    .from('customers')
                    .insert({
                        name: formData.customer_name,
                        phone: formData.phone || null,
                        address: null,
                    })
                    .select()
                    .single()

                if (error) {
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

            const orderPayload = {
                invoice_number: formData.invoice_number,
                date: formData.date,
                customer_id: customerId || null,
                customer_name: formData.customer_name,
                phone: formData.phone,
                status: formData.status,
                po_id: formData.po_id || null,
                store_id: formData.store_id || null,
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

            if (initialOrder) {
                await supabase.from('order_items').delete().eq('order_id', orderId)
            }

            if (formData.items.length > 0) {
                const itemsPayload = formData.items.map(item => ({
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                }))
                const { error } = await supabase.from('order_items').insert(itemsPayload)
                if (error) throw error
            }

            if (initialOrder) {
                await supabase.from('deliveries').delete().eq('order_id', orderId)
            }

            if (hasDelivery && formData.delivery) {
                const { error } = await supabase.from('deliveries').insert({
                    order_id: orderId,
                    courier_name: formData.delivery.courier_name,
                    shipping_cost: formData.delivery.shipping_cost,
                    address: formData.delivery.address,
                    status: formData.delivery.status,
                })
                if (error) throw error
            }

            if (customerId) {
                await recalculateCustomerTotalPurchases(customerId)
            }

            router.refresh()
            router.push('/')
        } catch (error) {
            alert('Error saving order: ' + (error instanceof Error ? error.message : 'unknown error'))
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
                <OrderDetailsSection
                    formData={formData}
                    setFormData={setFormData}
                    customerSearch={customerSearch}
                    handleCustomerSearch={handleCustomerSearch}
                    showCustomerSuggestions={showCustomerSuggestions}
                    setShowCustomerSuggestions={setShowCustomerSuggestions}
                    filteredCustomers={filteredCustomers}
                    handleSelectCustomer={handleSelectCustomer}
                    batches={batches}
                    stores={stores}
                    onStoreChange={storeId => {
                        setFormData(prev => ({ ...prev, store_id: storeId }))
                        generateAndSetInvoiceNumber(storeId || null)
                    }}
                />

                <OrderItemsSection
                    items={formData.items}
                    productSearch={productSearch}
                    showProductSuggestions={showProductSuggestions}
                    getFilteredProducts={getFilteredProducts}
                    handleProductSearch={handleProductSearch}
                    handleSelectProduct={handleSelectProduct}
                    setShowProductSuggestions={setShowProductSuggestions}
                    addItem={addItem}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    config={config}
                />

                <OrderDeliverySection
                    hasDelivery={hasDelivery}
                    toggleDelivery={toggleDelivery}
                    delivery={formData.delivery}
                    shippingRates={shippingRates}
                    handleCourierChange={handleCourierChange}
                    updateDelivery={updateDelivery}
                />

                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 sticky bottom-0">
                    <div className="text-xl font-bold text-gray-900">
                        Total: {formatCurrency(calculateTotal(), config)}
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
