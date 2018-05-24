import { SteemOperation } from "../SteemOperation";
import { SmartvotesOperation } from "../SmartvotesOperation";

export interface ProtocolVersionHandler {
  handleOrReject: (op: SteemOperation) => SmartvotesOperation [] | undefined;
}
