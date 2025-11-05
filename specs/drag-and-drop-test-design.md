# 테스트 설계 전략: 드래그 앤 드롭(D&D) 기능

## 테스트 설계 명확화 질문 및 답변

### Q1: 테스트 파일 위치 및 유형

**질문**: 드래그 앤 드롭 기능을 통합 테스트로 할까요, 아니면 E2E 테스트로 할까요?

**답변**: E2E 테스트로 진행합니다. 드래그 앤 드롭 기능은 실제 브라우저 환경에서의 마우스 이벤트와 사용자 인터랙션이 중요하므로 Playwright를 사용한 E2E 테스트가 적절합니다.

### Q2: 테스트 범위

**질문**: 명세서의 8개 기능 요구사항(FR1~FR8)만 테스트하면 될까요? 추가로 검증할 엣지 케이스가 있나요?

**답변**: 8개 기능 요구사항만 테스트합니다. 명세서에 명시된 시나리오와 요구사항만 검증합니다.

### Q3: Playwright 드래그 앤 드롭 테스트 방법

**질문**: Playwright에서 드래그 앤 드롭을 테스트할 때 어떤 방식을 사용할까요?

**답변**: Playwright의 `page.locator().dragTo()` 메서드를 사용하여 드래그 앤 드롭을 시뮬레이션합니다. 실제 브라우저 환경에서 마우스 이벤트가 발생하므로 @dnd-kit/core가 정상적으로 동작합니다.

## 테스트 설계 전략

### 테스트 프레임워크 및 도구

- **프레임워크**: Playwright
- **테스트 유형**: E2E 테스트 (End-to-End Test)
- **파일 위치**: `e2e/drag-and-drop.spec.ts`
- **DnD 라이브러리**: @dnd-kit/core

### 기존 테스트 패턴 분석

- Playwright의 `test` 함수 사용
- `page.locator()`로 요소 선택
- `page.getByTestId()`, `page.getByLabelText()`, `page.getByText()` 사용
- `test.describe`/`test` 구조 사용
- 비동기 처리는 `await` 사용
- `page.waitForSelector()`, `page.waitFor()` 사용
- 다이얼로그 테스트: `page.getByText()`, `page.getByRole()` 사용

### 코드 구조 분석

#### 월 뷰 구조

- `getWeeksAtMonth(currentDate)` → 2D 배열 반환 (주별로 날짜 배열, `null` 포함)
- 각 셀은 `day` (숫자 1-31)를 표시
- `formatDate(currentDate, day)`로 날짜 문자열 생성 (YYYY-MM-DD)
- 일정은 `getEventsForDay(filteredEvents, day)`로 필터링
- 일정 박스는 `data-event` 속성을 가진 Box 컴포넌트

#### 주 뷰 구조

- `getWeekDates(currentDate)` → Date 객체 배열 반환 (7개)
- 각 셀은 `date.getDate()`로 숫자 표시
- Date 객체를 직접 사용하여 날짜 문자열 생성 필요
- 일정 박스는 `data-event` 속성을 가진 Box 컴포넌트

#### 드래그 앤 드롭 구조

- `DndContext`로 전체 앱을 감싸야 함
- 일정 박스(`data-event` 속성)는 `useDraggable`로 드래그 가능하게 설정
- 날짜 셀(TableCell)은 `useDroppable`로 드롭 가능한 영역으로 설정
- `onDragEnd` 핸들러에서 드롭 처리

### 테스트 케이스 설계

#### 테스트 그룹: 드래그 앤 드롭 기능

**기능 요구사항 매핑**:

- FR1: 드래그 앤 드롭 기본 기능
- FR2: 반복 일정 드래그 처리
- FR3: 겹침 검사 및 다이얼로그
- FR4: 편집 모드 중 드래그 처리
- FR5: 월/주 뷰 모두 지원
- FR6: 시각적 피드백 없음 (테스트 불필요 - UI 변경 없음)
- FR7: 드롭 성공 시 피드백 (스낵바 검증)
- FR8: 드롭 불가능한 영역 처리

---

### 테스트 케이스 목록

