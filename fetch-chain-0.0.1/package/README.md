# fetch-chain

`fetch-chain`은 인터셉터를 지원하는 HTTP 클라이언트 라이브러리입니다.
실제 호출은 브라우저 또는 `node18` 이상의 `fetch` API를 사용합니다.

## 주요기능

- `fetch` 스펙을 그대로 지원
- baseURL 설정 지원
- 인터셉터를 통한 요청 및 응답 가로채기, 수정

## 설치

```bash
npm install fetch-chain
```

## FetchChainClient 기본 사용법

### 클라이언트 생성

```typescript
import { FetchChainClient } from "fetch-chain";

// 기본 생성
const client = new FetchChainClient();

// baseURL을 지정하여 생성
const client = new FetchChainClient("https://api.example.com");
```

### HTTP 요청하기

```typescript
// 기본 GET 요청
const response = await client.fetch("/users");

// POST 요청
const response = await client.fetch("/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "홍길동" }),
});
```

### URL 처리 방식

FetchChainClient는 baseURL과 요청 경로를 자동으로 결합합니다:

```typescript
const client = new FetchChainClient("https://api.example.com");

// https://api.example.com/users 로 요청됨
await client.fetch("/users");

// https://api.example.com/users/123 로 요청됨
await client.fetch("/users/123");

// 절대 URL을 사용하는 경우 baseURL은 무시됨
await client.fetch("https://another-api.com/posts");
```

### init 옵션 사용

fetch API의 모든 표준 옵션을 지원합니다:

```typescript
const response = await client.fetch("/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer token",
  },
  body: JSON.stringify({ name: "홍길동" }),
  mode: "cors",
  cache: "no-cache",
  credentials: "same-origin",
});
```

## 인터셉터 사용하기

인터셉터를 사용하면 HTTP 요청/응답을 가로채서 공통 로직을 처리할 수 있습니다.

### 1. 로깅 인터셉터

요청과 응답을 로깅하는 인터셉터 예제입니다:

```typescript
const loggingInterceptor = {
  intercept: async (chain) => {
    const request = chain.request();
    const init = chain.init();

    // 요청 로깅
    console.log("Request:", {
      url: request.toString(),
      method: init?.method || "GET",
      headers: init?.headers,
      body: init?.body,
    });

    const startTime = Date.now();
    try {
      const response = await chain.proceed(request, init);

      // 응답 로깅
      // 응답의 본문을 로깅하려면 clone 으로 복제하세요.
      // const clonedResponse = response.clone();
      // const responseText = await clonedResponse.text();
      console.log("Response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        duration: Date.now() - startTime,
      });

      return response;
    } catch (error) {
      // 에러 로깅
      console.error("Error:", error);
      throw error;
    }
  },
};

client.addInterceptor(loggingInterceptor);
```

### 2. 인증 인터셉터

모든 요청에 인증 토큰을 추가하고, 토큰 만료시 자동으로 갱신하는 인터셉터입니다:

> TokenStore 는 가상의 토큰 저장소입니다.

```typescript
const authInterceptor = {
  intercept: async (chain) => {
    const request = chain.request();
    const init = chain.init() ?? {}; // nullable

    // Access Token 추가
    const newInit = {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${TokenStore.getAccessToken()}`,
      },
    };

    const response = await chain.proceed(request, newInit);

    // 401 Unauthorized 에러 처리
    if (response.status === 401) {
      try {
        // 토큰 갱신 시도
        await TokenStore.refresh();

        // 새로운 Access Token으로 재시도
        const retryInit = {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${TokenStore.getAccessToken()}`,
          },
        };

        const retryResponse = await chain.proceed(request, retryInit);
        if (retryResponse.status === 401) {
          throw new Error(
            "Token refresh failed: Still getting 401 after token refresh"
          );
        }
        return retryResponse;
      } catch (error) {
        throw new Error("Token refresh failed: " + (error as Error).message);
      }
    }

    return response;
  },
};

client.addInterceptor(authInterceptor);
```

### 3. 재시도 인터셉터

네트워크 오류 발생 시 자동으로 재시도하는 인터셉터입니다:

```typescript
const retryInterceptor = {
  intercept: async (chain) => {
    const maxRetries = 3;
    const delayMs = 500; // 재시도 간격 (0.5초)

    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // HTTP 응답이 존재하면 catch 되지 않습니다. 400,500 등의 에러는 응답의 status 코드를 처리해야합니다.
        return await chain.proceed(chain.request(), chain.init());
      } catch (error) {
        lastError = error;

        // 마지막 시도가 아니라면 대기 후 재시도
        if (attempt < maxRetries - 1) {
          console.log(`요청 실패, ${attempt + 1}번째 재시도 중...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }
    }

    throw lastError;
  },
};

client.addInterceptor(retryInterceptor);
```

### 4. 네트워크 에러 처리 인터셉터

HTTP 상태 코드에 따라 표준화된 에러를 발생시키는 인터셉터입니다:

```typescript
class NetworkError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any,
    message?: string
  ) {
    super(message || `HTTP Error: ${status} ${statusText}`);
    this.name = "NetworkError";
  }
}

const errorInterceptor = {
  intercept: async (chain) => {
    const response = await chain.proceed(chain.request(), chain.init());

    if (response.status >= 400) {
      const data = await response.json().catch(() => null);
      throw new NetworkError(response.status, response.statusText, data);
    }

    return response;
  },
};

// 사용 예시
try {
  await client.fetch("/api/users/123");
} catch (error) {
  if (error instanceof NetworkError) {
    console.error(
      `Status: ${error.status}`,
      `Message: ${error.message}`,
      `Data:`,
      error.data
    );
  }
}
```

### 인터셉터 체이닝

여러 인터셉터를 순차적으로 적용할 수 있습니다:

```typescript
client
  .addInterceptor(loggingInterceptor)
  .addInterceptor(errorInterceptor) // 가장 먼저 에러를 표준화
  .addInterceptor(authInterceptor) // 인증 에러(401)는 여기서 처리
  .addInterceptor(retryInterceptor); // 네트워크 에러는 여기서 재시도
```

인터셉터는 추가된 순서대로 실행되며, 응답은 역순으로 처리됩니다:

요청 처리 순서

- loggingInterceptor (요청 로깅)
- errorInterceptor (에러 표준화)
- authInterceptor (인증 토큰 추가)
- retryInterceptor (재시도 로직)
- 실제 HTTP 요청

응답 처리 순서

- 실제 HTTP 응답
- retryInterceptor (재시도 로직)
- authInterceptor (인증 토큰 추가)
- errorInterceptor (에러 표준화)
- loggingInterceptor (응답 로깅)
