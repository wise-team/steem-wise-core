import { SteemOperation } from "../../blockchain/SteemOperation";
import { SmartvotesOperation } from "../SmartvotesOperation";
import { EffectuatedSmartvotesOperation } from "../EffectuatedSmartvotesOperation";

export interface ProtocolVersionHandler {
  handleOrReject: (op: SteemOperation) => EffectuatedSmartvotesOperation [] | undefined;
  serializeToBlockchain: (op: SmartvotesOperation) => [string, object][];
}
