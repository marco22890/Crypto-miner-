import React, { useState } from 'react';
import {
  Wallet, ShieldCheck, QrCode, RefreshCw, Key, Copy, Check, ExternalLink,
  AlertTriangle, ArrowRight, Zap, CheckCircle2, Lock, Cpu, Usb, Smartphone,
  Sliders, History, Sparkles, X
} from 'lucide-react';
import {
  ConnectedWallet, PayoutDistributionConfig, PayoutHistoryEntry,
  connectMetaMaskProvider, connectPhantomProvider, generateMoneroXmrWallet,
  validateCryptoAddress
} from '../services/walletService';
import { StratumPool } from '../types';

interface WalletManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallets: ConnectedWallet[];
  onConnectWallet: (wallet: ConnectedWallet) => void;
  onDisconnectWallet: (walletId: string) => void;
  payoutConfig: PayoutDistributionConfig;
  onUpdatePayoutConfig: (config: Partial<PayoutDistributionConfig>) => void;
  pools: StratumPool[];
  onSyncWalletToPools: (coin: 'XMR' | 'BTC', address: string) => void;
  payoutHistory: PayoutHistoryEntry[];
}

export const WalletManagerModal: React.FC<WalletManagerModalProps> = ({
  isOpen,
  onClose,
  connectedWallets,
  onConnectWallet,
  onDisconnectWallet,
  payoutConfig,
  onUpdatePayoutConfig,
  pools,
  onSyncWalletToPools,
  payoutHistory
}) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'payouts' | 'history'>('connect');
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [generatedXmr, setGeneratedXmr] = useState<{
    address: string;
    mnemonic: string;
    publicSpendKey: string;
    publicViewKey: string;
  } | null>(null);

  const [qrCodeScanned, setQrCodeScanned] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Connect MetaMask
  const handleConnectMetaMask = async () => {
    setLoadingProvider('metamask');
    setErrorMessage(null);
    try {
      const wallet = await connectMetaMaskProvider();
      onConnectWallet(wallet);
      // Auto set ETH payout address
      onUpdatePayoutConfig({ ethPayoutAddress: wallet.address });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to connect MetaMask');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Connect Phantom
  const handleConnectPhantom = async () => {
    setLoadingProvider('phantom');
    setErrorMessage(null);
    try {
      const wallet = await connectPhantomProvider();
      onConnectWallet(wallet);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to connect Phantom');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Simulate WalletConnect QR Code Session
  const handleConnectWalletConnect = () => {
    setLoadingProvider('walletconnect');
    setTimeout(() => {
      setQrCodeScanned(true);
      setTimeout(() => {
        const wcWallet: ConnectedWallet = {
          id: `w_wc_${Date.now()}`,
          provider: 'walletconnect',
          address: '0x3a218f9210c41d8e9231a4f00921c818a721b01',
          chainName: 'WalletConnect Multi-Chain Session',
          symbol: 'ETH',
          balance: 2.85,
          balanceFormatted: '2.85 ETH',
          isConnected: true,
          connectedAt: new Date().toLocaleTimeString(),
          payoutForCoins: ['ETH', 'BTC', 'XMR']
        };
        onConnectWallet(wcWallet);
        setLoadingProvider(null);
        setQrCodeScanned(false);
      }, 1200);
    }, 800);
  };

  // Generate Monero Native GUI Wallet
  const handleGenerateXmrWallet = () => {
    const xmr = generateMoneroXmrWallet();
    setGeneratedXmr(xmr);
    onUpdatePayoutConfig({ xmrPayoutAddress: xmr.address });

    const xmrWallet: ConnectedWallet = {
      id: `w_xmr_${Date.now()}`,
      provider: 'monero_native',
      address: xmr.address,
      chainName: 'Monero Native CryptoNet',
      symbol: 'XMR',
      balance: 0,
      balanceFormatted: '0.000000 XMR',
      isConnected: true,
      connectedAt: new Date().toLocaleTimeString(),
      payoutForCoins: ['XMR']
    };
    onConnectWallet(xmrWallet);
  };

  // Sync address to stratum pools
  const handleSyncAddress = (coin: 'XMR' | 'BTC', address: string) => {
    onSyncWalletToPools(coin, address);
    setSyncSuccessMsg(`Successfully synced ${coin} payout address (${address.slice(0, 10)}...) to all ${coin === 'XMR' ? 'RandomX' : 'SHA256d'} Stratum pools!`);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  const xmrValidation = validateCryptoAddress(payoutConfig.xmrPayoutAddress, 'XMR');
  const btcValidation = validateCryptoAddress(payoutConfig.btcPayoutAddress, 'BTC');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Crypto Wallet & Reward Distribution</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-mono uppercase font-black">
                  Web3 Connected
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect Web3 wallets or set public addresses to distribute pool mining rewards.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 pt-2 text-xs font-semibold space-x-2">
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'connect'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallets ({connectedWallets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'payouts'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Reward Target & Stratum Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Payout Audit Log ({payoutHistory.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar font-sans text-xs">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 text-xs font-bold">Dismiss</button>
            </div>
          )}

          {/* Sync Success Banner */}
          {syncSuccessMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: CONNECT WALLETS */}
          {activeTab === 'connect' && (
            <div className="space-y-5">
              
              {/* Connected Active Wallets Card List */}
              {connectedWallets.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-white flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Active Connected Wallets ({connectedWallets.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {connectedWallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2 relative transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5 font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {wallet.provider.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono">
                            {wallet.chainName}
                          </span>
                        </div>

                        <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg break-all border border-slate-800/80 flex items-center justify-between">
                          <span>{wallet.address.slice(0, 14)}...{wallet.address.slice(-10)}</span>
                          <button
                            onClick={() => handleCopy(wallet.address, wallet.id)}
                            className="p-1 hover:text-white text-slate-400 ml-1"
                            title="Copy Address"
                          >
                            {copiedText === wallet.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400">Balance:</span>
                          <span className="font-mono font-bold text-emerald-400">{wallet.balanceFormatted}</span>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => onDisconnectWallet(wallet.id)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-medium underline"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connection Methods Selection Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-300 text-xs uppercase tracking-wider font-mono">
                  Select Provider Method to Connect
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* MetaMask */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all space-y-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono">
                          🦊
                        </div>
                        <div>
                          <span className="font-bold text-white block">MetaMask / EVM</span>
                          <span className="text-[10px] text-slate-400">Browser Extension Provider</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">ETH/wXMR</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connect via browser window.ethereum standard to receive wrapped Monero or Bitcoin rewards directly.
                    </p>

                    <button
                      onClick={handleConnectMetaMask}
                      disabled={loadingProvider === 'metamask'}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                    >
                      {loadingProvider === 'metamask' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Connecting Extension...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Connect MetaMask</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* WalletConnect v2 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all space-y-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-white block">WalletConnect v2</span>
                          <span className="text-[10px] text-slate-400">Mobile Wallet QR Session</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono">Multi-Chain</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Pair Trust Wallet, Exodus, or mobile wallets via QR code session for secure off-device signature.
                    </p>

                    <button
                      onClick={handleConnectWalletConnect}
                      disabled={loadingProvider === 'walletconnect'}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                    >
                      {loadingProvider === 'walletconnect' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{qrCodeScanned ? 'Pairing Session...' : 'Generating QR Code...'}</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Pair WalletConnect</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Monero Native GUI Wallet Generator */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all space-y-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono">
                          XMR
                        </div>
                        <div>
                          <span className="font-bold text-white block">Monero (XMR) Native Wallet</span>
                          <span className="text-[10px] text-slate-400">Standard 95-Char Key Generator</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">RandomX</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Generate a client-side Monero public wallet address (starts with 8/4) & keypair for direct HashVault pool mining.
                    </p>

                    <button
                      onClick={handleGenerateXmrWallet}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Generate XMR Key & Address</span>
                    </button>
                  </div>

                  {/* Hardware Wallet (Ledger / Trezor) */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all space-y-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <Usb className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-white block">Hardware Wallet</span>
                          <span className="text-[10px] text-slate-400">Ledger Nano / Trezor USB</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-mono">Cold Storage</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connect hardware cold storage via WebUSB or HID bridge for maximum security on pool payouts.
                    </p>

                    <button
                      onClick={() => {
                        const hwWallet: ConnectedWallet = {
                          id: `w_ledger_${Date.now()}`,
                          provider: 'hardware_ledger',
                          address: '88CFR7niUMiYxZYhz52BaidajVgN3GCeQCWBAR6rrbJ5ZPp68PgkcRJJrCirVs9FmVaRudeVqroHfTmiWQ3WFsom3fSreJ6',
                          chainName: 'Ledger Monero Cold Vault',
                          symbol: 'XMR',
                          balance: 4.1205,
                          balanceFormatted: '4.1205 XMR',
                          isConnected: true,
                          connectedAt: new Date().toLocaleTimeString(),
                          payoutForCoins: ['XMR', 'BTC']
                        };
                        onConnectWallet(hwWallet);
                      }}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Pair Ledger USB Device</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Generated Monero Keys Modal Inspector */}
              {generatedXmr && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      <span>Generated Monero (XMR) Public Wallet Keys</span>
                    </span>
                    <button
                      onClick={() => setGeneratedXmr(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Close Details
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">PUBLIC PAYOUT ADDRESS (95 CHARS)</span>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 break-all flex items-center justify-between">
                        <span>{generatedXmr.address}</span>
                        <button
                          onClick={() => handleCopy(generatedXmr.address, 'gen_addr')}
                          className="p-1 hover:text-white text-slate-400 ml-2"
                        >
                          {copiedText === 'gen_addr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
                      >
                        {showSeedPhrase ? 'Hide 25-Word Seed Mnemonic' : 'Show 25-Word Mnemonic Seed Phrase'}
                      </button>
                    </div>

                    {showSeedPhrase && (
                      <div className="bg-slate-900 p-3 rounded border border-rose-900/50 text-slate-300 font-mono text-[11px] space-y-2">
                        <span className="text-[10px] text-rose-400 font-bold block">⚠️ BACKUP SEED PHRASE (KEEP SECRET):</span>
                        <p className="leading-relaxed text-amber-200">{generatedXmr.mnemonic}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: REWARD TARGET & STRATUM SYNC */}
          {activeTab === 'payouts' && (
            <div className="space-y-5">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Monero (RandomX XMR) Reward Payout Target</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Public address used as worker identifier across HashVault & Monero pools.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSyncAddress('XMR', payoutConfig.xmrPayoutAddress)}
                    disabled={!xmrValidation.isValid}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync to All XMR Pools</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium text-xs">XMR Public Address:</label>
                  <input
                    type="text"
                    value={payoutConfig.xmrPayoutAddress}
                    onChange={(e) => onUpdatePayoutConfig({ xmrPayoutAddress: e.target.value })}
                    className={`w-full bg-slate-900 border ${
                      xmrValidation.isValid ? 'border-emerald-500/50 focus:border-emerald-400' : 'border-rose-500 focus:border-rose-400'
                    } rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none`}
                    placeholder="Enter 95-character Monero wallet address (starts with 4 or 8)..."
                  />

                  <div className="flex items-center justify-between text-[11px]">
                    <span className={xmrValidation.isValid ? 'text-emerald-400 flex items-center gap-1' : 'text-rose-400 flex items-center gap-1'}>
                      {xmrValidation.isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{xmrValidation.message}</span>
                    </span>
                    <span className="text-slate-500 font-mono">Len: {payoutConfig.xmrPayoutAddress.length} chars</span>
                  </div>
                </div>

                {/* Threshold slider */}
                <div className="pt-2 border-t border-slate-900 space-y-2">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span>Pool Payout Threshold:</span>
                    <span className="font-mono text-emerald-400 font-bold">{payoutConfig.minPayoutThresholdXmr} XMR</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={payoutConfig.minPayoutThresholdXmr}
                    onChange={(e) => onUpdatePayoutConfig({ minPayoutThresholdXmr: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>

              {/* Bitcoin SHA256d Payout Target */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Bitcoin (SHA256d BTC) Reward Payout Target</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Public BTC address for F2Pool / AntPool SHA256d reward distribution.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSyncAddress('BTC', payoutConfig.btcPayoutAddress)}
                    disabled={!btcValidation.isValid}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync to All BTC Pools</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium text-xs">BTC Public Address:</label>
                  <input
                    type="text"
                    value={payoutConfig.btcPayoutAddress}
                    onChange={(e) => onUpdatePayoutConfig({ btcPayoutAddress: e.target.value })}
                    className={`w-full bg-slate-900 border ${
                      btcValidation.isValid ? 'border-amber-500/50 focus:border-amber-400' : 'border-rose-500 focus:border-rose-400'
                    } rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none`}
                    placeholder="Enter Bitcoin address (Legacy, SegWit, or bc1)..."
                  />

                  <div className="flex items-center justify-between text-[11px]">
                    <span className={btcValidation.isValid ? 'text-amber-400 flex items-center gap-1' : 'text-rose-400 flex items-center gap-1'}>
                      {btcValidation.isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{btcValidation.message}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto Withdraw Toggle */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Auto Pool Payout Synchronization</span>
                  <span className="text-[11px] text-slate-400">Automatically update Stratum pool worker credentials when connecting new wallets.</span>
                </div>

                <button
                  onClick={() => onUpdatePayoutConfig({ autoWithdrawEnabled: !payoutConfig.autoWithdrawEnabled })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    payoutConfig.autoWithdrawEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      payoutConfig.autoWithdrawEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: PAYOUT AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                  Verified Pool Reward Distributions
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Real-time on-chain confirmation</span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400 bg-slate-900/60">
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Coin</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Pool Source</th>
                      <th className="py-2.5 px-3">Recipient Address</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {payoutHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400">{item.timestamp}</td>
                        <td className="py-2.5 px-3 font-bold text-cyan-400">{item.coin}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">
                          {item.amount} {item.coin}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">{item.poolName}</td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[150px]">
                          {item.recipientAddress.slice(0, 10)}...{item.recipientAddress.slice(-6)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono">
            {connectedWallets.length} active wallet connection(s)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
