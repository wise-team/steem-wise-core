/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as _ from "lodash";
import * as steem from "steem";

import { Log } from "../log/log";

import { Api } from "../api/Api";
import { Protocol } from "../protocol/Protocol";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { SetRules } from "../protocol/SetRules";
import { EffectuatedWiseOperation } from "../protocol/EffectuatedWiseOperation";
import { ConfirmVote } from "../protocol/ConfirmVote";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { Validator } from "../validation/Validator";
import { ValidationException } from "../validation/ValidationException";
import { WiseOperation } from "../protocol/WiseOperation";
import { EffectuatedSetRules } from "../protocol/EffectuatedSetRules";
import { SynchronizerCallbacks } from "./SynchronizerCallbacks";

export class UniversalSynchronizer {
    private static WAIT_ON_ERROR_MS = 3100;
    private protocol: Protocol;
    private api: Api;
    private callbacks: SynchronizerCallbacks.CallbackParam;

    private isRunning_ = true;
    private lastProcessedOperationNum: SteemOperationNumber = new SteemOperationNumber(0, 0, 0);

    public constructor(api: Api, protocol: Protocol, callbacks: SynchronizerCallbacks.CallbackParam) {
        this.api = api;
        this.protocol = protocol;
        this.callbacks = callbacks;
    }

    // this function only starts the loop via processBlock, which then calls processBlock(blockNum+1)
    public start(since: SteemOperationNumber) {
        Log.log().debug("SYNCHRONIZER_RUN_LOOP=" + JSON.stringify({since: since}));
        this.lastProcessedOperationNum = since;

        this.safeCall(() => this.callbacks.onStart ? this.callbacks.onStart() : undefined);
        (async () => {
            try {
                await this.processBlock(since.blockNum); // the loop is started
            } catch (error) {
                this.safeCall(() => this.callbacks.onError ? this.callbacks.onError(error, false) : undefined);
            }
            this.safeCall(() => this.callbacks.onFinished ? this.callbacks.onFinished() : undefined);
        })();

        return this;
    }

    public stop(): void {
        // when isRunning=false, continueIfRunning() will not call it's callback parameter
        this.isRunning_ = false;
    }

    public isRunning(): boolean {
        return this.isRunning_;
    }

    public getLastProcessedOperation(): SteemOperationNumber {
        return this.lastProcessedOperationNum.clone();
    }

    private async processBlock(blockNum: number) {
        if (!this.isRunning_) {
            return;
        }

        this.safeCall(() => this.callbacks.onBlockProcessingStart ? this.callbacks.onBlockProcessingStart(blockNum) : undefined);
        try {
            const ops: EffectuatedWiseOperation [] = await this.api.getAllWiseOperationsInBlock(blockNum);
            this.safeCall(() => this.callbacks.onBlockOperationsLoaded ? this.callbacks.onBlockOperationsLoaded(blockNum, ops) : undefined);

            for (let i = 0; i < ops.length; i++) {
                const op = ops[i];
                await this.processOperation(op as EffectuatedWiseOperation);
            }
            this.safeCall(() => this.callbacks.onBlockProcessingFinished ? this.callbacks.onBlockProcessingFinished(blockNum) : undefined);

            await this.processBlock(blockNum + 1);
        }
        catch (error) {
            this.safeCall(() => this.callbacks.onError ? this.callbacks.onError(error, true) : undefined);
            await BluebirdPromise.delay(UniversalSynchronizer.WAIT_ON_ERROR_MS);
            await this.processBlock(blockNum);
        }
    }

    private async processOperation(op: EffectuatedWiseOperation): Promise<void> {
        const currentOpNum = op.moment;
         // retry continues from last trx. There is no need to process transactions from the beginning of the block second time.
        if (currentOpNum.isGreaterThan(this.lastProcessedOperationNum)) {
            if (SetRules.isSetRules(op.command)) {
                const setRules: SetRules = op.command;
                this.safeCall(() => this.callbacks.onSetRules(setRules, op));
            }
            else if (SendVoteorder.isSendVoteorder(op.command)) {
                const sendVoteorder: SendVoteorder = op.command;
                this.safeCall(() => this.callbacks.onVoteorder(sendVoteorder, op));
            }
            // confirmVote does not need to be processed
        }
        this.lastProcessedOperationNum = op.moment;
    }

    private safeCall(fn: () => any) {
        if (!fn) return;
        (async () => {
            try {
                await fn();
            }
            catch (error) {
                Log.log().error("Unhandled error in UniversalSynchronizer callback: " + error);
                Log.log().exception(Log.level.error, error);
            }
        })();
    }
}
