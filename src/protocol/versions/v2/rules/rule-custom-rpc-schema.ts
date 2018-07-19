/* tslint:disable class-name */

import { CustomRPCRule } from "../../../../rules/CustomRPCRule";

export interface wise_rule_custom_rpc {
    rule: "custom_rpc";
    host: string;
    port: number;
    path: string;
    method: string;
}

export function wise_rule_custom_rpc_encode(r: CustomRPCRule): wise_rule_custom_rpc {
    const out: wise_rule_custom_rpc = {
        rule: "custom_rpc",
        host: (r as CustomRPCRule).host,
        port: (r as CustomRPCRule).port,
        path: (r as CustomRPCRule).path,
        method: (r as CustomRPCRule).method,
    };
    return out;
}

export function wise_rule_custom_rpc_decode(r: wise_rule_custom_rpc): CustomRPCRule  {
    return new CustomRPCRule(r.host, r.port, r.path, r.method);
}
