import { expect } from "chai";
import "mocha";

import SteemSmartvotes from "../src/steem-smartvotes";


describe("SteemSmartvotes.constructor", () => {
    it("throws error on empty credentials", () => {
        expect(() => {new SteemSmartvotes("a", ""); }).to.throw();
        expect(() => {new SteemSmartvotes("", "a"); }).to.throw();
    });
});