# 테스트 설계 전략: 날짜 클릭으로 일정 생성 기능

## 테스트 설계 명확화 질문 및 답변

### Q1: 테스트 파일 위치
**질문**: 기존 통합 테스트 파일(`medium.integration.spec.tsx`)에 추가할까요, 아니면 별도 파일을 만들까요?

**답변**: 기존 파일(`medium.integration.spec.tsx`)에 추가합니다.

### Q2: 테스트 범위
**질문**: 명세서의 5개 기능 요구사항(FR1~FR5)만 테스트하면 될까요? 추가로 검증할 엣지 케이스가 있나요?

**답변**: 5개 기능 요구사항만 테스트합니다.

### Q3: 테스트 시나리오 우선순위
**질문**: 명세서의 4개 사용자 시나리오를 모두 테스트할까요?

**답변**: 모두 테스트합니다.

## 테스트 설계 전략

### 테스트 프레임워크 및 도구
- **프레임워크**: Vitest
- **테스트 라이브러리**: React Testing Library
- **테스트 유형**: 통합 테스트 (Integration Test)
- **파일 위치**: `src/__tests__/medium.integration.spec.tsx`

### 기존 테스트 패턴 분석
- `setup` 함수로 렌더링 및 `userEvent` 준비
- `screen.getByTestId`, `getByLabelText`, `within` 사용
- `describe`/`it` 구조 사용
- 비동기 처리는 `await` 사용
- Mock 핸들러는 `setupMockHandlerCreation`, `setupMockHandlerUpdating` 등 사용
- 날짜 셀 찾기: `within(monthView).getByText('1').closest('td')` 패턴 사용 (기존 테스트 참고)

### 코드 구조 분석

#### 월 뷰 구조
- `getWeeksAtMonth(currentDate)` → 2D 배열 반환 (주별로 날짜 배열, `null` 포함)
- 각 셀은 `day` (숫자 1-31)를 표시
- `formatDate(currentDate, day)`로 날짜 문자열 생성 (YYYY-MM-DD)
- 일정은 `getEventsForDay(filteredEvents, day)`로 필터링

#### 주 뷰 구조
- `getWeekDates(currentDate)` → Date 객체 배열 반환 (7개)
- 각 셀은 `date.getDate()`로 숫자 표시
- Date 객체를 직접 사용하여 날짜 문자열 생성 필요

### 테스트 케이스 설계

#### 테스트 그룹: 날짜 클릭으로 일정 생성 기능

**기능 요구사항 매핑**:
- FR1: 날짜 셀 클릭으로 날짜 자동 설정
- FR2: 기존 일정이 있는 셀 클릭 방지
- FR3: 시간 필드 빈 값 유지
- FR4: 편집 모드 선택 다이얼로그
- FR5: 월/주 뷰 모두 지원

---

### 테스트 케이스 목록

#### 시나리오 1: 정상적인 날짜 클릭 (FR1, FR3, FR5)

**FR1 검증 - 월 뷰에서 빈 날짜 셀 클릭**
- [ ] 월 뷰에서 일정이 없는 날짜 셀(예: 15일)을 클릭하면 일정 폼의 날짜 필드에 `2025-10-15` 형식으로 설정됨
- [ ] 날짜 필드 외의 다른 필드(제목, 설명, 위치 등)는 빈 값으로 유지됨

**FR3 검증 - 시간 필드 빈 값 유지**
- [ ] 날짜 셀 클릭 후 시작 시간 필드가 빈 문자열로 유지됨
- [ ] 날짜 셀 클릭 후 종료 시간 필드가 빈 문자열로 유지됨

**FR5 검증 - 주 뷰에서도 동일하게 동작**
- [ ] 주 뷰에서 일정이 없는 날짜 셀을 클릭하면 일정 폼의 날짜 필드에 클릭한 날짜가 YYYY-MM-DD 형식으로 설정됨
- [ ] 주 뷰에서도 시간 필드가 빈 값으로 유지됨

**구현 세부사항**:
- Arrange: App 컴포넌트 렌더링, 일정 로딩 완료 대기 (`await screen.findByText('일정 로딩 완료!')`)
- Act: 
  - 월 뷰: `within(monthView).getByText('15').closest('td')`를 찾아 클릭
  - 주 뷰: `within(weekView).getByText('15').closest('td')`를 찾아 클릭
- Assert: 
  - 날짜 필드: `expect(screen.getByLabelText('날짜')).toHaveValue('2025-10-15')`
  - 시간 필드: `expect(screen.getByLabelText('시작 시간')).toHaveValue('')`
  - 시간 필드: `expect(screen.getByLabelText('종료 시간')).toHaveValue('')`

---

#### 시나리오 2: 일정이 있는 셀 클릭 (FR2)

