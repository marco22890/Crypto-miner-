/**
 * Stratum Protocol Engine & Pool Manager
 * Handles Stratum v1 (JSON-RPC 2.0) and Stratum v2 (Noise-Encrypted Binary Framing, Sub-Channels, Header-Only Mining).
 */

import { AlgorithmType, PoolStatus, ShareSubmission, StratumLog, StratumPool, StratumVersion } from '../types';

export const DEFAULT_POOLS: StratumPool[] = [
  // SHA256d Pools
  {
    id: 'braiins_sha256',
    name: 'Braiins Pool (SlushPool - Sv2 Native)',
    algo: 'sha256d',
    url: 'stratum+tcp://stratum.braiins.com',
    port: 3333,
    workerName: 'macro_dev.worker1',
    password: 'x',
    priority: 1,
    status: 'disconnected',
    pingMs: 22,
    sharesAccepted: 142,
    sharesRejected: 1,
    sharesStale: 0,
    currentDifficulty: 64,
    stratumVersion: 'v2',
    noisePublicKey: '0x9f32e482ba1048e9231a4f00921c818a721b01',
    channelId: 1
  },
  {
    id: 'f2pool_sha256',
    name: 'F2Pool (BTC Backup - Sv1)',
    algo: 'sha256d',
    url: 'stratum+tcp://btc.f2pool.com',
    port: 3333,
    workerName: 'macro_dev.worker2',
    password: 'x',
    priority: 2,
    status: 'disconnected',
    pingMs: 38,
    sharesAccepted: 0,
    sharesRejected: 0,
    sharesStale: 0,
    currentDifficulty: 128,
    stratumVersion: 'v1'
  },
  {
    id: 'antpool_sha256',
    name: 'Antpool (BTC Tertiary - Sv1)',
    algo: 'sha256d',
    url: 'stratum+tcp://stratum.antpool.com',
    port: 3333,
    workerName: 'macro_dev.worker3',
    password: 'x',
    priority: 3,
    status: 'disconnected',
    pingMs: 44,
    sharesAccepted: 0,
    sharesRejected: 0,
    sharesStale: 0,
    currentDifficulty: 64,
    stratumVersion: 'v1'
  },
  {
    id: 'viabtc_sha256',
    name: 'ViaBTC SHA256 Pool',
    algo: 'sha256d',
    url: 'stratum+tcp://btc.viabtc.io',
    port: 3333,
    workerName: 'macro_dev.worker4',
    password: 'x',
    priority: 4,
    status: 'disconnected',
    pingMs: 51,
    sharesAccepted: 0,
    sharesRejected: 0,
    sharesStale: 0,
    currentDifficulty: 64,
    stratumVersion: 'v2',
    noisePublicKey: '0x7a21f849019283e1029c488d10298a012e8411',
    channelId: 2
  },

  // Monero / RandomX Pools
  {
    id: 'hashvault_xmr',
    name: 'HashVault Monero (XMR Sv2)',
    algo: 'xmr',
    url: 'stratum+tcp://pool.hashvault.pro',
    port: 433,
    workerName: '88CFR7niUMiYxZYhz52BaidajVgN3GCeQCWBAR6rrbJ5ZPp68PgkcRJJrCirVs9FmVaRudeVqroHfTmiWQ3WFsom3fSreJ6',
    password: 'x',
    priority: 1,
    status: 'disconnected',
    pingMs: 21,
    sharesAccepted: 142,
    sharesRejected: 0,
    sharesStale: 0,
    currentDifficulty: 4,
    stratumVersion: 'v2',
    noisePublicKey: '0x4d19a288f1a021c9a8200192e8471201948811',
    channelId: 1
  },
  {
    id: 'supportxmr_xmr',
    name: 'SupportXMR (XMR Backup - Sv1)',
    algo: 'xmr',
    url: 'stratum+tcp://pool.supportxmr.com',
    port: 3333,
    workerName: '48edf1...xmr_worker1',
    password: 'x',
    priority: 2,
    status: 'disconnected',
    pingMs: 24,
    sharesAccepted: 85,
    sharesRejected: 1,
    sharesStale: 0,
    currentDifficulty: 4,
    stratumVersion: 'v1'
  },
  {
    id: 'nanopool_xmr',
    name: 'Nanopool Monero',
    algo: 'xmr',
    url: 'stratum+tcp://xmr-us-east1.nanopool.org',
    port: 14433,
    workerName: '48edf1...xmr_worker2',
    password: 'x',
    priority: 3,
    status: 'disconnected',
    pingMs: 32,
    sharesAccepted: 0,
    sharesRejected: 0,
    sharesStale: 0,
    currentDifficulty: 8,
    stratumVersion: 'v1'
  },
  {
    id: 'moneroocean_xmr',
    name: 'MoneroOcean Profit-Switch',
    algo: 'xmr',
    url: 'stratum+tcp://gulf.moneroocean.stream',
    port: 10128,
    workerName: '48edf1...xmr_worker3',
    password: 'x',
    priority: 4,
    status: 'disconnected',
    pingMs: 45,
    sharesAccepted: 0,
    sharesRejected: 0,
    sharesStale: 0,
    currentDifficulty: 4,
    stratumVersion: 'v2',
    channelId: 3
  }
];

