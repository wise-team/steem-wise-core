/**
 * These are the interfaces for smartvotes custom_json commands formatting.
 * Such formatted commands are then sent or received to/from steem blockchain.
 * NOTICE: Smartvotes interfaces are under early development. They may change over time.
 */

interface SmartvotesCustomJSON {
    smartvotes_command_type: string,
    command: SmartvotesCommand
}

/**
 * Commands definitions:
 */

interface SmartvotesCommand {

}

interface SmartvotesCommand_setRules {
   [index: number]: SmartvotesRule
}


/**
 * Rules definitions:
 */

interface SmartvotesRule {
    type: string,
    voter: string,
    total_weight: number
}
