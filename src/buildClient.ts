import { Executor } from "./Executor";
import { FetchChainClient } from "./FetchChainClient";
import { Interceptor } from "./Interceptor";

class FetchChainClientBuilder {
  private _baseURL?: URL | string;
  private _interceptors: Interceptor[];
  private _executor: Executor;

  constructor() {
    this._interceptors = [];
    this._executor = fetch;
  }

  baseURL(baseURL: URL | string): FetchChainClientBuilder {
    this._baseURL = baseURL;
    return this;
  }

  addInterceptor(interceptor: Interceptor): FetchChainClientBuilder {
    this._interceptors.push(interceptor);
    return this;
  }

  executor(executor: Executor): FetchChainClientBuilder {
    this._executor = executor;
    return this;
  }

  build(): FetchChainClient {
    return new FetchChainClient(
      this._baseURL,
      this._interceptors,
      this._executor,
    );
  }
}

export const buildClient = (): FetchChainClientBuilder =>
  new FetchChainClientBuilder();
