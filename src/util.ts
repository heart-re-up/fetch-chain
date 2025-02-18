export const toStringBaseURL = (
  baseURL: URL | string | undefined,
): string | undefined => {
  if (baseURL === undefined || baseURL === null) {
    return undefined;
  } else if (typeof baseURL === "string") {
    if (baseURL.endsWith("/")) {
      throw new Error("baseURL must not end with a slash");
    }
    return baseURL;
  } else {
    if (baseURL.href.endsWith("/")) {
      throw new Error("baseURL must not end with a slash");
    }
    return baseURL.href;
  }
};
