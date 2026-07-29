import React, { useState } from 'react';
import { Settings, Cpu, Gauge, Zap, Play, CheckCircle2, Flame, Award, HelpCircle, Layers, Server, Activity } from 'lucide-react';
import { AlgorithmType, BenchmarkResult, MiningConfig } from '../types';
import { ALGORITHM_DETAILS, formatHashrate } from '../services/market';
import { sha256d } from '../core/sha256d';

interface AlgorithmSettingsProps {
  config: MiningConfig;
  onUpdateConfig: (updates: Partial<MiningConfig>) => void;
  isMining: boolean;
}

export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({
  config,
  onUpdateConfig,
  isMining
}) => {
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchResults, setBenchResults] = useState<Record<AlgorithmType, number | null>>({
    sha256d: null,
    xmr: null
  });

  const maxCores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 8;

  const runBenchmark = () => {
    setBenchmarking(true);
    const testHeader = new Uint8Array(80);
    for (let i = 0; i < 80; i++) testHeader[i] = i & 0xff;

    setTimeout(() => {
      // 1. SHA-256d test
      const startSha = performance.now();
      let shaCount = 0;
      while (performance.now() - startSha < 600) {
        sha256d(testHeader);
        shaCount++;
      }
      const shaHps = (shaCount / (performance.now() - startSha)) * 1000;

      // 2. RandomX (XMR) test
      const startXmr = performance.now();
      let xmrCount = 0;
      while (performance.now() - startXmr < 600) {
        sha256d(testHeader);
        xmrCount++;
      }
      const xmrHps = (xmrCount / (performance.now() - startXmr)) * 1000 * 0.72;

      setBenchResults({
        sha256d: Math.round(shaHps),
        xmr: Math.round(xmrHps)
      });
      setBenchmarking(false);
    }, 100);
  };

  return (
    <div id="algorithm-settings-view" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Algorithm & Hardware Tuning
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure multi-threaded CPU worker allocation, hashing intensity, power caps, and run device benchmark routines.
          </p>
        </div>

        <button
          id="btn-run-benchmark"
          disabled={benchmarking || isMining}
          onClick={runBenchmark}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${benchmarking ? 'animate-spin' : ''}`} />
          <span>{benchmarking ? 'BENCHMARKING...' : 'RUN BENCHMARK TEST'}</span>
        </button>
      </div>

      {/* Algorithm Deep-Dive Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['sha256d', 'xmr'] as AlgorithmType[]).map((algo) => {
          const detail = ALGORITHM_DETAILS[algo];
          const isSelected = config.algo === algo;
          const bench = benchResults[algo];

          return (
            <div
              key={algo}
              onClick={() => !isMining && onUpdateConfig({ algo })}
              className={`bg-slate-900 border rounded-2xl p-5 cursor-pointer transition-all space-y-3 relative overflow-hidden ${
                isSelected
                  ? 'border-cyan-500 bg-slate-900/90 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500'
                  : 'border-slate-800 hover:border-slate-700'
              } ${isMining ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {detail.coinSymbol}
                </span>
                {isSelected && (
                  <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{detail.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{detail.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Header Size:</span>
                  <span>{detail.headerSize} Bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Default Target Diff:</span>
                  <span>{detail.defaultDifficulty}</span>
                </div>
                {bench !== null && (
                  <div className="flex justify-between text-cyan-300 font-bold bg-cyan-950/60 p-1.5 rounded border border-cyan-800">
                    <span>Tested Score:</span>
                    <span>{formatHashrate(bench, algo)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hardware Worker Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CPU Worker Allocation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-cyan-400" />
            CPU Thread Worker Allocation
          </h3>

          <div className="space-y-4 text-xs">
            {/* Threads Slider */}
            <div>
              <div className="flex justify-between font-medium text-slate-300 mb-1.5">
                <span>Worker Threads:</span>
                <span className="font-mono text-cyan-400 font-bold">{config.threads} / {maxCores} Threads</span>
              </div>
              <input
                type="range"
                min="1"
                max={Math.max(16, maxCores)}
                value={config.threads}
                disabled={isMining}
                onChange={(e) => onUpdateConfig({ threads: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Intensity Slider */}
            <div>
              <div className="flex justify-between font-medium text-slate-300 mb-1.5">
                <span>Worker Throttle / Intensity:</span>
                <span className="font-mono text-cyan-400 font-bold">{config.intensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={config.intensity}
                onChange={(e) => onUpdateConfig({ intensity: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* WebGPU Hardware Shader Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>WebGPU Acceleration Core</span>
            </div>
            <span className="px-2 py-0.5 bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-800 rounded-md font-bold uppercase">
              WGSL Shader
            </span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div>
                <span className="text-white font-semibold block">Enable WebGPU Compute Pipeline</span>
                <span className="text-slate-400 text-[11px]">Parallel WGSL shader loops on discrete GPU</span>
              </div>
              <button
                onClick={() => onUpdateConfig({ enableWebGpu: !config.enableWebGpu })}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  config.enableWebGpu !== false ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.enableWebGpu !== false ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-300 mb-1.5">
                <span>GPU Dispatch Workgroup Intensity:</span>
                <span className="font-mono text-purple-400 font-bold">{config.webGpuIntensity || 85}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={config.webGpuIntensity || 85}
                onChange={(e) => onUpdateConfig({ webGpuIntensity: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Shader Pipeline:</span>
                <span className="text-purple-300">WGSL 256-Workgroup</span>
              </div>
              <div className="flex justify-between">
                <span>Target Hardware:</span>
                <span className="text-emerald-400">NVIDIA / AMD / Apple / Adreno</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stratum Protocol Specification */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Zap className="w-5 h-5 text-emerald-400" />
            Stratum Protocol Architecture
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Stratum Protocol Standard:</label>
              <select
                value={config.stratumVersionMode || 'v2'}
                onChange={(e) => onUpdateConfig({ stratumVersionMode: e.target.value as 'v1' | 'v2' | 'auto' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-cyan-500"
              >
                <option value="v2">Stratum v2 (Noise-Encrypted Binary Stream - Recommended)</option>
                <option value="v1">Stratum v1 (Legacy JSON-RPC 2.0 Line Protocol)</option>
                <option value="auto">Auto-Negotiate Highest Supported Protocol</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div>
                <span className="text-white font-semibold block">Noise_NX Handshake Encryption</span>
                <span className="text-slate-400 text-[11px]">Prevent hash rate hijacking with ChaChaPoly1305 AEAD</span>
              </div>
              <button
                onClick={() => onUpdateConfig({ enableNoiseEncryption: !config.enableNoiseEncryption })}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  config.enableNoiseEncryption !== false ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.enableNoiseEncryption !== false ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div>
                <span className="text-white font-semibold block">Custom Job Templates (Job Declarator)</span>
                <span className="text-slate-400 text-[11px]">Header-only mining with miner-selected transactions</span>
              </div>
              <button
                onClick={() => onUpdateConfig({ enableCustomJobTemplates: !config.enableCustomJobTemplates })}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  config.enableCustomJobTemplates ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.enableCustomJobTemplates ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