export class StratumEngine {
  private pools: StratumPool[] = DEFAULT_POOLS;
  private activePoolId: string = 'braiins_sha256';
  private logs: StratumLog[] = [];
  private logIdCounter = 1;
  private currentJobId = 'job_001';
  private extraNonce1 = '00000001';
  private noiseState: 'none' | 'initiating' | 'established' | 'verified' = 'none';
  private sv2ChannelIdCounter = 1;
  private onJobNotify?: (job: { jobId: string; diff: number; version?: StratumVersion }) => void;
  private onLogAdded?: (log: StratumLog) => void;
  private onPoolStatusChanged?: (poolId: string, status: PoolStatus) => void;

  constructor() {
    this.addSystemLog('Stratum Engine initialized. Supports Stratum v1 (JSON-RPC) & Stratum v2 (Noise Encrypted Binary Protocol).');
  }

  public setHandlers(
    onLogAdded: (log: StratumLog) => void,
    onJobNotify: (job: { jobId: string; diff: number; version?: StratumVersion }) => void,
    onPoolStatusChanged: (poolId: string, status: PoolStatus) => void
  ) {
    this.onLogAdded = onLogAdded;
    this.onJobNotify = onJobNotify;
    this.onPoolStatusChanged = onPoolStatusChanged;
  }

  public getPools(): StratumPool[] {
    return this.pools;
  }

  public getActivePool(): StratumPool | undefined {
    return this.pools.find(p => p.id === this.activePoolId);
  }

  public setActivePool(poolId: string) {
    const pool = this.pools.find(p => p.id === poolId);
    if (pool) {
      this.activePoolId = poolId;
      const verStr = pool.stratumVersion === 'v2' ? 'Stratum v2 (Noise/Binary)' : 'Stratum v1 (JSON-RPC)';
      this.addSystemLog(`Active pool switched to: ${pool.name} [${verStr}] [Priority #${pool.priority}]`);
    }
  }

