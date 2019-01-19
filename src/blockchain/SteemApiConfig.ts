import { SteemAdapter } from "./SteemAdapter";

export class SteemApiConfig {
    public static DEFAULT_STEEM_API_ENDPOINT_URL =
        /*§ §*/ "https://anyx.io" /*§ ' "' + data.config.steem.defaultApiUrl + '" ' §.*/;

    public static DEFAULT_ADAPTER_OPTIONS: SteemAdapter.Options = {
        url: SteemApiConfig.DEFAULT_STEEM_API_ENDPOINT_URL,
    };
}
