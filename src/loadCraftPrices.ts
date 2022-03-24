import { loadCraftPrices } from './craftPrice';

// // ground marrowroot
// console.log(await getCraftPrice(171290))

// // flask of power
// console.log(await getCraftPrice(171276))

console.log('⌛ calculating craft prices');
const loaded = await loadCraftPrices().catch(console.error);
console.log(`✅ saved ${loaded} craft prices`);
process.exit(0);