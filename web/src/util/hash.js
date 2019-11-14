export default function simpleHash(data, modValue = 0x10000) {
  return data.reduce((a, x) => (Math.imul(a, 31) + x), 0) % modValue;
}