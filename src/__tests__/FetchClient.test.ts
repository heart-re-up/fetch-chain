import { FetchClient } from "../FetchClient";
import { Chain } from "../Chain";
import { Interceptor } from "../Interceptor";
// import { fail } from "assert";

describe("FetchClient", () => {
  let client: FetchClient;

  beforeEach(() => {
    client = new FetchClient("https://httpbin.org");
  });

  describe("HTTP 메소드", () => {
    const testData = { name: "홍길동", age: 30 };

    it("GET 요청", async () => {
      const response = await client.fetch("/get");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/get");
    });

    it("POST 요청", async () => {
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
      const response = await client.fetch("/delete", {
        method: "DELETE",
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/delete");
    });

    it("HEAD 요청", async () => {
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
      const response = await client.fetch("/get", {
        method: "OPTIONS",
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("allow")).toBeDefined();
    });
  });

  describe("GET 요청", () => {
    it("기본 GET 요청", async () => {
      const response = await client.fetch("/get");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBe("https://httpbin.org/get");
    });

    it("쿼리 파라미터가 있는 GET 요청", async () => {
      const response = await client.fetch("/get?param1=value1&param2=value2");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.args).toEqual({
        param1: "value1",
        param2: "value2",
      });
    });

    it("한글 쿼리 파라미터 처리", async () => {
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
    const mockInterceptor: Interceptor = {
      intercept: async (chain: Chain) => {
        const request = chain.request();
        const init = chain.requestInit() || {};

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
      },
    };

    client.addInterceptor(mockInterceptor);
    const response = await client.fetch("/headers");
    const data = await response.json();

    expect(data.headers["X-Test-Header"]).toBe("test-value");
  });
});
