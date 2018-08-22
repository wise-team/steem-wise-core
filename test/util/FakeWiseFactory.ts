import * as _ from "lodash";
import clone = require("fast-clone");

import { Wise, Api } from "../../src/wise";
import { FakeApi } from "../../src/api/FakeApi";

import * as fakeDataset_ from "../data/fake-blockchain.json";
const fakeDataset = fakeDataset_ as object as FakeApi.Dataset;

export class FakeWiseFactory {
    public static loadDataset(): FakeApi.Dataset {
        return clone(fakeDataset);
    }

    public static buildFakeApiWithDataset(dataset: FakeApi.Dataset): Api {
        return FakeApi.fromDataset(dataset);
    }

    public static buildFakeApi(): Api {
        return FakeApi.fromDataset(FakeWiseFactory.loadDataset());
    }

    public static buildFakeWise(username: string): Wise {
        return new Wise(username, FakeWiseFactory.buildFakeApi());
    }

    public static buildFakeWiseWithDataset(username: string, dataset: FakeApi.Dataset): Wise {
        return new Wise(username, FakeWiseFactory.buildFakeApiWithDataset(dataset));
    }
}