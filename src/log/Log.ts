import { AbstractUniverseLog } from "universe-log";

export class Log extends AbstractUniverseLog {
    public static log(): Log {
        return Log.INSTANCE;
    }
    private static INSTANCE: Log = new Log();

    private constructor() {
        super({
            levelEnvs: ["WISE_CORE_LOG_LEVEL", "WISE_LOG_LEVEL"],
            metadata: {
                library: "steem-wise-core",
            },
        });
    }

    public initialize() {
        super.init();
    }

    public init() {
        throw new Error("Instead of #init() please call #initialize(debug, verbose) which indirectly overrides init");
    }
}
