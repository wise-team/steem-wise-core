import * as _ from "lodash";
import clone = require("fast-clone");

import * as fakeDataset_ from "../data/fake-blockchain.json";
const fakeDataset = (fakeDataset_ as object) as FakeApi.Dataset;

import Wise from "../../wise";
import { FakeApi } from "../../api/FakeApi";
import { Api } from "../../api/Api";

export class FakeWiseFactory {
    public static loadDataset(): FakeApi.Dataset {
        return clone(fakeDataset);
    }

    public static buildFakeApiWithDataset(dataset: FakeApi.Dataset): Api {
        return FakeApi.fromDataset(Wise.constructDefaultProtocol(), dataset);
    }

    public static buildFakeApi(): Api {
        return FakeApi.fromDataset(Wise.constructDefaultProtocol(), FakeWiseFactory.loadDataset());
    }

    public static buildFakeWise(username: string): Wise {
        return new Wise(username, FakeWiseFactory.buildFakeApi());
    }

    public static buildFakeWiseWithDataset(username: string, dataset: FakeApi.Dataset): Wise {
        return new Wise(username, FakeWiseFactory.buildFakeApiWithDataset(dataset));
    }
}
