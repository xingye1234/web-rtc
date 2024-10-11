import { Peer } from "peerjs";

export type PeerObj = Peer | null;

let peer: PeerObj = null;

if (!peer) {
  peer = new Peer();
}

export { peer };
