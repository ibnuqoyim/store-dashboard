export type Product = {
    id: string
    name: string
    price: number
}

export type OrderItem = {
    product_id: string
    quantity: number
    price: number
}

export type Delivery = {
    courier_name: string
    shipping_cost: number
    address: string
    status: string
}

export type Store = {
    id: string
    name: string
    invoice_prefix: string | null
}

export type OrderFormData = {
    invoice_number: string
    date: string
    customer_id: string | null
    customer_name: string
    phone: string
    status: string
    po_id: string
    store_id: string
    items: OrderItem[]
    delivery: Delivery | null
}

export type Customer = {
    id: string
    name: string
    phone: string | null
    address: string | null
}

export type BatchOption = {
    id: string
    name: string
}

export type ShippingRate = {
    id: string
    courier_name: string
    description?: string | null
    cost: number
}

export type InitialOrderItem = {
    product_id: string
    quantity: number
    price: number
}

export type InitialOrderDelivery = {
    courier_name: string | null
    shipping_cost: number | null
    address: string | null
    status: string | null
}

export type InitialOrder = {
    id: string
    invoice_number: string
    date: string
    customer_id: string | null
    customer_name: string
    phone: string | null
    status: string | null
    po_id: string | null
    store_id: string | null
    order_items: InitialOrderItem[]
    deliveries?: InitialOrderDelivery[]
}
