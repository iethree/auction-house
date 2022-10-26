import { loadItems } from './saveData';

async function wait(sec: number) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

export default async function loadAllItems() {
  let loadedNames: number | null | void = 1;

  while (loadedNames) {
    console.log(`⌛ fetching items`);

    loadedNames = await loadItems(90).catch(async(err) => {
      if (err.message === 'request timed out') {
        console.log('❌ timeout, retrying');
        return 1;
      }
    });
    if (loadedNames && loadedNames > 1)
      console.log(`✅ ${loadedNames} items loaded`);
    if (!loadedNames) break;
    await wait(1);
  }

  console.log(`✅ all names loaded`);
}
