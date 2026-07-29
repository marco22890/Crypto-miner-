import React, { useState } from 'react';
import { Server, Plus, Trash2, Edit2, Wifi, CheckCircle2, ShieldAlert, RefreshCw, ArrowUp, ArrowDown, Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { AlgorithmType, StratumPool } from '../types';
import { ALGORITHM_DETAILS } from '../services/market';
import { fetchHashVaultMinerStats, HashVaultMinerStats } from '../services/hashvault';

interface PoolManagerProps {
  pools: StratumPool[];
  activePoolId: string;
  selectedAlgo: AlgorithmType;
  onSelectPool: (poolId: string) => void;
  onAddPool: (pool: Omit<StratumPool, 'id' | 'status' | 'sharesAccepted' | 'sharesRejected' | 'sharesStale' | 'pingMs'>) => void;
  onUpdatePool: (id: string, updates: Partial<StratumPool>) => void;
  onRemovePool: (poolId: string) => void;
  onReorderPriority: (id: string, direction: 'up' | 'down') => void;
  onTestPing: (poolId: string) => void;
  onSimulateFailover: () => void;
  autoFailover: boolean;
  onToggleAutoFailover: () => void;
  autoFailback: boolean;
  onToggleAutoFailback: () => void;
}

export const PoolManager: React.FC<PoolManagerProps> = ({
  pools,
  activePoolId,
  selectedAlgo,
  onSelectPool,
  onAddPool,
  onUpdatePool,
  onRemovePool,
  onReorderPriority,
  onTestPing,
  onSimulateFailover,
  autoFailover,
  onToggleAutoFailover,
  autoFailback,
  onToggleAutoFailback
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPool, setEditingPool] = useState<StratumPool | null>(null);

  const [lookupWallet, setLookupWallet] = useState('88CFR7niUMiYxZYhz52BaidajVgN3GCeQCWBAR6rrbJ5ZPp68PgkcRJJrCirVs9FmVaRudeVqroHfTmiWQ3WFsom3fSreJ6');
  const [lookupStats, setLookupStats] = useState<HashVaultMinerStats | null>(null);
  const [isCheckingPool, setIsCheckingPool] = useState(false);
  const [showDiagnosticsGuide, setShowDiagnosticsGuide] = useState(true);

  const handleCheckHashVault = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsCheckingPool(true);
    const stats = await fetchHashVaultMinerStats(lookupWallet);
    setLookupStats(stats);
    setIsCheckingPool(false);
  };

  const [newPool, setNewPool] = useState({
    name: '',
    algo: selectedAlgo,
    url: 'stratum+tcp://stratum.example.com',
    port: 3333,
    workerName: 'miner.worker1',
    password: 'x',
    priority: 1,
    currentDifficulty: 32,
    stratumVersion: 'v2' as 'v1' | 'v2',
    noisePublicKey: '0x9f32e482ba1048e9231a4f00921c818a721b01'
  });

  const filteredPools = pools
    .filter(p => p.algo === selectedAlgo)
    .sort((a, b) => a.priority - b.priority);

  const activePool = pools.find(p => p.id === activePoolId);

  const handleSubmitNewPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPool.name || !newPool.url) return;
    onAddPool({
      ...newPool,
      algo: selectedAlgo,
      priority: filteredPools.length + 1
    });
    setShowAddModal(false);
    setNewPool({
      name: '',
      algo: selectedAlgo,
      url: 'stratum+tcp://stratum.example.com',
      port: 3333,
      workerName: 'miner.worker1',
      password: 'x',
      priority: 1,
      currentDifficulty: 32
    });
  };

  const handleSaveEditPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPool) return;
    onUpdatePool(editingPool.id, {
      name: editingPool.name,
      url: editingPool.url,
      port: editingPool.port,
      workerName: editingPool.workerName,
      password: editingPool.password,
      priority: editingPool.priority,
      currentDifficulty: editingPool.currentDifficulty
    });
    setEditingPool(null);
  };

  return (
    <div id="pool-management-view" className="space-y-6">
      
      {/* Pool Header & Failover Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Stratum Pool Manager ({ALGORITHM_DETAILS[selectedAlgo].coinSymbol})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure primary & backup pools for seamless zero-downtime failover routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Failover Controls */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">Auto-Failover</span>
            <button
              id="btn-toggle-failover"
              onClick={onToggleAutoFailover}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoFailover ? 'bg-cyan-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoFailover ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">Auto-Failback</span>
            <button
              id="btn-toggle-failback"
              onClick={onToggleAutoFailback}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoFailback ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoFailback ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            id="btn-simulate-failover"
            onClick={onSimulateFailover}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600/90 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-950/50 transition-all"
            title="Simulate network disconnect on primary pool to test automated failover"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Test Failover</span>
          </button>

          <button
            id="btn-open-add-pool"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pool</span>
          </button>
        </div>
      </div>

      {/* Priority Chain Visualizer Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Stratum Priority Routing Sequence ({ALGORITHM_DETAILS[selectedAlgo].coinSymbol})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Active: <strong className="text-emerald-400">{activePool?.name || 'None'}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {filteredPools.map((p, idx) => {
            const isActive = p.id === activePoolId;
            return (
              <React.Fragment key={p.id}>
                {idx > 0 && <span className="text-slate-600 font-bold">➔</span>}
                <div
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    p.priority === 1 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-400'
                  }`}>
                    #{p.priority}
                  </span>
                  <span className="font-sans font-semibold text-white">{p.name}</span>
                  {isActive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Pools Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Active</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Pool Name</th>
                <th className="py-3.5 px-4">Protocol</th>
                <th className="py-3.5 px-4">Stratum Endpoint</th>
                <th className="py-3.5 px-4">Worker / Pass</th>
                <th className="py-3.5 px-4">Ping</th>
                <th className="py-3.5 px-4">Shares Accepted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredPools.map((pool, index) => {
                const isActive = pool.id === activePoolId;
                const isSv2 = pool.stratumVersion === 'v2';
                return (
                  <tr key={pool.id} className={`hover:bg-slate-800/40 transition-colors ${isActive ? 'bg-cyan-950/30' : ''}`}>
                    {/* Active toggle button */}
                    <td className="py-3.5 px-4">
                      <button
                        id={`btn-select-pool-${pool.id}`}
                        onClick={() => onSelectPool(pool.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isActive
                            ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
                        }`}
                        title={isActive ? 'Currently Active Pool' : 'Set as Active Pool'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Priority & Reorder Controls */}
                    <td className="py-3.5 px-4 font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          pool.priority === 1 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          #{pool.priority} {pool.priority === 1 ? '(Primary)' : '(Backup)'}
                        </span>
                        <div className="flex flex-col space-y-0.5">
                          <button
                            onClick={() => onReorderPriority(pool.id, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-slate-500 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-500"
                            title="Move Up Priority"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onReorderPriority(pool.id, 'down')}
                            disabled={index === filteredPools.length - 1}
                            className="p-0.5 text-slate-500 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-500"
                            title="Move Down Priority"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Pool Name & Status */}
                    <td className="py-3.5 px-4 font-sans font-bold text-white">
                      <div className="flex items-center space-x-2">
                        <span>{pool.name}</span>
                        {isActive && (
                          <span className="text-[10px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700">
                            ACTIVE
                          </span>
                        )}
                        {pool.status === 'error' && (
                          <span className="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded border border-rose-800">
                            OFFLINE / FAILOVER
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Protocol Version */}
                    <td className="py-3.5 px-4 font-sans font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          isSv2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isSv2 && <Zap className="w-3 h-3 text-emerald-400" />}
                          <span>{isSv2 ? 'STRATUM V2' : 'STRATUM V1'}</span>
                        </span>
                        {isSv2 && pool.channelId && (
                          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded">
                            CH #{pool.channelId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stratum URL */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {pool.url}:{pool.port}
                    </td>

                    {/* Worker Credentials */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="text-white">{pool.workerName}</div>
                      <div className="text-[10px] text-slate-500">pass: {pool.password}</div>
                    </td>

                    {/* Ping */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onTestPing(pool.id)}
                        className="flex items-center space-x-1 hover:text-cyan-400 text-slate-400"
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        <span>{pool.pingMs ? `${pool.pingMs}ms` : 'Ping'}</span>
                      </button>
                    </td>

                    {/* Accepted Shares */}
                    <td className="py-3.5 px-4">
                      <div className="text-emerald-400 font-bold">{pool.sharesAccepted} Acc</div>
                      <div className="text-slate-500 text-[10px]">{pool.sharesRejected} Rej</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setEditingPool({ ...pool })}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Edit Pool Config"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemovePool(pool.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Delete Pool"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Why Won't My Miner Show Up On The Pool? Diagnostic & Live Pool API Inspector */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Pool Connection Diagnostics & HashVault API Inspector</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Troubleshoot why a browser miner isn't showing up on public pool dashboards & test live HashVault API stats.
            </p>
          </div>

          <button
            onClick={() => setShowDiagnosticsGuide(!showDiagnosticsGuide)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
          >
            {showDiagnosticsGuide ? 'Hide Diagnostic Steps' : 'Show Diagnostic Steps'}
          </button>
        </div>

        {/* Live Pool API Query Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isCheckingPool ? 'animate-spin' : ''}`} />
              Live HashVault Pool API Lookup (Monero XMR)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">api.hashvault.pro/v1/monero/miner/...</span>
          </div>

          <form onSubmit={handleCheckHashVault} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={lookupWallet}
              onChange={(e) => setLookupWallet(e.target.value)}
              placeholder="Enter 95-character Monero XMR Wallet Address..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isCheckingPool}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isCheckingPool ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Pool API...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Check Live Pool Stats</span>
                </>
              )}
            </button>
          </form>

          {/* Results display */}
          {lookupStats && (
            <div className="pt-3 border-t border-slate-900 space-y-3 text-xs">
              {lookupStats.error ? (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Pool Status: Not Found / Not Registered Yet</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{lookupStats.error}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">POOL HASHRATE</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {(lookupStats.hashRate / 1000).toFixed(2)} KH/s
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">ACTIVE WORKERS</span>
                      <span className="text-sm font-bold text-cyan-400 font-mono">
                        {lookupStats.workersCount} worker(s)
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">VALID SHARES</span>
                      <span className="text-sm font-bold text-purple-400 font-mono">
                        {lookupStats.validShares}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">UNPAID BALANCE</span>
                      <span className="text-sm font-bold text-amber-400 font-mono">
                        {lookupStats.amtDue} XMR
                      </span>
                    </div>
                  </div>

                  {lookupStats.workers && lookupStats.workers.length > 0 && (
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-slate-300 block mb-2 text-[11px]">Active Workers List on HashVault:</span>
                      <div className="space-y-1 font-mono text-[11px]">
                        {lookupStats.workers.map((w, i) => (
                          <div key={i} className="flex justify-between text-slate-400 py-1 border-b border-slate-800/50 last:border-none">
                            <span className="text-white font-semibold">{w.name}</span>
                            <span className="text-emerald-400 font-bold">{(w.hashRate / 1000).toFixed(2)} KH/s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4 Reasons Why Miner Won't Show Up On Pool */}
        {showDiagnosticsGuide && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <span className="bg-amber-500/20 text-amber-300 w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-amber-500/40 font-mono">1</span>
                <span>Browser TCP Socket Sandbox Constraint</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Web browsers do <strong>not</strong> support raw TCP sockets (<code className="text-cyan-300">stratum+tcp://pool.hashvault.pro:433</code>). Direct browser calls to TCP ports are blocked by browser iframe security rules. To submit live shares to a real public pool from inside a browser, a <strong>WebSocket Stratum Proxy</strong> (<code className="text-emerald-300">wss://</code>) bridge is required.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-cyan-400">
                <span className="bg-cyan-500/20 text-cyan-300 w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-cyan-500/40 font-mono">2</span>
                <span>Minimum Share Target Difficulty</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Public mining pools like HashVault only register a worker on their web dashboard <strong>after at least 1 valid share</strong> passes the pool target difficulty (e.g. diff = 4,000 to 400,000+). Below this difficulty, local shares are verified locally by the engine worker.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-400">
                <span className="bg-purple-500/20 text-purple-300 w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-purple-500/40 font-mono">3</span>
                <span>Monero Wallet Address Format</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                The pool <strong>Worker Name</strong> must be set to your exact 95-character Monero wallet address (e.g. <code className="text-amber-300">88CFR7ni...3fSreJ6</code>). To specify a rig identifier, append <code className="text-cyan-300">.worker1</code> or <code className="text-cyan-300">+rig1</code> to the wallet string.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <span className="bg-emerald-500/20 text-emerald-300 w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-emerald-500/40 font-mono">4</span>
                <span>WebSocket Proxy Bridge Endpoint</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                In pool settings, configure a WebSocket Stratum Proxy URL (e.g. <code className="text-emerald-300">wss://proxy.hashvault.pro</code> or local bridge <code className="text-cyan-300">ws://localhost:8888</code>). The engine will route real-time Stratum v1 / Stratum v2 binary frames over the WebSocket bridge directly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Pool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Add Custom Stratum Pool
            </h3>

            <form onSubmit={handleSubmitNewPool} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Stratum Protocol</label>
                  <select
                    value={newPool.stratumVersion}
                    onChange={(e) => setNewPool({ ...newPool, stratumVersion: e.target.value as 'v1' | 'v2' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-cyan-500"
                  >
                    <option value="v2">Stratum v2 (Noise/Binary)</option>
                    <option value="v1">Stratum v1 (JSON-RPC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Pool Name</label>
                  <input
                    type="text"
                    required
                    value={newPool.name}
                    onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                    placeholder="e.g. HashVault Sv2 Pool"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Stratum URL</label>
                  <input
                    type="text"
                    required
                    value={newPool.url}
                    onChange={(e) => setNewPool({ ...newPool, url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={newPool.port}
                    onChange={(e) => setNewPool({ ...newPool, port: parseInt(e.target.value) || 3333 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Worker Name</label>
                  <input
                    type="text"
                    required
                    value={newPool.workerName}
                    onChange={(e) => setNewPool({ ...newPool, workerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Password</label>
                  <input
                    type="text"
                    value={newPool.password}
                    onChange={(e) => setNewPool({ ...newPool, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl"
                >
                  Save Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pool Modal */}
      {editingPool && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-cyan-400" />
              Edit Pool Configuration
            </h3>

            <form onSubmit={handleSaveEditPool} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Pool Name</label>
                <input
                  type="text"
                  required
                  value={editingPool.name}
                  onChange={(e) => setEditingPool({ ...editingPool, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Stratum URL</label>
                  <input
                    type="text"
                    required
                    value={editingPool.url}
                    onChange={(e) => setEditingPool({ ...editingPool, url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={editingPool.port}
                    onChange={(e) => setEditingPool({ ...editingPool, port: parseInt(e.target.value) || 3333 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Worker Name</label>
                  <input
                    type="text"
                    required
                    value={editingPool.workerName}
                    onChange={(e) => setEditingPool({ ...editingPool, workerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Password</label>
                  <input
                    type="text"
                    value={editingPool.password}
                    onChange={(e) => setEditingPool({ ...editingPool, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Priority (1 = Highest)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingPool.priority}
                    onChange={(e) => setEditingPool({ ...editingPool, priority: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Difficulty</label>
                  <input
                    type="number"
                    required
                    value={editingPool.currentDifficulty}
                    onChange={(e) => setEditingPool({ ...editingPool, currentDifficulty: parseInt(e.target.value) || 32 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPool(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl"
                >
                  Update Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

