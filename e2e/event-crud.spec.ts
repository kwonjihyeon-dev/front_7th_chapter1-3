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

    // Assert: 성공 메시지 표시
    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

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
  test('생성된 일정의 상세 정보가 일정 목록에 올바르게 표시된다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('상세 정보 테스트');
    await page.getByLabel('날짜').fill('2025-10-18');
    await page.getByLabel('시작 시간').fill('09:00');
    await page.getByLabel('종료 시간').fill('10:30');
    await page.getByLabel('설명').fill('상세 설명입니다');
    await page.getByLabel('위치').fill('오피스 빌딩');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '개인-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // 일정 생성 완료 대기
    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    // Assert: 일정 목록에서 모든 정보 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('상세 정보 테스트')).toBeVisible();
    await expect(eventList.getByText('2025-10-18')).toBeVisible();
    await expect(eventList.getByText('09:00 - 10:30')).toBeVisible();
    await expect(eventList.getByText('상세 설명입니다')).toBeVisible();
    await expect(eventList.getByText('오피스 빌딩')).toBeVisible();
  });

  test('여러 일정을 생성하면 모두 일정 목록에 표시된다', async ({ page }) => {
    // Arrange & Act: 첫 번째 일정 생성
    await page.getByLabel('제목').fill('첫 번째 일정');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명1');
    await page.getByLabel('위치').fill('위치1');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    // 두 번째 일정 생성
    await page.getByLabel('제목').fill('두 번째 일정');
    await page.getByLabel('날짜').fill('2025-10-17');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('설명2');
    await page.getByLabel('위치').fill('위치2');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '개인-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    // Assert: 두 일정 모두 목록에 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('첫 번째 일정')).toBeVisible();
    await expect(eventList.getByText('두 번째 일정')).toBeVisible();
  });

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
    await expect(eventList.getByText('수정 전 제목')).not.toBeVisible({ timeout: 10000 });
  });

  test('일정 수정 시 날짜를 변경하면 캘린더에서 위치가 변경된다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('날짜 변경 테스트');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    // 원래 날짜에 일정이 있는지 확인
    const monthView = page.getByTestId('month-view');
    const originalCell = monthView
      .getByText('16', { exact: true })
      .locator('xpath=ancestor::td')
      .first();
    await expect(
      originalCell.locator('[data-event]').filter({ hasText: '날짜 변경 테스트' })
    ).toBeVisible();

    // Act: 편집 버튼 클릭
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // 날짜 변경
    await page.getByLabel('날짜').fill('2025-10-25');
    await page.getByTestId('event-submit-button').click();

    // snackbar가 나타날 때까지 대기
    await page.getByRole('alert').filter({ hasText: '일정이 수정되었습니다' }).waitFor();

    // 캘린더 업데이트를 위한 추가 대기 (브라우저별 차이 고려)
    await page.waitForTimeout(1000);

    // Assert: 새로운 날짜에 일정이 표시됨
    // 캘린더가 업데이트될 때까지 대기
    const updatedMonthView = page.getByTestId('month-view');

    // 먼저 일정이 존재하는지 확인 (어느 셀에 있든)
    await expect(
      updatedMonthView.locator('[data-event]').filter({ hasText: '날짜 변경 테스트' })
    ).toBeVisible({ timeout: 10000 });

    // Assert: 원래 날짜(16일)에는 더 이상 표시되지 않음
    // 브라우저별 렌더링 차이를 고려하여 충분한 대기 시간 제공
    const originalCellUpdated = updatedMonthView
      .getByText('16', { exact: true })
      .locator('xpath=ancestor::td')
      .first();

    // 원래 셀에서 일정이 사라질 때까지 대기
    await expect(
      originalCellUpdated.locator('[data-event]').filter({ hasText: '날짜 변경 테스트' })
    ).not.toBeVisible({ timeout: 10000 });
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

  test('여러 일정 중 하나를 삭제하면 나머지 일정은 유지된다', async ({ page }) => {
    // Arrange: 두 개의 일정 생성
    await page.getByLabel('제목').fill('유지할 일정');
    await page.getByLabel('날짜').fill('2025-10-22');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('설명1');
    await page.getByLabel('위치').fill('위치1');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    await page.getByLabel('제목').fill('삭제할 일정');
    await page.getByLabel('날짜').fill('2025-10-23');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('설명2');
    await page.getByLabel('위치').fill('위치2');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '개인-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('유지할 일정')).toBeVisible();
    await expect(eventList.getByText('삭제할 일정')).toBeVisible();

    // Act: eventList에서 '삭제할 일정'의 삭제 버튼 클릭
    // 제목 텍스트를 포함하는 Box를 찾고, 그 Box 내부의 Delete 버튼을 찾음
    // 브라우저별 차이를 고려하여 더 안정적인 선택자 사용
    const targetEventTitle = eventList.getByText('삭제할 일정').first();
    const targetEventBox = targetEventTitle
      .locator('xpath=ancestor::*[contains(@class, "MuiBox-root")][1]')
      .first();
    // Box 내부에서 Delete 버튼을 찾되, 첫 번째 것만 선택
    await targetEventBox.locator('button[aria-label="Delete event"]').first().click();

    await page.waitForSelector('text=일정이 삭제되었습니다');

    // Assert: 삭제된 일정은 목록에서 제거됨
    await expect(eventList.getByText('삭제할 일정')).not.toBeVisible();

    // Assert: 나머지 일정은 유지됨
    await expect(eventList.getByText('유지할 일정')).toBeVisible();
  });

  // 통합 테스트: CRUD 전체 워크플로우
  test('일정 생성, 조회, 수정, 삭제 전체 워크플로우가 정상적으로 동작한다', async ({ page }) => {
    // CREATE: 일정 생성
    await page.getByLabel('제목').fill('통합 테스트 일정');
    await page.getByLabel('날짜').fill('2025-10-24');
    await page.getByLabel('시작 시간').fill('09:00');
    await page.getByLabel('종료 시간').fill('10:00');
    await page.getByLabel('설명').fill('통합 테스트');
    await page.getByLabel('위치').fill('테스트 위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 추가되었습니다' }).waitFor();

    // READ: 일정 조회 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('통합 테스트 일정')).toBeVisible();

    // UPDATE: 일정 수정
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    await page.getByLabel('제목').fill('수정된 통합 테스트 일정');
    await page.getByTestId('event-submit-button').click();

    await page.getByRole('alert').filter({ hasText: '일정이 수정되었습니다' }).waitFor();
    await expect(eventList.getByText('수정된 통합 테스트 일정')).toBeVisible();

    // DELETE: 일정 삭제
    const deleteButtons = page.getByLabel('Delete event');
    await deleteButtons.first().click();

    await page.waitForSelector('text=일정이 삭제되었습니다');
    await expect(eventList.getByText('수정된 통합 테스트 일정')).not.toBeVisible();
  });
});
