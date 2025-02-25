import { describe, expect, it } from "vitest";
import { buildClient } from "./buildClient";
import { Chain } from "./Chain";
// import { fail } from "assert";

describe("FetchChainClient", () => {
  describe("HTTP 메소드", () => {
    const testData = { name: "홍길동", age: 30 };

    it("GET 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/get");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/get");
    });

    it("POST 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.json).toEqual(testData);
    });

    it("PUT 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/put", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.json).toEqual(testData);
    });

    it("PATCH 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/patch", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.json).toEqual(testData);
    });

    it("DELETE 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/delete", {
        method: "DELETE",
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/delete");
    });

    it("HEAD 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/get", {
        method: "HEAD",
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/json");
      // HEAD 요청은 body가 없습니다
      const text = await response.text();
      expect(text).toBe("");
    });

    it("OPTIONS 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/get", {
        method: "OPTIONS",
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("allow")).toBeDefined();
    });
  });

  describe("GET 요청", () => {
    it("기본 GET 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/get");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/get");
    });

    it("쿼리 파라미터가 있는 GET 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/get?param1=value1&param2=value2");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.args).toEqual({
        param1: "value1",
        param2: "value2",
      });
    });

    it("한글 쿼리 파라미터 처리", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const response = await client.fetch("/get?name=홍길동&city=서울");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.args).toEqual({
        name: "홍길동",
        city: "서울",
      });
    });
  });

  describe("POST 요청", () => {
    it("JSON 데이터로 POST 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const testData = { name: "홍길동", age: 30 };
      const response = await client.fetch("/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.json).toEqual(testData);
    });

    it("Form 데이터로 POST 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const formData = new FormData();
      formData.append("name", "홍길동");
      formData.append("age", "30");

      const response = await client.fetch("/post", {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.form).toEqual({
        name: "홍길동",
        age: "30",
      });
    });

    it("URLEncoded 데이터로 POST 요청", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const params = new URLSearchParams();
      params.append("name", "홍길동");
      params.append("age", "30");

      const response = await client.fetch("/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.form).toEqual({
        name: "홍길동",
        age: "30",
      });
    });

    it("멀티파트 파일 업로드", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const formData = new FormData();
      const fileContent = new Blob(["테스트 파일 내용"], {
        type: "text/plain",
      });
      formData.append("file", fileContent, "test.txt");
      formData.append("description", "테스트 파일입니다");

      const response = await client.fetch("/post", {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.files).toBeDefined();
      expect(data.form.description).toBe("테스트 파일입니다");
    });

    it("바이너리 데이터 전송", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const textData = "테스트데이터";
      const encoder = new TextEncoder();
      const binaryArray = encoder.encode(textData);

      const response = await client.fetch("/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: binaryArray,
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // httpbin은 바이너리 데이터를 text로 반환합니다. 따라서 다시 바이너리로 변환해야합니다.
      const receivedBinaryArray = encoder.encode(data.data); // 서버에서 받은 데이터를 디코드
      expect(receivedBinaryArray).toEqual(binaryArray);

      // 또는 더 엄격한 검사를 위해 각 바이트를 비교
      //   expect(Array.from(receivedData)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("에러 처리", () => {
    it("404 에러 처리", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      try {
        await client.fetch("/status/404");
        throw new Error("에러가 발생해야 합니다");
      } catch (error: unknown) {
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toBeDefined();
        } else {
          throw new Error("error는 Error 인스턴스여야 합니다");
        }
      }
    });

    it("네트워크 타임아웃", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      try {
        await client.fetch("/delay/5", {
          signal: AbortSignal.timeout(1000), // 1초 후 타임아웃
        });
        expect(true).toBe(false); // "타임아웃 에러가 발생해야 합니다"
      } catch (error: unknown) {
        expect(error).toBeDefined();
        if (error instanceof DOMException) {
          expect(error.name).toBe("TimeoutError");
        } else {
          expect(true).toBe(false); // "error는 DOMException 인스턴스여야 합니다"
        }
      }
    }, 10000);
  });

  it("should work with interceptors", async () => {
    const mockInterceptor = async (chain: Chain): Promise<Response> => {
      const request = chain.request();
      const init = chain.init() || {};

      // 헤더 추가
      const newInit = {
        ...init,
        headers: {
          ...init.headers,
          "X-Test-Header": "test-value",
        },
      };

      const response = await chain.proceed(request, newInit);
      return response;
    };

    const client = buildClient()
      .baseURL("https://httpbin.org")
      .addInterceptor(mockInterceptor)
      .build();
    const response = await client.fetch("/headers");
    const data = await response.json();

    expect(data.headers["X-Test-Header"]).toBe("test-value");
  });

  describe("인터셉터", () => {
    it("요청/응답 본문 로깅 인터셉터", async () => {
      const logs: string[] = [];
      const loggingInterceptor = async (chain: Chain): Promise<Response> => {
        const request = chain.request();
        const init = chain.init() || {};

        // 요청 본문 로깅
        if (init.body) {
          const bodyText =
            init.body instanceof FormData
              ? "<<FormData>>"
              : init.body instanceof URLSearchParams
                ? init.body.toString()
                : typeof init.body === "string"
                  ? init.body
                  : JSON.stringify(init.body);
          logs.push(bodyText);
        }

        const response = await chain.proceed(request, init);

        // 응답 본문 로깅 (clone 사용)
        const clonedResponse = response.clone();
        const responseText = await clonedResponse.text();
        logs.push(responseText); // 전체 응답을 로깅

        return response;
      };

      const client = buildClient()
        .baseURL("https://httpbin.org")
        .addInterceptor(loggingInterceptor)
        .build();

      const testData = { message: "테스트 메시지" };
      const response = await client.fetch("/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);
      expect(logs.length).toBe(2);

      // 응답 로그를 파싱하여 검증
      expect(JSON.parse(logs[0])).toEqual(testData);
      expect(JSON.parse(logs[1]).json).toEqual(testData);
    });
  });

  describe("fetch 함수 분리 사용", () => {
    it("fetch 함수를 변수에 할당하여 사용", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const fetchFn = client.fetch;

      const response = await fetchFn("/get");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/get");
    });

    it("fetch 함수를 다른 컨텍스트에서 사용", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const fetchFn = client.fetch.bind(client); // 바인딩 필요

      const response = await fetchFn("/get");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/get");
    });

    it("fetch 함수를 객체 메서드로 전달", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();
      const requester = {
        doFetch: client.fetch.bind(client),
      };

      const response = await requester.doFetch("/get");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/get");
    });

    it("fetch 함수를 콜백으로 전달", async () => {
      const client = buildClient().baseURL("https://httpbin.org").build();

      // 콜백을 받아 실행하는 함수
      const executeCallback = async (
        callback: typeof client.fetch,
      ): Promise<Response> => {
        return await callback("/get");
      };

      const response = await executeCallback(client.fetch.bind(client));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/get");
    });
  });
});
