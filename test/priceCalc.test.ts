import { expect } from 'chai';
import { Recipe, Ingredient } from '@/types/auctionHouse';
import { calculateCraftPrice } from '../src/craftPrice';

describe("craft prices", () => {
  it('calculates craft price with 2 ingredients', () => {
    const recipe: Recipe = {
      recipeId: 1111,
      recipeName: 'Test Recipe',
      recipeCategory: 'Test Category',
      craftedItemId: 11111,
      craftedItemQty: 1,
      professionId: 1111,
      professionName: 'ProfessionName',
      professionTierId: 1,
      professionTierName: 'Apprentice',
      reagents: [
        { itemId: 11, qty: 5 },
        { itemId: 22, qty: 1 },
      ]
    };

    const reagents: Ingredient[] = [
      { itemId: 11, qty: 1, price: 1 },
      { itemId: 22, qty: 1, price: 2 },
    ];

    const price = calculateCraftPrice(recipe, reagents);

    expect(price).to.equal(5 + 2);
  });

  it('calculates craft price for recipe with multiple outputs', () => {
    const recipe: Recipe = {
      recipeId: 1111,
      recipeName: 'Test Recipe',
      recipeCategory: 'Test Category',
      craftedItemId: 11111,
      craftedItemQty: 3,
      professionId: 1111,
      professionName: 'ProfessionName',
      professionTierId: 1,
      professionTierName: 'Apprentice',
      reagents: [
        { itemId: 11, qty: 5 },
        { itemId: 22, qty: 1 },
      ]
    };

    const reagents: Ingredient[] = [
      { itemId: 11, qty: 1, price: 1 },
      { itemId: 22, qty: 1, price: 2 },
    ];

    const price = calculateCraftPrice(recipe, reagents);

    expect(price).to.equal(7 / 3);
  });

  it('throws an error for missing ingredients', () => {
    const recipe: Recipe = {
      recipeId: 1111,
      recipeName: 'Test Recipe',
      recipeCategory: 'Test Category',
      craftedItemId: 11111,
      craftedItemQty: 1,
      professionId: 1111,
      professionName: 'ProfessionName',
      professionTierId: 1,
      professionTierName: 'Apprentice',
      reagents: [
        { itemId: 11, qty: 5 },
        { itemId: 22, qty: 1 },
      ]
    };

    const reagents: Ingredient[] = [
      { itemId: 11, price: 1 },
    ];

    expect(() => calculateCraftPrice(recipe, reagents)).to.throw();
  });
});

export {};