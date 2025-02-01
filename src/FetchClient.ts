import { Chain } from "./Chain";
import { Interceptor } from "./Interceptor";

export class FetchClient {
  private baseURL: string;
  private interceptors: Interceptor[];

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
    this.interceptors = [];
  }

  addInterceptor(interceptor: Interceptor) {
    this.interceptors.push(interceptor);
    return this;
  }

  private resolveUrl(request: RequestInfo | URL): RequestInfo | URL {
    if (request instanceof URL) {
      return request;
    }

    if (typeof request === "string") {
      // request가 절대 URL인 경우 그대로 반환
      if (request.startsWith("http://") || request.startsWith("https://")) {
        return request;
      }

      // baseURL과 request path 결합
      const normalizedBase = this.baseURL.endsWith("/")
        ? this.baseURL.slice(0, -1)
        : this.baseURL;
      const normalizedPath = request.startsWith("/") ? request : `/${request}`;
      return `${normalizedBase}${normalizedPath}`;
    }

    return request;
  }

  async fetch(
    request: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const resolvedRequest = this.resolveUrl(request);
    const chain = new Chain(this.interceptors, 0, resolvedRequest, init);
    return chain.proceed(resolvedRequest, init);
  }
}
