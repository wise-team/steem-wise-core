import * as BluebirdPromise from "bluebird";
import { Wise, Synchronizer, SteemOperationNumber } from "../../../src/wise";
import { Log } from "../../../src/util/log";
import { Util } from "../../../src/util/util";

export class SynchronizerTestToolkit {
    public synchronizer: Synchronizer | undefined;
    public synchronizerPromise: BluebirdPromise<void> | undefined;
    private wise: Wise;

    public constructor(wise: Wise) {
        this.wise = wise;
    }

    public start(blockNum: number) {
        this.synchronizerPromise = new BluebirdPromise<void>((resolve, reject) => {
            Log.log().verbose("Starting synchronizer");
            this.synchronizer = this.wise.startDaemon(new SteemOperationNumber(blockNum, 0, 0),
            (error: Error | undefined, event: Synchronizer.Event): void => {
                if (event.type === Synchronizer.EventType.SynchronizationStop) {
                    Log.log().debug("Synchronizer stopper");
                    resolve();
                }
                // if (event.type === Synchronizer.EventType.OperarionsPushed) Log.log().info(event);

                if (error) {
                    Log.log().debug("Synchronizer error, calling stop");
                    this.getSynchronizer().stop();
                    reject(error);
                }
            });
            this.getSynchronizer().setTimeout(800);
        });
        (async () => await Util.definedOrThrow(this.synchronizerPromise).then(() => {}))();
    }

    public getSynchronizer(): Synchronizer {
        if (!this.synchronizer) throw new Error("Synchronizer not created");
        return this.synchronizer;
    }

    public getSynchronizerPromise(): BluebirdPromise<void> {
        if (!this.synchronizerPromise) throw new Error("SynchronizerPromise not created");
        return this.synchronizerPromise;
    }
}