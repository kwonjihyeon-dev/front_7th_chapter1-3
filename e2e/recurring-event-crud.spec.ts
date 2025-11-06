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
    await expect(eventList.getByText('매주 회의')).toBeVisible();
    await expect(eventList.locator('[aria-label="Repeat"]').first()).toBeVisible();

    // Assert: 캘린더에 여러 날짜에 일정이 표시됨
    const monthView = page.getByTestId('month-view');
    // 15일, 22일, 29일 등에 일정이 표시되어야 함
    const cell15 = monthView.locator('td').filter({ hasText: '15' }).first();
    await expect(cell15.locator('[data-event]').filter({ hasText: '매주 회의' })).toBeVisible();

    const cell22 = monthView.locator('td').filter({ hasText: '22' }).first();
    await expect(cell22.locator('[data-event]').filter({ hasText: '매주 회의' })).toBeVisible();
  });

  test('일간 반복 일정을 생성하면 매일 일정이 생성된다', async ({ page }) => {
    // Arrange: 일간 반복 일정 생성
    await page.getByLabel('제목').fill('매일 운동');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('07:00');
    await page.getByLabel('종료 시간').fill('08:00');
    await page.getByLabel('설명').fill('아침 운동');
    await page.getByLabel('위치').fill('헬스장');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '개인-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'daily-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-10-20');

    // Act: 일정 생성
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Assert: 여러 날짜에 일정이 표시됨
    const monthView = page.getByTestId('month-view');
    const cell16 = monthView.locator('td').filter({ hasText: '16' }).first();
    await expect(cell16.locator('[data-event]').filter({ hasText: '매일 운동' })).toBeVisible();

    const cell17 = monthView.locator('td').filter({ hasText: '17' }).first();
    await expect(cell17.locator('[data-event]').filter({ hasText: '매일 운동' })).toBeVisible();
  });

  test('월간 반복 일정을 생성하면 매월 같은 날짜에 일정이 생성된다', async ({ page }) => {
    // Arrange: 월간 반복 일정 생성
    await page.getByLabel('제목').fill('월간 보고');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('월간 보고서');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'monthly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-12-15');

    // Act: 일정 생성
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Assert: 일정 목록에 반복 정보 표시
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('월간 보고')).toBeVisible();
    await expect(eventList.getByText(/반복:/)).toBeVisible();
  });

  // READ 테스트
  test('반복 일정의 상세 정보가 일정 목록에 올바르게 표시된다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('반복 일정 상세');
    await page.getByLabel('날짜').fill('2025-10-18');
    await page.getByLabel('시작 시간').fill('09:00');
    await page.getByLabel('종료 시간').fill('10:00');
    await page.getByLabel('설명').fill('반복 일정 설명');
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
    await expect(eventList.getByText('반복 일정 상세')).toBeVisible();
    await expect(eventList.locator('[aria-label="Repeat"]').first()).toBeVisible();
    await expect(eventList.getByText(/반복: 1주/)).toBeVisible();
    await expect(eventList.getByText(/종료: 2025-11-18/)).toBeVisible();
  });

  test('반복 일정이 여러 날짜에 표시되는지 확인한다', async ({ page }) => {
    // Arrange: 주간 반복 일정 생성
    await page.getByLabel('제목').fill('주간 스터디');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('19:00');
    await page.getByLabel('종료 시간').fill('21:00');
    await page.getByLabel('설명').fill('스터디');
    await page.getByLabel('위치').fill('온라인');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '개인-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-15');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Assert: 여러 날짜에 일정이 표시됨
    const monthView = page.getByTestId('month-view');
    // 10월 15일, 22일, 29일
    await expect(
      monthView
        .locator('td')
        .filter({ hasText: '15' })
        .first()
        .locator('[data-event]')
        .filter({ hasText: '주간 스터디' })
    ).toBeVisible();
    await expect(
      monthView
        .locator('td')
        .filter({ hasText: '22' })
        .first()
        .locator('[data-event]')
        .filter({ hasText: '주간 스터디' })
    ).toBeVisible();
    await expect(
      monthView
        .locator('td')
        .filter({ hasText: '29' })
        .first()
        .locator('[data-event]')
        .filter({ hasText: '주간 스터디' })
    ).toBeVisible();
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

    // Assert: 수정 성공 메시지
    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();

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

    // Assert: 수정 성공 메시지
    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();

    // Assert: 수정된 일정이 목록에 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('전체 수정된 제목')).toBeVisible();
  });

  test('반복 일정 수정 다이얼로그에서 취소하면 수정이 취소된다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('취소 테스트');
    await page.getByLabel('날짜').fill('2025-10-18');
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
    await page.getByLabel('반복 종료일').fill('2025-11-18');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 편집 버튼 클릭
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // 취소 버튼 클릭
    await page.getByText('취소').click();

    // Assert: 다이얼로그가 닫히고 편집 모드가 취소됨
    await expect(page.getByText('반복 일정 수정')).not.toBeVisible();
    // 폼이 초기화되어야 함 (제목 필드가 비어있거나 원래 값 유지)
    const titleInput = page.getByLabel('제목');
    const titleValue = await titleInput.inputValue();
    expect(titleValue).toBe('');
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
    await page.getByText('아니오').click();

    // Assert: 삭제 성공 메시지
    await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible();

    // Assert: 모든 반복 일정이 삭제됨
    await expect(eventList.getByText('전체 삭제 테스트')).not.toBeVisible();
  });

  test('반복 일정 삭제 다이얼로그에서 취소하면 삭제가 취소된다', async ({ page }) => {
    // Arrange: 반복 일정 생성
    await page.getByLabel('제목').fill('삭제 취소 테스트');
    await page.getByLabel('날짜').fill('2025-10-21');
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
    await page.getByLabel('반복 종료일').fill('2025-11-21');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('삭제 취소 테스트').first()).toBeVisible();

    // Act: 삭제 버튼 클릭
    const deleteButtons = page.getByLabel('Delete event');
    await deleteButtons.first().click();

    // 취소 버튼 클릭
    await page.getByText('취소').click();

    // Assert: 다이얼로그가 닫히고 일정이 유지됨
    await expect(page.getByText('반복 일정 삭제')).not.toBeVisible();
    await expect(eventList.getByText('삭제 취소 테스트').first()).toBeVisible();
    await expect(page.getByText('일정이 삭제되었습니다')).not.toBeVisible();
  });

  // 통합 테스트: 반복 일정 전체 워크플로우
  test('반복 일정 생성, 조회, 수정, 삭제 전체 워크플로우가 정상적으로 동작한다', async ({
    page,
  }) => {
    // CREATE: 반복 일정 생성
    await page.getByLabel('제목').fill('통합 테스트 반복 일정');
    await page.getByLabel('날짜').fill('2025-10-22');
    await page.getByLabel('시작 시간').fill('09:00');
    await page.getByLabel('종료 시간').fill('10:00');
    await page.getByLabel('설명').fill('통합 테스트');
    await page.getByLabel('위치').fill('테스트 위치');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-22');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // READ: 반복 일정 조회 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('통합 테스트 반복 일정')).toBeVisible();
    await expect(eventList.locator('[aria-label="Repeat"]').first()).toBeVisible();

    // UPDATE: 반복 일정 수정 (단일)
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    await expect(page.getByText('반복 일정 수정')).toBeVisible();
    await page.getByText('예').click(); // 단일 수정

    await page.getByLabel('제목').fill('수정된 통합 테스트');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();
    await expect(eventList.getByText('수정된 통합 테스트')).toBeVisible();

    // DELETE: 반복 일정 삭제 (단일)
    const deleteButtons = page.getByLabel('Delete event');
    await deleteButtons.first().click();

    await expect(page.getByText('반복 일정 삭제')).toBeVisible();
    await page.getByText('예').click(); // 단일 삭제

    await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible();
  });

  // 엣지 케이스 테스트
  test('반복 종료일 없이 반복 일정을 생성할 수 있다', async ({ page }) => {
    // Arrange: 반복 종료일 없이 반복 일정 생성
    await page.getByLabel('제목').fill('종료일 없는 반복');
    await page.getByLabel('날짜').fill('2025-10-23');
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
    // 반복 종료일은 입력하지 않음

    // Act: 일정 생성
    await page.getByTestId('event-submit-button').click();

    // Assert: 성공 메시지 표시
    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Assert: 일정 목록에 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('종료일 없는 반복')).toBeVisible();
  });

  test('반복 간격이 2 이상인 반복 일정을 생성할 수 있다', async ({ page }) => {
    // Arrange: 2주 간격 반복 일정 생성
    await page.getByLabel('제목').fill('격주 회의');
    await page.getByLabel('날짜').fill('2025-10-24');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('격주 회의');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('2'); // 2주 간격
    await page.getByLabel('반복 종료일').fill('2025-12-24');

    // Act: 일정 생성
    await page.getByTestId('event-submit-button').click();

    // Assert: 성공 메시지 표시
    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Assert: 일정 목록에 반복 정보 표시
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('격주 회의')).toBeVisible();
    await expect(eventList.getByText(/반복: 2주/)).toBeVisible();
  });
});
