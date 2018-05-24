import { SteemOperation } from "../SteemOperation";
import { SmartvotesOperation } from "../current/SmartvotesOperation";

export interface ProtocolVersionHandler {
  handleOrReject: (op: SteemOperation) => SmartvotesOperation | undefined;
}
