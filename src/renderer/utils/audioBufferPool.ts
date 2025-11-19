/**
 * Audio Buffer Pool
 * Efficient audio buffer management with pooling and reuse
 */

export interface BufferPoolStats {
  totalBuffers: number;
  availableBuffers: number;
  inUseBuffers: number;
  totalMemory: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export class AudioBufferPool {
  private pools: Map<string, Float32Array[]> = new Map();
  private inUse: Set<Float32Array> = new Set();
  private maxPoolSize: number = 100;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxPoolSize: number = 100) {
    this.maxPoolSize = maxPoolSize;
  }

  /**
   * Get a buffer from the pool or create a new one
   */
  acquire(size: number): Float32Array {
    const key = this.getKey(size);
    const pool = this.pools.get(key);

    if (pool && pool.length > 0) {
      const buffer = pool.pop()!;
      this.inUse.add(buffer);
      this.hits++;
      buffer.fill(0); // Clear the buffer
      return buffer;
    }

    this.misses++;
    const buffer = new Float32Array(size);
    this.inUse.add(buffer);
    return buffer;
  }

  /**
   * Return a buffer to the pool
   */
  release(buffer: Float32Array): void {
    if (!this.inUse.has(buffer)) {
      console.warn('Attempting to release buffer not acquired from pool');
      return;
    }

    this.inUse.delete(buffer);

    const key = this.getKey(buffer.length);
    let pool = this.pools.get(key);

    if (!pool) {
      pool = [];
      this.pools.set(key, pool);
    }

    if (pool.length < this.maxPoolSize) {
      pool.push(buffer);
    }
  }

  /**
   * Get key for buffer size
   */
  private getKey(size: number): string {
    return `size_${size}`;
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.pools.clear();
    this.inUse.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Clear specific size pool
   */
  clearPool(size: number): void {
    const key = this.getKey(size);
    this.pools.delete(key);
  }

  /**
   * Get pool statistics
   */
  getStats(): BufferPoolStats {
    let totalBuffers = 0;
    let availableBuffers = 0;
    let totalMemory = 0;

    this.pools.forEach((pool, key) => {
      const size = parseInt(key.split('_')[1]);
      availableBuffers += pool.length;
      totalBuffers += pool.length;
      totalMemory += pool.length * size * 4; // 4 bytes per float32
    });

    const inUseBuffers = this.inUse.size;
    totalBuffers += inUseBuffers;

    this.inUse.forEach((buffer) => {
      totalMemory += buffer.length * 4;
    });

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    return {
      totalBuffers,
      availableBuffers,
      inUseBuffers,
      totalMemory,
      hits: this.hits,
      misses: this.misses,
      hitRate,
    };
  }

  /**
   * Optimize pools by removing unused buffers
   */
  optimize(): void {
    // Remove pools that haven't been used
    this.pools.forEach((pool, key) => {
      // Keep only recently used pools
      if (pool.length === 0) {
        this.pools.delete(key);
      } else if (pool.length > this.maxPoolSize / 2) {
        // Trim oversized pools
        pool.length = Math.floor(this.maxPoolSize / 2);
      }
    });
  }

  /**
   * Pre-allocate buffers for common sizes
   */
  preallocate(sizes: number[], count: number = 10): void {
    sizes.forEach((size) => {
      const key = this.getKey(size);
      let pool = this.pools.get(key);

      if (!pool) {
        pool = [];
        this.pools.set(key, pool);
      }

      while (pool.length < count) {
        pool.push(new Float32Array(size));
      }
    });
  }
}

// Singleton instance
let globalPool: AudioBufferPool | null = null;

export function getAudioBufferPool(): AudioBufferPool {
  if (!globalPool) {
    globalPool = new AudioBufferPool();

    // Pre-allocate common sizes
    globalPool.preallocate([128, 256, 512, 1024, 2048, 4096], 5);
  }
  return globalPool;
}

export function resetAudioBufferPool(): void {
  if (globalPool) {
    globalPool.clear();
  }
  globalPool = null;
}
