import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { fn } from 'storybook/test';

import type { RepeatType } from '../types';
import { getTimeErrorMessage } from '../utils/timeValidation';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const categories = ['업무', '개인', '가족', '기타'];

const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

interface FormValues {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  category: string;
  isRepeating: boolean;
  repeatType: RepeatType;
  repeatInterval: number;
  repeatEndDate: string;
  notificationTime: number;
}

interface EventFormControlsDemoProps {
  mode: 'create' | 'edit';
  initialValues: FormValues;
  // eslint-disable-next-line no-unused-vars
  onSubmit?(values: FormValues): void;
}

const EventFormControlsDemo = ({ mode, initialValues, onSubmit }: EventFormControlsDemoProps) => {
  const [formValues, setFormValues] = useState<FormValues>(initialValues);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const { startTimeError, endTimeError } = getTimeErrorMessage(
    formValues.startTime,
    formValues.endTime
  );

  const isEditing = mode === 'edit';

  const handleSubmit = () => {
    onSubmit?.(formValues);
  };

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 360 }}>
      <Typography variant="h5" gutterBottom>
        {isEditing ? '일정 수정 폼 상태' : '일정 등록 폼 상태'}
      </Typography>

      <FormControl fullWidth>
        <FormLabel htmlFor="event-title">제목</FormLabel>
        <TextField
          id="event-title"
          size="small"
          value={formValues.title}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              title: e.target.value,
            }))
          }
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="event-date">날짜</FormLabel>
        <TextField
          id="event-date"
          type="date"
          size="small"
          value={formValues.date}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              date: e.target.value,
            }))
          }
        />
      </FormControl>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <FormLabel htmlFor="event-start-time">시작 시간</FormLabel>
          <Tooltip title={startTimeError ?? ''} open={!!startTimeError} placement="top">
            <TextField
              id="event-start-time"
              type="time"
              size="small"
              value={formValues.startTime}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
              }
              error={!!startTimeError}
            />
          </Tooltip>
        </FormControl>

        <FormControl fullWidth>
          <FormLabel htmlFor="event-end-time">종료 시간</FormLabel>
          <Tooltip title={endTimeError ?? ''} open={!!endTimeError} placement="top">
            <TextField
              id="event-end-time"
              type="time"
              size="small"
              value={formValues.endTime}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
              }
              error={!!endTimeError}
            />
          </Tooltip>
        </FormControl>
      </Stack>

      <FormControl fullWidth>
        <FormLabel htmlFor="event-description">설명</FormLabel>
        <TextField
          id="event-description"
          size="small"
          value={formValues.description}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="event-location">위치</FormLabel>
        <TextField
          id="event-location"
          size="small"
          value={formValues.location}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              location: e.target.value,
            }))
          }
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel id="event-category-label">카테고리</FormLabel>
        <Select
          size="small"
          value={formValues.category}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              category: e.target.value,
            }))
          }
          aria-labelledby="event-category-label"
        >
          {categories.map((category) => (
            <MenuItem key={category} value={category} aria-label={`${category}-option`}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!isEditing && (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={formValues.isRepeating}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    isRepeating: e.target.checked,
                    repeatType: e.target.checked
                      ? prev.repeatType === 'none'
                        ? 'daily'
                        : prev.repeatType
                      : 'none',
                  }))
                }
              />
            }
            label="반복 일정"
          />

          {formValues.isRepeating && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <FormLabel>반복 유형</FormLabel>
                <Select
                  size="small"
                  value={formValues.repeatType}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      repeatType: e.target.value as RepeatType,
                    }))
                  }
                >
                  <MenuItem value="daily">매일</MenuItem>
                  <MenuItem value="weekly">매주</MenuItem>
                  <MenuItem value="monthly">매월</MenuItem>
                  <MenuItem value="yearly">매년</MenuItem>
                </Select>
              </FormControl>

              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="event-repeat-interval">반복 간격</FormLabel>
                  <TextField
                    id="event-repeat-interval"
                    type="number"
                    size="small"
                    value={formValues.repeatInterval}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        repeatInterval: Number(e.target.value) || 1,
                      }))
                    }
                    inputProps={{ min: 1 }}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel htmlFor="event-repeat-end-date">반복 종료일</FormLabel>
                  <TextField
                    id="event-repeat-end-date"
                    type="date"
                    size="small"
                    value={formValues.repeatEndDate}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        repeatEndDate: e.target.value,
                      }))
                    }
                  />
                </FormControl>
              </Stack>
            </Stack>
          )}
        </Box>
      )}

      <FormControl fullWidth>
        <FormLabel htmlFor="event-notification">알림 설정</FormLabel>
        <Select
          id="event-notification"
          size="small"
          value={formValues.notificationTime}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              notificationTime: Number(e.target.value),
            }))
          }
        >
          {notificationOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button variant="contained" color="primary" onClick={handleSubmit}>
        {isEditing ? '수정 제출' : '등록 제출'}
      </Button>
    </Stack>
  );
};

