import 'dotenv/config';
import type { Recipe, Ingredient } from "@/types/auctionHouse";
import pg from 'pg';

type PriceMap = {
  price_id: number,
  item_id: number,
  craft_price: number,
};

export async function loadCraftPrices() : Promise<number | null> {
  const { Client } = pg;
  const client = new Client();
  await client.connect();

  const { rows: itemsNeedingPrices } = await client.query(/*sql*/`
    SELECT
      prices.id, prices.item_id, recipes.recipe_id, prices.low_price, prices.craft_price, recipes.recipe_name
    FROM prices
    INNER JOIN recipes on recipes.crafted_item_id = prices.item_id
    WHERE
      prices.item_id is not null
      and prices.craft_price is null
      and prices.ts = (SELECT MAX(ts) FROM prices);
  `);

  const itemCraftPrices: PriceMap[] = [];

  // we can't map this because it will open too many DB connections at once
  for (const i of itemsNeedingPrices) {
    const craftPrice = await getCraftPrice(i.item_id);

    if (!craftPrice) continue;

    itemCraftPrices.push({
      price_id: i.id,
      item_id: i.item_id,
      craft_price: craftPrice,
    });
  }

  if (!itemCraftPrices.length) {
    await client.end();
    return 0;
  }
  const priceValues = itemCraftPrices.map((i) => `(${i.price_id}, ${i.craft_price})`).join(',');

  const updateQuery = /*sql*/`
    UPDATE prices
      SET craft_price = new_data.craft_price
      FROM ( VALUES
        ${priceValues}
      ) AS new_data(price_id, craft_price)
    WHERE prices.id = new_data.price_id;`;

  const res = await client.query(updateQuery);
  await client.end();

  return (res && res.rowCount) || null;
}

export async function getCraftPrice(itemId: number): Promise<number> {
  const recipe = await getRecipe(itemId);

  if (!recipe) {
    throw new Error(`Recipe not found for itemId: ${itemId}`);
  }

  const reagents: Ingredient[] = await Promise.all(
    recipe.reagents.map((r) => getIngredient(r.itemId, r.qty))
  );

  return calculateCraftPrice(recipe, reagents);
}

// WIP
export async function getMissingItemIds(recipe: Recipe): Promise<void> {
  const { Client } = pg;
  const client = new Client();
  await client.connect();
  const itemIds = recipe.reagents.map(({ itemId }) => itemId);

  const { rows: results } = await client.query(
    `SELECT item_id FROM items WHERE item_id IN (${itemIds.join(',')});`
  );

  // const missingItemIds = results.filter(({ item_id }) => !itemIds.includes(item_id));

  // TODO handle crafting items missing from db
  // if (missingItemIds.length) {
  //   await loadItems(missingItemIds);
  // }

  await client.end();
}

// get the recipe to craft the given item id
export async function getRecipe(itemId: number): Promise<Recipe | null> {
  const { Client } = pg;
  const client = new Client();
  await client.connect();

  const { rows: [recipe] } = await client.query(
    `SELECT * FROM recipes WHERE crafted_item_id = ${itemId}`
  );
  await client.end();

  if (!recipe) return null;

  return {
    craftedItemId: recipe.crafted_item_id,
    recipeId: recipe.recipe_id,
    recipeName: recipe.recipe_name,
    recipeCategory: recipe.recipe_category,
    professionId: recipe.profession_id,
    professionName: recipe.profession_name,
    professionTierName: recipe.profession_tier_name,
    professionTierId: recipe.profession_tier_id,
    craftedItemQty: recipe.crafted_item_qty,
    reagents: recipe.reagents,
  };
}

export async function getItemInfo(itemId: number) {
  const { Client } = pg;
  const client = new Client();
  await client.connect();

  const { rows: [itemInfo] } = await client.query(
    /*SQL*/ `SELECT
      prices.low_price AS auction_price,
      items.purchase_price AS vendor_price,
      recipes.crafted_item_id IS NOT NULL AS is_craftable
    FROM prices
      LEFT JOIN items ON items.item_id = prices.item_id AND items.vendor_item = true
      LEFT JOIN recipes ON recipes.crafted_item_id = prices.item_id
    WHERE prices.item_id = $1
    ORDER BY prices.id DESC LIMIT 1;`,
    [itemId]
  );

  await client.end();

  return itemInfo;
}

export async function getIngredient(itemId: number, qty = 1): Promise<Ingredient> {

  const itemInfo = await getItemInfo(itemId);

  // if it's craftable, check if we can craft it cheaper than buying it
  if (itemInfo.is_craftable) {
    itemInfo.craftPrice = await getCraftPrice(itemId);
  }

  const lowPrice = Math.min(
    itemInfo.auction_price || Infinity,
    itemInfo.vendor_price || Infinity,
    itemInfo.craftPrice || Infinity,
  );

  return {
    itemId,
    qty,
    price: lowPrice || 0,
  };
}

export function calculateCraftPrice(recipe: Recipe, reagents: Ingredient[]): number {
  if (!reagents.length) throw new Error('No reagents found');
  const reagentMap = Object.fromEntries(reagents.map(r => [r.itemId, r]));

  const price = recipe.reagents.reduce((price, reagent) => {
    if (!reagentMap[reagent.itemId]?.price) {
      throw new Error(`cannot calculate craft price for ${recipe.recipeName}: missing reagent price for ${reagent.itemId}`);
    } else {
      // @ts-ignore
      const reagentPrice = reagentMap[reagent.itemId].price * reagent.qty;
      return price + reagentPrice;
    }
  }, 0) / recipe.craftedItemQty;

  return price;
}
