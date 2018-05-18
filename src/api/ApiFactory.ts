import { RawOperation } from "../blockchain/blockchain-operations-types";
import { ChainableSupplier } from "../chainable/Chainable";

export abstract class ApiFactory {
    public abstract createSmartvotesSupplier(steem: any, username: string): ChainableSupplier<RawOperation, any>;
    public abstract getName(): string;
}