import { AbstractLog } from "./Abstractlog";

export class Log extends AbstractLog {
    private static INSTANCE: Log;

    private constructor() {
        super("steem-wise-core");
    }

    public init() {
        super.init([
            process.env.WISE_CORE_LOG_LEVEL,
            process.env.WISE_LOG_LEVEL,
            (window as any).WISE_CORE_LOG_LEVEL,
            (window as any).WISE_LOG_LEVEL,
            "info"
        ]);
    }

    public static log(): Log {
        /**
         * It is very important not to call constructon in the field scope. Calling it with the following if
         * is the only way in typescript to achive true singleton scoped to a single project (steem-wise-core
         * package here.)
         */
        if (!Log.INSTANCE) {
            Log.INSTANCE = new Log();
            Log.INSTANCE.init();
        }

        return Log.INSTANCE;
    }
}
