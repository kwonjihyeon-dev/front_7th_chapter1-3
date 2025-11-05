// 에러 메시지 상수
export const ERROR_MESSAGES = {
  FETCH_FAILED: '이벤트 로딩 실패',
  SAVE_FAILED: '일정 저장 실패',
  DELETE_FAILED: '일정 삭제 실패',
  REQUIRED_FIELDS_MISSING: '필수 정보를 모두 입력해주세요.',
  TIME_INVALID: '시간 설정을 확인해주세요.',
} as const;

// 성공 메시지 상수
export const SUCCESS_MESSAGES = {
  EVENT_ADDED: '일정이 추가되었습니다',
  EVENT_UPDATED: '일정이 수정되었습니다',
  EVENT_DELETED: '일정이 삭제되었습니다',
  EVENTS_LOADED: '일정 로딩 완료!',
} as const;
