import { test, expect } from './test-setup';

test.describe('드래그 앤 드롭 기능', () => {
  // test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ page }) => {
    // 시간 모킹: 2025-10-15로 고정하여 주 뷰가 해당 주를 표시하도록 설정
    // beforeEach에서 이미 page.goto를 호출했으므로, 시간 모킹 후 reload
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.reload();
    // 일정 로딩 완료 대기
    await page.goto('/');
    // 일정 로딩 완료 대기
    const snackbar = page.getByText('일정 로딩 완료!').first();
    // 스낵바가 나타날 때까지 대기
    await expect(snackbar).toBeVisible();
  });

  // 시나리오 1: 정상적인 드래그 앤 드롭 (FR1, FR5, FR7)
  test('월 뷰에서 일정을 드래그하여 다른 날짜로 이동하면 날짜가 변경되고 시간은 유지된다', async ({
    page,
  }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('회의');
    await page.getByLabel('날짜').fill('2025-10-04');
    await page.getByLabel('시작 시간').fill('16:00');
    await page.getByLabel('종료 시간').fill('17:00');
    await page.getByLabel('설명').fill('팀 회의');
    await page.getByLabel('위치').fill('회의실 A');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // 일정이 생성될 때까지 대기
    const snackbar = page.getByText('일정이 추가되었습니다');
    await expect(snackbar).toBeVisible();

    // Act: 드래그 앤 드롭
    const eventBox = page.locator('[data-event]').first();
    const monthView = page.getByTestId('month-view');
    const targetCell = monthView.locator('td').filter({ hasText: '17' }).first();
    await eventBox.dragTo(targetCell);

    // Assert: 날짜 변경, 시간 유지, 스낵바 표시
    // 월간 뷰의 15일 셀에 일정이 있는지 확인
    await expect(targetCell.locator('[data-event]').filter({ hasText: '회의' })).toBeVisible();
    await expect(page.getByText('16:00 - 17:00')).toBeVisible();
    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();
  });

  test('주 뷰에서 일정을 드래그하여 다른 날짜로 이동하면 날짜가 변경되고 시간은 유지된다', async ({
    page,
  }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('점심 약속');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('12:00');
    await page.getByLabel('종료 시간').fill('13:00');
    await page.getByLabel('설명').fill('친구와 점심');
    await page.getByLabel('위치').fill('레스토랑');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '개인-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // 일정이 생성될 때까지 대기
    const createSnackbar = page.getByText('일정이 추가되었습니다');
    await expect(createSnackbar).toBeVisible();

    // 주 뷰로 변경
    await page.getByLabel('뷰 타입 선택').click();
    await page.getByRole('option', { name: 'week-option' }).click();

    // 주 뷰 렌더링 대기
    const weekView = page.getByTestId('week-view');
    await expect(weekView).toBeVisible();

    // 시간 모킹으로 인해 2025-10-15가 포함된 주가 표시되므로
    // 15일 셀과 일정이 바로 보여야 함
    const eventDateCell = weekView.locator('td').filter({ hasText: '15' }).first();
    await expect(eventDateCell).toBeVisible();

    // 해당 날짜 셀에서 일정 박스 찾기
    const eventBox = eventDateCell.locator('[data-event]').filter({ hasText: '점심 약속' }).first();
    await expect(eventBox).toBeVisible();

    const targetCell = weekView.locator('td').filter({ hasText: '18' }).first();
    // 타겟 셀이 보일 때까지 대기
    await expect(targetCell).toBeVisible({ timeout: 10000 });

    await eventBox.dragTo(targetCell);

    // Assert: 날짜 변경, 시간 유지, 스낵바 표시
    await expect(page.getByText('2025-10-18')).toBeVisible();
    await expect(page.getByText('12:00 - 13:00')).toBeVisible();
    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();
  });

  // 시나리오 2: 반복 일정 드래그 앤 드롭 (FR2)
  test('반복 일정을 드래그하여 다른 날짜로 이동하면 단일 일정으로 변환된다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('매주 회의');
    await page.getByLabel('날짜').fill('2025-10-03'); // 월요일
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
    await page.getByTestId('event-submit-button').click();

    // 일정이 생성될 때까지 대기
    const snackbar = page.getByText('일정이 추가되었습니다');
    await expect(snackbar).toBeVisible();

    // 반복 일정 확인 (반복 아이콘 표시 확인)
    const recurringEventBox = page.locator('[data-event]').first();

    // Act: 드래그 앤 드롭
    const monthView = page.getByTestId('month-view');
    const targetCell = monthView.locator('td').filter({ hasText: '5' }).first();
    await recurringEventBox.dragTo(targetCell);

    // Assert: 날짜 변경, 반복 설정 제거, 스낵바 표시
    await expect(targetCell.locator('[data-event]').filter({ hasText: '매주 회의' })).toBeVisible();
    // 반복 아이콘이 사라졌는지 확인 (일정 목록에서)
    await expect(
      page.locator('[data-testid="event-list"]').locator('[aria-label="Repeat"]')
    ).not.toBeVisible();
    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();
  });

  // 시나리오 3: 겹침 발생 시 (FR3)
  test('드롭 위치에 겹치는 일정이 있으면 겹침 경고 다이얼로그가 표시되고 드롭이 취소된다', async ({
    page,
  }) => {
    // Arrange: 기존 일정 생성
    await page.getByLabel('제목').fill('기존 회의');
    await page.getByLabel('날짜').fill('2025-10-20');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('기존 일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // 일정이 생성될 때까지 대기
    const snackbar = page.getByText('일정이 추가되었습니다');
    await expect(snackbar).toBeVisible();

    // 새로운 일정 생성 (겹치는 시간대)
    await page.getByLabel('제목').fill('새 회의');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('새 일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // 일정이 생성될 때까지 대기
    // const snackbar = page.getByText('일정이 추가되었습니다');
    await expect(snackbar).toBeVisible();

    // Act: 드래그 앤 드롭 (겹치는 위치로)
    const eventBox = page.locator('[data-event]').filter({ hasText: '새 회의' }).first();
    const monthView = page.getByTestId('month-view');
    const targetCell = monthView.locator('td').filter({ hasText: '20' }).first();
    await eventBox.dragTo(targetCell);

    // Assert: 겹침 경고 다이얼로그 표시
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();
    await expect(page.getByRole('presentation').getByText(/기존 회의/)).toBeVisible();
    await expect(page.getByText('취소')).toBeVisible();

    // "취소" 버튼 클릭
    await page.getByText('취소').click();

    // 일정이 원래 위치에 유지됨
    const originCell = monthView.locator('td').filter({ hasText: '15' }).first();
    // 15일 셀 내부에 '새 회의' 일정이 있는지 확인
    await expect(originCell.locator('[data-event]').filter({ hasText: '새 회의' })).toBeVisible();
    // 일정 목록에서도 날짜가 2025-10-15인지 확인
    await expect(page.getByText('2025-10-15')).toBeVisible();
  });

  // 시나리오 4: 편집 중 드래그 - 편집 취소 선택 (FR4)
  test('편집 중인 상태에서 다른 일정을 드래그하면 편집 모드 취소 다이얼로그가 표시되고, 편집 취소 선택 시 드래그가 진행된다', async ({
    page,
  }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('편집할 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('편집 일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    const snackbar = page.getByText('일정이 추가되었습니다');
    await expect(snackbar).toBeVisible();

    // 다른 일정 생성
    await page.getByLabel('제목').fill('드래그할 일정');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('드래그 일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();
    await expect(snackbar).toBeVisible();

    // 편집 모드 진입
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // Act: 다른 일정을 드래그 시작
    const otherEventBox = page.locator('[data-event]').filter({ hasText: '드래그할 일정' }).first();
    const monthView = page.getByTestId('month-view');
    const targetCell = monthView.locator('td').filter({ hasText: '20' }).first();
    await otherEventBox.dragTo(targetCell);

    // Assert: 편집 모드 취소 다이얼로그 표시
    await expect(page.getByText('편집 모드 취소')).toBeVisible();
    await expect(page.getByText(/편집을 취소하고 일정을 이동하시겠습니까/)).toBeVisible();

    // "편집 취소" 버튼 클릭
    await page.getByText('편집 취소').click();

    // 드래그 앤 드롭 완료 및 일정 이동 확인
    const button = page.getByTestId('event-submit-button');
    await expect(button.getByText('일정 추가')).toBeVisible(); // 편집 모드 취소 확인
    await expect(
      targetCell.locator('[data-event]').filter({ hasText: '드래그할 일정' })
    ).toBeVisible();
    // await expect(page.getByText('2025-10-20')).toBeVisible(); // 일정이 새로운 날짜로 이동
    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();
  });

  // 시나리오 5: 편집 중 드래그 - 편집 유지 선택 (FR4)
  test('편집 중인 상태에서 다른 일정을 드래그하면 편집 모드 취소 다이얼로그가 표시되고, 편집 유지 선택 시 드래그가 취소된다', async ({
    page,
  }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('편집할 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('편집 일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();
    const snackbar = page.getByText('일정이 추가되었습니다');
    await expect(snackbar).toBeVisible();

    // 다른 일정 생성
    await page.getByLabel('제목').fill('드래그할 일정');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('드래그 일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();
    await expect(snackbar).toBeVisible();

    // 편집 모드 진입
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // Act: 다른 일정을 드래그 시작
    const otherEventBox = page.locator('[data-event]').filter({ hasText: '드래그할 일정' }).first();
    const monthView = page.getByTestId('month-view');
    const targetCell = monthView.locator('td').filter({ hasText: '20' }).first();
    await otherEventBox.dragTo(targetCell);

    // Assert: 편집 모드 취소 다이얼로그 표시
    await expect(page.getByText('편집 모드 취소')).toBeVisible();

    // "편집 유지" 버튼 클릭
    await page.getByText('편집 유지').click();
    // Assert: 편집 모드 유지, 드래그한 일정이 원래 위치에 유지
    const button = page.getByTestId('event-submit-button');
    await expect(button.getByText('일정 수정')).toBeVisible(); // 편집 모드 유지 확인
    // 드래그한 일정이 원래 위치(2025-10-16)에 유지되는지 확인
    const originCell = monthView.locator('td').filter({ hasText: '16' }).first();
    await expect(
      originCell.locator('[data-event]').filter({ hasText: '드래그할 일정' })
    ).toBeVisible();
    await expect(page.getByText('일정이 수정되었습니다')).not.toBeVisible(); // 스낵바 표시 안됨
  });

  // 시나리오 6: 드롭 불가능한 영역에 드롭 (FR8)
  test('드롭 불가능한 영역에 드롭하면 일정이 원래 위치로 복귀한다', async ({ page }) => {
    // Arrange: 일정 생성
    await page.getByLabel('제목').fill('드래그 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('테스트 일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    const snackbar = page.getByText('일정이 추가되었습니다');
    await expect(snackbar).toBeVisible();

    // Act: 드롭 불가능한 영역(일정 목록 영역)으로 드래그 앤 드롭
    const eventBox = page.locator('[data-event]').first();
    const eventList = page.getByTestId('event-list');
    await eventBox.dragTo(eventList);

    // Assert: 일정이 원래 위치에 유지됨
    // 일정 목록에서 날짜가 2025-10-15로 유지되는지 확인
    await expect(eventList.getByText('드래그 테스트')).toBeVisible();
    // 월간 뷰의 15일 셀에 일정이 있는지 확인
    const monthView = page.getByTestId('month-view');
    const originCell = monthView.locator('td').filter({ hasText: '15' }).first();
    await expect(
      originCell.locator('[data-event]').filter({ hasText: '드래그 테스트' })
    ).toBeVisible();
    await expect(page.getByText('일정이 수정되었습니다')).not.toBeVisible(); // 스낵바 표시 안됨
  });
});
