/**
 * 일반 API 유틸리티 함수
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiRequestOptions {
  method: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * 기본 API 요청 함수
 * @param url - API 요청할 URL
 * @param options - HTTP 메서드, body, headers 등
 * @returns Promise<Response>
 */
export async function apiRequest(url: string, options: ApiRequestOptions): Promise<Response> {
  const { method, body, headers = {} } = options;

  const config: globalThis.RequestInit = {
    method,
  };

  // body가 있을 경우 Content-Type 헤더를 설정
  if (body !== undefined) {
    config.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
    config.body = JSON.stringify(body);
  } else if (Object.keys(headers).length > 0) {
    // body가 없을 경우에만 헤더를 설정
    config.headers = headers;
  }

  return await fetch(url, config);
}

/**
 * GET 요청
 */
export async function apiGet(url: string): Promise<Response> {
  return apiRequest(url, { method: 'GET' });
}

/**
 * POST 요청
 */
export async function apiPost(url: string, body: unknown): Promise<Response> {
  return apiRequest(url, { method: 'POST', body });
}

/**
 * PUT 요청
 */
export async function apiPut(url: string, body: unknown): Promise<Response> {
  return apiRequest(url, { method: 'PUT', body });
}

/**
 * DELETE 요청
 */
export async function apiDelete(url: string): Promise<Response> {
  return apiRequest(url, { method: 'DELETE' });
}
