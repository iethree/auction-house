import type {
  ApiAuctionHouse, ApiAuctionItem, Item, Recipe, Ingredient
} from '@/types/auctionHouse';
import fetch from './fetchWithTimeout';
import fs from 'fs';

let authTokenCache = {
  access_token: '',
  expires_at: Date.now(),
};

// get blizzard API token
async function getAuthToken(id: string, secret: string){
  if (authTokenCache.access_token && authTokenCache.expires_at > Date.now()) {
    return authTokenCache.access_token;
  }

  const authString = id + ':' + secret;
  const authEndpoint = "https://us.battle.net/oauth/token";
  const r = await fetch(authEndpoint, {
    'method': 'post',
    'headers' : {
      'Authorization': 'Basic ' + Buffer.from(authString).toString('base64'),
      'Content-Type' : 'application/x-www-form-urlencoded'
    },
    'body' : 'grant_type=client_credentials'
  });

  if (r.ok) {
    const data: any = await r.json();
    authTokenCache = {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000
    };
    return data.access_token;
  } else {
    return null;
  }
}

async function getApiData(apiPath: string): Promise<any> {
  const token = await getAuthToken(
    process.env.BLIZZARD_ID as string,
    process.env.BLIZZARD_SECRET as string
  );

  const querySeparator = apiPath.includes('?') ? '&' : '?';

  const endpoint = `https://us.api.blizzard.com/data/wow/${apiPath}${querySeparator}locale=en_US&region=us&access_token=${token}`;

  return fetch(endpoint)
    .then(async (response) => {
      if (response && response.ok){
        const apiResponse = await response.json() as any;
        return apiResponse;
      } else {
        console.error(response.statusText, apiPath);
        return Promise.reject(response);
      }
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

// get prices for connected realm id
export async function getAuctionData(realmId: number): Promise<ApiAuctionItem[] |  null> {
  const priceEndpoint = `connected-realm/${realmId}/auctions?namespace=dynamic-us`;
  // there is a separate endpoint for all realms commodities
  // https://us.forums.blizzard.com/en/blizzard/t/immediate-change-to-auction-apis-for-commodities-with-927/31522
  const commodityEndpoint = 'auctions/commodities?namespace=dynamic-us';

  const realmData = await getApiData(priceEndpoint);
  const commodityData = await getApiData(commodityEndpoint);

  if (realmData || commodityData){
    // fs.writeFileSync(`data/apiResponse_${new Date().toISOString()}.json`, JSON.stringify(apiResponse, null, 2));
    return [
      ...realmData.auctions,
      ...commodityData.auctions
    ];
  }

  return null;
}

export async function getName(itemId: number): Promise<string | null> {
  const nameEndpoint = `item/${itemId}?namespace=static-us`;

  const response = await getApiData(nameEndpoint).catch(console.error);

  if (response){
    console.log('got name for ', itemId, response.name.en_US);
    return response?.name?.en_US || null;
  } else {
    console.error(response)
  }

  return null;
}

export async function getItems(itemIds: number[]): Promise<Item[]> {
  const items: Array<Item | null> = await Promise.all(itemIds.map(async (itemId) => {
    const endpoint = `item/${itemId}?namespace=static-us`;

    return getApiData(endpoint)
      .then(async(response) => {
        if (response){
          return {
            itemId,
            name: response.name,
            itemClass: response.item_class.name,
            itemSubClass: response.item_subclass.name,
            description: response?.description || response?.spells?.[0]?.description || '',
            craftingReagent: !!response?.preview_item?.crafting_reagent,
            vendorItem: null, // not sure how to figure this out programatically
            purchasePrice: response?.purchase_price / 10000,
            sellPrice: response?.sell_price / 10000,
          };
        }
        return null;
      })
      .catch((r) => {
        if (r?.status && r.status === 404) {
          return {
            itemId,
            name: 'Unknown',
            itemClass: 'Unknown',
            itemSubClass: 'Unknown',
            description: 'Unknown',
            craftingReagent: null,
            vendorItem: null,
            purchasePrice: null,
            sellPrice: null,
          };
        }
        return null;
      })
  }));

  return items.filter(Boolean) as Item[];
}

export async function getProfessionIndex(): Promise<any> {
  const professionIndexEndpoint = `profession/index?namespace=static-us`;
  return getApiData(professionIndexEndpoint);
}

export async function getProfession(id: number | 'index'): Promise<any> {
  const professionEndpoint = `profession/${id}?namespace=static-us`;
  return getApiData(professionEndpoint);
}

export async function getProfessionTier(professionId: number, tierId: number): Promise<any> {
  const professionEndpoint = `profession/${professionId}/skill-tier/${tierId}?namespace=static-us`;
  return getApiData(professionEndpoint);
}

export async function getRecipe(id: number ): Promise<any> {
  const professionEndpoint = `recipe/${id}?namespace=static-us`;
  return getApiData(professionEndpoint);
}

export async function getRecipes(professionId: number, tierName: string): Promise<Recipe[] | null> {
  const profession = await getProfession(professionId);

  const tierInfo = profession.skill_tiers.find(
    (skillTier: any) => skillTier.name.toLowerCase().includes(tierName.toLowerCase())
  );
  if (!tierInfo || !profession) return null;

  const tierData = await getProfessionTier(professionId, tierInfo.id);

  const recipes: Recipe[] | void = await Promise.all(
    tierData.categories.map((category: any) => (
      category.recipes.map(async (thisRecipe: any) => {
        const recipeData = await getRecipe(thisRecipe.id);

        return {
          recipeId: thisRecipe.id,
          recipeName: thisRecipe.name,
          recipeCategory: category.name,
          professionId: professionId,
          professionName: profession.name,
          professionTierName: tierInfo.name,
          professionTierId: tierInfo.id,
          craftedItemId: recipeData.crafted_item.id,
          craftedItemQty: recipeData.crafted_quantity.value,
          reagents: mapReagents(recipeData.reagents),
        };
      })
    )).flat()
  ).catch (console.error);
  return recipes || null;
}

const mapReagents = (reagents: any[]): Ingredient[] => reagents.map((r) => ({
  itemId: r.reagent.id,
  qty: r.quantity,
}));
