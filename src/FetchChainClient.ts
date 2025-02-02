import { Chain } from "./Chain";
import { Executor } from "./Executor";
import { Interceptor } from "./Interceptor";

export class FetchChainClient {
  private readonly baseURL?: URL;
  private readonly interceptors: Interceptor[];
  private readonly executor: Executor;

  /**
   * Creates a new instance of FetchChainClient
   * @param baseURL - The base URL for all requests. Can be a URL object or a string.
   *                 If provided, must not end with a forward slash (/).
   * @param interceptors - An array of pipeline components that can intercept and modify requests and responses.
   *                      Interceptors are executed sequentially and can perform additional logic before/after requests.
   * @param executor - The executor that performs the actual HTTP request. Defaults to the fetch function.
   * @throws {Error} Throws an error if baseURL ends with a forward slash or if string baseURL is invalid.
   */
  constructor(
    baseURL?: URL | string,
    interceptors?: Interceptor[],
    executor?: Executor
  ) {
    if (baseURL === undefined || baseURL === null) {
      this.baseURL = undefined;
    } else if (typeof baseURL === "string") {
      if (baseURL.endsWith("/")) {
        throw new Error("baseURL must not end with a slash");
      }
      this.baseURL = new URL(baseURL);
    } else {
      if (baseURL.href.endsWith("/")) {
        throw new Error("baseURL must not end with a slash");
      }
      this.baseURL = baseURL;
    }
    this.interceptors = interceptors ?? [];
    this.executor = executor ?? fetch;
  }

  private resolveUrl(request: RequestInfo | URL): RequestInfo | URL {
    if (request instanceof URL) {
      return request;
    }

    if (typeof request === "string") {
      // if request has http or https, return it as is
      if (request.startsWith("http://") || request.startsWith("https://")) {
        return request;
      }

      // combine baseURL and request path
      const normalizedPath = request.startsWith("/") ? request : `/${request}`;
      return new URL(normalizedPath, this.baseURL);
    }

    return request;
  }

  async fetch(
    request: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const resolvedRequest = this.resolveUrl(request);
    const chain = Chain.firstChain(
      this.interceptors,
      this.executor,
      resolvedRequest,
      init
    );
    return chain.proceed(resolvedRequest, init);
  }
}