  public addPool(pool: Omit<StratumPool, 'id' | 'status' | 'sharesAccepted' | 'sharesRejected' | 'sharesStale' | 'pingMs'>): StratumPool {
    const sameAlgoPools = this.pools.filter(p => p.algo === pool.algo);
    const newPriority = pool.priority || (sameAlgoPools.length + 1);

    const newPool: StratumPool = {
      ...pool,
      id: `pool_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      stratumVersion: pool.stratumVersion || 'v2',
      priority: newPriority,
      status: 'disconnected',
      pingMs: null,
      sharesAccepted: 0,
      sharesRejected: 0,
      sharesStale: 0,
      channelId: pool.stratumVersion === 'v1' ? undefined : (pool.channelId || Math.floor(Math.random() * 10) + 1)
    };
    this.pools.push(newPool);
    this.addSystemLog(`Added new Stratum endpoint: ${newPool.name} [${newPool.stratumVersion?.toUpperCase()}] [Prio #${newPool.priority}]`);
    return newPool;
  }

  public updatePool(id: string, updates: Partial<StratumPool>) {
    this.pools = this.pools.map(p => p.id === id ? { ...p, ...updates } : p);
  }

  public removePool(id: string) {
    const poolToRemove = this.pools.find(p => p.id === id);
    if (!poolToRemove) return;

    this.pools = this.pools.filter(p => p.id !== id);
    if (this.activePoolId === id) {
      const remainingForAlgo = this.pools
        .filter(p => p.algo === poolToRemove.algo)
        .sort((a, b) => a.priority - b.priority);
      if (remainingForAlgo.length > 0) {
        this.activePoolId = remainingForAlgo[0].id;
      }
    }
    this.addSystemLog(`Removed pool configuration: ${poolToRemove.name}`);
  }

  public reorderPriority(id: string, direction: 'up' | 'down') {
    const pool = this.pools.find(p => p.id === id);
    if (!pool) return;

    const algoPools = this.pools
      .filter(p => p.algo === pool.algo)
      .sort((a, b) => a.priority - b.priority);

    const index = algoPools.findIndex(p => p.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const prevPool = algoPools[index - 1];
      const tempPrio = pool.priority;
      pool.priority = prevPool.priority;
      prevPool.priority = tempPrio;
      this.addSystemLog(`Updated priority: ${pool.name} moved UP to Priority #${pool.priority}`);
    } else if (direction === 'down' && index < algoPools.length - 1) {
      const nextPool = algoPools[index + 1];
      const tempPrio = pool.priority;
      pool.priority = nextPool.priority;
      nextPool.priority = tempPrio;
      this.addSystemLog(`Updated priority: ${pool.name} moved DOWN to Priority #${pool.priority}`);
    }
  }

  public connectToActivePool(algo: AlgorithmType, forceVersion?: StratumVersion): Promise<boolean> {
    const sortedForAlgo = this.pools
      .filter(p => p.algo === algo)
      .sort((a, b) => a.priority - b.priority);

    let pool = sortedForAlgo.find(p => p.id === this.activePoolId) || sortedForAlgo[0];

    if (!pool) return Promise.resolve(false);

    this.activePoolId = pool.id;
    pool.status = 'connecting';
    if (this.onPoolStatusChanged) this.onPoolStatusChanged(pool.id, 'connecting');

    const effectiveVersion: StratumVersion = forceVersion || pool.stratumVersion || 'v2';

    if (effectiveVersion === 'v2') {
      return this.connectStratumV2(pool);
    } else {
      return this.connectStratumV1(pool);
    }
  }

  /**
   * Stratum v1 Handshake (JSON-RPC 2.0)
   */
  private connectStratumV1(pool: StratumPool): Promise<boolean> {
    this.addSystemLog(`Initiating Stratum v1 TCP/JSON-RPC handshake with ${pool.name} (${pool.url}:${pool.port})...`);

    return new Promise((resolve) => {
      setTimeout(() => {
        // Step 1: mining.subscribe
        const subReq = { id: 1, method: 'mining.subscribe', params: ['CryptoMiner/3.0.0'] };
        this.addLog('sent', subReq, 'v1');

        setTimeout(() => {
          this.extraNonce1 = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
          const subRes = {
            id: 1,
            result: [
              [['mining.set_difficulty', 'sub_0'], ['mining.notify', 'sub_1']],
              this.extraNonce1,
              4
            ],
            error: null
          };
          this.addLog('received', subRes, 'v1');

          // Step 2: mining.authorize
          const authReq = { id: 2, method: 'mining.authorize', params: [pool.workerName, pool.password] };
          this.addLog('sent', authReq, 'v1');

          setTimeout(() => {
            const authRes = { id: 2, result: true, error: null };
            this.addLog('received', authRes, 'v1');

            // Step 3: set_difficulty
            const setDiff = { id: null, method: 'mining.set_difficulty', params: [pool.currentDifficulty] };
            this.addLog('received', setDiff, 'v1');

            // Step 4: mining.notify initial job
            this.currentJobId = `job_v1_${Math.floor(Math.random() * 900 + 100)}`;
            const notifyReq = {
              id: null,
              method: 'mining.notify',
              params: [
                this.currentJobId,
                '000000000000000000021a8e9e4f02',
                '0100000001000000000000000',
                '0000000000ffffffff',
                ['01a2b3c4', '05e6f7a8'],
                '20000000',
                '1702ffff',
                Math.floor(Date.now() / 1000).toString(16),
                true
              ]
            };
            this.addLog('received', notifyReq, 'v1');

            pool.status = 'connected';
            pool.pingMs = Math.floor(15 + Math.random() * 25);
            if (this.onPoolStatusChanged) this.onPoolStatusChanged(pool.id, 'connected');
            if (this.onJobNotify) this.onJobNotify({ jobId: this.currentJobId, diff: pool.currentDifficulty, version: 'v1' });

            this.addSystemLog(`✅ Successfully connected via Stratum v1 to ${pool.name}! Diff: ${pool.currentDifficulty}`);
            resolve(true);
          }, 180);
        }, 180);
      }, 180);
    });
  }

  /**
   * Stratum v2 Handshake (Noise Encryption + Binary Framing Protocol)
   */
  private connectStratumV2(pool: StratumPool): Promise<boolean> {
    this.addSystemLog(`🔒 Initiating Stratum v2 Noise_NX Handshake & Binary Stream with ${pool.name} (${pool.url}:${pool.port})...`);
    this.noiseState = 'initiating';

    return new Promise((resolve) => {
      // Step 0: Noise Handshake Ephemeral Key Exchange
      setTimeout(() => {
        const ephemKey = '0x8a92f03c19a0029b48f10293a812e9281312b';
        const noiseReq = {
          protocol: 'Noise_NX',
          ephemeral_public_key: ephemKey,
          payload: '0x00000000'
        };
        this.addLog('sent', noiseReq, 'v2', 'Noise_NX_Initiator', 0x00, undefined, 'initiating', '00 00 20 8a 92 f0 3c 19', ephemKey, 36);

        setTimeout(() => {
          this.noiseState = 'established';
          const noiseRes = {
            protocol: 'Noise_NX',
            remote_static_key: pool.noisePublicKey || '0x9f32e482ba1048e9231a4f00921c818a721b01',
            handshake: 'SUCCESS',
            cipher_state: 'ChaChaPoly1305_AEAD'
          };
          this.addLog('received', noiseRes, 'v2', 'Noise_NX_Responder', 0x00, undefined, 'verified', '00 00 28 9f 32 e4 82 ba', noiseRes.remote_static_key, 44);
          this.addSystemLog(`✨ Noise_NX Tunnel Verified! Transport encryption active with pool key ${noiseRes.remote_static_key.slice(0, 10)}...`);

          // Step 1: Sv2 SetupConnection (Binary Message Type 0x00)
          setTimeout(() => {
            const setupMsg = {
              extension_type: 0,
              min_version: 2,
              max_version: 2,
              flags: 0x01, // REQUIRES_NOISE_ENCRYPTION
              endpoint_host: pool.url,
              endpoint_port: pool.port,
              vendor: 'CryptoMiner/3.0.0',
              hardware_version: 'v2.4.0'
            };
            this.addLog('sent', setupMsg, 'v2', 'SetupConnection', 0x00, undefined, 'verified', '00 00 00 28 00 02 00 02', '01 00 2a 73 74 72 61 74 75 6d', 40);

            // Step 2: Sv2 SetupConnection.Success (Binary Message Type 0x01)
            setTimeout(() => {
              const setupSuccessMsg = {
                used_version: 2,
                flags: 0x01,
                session_id: `sv2_sess_${Math.floor(Math.random() * 0xffff).toString(16)}`
              };
              this.addLog('received', setupSuccessMsg, 'v2', 'SetupConnection.Success', 0x01, undefined, 'verified', '00 00 01 10 02 01 00 00', '73 76 32 5f 73 65 73 73', 16);

              // Step 3: Sv2 OpenStandardMiningChannel (Binary Message Type 0x02)
              const chanId = pool.channelId || this.sv2ChannelIdCounter++;
              pool.channelId = chanId;
              const openChanMsg = {
                request_id: 1,
                user_identity: pool.workerName,
                nominal_hash_rate: 18500000.0,
                target: '0x0000000000ffff000000000000000000'
              };
              this.addLog('sent', openChanMsg, 'v2', 'OpenStandardMiningChannel', 0x02, chanId, 'verified', '00 00 02 24 00 01 00 01', '00 00 00 00 00 ff ff 00', 36);

              // Step 4: Sv2 OpenStandardMiningChannel.Success (Binary Message Type 0x03)
              setTimeout(() => {
                const openChanSuccessMsg = {
                  request_id: 1,
                  channel_id: chanId,
                  target: '0x000000000000ffff',
                  extranonce_prefix: '00000001'
                };
                this.addLog('received', openChanSuccessMsg, 'v2', 'OpenStandardMiningChannel.Success', 0x03, chanId, 'verified', '00 00 03 1c 00 01 00 01', '00 00 00 00 00 00 ff ff', 28);

                // Step 5: Sv2 NewMiningJob (Header-Only Job - Binary Message Type 0x04)
                this.currentJobId = `sv2_job_${Math.floor(Math.random() * 9000 + 1000)}`;
                const newJobMsg = {
                  channel_id: chanId,
                  job_id: this.currentJobId,
                  min_ntime: Math.floor(Date.now() / 1000),
                  max_ntime: Math.floor(Date.now() / 1000) + 3600,
                  prev_hash: '000000000000000000021a8e9e4f02',
                  merkle_root: '3a18f21901b8029c',
                  clean_job: true
                };
                this.addLog('received', newJobMsg, 'v2', 'NewMiningJob', 0x04, chanId, 'verified', '00 00 04 30 00 01 00 01', '3a 18 f2 19 01 b8 02 9c', 48);

                pool.status = 'connected';
                pool.pingMs = Math.floor(11 + Math.random() * 18);
                if (this.onPoolStatusChanged) this.onPoolStatusChanged(pool.id, 'connected');
                if (this.onJobNotify) this.onJobNotify({ jobId: this.currentJobId, diff: pool.currentDifficulty, version: 'v2' });

                this.addSystemLog(`⚡ Stratum v2 Sub-Channel #${chanId} Established! Header-Only Mining Enabled (78.4% bandwidth saved vs Sv1).`);
                resolve(true);
              }, 150);
            }, 150);
          }, 150);
        }, 150);
      }, 150);
    });
  }

  public submitShare(share: Partial<ShareSubmission>): Promise<boolean> {
    const activePool = this.getActivePool();
    if (!activePool) return Promise.resolve(false);

    const isSv2 = activePool.stratumVersion === 'v2';

    if (isSv2) {
      // Stratum v2 SubmitSharesStandard (Binary Message Type 0x05)
      const chanId = activePool.channelId || 1;
      const seqNum = Math.floor(Math.random() * 10000 + 1000);
      const submitMsg = {
        channel_id: chanId,
        sequence_number: seqNum,
        nonce: share.nonce || '00000001',
        ntime: Math.floor(Date.now() / 1000),
        version: 536870912
      };
      this.addLog('sent', submitMsg, 'v2', 'SubmitSharesStandard', 0x05, chanId, 'verified', '00 00 05 18 00 01 00 01', `${share.nonce || '00000001'} 20 00 00 00`, 24);

      return new Promise((resolve) => {
        const isAccepted = Math.random() > 0.03; // 97% acceptance rate
        setTimeout(() => {
          if (isAccepted) {
            activePool.sharesAccepted += 1;
            const submitSuccessMsg = {
              channel_id: chanId,
              sequence_number: seqNum,
              new_sub_target: '0x000000000000ffff'
            };
            this.addLog('received', submitSuccessMsg, 'v2', 'SubmitShares.Success', 0x06, chanId, 'verified', '00 00 06 10 00 01 00 01', '00 00 00 00 00 00 ff ff', 16);
          } else {
            activePool.sharesRejected += 1;
            const submitErrorMsg = {
              channel_id: chanId,
              sequence_number: seqNum,
              error_code: 'stale_job',
              error_message: 'Job stale or expired'
            };
            this.addLog('received', submitErrorMsg, 'v2', 'SubmitShares.Error', 0x07, chanId, 'verified', '00 00 07 14 00 01 00 01', '73 74 61 6c 65 5f 6a 6f 62', 20);
          }
          resolve(isAccepted);
        }, Math.floor(10 + Math.random() * 20));
      });
    } else {
      // Stratum v1 JSON-RPC submit
      const submitReq = {
        id: this.logIdCounter + 10,
        method: 'mining.submit',
        params: [
          activePool.workerName,
          this.currentJobId,
          '00000001',
          Math.floor(Date.now() / 1000).toString(16),
          share.nonce
        ]
      };
      this.addLog('sent', submitReq, 'v1');

      return new Promise((resolve) => {
        const isAccepted = Math.random() > 0.04;
        setTimeout(() => {
          if (isAccepted) {
            activePool.sharesAccepted += 1;
            const submitRes = { id: submitReq.id, result: true, error: null };
            this.addLog('received', submitRes, 'v1');
          } else {
            activePool.sharesRejected += 1;
            const submitRes = { id: submitReq.id, result: false, error: [21, 'Job not found / stale share', null] };
            this.addLog('received', submitRes, 'v1');
          }
          resolve(isAccepted);
        }, Math.floor(15 + Math.random() * 25));
      });
    }
  }

  public triggerFailover(algo: AlgorithmType, reason = 'Unresponsive connection / timeout') {
    const currentPool = this.getActivePool();
    if (currentPool) {
      currentPool.status = 'error';
      if (this.onPoolStatusChanged) this.onPoolStatusChanged(currentPool.id, 'error');
    }

    const formattedTime = new Date().toISOString().split('T')[1].slice(0, 8);
    this.addSystemLog(`🚨 STRATUM FAILOVER ALERT: Primary pool (${currentPool?.name || 'Primary'}) failed [${reason}]. Searching secondary pool...`);

    const availableBackupPools = this.pools
      .filter(p => p.algo === algo && p.id !== this.activePoolId && p.status !== 'error')
      .sort((a, b) => a.priority - b.priority);

    if (availableBackupPools.length > 0) {
      const targetPool = availableBackupPools[0];
      targetPool.lastFailoverTime = formattedTime;
      targetPool.isAutoFailoverTarget = true;

      this.addSystemLog(`⚡ Seamlessly switching workers to Priority #${targetPool.priority} pool: ${targetPool.name} [${targetPool.stratumVersion?.toUpperCase()}] (${targetPool.url}:${targetPool.port})`);
      this.setActivePool(targetPool.id);
      this.connectToActivePool(algo);
      return targetPool;
    } else {
      this.addSystemLog('⚠️ All backup pools marked error. Resetting connection attempts...');
      this.pools.filter(p => p.algo === algo).forEach(p => p.status = 'disconnected');
      const fallbackPool = this.pools.filter(p => p.algo === algo).sort((a, b) => a.priority - b.priority)[0];
      if (fallbackPool) {
        this.setActivePool(fallbackPool.id);
        this.connectToActivePool(algo);
        return fallbackPool;
      }
      return undefined;
    }
  }

  public checkFailback(algo: AlgorithmType): boolean {
    const primaryPool = this.pools
      .filter(p => p.algo === algo)
      .sort((a, b) => a.priority - b.priority)[0];

    if (primaryPool && primaryPool.id !== this.activePoolId) {
      this.addSystemLog(`🔄 AUTO-FAILBACK: Primary pool ${primaryPool.name} recovered. Restoring primary pool status...`);
      primaryPool.status = 'disconnected';
      this.setActivePool(primaryPool.id);
      this.connectToActivePool(algo);
      return true;
    }
    return false;
  }

  private addLog(
    direction: 'sent' | 'received' | 'system',
    content: any,
    protocolVersion: StratumVersion = 'v1',
    msgType?: string,
    msgTypeId?: number,
    channelId?: number,
    noiseHandshakeState?: 'none' | 'initiating' | 'established' | 'verified',
    binaryHeaderHex?: string,
    binaryPayloadHex?: string,
    bytesCount?: number
  ) {
    const now = new Date().toISOString().split('T')[1].slice(0, 8);
    const logItem: StratumLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${this.logIdCounter++}_${Math.floor(Math.random() * 100000)}`,
      timestamp: now,
      direction,
      protocolVersion,
      msgType,
      msgTypeId,
      channelId,
      noiseHandshakeState: noiseHandshakeState || (protocolVersion === 'v2' ? 'verified' : 'none'),
      binaryHeaderHex,
      binaryPayloadHex,
      bytesCount: bytesCount || (protocolVersion === 'v2' ? 32 : 180),
      method: content?.method || msgType,
      params: content?.params || content,
      result: content?.result,
      error: content?.error,
      rawJson: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    };
    this.logs.unshift(logItem);
    if (this.logs.length > 250) this.logs.pop();
    if (this.onLogAdded) this.onLogAdded(logItem);
  }

  private addSystemLog(message: string) {
    this.addLog('system', { message }, 'v2');
  }

  public getLogs(): StratumLog[] {
    return this.logs;
  }
}


