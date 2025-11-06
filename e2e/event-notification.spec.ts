import { test, expect } from './test-setup';

test.describe('일정 알림 노출', () => {
  test.beforeEach(async ({ page }) => {
    // 시간 모킹: 2025-10-15 10:00:00로 고정
    await page.clock.setFixedTime(new Date('2025-10-01 10:00:00'));
    await page.reload();
    // 일정 로딩 완료 대기
    await page.goto('/');
    const snackbar = page.getByText('일정 로딩 완료!').first();
    await expect(snackbar).toBeVisible();
  });

  // 알림 표시 테스트
  test('알림 시간이 도래한 일정에 대해 알림이 표시된다', async ({ page }) => {
    // Arrange: 알림 시간이 10분 전인 일정 생성 (10:10 시작)
    await page.getByLabel('제목').fill('알림 테스트 일정');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('알림 테스트');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 10:00으로 이동 (알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.clock.fastForward('01:00'); // 알림 체크 간격(1초)보다 조금 더 대기

    // Assert: 알림이 표시됨
    const notificationAlert = page.getByText('10분 후 알림 테스트 일정 일정이 시작됩니다.');
    await expect(notificationAlert).toBeVisible({ timeout: 5000 });
  });

  test('알림 메시지가 올바른 형식으로 표시된다', async ({ page }) => {
    // Arrange: 알림 시간이 1분 전인 일정 생성 (10:01 시작)
    await page.getByLabel('제목').fill('1분 전 알림');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('1분 전');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '1분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    const snackbar = page.getByRole('alert').first();
    await snackbar.waitFor({ state: 'visible', timeout: 5000 });
    // await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    await expect(snackbar).toContainText('일정이 추가되었습니다');

    // Act: 시간을 10:00으로 이동 (알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:09:00'));
    await page.waitForTimeout(1500);

    // Assert: 알림 메시지 형식 확인
    const notificationAlert = page.getByText('1분 후 1분 전 알림 일정이 시작됩니다.');
    await expect(notificationAlert).toBeVisible({ timeout: 5000 });
  });

  test('알림이 표시된 일정은 일정 목록에 알림 아이콘이 표시된다', async ({ page }) => {
    // Arrange: 알림 시간이 10분 전인 일정 생성 (10:10 시작)
    await page.getByLabel('제목').fill('아이콘 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('아이콘 테스트');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 10:00으로 이동 (알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.waitForTimeout(1500);

    // Assert: 알림이 표시됨
    await expect(page.getByText('10분 후 아이콘 테스트 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });

    // Assert: 일정 목록에 알림 아이콘 표시
    const eventList = page.getByTestId('event-list');
    // const notificationIcon = eventList.locator('[aria-label="Notifications"]').first();
    // Assert: 일정 제목이 굵게 표시되고 빨간색으로 표시됨
    const eventTitle = eventList.locator('div').filter({ hasText: /^아이콘 테스트$/ });
    await expect(eventTitle.getByText('아이콘 테스트')).toHaveCSS('font-weight', '700');
    await expect(eventTitle.getByText('아이콘 테스트')).toHaveCSS('color', 'rgb(211, 47, 47)'); // error color
  });

  test('알림을 닫을 수 있다', async ({ page }) => {
    // Arrange: 알림 시간이 10분 전인 일정 생성 (10:10 시작)
    await page.getByLabel('제목').fill('닫기 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('닫기 테스트');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 10:00으로 이동 (알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.waitForTimeout(1500);

    // 알림이 표시되는지 확인
    const notificationAlert = page.getByText('10분 후 닫기 테스트 일정이 시작됩니다.');
    await expect(notificationAlert).toBeVisible({ timeout: 5000 });

    // Act: 알림 닫기 버튼 클릭
    await page.locator('.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeSmall').click();

    // Assert: 알림이 사라짐
    await expect(notificationAlert).not.toBeVisible();
  });

  test('이미 알림이 간 일정은 중복 알림이 발생하지 않는다', async ({ page }) => {
    // Arrange: 알림 시간이 10분 전인 일정 생성 (10:10 시작)
    await page.getByLabel('제목').fill('중복 알림 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('중복 알림');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 10:00으로 이동 (알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.waitForTimeout(1500);

    // 첫 번째 알림 확인
    const notificationAlert = page.getByText('10분 후 중복 알림 테스트 일정이 시작됩니다.');
    await expect(notificationAlert).toBeVisible({ timeout: 5000 });

    await page.locator('.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeSmall').click();

    // Act: 시간을 더 진행시켜도 (알림 시간 범위 내)
    await page.clock.setFixedTime(new Date('2025-10-15 10:05:00'));
    await page.waitForTimeout(1500);

    // Assert: 알림을 껐으니 중복 알림이 발생하지 않음 (알림은 하나만 존재)
    await expect(notificationAlert).not.toBeVisible({ timeout: 5000 });
  });

  test('여러 일정의 알림이 동시에 표시될 수 있다', async ({ page }) => {
    // Arrange: 첫 번째 일정 생성 (10:10 시작, 10분 전 알림)
    await page.getByLabel('제목').fill('첫 번째 알림');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('1');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByTestId('event-list').getByText('첫 번째 알림')).toBeVisible();
    // await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // 두 번째 일정 생성 (10:11 시작, 10분 전 알림)
    await page.getByLabel('제목').fill('두 번째 알림');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:11');
    await page.getByLabel('종료 시간').fill('12:00');
    await page.getByLabel('설명').fill('2');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    // Assert: 두 번째 일정이 캘린더에 추가되었는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('두 번째 알림')).toBeVisible();

    // Act: 시간을 10:01로 이동 (두 일정 모두 알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:01:00'));
    await page.waitForTimeout(1500);

    // Assert: 두 알림이 모두 표시됨
    await expect(page.getByText('10분 후 첫 번째 알림 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('10분 후 두 번째 알림 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });
  });

  test('알림 시간이 지난 일정은 알림이 표시되지 않는다', async ({ page }) => {
    // Arrange: 알림 시간이 10분 전인 일정 생성 (10:10 시작)
    await page.getByLabel('제목').fill('지난 알림 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('지난 알림');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    const snackbar = page.getByRole('alert').first();
    await expect(snackbar).toContainText('일정이 추가되었습니다');

    // Act: 시간을 10:11로 이동 (알림 시간이 지남)
    await page.clock.setFixedTime(new Date('2025-10-15 10:11:00'));
    await page.waitForTimeout(1500);

    // Assert: 알림이 표시되지 않음
    await expect(page.getByText('10분 후 지난 알림 테스트 일정이 시작됩니다.')).not.toBeVisible();
  });

  test('알림 시간이 아직 도래하지 않은 일정은 알림이 표시되지 않는다', async ({ page }) => {
    // Arrange: 알림 시간이 10분 전인 일정 생성 (10:10 시작)
    await page.getByLabel('제목').fill('미래 알림 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('미래 알림');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 09:59로 이동 (알림 시간이 아직 도래하지 않음)
    await page.clock.setFixedTime(new Date('2025-10-15 09:00:00'));
    await page.waitForTimeout(1500);

    // Assert: 알림이 표시되지 않음
    await expect(page.getByText('10분 후 미래 알림 테스트 일정이 시작됩니다.')).not.toBeVisible();
  });

  // 알림 설정별 테스트
  test('60분 전 알림이 올바르게 표시된다', async ({ page }) => {
    // Arrange: 알림 시간이 60분 전인 일정 생성 (11:00 시작)
    await page.getByLabel('제목').fill('60분 전 알림');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('11:00');
    await page.getByLabel('종료 시간').fill('12:00');
    await page.getByLabel('설명').fill('60분 전');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '1시간 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 10:00으로 이동 (알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.waitForTimeout(1500);

    // Assert: 60분 전 알림이 표시됨
    await expect(page.getByText('60분 후 60분 전 알림 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });
  });

  test('1440분(1일) 전 알림이 올바르게 표시된다', async ({ page }) => {
    // Arrange: 알림 시간이 1440분 전인 일정 생성 (다음날 10:00 시작)
    await page.getByLabel('제목').fill('1일 전 알림');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('1일 전');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '1일 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 2025-10-15 10:00으로 이동 (알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.waitForTimeout(1500);

    // Assert: 1440분 전 알림이 표시됨
    await expect(page.getByText('1440분 후 1일 전 알림 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });
  });

  // 반복 일정 알림 테스트
  test('반복 일정의 각 인스턴스에 대해 개별 알림이 표시된다', async ({ page }) => {
    // Arrange: 주간 반복 일정 생성 (매주 수요일 10:10 시작, 10분 전 알림)
    await page.getByLabel('제목').fill('반복 알림 테스트');
    await page.getByLabel('날짜').fill('2025-10-15'); // 수요일
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('반복 알림');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'weekly-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-15');
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 10:00으로 이동 (첫 번째 인스턴스 알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.waitForTimeout(1500);

    // Assert: 첫 번째 인스턴스 알림이 표시됨
    await expect(page.getByText('10분 후 반복 알림 테스트 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });

    // Act: 알림 닫기
    await page.locator('.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeSmall').click();

    // Act: 시간을 다음 주 수요일 10:00으로 이동 (두 번째 인스턴스 알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-22 10:00:00'));
    await page.waitForTimeout(1500);

    // Assert: 두 번째 인스턴스 알림이 표시됨
    await expect(page.getByText('10분 후 반복 알림 테스트 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });
  });

  // 엣지 케이스 테스트
  test('알림 시간이 0인 일정은 알림이 표시되지 않는다', async ({ page }) => {
    // Arrange: 알림 설정이 없는 일정 생성 (기본값 10분)
    // 알림 설정을 0으로 설정할 수 없으므로, 알림 시간 범위 밖의 일정으로 테스트
    await page.getByLabel('제목').fill('알림 없음 테스트');
    await page.getByLabel('날짜').fill('2025-10-15');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('알림 없음');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    // 알림 설정은 기본값(10분) 사용
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 09:49로 이동 (10분 전이 아님)
    await page.clock.setFixedTime(new Date('2025-10-15 09:49:00'));
    await page.waitForTimeout(1500);

    // Assert: 알림이 표시되지 않음
    await expect(page.getByText('10분 후 알림 없음 테스트 일정이 시작됩니다.')).not.toBeVisible();
  });

  test('다른 날짜의 일정은 알림 시간이 도래해도 알림이 표시되지 않는다', async ({ page }) => {
    // Arrange: 다른 날짜의 일정 생성 (2025-10-16 10:10 시작, 10분 전 알림)
    await page.getByLabel('제목').fill('다른 날짜 알림');
    await page.getByLabel('날짜').fill('2025-10-16');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('다른 날짜');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 시간을 2025-10-15 10:00으로 이동 (같은 시간이지만 다른 날짜)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.waitForTimeout(1500);

    // Assert: 알림이 표시되지 않음 (다른 날짜이므로)
    await expect(page.getByText('10분 후 다른 날짜 알림 일정이 시작됩니다.')).not.toBeVisible();
  });

  test('일정 수정 시 알림 설정이 변경되면 새로운 알림 시간에 맞춰 알림이 표시된다', async ({
    page,
  }) => {
    // Arrange: 알림 시간이 10분 전인 일정 생성 (10:10 시작)
    await page.getByLabel('제목').fill('수정 알림 테스트');
    await page.getByLabel('날짜').fill('2025-10-20');
    await page.getByLabel('시작 시간').fill('10:10');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('설명').fill('수정 알림');
    await page.getByLabel('위치').fill('회의실');
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: '업무-option' }).click();
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '10분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Act: 일정 수정 - 알림 설정을 1분으로 변경하고 시작 시간을 10:01로 변경
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    await page.getByLabel('시작 시간').fill('10:02');
    await page.getByRole('combobox', { name: '분 전' }).click();
    await page.getByRole('option', { name: '1분 전' }).click();
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();

    // Act: 시간을 10:00으로 이동 (1분 전 알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-20 10:00:00'));
    await page.clock.fastForward('01:00'); // 알림 체크 간격(1초)보다 조금 더 대기

    // Assert: 1분 전 알림이 표시됨
    await expect(page.getByText('1분 후 수정 알림 테스트 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });
  });
});
