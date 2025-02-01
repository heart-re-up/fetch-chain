import { Interceptor } from "./Interceptor";

export class Chain {
  private readonly interceptors: Interceptor[];
  private readonly index: number; // chain index
  private readonly _request: RequestInfo | URL;
  private readonly _init?: RequestInit;

  constructor(
    interceptors: Interceptor[],
    index: number,
    request: RequestInfo | URL,
    _init?: RequestInit
  ) {
    this._request = request;
    this._init = _init ?? {};
    this.interceptors = interceptors;
    this.index = index;
  }

  request(): RequestInfo | URL {
    return this._request;
  }

  init(): RequestInit | undefined {
    return this._init;
  }

  async proceed(
    request: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // 마지막 인터셉터까지 도달했다면 실제 fetch 실행
    if (this.index >= this.interceptors.length) {
      return fetch(request, init);
    }

    // 다음 인터셉터 호출
    const next = new Chain(this.interceptors, this.index + 1, request, init);
    const interceptor = this.interceptors[this.index];
    return interceptor(next);
  }
}