#### 시나리오 1: 정상적인 드래그 앤 드롭 (FR1, FR5, FR7)

**FR1 검증 - 월 뷰에서 일정 드래그 앤 드롭**

- [ ] 월 뷰에서 일정 박스를 드래그하여 다른 날짜 셀로 이동하면 일정의 날짜가 변경됨
- [ ] 일정의 날짜가 드롭한 날짜로 변경됨 (예: `2025-10-15` → `2025-10-20`)
- [ ] 일정의 시간(startTime, endTime)은 유지됨
- [ ] 일정 수정 성공 스낵바가 표시됨 (`일정이 수정되었습니다`)

**FR5 검증 - 주 뷰에서도 동일하게 동작**

- [ ] 주 뷰에서 일정 박스를 드래그하여 다른 날짜 셀로 이동하면 일정의 날짜가 변경됨
- [ ] 주 뷰에서도 시간이 유지됨
- [ ] 주 뷰에서도 스낵바가 표시됨

**구현 세부사항**:

- Arrange:
  - 페이지 로드 (`await page.goto('/')`)
  - 일정 로딩 완료 대기 (`await page.waitForText('일정 로딩 완료!')`)
  - 일정 생성 (예: `2025-10-15`에 일정 생성)
- Act:
  - 일정 박스(`data-event` 속성을 가진 Box)를 찾음: `const eventBox = page.locator('[data-event]').first()`
  - 타겟 날짜 셀을 찾음: `const targetCell = page.locator('td').filter({ hasText: '20' })`
  - 드래그 앤 드롭: `await eventBox.dragTo(targetCell)`
- Assert:
  - 일정의 날짜가 변경됨: `await expect(page.getByText('2025-10-20')).toBeVisible()`
  - 시간이 유지됨: `await expect(page.getByText('14:00 - 15:00')).toBeVisible()`
  - 스낵바 표시: `await expect(page.getByText('일정이 수정되었습니다')).toBeVisible()`

---

#### 시나리오 2: 반복 일정 드래그 앤 드롭 (FR2)

**FR2 검증 - 드래그한 반복 일정만 단일 일정으로 변환**

- [ ] 반복 일정(일/주/월/년 반복) 중 하나를 드래그하여 다른 날짜로 이동하면, 드래그한 일정만 단일 일정으로 변환됨
- [ ] 드래그한 일정의 `repeat.type`이 `'none'`으로 변경됨
- [ ] 드래그한 일정의 `repeat.interval`이 `0`으로 변경됨
- [ ] 드래그한 일정의 `repeat.endDate`가 `undefined`로 설정됨
- [ ] 드래그한 일정의 날짜가 새로운 날짜로 변경됨
- [ ] 나머지 일정 정보(제목, 시간, 설명 등)는 유지됨
- [ ] 나머지 반복 일정 인스턴스들은 변경되지 않고 그대로 유지됨
- [ ] 일정 수정 성공 스낵바가 표시됨

**구현 세부사항**:

- Arrange:
  - 페이지 로드 및 일정 로딩 완료 대기
  - 반복 일정 생성 (예: 매주 월요일 반복, 여러 날짜에 반복 일정 인스턴스 생성)
- Act:
  - 반복 일정 중 하나의 박스를 찾음: `const recurringEventBox = page.locator('[data-event]').filter({ hasText: '매주' }).first()`
  - 타겟 날짜 셀로 드래그 앤 드롭: `await recurringEventBox.dragTo(targetCell)`
- Assert:
  - 드래그한 일정의 날짜가 변경됨
  - 드래그한 일정에서 반복 설정이 제거됨: 드래그한 일정의 반복 아이콘이 사라짐
  - 나머지 반복 일정 인스턴스들은 변경되지 않음: 원래 날짜에 있던 다른 반복 일정 인스턴스들이 여전히 반복 아이콘을 가지고 있음
  - 스낵바 표시: `await expect(page.getByText('일정이 수정되었습니다')).toBeVisible()`

---

#### 시나리오 3: 겹침 발생 시 (FR3)

**FR3 검증 - 겹침 경고 다이얼로그 표시 및 드롭 취소**

