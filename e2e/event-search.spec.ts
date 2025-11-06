import type { Page } from '@playwright/test';

import { test, expect } from './test-setup';

const waitForEventCreation = (page: Page) =>
  page.waitForResponse(
    (response) =>
      response.url().includes('/api/events') &&
      response.request().method() === 'POST' &&
      response.ok(),
    { timeout: 45_000 }
  );

test.describe('일정 검색 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 시간 모킹: 2025-10-15로 고정하여 주 뷰가 해당 주를 표시하도록 설정
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.reload();
    // 일정 로딩 완료 대기
    await page.goto('/');
    const snackbar = page.getByText('일정 로딩 완료!').first();
    await expect(snackbar).toBeVisible();
  });

  // 기본 검색 테스트
  test('검색어를 입력하면 해당 검색어가 포함된 일정만 표시된다', async ({ page }) => {
    // Arrange: 여러 일정 생성
    await page.getByLabel('제목').fill('회의 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('팀 회의');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    await page.getByLabel('제목').fill('점심 약속');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('12:00');
    await page.getByLabel('종료 시간').fill('13:00');
    await page.getByLabel('설명').fill('친구와 점심');
    await page.getByLabel('위치').fill('레스토랑');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '개인-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요', { exact: true });
    await searchInput.fill('회의');

    // Assert: 검색 결과에 '회의 일정'만 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('회의 일정')).toBeVisible();
    await expect(eventList.getByText('점심 약속')).not.toBeVisible();
  });

  test('검색어를 제목으로 검색할 수 있다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('제목 검색 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명 내용');
    await page.getByLabel('위치').fill('위치 정보');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 제목으로 검색
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('제목 검색');

    // Assert: 검색 결과에 일정이 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('제목 검색 테스트')).toBeVisible();
  });

  test('검색어를 설명으로 검색할 수 있다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('일정 제목');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명 검색 테스트');
    await page.getByLabel('위치').fill('위치 정보');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // Assert: 일정이 추가되었는지 event-list에서 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('일정 제목')).toBeVisible();

    // Act: 설명으로 검색
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('설명 검색');

    // Assert: 검색 결과에 일정이 표시됨
    await expect(eventList.getByText('일정 제목')).toBeVisible();
  });

  test('검색어를 위치로 검색할 수 있다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('일정 제목');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명 내용');
    await page.getByLabel('위치').fill('위치 검색 테스트');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // Act: 위치로 검색
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('위치 검색');

    // Assert: 검색 결과에 일정이 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('일정 제목')).toBeVisible();
  });

  test('검색어가 일치하는 일정이 없으면 "검색 결과가 없습니다." 메시지가 표시된다', async ({
    page,
  }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('기존 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 존재하지 않는 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('존재하지 않는 일정');

    // Assert: "검색 결과가 없습니다." 메시지 표시
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('검색 결과가 없습니다.')).toBeVisible();
    await expect(eventList.getByText('기존 일정')).not.toBeVisible();
  });

  test('검색어를 지우면 모든 일정이 다시 표시된다', async ({ page }) => {
    // Arrange: 여러 일정 생성
    await page.getByLabel('제목').fill('첫 번째 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('첫 번째');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    await page.getByLabel('제목').fill('두 번째 일정');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('12:00');
    await page.getByLabel('종료 시간').fill('13:00');
    await page.getByLabel('설명').fill('두 번째');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('첫 번째');

    // 검색 결과 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('첫 번째 일정')).toBeVisible();
    await expect(eventList.getByText('두 번째 일정')).not.toBeVisible();

    // Act: 검색어 지우기
    await searchInput.clear();

    // Assert: 모든 일정이 다시 표시됨
    await expect(eventList.getByText('첫 번째 일정')).toBeVisible();
    await expect(eventList.getByText('두 번째 일정')).toBeVisible();
  });

  // 대소문자 구분 테스트
  test('검색은 대소문자를 구분하지 않는다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('대소문자 테스트 - test');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('대소문자');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 대문자로 검색
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('대소문자');

    // Assert: 검색 결과에 일정이 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('대소문자 테스트')).toBeVisible();

    // Act: 소문자로 검색
    await searchInput.clear();
    await searchInput.fill('TEST');

    // Assert: 검색 결과에 일정이 표시됨
    await expect(eventList.getByText('대소문자 테스트 - test')).toBeVisible();
  });

  // 부분 일치 테스트
  test('검색어가 부분적으로 일치하는 일정도 검색된다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('부분 일치 테스트 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('부분 일치');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 부분 일치 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('부분');

    // Assert: 검색 결과에 일정이 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('부분 일치 테스트 일정')).toBeVisible();
  });

  // 여러 일정 검색 테스트
  test('검색어에 맞는 여러 일정이 모두 표시된다', async ({ page }) => {
    // Arrange: 여러 일정 생성 (모두 '회의' 포함)
    await page.getByLabel('제목').fill('팀 회의');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    await page.getByLabel('제목').fill('프로젝트 회의');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('회의');

    // Assert: 검색 결과에 모든 일정이 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 회의')).toBeVisible();
    await expect(eventList.getByText('프로젝트 회의')).toBeVisible();
  });

  // 뷰 타입별 검색 테스트
  test('월간 뷰에서 검색 시 현재 월의 일정만 검색 결과에 포함된다', async ({ page }) => {
    // Arrange: 현재 월 일정 생성
    await page.getByLabel('제목').fill('10월 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('10월');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // 다른 월 일정 생성
    await page.getByLabel('제목').fill('11월 일정');
    await page.getByLabel('날짜').fill('2025-11-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('11월');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 검색어 입력 (모든 일정에 포함되는 검색어)
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('일정');

    // Assert: 현재 월(10월) 일정만 검색 결과에 포함됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('10월 일정')).toBeVisible();
    await expect(eventList.getByText('11월 일정')).not.toBeVisible();
  });

  test('주간 뷰에서 검색 시 현재 주의 일정만 검색 결과에 포함된다', async ({ page }) => {
    // Arrange: 현재 주 일정 생성 (2025-10-15는 수요일)
    await page.getByLabel('제목').fill('이번 주 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('이번 주');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // 다음 주 일정 생성
    await page.getByLabel('제목').fill('다음 주 일정');
    await page.getByLabel('날짜').fill('2025-10-22');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('다음 주');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 주간 뷰로 변경
    await page.getByLabel('뷰 타입 선택').click();
    await page.getByRole('option', { name: 'week-option' }).click();

    // 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('일정');

    // Assert: 현재 주 일정만 검색 결과에 포함됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('이번 주 일정')).toBeVisible();
    await expect(eventList.getByText('다음 주 일정')).not.toBeVisible();
  });

  // 반복 일정 검색 테스트
  test('반복 일정도 검색 결과에 포함된다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('반복 회의');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('중복 일정이에용');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-15');
    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('반복');

    // Assert: 반복 일정이 검색 결과에 포함됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('반복 회의', { exact: true })).toHaveCount(3);
  });

  // 실시간 검색 테스트
  test('검색어를 변경하면 검색 결과가 즉시 업데이트된다', async ({ page }) => {
    // Arrange: 여러 일정 생성
    await page.getByLabel('제목').fill('회의 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('회의');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    await page.getByLabel('제목').fill('점심 약속');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('12:00');
    await page.getByLabel('종료 시간').fill('13:00');
    await page.getByLabel('설명').fill('점심');
    await page.getByLabel('위치').fill('레스토랑');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '개인-option' }).click();
    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    const eventList = page.getByTestId('event-list');
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');

    // Act: 첫 번째 검색어 입력
    await searchInput.fill('회의');

    // Assert: 첫 번째 검색 결과
    await expect(eventList.getByText('회의 일정')).toBeVisible();
    await expect(eventList.getByText('점심 약속')).not.toBeVisible();

    // Act: 검색어 변경
    await searchInput.clear();
    await searchInput.fill('점심');

    // Assert: 검색 결과가 즉시 업데이트됨
    await expect(eventList.getByText('점심 약속')).toBeVisible();
    await expect(eventList.getByText('회의 일정')).not.toBeVisible();
  });

  // 엣지 케이스 테스트
  test('특수 문자가 포함된 검색어로도 검색할 수 있다', async ({ page }) => {
    // Arrange: 특수 문자가 포함된 일정 생성
    await page.getByLabel('제목').fill('특수문자 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('특문');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 일반 검색어로 검색
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('특수문자');

    // Assert: 검색 결과에 일정이 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('특수문자 테스트')).toBeVisible();
  });

  test('검색 결과에서 일정을 편집할 수 있다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('원본');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('원본');

    // 검색 결과 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('원본')).toBeVisible();

    // Act: 검색 결과에서 일정 편집
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    await page.getByLabel('제목').fill('수정된 편집 테스트');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();

    // Assert: 검색 결과가 업데이트됨
    const newEventList = page.getByTestId('event-list');
    await expect(newEventList.getByText('원본')).not.toBeVisible();
  });

  test('검색 결과에서 일정을 삭제할 수 있다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('삭제 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    await Promise.all([
      waitForEventCreation(page),
      page.getByTestId('event-submit-button').click(),
    ]);

    // Act: 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('삭제');

    // 검색 결과 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('삭제 테스트')).toBeVisible();

    // Act: 검색 결과에서 일정 삭제
    const deleteButtons = page.getByLabel('Delete event');
    await deleteButtons.first().click();

    await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible();

    // Assert: 검색 결과에서 일정이 제거됨
    await expect(eventList.getByText('삭제 테스트')).not.toBeVisible();
    await expect(eventList.getByText('검색 결과가 없습니다.')).toBeVisible();
  });
});
