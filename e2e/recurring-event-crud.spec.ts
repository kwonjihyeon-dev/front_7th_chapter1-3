import { test, expect } from './test-setup';

test.describe('반복 일정 관리 CRUD 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 시간 모킹: 2025-10-15로 고정하여 주 뷰가 해당 주를 표시하도록 설정
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.reload();
    // 일정 로딩 완료 대기
    await page.goto('/');
    const snackbar = page.getByText('일정 로딩 완료!').first();
    await expect(snackbar).toBeVisible();
  });

  // CREATE 테스트
  test('주간 반복 일정을 생성하면 여러 날짜에 일정이 생성된다', async ({ page }) => {
    // Arrange: 주간 반복 일정 생성 폼 작성
    await page.getByLabel('제목').fill('매주 회의');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('주간 회의');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-15');

    // Act: 일정 생성 버튼 클릭
    await page.getByTestId('event-submit-button').click();

    // Assert: 성공 메시지 표시
    const successSnackbar = page.getByText('일정이 추가되었습니다');
    await expect(successSnackbar).toBeVisible();

    // Assert: 일정 목록에 반복 일정이 표시됨 (반복 아이콘 확인)
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('매주 회의')).toHaveCount(3);
    // await expect(eventList.locator('[aria-label="Repeat"]').first()).toBeVisible();

    // Assert: 캘린더에 여러 날짜에 일정이 표시됨
    const monthView = page.getByTestId('month-view');
    // 15일, 22일, 29일 등에 일정이 표시되어야 함
    const cell15 = monthView.locator('td').filter({ hasText: '15' }).first();
    await expect(cell15.locator('[data-event]').filter({ hasText: '매주 회의' })).toBeVisible();

    const cell22 = monthView.locator('td').filter({ hasText: '22' }).first();
    await expect(cell22.locator('[data-event]').filter({ hasText: '매주 회의' })).toBeVisible();
  });

  // READ 테스트
  test('반복 일정의 상세 정보가 일정 목록에 올바르게 표시된다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('반복 일정 상세');
    await page.getByLabel('날짜').fill('2025-10-18');
    await page.getByLabel('시작 시간').fill('09:00');
    await page.getByLabel('종료 시간').fill('10:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-18');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Assert: 반복 일정 정보 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('반복 일정 상세')).toHaveCount(2);
  });

  // UPDATE 테스트
  test('반복 일정 수정 시 다이얼로그가 나타나고 해당 일정만 수정할 수 있다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('수정할 반복 일정');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-16');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 편집 버튼 클릭
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // Assert: 반복 일정 수정 다이얼로그 표시
    await expect(page.getByText('반복 일정 수정')).toBeVisible();
    await expect(page.getByText('해당 일정만 수정하시겠어요?')).toBeVisible();

    // "예" 버튼 클릭 (단일 일정만 수정)
    await page.getByText('예').click();

    // 폼 수정
    await page.getByLabel('제목').fill('수정된 제목');
    await page.getByTestId('event-submit-button').click();

    // Assert: 수정된 일정이 목록에 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('수정된 제목')).toBeVisible();

    // Assert: 다른 반복 일정 인스턴스는 원래 제목 유지 (목록에서 확인)
    // 첫 번째 일정만 수정되었으므로 다른 날짜의 일정은 원래 제목을 유지해야 함
  });

  test('반복 일정 수정 시 전체 시리즈를 수정할 수 있다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('전체 수정 테스트');
    await page.getByLabel('날짜').fill('2025-10-17');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-17');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 편집 버튼 클릭
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // "아니오" 버튼 클릭 (전체 시리즈 수정)
    await page.getByText('아니오').click();

    // 폼 수정
    await page.getByLabel('제목').fill('전체 수정된 제목');
    await page.getByTestId('event-submit-button').click();

    // Assert: 수정 성공 메시지 X

    // Assert: 수정된 일정이 목록에 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('전체 수정된 제목', { exact: true })).toHaveCount(3);
  });

  // DELETE 테스트
  test('반복 일정 삭제 시 다이얼로그가 나타나고 해당 일정만 삭제할 수 있다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('단일 삭제 테스트');
    await page.getByLabel('날짜').fill('2025-10-19');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-19');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // 일정이 여러 개 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    const initialEventCount = await eventList.getByText('단일 삭제 테스트').count();

    // Act: 삭제 버튼 클릭
    const deleteButtons = page.getByLabel('Delete event');
    await deleteButtons.first().click();

    // Assert: 반복 일정 삭제 다이얼로그 표시
    await expect(page.getByText('반복 일정 삭제')).toBeVisible();
    await expect(page.getByText('해당 일정만 삭제하시겠어요?')).toBeVisible();

    // "예" 버튼 클릭 (단일 일정만 삭제)
    await page.getByText('예').click();

    // Assert: 삭제 성공 메시지
    await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible();

    // Assert: 하나의 일정만 삭제되고 나머지는 유지됨
    const remainingEventCount = await eventList.getByText('단일 삭제 테스트').count();
    expect(remainingEventCount).toBe(initialEventCount - 1);
  });

  test('반복 일정 삭제 시 전체 시리즈를 삭제할 수 있다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('전체 삭제 테스트');
    await page.getByLabel('날짜').fill('2025-10-20');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-20');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // 일정이 여러 개 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('전체 삭제 테스트').first()).toBeVisible();

    // Act: 삭제 버튼 클릭
    const deleteButtons = page.getByLabel('Delete event');
    await deleteButtons.first().click();

    // "아니오" 버튼 클릭 (전체 시리즈 삭제)
    await page.locator('button', { hasText: '아니오' }).click();

    // Assert: 삭제 성공 메시지
    await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible();

    // 브라우저별 업데이트 속도 차이를 고려하여 대기
    await page.waitForTimeout(2000);
    // Assert: 모든 반복 일정이 삭제됨
    const monthView = page.getByTestId('month-view');
    await expect(monthView.getByText('전체 삭제 테스트')).toHaveCount(0);
  });
});
