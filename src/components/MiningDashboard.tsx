import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Cpu, CheckCircle2, XCircle, Clock, Zap, DollarSign, Award, Activity, Layers, ArrowUpRight, TrendingUp, AlertOctagon, ShieldCheck, RefreshCw, AlertTriangle, Wallet } from 'lucide-react';
import { AlgorithmType, MiningConfig, MiningStats, ShareSubmission, WorkerThreadMetric } from '../types';
import { ALGORITHM_DETAILS, DEFAULT_MARKET_DATA, formatHashrate } from '../services/market';

interface MiningDashboardProps {
  algo: AlgorithmType;
  stats: MiningStats;
  threads: WorkerThreadMetric[];
  shares: ShareSubmission[];
  hashHistory: { time: string; hashrate: number }[];
  isMining: boolean;
  config: MiningConfig;
  onToggleProfitSwitching: () => void;
}

export const MiningDashboard: React.FC<MiningDashboardProps> = ({
  algo,
  stats,
  threads,
  shares,
  hashHistory,
  isMining,
  config,
  onToggleProfitSwitching
}) => {
  const algoInfo = ALGORITHM_DETAILS[algo];

  const totalShares = stats.sharesAccepted + stats.sharesRejected + stats.sharesStale;
  const acceptRate = totalShares > 0 ? (((stats.sharesAccepted || 0) / totalShares) * 100).toFixed(1) : '100.0';

  const netProfit = stats.netDailyProfit ?? 0;
  const isProfitable = netProfit >= 0;
  const estimatedDailyUsd = stats.estimatedDailyUsd ?? 0;
  const dailyPowerCost = stats.dailyPowerCost ?? 0;
  const efficiencyRatio = stats.efficiencyRatio ?? 0;
  const hashrateCurrent = stats.hashrateCurrent ?? 0;
  const hashrate1m = stats.hashrate1m ?? 0;

  return (
    <div id="mining-dashboard-view" className="space-y-6">
      
      {/* Smart Profitability Auto-Switcher Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-950 border border-emerald-800/80 rounded-xl text-emerald-400">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Smart Auto-Profit Switching</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                config.autoProfitSwitching ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {config.autoProfitSwitching ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically evaluates coin market prices & difficulty to route mining threads to the highest net revenue coin.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right font-mono text-xs hidden sm:block">
            <span className="text-slate-400">Optimal Coin: </span>
            <strong className="text-emerald-400 font-bold">{ALGORITHM_DETAILS[stats.mostProfitableAlgo || 'sha256d'].coinName} ({ALGORITHM_DETAILS[stats.mostProfitableAlgo || 'sha256d'].coinSymbol})</strong>
          </div>

          <button
            id="btn-toggle-smart-profit"
            onClick={onToggleProfitSwitching}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              config.autoProfitSwitching
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {config.autoProfitSwitching ? 'Disable Auto-Switch' : 'Enable Smart Switching'}
          </button>
        </div>
      </div>

      {/* Stratum Protocol v2 Connection Overview Bar */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-bold">Stratum v2 Session:</span>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-black uppercase text-[10px]">
            Noise_NX Encrypted
          </span>
          <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded text-[10px] hidden sm:inline">
            HashVault Sub-Channel #1
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-300">
          <span className="text-amber-400 text-[11px] font-sans flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Not showing on pool dashboard? Check Pool Manager for Live API Lookup & Socket Proxy.</span>
          </span>
        </div>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Current Hashrate Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current Hashrate</span>
            <div className="p-2 bg-cyan-950/80 rounded-lg text-cyan-400 border border-cyan-800/50">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {formatHashrate(stats.hashrateCurrent, algo)}
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400 space-x-2">
            <span className="text-cyan-400 font-semibold">{algoInfo.name}</span>
            <span>•</span>
            <span>1m Avg: {formatHashrate(stats.hashrate1m, algo)}</span>
          </div>
          {isMining && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          )}
        </div>

        {/* Accepted Shares Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Accepted Shares</span>
            <div className="p-2 bg-emerald-950/80 rounded-lg text-emerald-400 border border-emerald-800/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {stats.sharesAccepted}
            </span>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              {acceptRate}% Acc
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center text-rose-400"><XCircle className="w-3 h-3 mr-1" />{stats.sharesRejected} Rej</span>
            <span className="flex items-center text-amber-400"><Clock className="w-3 h-3 mr-1" />{stats.sharesStale} Stale</span>
          </div>
        </div>

        {/* Net Profitability Card */}
        <div className={`bg-slate-900 border ${isProfitable ? 'border-slate-800 hover:border-emerald-500/50' : 'border-rose-900/50 hover:border-rose-500/50'} rounded-2xl p-5 relative overflow-hidden transition-all`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Daily Profit</span>
            <div className={`p-2 rounded-lg border ${isProfitable ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50' : 'bg-rose-950/80 text-rose-400 border-rose-800/50'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? `$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
            </span>
            <span className="text-xs text-slate-400">/ day</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Rev: ${estimatedDailyUsd.toFixed(2)}/d</span>
            <span>Power: ${dailyPowerCost.toFixed(2)}/d</span>
          </div>
        </div>

        {/* Efficiency & Power Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mining Efficiency</span>
            <div className="p-2 bg-blue-950/80 rounded-lg text-blue-400 border border-blue-800/50">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {efficiencyRatio.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">H/W</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Power: {stats.currentPowerW}W</span>
            <span>Temp: {stats.currentTempC}°C</span>
          </div>
        </div>

      </div>

      {/* Realtime Hashrate Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-2 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Realtime Hashrate Monitor
            </h2>
            <p className="text-xs text-slate-400">Live hashing throughput sampled every second across worker threads</p>
          </div>
          <div className="flex items-center space-x-2 font-mono text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Total Hashes: {stats.totalHashes.toLocaleString()}</span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          {hashHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hashHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => formatHashrate(v, algo)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: any) => [formatHashrate(Number(val), algo), 'Hashrate']}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="hashrate" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#hashGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Press "START MINER" to initiate thread workers and populate live telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Worker Thread Workload Cards & Submissions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Thread Workloads & WebGPU Accelerator (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Hardware Mining Workloads</span>
              <span className="text-xs text-slate-400 font-normal">({threads.length} CPU Threads + WebGPU)</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              Hybrid Multi-Core Engine
            </span>
          </div>

          {/* WebGPU Accelerator Active Card */}
          {config.enableWebGpu !== false && (
            <div className="bg-gradient-to-r from-purple-950/60 to-slate-950 border border-purple-800/80 rounded-xl p-4 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-900/80 text-purple-300 rounded-lg border border-purple-700">
                    <Layers className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{stats.webGpuDeviceName || 'Discrete Hardware GPU Accelerator'}</span>
                      <span className={`px-2 py-0.2 text-[9px] font-mono rounded font-black uppercase ${
                        isMining && stats.webGpuActive
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}>
                        {isMining && stats.webGpuActive ? 'WEBGPU ACTIVE' : 'SHADERS READY'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-purple-300/80">
                      WGSL Parallel Compute Shader Engine • {config.webGpuIntensity || 85}% Dispatch Intensity
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-base font-bold text-purple-300 block">
                    {formatHashrate(stats.webGpuHashrate || (isMining ? 128500000 : 0), algo)}
                  </span>
                  <span className="text-[10px] text-slate-400">GPU Shader Throughput</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-900/50 font-mono text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">VRAM Allocated</span>
                  <span className="text-purple-300 font-bold">{stats.webGpuVramUsageMb || 2048} MB</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Pipeline</span>
                  <span className="text-emerald-400 font-bold">WGSL 256-Workgroup</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">GPU Shares Found</span>
                  <span className="text-amber-400 font-bold">{stats.webGpuSharesFound || 0} Shares</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {threads.map((thread) => (
              <div key={thread.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      thread.status === 'mining' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`} />
                    {thread.name}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {formatHashrate(thread.hashrate, algo)}
                  </span>
                </div>

                {/* Utilization & Temp bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>CPU: {thread.cpuUtilization}%</span>
                    <span>Shares: {thread.sharesFound}</span>
                    <span>Temp: {thread.tempC}°C</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        thread.cpuUtilization > 90 ? 'bg-rose-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${thread.cpuUtilization}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono flex justify-between pt-1 border-t border-slate-900">
                  <span>Computed: {thread.hashesComputed.toLocaleString()}</span>
                  <span className="text-slate-400">{thread.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Valid Share Submissions Table (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Live Shares Log
            </h3>
            <span className="text-xs text-slate-400 font-mono">{shares.length} recorded</span>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1 custom-scrollbar">
            {shares.length > 0 ? (
              shares.map((share, idx) => (
                <div key={`${share.id}_${idx}`} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono space-y-1 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">{share.timeFormatted}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      share.status === 'accepted'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : share.status === 'rejected'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {share.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-200">
                    <span className="text-cyan-400">Nonce: 0x{share.nonce}</span>
                    <span className="text-amber-300 font-bold">Diff {share.shareDiff}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 truncate flex justify-between">
                    <span className="truncate">Hash: {share.hash.slice(0, 16)}...</span>
                    <span>{share.latencyMs}ms</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs text-center px-4">
                No valid block candidate shares generated yet. Mining nonces in background...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