**FR2 검증 - 기존 일정이 있는 셀 클릭 방지**
- [ ] 일정이 있는 날짜 셀을 클릭해도 일정 폼의 날짜 필드가 변경되지 않음
- [ ] 일정이 있는 날짜 셀을 클릭해도 폼의 다른 필드가 변경되지 않음
- [ ] 월 뷰에서 일정이 있는 셀 클릭 시 동작하지 않음
- [ ] 주 뷰에서 일정이 있는 셀 클릭 시 동작하지 않음

**구현 세부사항**:
- Arrange: 
  - App 컴포넌트 렌더링
  - 특정 날짜(예: 2025-10-15)에 일정 생성 (`saveSchedule` 사용)
  - 일정 로딩 완료 대기
- Act: 해당 날짜 셀 클릭 (일정이 표시된 셀)
- Assert: 
  - 날짜 필드가 변경되지 않았는지 확인 (초기 상태 또는 기존 값 유지)
  - 폼의 다른 필드도 변경되지 않았는지 확인

**일정이 있는 셀 판단 기준**:
- 해당 날짜 셀 내에 일정 제목이 표시됨 (`within(cell).queryByText('일정 제목')`)

---

#### 시나리오 3: 편집 중 날짜 클릭 - 편집 취소 선택 (FR4)

**FR4 검증 - 편집 모드에서 날짜 클릭 시 다이얼로그 표시 및 편집 취소 선택**
- [ ] 편집 중인 상태에서 날짜 셀을 클릭하면 다이얼로그가 표시됨
- [ ] 다이얼로그에 "편집 중인 일정이 있습니다. 편집을 취소하고 새 일정을 생성하시겠습니까?" 메시지가 표시됨
- [ ] 다이얼로그에 "편집 취소" 버튼이 표시됨
- [ ] "편집 취소" 버튼 클릭 시 편집 모드가 취소됨 (폼 제목이 "일정 추가"로 변경됨)
- [ ] "편집 취소" 버튼 클릭 시 폼이 리셋됨 (제목, 설명, 위치 등 필드가 빈 값으로 설정됨)
- [ ] "편집 취소" 버튼 클릭 시 선택한 날짜로 날짜 필드가 설정됨
- [ ] "편집 취소" 버튼 클릭 시 다이얼로그가 닫힘

**구현 세부사항**:
- Arrange: 
  - App 컴포넌트 렌더링
  - 기존 일정 편집 모드 진입 (`Edit event` 버튼 클릭)
  - 일정 로딩 완료 대기
  - 편집 모드 확인 (`screen.getByText('일정 수정')` 확인)
- Act: 
  - 다른 날짜 셀 클릭
  - 다이얼로그에서 "편집 취소" 버튼 클릭 (`screen.getByText('편집 취소')` 또는 `screen.getByRole('button', { name: '편집 취소' })`)
- Assert: 
  - 편집 모드 취소 확인: `expect(screen.getByText('일정 추가')).toBeInTheDocument()`
  - 폼 리셋 확인: `expect(screen.getByLabelText('제목')).toHaveValue('')`
  - 선택한 날짜로 날짜 필드 설정 확인: `expect(screen.getByLabelText('날짜')).toHaveValue('2025-10-15')`
  - 다이얼로그 닫힘 확인: `expect(screen.queryByText('편집 중인 일정이 있습니다')).not.toBeInTheDocument()`

---

#### 시나리오 4: 편집 중 날짜 클릭 - 편집 유지 선택 (FR4)

**FR4 검증 - 편집 모드에서 날짜 클릭 시 다이얼로그 표시 및 편집 유지 선택**
- [ ] 편집 중인 상태에서 날짜 셀을 클릭하면 다이얼로그가 표시됨
- [ ] 다이얼로그에 "편집 중인 일정이 있습니다. 편집을 취소하고 새 일정을 생성하시겠습니까?" 메시지가 표시됨
- [ ] 다이얼로그에 "편집 유지" 버튼이 표시됨
- [ ] "편집 유지" 버튼 클릭 시 편집 모드가 유지됨 (폼 제목이 "일정 수정"으로 유지됨)
- [ ] "편집 유지" 버튼 클릭 시 폼 상태가 유지됨 (제목, 날짜, 설명 등 필드가 변경되지 않음)
- [ ] "편집 유지" 버튼 클릭 시 다이얼로그가 닫힘

**구현 세부사항**:
- Arrange: 
  - App 컴포넌트 렌더링
  - 기존 일정 편집 모드 진입 (`Edit event` 버튼 클릭)
  - 일정 로딩 완료 대기
  - 편집 모드 확인 및 폼 값 확인 (예: 제목이 "기존 회의"로 설정됨)
