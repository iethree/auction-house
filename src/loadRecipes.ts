import 'dotenv/config';
import { getRecipes } from "./fetchData";
import { saveRecipes } from './saveData';

console.log('⌛ fetching recipes');

// 2750 : shadowlands alchemy
// 2752 : shadowlands cooking

const professionIds = {
  'Blacksmithing': 164,
  'Leatherworking': 165,
  'Alchemy': 171,
  'Herbalism': 182,
  'Cooking': 185,
  'Mining': 186,
  'Tailoring': 197,
  'Engineering': 202,
  'Enchanting': 333,
  'Fishing': 356,
  'Skinning': 393,
  'Jewelcrafting': 755,
  'Inscription': 773,
  'Archaeology': 794,
  'Soul Cyphering': 2777,
  'Abominable Stitching': 2787,
  'Ascension Crafting': 2791,
  'Stygia Crafting': 2811,
  'Protoform Synthesis': 2819,
};

const recipes = await getRecipes(
  professionIds['Tailoring'],
  'Shadowlands',
).catch(console.error);

if (!recipes) {
  console.error('Could not fetch recipes');
  process.exit(1);
}

console.log(recipes.length, 'recipes fetched');

const saved = await saveRecipes(recipes).catch(console.error);

console.log(saved, 'recipes saved');

console.log(`✅ done`);
