import { Chain } from "./Chain";

export interface Interceptor {
  intercept(chain: Chain): Promise<Response>;
}