const meta: Meta<typeof EventFormControlsDemo> = {
  title: 'Forms/EventFormControls',
  component: EventFormControlsDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '일정 등록/수정 폼의 주요 컨트롤 상태를 확인하기 위한 Storybook 구성입니다. 필수 필드, 반복 설정, 시간 검증 상태를 빠르게 검토할 수 있습니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Box sx={{ padding: 3, minHeight: '100vh', backgroundColor: '#f7f9fc' }}>
          <Story />
        </Box>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
      description: '폼 상태 (등록/수정)',
    },
    initialValues: {
      control: 'object',
      description: '스토리에서 사용할 초기 폼 값',
    },
    onSubmit: {
      action: 'submit',
      description: '제출 버튼 클릭 시 호출되는 핸들러',
    },
  },
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof EventFormControlsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseInitialValues: FormValues = {
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  description: '',
  location: '',
  category: '업무',
  isRepeating: false,
  repeatType: 'none',
  repeatInterval: 1,
  repeatEndDate: '',
  notificationTime: 10,
};

export const 기본_등록폼: Story = {
  args: {
    mode: 'create',
    initialValues: {
      ...baseInitialValues,
    },
  },
  parameters: {
    docs: {
      description: {
        story: '기본값이 비어 있는 신규 일정 등록 폼 상태입니다.',
      },
    },
  },
};

export const 필수값입력완료: Story = {
  args: {
    mode: 'create',
    initialValues: {
      ...baseInitialValues,
      title: '프로젝트 킥오프',
      date: '2025-10-20',
      startTime: '10:00',
      endTime: '11:30',
      location: '회의실 A',
      description: '팀 전체 킥오프 미팅',
      category: '업무',
      notificationTime: 60,
    },
  },
  parameters: {
    docs: {
      description: {
        story: '필수 입력값이 모두 채워진 상태를 보여줍니다.',
      },
    },
  },
};

export const 반복일정설정: Story = {
  args: {
    mode: 'create',
    initialValues: {
      ...baseInitialValues,
      title: '주간 스탠드업',
      date: '2025-10-21',
      startTime: '09:00',
      endTime: '09:30',
      isRepeating: true,
      repeatType: 'weekly',
      repeatInterval: 1,
      repeatEndDate: '2025-12-30',
      notificationTime: 10,
    },
  },
  parameters: {
    docs: {
      description: {
        story: '반복 일정을 활성화한 상태와 반복 세부 옵션 UI를 확인할 수 있습니다.',
      },
    },
  },
};

export const 잘못된시간입력: Story = {
  args: {
    mode: 'create',
    initialValues: {
      ...baseInitialValues,
      title: '시간 검증 테스트',
      date: '2025-10-25',
      startTime: '18:00',
      endTime: '17:30',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '시작 시간이 종료 시간보다 늦은 잘못된 입력 상태로, 오류 툴팁과 에러 하이라이트를 확인할 수 있습니다.',
      },
    },
  },
};

export const 편집모드: Story = {
  args: {
    mode: 'edit',
    initialValues: {
      ...baseInitialValues,
      title: '기존 일정 수정',
      date: '2025-11-01',
      startTime: '14:00',
      endTime: '15:30',
      description: '기존 일정 편집 예시',
      location: '회의실 B',
      category: '업무',
      isRepeating: true,
      repeatType: 'weekly',
      repeatInterval: 2,
      repeatEndDate: '2026-01-31',
      notificationTime: 120,
    },
  },
  parameters: {
    docs: {
      description: {
        story: '편집 모드에서는 반복 옵션 토글이 비활성화된 상태를 확인할 수 있습니다.',
      },
    },
  },
};
