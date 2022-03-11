import 'dotenv/config';
import { getItemData, getProfession, getProfessionTier, getRecipe} from './fetchData';
import fs from 'fs';

console.log('⌛ fetching item data');
// 171276	Spectral Flask of Power	455.00
// 168589	Marrowroot	40.00	10,627
// 172056 Medley of Transplanar spices

// const itemData = await getItemData([171276, 168589, 172056])
//   .catch(console.error);

// fs.writeFileSync('./data/itemData.json', JSON.stringify(itemData, null, 2));

// console.log(`✅ ${itemData?.length} items fetched`);

const data = await getRecipe(42319)
  .catch(console.error);

fs.writeFileSync('./data/flaskRecipe.json', JSON.stringify(data, null, 2));

console.log(`✅ profession stuff fetched`);

// 171 : alchemy
// 185 : cooking
// 2750 : shadowlands alchemy
// 2752 : shadowlands cooking


