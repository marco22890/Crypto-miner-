export type AlgorithmType = 'sha256d' | 'xmr';
export type StratumVersion = 'v1' | 'v2';

export interface AlgorithmDetails {
  id: AlgorithmType;
  name: string;
  coinSymbol: string;
  coinName: string;
  description: string;
  unit: string; // e.g. "H/s", "KH/s", "MH/s"
  defaultDifficulty: number;
  headerSize: number; // in bytes
  typicalDeviceHashrate: Record<string, string>; // e.g. { "Browser JS": "12.5 KH/s", "ASIC / CPU": "..." }
}

export type PoolStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface StratumPool {
  id: string;
  name: string;
  algo: AlgorithmType;
  url: string;
  port: number;
  workerName: string;
  password: string;
  priority: number; // 1 = highest / primary
  status: PoolStatus;
  pingMs: number | null;
  sharesAccepted: number;
  sharesRejected: number;
  sharesStale: number;
  currentDifficulty: number;
  stratumVersion?: StratumVersion; // 'v1' (JSON-RPC) or 'v2' (Noise/Binary)
  noisePublicKey?: string; // Hex key for Sv2 Noise handshake
  channelId?: number; // Sv2 sub-channel ID
  wsProxyUrl?: string; // Optional WebSocket Proxy bridge URL (e.g., wss://proxy.hashvault.pro)
  isAutoFailoverTarget?: boolean;
  lastFailoverTime?: string;
  isBackup?: boolean;
}

export interface StratumLog {
  id: string;
  timestamp: string;
  direction: 'sent' | 'received' | 'system';
  protocolVersion?: StratumVersion;
  method?: string;
  msgType?: string;
  msgTypeId?: number;
  channelId?: number;
  noiseHandshakeState?: 'none' | 'initiating' | 'established' | 'verified';
  binaryHeaderHex?: string;
  binaryPayloadHex?: string;
  bytesCount?: number;
  params?: any;
  result?: any;
  error?: any;
  rawJson?: string;
}

export type ShareStatus = 'accepted' | 'rejected' | 'stale';

export interface ShareSubmission {
  id: string;
  timestamp: number;
  timeFormatted: string;
  nonce: string;
  hash: string;
  difficulty: number;
  shareDiff: number;
  targetDiff?: number;
  status: ShareStatus;
  latencyMs: number;
  poolId: string;
  poolName: string;
  algo: AlgorithmType;
  workerId: number;
  blockCandidate?: boolean;
  stratumVersion?: StratumVersion;
}

export interface WorkerThreadMetric {
  id: number;
  name: string;
  hashrate: number; // raw H/s
  hashesComputed: number;
  sharesFound: number;
  status: 'mining' | 'idle' | 'paused' | 'throttled';
  cpuUtilization: number; // 0-100%
  tempC: number;
}

export interface MiningConfig {
  algo: AlgorithmType;
  threads: number;
  intensity: number; // 1 to 100
  powerWattage: number; // estimated W
  targetTempC: number; // throttle at temp
  electricityCostKwh: number; // $ per kWh
  selectedPoolId: string;
  autoFailover: boolean;
  autoFailback: boolean;
  autoProfitSwitching: boolean;
  profitSafeguard: boolean; // pause if net profit < 0
  turboMode: boolean;
  miningMode: 'pool' | 'solo';
  soloWalletAddress: string;
  benchmarkMode: boolean;
  stratumProtocolMode: 'simulator' | 'direct_websocket';
  stratumVersionMode: 'v1' | 'v2' | 'auto'; // Protocol mode preference
  enableNoiseEncryption: boolean; // Stratum v2 Noise_NX handshake
  enableCustomJobTemplates: boolean; // Stratum v2 Job Declarator / Template Provider
  enableWebGpu: boolean; // WebGPU Shader Acceleration Engine
  webGpuIntensity: number; // WebGPU WGSL dispatch intensity (1-100%)
}

export interface CoinMarketData {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  networkDifficulty: number;
  networkHashrate: string;
  blockReward: number;
}

export interface MiningStats {
  hashrateCurrent: number; // H/s
  hashrate1m: number;
  hashrate5m: number;
  totalHashes: number;
  sharesAccepted: number;
  sharesRejected: number;
  sharesStale: number;
  blocksFound: number;
  uptimeSeconds: number;
  currentTempC: number;
  currentPowerW: number;
  efficiencyRatio: number; // Hashes per Watt
  estimatedDailyCoins: number;
  estimatedDailyUsd: number;
  dailyPowerCost: number;
  netDailyProfit: number;
  profitMarginPct: number;
  mostProfitableAlgo: AlgorithmType;
  sv2Active?: boolean;
  sv2NoiseEncrypted?: boolean;
  sv2BandwidthSavedPct?: number;
  sv2ActiveChannels?: number;
  sv2TemplateProviderConnected?: boolean;
  webGpuActive?: boolean;
  webGpuDeviceName?: string;
  webGpuHashrate?: number;
  webGpuSharesFound?: number;
  webGpuVramUsageMb?: number;
}

export interface BenchmarkResult {
  device: string;
  algo: AlgorithmType;
  hashrate: number;
  unit: string;
  durationMs: number;
  hashesEvaluated: number;
  date: string;
}
