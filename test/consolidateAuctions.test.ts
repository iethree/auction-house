import { expect } from 'chai';
import { ApiAuctionItem, AuctionItem } from '@/types/auctionHouse';
import auctionData from '../data/prices.json';
import consolidateAuctions from '../src/consolidateAuctions';
import fs from 'fs';

describe("consolidate auction data", () => {
  // @ts-ignore
  const apiData: ApiAuctionItem[] = auctionData.auctions;

  it('conslidates auction data', () => {
    const results: AuctionItem[] = consolidateAuctions(apiData);
    // console.log(apiData.length, 'auctions parsed into', results.length, 'prices');
    expect(results).to.have.length(16088);
  });
});

export {};