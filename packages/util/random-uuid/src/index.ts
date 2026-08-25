/**
 * RFC 4122 UUID v4 generation backed by Web Crypto entropy without requiring
 * the secure-context-only `crypto.randomUUID()` convenience method.
 * @module @deepseek-ai/dsh-random-uuid
 */

/**
 * Generate an RFC 4122 version 4 UUID in browsers and Node runtimes that expose
 * `crypto.getRandomValues()`.
 * @returns A lowercase UUID v4 string.
 */
export function randomUuid(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x40)
  view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80)
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
