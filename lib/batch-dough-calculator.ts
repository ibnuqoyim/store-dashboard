/**
 * BatchDoughCalculator Service & Recipe Engine
 * Calculates raw kitchen ingredient requirements based on active batch orders for Bakery module.
 */

export interface OrderItemInput {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  isCustomPrice?: boolean;
}

export interface OrderCreatePayload {
  batchId: string;
  customerName: string;
  customerPhone?: string;
  shippingMethod: 'Ahsan' | 'TIKI' | 'COD' | 'Ambil Sendiri';
  shippingFee: number;
  payStatus: 'PAID' | 'DP' | 'UNPAID';
  payMethod: 'QRIS' | 'Transfer BCA' | 'Cash';
  items: OrderItemInput[];
}

export interface DoughRecipeRequirement {
  baseDoughName: string;
  totalWeightKg: number;
  ingredients: {
    flourKg: number;
    waterLiter: number;
    levainActiveKg: number;
    saltGrams: number;
  };
  fillings: {
    creamCheeseKg?: number;
    chocoChipsKg?: number;
  };
}

// Master Recipe Multipliers per Product Category
const PRODUCT_RECIPE_MAP: Record<string, { flourPerUnitGrams: number; waterRatio: number; levainRatio: number; saltRatio: number; fillingType?: string; fillingGrams?: number }> = {
  'Milk Bread': { flourPerUnitGrams: 120, waterRatio: 0.65, levainRatio: 0.20, saltRatio: 0.02 },
  'Earl Grey CC Mini': { flourPerUnitGrams: 50, waterRatio: 0.60, levainRatio: 0.15, saltRatio: 0.018, fillingType: 'creamCheese', fillingGrams: 30 },
  'Chocobanana': { flourPerUnitGrams: 100, waterRatio: 0.62, levainRatio: 0.18, saltRatio: 0.02, fillingType: 'chocoChips', fillingGrams: 25 },
  'Burger Bun (Pack)': { flourPerUnitGrams: 250, waterRatio: 0.65, levainRatio: 0.20, saltRatio: 0.02 },
  'Paket Mini Isi 4': { flourPerUnitGrams: 200, waterRatio: 0.60, levainRatio: 0.15, saltRatio: 0.018, fillingType: 'creamCheese', fillingGrams: 40 },
  'Paket Mini Isi 8': { flourPerUnitGrams: 400, waterRatio: 0.60, levainRatio: 0.15, saltRatio: 0.018, fillingType: 'creamCheese', fillingGrams: 80 }
};

export class BatchDoughCalculatorService {
  /**
   * Calculates automatic kitchen ingredient requirements for a batch
   */
  static calculateBatchRequirements(orders: OrderCreatePayload[]): DoughRecipeRequirement {
    let totalFlourGrams = 0;
    let totalWaterGrams = 0;
    let totalLevainGrams = 0;
    let totalSaltGrams = 0;
    let totalCreamCheeseGrams = 0;
    let totalChocoChipsGrams = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const recipe = PRODUCT_RECIPE_MAP[item.productName] || { flourPerUnitGrams: 100, waterRatio: 0.65, levainRatio: 0.20, saltRatio: 0.02 };
        const itemFlour = recipe.flourPerUnitGrams * item.qty;

        totalFlourGrams += itemFlour;
        totalWaterGrams += itemFlour * recipe.waterRatio;
        totalLevainGrams += itemFlour * recipe.levainRatio;
        totalSaltGrams += itemFlour * recipe.saltRatio;

        if (recipe.fillingType === 'creamCheese' && recipe.fillingGrams) {
          totalCreamCheeseGrams += recipe.fillingGrams * item.qty;
        }
        if (recipe.fillingType === 'chocoChips' && recipe.fillingGrams) {
          totalChocoChipsGrams += recipe.fillingGrams * item.qty;
        }
      });
    });

    const totalFlourKg = Number((totalFlourGrams / 1000).toFixed(2));
    const totalWaterL = Number((totalWaterGrams / 1000).toFixed(2));
    const totalLevainKg = Number((totalLevainGrams / 1000).toFixed(2));

    return {
      baseDoughName: 'Sourdough Base Mix',
      totalWeightKg: Number((totalFlourKg + totalWaterL + totalLevainKg).toFixed(2)),
      ingredients: {
        flourKg: totalFlourKg,
        waterLiter: totalWaterL,
        levainActiveKg: totalLevainKg,
        saltGrams: Math.round(totalSaltGrams)
      },
      fillings: {
        creamCheeseKg: totalCreamCheeseGrams > 0 ? Number((totalCreamCheeseGrams / 1000).toFixed(2)) : 0,
        chocoChipsKg: totalChocoChipsGrams > 0 ? Number((totalChocoChipsGrams / 1000).toFixed(2)) : 0
      }
    };
  }
}