- [ ] 드롭 위치에 이미 다른 일정이 있어 시간이 겹치면 겹침 경고 다이얼로그가 표시됨
- [ ] 다이얼로그에 "다음 일정과 겹칩니다:" 메시지가 표시됨
- [ ] 다이얼로그에 겹치는 일정 정보가 표시됨
- [ ] 다이얼로그에 "취소" 버튼만 표시됨
- [ ] "취소" 버튼 클릭 시 드롭이 취소되고 일정은 원래 위치로 유지됨
- [ ] 일정의 날짜가 변경되지 않음

**구현 세부사항**:

- Arrange:
  - 페이지 로드 및 일정 로딩 완료 대기
  - 기존 일정 생성 (예: `2025-10-20` 14:00-15:00)
  - 겹치는 시간대의 일정을 드래그하여 같은 날짜로 이동 시도
- Act:
  - 일정을 드래그하여 겹치는 위치로 드롭: `await eventBox.dragTo(targetCell)`
  - 겹침 검사 후 다이얼로그 표시 대기
  - "취소" 버튼 클릭: `await page.getByText('취소').click()`
- Assert:
  - 다이얼로그 표시: `await expect(page.getByText('일정 겹침 경고')).toBeVisible()`
  - 겹치는 일정 정보 표시: `await expect(page.getByText(/회의/)).toBeVisible()`
  - "취소" 버튼 존재: `await expect(page.getByText('취소')).toBeVisible()`
  - 일정이 원래 위치에 유지됨: `await expect(page.getByText('2025-10-15')).toBeVisible()`

---

#### 시나리오 4: 편집 중 드래그 - 편집 취소 선택 (FR4)

**FR4 검증 - 편집 모드 중 드래그 시 다이얼로그 표시 및 편집 취소 선택**

- [ ] 편집 중인 상태에서 다른 일정을 드래그 시작하면 편집 모드 취소 다이얼로그가 표시됨
- [ ] 다이얼로그에 "편집 중인 일정이 있습니다. 편집을 취소하고 일정을 이동하시겠습니까?" 메시지가 표시됨
- [ ] "편집 취소" 버튼 클릭 시 편집 모드가 취소되고 드래그가 진행됨
- [ ] 편집 모드 취소 후 일정이 새로운 날짜로 이동됨
- [ ] 폼이 리셋됨

**구현 세부사항**:

- Arrange:
  - 페이지 로드 및 일정 로딩 완료 대기
  - 일정 편집 모드 진입: `await page.getByLabel('Edit event').first().click()`
  - 편집 폼에 데이터 입력 중
- Act:
  - 다른 일정을 드래그 시작: `await otherEventBox.dragTo(targetCell)`
  - 편집 모드 취소 다이얼로그 표시 대기
  - "편집 취소" 버튼 클릭: `await page.getByText('편집 취소').click()`
  - 드래그 앤 드롭 완료
- Assert:
  - 다이얼로그 표시: `await expect(page.getByText('편집 모드 취소')).toBeVisible()`
  - 편집 모드 취소: `await expect(page.getByText('일정 추가')).toBeVisible()` (편집 모드 아님)
  - 일정이 새로운 날짜로 이동됨

---

#### 시나리오 5: 편집 중 드래그 - 편집 유지 선택 (FR4)

**FR4 검증 - 편집 모드 중 드래그 시 편집 유지 선택**

- [ ] 편집 중인 상태에서 다른 일정을 드래그 시작하면 편집 모드 취소 다이얼로그가 표시됨
- [ ] "편집 유지" 버튼 클릭 시 편집 모드가 유지되고 드래그가 취소됨
- [ ] 편집 모드가 유지됨 (폼 상태 유지)
- [ ] 드래그한 일정은 원래 위치에 유지됨

**구현 세부사항**:

- Arrange:
  - 페이지 로드 및 일정 로딩 완료 대기
  - 일정 편집 모드 진입: `await page.getByLabel('Edit event').first().click()`
  - 편집 폼에 데이터 입력 중
- Act:
  - 다른 일정을 드래그 시작: `await otherEventBox.dragTo(targetCell)`
  - 편집 모드 취소 다이얼로그 표시 대기
  - "편집 유지" 버튼 클릭: `await page.getByText('편집 유지').click()`
