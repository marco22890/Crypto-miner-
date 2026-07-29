import React, { useState } from 'react';
import { Calculator, DollarSign, Zap, Coins, TrendingUp } from 'lucide-react';
import { AlgorithmType } from '../types';
import { ALGORITHM_DETAILS, DEFAULT_MARKET_DATA } from '../services/market';

export const MiningCalculator: React.FC = () => {
  const [algo, setAlgo] = useState<AlgorithmType>('sha256d');
  const [inputHashrate, setInputHashrate] = useState<number>(2.5);
  const [unit, setUnit] = useState<'H/s' | 'KH/s' | 'MH/s' | 'GH/s' | 'TH/s'>('MH/s');
  const [powerW, setPowerW] = useState<number>(120);
  const [costKwh, setCostKwh] = useState<number>(0.12);

  const getRawHashrate = (): number => {
    switch (unit) {
      case 'TH/s': return inputHashrate * 1000000000000;
      case 'GH/s': return inputHashrate * 1000000000;
      case 'MH/s': return inputHashrate * 1000000;
      case 'KH/s': return inputHashrate * 1000;
      default: return inputHashrate;
    }
  };

  const rawHs = getRawHashrate();
  const market = DEFAULT_MARKET_DATA[algo];

  // Base daily coin conversion
  let dailyCoinsMultiplier = 0;
  if (algo === 'sha256d') dailyCoinsMultiplier = (rawHs / 1000000) * 0.00000015;
  else dailyCoinsMultiplier = (rawHs / 1000) * 0.0018;

  const dailyCoins = dailyCoinsMultiplier;
  const dailyGrossUsd = dailyCoins * market.priceUsd;
  const dailyPowerUsd = (powerW * 24 / 1000) * costKwh;
  const dailyNetUsd = dailyGrossUsd - dailyPowerUsd;

  const periods = [
    { name: 'Hourly', mult: 1 / 24 },
    { name: 'Daily', mult: 1 },
    { name: 'Weekly', mult: 7 },
    { name: 'Monthly (30d)', mult: 30 },
    { name: 'Annually (365d)', mult: 365 }
  ];

  return (
    <div id="mining-calculator-view" className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-400" />
          Cryptocurrency Mining Profitability Calculator
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Project expected crypto rewards, power expenditure, and net revenue based on network difficulty and electricity rates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Parameters Form (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Calculator Parameters
          </h3>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Algorithm / Coin</label>
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value as AlgorithmType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="sha256d">SHA-256d (Bitcoin - BTC)</option>
              <option value="xmr">RandomX (Monero - XMR)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Estimated Hashrate</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={inputHashrate}
                onChange={(e) => setInputHashrate(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="H/s">H/s</option>
                <option value="KH/s">KH/s</option>
                <option value="MH/s">MH/s</option>
                <option value="GH/s">GH/s</option>
                <option value="TH/s">TH/s</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Power Consumption (Watts)</label>
            <input
              type="number"
              value={powerW}
              onChange={(e) => setPowerW(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Electricity Cost ($ / kWh)</label>
            <input
              type="number"
              step="0.01"
              value={costKwh}
              onChange={(e) => setCostKwh(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Market Price:</span>
              <span className="text-white">${market.priceUsd.toLocaleString()} / {market.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span>Network Diff:</span>
              <span className="text-white">{market.networkDifficulty.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Projected Returns Table (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Projected Mining Revenue & Electricity Net Income
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Period</th>
                    <th className="py-3 px-3">Coins ({market.symbol})</th>
                    <th className="py-3 px-3">Gross Revenue</th>
                    <th className="py-3 px-3">Electricity Cost</th>
                    <th className="py-3 px-3 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {periods.map((p) => {
                    const coins = (dailyCoins * p.mult).toFixed(6);
                    const gross = (dailyGrossUsd * p.mult).toFixed(2);
                    const cost = (dailyPowerUsd * p.mult).toFixed(2);
                    const net = (dailyNetUsd * p.mult).toFixed(2);
                    const isNetPositive = Number(net) >= 0;

                    return (
                      <tr key={p.name} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-200">{p.name}</td>
                        <td className="py-3 px-3 text-cyan-400">{coins}</td>
                        <td className="py-3 px-3 text-slate-200">${gross}</td>
                        <td className="py-3 px-3 text-rose-400">-${cost}</td>
                        <td className={`py-3 px-3 text-right font-bold ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${net}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Estimated Annual ROI Payback (Net Profit):</span>
            <span className="text-emerald-400 font-bold text-sm">
              ${(dailyNetUsd * 365).toFixed(2)} / year
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
