import { AbstractLog } from "./AbstractLog";

export class Log extends AbstractLog {
    private static INSTANCE: Log = new Log();

    private constructor() {
        super("steem-wise-core");
    }

    public init() {
        if (process.env) { // node
            super.init([ process.env.WISE_CORE_LOG_LEVEL, process.env.WISE_LOG_LEVEL, "info" ]);
        }
        else { // non-node, eg. browser
            super.init([ "info" ]);
        }
    }

    public static log(): Log {
        return Log.INSTANCE;
    }
}

Log.log().init();