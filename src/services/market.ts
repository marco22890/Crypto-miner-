/**
 * Market Data & Mining Calculator Service
 */

import { AlgorithmDetails, AlgorithmType, CoinMarketData } from '../types';

export const ALGORITHM_DETAILS: Record<AlgorithmType, AlgorithmDetails> = {
  sha256d: {
    id: 'sha256d',
    name: 'SHA-256d (Double SHA-256)',
    coinSymbol: 'BTC',
    coinName: 'Bitcoin',
    description: 'Double SHA-256 hashing. Used by Bitcoin, Bitcoin Cash, and Namecoin.',
    unit: 'TH/s',
    defaultDifficulty: 64,
    headerSize: 80,
    typicalDeviceHashrate: {
      'Browser WebWorker (8 Threads)': '1.85 MH/s',
      'High-End Desktop CPU (16 Cores)': '8.20 MH/s',
      'Antminer S19 Pro (ASIC)': '110.00 TH/s'
    }
  },
  xmr: {
    id: 'xmr',
    name: 'RandomX (Monero Proof-of-Work)',
    coinSymbol: 'XMR',
    coinName: 'Monero',
    description: 'ASIC-resistant CPU-optimized memory-hard algorithm tailored for general CPUs.',
    unit: 'KH/s',
    defaultDifficulty: 4,
    headerSize: 76,
    typicalDeviceHashrate: {
      'Browser WebWorker (8 Threads)': '2.40 KH/s',
      'AMD Ryzen 9 7950X (16 Cores)': '23.50 KH/s',
      'Intel Core i9-14900K': '14.20 KH/s'
    }
  }
};

export const DEFAULT_MARKET_DATA: Record<AlgorithmType, CoinMarketData> = {
  sha256d: {
    symbol: 'BTC',
    name: 'Bitcoin',
    priceUsd: 94850,
    change24h: 2.45,
    networkDifficulty: 82500000000000,
    networkHashrate: '620.5 EH/s',
    blockReward: 3.125
  },
  xmr: {
    symbol: 'XMR',
    name: 'Monero',
    priceUsd: 158.40,
    change24h: 1.85,
    networkDifficulty: 345000000000,
    networkHashrate: '2.85 GH/s',
    blockReward: 0.65
  }
};

export function calculateEarnings(
  algo: AlgorithmType,
  hashrateHs: number, // raw H/s
  powerW: number,
  electricityCostKwh: number
) {
  const market = DEFAULT_MARKET_DATA[algo] || DEFAULT_MARKET_DATA['sha256d'];
  const safeHash = typeof hashrateHs === 'number' && !isNaN(hashrateHs) ? hashrateHs : 0;
  const safePower = typeof powerW === 'number' && !isNaN(powerW) ? powerW : 0;
  const safeCost = typeof electricityCostKwh === 'number' && !isNaN(electricityCostKwh) ? electricityCostKwh : 0;

  if (!safeHash || safeHash <= 0) {
    return { dailyCoins: 0, dailyUsd: 0, dailyPowerCost: 0, dailyNetProfit: 0, profitMarginPct: 0 };
  }

  // Simplified normalized block estimation
  let dailyCoinsMultiplier = 0;
  if (algo === 'sha256d') {
    // scale for simulated browser display
    dailyCoinsMultiplier = (safeHash / 1000000) * 0.00000015;
  } else {
    // xmr
    dailyCoinsMultiplier = (safeHash / 1000) * 0.0018;
  }

  const dailyCoins = parseFloat((dailyCoinsMultiplier).toFixed(6));
  const dailyUsd = parseFloat((dailyCoins * market.priceUsd).toFixed(2));
  const dailyPowerCost = parseFloat(((safePower * 24 / 1000) * safeCost).toFixed(2));
  const dailyNetProfit = parseFloat((dailyUsd - dailyPowerCost).toFixed(2));
  const profitMarginPct = dailyUsd > 0 ? parseFloat(((dailyNetProfit / dailyUsd) * 100).toFixed(1)) : 0;

  return { dailyCoins, dailyUsd, dailyPowerCost, dailyNetProfit, profitMarginPct };
}


export function formatHashrate(hashrateHs: number | undefined | null, algo?: AlgorithmType): string {
  const val = typeof hashrateHs === 'number' && !isNaN(hashrateHs) ? hashrateHs : 0;
  if (val >= 1000000000000) return `${(val / 1000000000000).toFixed(2)} TH/s`;
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)} GH/s`;
  if (val >= 1000000) return `${(val / 1000000).toFixed(2)} MH/s`;
  if (val >= 1000) return `${(val / 1000).toFixed(2)} KH/s`;
  return `${val.toFixed(1)} H/s`;
}
