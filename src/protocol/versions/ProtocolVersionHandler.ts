import { SteemTransaction } from "../../blockchain/SteemTransaction";
import { WiseOperation } from "../WiseOperation";
import { EffectuatedWiseOperation } from "../EffectuatedWiseOperation";

export interface ProtocolVersionHandler {
  handleOrReject: (tx: SteemTransaction) => EffectuatedWiseOperation [] | undefined;
  serializeToBlockchain: (op: WiseOperation) => [string, object][];
}
