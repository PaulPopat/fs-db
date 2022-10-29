const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function Encode(data: string) {
  return encoder.encode(data);
}

export function Decode(data: Uint8Array) {
  return decoder.decode(data);
}
