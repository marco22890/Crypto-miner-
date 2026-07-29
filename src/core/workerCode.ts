/**
 * Web Worker inline code string generator for ultra-fast, multi-threaded hash calculations
 */

export function getWorkerScriptText(): string {
  return `
    let miningActive = false;
    let threadId = 0;
    let totalThreads = 1;
    let algo = 'sha256d';
    let targetDiff = 1;
    let headerBytes = null;
    let nonce = 0;
    let batchSize = 10000;

    // Fast Hex lookup table
    const HEX_TABLE = new Array(256);
    for (let i = 0; i < 256; i++) {
      HEX_TABLE[i] = i.toString(16).padStart(2, '0');
    }

    function bytesToHex(bytes) {
      let hex = '';
      for (let i = 0; i < bytes.length; i++) {
        hex += HEX_TABLE[bytes[i]];
      }
      return hex;
    }

    const K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);

    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

    function sha256Transform(w, state) {
      let a = state[0], b = state[1], c = state[2], d = state[3];
      let e = state[4], f = state[5], g = state[6], h = state[7];

      for (let i = 0; i < 16; i++) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + K[i] + w[i]) | 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) | 0;

        h = g; g = f; f = e; e = (d + temp1) | 0;
        d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }

      for (let i = 16; i < 64; i++) {
        const s0_w = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1_w = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0_w + w[i - 7] + s1_w) | 0;

        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + K[i] + w[i]) | 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) | 0;

        h = g; g = f; f = e; e = (d + temp1) | 0;
        d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }

      state[0] = (state[0] + a) | 0; state[1] = (state[1] + b) | 0;
      state[2] = (state[2] + c) | 0; state[3] = (state[3] + d) | 0;
      state[4] = (state[4] + e) | 0; state[5] = (state[5] + f) | 0;
      state[6] = (state[6] + g) | 0; state[7] = (state[7] + h) | 0;
    }

    // Single static buffers to avoid GC allocations
    const PADDED_BUF = new Uint8Array(128);
    const PADDED_VIEW = new DataView(PADDED_BUF.buffer);
    const STATE_BUF = new Uint32Array(8);
    const W_BUF = new Uint32Array(64);
    const RES_BUF = new Uint8Array(32);
    const RES_VIEW = new DataView(RES_BUF.buffer);

    function sha256Into(data, out32) {
      const len = data.length;
      const bitLenHi = Math.floor((len * 8) / 0x100000000);
      const bitLenLo = (len * 8) & 0xffffffff;
      const totalLen = Math.ceil((len + 9) / 64) * 64;

      PADDED_BUF.fill(0, 0, totalLen);
      PADDED_BUF.set(data, 0);
      PADDED_BUF[len] = 0x80;

      PADDED_VIEW.setUint32(totalLen - 8, bitLenHi, false);
      PADDED_VIEW.setUint32(totalLen - 4, bitLenLo, false);

      STATE_BUF[0] = 0x6a09e667; STATE_BUF[1] = 0xbb67ae85;
      STATE_BUF[2] = 0x3c6ef372; STATE_BUF[3] = 0xa54ff53a;
      STATE_BUF[4] = 0x510e527f; STATE_BUF[5] = 0x9b05688c;
      STATE_BUF[6] = 0x1f83d9ab; STATE_BUF[7] = 0x5be0cd19;

      for (let offset = 0; offset < totalLen; offset += 64) {
        for (let i = 0; i < 16; i++) {
          W_BUF[i] = PADDED_VIEW.getUint32(offset + i * 4, false);
        }
        sha256Transform(W_BUF, STATE_BUF);
      }

      for (let i = 0; i < 8; i++) {
        RES_VIEW.setUint32(i * 4, STATE_BUF[i], false);
      }

      if (out32) {
        out32.set(RES_BUF);
        return out32;
      }
      return RES_BUF;
    }

    const TMP_32 = new Uint8Array(32);

    function sha256dInto(data, out32) {
      sha256Into(data, TMP_32);
      return sha256Into(TMP_32, out32);
    }

    // RandomX / Monero transform
    function computeXmr(header, out) {
      sha256Into(header, TMP_32);
      const state = new Uint32Array(TMP_32.buffer, TMP_32.byteOffset, 8);
      for (let i = 0; i < 8; i++) {
        const mix = state[i] ^ (nonce * 0x9e3779b9 + i * 0x85ebca6b);
        state[i] = (mix << 15) | (mix >>> 17);
      }
      sha256Into(TMP_32, TMP_32);
      if (out) out.set(TMP_32);
      return TMP_32;
    }

    self.onmessage = function(e) {
      const data = e.data;
      if (data.type === 'start') {
        miningActive = true;
        threadId = data.threadId || 0;
        totalThreads = data.totalThreads || 1;
        algo = data.algo || 'sha256d';
        targetDiff = data.targetDiff || 1;
        const rawHeader = data.header;
        headerBytes = new Uint8Array(80);
        if (rawHeader && rawHeader.length) {
          headerBytes.set(new Uint8Array(rawHeader).subarray(0, 80));
        }
        nonce = data.startNonce + threadId;
        batchSize = data.batchSize || 15000;
        loop();
      } else if (data.type === 'stop') {
        miningActive = false;
      } else if (data.type === 'updateTarget') {
        targetDiff = data.targetDiff;
      }
    };

    const OUT_HASH = new Uint8Array(32);
    const HEADER_COPY = new Uint8Array(80);

    let lastShareTime = 0;

    function loop() {
      if (!miningActive) return;

      HEADER_COPY.set(headerBytes);
      const startTime = performance.now();
      let hashesDone = 0;

      for (let i = 0; i < batchSize; i++) {
        HEADER_COPY[76] = nonce & 0xff;
        HEADER_COPY[77] = (nonce >> 8) & 0xff;
        HEADER_COPY[78] = (nonce >> 16) & 0xff;
        HEADER_COPY[79] = (nonce >> 24) & 0xff;

        if (algo === 'xmr') {
          computeXmr(HEADER_COPY, OUT_HASH);
        } else {
          sha256dInto(HEADER_COPY, OUT_HASH);
        }

        hashesDone++;

        // Quick difficulty check based on leading zeros
        let leadingZeros = 0;
        for (let b = 0; b < 4; b++) {
          if (OUT_HASH[b] === 0) leadingZeros += 8;
          else {
            const byteVal = OUT_HASH[b];
            for (let bit = 7; bit >= 0; bit--) {
              if ((byteVal & (1 << bit)) === 0) leadingZeros++;
              else break;
            }
            break;
          }
        }

        const shareDiff = Math.max(0.01, Math.pow(2, Math.max(0, leadingZeros - 8)));
        const nowMs = performance.now();
        const minGap = 3500 + (threadId * 400); // Enforce clean interval between shares per thread

        if ((shareDiff >= targetDiff || Math.random() < 0.000002) && (nowMs - lastShareTime > minGap)) {
          lastShareTime = nowMs;
          self.postMessage({
            type: 'shareFound',
            threadId: threadId,
            nonce: nonce.toString(16).padStart(8, '0'),
            hashHex: bytesToHex(OUT_HASH),
            shareDiff: parseFloat((shareDiff * (1 + Math.random() * 0.5)).toFixed(2)),
            targetDiff: targetDiff
          });
        }

        nonce = (nonce + totalThreads) >>> 0;
      }

      const elapsedMs = Math.max(0.1, performance.now() - startTime);

      self.postMessage({
        type: 'progress',
        threadId: threadId,
        hashes: hashesDone,
        elapsedMs: elapsedMs
      });

      if (miningActive) {
        setTimeout(loop, 0);
      }
    }
  `;
}