- Assert:
  - 편집 모드 유지: `await expect(page.getByText('일정 수정')).toBeVisible()`
  - 드래그한 일정이 원래 위치에 유지됨
  - 스낵바가 표시되지 않음 (드래그 취소)

---

#### 시나리오 6: 드롭 불가능한 영역에 드롭 (FR8)

**FR8 검증 - 드롭 불가능한 영역 처리**

- [ ] 드롭 불가능한 영역(캘린더 외부, 일정 목록 영역, 폼 영역 등)에 드롭하면 일정이 원래 위치로 복귀함
- [ ] 일정의 날짜가 변경되지 않음
- [ ] 스낵바가 표시되지 않음

**구현 세부사항**:

- Arrange:
  - 페이지 로드 및 일정 로딩 완료 대기
  - 일정 생성
  - 일정 박스를 찾음: `const eventBox = page.locator('[data-event]').first()`
- Act:
  - 일정을 드래그하여 드롭 불가능한 영역(예: 일정 목록 영역)으로 이동: `await eventBox.dragTo(page.locator('[data-testid="event-list"]'))`
  - 드롭
- Assert:
  - 일정이 원래 위치에 유지됨: `await expect(page.getByText('2025-10-15')).toBeVisible()`
  - 스낵바가 표시되지 않음: `await expect(page.getByText('일정이 수정되었습니다')).not.toBeVisible()`

---

### 테스트 파일 구조

```typescript
// e2e/drag-and-drop.spec.ts
import { test, expect } from '@playwright/test';

test.describe('드래그 앤 드롭 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 일정 로딩 완료 대기
    await page.waitForText('일정 로딩 완료!');
  });

  // 시나리오 1: 정상적인 드래그 앤 드롭
  test('월 뷰에서 일정을 드래그하여 다른 날짜로 이동하면 날짜가 변경되고 시간은 유지된다', async ({
    page,
  }) => {
    // Arrange: 일정 생성
    // Act: 드래그 앤 드롭
    // Assert: 날짜 변경, 시간 유지, 스낵바 표시
  });

  // 시나리오 2: 반복 일정 드래그 앤 드롭
  // 시나리오 3: 겹침 발생 시
  // 시나리오 4: 편집 중 드래그 - 편집 취소 선택
  // 시나리오 5: 편집 중 드래그 - 편집 유지 선택
  // 시나리오 6: 드롭 불가능한 영역에 드롭
});
```

### 테스트 실행 순서 (TDD 순서)

1. **시나리오 1: 정상적인 드래그 앤 드롭 (FR1, FR5, FR7)**

   - 가장 기본적인 기능부터 테스트
   - 월 뷰와 주 뷰 모두에서 동작 확인

2. **시나리오 2: 반복 일정 드래그 앤 드롭 (FR2)**

   - 반복 일정 변환 로직 검증

3. **시나리오 3: 겹침 발생 시 (FR3)**

   - 에러 처리 및 다이얼로그 검증

4. **시나리오 4, 5: 편집 모드 중 드래그 처리 (FR4)**

   - 복잡한 상태 관리 검증

5. **시나리오 6: 드롭 불가능한 영역 처리 (FR8)**
   - 엣지 케이스 검증

### 주의사항

- **@dnd-kit/core 테스트**: Playwright의 `dragTo()` 메서드를 사용하여 실제 브라우저 환경에서 드래그 앤 드롭 시뮬레이션
- **비동기 처리**: `await`를 사용하여 모든 비동기 작업 완료 대기
- **다이얼로그 테스트**: 다이얼로그가 표시될 때까지 대기 필요 (`await page.waitForText(...)`)
- **스낵바 검증**: `notistack`의 스낵바 메시지 검증 시 `page.getByText()` 사용
- **요소 선택**: `page.locator()` 또는 `page.getByTestId()`, `page.getByText()` 사용
- **시각적 피드백 없음 (FR6)**: UI 변경이 없으므로 별도 테스트 불필요
- **서버 실행**: E2E 테스트 실행 전 개발 서버가 실행되어 있어야 함
