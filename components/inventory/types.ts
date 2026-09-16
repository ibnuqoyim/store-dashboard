export type InventoryCategory = 'bahan_baku' | 'packaging'

export type InventoryItem = {
    id: string
    name: string
    category: InventoryCategory
    unit: string
    current_stock: number
    min_stock: number
    unit_cost: number
    supplier?: string
    description?: string
}

export type InventoryTransaction = {
    inventory_id: string
    transaction_type: 'in' | 'out'
    quantity: number
    unit_cost?: number
    total_cost?: number
    reference?: string
    notes?: string
}

export type EditFormData = {
    name: string
    category: InventoryCategory
    unit: string
    min_stock: number
    unit_cost: number
    supplier: string
    description: string
}

export type NewItemFormData = {
    name: string
    category: InventoryCategory
    unit: string
    current_stock: number
    min_stock: number
    unit_cost: number
    supplier: string
    description: string
}

export type NewTransactionFormData = {
    inventory_id: string
    transaction_type: 'in' | 'out'
    quantity: number
    unit_cost: number
    reference: string
    notes: string
}

export type CostFilter = {
    min: string
    max: string
}
