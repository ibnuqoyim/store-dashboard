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
    [key: string]: number | undefined;
  };
}

export interface ProductRecipeRatio {
  flourPerUnitGrams: number;
  waterRatio: number;
  levainRatio: number;
  saltRatio: number;
  fillingType?: string;
  fillingGrams?: number;
}

export type RecipeMap = Record<string, ProductRecipeRatio>;
export type RecipeOverrides = Record<string, Partial<ProductRecipeRatio>>;

// Master Recipe Multipliers per Product Category (Internal Default)
const PRODUCT_RECIPE_MAP: RecipeMap = {
  'Milk Bread': { flourPerUnitGrams: 120, waterRatio: 0.65, levainRatio: 0.20, saltRatio: 0.02 },
  'Earl Grey CC Mini': { flourPerUnitGrams: 50, waterRatio: 0.60, levainRatio: 0.15, saltRatio: 0.018, fillingType: 'creamCheese', fillingGrams: 30 },
  'Chocobanana': { flourPerUnitGrams: 100, waterRatio: 0.62, levainRatio: 0.18, saltRatio: 0.02, fillingType: 'chocoChips', fillingGrams: 25 },
  'Burger Bun (Pack)': { flourPerUnitGrams: 250, waterRatio: 0.65, levainRatio: 0.20, saltRatio: 0.02 },
  'Paket Mini Isi 4': { flourPerUnitGrams: 200, waterRatio: 0.60, levainRatio: 0.15, saltRatio: 0.018, fillingType: 'creamCheese', fillingGrams: 40 },
  'Paket Mini Isi 8': { flourPerUnitGrams: 400, waterRatio: 0.60, levainRatio: 0.15, saltRatio: 0.018, fillingType: 'creamCheese', fillingGrams: 80 },
};

const DEFAULT_FALLBACK_RECIPE: ProductRecipeRatio = {
  flourPerUnitGrams: 100,
  waterRatio: 0.65,
  levainRatio: 0.20,
  saltRatio: 0.02,
};

export class BatchDoughCalculatorService {
  private customRecipeMap?: RecipeOverrides;
  private fallbackRecipe?: Partial<ProductRecipeRatio>;

  constructor(
    customRecipeMap?: RecipeOverrides,
    fallbackRecipe?: Partial<ProductRecipeRatio>
  ) {
    this.customRecipeMap = customRecipeMap;
    this.fallbackRecipe = fallbackRecipe;
  }

  /**
   * Instance-based calculation
   */
  calculate(orders: OrderCreatePayload[]): DoughRecipeRequirement {
    return BatchDoughCalculatorService.calculateBatchRequirements(
      orders,
      this.customRecipeMap,
      this.fallbackRecipe
    );
  }

  /**
   * Resolves recipe ratio for a product by checking customRecipeMap, PRODUCT_RECIPE_MAP, or fallback
   */
  static getRecipeForProduct(
    productName: string,
    customRecipeMap?: RecipeOverrides,
    fallbackRecipe?: Partial<ProductRecipeRatio>
  ): ProductRecipeRatio {
    const baseFallback: ProductRecipeRatio = {
      ...DEFAULT_FALLBACK_RECIPE,
      ...(fallbackRecipe || {}),
    };

    const baseRecipe = PRODUCT_RECIPE_MAP[productName] || baseFallback;
    const customRatio = customRecipeMap?.[productName];

    const merged = customRatio ? { ...baseRecipe, ...customRatio } : baseRecipe;

    // Sanitize and validate ratio bounds to protect production calculations
    return {
      flourPerUnitGrams: Math.max(0, Math.min(5000, merged.flourPerUnitGrams ?? 100)),
      waterRatio: Math.max(0, Math.min(2, merged.waterRatio ?? 0.65)),
      levainRatio: Math.max(0, Math.min(1, merged.levainRatio ?? 0.20)),
      saltRatio: Math.max(0, Math.min(0.1, merged.saltRatio ?? 0.02)),
      fillingType: merged.fillingType,
      fillingGrams: merged.fillingGrams !== undefined ? Math.max(0, Math.min(5000, merged.fillingGrams)) : undefined,
    };
  }

  /**
   * Calculates automatic kitchen ingredient requirements for a batch.
   * Supports dynamic recipe ratios / custom recipe map injection while keeping full backward compatibility.
   */
  static calculateBatchRequirements(
    orders: OrderCreatePayload[],
    customRecipeMap?: RecipeOverrides,
    fallbackRecipe?: Partial<ProductRecipeRatio>
  ): DoughRecipeRequirement {
    let totalFlourGrams = 0;
    let totalWaterGrams = 0;
    let totalLevainGrams = 0;
    let totalSaltGrams = 0;
    let totalCreamCheeseGrams = 0;
    let totalChocoChipsGrams = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const recipe = BatchDoughCalculatorService.getRecipeForProduct(
          item.productName,
          customRecipeMap,
          fallbackRecipe
        );
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
        saltGrams: Math.round(totalSaltGrams),
      },
      fillings: {
        creamCheeseKg: totalCreamCheeseGrams > 0 ? Number((totalCreamCheeseGrams / 1000).toFixed(2)) : 0,
        chocoChipsKg: totalChocoChipsGrams > 0 ? Number((totalChocoChipsGrams / 1000).toFixed(2)) : 0,
      },
    };
  }
}
