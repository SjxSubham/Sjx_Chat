/**
 * Utility helpers shared across the screen share feature for performing
 * AES-GCM based crypto transformations in both browser and Node runtimes.
 *
 * The functions in this module intentionally avoid any framework-specific
 * imports so they can be consumed by hooks, components, or even worker
 * contexts without duplication.
 */

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const polyfillAtob = (input = "") => {
  let str = "";
  let i = 0;
  let enc1;
  let enc2;
  let enc3;
  let enc4;

  input = String(input).replace(/=+$/, "");

  if (input.length % 4 === 1) {
    throw new Error("Invalid base64 string.");
  }

  while (i < input.length) {
    enc1 = BASE64_ALPHABET.indexOf(input.charAt(i++));
    enc2 = BASE64_ALPHABET.indexOf(input.charAt(i++));
    enc3 = BASE64_ALPHABET.indexOf(input.charAt(i++));
    enc4 = BASE64_ALPHABET.indexOf(input.charAt(i++));

    if ([enc1, enc2, enc3, enc4].some((enc) => enc === -1)) {
      throw new Error("Invalid base64 string.");
    }

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    str += String.fromCharCode(chr1);

    if (enc3 !== 64) {
      str += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      str += String.fromCharCode(chr3);
    }
  }

  return str;
};

const polyfillBtoa = (input = "") => {
  let output = "";
  let i = 0;

  while (i < input.length) {
    const chr1 = input.charCodeAt(i++);
    const chr2 = input.charCodeAt(i++);
    const chr3 = input.charCodeAt(i++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = Number.isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = Number.isNaN(chr3) ? 64 : chr3 & 63;

    output += BASE64_ALPHABET.charAt(enc1);
    output += BASE64_ALPHABET.charAt(enc2);
    output += BASE64_ALPHABET.charAt(enc3);
    output += BASE64_ALPHABET.charAt(enc4);
  }

  return output;
};

const getAtob = () => {
  if (typeof atob === "function") return atob;
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.atob === "function"
  )
    return globalThis.atob;
  return polyfillAtob;
};

const getBtoa = () => {
  if (typeof btoa === "function") return btoa;
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.btoa === "function"
  )
    return globalThis.btoa;
  return polyfillBtoa;
};

const getCrypto = () => {
  if (typeof window !== "undefined" && window.crypto) return window.crypto;
  if (typeof globalThis !== "undefined" && globalThis.crypto)
    return globalThis.crypto;
  throw new Error("Crypto API is not available in this environment.");
};

const binaryStringToUint8Array = (binary) => {
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const uint8ArrayToBinaryString = (bytes = new Uint8Array()) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
};

const uint8ArrayToBase64 = (bytes = new Uint8Array()) => {
  if (!bytes || bytes.length === 0) return "";
  const encoder = getBtoa();
  return encoder(uint8ArrayToBinaryString(bytes));
};

/**
 * Determine the best available SubtleCrypto implementation.
 */
const getSubtleCrypto = () => {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.webcrypto) {
    return globalThis.crypto.webcrypto.subtle;
  }
  throw new Error("SubtleCrypto API is not available in this environment.");
};

/**
 * Decode a base64 string into a Uint8Array.
 * @param {string} value
 * @returns {Uint8Array}
 */
export const base64ToUint8Array = (value) => {
  if (!value) return new Uint8Array();
  const decode = getAtob();
  const binaryString = decode(value);
  return binaryStringToUint8Array(binaryString);
};

/**
 * Decode a hex string into a Uint8Array.
 * @param {string} value
 * @returns {Uint8Array}
 */
export const hexToUint8Array = (value) => {
  if (!value) return new Uint8Array();
  const clean = value.replace(/\s+/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return bytes;
};

const uint8ArrayToHex = (bytes = new Uint8Array()) =>
  Array.from(bytes || [], (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );

/**
 * Concatenate multiple Uint8Array instances into one.
 * @param {...Uint8Array} arrays
 * @returns {Uint8Array}
 */
const concatUint8Arrays = (...arrays) => {
  const totalLength = arrays.reduce((acc, arr) => acc + (arr?.length || 0), 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  arrays.forEach((arr) => {
    if (!arr) return;
    result.set(arr, offset);
    offset += arr.length;
  });
  return result;
};

/**
 * Import a base64 encoded AES key for use with the SubtleCrypto API.
 * @param {string} keyBase64
 * @returns {Promise<CryptoKey>}
 */
const importAesKey = async (keyBase64) => {
  const subtle = getSubtleCrypto();
  const keyBytes = base64ToUint8Array(keyBase64);
  return subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
};

/**
 * Decrypt an encrypted screen frame payload produced by the server.
 *
 * @param {Object} encryptedPayload
 * @param {string} encryptedPayload.encryptedData - hex encoded ciphertext
 * @param {string} encryptedPayload.iv - base64 IV (16 bytes)
 * @param {string} encryptedPayload.authTag - base64 auth tag (16 bytes)
 * @param {string} keyBase64 - base64 encoded AES key
 * @param {Object} options
 * @param {"string"|"arrayBuffer"} [options.output="string"] - desired output type
 * @returns {Promise<string|ArrayBuffer|null>}
 */
export const decryptScreenFrame = async (
  encryptedPayload,
  keyBase64,
  { output = "string" } = {},
) => {
  try {
    if (!encryptedPayload || !keyBase64) {
      throw new Error("Missing encrypted payload or key.");
    }

    const { encryptedData, iv, authTag } = encryptedPayload;
    const subtle = getSubtleCrypto();
    const key = await importAesKey(keyBase64);

    const cipherBytes = hexToUint8Array(encryptedData);
    const tagBytes = base64ToUint8Array(authTag);
    const combined = concatUint8Arrays(cipherBytes, tagBytes);

    const decrypted = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToUint8Array(iv),
      },
      key,
      combined,
    );

    if (output === "arrayBuffer") {
      return decrypted;
    }

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("[screenShareCrypto] Decryption failed:", error);
    return null;
  }
};

/**
 * Convenience helper for encrypting frames on the client before sending them
 * to the server (optional double-encryption layer if required).
 *
 * @param {string|ArrayBuffer} data - UTF-8 string or binary frame payload
 * @param {string} keyBase64
 * @returns {Promise<{ encryptedData: string, iv: string, authTag: string }|null>}
 */
export const encryptScreenFrame = async (data, keyBase64) => {
  try {
    if (!data || !keyBase64) {
      throw new Error("Missing data or key.");
    }

    const subtle = getSubtleCrypto();
    const key = await importAesKey(keyBase64);
    const cryptoAPI = getCrypto();
    const ivBytes = cryptoAPI.getRandomValues(new Uint8Array(16));

    let payload = data;
    if (typeof data === "string") {
      payload = new TextEncoder().encode(data);
    } else if (data instanceof ArrayBuffer) {
      payload = new Uint8Array(data);
    }

    const encrypted = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv: ivBytes,
      },
      key,
      payload,
    );

    const encryptedBuffer = new Uint8Array(encrypted);
    const authTagBytes = encryptedBuffer.slice(-16);
    const cipherBytes = encryptedBuffer.slice(0, -16);

    return {
      encryptedData: uint8ArrayToHex(cipherBytes),
      iv: uint8ArrayToBase64(ivBytes),
      authTag: uint8ArrayToBase64(authTagBytes),
    };
  } catch (error) {
    console.error("[screenShareCrypto] Encryption failed:", error);
    return null;
  }
};

export default {
  base64ToUint8Array,
  hexToUint8Array,
  decryptScreenFrame,
  encryptScreenFrame,
};
