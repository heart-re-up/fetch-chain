# fetch-chain

[![npm version](https://img.shields.io/npm/v/fetch-chain.svg)](https://www.npmjs.com/package/fetch-chain)
[![License](https://img.shields.io/npm/l/fetch-chain.svg)](https://github.com/yourusername/fetch-chain/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/fetch-chain.svg)](https://www.npmjs.com/package/fetch-chain)

<!-- [![Build Status](https://github.com/yourusername/fetch-chain/actions/workflows/test.yml/badge.svg)](https://github.com/yourusername/fetch-chain/actions) -->

`fetch-chain`은 인터셉터를 지원하는 HTTP 클라이언트 라이브러리입니다.
실제 호출은 브라우저 또는 `node18` 이상의 `fetch` API를 사용합니다.

# 주요기능

- `fetch` 스펙을 그대로 지원
- baseURL 설정 지원
- 인터셉터를 통한 요청 및 응답 가로채기, 수정

# 설치

```bash
npm install fetch-chain
```

> **Note**: `fetch-chain`은 ESM(ECMAScript Modules) 전용 라이브러리입니다. CommonJS (`require`)는 지원하지 않습니다.

# 기본 사용법

특정 원격 서버에 대한 요청을 처리하는 클라이언트를 생성합니다.

`baseURL` 을 지정해서 요청을 보낼 서버를 지정합니다.

```typescript
// 생성
const client = buildClient().baseURL("https://api.example.com").build();

// GET 요청
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

# 인터셉터

인터셉터를 등록해서 요청 및 응답을 가로채고 수정할 수 있습니다.

```typescript
const client = buildClient()
  .baseURL("https://api.example.com")
  .addInterceptor((chain) => {
    const request = chain.request();
    const init = chain.init();
    // 여기서 요청을 가로채서 수정합니다.
    const newInit = {
      ...init,
      headers: { ...init?.headers, Accept: "application/json" },
    };
    const response = await chain.proceed(request, newInit);
    // 여기서 응답을 가로채서 수정합니다.
    return response;
  })
  .build();

// 이 요청은 헤더에 Accept: application/json 이 추가되어 요청됩니다.
const response = await client.fetch("/users");
```

# 실행기

`fetch-chain` 은 기본적으로 `fetch` API를 사용해서 요청을 처리합니다.
다른 요청 모듈을 사용하고 싶다면 `executor` 를 지정해서 사용할 수 있습니다.

```typescript
const client = buildClient()
  .executor((request: RequestInfo | URL, init?: RequestInit) => {
    // 여기서 실제 HTTP 요청을 처리하고 Response 객체를 반환합니다.
    // 예: axios, fetch, 등등
    return await fetch(request, init);
  })
  .build();
```

# URL 처리 방식

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

# init 옵션 사용

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
