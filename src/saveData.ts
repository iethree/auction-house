import type { AuctionItem, Recipe, Item } from '@/types/auctionHouse';
import pg from 'pg';
import { getItems } from './fetchData';
import { getProfessionTier, getRecipe } from './fetchData';

export async function saveAuctionData(auctionData: AuctionItem[]): Promise<number | null> {
  const { Client } = pg;
  const client = new Client();
  await client.connect();

  const params = auctionData.map((item) => (
    `(${item.itemId}, ${item.qty}, ${item.lowPrice}, '${JSON.stringify(item.auctions)}')`
  )).join(',');

  const query = /*sql*/`INSERT INTO prices (item_id, qty, low_price, auctions) VALUES ${params};`;
  const res = await client.query(query).catch(console.error);

  await client.end();
  return (res && res.rowCount) || null;
}

// API throttles at 100 requests per second or 36,000 requests per hour
export async function loadItems(limit = 10): Promise<number | null> {

  // TODO: refactor to separate getting and saving

  const { Client } = pg;
  const client = new Client();
  await client.connect();

  const noNameQuery = /*sql*/`SELECT DISTINCT prices.item_id, items.name
    FROM prices
    LEFT JOIN items ON items.item_id = prices.item_id
    WHERE items.name IS NULL
    LIMIT ${limit};`;
  await client.end();

  const { rows: itemsMissingNames } = await client.query(noNameQuery);
  const itemIds = itemsMissingNames.map((item) => item.item_id);

  return loadSpecificItems(itemIds);
}

export async function loadSpecificItems(itemIds: number[]): Promise<number | null> {
  const { Client } = pg;
  const client = new Client();
  await client.connect();

  const itemsWithNames = await getItems(itemIds);

  const params = itemsWithNames.map((item) => `(
    ${item.itemId},
    '${item.name.replace(/'/g, "''")}',
    '${item.itemClass.replace(/'/g, "''")}',
    '${item.itemSubClass.replace(/'/g, "''")}',
    '${item.description.replace(/'/g, "''")}',
    ${item.craftingReagent},
    ${item.vendorItem},
    ${item.purchasePrice},
    ${item.sellPrice}
  )`).join(',');

  const nameInsertQuery = /*sql*/`INSERT INTO items (
    item_id,
    name,
    item_class,
    item_subclass,
    item_description,
    crafting_reagent,
    vendor_item,
    purchase_price,
    sell_price
  ) VALUES ${params} ON CONFLICT DO NOTHING`;

  const insertResult = await client.query(nameInsertQuery);

  await client.end();

  return (insertResult && insertResult.rowCount) || null;
}

export async function saveRecipes(recipes: Recipe[]): Promise<number | null> {
  const { Client } = pg;
  const client = new Client();
  await client.connect();

  const params = recipes.map((r) => (
    `(
      ${r.recipeId},
      '${r.recipeName.replace(/'/g, "''")}',
      '${r.recipeCategory}',
      ${r.professionId},
      '${r.professionName.replace(/'/g, "''")}',
      '${r.professionTierName.replace(/'/g, "''")}',
      ${r.professionTierId},
      ${r.craftedItemId},
      ${r.craftedItemQty},
      '${JSON.stringify(r.reagents)}'
    )`
  )).join(',');

  const query = /*sql*/`INSERT INTO recipes (
    recipe_id,
    recipe_name,
    recipe_category,
    profession_id,
    profession_name,
    profession_tier_name,
    profession_tier_id,
    crafted_item_id,
    crafted_item_qty,
    reagents
  ) VALUES ${params};`;
  const res = await client.query(query).catch(console.error);

  await client.end();
  return (res && res.rowCount) || null;
}
