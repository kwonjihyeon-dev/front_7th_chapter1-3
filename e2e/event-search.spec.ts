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
});