- Act: 
  - 다른 날짜 셀 클릭
  - 다이얼로그에서 "편집 유지" 버튼 클릭 (`screen.getByText('편집 유지')` 또는 `screen.getByRole('button', { name: '편집 유지' })`)
- Assert: 
  - 편집 모드 유지 확인: `expect(screen.getByText('일정 수정')).toBeInTheDocument()`
  - 폼 상태 유지 확인: `expect(screen.getByLabelText('제목')).toHaveValue('기존 회의')`
  - 날짜 필드 유지 확인: 편집 중이던 일정의 원래 날짜가 유지됨
  - 다이얼로그 닫힘 확인: `expect(screen.queryByText('편집 중인 일정이 있습니다')).not.toBeInTheDocument()`

---

## 테스트 구현 가이드

### 테스트 파일 구조
```typescript
describe('날짜 클릭으로 일정 생성 기능', () => {
  it('월 뷰에서 빈 날짜 셀을 클릭하면 날짜 필드가 자동 설정된다', async () => {
    // 시나리오 1 테스트
  });

  it('주 뷰에서 빈 날짜 셀을 클릭하면 날짜 필드가 자동 설정된다', async () => {
    // 시나리오 1 테스트 (주 뷰)
  });

  it('일정이 있는 날짜 셀을 클릭해도 폼이 변경되지 않는다', async () => {
    // 시나리오 2 테스트
  });

  it('편집 중 날짜 셀을 클릭하고 편집 취소를 선택하면 편집 모드가 취소된다', async () => {
    // 시나리오 3 테스트
  });

  it('편집 중 날짜 셀을 클릭하고 편집 유지를 선택하면 편집 모드가 유지된다', async () => {
    // 시나리오 4 테스트
  });
});
```

### 날짜 셀 찾기 방법

#### 월 뷰
```typescript
const monthView = screen.getByTestId('month-view');
// 특정 날짜(예: 15일) 셀 찾기
const dateCell = within(monthView).getByText('15').closest('td');
await user.click(dateCell!);
```

#### 주 뷰
```typescript
const weekView = screen.getByTestId('week-view');
// 특정 날짜(예: 15일) 셀 찾기
const dateCell = within(weekView).getByText('15').closest('td');
await user.click(dateCell!);
```

**주의**: 날짜 숫자가 여러 개 있을 수 있으므로, 현재 월/주에 해당하는 날짜를 정확히 선택해야 함

### 날짜 형식 확인
- `formatDate` 함수로 생성된 날짜 형식: `YYYY-MM-DD` (예: `2025-10-15`)
- 날짜 필드 값 확인: `expect(screen.getByLabelText('날짜')).toHaveValue('2025-10-15')`

### 시간 필드 빈 값 확인
- 시작 시간 필드: `expect(screen.getByLabelText('시작 시간')).toHaveValue('')`
- 종료 시간 필드: `expect(screen.getByLabelText('종료 시간')).toHaveValue('')`

### 편집 모드 확인
- 편집 모드일 때: `expect(screen.getByText('일정 수정')).toBeInTheDocument()`
- 편집 모드 취소 후: `expect(screen.getByText('일정 추가')).toBeInTheDocument()`

### 다이얼로그 확인
- 다이얼로그 메시지: `screen.getByText('편집 중인 일정이 있습니다. 편집을 취소하고 새 일정을 생성하시겠습니까?')`
- "편집 취소" 버튼: `screen.getByText('편집 취소')` 또는 `screen.getByRole('button', { name: '편집 취소' })`
- "편집 유지" 버튼: `screen.getByText('편집 유지')` 또는 `screen.getByRole('button', { name: '편집 유지' })`

### 일정이 있는 셀 판단
- 해당 날짜 셀 내에 일정 제목이 표시되는지 확인
- 예: `const hasEvent = within(dateCell).queryByText('일정 제목') !== null`

## 테스트 실행 순서 (TDD RED-GREEN-REFACTOR)

1. **RED 단계**: 위 테스트 케이스들을 모두 작성하고 실행 → 실패 확인
2. **GREEN 단계**: 구현 후 테스트 통과 확인
3. **REFACTOR 단계**: 코드 리팩토링 후 테스트 유지 확인

## 참고사항

- 모든 테스트는 기존 `medium.integration.spec.tsx` 파일의 패턴을 따름
- `setup` 함수, `userEvent`, `screen` API 사용
- 비동기 작업은 `await` 사용
- Mock 핸들러는 필요시 `setupMockHandlerCreation`, `setupMockHandlerUpdating` 사용
- 일정 로딩 완료 후 테스트 진행: `await screen.findByText('일정 로딩 완료!')`
- 시스템 시간은 `vi.setSystemTime`으로 설정 가능 (기본값: 2025-10-01)
