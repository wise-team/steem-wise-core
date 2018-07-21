import { SteemTransaction } from "../../blockchain/SteemTransaction";
import { SmartvotesOperation } from "../SmartvotesOperation";
import { EffectuatedSmartvotesOperation } from "../EffectuatedSmartvotesOperation";

export interface ProtocolVersionHandler {
  handleOrReject: (tx: SteemTransaction) => EffectuatedSmartvotesOperation [] | undefined;
  serializeToBlockchain: (op: SmartvotesOperation) => [string, object][];
}
