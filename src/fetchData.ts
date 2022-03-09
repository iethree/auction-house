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

// get prices for connected realm id
export async function getAuctionData(realmId: number): Promise<ApiAuctionItem[] |  null> {
  const token = await getAuthToken(process.env.BLIZZARD_ID as string, process.env.BLIZZARD_SECRET as string);
  const priceEndpoint = `https://us.api.blizzard.com/data/wow/connected-realm/${realmId}/auctions?namespace=dynamic-us&locale=en_US&access_token=${token}`;

  const response = await fetch(priceEndpoint);
  if (response.ok){
    const apiResponse = await response.json() as ApiAuctionHouse;
    return apiResponse.auctions;
  }

  return null;
}

export async function getName(itemId: number): Promise<string | null> {
  const token = await getAuthToken(process.env.BLIZZARD_ID as string, process.env.BLIZZARD_SECRET as string);
  const nameEndpoint = `https://us.api.blizzard.com/data/wow/item/${itemId}?namespace=static-us&region=us&local=en_US&access_token=${token}`;

  const response = await fetch(nameEndpoint).catch(console.error);
  if (response && response.ok){
    const apiResponse = await response.json() as any;
    console.log('got name for ', itemId, apiResponse.name.en_US);
    return apiResponse?.name?.en_US || null;
  } else {
    console.error(response)
  }

  return null;
}

export async function getNames(itemIds: number[]): Promise<ItemNameMap[]> {
  const token = await getAuthToken(process.env.BLIZZARD_ID as string, process.env.BLIZZARD_SECRET as string);

  const itemsWithNames: Array<ItemNameMap | null> = await Promise.all(itemIds.map(async (itemId) => {
    const nameEndpoint = `https://us.api.blizzard.com/data/wow/item/${itemId}?namespace=static-us&region=us&local=en_US&access_token=${token}`;

    return fetch(nameEndpoint)
      .then(async(response) => {
        if (response && response.ok){
          const apiResponse = await response.json() as any;
          const name = apiResponse?.name?.en_US || null;
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
