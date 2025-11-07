import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { fn } from 'storybook/test';

import RecurringEventDialog from '../components/RecurringEventDialog';
import { Event } from '../types';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const mockRecurringEvent: Event = {
  id: 'recurring-1',
  title: '주간 동기화 회의',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '프로젝트 진행 상황 공유',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'weekly', interval: 1, endDate: '2025-11-30' },
  notificationTime: 10,
};

const mockSingleEvent: Event = {
  id: 'event-1',
  title: '디자인 검토 미팅',
  date: '2025-10-20',
  startTime: '10:00',
  endTime: '11:00',
  description: 'UI 개선 항목 점검',
  location: '회의실 B',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 5,
};

const mockOverlappingEvents: Event[] = [
  {
    id: 'overlap-1',
    title: '주간 운영 점검',
    date: '2025-10-20',
    startTime: '09:30',
    endTime: '10:30',
    description: '서비스 안정성 리뷰',
    location: '회의실 C',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: 'overlap-2',
    title: '파트너사 미팅',
    date: '2025-10-20',
    startTime: '10:30',
    endTime: '11:30',
    description: '협업 일정 조율',
    location: '회의실 D',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
];

interface OverlapDialogProps {
  open: boolean;
  overlappingEvents: Event[];
  isDragOverlapDialog?: boolean;
  onClose: () => void;
  onContinue?: () => void;
}

const OverlapDialog = ({
  open,
  overlappingEvents,
  isDragOverlapDialog = false,
  onClose,
  onContinue,
}: OverlapDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>일정 겹침 경고</DialogTitle>
    <DialogContent>
      <DialogContentText>다음 일정과 겹칩니다:</DialogContentText>
      {overlappingEvents.map((event) => (
        <Typography key={event.id} sx={{ ml: 1, mb: 1 }}>
          {event.title} ({event.date} {event.startTime}-{event.endTime})
        </Typography>
      ))}
      {!isDragOverlapDialog && <DialogContentText>계속 진행하시겠습니까?</DialogContentText>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>취소</Button>
      {!isDragOverlapDialog && (
        <Button color="error" onClick={onContinue}>
          계속 진행
        </Button>
      )}
    </DialogActions>
  </Dialog>
);

interface EditCancelDialogProps {
  open: boolean;
  isDragDrop?: boolean;
  onClose: () => void;
  onKeep: () => void;
  onCancel: () => void;
}

const EditCancelDialog = ({
  open,
  isDragDrop = false,
  onClose,
  onKeep,
  onCancel,
}: EditCancelDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>편집 모드 취소</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {isDragDrop
          ? '편집 중인 일정이 있습니다. 편집을 취소하고 일정을 이동하시겠습니까?'
          : '편집 중인 일정이 있습니다. 편집을 취소하고 새 일정을 생성하시겠습니까?'}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onKeep}>편집 유지</Button>
      <Button onClick={onCancel} variant="contained" color="primary">
        편집 취소
      </Button>
    </DialogActions>
  </Dialog>
);

type DialogScenarioVariant = 'editMode' | 'overlapWarning' | 'recurringEdit';

interface DialogScenarioProps {
  variant: DialogScenarioVariant;
  open: boolean;
  event?: Event;
  overlappingEvents?: Event[];
  isDragDrop?: boolean;
  isDragOverlapDialog?: boolean;
  onClose: () => void;
  onPrimaryAction(): void;
  onSecondaryAction(): void;
}

const DialogScenario = ({
  variant,
  open,
  event = mockSingleEvent,
  overlappingEvents = mockOverlappingEvents,
  isDragDrop = false,
  isDragOverlapDialog = false,
  onClose,
  onPrimaryAction,
  onSecondaryAction,
}: DialogScenarioProps) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (variant === 'editMode') {
    return (
      <EditCancelDialog
        open={isOpen}
        isDragDrop={isDragDrop}
        onClose={handleClose}
        onKeep={() => {
          setIsOpen(false);
          onSecondaryAction();
        }}
        onCancel={() => {
          setIsOpen(false);
          onPrimaryAction();
        }}
      />
    );
  }

  if (variant === 'overlapWarning') {
    return (
      <OverlapDialog
        open={isOpen}
        overlappingEvents={overlappingEvents}
        isDragOverlapDialog={isDragOverlapDialog}
        onClose={handleClose}
        onContinue={() => {
          setIsOpen(false);
          onPrimaryAction();
        }}
      />
    );
  }

  return (
    <RecurringEventDialog
      open={isOpen}
      event={event}
      mode="edit"
      onClose={handleClose}
      onConfirm={() => {
        setIsOpen(false);
        onPrimaryAction();
      }}
    />
  );
};

const DialogStoriesMeta: Meta<typeof DialogScenario> = {
  title: 'Dialogs/Scenarios',
  component: DialogScenario,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '주요 일정 관련 다이얼로그 시나리오 모음',
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ padding: '20px', width: '100%', minHeight: '400px' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['editMode', 'overlapWarning', 'recurringEdit'],
      description: '표시할 다이얼로그 유형',
    },
    onClose: { control: false },
    onPrimaryAction: { control: false },
    onSecondaryAction: { control: false },
    event: { control: 'object', description: '스토리에서 사용하는 일정 정보' },
    overlappingEvents: { control: 'object', description: '겹침 경고에 표시할 일정 목록' },
    isDragDrop: { control: 'boolean', description: '편집 모드 다이얼로그 드래그 시나리오 여부' },
    isDragOverlapDialog: {
      control: 'boolean',
      description: '겹침 경고가 드래그로 인해 발생한 경우인지 여부',
    },
  },
  args: {
    open: true,
    variant: 'editMode',
    event: mockSingleEvent,
    overlappingEvents: mockOverlappingEvents,
    isDragDrop: false,
    isDragOverlapDialog: false,
    onClose: fn(),
    onPrimaryAction: fn(),
    onSecondaryAction: fn(),
  },
};

export default DialogStoriesMeta;

type DialogScenarioStory = StoryObj<typeof DialogScenario>;

export const EditModeDialog: DialogScenarioStory = {
  name: '편집 모드',
  args: {
    variant: 'editMode',
    isDragDrop: false,
  },
  parameters: {
    docs: {
      description: {
        story: '편집 중 다른 작업을 시도할 때 노출되는 편집 모드 취소 다이얼로그',
      },
    },
  },
};

export const OverlapWarningDialog: DialogScenarioStory = {
  name: '일정 겹침 경고',
  args: {
    variant: 'overlapWarning',
    overlappingEvents: mockOverlappingEvents,
    isDragOverlapDialog: false,
  },
  parameters: {
    docs: {
      description: {
        story: '일정을 수정할 때 겹치는 일정 목록과 함께 계속 진행 여부를 묻는 다이얼로그',
      },
    },
  },
};

export const RecurringEventEditDialog: DialogScenarioStory = {
  name: '반복 일정 수정',
  args: {
    variant: 'recurringEdit',
    event: mockRecurringEvent,
  },
  parameters: {
    docs: {
      description: {
        story:
          '반복 일정 수정 시 단일 일정만 수정할지 전체 반복 일정을 수정할지 선택하는 다이얼로그',
      },
    },
  },
};
