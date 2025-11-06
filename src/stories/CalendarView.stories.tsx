import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { CalendarView } from '../components/CalendarView';
import { Event, EventForm } from '../types';
import { generateRepeatEvents } from '../utils/generateRepeatEvents';

// Material-UI 테마 설정
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const meta: Meta<typeof CalendarView> = {
  title: 'Calendar/CalendarView',
  component: CalendarView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '캘린더 뷰 컴포넌트 - 월별/주별 뷰 렌더링을 위한 회귀 테스트용 Story',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ padding: '20px', width: '100%', height: '100vh' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    view: {
      control: 'select',
      options: ['week', 'month'],
      description: '캘린더 뷰 타입 (주별/월별)',
    },
    currentDate: {
      control: 'date',
      description: '현재 표시할 날짜',
    },
    events: {
      control: 'object',
      description: '표시할 일정 목록',
    },
    notifiedEvents: {
      control: 'object',
      description: '알림이 표시된 일정 ID 목록',
    },
    holidays: {
      control: 'object',
      description: '공휴일 정보 (날짜: 공휴일명)',
    },
  },
  args: {
    onDateCellClick: fn(),
    onDragEnd: fn(),
    onDragCancel: fn(),
  },
} satisfies Meta<typeof CalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock 데이터
const mockEvents: Event[] = [
  {
    id: '1',
    title: '팀 회의',
    date: '2025-10-15',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: '2',
    title: '점심 약속',
    date: '2025-10-16',
    startTime: '12:00',
    endTime: '13:00',
    description: '동료와 점심 식사',
    location: '레스토랑',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  {
    id: '3',
    title: '프로젝트 마감',
    date: '2025-10-20',
    startTime: '09:00',
    endTime: '18:00',
    description: '분기별 프로젝트 마감',
    location: '사무실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 60,
  },
];

// 반복 이벤트 생성 헬퍼 함수
const createRecurringEvents = (baseEvent: EventForm, startId: string = '1'): Event[] => {
  const repeatEvents = generateRepeatEvents(baseEvent);
  return repeatEvents.map((event, index) => ({
    ...event,
    id: `${startId}-${index}`,
  })) as Event[];
};

// 주간 반복 이벤트 생성 (2025-10-15부터 매주, 2025-11-15까지)
const mockRecurringEvents: Event[] = createRecurringEvents(
  {
    title: '매주 회의',
    date: '2025-10-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '주간 회의',
    location: '회의실',
    category: '업무',
    repeat: { type: 'weekly', interval: 1, endDate: '2025-11-15' },
    notificationTime: 10,
  },
  '4'
);

const mockHolidays: Record<string, string> = {
  '2025-10-03': '개천절',
  '2025-10-09': '한글날',
};

// 월별 뷰 - 빈 상태
export const MonthViewEmpty: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: [],
    notifiedEvents: [],
    holidays: {},
  },
};

// 월별 뷰 - 일정이 있는 상태
export const MonthViewWithEvents: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: mockEvents,
    notifiedEvents: [],
    holidays: {},
  },
};

// 월별 뷰 - 공휴일이 있는 상태
export const MonthViewWithHolidays: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: mockEvents,
    notifiedEvents: [],
    holidays: mockHolidays,
  },
};

// 월별 뷰 - 반복 일정이 있는 상태
export const MonthViewWithRecurringEvents: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: [...mockEvents, ...mockRecurringEvents],
    notifiedEvents: [],
    holidays: {},
  },
};

// 월별 뷰 - 알림이 있는 일정
export const MonthViewWithNotifications: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: mockEvents,
    notifiedEvents: ['1', '2'],
    holidays: {},
  },
};

// 월별 뷰 - 많은 일정이 있는 경우
export const MonthViewWithManyEvents: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: [
      ...mockEvents,
      {
        id: '6',
        title: '오전 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '오전 회의',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '7',
        title: '오후 회의',
        date: '2025-10-15',
        startTime: '15:00',
        endTime: '16:00',
        description: '오후 회의',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '8',
        title: '저녁 약속',
        date: '2025-10-15',
        startTime: '18:00',
        endTime: '20:00',
        description: '저녁 약속',
        location: '레스토랑',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 60,
      },
    ],
    notifiedEvents: ['1'],
    holidays: {},
  },
};

// 주별 뷰 - 빈 상태
export const WeekViewEmpty: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'),
    events: [],
    notifiedEvents: [],
    holidays: {},
  },
};

