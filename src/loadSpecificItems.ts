import 'dotenv/config';
import { loadSpecificItems } from './saveData';

const vendorItemIds = [
  172056,
  172057,
  172058,
  172059,
  178786,
  180732,
  183950,
  159,
  187812,
  173060,
  175886,
  183953,
  177061,
  173202,
  171287,
  183950,
];

console.log('⌛ fetching vendor items', new Date());

const result = await loadSpecificItems(vendorItemIds);

console.log(`✅ ${result} items loaded`);
