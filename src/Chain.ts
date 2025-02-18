import { Executor } from "./Executor";
import { Interceptor } from "./Interceptor";

export class Chain {
  private readonly index: number; // chain index
  private readonly interceptors: Interceptor[];
  private readonly executor: Executor;
  private readonly _request: RequestInfo | URL;
  private readonly _init?: RequestInit;

  static firstChain(
    interceptors: Interceptor[],
    executor: Executor,
    request: RequestInfo | URL,
    init?: RequestInit,
  ): Chain {
    return new Chain(0, interceptors, executor, request, init);
  }

  constructor(
    index: number,
    interceptors: Interceptor[],
    executor: Executor,
    request: RequestInfo | URL,
    init?: RequestInit,
  ) {
    this.index = index;
    this.interceptors = interceptors;
    this.executor = executor;
    this._request = request;
    this._init = init;
  }

  request(): RequestInfo | URL {
    return this._request;
  }

  init(): RequestInit | undefined {
    return this._init;
  }

  async proceed(
    request: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // 호출 가능한 인터셉터가 남았다면 다음 인터셉터 호출
    if (this.index < this.interceptors.length) {
      const interceptor = this.interceptors[this.index];
      const nextChain = this.nextChain(request, init);
      return interceptor(nextChain);
    }

    // 마지막 인터셉터까지 도달했다면 실제 요청 실행
    return this.executor(request, init);
  }

  private nextChain(request: RequestInfo | URL, init?: RequestInit): Chain {
    return new Chain(
      this.index + 1,
      this.interceptors,
      this.executor,
      request,
      init,
    );
  }
}
