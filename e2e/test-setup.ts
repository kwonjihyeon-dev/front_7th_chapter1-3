import fs from 'fs';
import path from 'path';

import { test as baseTest } from '@playwright/test';

// 워커별 고유 데이터베이스 파일명 생성
const getWorkerDbFileName = (workerIndex: number): string => {
  return `e2e-${workerIndex}.json`;
};

// 데이터베이스 파일 경로 가져오기
const getDbPath = (dbFileName: string): string => {
  return path.join(process.cwd(), 'src', '__mocks__', 'response', dbFileName);
};

// 데이터베이스 파일 초기화 (빈 상태로)
const initializeDatabase = (dbFileName: string): void => {
  const dbPath = getDbPath(dbFileName);

  // 디렉토리가 없으면 생성
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 빈 데이터베이스 파일로 초기화
  fs.writeFileSync(
    dbPath,
    JSON.stringify({
      events: [],
    })
  );
};

// 데이터베이스 파일 정리
const cleanupDatabase = (dbFileName: string): void => {
  const dbPath = getDbPath(dbFileName);

  // 테스트 완료 후 파일 삭제
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
};

// Playwright의 worker scope fixture를 위한 빈 객체 타입이 필요합니다
export const test = baseTest.extend<object, { dbFileName: string }>({
  // 워커별 데이터베이스 파일명을 fixture로 제공
  dbFileName: [
    // Playwright worker scope fixture는 첫 번째 인자가 객체 구조 분해 패턴이어야 합니다
    async ({}, use, testInfo) => {
      // 워커 인덱스로 고유 데이터베이스 파일명 생성
      const workerIndex = testInfo.workerIndex;
      const dbFileName = getWorkerDbFileName(workerIndex);

      // 워커 시작 시 데이터베이스 초기화
      initializeDatabase(dbFileName);

      await use(dbFileName);

      // 워커 종료 시 데이터베이스 정리
      cleanupDatabase(dbFileName);
    },
    { scope: 'worker' },
  ],

  // page fixture를 확장하여 모든 요청에 헤더 추가
  page: async ({ page, dbFileName }, use) => {
    // 모든 HTTP 요청에 워커별 데이터베이스 파일명 헤더 추가
    await page.setExtraHTTPHeaders({
      'X-Test-DB-File': dbFileName,
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect } from '@playwright/test';
