export type Executor = (
  request: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;
