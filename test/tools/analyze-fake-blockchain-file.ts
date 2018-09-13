import * as _ from "lodash";
import clone = require("fast-clone");

import { Wise, Api } from "../../src/wise";
import { FakeApi } from "../../src/api/FakeApi";

import * as fakeDataset_ from "../data/fake-blockchain.json";
const fakeDataset = fakeDataset_ as object as FakeApi.Dataset;

fakeDataset.transactions.forEach(trx => {
    /*if (trx.transaction_id === "1c5cac353ad9e570731b008f05d30661fee208f9") {
        console.log(JSON.stringify(trx, undefined, 2));
    }*/
    if (trx.ops)
});