import { Chain } from "./Chain";
import { Executor } from "./Executor";
import { Interceptor } from "./Interceptor";
import { toStringBaseURL } from "./util";

export class FetchChainClient {
  private readonly baseURL?: string;
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
    executor?: Executor,
  ) {
    this.baseURL = toStringBaseURL(baseURL);
    this.interceptors = interceptors ?? [];
    this.executor = executor ?? fetch;
  }

  private resolveUrl(request: RequestInfo | URL): RequestInfo | URL {
    if (typeof request === "object") {
      return request;
    }

    // if request has http or https, return it as is
    if (request.startsWith("http://") || request.startsWith("https://")) {
      return request;
    }

    // combine baseURL and request path if baseURL has been set
    if (this.baseURL) {
      const normalizedPath = request.startsWith("/") ? request : `/${request}`;
      return this.baseURL + normalizedPath;
    }

    // if baseURL has not been set, return request as is
    return request;
  }

  fetch = async (
    request: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const resolvedRequest = this.resolveUrl(request);
    const chain = Chain.firstChain(
      this.interceptors,
      this.executor,
      resolvedRequest,
      init,
    );
    return chain.proceed(resolvedRequest, init);
  };
}
