export type Product = { id: string; name: string }

export type InventoryItem = {
    id: string
    name: string
    unit: string
    unit_cost: number
    category: string
}

export type Ingredient = {
    id: string
    recipe_id: string
    inventory_id: string
    quantity: number
    notes: string
    inventory: InventoryItem | null
}

export type Recipe = {
    id: string
    product_id: string | null
    name: string
    yield_quantity: number
    yield_unit: string
    labor_cost_per_batch: number
    overhead_cost_per_batch: number
    notes: string
    products: { name: string } | null
    recipe_ingredients: Ingredient[]
}

export type HPPResult = {
    materialCost: number
    laborCost: number
    overheadCost: number
    totalPerBatch: number
    hppPerUnit: number
}

export type TempIngredient = {
    tempId: string
    id?: string
    inventory_id: string
    quantity: string
    notes: string
}

export type RecipeFormData = {
    name: string
    product_id: string
    yield_quantity: string
    yield_unit: string
    labor_cost_per_batch: string
    overhead_cost_per_batch: string
    notes: string
}

export function computeHPP(recipe: Recipe): HPPResult {
    const materialCost = (recipe.recipe_ingredients ?? []).reduce((sum, ing) => {
        const unitCost = ing.inventory?.unit_cost ?? 0
        return sum + ing.quantity * unitCost
    }, 0)
    const laborCost = recipe.labor_cost_per_batch ?? 0
    const overheadCost = recipe.overhead_cost_per_batch ?? 0
    const totalPerBatch = materialCost + laborCost + overheadCost
    const hppPerUnit = recipe.yield_quantity > 0 ? totalPerBatch / recipe.yield_quantity : 0
    return { materialCost, laborCost, overheadCost, totalPerBatch, hppPerUnit }
}
