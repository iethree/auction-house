import 'dotenv/config';
import { getRecipes } from "./fetchData";
import { saveRecipes } from './saveData';

console.log('⌛ fetching recipes');

// 171 : alchemy
// 2750 : shadowlands alchemy

// 185 : cooking
// 2752 : shadowlands cooking

const recipes = await getRecipes(185, 'Shadowlands').catch(console.error);

if (!recipes) {
  console.error('Could not fetch recipes');
  process.exit(1);
}

console.log(recipes.length, 'recipes fetched');

const saved = await saveRecipes(recipes).catch(console.error);

console.log(saved, 'recipes saved');

console.log(`✅ done`);
