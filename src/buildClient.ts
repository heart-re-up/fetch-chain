import { Executor } from "./Executor";
import { FetchChainClient } from "./FetchChainClient";
import { Interceptor } from "./Interceptor";

class FetchChainClientBuilder {
  private _baseURL?: URL | string;
  private _interceptors: Interceptor[];
  private _executor?: Executor;

  constructor() {
    this._interceptors = [];
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

  private getDefaultExecutor(): Executor {
    // 환경에 따라 적절한 fetch 함수 설정
    if (typeof fetch === "function") {
      // 브라우저 환경인 경우 window에 바인딩
      if (typeof window !== "undefined" && window.fetch === fetch) {
        return fetch.bind(window);
      } else {
        // Node.js나 다른 환경의 fetch (node-fetch, isomorphic-fetch 등)
        return fetch;
      }
    } else {
      // fetch가 없는 환경을 위한 기본 처리
      return (): never => {
        throw new Error("Fetch is not available in this environment");
      };
    }
  }

  build(): FetchChainClient {
    const executor = this._executor || this.getDefaultExecutor();

    return new FetchChainClient(this._baseURL, this._interceptors, executor);
  }
}

export const buildClient = (): FetchChainClientBuilder =>
  new FetchChainClientBuilder();