// 주별 뷰 - 일정이 있는 상태
export const WeekViewWithEvents: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'),
    events: mockEvents,
    notifiedEvents: [],
    holidays: {},
  },
};

// 주별 뷰 - 공휴일이 있는 상태
export const WeekViewWithHolidays: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-01'), // 10월 첫 주 (개천절 포함)
    events: mockEvents,
    notifiedEvents: [],
    holidays: mockHolidays,
  },
};

// 주별 뷰 - 반복 일정이 있는 상태
export const WeekViewWithRecurringEvents: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'),
    events: [...mockEvents, ...mockRecurringEvents],
    notifiedEvents: [],
    holidays: {},
  },
};

// 주별 뷰 - 알림이 있는 일정
export const WeekViewWithNotifications: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'),
    events: mockEvents,
    notifiedEvents: ['1', '2'],
    holidays: {},
  },
};

// 주별 뷰 - 많은 일정이 있는 경우
export const WeekViewWithManyEvents: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'),
    events: [
      ...mockEvents,
      {
        id: '9',
        title: '월요일 회의',
        date: '2025-10-13',
        startTime: '10:00',
        endTime: '11:00',
        description: '월요일 회의',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '10',
        title: '화요일 회의',
        date: '2025-10-14',
        startTime: '10:00',
        endTime: '11:00',
        description: '화요일 회의',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '11',
        title: '목요일 회의',
        date: '2025-10-16',
        startTime: '10:00',
        endTime: '11:00',
        description: '목요일 회의',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '12',
        title: '금요일 회의',
        date: '2025-10-17',
        startTime: '10:00',
        endTime: '11:00',
        description: '금요일 회의',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ],
    notifiedEvents: ['1'],
    holidays: {},
  },
};

// 월별 뷰 - 월 경계 테스트 (이전 달/다음 달 날짜 포함)
export const MonthViewMonthBoundary: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: [
      {
        id: '13',
        title: '9월 마지막 일정',
        date: '2025-09-30',
        startTime: '10:00',
        endTime: '11:00',
        description: '9월 마지막',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '14',
        title: '11월 첫 일정',
        date: '2025-11-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '11월 첫',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ],
    notifiedEvents: [],
    holidays: {},
  },
};

// 주별 뷰 - 주 경계 테스트 (이전 주/다음 주 날짜 포함)
export const WeekViewWeekBoundary: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'), // 수요일
    events: [
      {
        id: '15',
        title: '이전 주 일요일',
        date: '2025-10-12',
        startTime: '10:00',
        endTime: '11:00',
        description: '이전 주',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '16',
        title: '다음 주 토요일',
        date: '2025-10-18',
        startTime: '10:00',
        endTime: '11:00',
        description: '다음 주',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ],
    notifiedEvents: [],
    holidays: {},
  },
};

// ========== 일정 상태별 시각적 표현 ==========

// 일반 일정만 있는 경우 (아이콘 없음)
const normalEvents: Event[] = [
  {
    id: 'normal-1',
    title: '일반 회의',
    date: '2025-10-15',
    startTime: '10:00',
    endTime: '11:00',
    description: '일반 일정',
    location: '회의실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: 'normal-2',
    title: '점심 약속',
    date: '2025-10-16',
    startTime: '12:00',
    endTime: '13:00',
    description: '일반 일정',
    location: '레스토랑',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
  {
    id: 'normal-3',
    title: '프로젝트 작업',
    date: '2025-10-17',
    startTime: '14:00',
    endTime: '16:00',
    description: '일반 일정',
    location: '사무실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 60,
  },
];

// 반복 일정만 있는 경우 (Repeat 아이콘 표시)
const recurringOnlyEvents: Event[] = createRecurringEvents(
  {
    title: '매주 회의',
    date: '2025-10-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '주간 회의',
    location: '회의실',
    category: '업무',
    repeat: { type: 'weekly', interval: 1, endDate: '2025-11-15' },
    notificationTime: 10,
  },
  'recurring-1'
);

// 일반 일정과 반복 일정이 함께 있는 경우
const mixedEvents: Event[] = [
  ...normalEvents,
  ...createRecurringEvents(
    {
      title: '매일 운동',
      date: '2025-10-15',
      startTime: '07:00',
      endTime: '08:00',
      description: '아침 운동',
      location: '헬스장',
      category: '개인',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-22' },
      notificationTime: 10,
    },
    'recurring-2'
  ),
];

// 월별 뷰 - 일반 일정만 (아이콘 없음)
export const MonthViewNormalEventsOnly: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: normalEvents,
    notifiedEvents: [],
    holidays: {},
  },
  parameters: {
    docs: {
      description: {
        story: '일반 일정은 아이콘 없이 표시됩니다.',
      },
    },
  },
};

