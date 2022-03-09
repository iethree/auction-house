import type { ApiAuctionItem, AuctionItem } from '@/types/auctionHouse';
interface AuctionMap {
  [key: number]: AuctionItem
}

// consolidates prices with a unit price
export default function consolidatePrices(auctions: ApiAuctionItem[]): AuctionItem[] {
  const ts = new Date().toISOString();

  const consolidatedAuctions : AuctionMap  = auctions.reduce((consolidatedAuctions: AuctionMap, auction: ApiAuctionItem) => {
    const itemId = auction.item.id;
    // unit price for stackables, converted to gold
    const price = (auction.unit_price || auction.buyout || 0) / 10000;

    if (consolidatedAuctions[itemId]) {
      if (price < consolidatedAuctions[itemId].lowPrice){ // save lowest price
        consolidatedAuctions[itemId].lowPrice = price;
      }
      consolidatedAuctions[itemId].qty += auction.quantity;
      consolidatedAuctions[itemId].auctions.push({
        price,
        qty: auction.quantity,
      });
    } else {
      consolidatedAuctions[itemId] = {
        itemId,
        lowPrice: price,
        qty: auction.quantity,
        ts,
        auctions: [{
          price,
          qty: auction.quantity,
        }]
      };
    }

    return consolidatedAuctions;
  }, {});

  return Object.values(consolidatedAuctions);
}
