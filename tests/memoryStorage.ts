/**
 * Minimal in-memory Storage for tests. `failAfter` makes setItem throw after n writes;
 * `capacity` makes it throw, like a browser's quota, when the stored keys and values would exceed
 * that many characters (so writes that shrink the total still succeed).
 */
export class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  writes = 0
  failAfter: number
  capacity = Infinity
  constructor(failAfter = Infinity) {
    this.failAfter = failAfter
  }
  /** Characters currently stored (keys plus values). */
  get used() {
    let n = 0
    for (const [k, v] of this.data) n += k.length + v.length
    return n
  }
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    if (this.writes >= this.failAfter) throw new Error('QuotaExceededError')
    const after = this.used - (this.data.get(key)?.length ?? -key.length) + value.length
    if (after > this.capacity) throw new DOMException('Quota exceeded', 'QuotaExceededError')
    this.writes++
    this.data.set(key, value)
  }
  keys() {
    return [...this.data.keys()]
  }
}
