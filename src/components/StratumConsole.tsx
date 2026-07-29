import React, { useState } from 'react';
import { Terminal, Copy, Trash2, Send, ArrowUpRight, ArrowDownLeft, CheckCircle2, ShieldCheck, Cpu, Zap, Layers } from 'lucide-react';
import { StratumLog, StratumVersion } from '../types';

interface StratumConsoleProps {
  logs: StratumLog[];
  onClearLogs: () => void;
  onSendCustomCommand: (jsonStr: string) => void;
}

export const StratumConsole: React.FC<StratumConsoleProps> = ({
  logs,
  onClearLogs,
  onSendCustomCommand
}) => {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received' | 'system'>('all');
  const [versionFilter, setVersionFilter] = useState<'all' | 'v2' | 'v1'>('all');
  const [customInput, setCustomInput] = useState('{"id": 99, "method": "mining.subscribe", "params": ["CryptoMinerClient"]}');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter(l => {
    const matchesDir = filter === 'all' || l.direction === filter;
    const matchesVer = versionFilter === 'all' || (l.protocolVersion || 'v1') === versionFilter;
    return matchesDir && matchesVer;
  });

  const sv2Count = logs.filter(l => l.protocolVersion === 'v2').length;
  const sv1Count = logs.filter(l => l.protocolVersion === 'v1' || !l.protocolVersion).length;

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${(l.protocolVersion || 'v1').toUpperCase()}] [${l.direction.toUpperCase()}] ${l.rawJson}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onSendCustomCommand(customInput);
  };

  const handlePresetSelect = (presetType: string) => {
    if (presetType === 'sv2_setup') {
      setCustomInput(JSON.stringify({
        protocolVersion: 'v2',
        msgType: 'SetupConnection',
        extension_type: 0,
        min_version: 2,
        max_version: 2,
        flags: 1, // REQUIRES_NOISE
        vendor: 'CryptoMiner/3.0.0'
      }, null, 2));
    } else if (presetType === 'sv2_channel') {
      setCustomInput(JSON.stringify({
        protocolVersion: 'v2',
        msgType: 'OpenStandardMiningChannel',
        request_id: 1,
        user_identity: 'macro_dev.worker1',
        nominal_hash_rate: 18500000.0,
        target: '0x0000000000ffff000000000000000000'
      }, null, 2));
    } else if (presetType === 'sv2_share') {
      setCustomInput(JSON.stringify({
        protocolVersion: 'v2',
        msgType: 'SubmitSharesStandard',
        channel_id: 1,
        sequence_number: 1042,
        nonce: '00a3f89d',
        ntime: Math.floor(Date.now() / 1000)
      }, null, 2));
    } else if (presetType === 'sv2_template') {
      setCustomInput(JSON.stringify({
        protocolVersion: 'v2',
        msgType: 'AllocateMiningJobToken',
        job_declarator_host: 'jd.braiins.com',
        coinbase_output_max_additional_size: 100
      }, null, 2));
    } else if (presetType === 'sv1_sub') {
      setCustomInput('{"id": 1, "method": "mining.subscribe", "params": ["CryptoMiner/3.0.0"]}');
    } else if (presetType === 'sv1_auth') {
      setCustomInput('{"id": 2, "method": "mining.authorize", "params": ["macro_dev.worker1", "x"]}');
    }
  };

  return (
    <div id="stratum-console-view" className="space-y-6">
      
      {/* Header Banner with Stratum v2 Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              Stratum Protocol Terminal (v1 JSON-RPC & v2 Binary Stream)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect Noise_NX handshake, binary header framing, sub-channel multiplexing, and JSON-RPC message logs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Version Filter */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setVersionFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  versionFilter === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVersionFilter('v2')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  versionFilter === 'v2' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3 text-emerald-300" />
                <span>Sv2 Binary ({sv2Count})</span>
              </button>
              <button
                onClick={() => setVersionFilter('v1')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  versionFilter === 'v1' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sv1 RPC ({sv1Count})
              </button>
            </div>

            {/* Direction Filter Pills */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              {(['all', 'sent', 'received', 'system'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setFilter(dir)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    filter === dir ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyLogs}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Copy Logs"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClearLogs}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Clear Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stratum v2 Active Capabilities Pill Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">Noise_NX Cipher</span>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/30 font-bold">
              ChaChaPoly1305 AEAD
            </span>
          </div>

          <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-semibold">Binary Compression</span>
            </div>
            <span className="bg-cyan-500/10 text-cyan-400 font-mono text-[10px] px-2 py-0.5 rounded-md border border-cyan-500/30 font-bold">
              78.4% Bandwidth Saved
            </span>
          </div>

          <div className="bg-slate-950/80 border border-purple-500/20 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 font-semibold">Header-Only Mining</span>
            </div>
            <span className="bg-purple-500/10 text-purple-400 font-mono text-[10px] px-2 py-0.5 rounded-md border border-purple-500/30 font-bold">
              Sub-Channels Active
            </span>
          </div>
        </div>
      </div>

      {/* Terminal View Body */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-4 font-mono text-xs text-slate-300 space-y-3">
        <div className="h-[420px] overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => {
              const isSv2 = log.protocolVersion === 'v2';
              return (
                <div
                  key={`${log.id || 'log'}_${index}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSv2
                      ? log.direction === 'sent'
                        ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300'
                        : log.direction === 'received'
                        ? 'bg-slate-900/90 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-900/40 border-amber-500/30 text-amber-300'
                      : log.direction === 'sent'
                      ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                      : log.direction === 'received'
                      ? 'bg-slate-900/90 border-indigo-900/50 text-indigo-300'
                      : 'bg-slate-900/40 border-slate-800 text-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-2 font-bold flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {log.direction === 'sent' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                      ) : log.direction === 'received' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      )}

                      <span className="uppercase tracking-wider">{log.direction}</span>

                      {/* Stratum Version Badge */}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        isSv2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isSv2 ? 'STRATUM V2 (BINARY)' : 'STRATUM V1 (JSON-RPC)'}
                      </span>

                      {/* Message Type / Method */}
                      {(log.msgType || log.method) && (
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-white font-mono">
                          {log.msgType || log.method}
                        </span>
                      )}

                      {/* Channel ID */}
                      {log.channelId !== undefined && (
                        <span className="bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded text-[10px] border border-purple-500/30">
                          CH #{log.channelId}
                        </span>
                      )}

                      {/* Noise Status */}
                      {isSv2 && (
                        <span className="bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border border-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          <span>NOISE_NX</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      {log.bytesCount && (
                        <span className="text-[10px] text-slate-400">{log.bytesCount} B</span>
                      )}
                      <span>{log.timestamp}</span>
                    </div>
                  </div>

                  {/* Binary Frame Header Preview if Sv2 */}
                  {isSv2 && log.binaryHeaderHex && (
                    <div className="mb-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] text-slate-400 space-y-1">
                      <div className="flex items-center justify-between text-slate-300 font-bold">
                        <span>Binary Frame Header (Sv2 Protocol)</span>
                        <span className="text-cyan-400 font-mono">0x{log.msgTypeId !== undefined ? log.msgTypeId.toString(16).padStart(2, '0') : '00'}</span>
                      </div>
                      <div className="font-mono text-emerald-400 break-all">
                        HEADER: {log.binaryHeaderHex} {log.binaryPayloadHex ? `| PAYLOAD: ${log.binaryPayloadHex}` : ''}
                      </div>
                    </div>
                  )}

                  <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap font-mono text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-900">
                    {log.rawJson}
                  </pre>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs">
              No stratum messages logged for direction "{filter}" and version "{versionFilter}".
            </div>
          )}
        </div>

        {/* Custom Command Preset Dropdown & Input */}
        <div className="pt-3 border-t border-slate-900 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Send Custom Stratum Message Frame:</span>
            <div className="flex gap-2">
              <span className="text-slate-500">Presets:</span>
              <button onClick={() => handlePresetSelect('sv2_setup')} className="text-emerald-400 hover:underline">Sv2 SetupConnection</button>
              <span>•</span>
              <button onClick={() => handlePresetSelect('sv2_channel')} className="text-cyan-400 hover:underline">Sv2 OpenChannel</button>
              <span>•</span>
              <button onClick={() => handlePresetSelect('sv2_share')} className="text-purple-400 hover:underline">Sv2 SubmitShare</button>
              <span>•</span>
              <button onClick={() => handlePresetSelect('sv1_sub')} className="text-indigo-400 hover:underline">Sv1 Subscribe</button>
            </div>
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder='{"protocolVersion": "v2", "msgType": "SetupConnection", ...}'
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Frame</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

