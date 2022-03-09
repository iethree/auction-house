import type { AuctionItem } from '@/types/auctionHouse';
import pg from 'pg';
import { getNames } from './fetchData';

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
export async function loadItemNames(limit = 10): Promise<number | null> {
  const { Client } = pg;
  const client = new Client();
  await client.connect();

  const noNameQuery = /*sql*/`SELECT DISTINCT prices.item_id, item_names.name
    FROM prices
    LEFT JOIN item_names ON item_names.item_id = prices.item_id
    WHERE item_names.name IS NULL
    LIMIT ${limit};`;

  const { rows: itemsMissingNames } = await client.query(noNameQuery);
  const itemIds = itemsMissingNames.map((item) => item.item_id);
  const itemsWithNames = await getNames(itemIds);

  const params = itemsWithNames.map((item) => `(${item.itemId}, '${item.name.replace(/'/g, "''")}')`).join(',');
  const nameInsertQuery = /*sql*/`INSERT INTO item_names (item_id, name) VALUES ${params}`;

  const insertResult = await client.query(nameInsertQuery);
  await client.end();

  return (insertResult && insertResult.rowCount) || null;
}

