/**
 * ArrayBufferからエンコーディングを自動検出し、UTF-8文字列にデコードする。
 * 外部ライブラリ不要。ブラウザ標準のTextDecoderのみ使用。
 *
 * 方式: UTF-8でfatalデコードを試み、失敗したらShift_JIS等を試す。
 *
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function decodeBuffer(buffer) {
  const uint8Array = new Uint8Array(buffer)

  // BOM検出
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(uint8Array)
  }
  if (uint8Array.length >= 2 && uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
    return new TextDecoder('utf-16le').decode(uint8Array)
  }
  if (uint8Array.length >= 2 && uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
    return new TextDecoder('utf-16be').decode(uint8Array)
  }

  // UTF-8としてデコードを試みる（fatal: trueで不正バイトがあればエラー）
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(uint8Array)
  } catch (e) {
    // UTF-8ではない → Shift_JISを試す
  }

  try {
    return new TextDecoder('shift_jis').decode(uint8Array)
  } catch (e) {
    // Shift_JISでも失敗 → EUC-JPを試す
  }

  try {
    return new TextDecoder('euc-jp').decode(uint8Array)
  } catch (e) {
    // 最終フォールバック: UTF-8（非fatal）
  }

  return new TextDecoder('utf-8').decode(uint8Array)
}
