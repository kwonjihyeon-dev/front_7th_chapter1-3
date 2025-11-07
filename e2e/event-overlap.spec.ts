import { test, expect } from './test-setup';

test.describe('일정 겹침 처리', () => {
  test.beforeEach(async ({ page }) => {
    // 시간 모킹: 2025-10-15로 고정하여 주 뷰가 해당 주를 표시하도록 설정
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.reload();
    // 일정 로딩 완료 대기
    await page.goto('/');
    const snackbar = page.getByText('일정 로딩 완료!').first();
    await expect(snackbar).toBeVisible();
  });

  // 일정 생성 시 겹침 테스트
  test('일정 생성 시 완전히 겹치는 일정이 있으면 겹침 경고 다이얼로그가 표시된다', async ({
    page,
  }) => {
    // Arrange: 기존 일정 생성
    await page.getByLabel('제목').fill('기존 회의');
    await page.getByLabel('날짜').fill('2025-10-20');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 겹치는 일정 생성 시도
    await page.getByLabel('제목').fill('겹의치는회');
    await page.getByLabel('날짜').fill('2025-10-20');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('겹치는 일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // Assert: 겹침 경고 다이얼로그 표시
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();
    await expect(page.getByText('다음 일정과 겹칩니다:')).toBeVisible();
    await expect(
      page
        .getByText('기존 회의')
        .filter({ hasText: /^기존 회의$/ })
        .first()
    ).toBeVisible();
    await expect(page.getByText('계속 진행하시겠습니까?')).toBeVisible();
  });

  test('일정 생성 시 겹침 경고 후 계속 진행을 선택하면 일정이 생성된다', async ({ page }) => {
    // Arrange: 기존 일정 생성
    await page.getByLabel('제목').fill('기존 회의');
    await page.getByLabel('날짜').fill('2025-10-26');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 겹치는 일정 생성 시도
    await page.getByLabel('제목').fill('겹쳐스');
    await page.getByLabel('날짜').fill('2025-10-26');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('겹일');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // 겹침 경고 다이얼로그에서 "계속 진행" 클릭
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();
    await page.getByRole('button', { name: '계속 진행' }).click();
  });

  test('일정 생성 시 겹침 경고 후 취소를 선택하면 일정이 생성되지 않는다', async ({ page }) => {
    // Arrange: 기존 일정 생성
    await page.getByLabel('제목').fill('기존 회의');
    await page.getByLabel('날짜').fill('2025-10-27');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('일정');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 겹치는 일정 생성 시도
    await page.getByLabel('제목').fill('취소스');
    await page.getByLabel('날짜').fill('2025-10-27');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('솔명');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // 겹침 경고 다이얼로그에서 "취소" 클릭
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();
    await page.getByText('취소').click();

    // Assert: 다이얼로그가 닫히고 일정이 생성되지 않음
    await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('취소할 회의')).not.toBeVisible();
    await expect(page.getByText('일정이 추가되었습니다')).not.toBeVisible();
  });

  // 일정 수정 시 겹침 테스트
  test('일정 수정 시 겹치는 일정이 있으면 겹침 경고 다이얼로그가 표시된다', async ({ page }) => {
    // Arrange: 첫 번째 일정 생성
    await page.getByLabel('제목').fill('첫 번째 회의');
    await page.getByLabel('날짜').fill('2025-10-28');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('1');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // 두 번째 일정 생성
    await page.getByLabel('제목').fill('두 번째 회의');
    await page.getByLabel('날짜').fill('2025-10-28');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('2');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다').first()).toBeVisible();

    // Act: 첫 번째 일정을 수정하여 두 번째 일정과 겹치도록 변경
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByTestId('event-submit-button').click();

    // Assert: 겹침 경고 다이얼로그 표시
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();
    await expect(
      page
        .getByText('두 번째 회의')
        .filter({ hasText: /^두 번째 회의$/ })
        .first()
    ).toBeVisible();
  });

  test('일정 수정 시 겹침 경고 후 계속 진행을 선택하면 일정이 수정된다', async ({ page }) => {
    // Arrange: 첫 번째 일정 생성
    await page.getByLabel('제목').fill('수정할 회의');
    await page.getByLabel('날짜').fill('2025-10-29');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('수졍');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // 두 번째 일정 생성
    await page.getByLabel('제목').fill('기존 회의');
    await page.getByLabel('날짜').fill('2025-10-29');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('설명');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 첫 번째 일정 수정하여 겹치도록 변경
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByTestId('event-submit-button').click();

    // 겹침 경고 다이얼로그에서 "계속 진행" 클릭
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();
    await page.getByRole('button', { name: '계속 진행' }).click();

    // Assert: 일정이 수정됨
    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();
  });

  // 엣지 케이스 테스트
  test('연속된 시간대의 일정은 겹치지 않는다 (한 일정의 종료 시간 = 다른 일정의 시작 시간)', async ({
    page,
  }) => {
    // Arrange: 첫 번째 일정 생성 (14:00-15:00)
    await page.getByLabel('제목').fill('첫 번째 회의');
    await page.getByLabel('날짜').fill('2025-11-01');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('첫 번째');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 연속된 시간대의 일정 생성 (15:00-16:00)
    await page.getByLabel('제목').fill('두 번째 회의');
    await page.getByLabel('날짜').fill('2025-11-01');
    await page.getByLabel('시작 시간').fill('15:00');
    await page.getByLabel('종료 시간').fill('16:00');
    await page.getByLabel('설명').fill('두 번째');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByTestId('event-submit-button').click();

    // Assert: 겹침 경고가 표시되지 않음
    await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();
    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();
  });
});
