import { EffectuatedWiseOperation } from "../protocol/EffectuatedWiseOperation";
import { SetRules } from "../protocol/SetRules";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { ConfirmVote } from "../protocol/ConfirmVote";

export namespace SynchronizerCallbacks {
    export interface CallbackParam {
        onSetRules: OnSetRules;
        onVoteorder: OnVoteorder;
        onConfirmVote?: OnConfirmVote;
        onError?: OnError;
        onStart?: OnStart;
        onFinished?: OnFinished;
        onBlockProcessingStart?: OnBlockProcessingStart;
        onBlockOperationsLoaded?: OnBlockOperationsLoaded;
        onBlockProcessingFinished?: OnBlockProcessingFinished;
    }

    export type OnStart = () => void;
    export type OnFinished = () => void;
    export type OnSetRules = (setRules: SetRules, wiseOp: EffectuatedWiseOperation) => void;
    export type OnVoteorder = (sendVoteorder: SendVoteorder, wiseOp: EffectuatedWiseOperation) => void;
    export type OnConfirmVote = (confirmVote: ConfirmVote, wiseOp: EffectuatedWiseOperation) => void;
    export type OnError = (error: Error, proceeding: boolean) => void;
    export type OnBlockProcessingStart = (blockNum: number) => void;
    export type OnBlockOperationsLoaded = (blockNum: number, ops: EffectuatedWiseOperation []) => void;
    export type OnBlockProcessingFinished = (blockNum: number) => void;
}
