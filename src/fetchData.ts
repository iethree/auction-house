import { ApiAuctionHouse, ApiAuctionItem, ItemNameMap } from '@/types/auctionHouse';
import fetch from './fetchWithTimeout';

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
  const token = await getAuthToken(process.env.BLIZZARD_ID as string, process.env.BLIZZARD_SECRET as string);

  const querySeparator = apiPath.includes('?') ? '&' : '?';

  const endpoint = `https://us.api.blizzard.com/data/wow/${apiPath}${querySeparator}locale=en_US&region=us&access_token=${token}`;

  return fetch(endpoint)
    .then(async (response) => {
      if (response && response.ok){
        const apiResponse = await response.json() as any;
        return apiResponse;
      } else {
        console.error(apiPath, response.statusText);
        return null;
      }
    })
    .catch((err) => {
      console.error(apiPath, err.message);
      return null;
    });
}

// get prices for connected realm id
export async function getAuctionData(realmId: number): Promise<ApiAuctionItem[] |  null> {
  const priceEndpoint = `connected-realm/${realmId}/auctions?namespace=dynamic-us`;

  const response = await getApiData(priceEndpoint);

  if (response.ok){
    const apiResponse = await response.json() as ApiAuctionHouse;
    return apiResponse.auctions;
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

export async function getNames(itemIds: number[]): Promise<ItemNameMap[]> {
  const token = await getAuthToken(process.env.BLIZZARD_ID as string, process.env.BLIZZARD_SECRET as string);

  const itemsWithNames: Array<ItemNameMap | null> = await Promise.all(itemIds.map(async (itemId) => {
    const nameEndpoint = `https://us.api.blizzard.com/data/wow/item/${itemId}?namespace=static-us&region=us&local=en_US&access_token=${token}`;

    return getApiData(nameEndpoint)
      .then(async(response) => {
        if (response){
          const name = response?.name?.en_US || null;
          return { itemId, name };
        } else {
          console.error(itemId, response.statusText);

          if (response.status === 404) {
            return { itemId, name: 'Unknown' };
          }
          return null;
        }
      })
      .catch((err) => {
        console.error(itemId, err.message);
        return null;
      })
  }));

  return itemsWithNames
    .filter(Boolean) as ItemNameMap[];
}

export async function getItemData(itemIds: number[]): Promise<any[]> {
  const itemData: Array<ItemNameMap | null> = await Promise.all(itemIds.map(async (itemId) => {
    const itemEndpoint = `item/${itemId}?namespace=static-us`;
    return getApiData(itemEndpoint);
  }));

  return itemData
    .filter(Boolean) as any[];
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