// 월별 뷰 - 반복 일정만 (Repeat 아이콘 표시)
export const MonthViewRecurringEventsOnly: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: recurringOnlyEvents,
    notifiedEvents: [],
    holidays: {},
  },
  parameters: {
    docs: {
      description: {
        story: '반복 일정은 Repeat 아이콘과 함께 표시됩니다.',
      },
    },
  },
};

// 월별 뷰 - 일반 일정과 반복 일정 혼합
export const MonthViewMixedEvents: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: mixedEvents,
    notifiedEvents: [],
    holidays: {},
  },
  parameters: {
    docs: {
      description: {
        story: '일반 일정은 아이콘 없이, 반복 일정은 Repeat 아이콘과 함께 표시됩니다.',
      },
    },
  },
};

// 주별 뷰 - 일반 일정만 (아이콘 없음)
export const WeekViewNormalEventsOnly: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'),
    events: normalEvents,
    notifiedEvents: [],
    holidays: {},
  },
  parameters: {
    docs: {
      description: {
        story: '일반 일정은 아이콘 없이 표시됩니다.',
      },
    },
  },
};

// 주별 뷰 - 반복 일정만 (Repeat 아이콘 표시)
export const WeekViewRecurringEventsOnly: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'),
    events: recurringOnlyEvents,
    notifiedEvents: [],
    holidays: {},
  },
  parameters: {
    docs: {
      description: {
        story: '반복 일정은 Repeat 아이콘과 함께 표시됩니다.',
      },
    },
  },
};

// 주별 뷰 - 일반 일정과 반복 일정 혼합
export const WeekViewMixedEvents: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-10-15'),
    events: mixedEvents,
    notifiedEvents: [],
    holidays: {},
  },
  parameters: {
    docs: {
      description: {
        story: '일반 일정은 아이콘 없이, 반복 일정은 Repeat 아이콘과 함께 표시됩니다.',
      },
    },
  },
};

// 월별 뷰 - 다양한 반복 유형 (주간, 일간, 월간)
export const MonthViewVariousRecurringTypes: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: [
      ...createRecurringEvents(
        {
          title: '매주 회의',
          date: '2025-10-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '주간 반복',
          location: '회의실',
          category: '업무',
          repeat: { type: 'weekly', interval: 1, endDate: '2025-11-15' },
          notificationTime: 10,
        },
        'weekly-1'
      ),
      ...createRecurringEvents(
        {
          title: '매일 운동',
          date: '2025-10-15',
          startTime: '07:00',
          endTime: '08:00',
          description: '일간 반복',
          location: '헬스장',
          category: '개인',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-22' },
          notificationTime: 10,
        },
        'daily-1'
      ),
      ...createRecurringEvents(
        {
          title: '매월 보고',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '월간 반복',
          location: '회의실',
          category: '업무',
          repeat: { type: 'monthly', interval: 1, endDate: '2025-12-15' },
          notificationTime: 10,
        },
        'monthly-1'
      ),
    ],
    notifiedEvents: [],
    holidays: {},
  },
  parameters: {
    docs: {
      description: {
        story:
          '다양한 반복 유형(주간, 일간, 월간)의 반복 일정이 모두 Repeat 아이콘과 함께 표시됩니다.',
      },
    },
  },
};

// 월별 뷰 - 같은 날짜에 일반 일정과 반복 일정이 함께 있는 경우
export const MonthViewSameDayMixed: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-10-15'),
    events: [
      {
        id: 'normal-same-day',
        title: '일반 회의',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '일반 일정 (아이콘 없음)',
        location: '회의실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: 'recurring-same-day',
        title: '매주 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '반복 일정 (Repeat 아이콘)',
        location: '회의실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-11-15' },
        notificationTime: 10,
      },
    ],
    notifiedEvents: [],
    holidays: {},
  },
  parameters: {
    docs: {
      description: {
        story: '같은 날짜에 일반 일정(아이콘 없음)과 반복 일정(Repeat 아이콘)이 함께 표시됩니다.',
      },
    },
  },
};
