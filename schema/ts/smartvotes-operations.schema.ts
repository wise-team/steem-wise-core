/**
 * These are the interfaces for smartvotes custom_json commands formatting.
 * Such formatted commands are then sent or received to/from steem blockchain.
 * NOTICE: Smartvotes interfaces are under early development. They may change over time.
 */

export interface SmartvotesCustomJSON {
    smartvotes_command_type: string;
    command: SmartvotesCommand;
}

/**
 * Commands definitions:
 */

export interface SmartvotesCommand {

}

export interface SetRulesSmartvotesCommand extends SmartvotesCommand {
   [index: number]: SmartvotesRule;
}


/**
 * Rules definitions:
 */

export interface SmartvotesRule {
    type: string;
    voter: string;
    total_weight: number;
}
