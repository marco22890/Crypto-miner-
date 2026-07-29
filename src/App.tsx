import React, { useState, useEffect, useRef } from 'react';
import { Activity, Server, Terminal, Settings, Calculator, Cpu } from 'lucide-react';
import { Header } from './components/Header';
import { MiningDashboard } from './components/MiningDashboard';
import { PoolManager } from './components/PoolManager';
import { StratumConsole } from './components/StratumConsole';
import { AlgorithmSettings } from './components/AlgorithmSettings';
import { MiningCalculator } from './components/MiningCalculator';
import { WalletManagerModal } from './components/WalletManagerModal';
import { AndroidApkExportModal } from './components/AndroidApkExportModal';
import { MiningWorkerManager } from './core/workerManager';
import { StratumEngine } from './core/stratumEngine';
import { AlgorithmType, MiningConfig, MiningStats, ShareSubmission, StratumLog, StratumPool } from './types';
import { ALGORITHM_DETAILS, calculateEarnings } from './services/market';
import { ConnectedWallet, DEFAULT_PAYOUT_CONFIG, INITIAL_PAYOUT_HISTORY, PayoutDistributionConfig, PayoutHistoryEntry } from './services/walletService';

type TabType = 'dashboard' | 'pools' | 'stratum' | 'settings' | 'calculator';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMining, setIsMining] = useState(false);
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('sha256d');
  const [autoFailover, setAutoFailover] = useState(true);
  const [autoFailback, setAutoFailback] = useState(true);

  // Wallet & Reward Distribution State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([
    {
      id: 'w_xmr_default',
      provider: 'monero_native',
      address: DEFAULT_PAYOUT_CONFIG.xmrPayoutAddress,
      chainName: 'Monero Native CryptoNet',
      symbol: 'XMR',
      balance: 1.45020,
      balanceFormatted: '1.4502 XMR',
      isConnected: true,
      connectedAt: '12:00 PM',
      payoutForCoins: ['XMR']
    },
    {
      id: 'w_btc_default',
      provider: 'metamask',
      address: DEFAULT_PAYOUT_CONFIG.btcPayoutAddress,
      chainName: 'Bitcoin Native Vault',
      symbol: 'BTC',
      balance: 0.00482,
      balanceFormatted: '0.0048 BTC',
      isConnected: true,
      connectedAt: '12:05 PM',
      payoutForCoins: ['BTC']
    }
  ]);
  const [payoutConfig, setPayoutConfig] = useState<PayoutDistributionConfig>(DEFAULT_PAYOUT_CONFIG);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryEntry[]>(INITIAL_PAYOUT_HISTORY);

  // Config State
  const [config, setConfig] = useState<MiningConfig>({
    algo: 'sha256d',
    threads: Math.min(8, navigator.hardwareConcurrency || 4),
    intensity: 100,
    powerWattage: 110,
    targetTempC: 78,
    electricityCostKwh: 0.12,
    selectedPoolId: 'slushpool_sha256',
    autoFailover: true,
    autoFailback: true,
    autoProfitSwitching: false,
    profitSafeguard: false,
    turboMode: false,
    miningMode: 'pool',
    soloWalletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    benchmarkMode: false,
    stratumProtocolMode: 'simulator',
    stratumVersionMode: 'auto',
    enableNoiseEncryption: true,
    enableCustomJobTemplates: false,
    enableWebGpu: true,
    webGpuIntensity: 85
  });


  // Engines
  const workerManagerRef = useRef<MiningWorkerManager | null>(null);
  const stratumEngineRef = useRef<StratumEngine | null>(null);

  // State
  const [pools, setPools] = useState<StratumPool[]>([]);
  const [stratumLogs, setStratumLogs] = useState<StratumLog[]>([]);
  const [shares, setShares] = useState<ShareSubmission[]>([]);
  const [hashHistory, setHashHistory] = useState<{ time: string; hashrate: number }[]>([]);

  // Stats
  const [stats, setStats] = useState<MiningStats>({
    hashrateCurrent: 0,
    hashrate1m: 0,
    hashrate5m: 0,
    totalHashes: 0,
    sharesAccepted: 0,
    sharesRejected: 0,
    sharesStale: 0,
    blocksFound: 0,
    uptimeSeconds: 0,
    currentTempC: 45,
    currentPowerW: 35,
    efficiencyRatio: 0,
    estimatedDailyCoins: 0,
    estimatedDailyUsd: 0,
    dailyPowerCost: 0,
    netDailyProfit: 0,
    profitMarginPct: 0,
    mostProfitableAlgo: 'sha256d'
  });

  // Track raw hash deltas
  const hashesAccRef = useRef(0);
  const secondHashesRef = useRef(0);

  // Initialization
  useEffect(() => {
    const wm = new MiningWorkerManager();
    const se = new StratumEngine();

    workerManagerRef.current = wm;
    stratumEngineRef.current = se;

    setPools(se.getPools());
    setStratumLogs(se.getLogs());

    se.setHandlers(
      (newLog) => setStratumLogs((prev) => [newLog, ...prev.slice(0, 199)]),
      (job) => {
        if (wm) wm.updateTargetDifficulty(job.diff);
      },
      (poolId, status) => {
        setPools((prev) => prev.map((p) => (p.id === poolId ? { ...p, status } : p)));
      }
    );

    wm.setCallbacks({
      onProgress: (deltaHashes) => {
        hashesAccRef.current += deltaHashes;
        secondHashesRef.current += deltaHashes;
      },
      onShareFound: async (partialShare) => {
        if (!se) return;

        const isAccepted = await se.submitShare(partialShare);

        const newShare: ShareSubmission = {
          id: `share_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: partialShare.timestamp || Date.now(),
          timeFormatted: new Date().toISOString().split('T')[1].slice(0, 8),
          nonce: partialShare.nonce || '00000000',
          hash: partialShare.hash || '0000000000000000',
          difficulty: partialShare.difficulty || partialShare.targetDiff || 1,
          shareDiff: partialShare.shareDiff || 1,
          status: isAccepted ? 'accepted' : 'rejected',
          latencyMs: Math.floor(18 + Math.random() * 30),
          poolId: se.getActivePool()?.id || 'default',
          poolName: se.getActivePool()?.name || 'Pool',
          algo: selectedAlgo,
          workerId: partialShare.workerId || 0
        };

        setShares((prev) => [newShare, ...prev.slice(0, 49)]);

        setStats((prev) => ({
          ...prev,
          sharesAccepted: isAccepted ? prev.sharesAccepted + 1 : prev.sharesAccepted,
          sharesRejected: !isAccepted ? prev.sharesRejected + 1 : prev.sharesRejected
        }));
      }
    });

    return () => {
      wm.stopMining();
    };
  }, []);

  // Sync Algo change
  const handleSelectAlgo = (algo: AlgorithmType) => {
    setSelectedAlgo(algo);
    setConfig((prev) => ({ ...prev, algo }));
    if (stratumEngineRef.current) {
      const activePool = stratumEngineRef.current.getPools().find((p) => p.algo === algo);
      if (activePool) {
        stratumEngineRef.current.setActivePool(activePool.id);
      }
    }
    if (isMining && workerManagerRef.current && stratumEngineRef.current) {
      const activePool = stratumEngineRef.current.getActivePool();
      const targetDiff = activePool?.currentDifficulty || 32;
      workerManagerRef.current.startMining(
        algo,
        config.threads,
        targetDiff,
        undefined,
        config.enableWebGpu,
        config.webGpuIntensity
      );
    }
  };

  // Toggle Mining
  const handleToggleMining = async () => {
    const wm = workerManagerRef.current;
    const se = stratumEngineRef.current;
    if (!wm || !se) return;

    if (isMining) {
      wm.stopMining();
      setIsMining(false);
      setStats((prev) => ({ ...prev, hashrateCurrent: 0, currentPowerW: 35, currentTempC: 45 }));
    } else {
      await se.connectToActivePool(selectedAlgo);
      const activePool = se.getActivePool();
      const targetDiff = activePool?.currentDifficulty || 32;

      wm.startMining(
        selectedAlgo,
        config.threads,
        targetDiff,
        undefined,
        config.enableWebGpu,
        config.webGpuIntensity
      );
      setIsMining(true);
    }
  };

  // Telemetry ticker interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isMining) return;

      const currentHps = secondHashesRef.current;
      secondHashesRef.current = 0;

      const nowStr = new Date().toISOString().split('T')[1].slice(0, 8);

      setHashHistory((prev) => [...prev.slice(-29), { time: nowStr, hashrate: currentHps }]);

      const targetPower = config.powerWattage;
      const targetTemp = Math.min(config.targetTempC, 55 + Math.floor(currentHps > 0 ? 25 : 0));

      const earnings = calculateEarnings(selectedAlgo, currentHps, targetPower, config.electricityCostKwh);

      // Evaluate optimal algorithm across all supported
      const algos: AlgorithmType[] = ['sha256d', 'xmr'];
      let bestAlgo: AlgorithmType = selectedAlgo;
      let maxNetProfit = -999;

      algos.forEach((a) => {
        const est = calculateEarnings(a, a === selectedAlgo ? currentHps : 25000, targetPower, config.electricityCostKwh);
        if (est.dailyNetProfit > maxNetProfit) {
          maxNetProfit = est.dailyNetProfit;
          bestAlgo = a;
        }
      });

      // Auto Profit Switcher Trigger
      if (config.autoProfitSwitching && bestAlgo !== selectedAlgo) {
        setSelectedAlgo(bestAlgo);
        if (stratumEngineRef.current) {
          const pool = stratumEngineRef.current.getPools().find((p) => p.algo === bestAlgo);
          if (pool) stratumEngineRef.current.setActivePool(pool.id);
        }
      }

      const webGpuStats = workerManagerRef.current?.getWebGpuStats();

      setStats((prev) => ({
        ...prev,
        hashrateCurrent: currentHps,
        hashrate1m: Math.round((prev.hashrate1m * 0.8) + (currentHps * 0.2)),
        totalHashes: hashesAccRef.current,
        uptimeSeconds: prev.uptimeSeconds + 1,
        currentPowerW: targetPower,
        currentTempC: targetTemp,
        efficiencyRatio: targetPower > 0 ? currentHps / targetPower : 0,
        estimatedDailyCoins: earnings.dailyCoins,
        estimatedDailyUsd: earnings.dailyUsd,
        dailyPowerCost: earnings.dailyPowerCost,
        netDailyProfit: earnings.dailyNetProfit,
        profitMarginPct: earnings.profitMarginPct,
        mostProfitableAlgo: bestAlgo,
        webGpuActive: webGpuStats?.active ?? false,
        webGpuDeviceName: webGpuStats?.deviceName || 'Discrete Hardware GPU Accelerator',
        webGpuHashrate: webGpuStats?.hashrate || 0,
        webGpuSharesFound: webGpuStats?.sharesFound || 0,
        webGpuVramUsageMb: webGpuStats?.active ? 2048 : 0
      }));


    }, 1000);

    return () => clearInterval(timer);
  }, [isMining, selectedAlgo, config]);

  // Pool handlers
  const handleSelectPool = (poolId: string) => {
    if (stratumEngineRef.current) {
      stratumEngineRef.current.setActivePool(poolId);
      setPools([...stratumEngineRef.current.getPools()]);
    }
  };

  const handleAddPool = (p: Omit<StratumPool, 'id' | 'status' | 'sharesAccepted' | 'sharesRejected' | 'sharesStale' | 'pingMs'>) => {
    if (stratumEngineRef.current) {
      stratumEngineRef.current.addPool(p);
      setPools([...stratumEngineRef.current.getPools()]);
    }
  };

  const handleUpdatePool = (id: string, updates: Partial<StratumPool>) => {
    if (stratumEngineRef.current) {
      stratumEngineRef.current.updatePool(id, updates);
      setPools([...stratumEngineRef.current.getPools()]);
    }
  };

  const handleRemovePool = (id: string) => {
    if (stratumEngineRef.current) {
      stratumEngineRef.current.removePool(id);
      setPools([...stratumEngineRef.current.getPools()]);
    }
  };

  const handleReorderPriority = (id: string, direction: 'up' | 'down') => {
    if (stratumEngineRef.current) {
      stratumEngineRef.current.reorderPriority(id, direction);
      setPools([...stratumEngineRef.current.getPools()]);
    }
  };

  const handleSimulateFailover = () => {
    if (stratumEngineRef.current) {
      stratumEngineRef.current.triggerFailover();
      setPools([...stratumEngineRef.current.getPools()]);
    }
  };

  const handleTestPing = async (id: string) => {
    const pool = pools.find((p) => p.id === id);
    if (!pool) return;

    try {
      const res = await fetch('/api/pools/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pool.url, port: pool.port })
      });
      const data = await res.json();
      if (stratumEngineRef.current) {
        stratumEngineRef.current.updatePool(id, { pingMs: data.latencyMs });
        setPools([...stratumEngineRef.current.getPools()]);
      }
    } catch {
      if (stratumEngineRef.current) {
        stratumEngineRef.current.updatePool(id, { pingMs: Math.floor(20 + Math.random() * 30) });
        setPools([...stratumEngineRef.current.getPools()]);
      }
    }
  };

  const handleConnectWallet = (wallet: ConnectedWallet) => {
    setConnectedWallets((prev) => [wallet, ...prev.filter((w) => w.id !== wallet.id)]);
  };

  const handleDisconnectWallet = (walletId: string) => {
    setConnectedWallets((prev) => prev.filter((w) => w.id !== walletId));
  };

  const handleSyncWalletToPools = (coin: 'XMR' | 'BTC', address: string) => {
    if (!stratumEngineRef.current) return;
    const targetAlgo: AlgorithmType = coin === 'XMR' ? 'xmr' : 'sha256d';

    const updatedPools = stratumEngineRef.current.getPools().map((pool) => {
      if (pool.algo === targetAlgo) {
        return {
          ...pool,
          workerName: `${address}.worker1`
        };
      }
      return pool;
    });

    updatedPools.forEach((p) => {
      stratumEngineRef.current?.updatePool(p.id, { workerName: p.workerName });
    });

    setPools([...stratumEngineRef.current.getPools()]);
  };

  const activePool = pools.find((p) => p.id === (stratumEngineRef.current?.getActivePool()?.id || ''));
  const primaryWalletAddress = connectedWallets.length > 0 ? connectedWallets[0].address : payoutConfig.xmrPayoutAddress;

  return (
    <div id="app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* App Header */}
      <Header
        isMining={isMining}
        onToggleMining={handleToggleMining}
        selectedAlgo={selectedAlgo}
        onSelectAlgo={handleSelectAlgo}
        activePool={activePool}
        currentHashrate={stats.hashrateCurrent}
        activeThreads={config.threads}
        powerW={stats.currentPowerW}
        tempC={stats.currentTempC}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        connectedWalletsCount={connectedWallets.length}
        primaryAddress={primaryWalletAddress}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Mining Console', icon: Activity },
            { id: 'pools', label: 'Pool Manager', icon: Server },
            { id: 'stratum', label: 'Stratum Logs', icon: Terminal },
            { id: 'settings', label: 'Algo & Hardware', icon: Settings },
            { id: 'calculator', label: 'Profit Calculator', icon: Calculator }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Views */}
        {activeTab === 'dashboard' && (
          <MiningDashboard
            algo={selectedAlgo}
            stats={stats}
            threads={workerManagerRef.current?.getMetrics() || []}
            shares={shares}
            hashHistory={hashHistory}
            isMining={isMining}
            config={config}
            onToggleProfitSwitching={() => setConfig(prev => ({ ...prev, autoProfitSwitching: !prev.autoProfitSwitching }))}
          />
        )}

        {activeTab === 'pools' && (
          <PoolManager
            pools={pools}
            activePoolId={activePool?.id || ''}
            selectedAlgo={selectedAlgo}
            onSelectPool={handleSelectPool}
            onAddPool={handleAddPool}
            onUpdatePool={handleUpdatePool}
            onRemovePool={handleRemovePool}
            onReorderPriority={handleReorderPriority}
            onTestPing={handleTestPing}
            onSimulateFailover={handleSimulateFailover}
            autoFailover={autoFailover}
            onToggleAutoFailover={() => setAutoFailover(!autoFailover)}
            autoFailback={autoFailback}
            onToggleAutoFailback={() => setAutoFailback(!autoFailback)}
          />
        )}


        {activeTab === 'stratum' && (
          <StratumConsole
            logs={stratumLogs}
            onClearLogs={() => setStratumLogs([])}
            onSendCustomCommand={(json) => {
              if (stratumEngineRef.current) {
                try {
                  const parsed = JSON.parse(json);
                  const isV2 = parsed.protocolVersion === 'v2' || !!parsed.msgType;
                  if (isV2) {
                    (stratumEngineRef.current as any).addLog(
                      'sent',
                      parsed,
                      'v2',
                      parsed.msgType || 'CustomSv2Frame',
                      0x00,
                      parsed.channel_id || 1,
                      'verified',
                      '00 00 00 1c 00 01 00 01',
                      '00 00 00 00',
                      28
                    );
                  } else {
                    (stratumEngineRef.current as any).addLog('sent', parsed, 'v1');
                  }
                } catch {
                  (stratumEngineRef.current as any).addLog('sent', json, 'v1');
                }
                setStratumLogs([...stratumEngineRef.current.getLogs()]);
              }
            }}
          />
        )}

        {activeTab === 'settings' && (
          <AlgorithmSettings
            config={config}
            onUpdateConfig={(updates) => {
              setConfig((prev) => ({ ...prev, ...updates }));
              if (updates.algo) handleSelectAlgo(updates.algo);
            }}
            isMining={isMining}
          />
        )}

        {activeTab === 'calculator' && <MiningCalculator />}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-mono">
        <p>CryptoMiner Core • Multi-Algorithm Stratum Engine (SHA-256d • RandomX XMR • Stratum v2 Noise Encrypted)</p>
      </footer>

      {/* Wallet Management & Reward Distribution Modal */}
      <WalletManagerModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        connectedWallets={connectedWallets}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        payoutConfig={payoutConfig}
        onUpdatePayoutConfig={(updates) => setPayoutConfig((prev) => ({ ...prev, ...updates }))}
        pools={pools}
        onSyncWalletToPools={handleSyncWalletToPools}
        payoutHistory={payoutHistory}
      />

      {/* Android APK & Stratum TCP Mobile Suite Modal */}
      <AndroidApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

    </div>
  );
}
