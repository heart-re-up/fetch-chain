import { Chain } from "./Chain";

export type Interceptor = (chain: Chain) => Promise<Response>;
