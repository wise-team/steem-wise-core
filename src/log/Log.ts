import { AbstractUniverseLog } from "universe-log";

export class Log extends AbstractUniverseLog {
    private static INSTANCE: Log;

    private constructor() {
        super("steem-wise-core");
    }

    public init() {
        super.init([process.env.WISE_CORE_LOG_LEVEL, process.env.WISE_LOG_LEVEL, "info"]);
    }

    public static log(): Log {
        if (!Log.INSTANCE) {
            Log.INSTANCE = new Log();
            Log.INSTANCE.init();
        }

        return Log.INSTANCE;
    }
}
