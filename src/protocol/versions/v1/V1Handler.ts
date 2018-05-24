import { ProtocolVersionHandler } from "../ProtocolVersionHandler";
import { SteemOperation } from "../../SteemOperation";
import { SmartvotesOperation } from "../../current/SmartvotesOperation";
import { CustomJsonOperation } from "./blockchain-operations-types";

import * as ajv from "ajv";
import * as schemaJSON from "./smartvotes.schema.json";

export class V1Handler implements ProtocolVersionHandler {
    public handleOrReject(op: SteemOperation): SmartvotesOperation | undefined {
        if (op.block_num > 22710498) return undefined; // this protocol version is disabled for new transactions

        if (op.op[0] != "custom_json" || (op.op[1] as CustomJsonOperation).id != "smartvote") return undefined;

        const jsonObj = JSON.parse((op.op[1] as CustomJsonOperation).json);
        if (!this.validateJSON(jsonObj)) return undefined;

        return undefined;
    }

    private validateJSON(input: object): boolean {
        const aajv: ajv.Ajv = new ajv();
        aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

        const validate = aajv.compile(schemaJSON);
        return validate(input) as boolean;
    }
}