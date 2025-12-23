import dgram from 'node:dgram';
import * as Utils from '@/osc/osc_utils.ts';
import { type OSCMessage } from './osc_utils.ts';

export class OSCSocket {

  private readonly socket: dgram.Socket;
  private readonly targetHost: string;
  private readonly targetPort: number;

  constructor(address: string, port: number) {
    const socket = dgram.createSocket('udp4');
    this.socket = socket;
    this.targetHost = address;
    this.targetPort = port;
    socket.bind();
  }

  send(address: string, value: number): void {
    const addressBytes = Utils.encodeString(address);
    const typeTag = new Uint8Array([0x2C, 0x69, 0x0, 0x0]); // ',i  '
    const argument = Utils.bigEndianInteger(value);
    const payload = Utils.concatBytes(addressBytes, typeTag, argument);
    this.socket.send(payload, 0, payload.length, this.targetPort, this.targetHost, (e) => {
      console.error(e);
    });
  }

  onMessage(listener: (message: OSCMessage) => void) {
    this.socket.on('message', (msg, _remote) => {
      const oscMessage = Utils.parseOSCMessage(msg);
      listener(oscMessage);
    })
  }
}