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

    await page.waitForSelector('[class*="-info"]');
    // Assert: 알림이 표시됨
    const notificationAlert = page.getByText('10분 후 알림 테스트 일정 일정이 시작됩니다.');
    await expect(notificationAlert).toBeVisible({ timeout: 5000 });
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
    await page.clock.fastForward('01:00');

    // 알림이 표시되는지 확인
    const notificationAlert = page.getByText('10분 후 닫기 테스트 일정이 시작됩니다.');
    await expect(notificationAlert).toBeVisible({ timeout: 5000 });

    // Act: 알림 닫기 버튼 클릭
    await page
      .locator('.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeSmall')
      .first()
      .click();

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

    const snackbar = page.getByText('일정이 추가되었습니다');
    await expect(snackbar).toBeVisible();

    // Act: 시간을 10:00으로 이동 (알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-15 10:00:00'));
    await page.waitForTimeout(1500);

    // 첫 번째 알림 확인
    const notificationAlert = page.getByText('10분 후 중복 알림 테스트 일정이 시작됩니다.');
    await expect(notificationAlert).toBeVisible({ timeout: 5000 });

    await page
      .locator('.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeSmall')
      .first()
      .click();

    // Act: 시간을 더 진행시켜도 (알림 시간 범위 내)
    await page.clock.setFixedTime(new Date('2025-10-15 10:05:00'));
    await page.waitForTimeout(1500);

    // Assert: 알림을 껐으니 중복 알림이 발생하지 않음 (알림은 하나만 존재)
    await expect(notificationAlert).not.toBeVisible({ timeout: 5000 });
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
    // await page.waitForTimeout(1500);

    // Assert: 첫 번째 인스턴스 알림이 표시됨
    await expect(page.getByText('10분 후 반복 알림 테스트 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });

    // Act: 알림 닫기
    const notificationAlert = page
      .getByRole('alert')
      .filter({ hasText: '10분 후 반복 알림 테스트 일정이 시작됩니다.' });
    await notificationAlert.getByTestId('CloseIcon').click();

    // Act: 시간을 다음 주 수요일 10:00으로 이동 (두 번째 인스턴스 알림 시간 도래)
    await page.clock.setFixedTime(new Date('2025-10-22 10:00:00'));
    await page.waitForTimeout(1500);

    // Assert: 두 번째 인스턴스 알림이 표시됨
    await expect(page.getByText('10분 후 반복 알림 테스트 일정이 시작됩니다.')).toBeVisible({
      timeout: 5000,
    });
  });
});
