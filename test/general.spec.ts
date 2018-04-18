import { expect } from "chai";
import "mocha";

import SteemSmartvotes from "../lib/steem-smartvotes";
import { smartvotes_operation } from "../schema/smartvotes.schema";


describe("SteemSmartvotes.constructor", () => {
    it("throws error on empty credentials", () => {
        expect(() => {new SteemSmartvotes("a", ""); }).to.throw();
        expect(() => {new SteemSmartvotes("", "a"); }).to.throw();
    });
});