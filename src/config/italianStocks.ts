import { ItalianStock } from '@/types/stock';

export const ITALIAN_STOCKS: ItalianStock[] = [
  // FTSE MIB - Blue Chips
  { symbol: 'ENI.MI', name: 'Eni S.p.A.', sector: 'Energy', index: 'FTSE MIB' },
  { symbol: 'ENEL.MI', name: 'Enel S.p.A.', sector: 'Utilities', index: 'FTSE MIB' },
  { symbol: 'ISP.MI', name: 'Intesa Sanpaolo', sector: 'Banking', index: 'FTSE MIB' },
  { symbol: 'UCG.MI', name: 'UniCredit', sector: 'Banking', index: 'FTSE MIB' },
  { symbol: 'RACE.MI', name: 'Ferrari N.V.', sector: 'Automotive', index: 'FTSE MIB' },
  { symbol: 'TIT.MI', name: 'Telecom Italia', sector: 'Telecommunications', index: 'FTSE MIB' },
  { symbol: 'STM.MI', name: 'STMicroelectronics', sector: 'Technology', index: 'FTSE MIB' },
  { symbol: 'G.MI', name: 'Generali', sector: 'Insurance', index: 'FTSE MIB' },
  { symbol: 'LDO.MI', name: 'Leonardo S.p.A.', sector: 'Aerospace & Defense', index: 'FTSE MIB' },
  { symbol: 'STLA.MI', name: 'Stellantis N.V.', sector: 'Automotive', index: 'FTSE MIB' },
  { symbol: 'A2A.MI', name: 'A2A S.p.A.', sector: 'Utilities', index: 'FTSE MIB' },
  { symbol: 'AZM.MI', name: 'Azimut Holding', sector: 'Financial Services', index: 'FTSE MIB' },
  { symbol: 'BAMI.MI', name: 'Banco BPM', sector: 'Banking', index: 'FTSE MIB' },
  { symbol: 'BGN.MI', name: 'Banca Generali', sector: 'Banking', index: 'FTSE MIB' },
  { symbol: 'BMED.MI', name: 'Banca Mediolanum', sector: 'Banking', index: 'FTSE MIB' },
  { symbol: 'BMPS.MI', name: 'Banca Monte dei Paschi', sector: 'Banking', index: 'FTSE MIB' },
  { symbol: 'BPER.MI', name: 'BPER Banca', sector: 'Banking', index: 'FTSE MIB' },
  { symbol: 'CPR.MI', name: 'Campari Group', sector: 'Beverages', index: 'FTSE MIB' },
  { symbol: 'DIA.MI', name: 'DiaSorin', sector: 'Healthcare', index: 'FTSE MIB' },
  { symbol: 'HER.MI', name: 'Hera S.p.A.', sector: 'Utilities', index: 'FTSE MIB' },
  { symbol: 'INW.MI', name: 'Inwit S.p.A.', sector: 'Telecommunications', index: 'FTSE MIB' },
  { symbol: 'IREN.MI', name: 'Iren S.p.A.', sector: 'Utilities', index: 'FTSE MIB' },
  { symbol: 'MONC.MI', name: 'Moncler S.p.A.', sector: 'Luxury Goods', index: 'FTSE MIB' },
  { symbol: 'PIRC.MI', name: 'Pirelli & C. S.p.A.', sector: 'Automotive', index: 'FTSE MIB' },
  { symbol: 'PRY.MI', name: 'Prysmian S.p.A.', sector: 'Industrial', index: 'FTSE MIB' },
  { symbol: 'PST.MI', name: 'Poste Italiane', sector: 'Financial Services', index: 'FTSE MIB' },
  { symbol: 'SFER.MI', name: 'Salvatore Ferragamo', sector: 'Luxury Goods', index: 'FTSE MIB' },
  { symbol: 'SRG.MI', name: 'Snam S.p.A.', sector: 'Utilities', index: 'FTSE MIB' },
  { symbol: 'TEN.MI', name: 'Tenaris S.A.', sector: 'Industrial', index: 'FTSE MIB' },
  { symbol: 'TRN.MI', name: 'Terna S.p.A.', sector: 'Utilities', index: 'FTSE MIB' },
];

export const getStockBySymbol = (symbol: string): ItalianStock | undefined => {
  return ITALIAN_STOCKS.find(stock => stock.symbol === symbol);
};

export const getStocksBySector = (sector: string): ItalianStock[] => {
  return ITALIAN_STOCKS.filter(stock => stock.sector === sector);
};

export const getAllSectors = (): string[] => {
  return Array.from(new Set(ITALIAN_STOCKS.map(stock => stock.sector)));
};
