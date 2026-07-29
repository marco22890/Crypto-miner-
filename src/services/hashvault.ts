/**
 * HashVault Pool API & Pool Diagnostic Service
 * Provides live wallet/worker verification against HashVault Monero API
 */

export interface HashVaultMinerStats {
  wallet: string;
  hashRate: number; // H/s
  validShares: number;
  invalidShares: number;
  amtPaid: number; // XMR atomic units or formatted
  amtDue: number;
  lastHash: number;
  workersCount: number;
  workers: Array<{
    name: string;
    hashRate: number;
    lastShare: number;
    validShares: number;
  }>;
  isOnline: boolean;
  rawResponse?: any;
  error?: string;
}

export async function fetchHashVaultMinerStats(walletAddress: string): Promise<HashVaultMinerStats> {
  const cleanWallet = walletAddress.trim().split('.')[0].split('+')[0];

  if (!cleanWallet || cleanWallet.length < 15) {
    return {
      wallet: walletAddress,
      hashRate: 0,
      validShares: 0,
      invalidShares: 0,
      amtPaid: 0,
      amtDue: 0,
      lastHash: 0,
      workersCount: 0,
      workers: [],
      isOnline: false,
      error: 'Invalid Monero wallet address format. Addresses usually start with 8 or 4 and are 95 characters long.'
    };
  }

  try {
    const response = await fetch(`https://api.hashvault.pro/v1/monero/miner/${cleanWallet}/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          wallet: cleanWallet,
          hashRate: 0,
          validShares: 0,
          invalidShares: 0,
          amtPaid: 0,
          amtDue: 0,
          lastHash: 0,
          workersCount: 0,
          workers: [],
          isOnline: false,
          error: 'Miner address not found on HashVault pool yet. No shares submitted to pool.hashvault.pro in the last 24 hours.'
        };
      }
      throw new Error(`HashVault API returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse HashVault API response structure
    const hashRate = data.hashRate || data.hashrate || data.hash || 0;
    const validShares = data.validShares || data.shares || 0;
    const invalidShares = data.invalidShares || 0;
    const amtPaid = (data.amtPaid || data.paid || 0) / 1e12; // Atomic units to XMR
    const amtDue = (data.amtDue || data.due || 0) / 1e12;
    const workersCount = data.workersCount || (data.workers ? Object.keys(data.workers).length : 0);

    const workersList: Array<{ name: string; hashRate: number; lastShare: number; validShares: number }> = [];
    if (data.workers) {
      if (Array.isArray(data.workers)) {
        data.workers.forEach((w: any) => {
          workersList.push({
            name: w.name || w.worker || 'worker',
            hashRate: w.hashRate || w.hashrate || 0,
            lastShare: w.lastShare || 0,
            validShares: w.validShares || 0
          });
        });
      } else if (typeof data.workers === 'object') {
        Object.keys(data.workers).forEach((key) => {
          const w = data.workers[key];
          workersList.push({
            name: key,
            hashRate: w.hashRate || w.hashrate || 0,
            lastShare: w.lastShare || 0,
            validShares: w.validShares || 0
          });
        });
      }
    }

    return {
      wallet: cleanWallet,
      hashRate,
      validShares,
      invalidShares,
      amtPaid: parseFloat(amtPaid.toFixed(6)),
      amtDue: parseFloat(amtDue.toFixed(6)),
      lastHash: data.lastHash || Date.now(),
      workersCount,
      workers: workersList,
      isOnline: hashRate > 0 || workersCount > 0,
      rawResponse: data
    };
  } catch (err: any) {
    console.warn('HashVault API fetch exception:', err);
    return {
      wallet: cleanWallet,
      hashRate: 0,
      validShares: 0,
      invalidShares: 0,
      amtPaid: 0,
      amtDue: 0,
      lastHash: 0,
      workersCount: 0,
      workers: [],
      isOnline: false,
      error: `Could not connect to HashVault API directly from browser: ${err?.message || 'Network / CORS limitation'}.`
    };
  }
}
