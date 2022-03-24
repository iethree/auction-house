import 'dotenv/config';
import { getAuctionData } from './fetchData';
import { loadCraftPrices } from './craftPrice';
import consolidatePrices from './consolidateAuctions';
import { saveAuctionData } from './saveData';
import loadAllItems from './loadItems';

// fetch
const skywallId = 86;

console.log('⌛ fetching auctions');

const auctionData = await getAuctionData(skywallId).catch(console.error);

if (!auctionData) {
  console.error('Could not fetch auction data');
  process.exit(1);
}

// parse
const parsedPrices = consolidatePrices(auctionData);

// save
const insertedPrices = await saveAuctionData(parsedPrices).catch(console.error);

console.log(`✅ ${insertedPrices} prices saved`);

await loadAllItems();

console.log('⌛ calculating craft prices');
const loaded = await loadCraftPrices().catch(console.error);
console.log(`✅ saved ${loaded} craft prices`);

console.log(`✅ done`);

process.exit(0);
