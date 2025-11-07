import { test, expect } from './test-setup';

test.describe('일정 관리 CRUD 기능', () => {
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
  test('일정을 생성하면 일정 목록과 캘린더에 표시된다', async ({ page }) => {
    // Arrange: 일정 생성 폼 작성
    await page.getByLabel('제목').fill('새로운 회의');
    await page.getByLabel('날짜').fill('2025-10-20');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('팀 회의');
    await page.getByLabel('위치').fill('회의실 A');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();

    // Act: 일정 생성 버튼 클릭
    await page.getByTestId('event-submit-button').click();

    await page.waitForSelector('[class*="-success"]');
    // Assert: 성공 메시지 표시
    expect(page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' })).toBeVisible();

    // Assert: 일정 목록에 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('새로운 회의')).toBeVisible();
    await expect(eventList.getByText('2025-10-20')).toBeVisible();
    await expect(eventList.getByText('14:00 - 15:00')).toBeVisible();

    // Assert: 캘린더 월 뷰에 표시됨
    const monthView = page.getByTestId('month-view');
    const targetCell = monthView
      .getByText('20', { exact: true })
      .locator('xpath=ancestor::td')
      .first();
    await expect(
      targetCell.locator('[data-event]').filter({ hasText: '새로운 회의' })
    ).toBeVisible();
  });

  test('필수 필드 없이 일정 생성 시도 시 에러 메시지가 표시된다', async ({ page }) => {
    // Arrange: 필수 필드 없이 폼 작성
    await page.getByLabel('제목').fill('제목만 있는 일정');

    // Act: 일정 생성 버튼 클릭
    await page.getByTestId('event-submit-button').click();

    // Assert: 에러 메시지 표시
    const errorSnackbar = page.getByText('필수 정보를 모두 입력해주세요.');
    await expect(errorSnackbar).toBeVisible();

    // Assert: 일정이 생성되지 않음
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('제목만 있는 일정')).not.toBeVisible();
  });

  // READ 테스트

  // UPDATE 테스트
  test('일정을 수정하면 변경된 정보가 반영된다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('수정 전 제목');
    await page.getByLabel('날짜').fill('2025-10-19');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('수정 전 설명');
    await page.getByLabel('위치').fill('수정 전 위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    // Act: 편집 버튼 클릭
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // 폼 수정
    await page.getByLabel('제목').fill('수정 후 제목');
    await page.getByLabel('설명').fill('수정 후 설명');
    await page.getByLabel('위치').fill('수정 후 위치');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('시작 시간').fill('14:00');

    // 수정 버튼 클릭
    await page.getByTestId('event-submit-button').click();

    // Assert: 수정 성공 메시지 표시
    await page.getByRole('alert').filter({ hasText: '일정이 수정되었습니다' }).waitFor();

    // Assert: 일정 목록에 수정된 정보 표시
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('수정 후 제목')).toBeVisible({ timeout: 10000 });
    await expect(eventList.getByText('수정 후 설명')).toBeVisible();
    await expect(eventList.getByText('수정 후 위치')).toBeVisible();
    await expect(eventList.getByText('14:00 - 15:00')).toBeVisible();

    // Assert: 이전 정보는 더 이상 표시되지 않음
    // 브라우저별 업데이트 속도 차이를 고려하여 대기
    await page.waitForTimeout(500);
    await expect(eventList.getByText('수정 전 제목', { exact: true })).not.toBeVisible({
      timeout: 10000,
    });
  });

  // DELETE 테스트
  test('일정을 삭제하면 일정 목록과 캘린더에서 제거된다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('삭제할 일정');
    await page.getByLabel('날짜').fill('2025-10-21');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('삭제 테스트');
    await page.getByLabel('위치').fill('위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    // 일정이 목록에 있는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('삭제할 일정')).toBeVisible();

    // 캘린더에 일정이 있는지 확인
    const monthView = page.getByTestId('month-view');
    const targetCell = monthView
      .getByText('21', { exact: true })
      .locator('xpath=ancestor::td')
      .first();
    await expect(
      targetCell.locator('[data-event]').filter({ hasText: '삭제할 일정' })
    ).toBeVisible();

    // Act: eventList에서 '삭제할 일정'의 삭제 버튼 클릭
    // 제목 텍스트를 포함하는 Box를 찾고, 그 Box 내부의 Delete 버튼을 찾음
    // 브라우저별 차이를 고려하여 더 안정적인 선택자 사용
    const targetEventTitle = eventList.getByText('삭제할 일정').first();
    const targetEventBox = targetEventTitle
      .locator('xpath=ancestor::*[contains(@class, "MuiBox-root")][1]')
      .first();
    // Box 내부에서 Delete 버튼을 찾되, 첫 번째 것만 선택
    await targetEventBox.locator('button[aria-label="Delete event"]').first().click();

    // Assert: 삭제 성공 메시지 표시
    await page.getByRole('alert').filter({ hasText: '일정이 삭제되었습니다' }).waitFor();

    // Assert: 일정 목록에서 제거됨
    await expect(eventList.getByText('삭제할 일정')).not.toBeVisible();

    // Assert: 캘린더에서도 제거됨
    await expect(
      targetCell.locator('[data-event]').filter({ hasText: '삭제할 일정' })
    ).not.toBeVisible();
  });
});
