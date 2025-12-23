export function bigEndianInteger(input: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, input, false);
  return new Uint8Array(buffer);
}

export function parseFloat(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer);
  return view.getFloat32(0, false);
}

export function encodeString(input: string): Uint8Array {
  const encoded = new TextEncoder().encode(input);
  const requiredLength = encoded.length + ((encoded.length + 1) % 4)
  const result = new Uint8Array(requiredLength);
  result.set(encoded);
  return result;
}

export function concatBytes(...byteArrays: Uint8Array[]): Uint8Array {
  const totalLength = byteArrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const a of byteArrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

export type OSCMessage = {
  address: string;
  payload: number;
}

export function parseOSCMessage(bytes: Uint8Array): OSCMessage {
  const typeTagStartIndex = bytes.indexOf(0x2C);
  const address = new TextDecoder().decode(bytes.slice(0, typeTagStartIndex));
  const payloadStartIndex = typeTagStartIndex + 3;
  const argBytes = bytes.slice(payloadStartIndex, payloadStartIndex + 4);
  if (argBytes.length != 4) {
    throw new Error('payload incorrectly formatted');
  }

  return {
    address: address,
    payload: parseFloat(argBytes)
  }
}