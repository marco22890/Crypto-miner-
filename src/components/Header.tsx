import React from 'react';
import { Play, Square, Cpu, Zap, Server, ShieldAlert, Activity, Wallet, CheckCircle2, Smartphone } from 'lucide-react';
import { AlgorithmType, StratumPool } from '../types';
import { ALGORITHM_DETAILS, formatHashrate } from '../services/market';

interface HeaderProps {
  isMining: boolean;
  onToggleMining: () => void;
  selectedAlgo: AlgorithmType;
  onSelectAlgo: (algo: AlgorithmType) => void;
  activePool?: StratumPool;
  currentHashrate: number;
  activeThreads: number;
  powerW: number;
  tempC: number;
  onOpenWalletModal: () => void;
  connectedWalletsCount: number;
  primaryAddress?: string;
  onOpenApkModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMining,
  onToggleMining,
  selectedAlgo,
  onSelectAlgo,
  activePool,
  currentHashrate,
  activeThreads,
  powerW,
  tempC,
  onOpenWalletModal,
  connectedWalletsCount,
  primaryAddress,
  onOpenApkModal
}) => {
  return (
    <header id="app-header" className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                CryptoMiner Core
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Algo Engine (SHA256d • RandomX)</p>
          </div>
        </div>

        {/* Algo Selector & Live Stats Pill */}
        <div className="flex items-center space-x-3 flex-wrap">
          {/* Algorithm Picker */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            {(['sha256d', 'xmr'] as AlgorithmType[]).map((algo) => {
              const info = ALGORITHM_DETAILS[algo];
              const isActive = selectedAlgo === algo;
              return (
                <button
                  key={algo}
                  id={`btn-algo-${algo}`}
                  disabled={isMining}
                  onClick={() => onSelectAlgo(algo)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  } ${isMining ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {info.coinSymbol} <span className="hidden sm:inline">({algo.toUpperCase()})</span>
                </button>
              );
            })}
          </div>

          {/* Pool Status Badge */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[140px] font-mono text-slate-200">
              {activePool ? activePool.name : 'No Pool'}
            </span>
            <span className={`w-2 h-2 rounded-full ${
              activePool?.status === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
            }`} />
          </div>

          {/* Quick Realtime Hardware Badges */}
          <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            <div className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{powerW}W</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>{tempC}°C</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1 text-cyan-400 font-bold">
              <span>{formatHashrate(currentHashrate, selectedAlgo)}</span>
            </div>
          </div>
        </div>

        {/* Wallet & Android APK & Start/Stop Controls */}
        <div className="flex items-center space-x-2">
          {/* Android APK Suite Button */}
          <button
            id="btn-android-apk"
            onClick={onOpenApkModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-800/80 rounded-xl text-xs font-semibold transition-all shadow-md group"
            title="Android APK & Stratum TCP Mobile Suite"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-[11px] font-bold hidden sm:inline">Android APK</span>
          </button>

          {/* Web3 Wallet Button */}
          <button
            id="btn-wallet-manager"
            onClick={onOpenWalletModal}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700/90 text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-md group"
          >
            <div className="p-1 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-lg group-hover:border-cyan-400 transition-colors">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-mono text-[11px] font-bold leading-none text-slate-200">
                {primaryAddress ? `${primaryAddress.slice(0, 6)}...${primaryAddress.slice(-4)}` : 'Connect Wallet'}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {connectedWalletsCount > 0 ? `${connectedWalletsCount} Wallet(s)` : 'Rewards Target'}
              </span>
            </div>
          </button>

          {/* Start/Stop Mining Main Control Button */}
          <button
            id="btn-toggle-mining"
            onClick={onToggleMining}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg transform active:scale-95 ${
              isMining
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 ring-2 ring-rose-500/50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-950/50 ring-2 ring-emerald-400/30'
            }`}
          >
            {isMining ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>STOP MINER</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>START MINER</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};

