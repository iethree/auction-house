import { loadItemNames } from './saveData';

async function wait(sec: number) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

export default async function loadAllNames() {
  let loadedNames: number | null | void = 1;

  while (loadedNames) {
    console.log(`⌛ fetching names`);

    loadedNames = await loadItemNames(90).catch( async(err) => {
      if (err.message === 'request timed out') {
        console.log('❌ timeout, retrying');
        return 1;
      }
    });
    if (loadedNames && loadedNames > 1)
      console.log(`✅ ${loadedNames} names loaded`);
    if (!loadedNames) break;
    await wait(1);
  }

  console.log(`✅ all names loaded`);
}
