import * as steem from "steem";
import { WiseOperation } from "../WiseOperation";
import { EffectuatedWiseOperation } from "../EffectuatedWiseOperation";
import { UnifiedSteemTransaction } from "steem-efficient-stream";

export interface ProtocolVersionHandler {
  handleOrReject: (tx: UnifiedSteemTransaction) => EffectuatedWiseOperation [] | undefined;
  serializeToBlockchain: (op: WiseOperation) => steem.OperationWithDescriptor[];
}
