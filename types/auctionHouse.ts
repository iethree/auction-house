export interface ApiAuctionItem {
  id: number;
  item: {
    id: number;
    context?: number;
    bonus_lists?: number[];
    modifiers?: any[];
    [key: string]: any;
  },
  quantity: number,
  buyout?: number,
  bid?: number,
  unit_price?: number,
  time_left: string,
}

export interface ApiAuctionHouse {
  _links: {
    self: {
      href: string;
    }
  }
  connected_realm: {
    href: string;
  },
  auctions: ApiAuctionItem[],
}

export interface AuctionDetail {
  price: number;
  qty: number;
}

export interface AuctionItem {
  itemId: number;
  qty: number;
  lowPrice: number;
  ts: string;
  auctions: AuctionDetail[];
}

export interface Item {
	itemId: number;
	name: string;
  itemClass: string;
  itemSubClass: string;
  description: string;
  craftingReagent: boolean | null;
  vendorItem: boolean | null;
  purchasePrice: number | null;
  sellPrice: number | null;
}

export interface Ingredient {
  itemId: number;
  qty?: number;
  price?: number;
}

export interface Recipe {
  recipeId: number;
	recipeName: string;
	recipeCategory: string;
	professionId: number;
	professionName: string;
	professionTierName: string;
	professionTierId: number;
	craftedItemId: number;
	craftedItemQty: number;
	reagents: Ingredient[];
}
