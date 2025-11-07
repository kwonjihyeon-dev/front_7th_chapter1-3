import { Box, Button, Stack, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { expect, fn } from 'storybook/test';

import RecurringEventDialog from '../components/RecurringEventDialog';
import { Event } from '../types';

// Material-UI 테마 설정
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

// ========== 반복 일정 다이얼로그 ==========

const RecurringEventDialogMeta: Meta<typeof RecurringEventDialog> = {
  title: 'Dialogs/RecurringEventDialog',
  component: RecurringEventDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '반복 일정 수정/삭제 시 단일 인스턴스 또는 전체 시리즈를 선택하는 다이얼로그',
      },
    },
  },
  tags: ['autodocs'],
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
    open: {
      control: 'boolean',
      description: '다이얼로그 열림 상태',
    },
    mode: {
      control: 'select',
      options: ['edit', 'delete'],
      description: '다이얼로그 모드 (편집/삭제)',
    },
    event: {
      control: 'object',
      description: '작업 대상 일정',
    },
  },
  args: {
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof RecurringEventDialog>;

export default RecurringEventDialogMeta;
type RecurringEventDialogStory = StoryObj<typeof RecurringEventDialogMeta>;

const mockRecurringEvent: Event = {
  id: '1',
  title: '매주 회의',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '주간 회의',
  location: '회의실',
  category: '업무',
  repeat: { type: 'weekly', interval: 1, endDate: '2025-11-15' },
  notificationTime: 10,
};

// 반복 일정 수정 다이얼로그
export const RecurringEditDialog: RecurringEventDialogStory = {
  args: {
    open: true,
    mode: 'edit',
    event: mockRecurringEvent,
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          '반복 일정 수정 시 표시되는 다이얼로그. 해당 일정만 수정할지 전체 시리즈를 수정할지 선택할 수 있습니다.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });

    await body.findByRole('dialog', { name: '반복 일정 수정' });
    await user.click(await body.findByRole('button', { name: '예' }));

    await waitFor(() => {
      expect(args.onConfirm).toHaveBeenCalledWith(true);
    });
  },
};

// 반복 일정 삭제 다이얼로그
export const RecurringDeleteDialog: RecurringEventDialogStory = {
  args: {
    open: true,
    mode: 'delete',
    event: mockRecurringEvent,
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          '반복 일정 삭제 시 표시되는 다이얼로그. 해당 일정만 삭제할지 전체 시리즈를 삭제할지 선택할 수 있습니다.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });

    await body.findByRole('dialog', { name: '반복 일정 삭제' });
    await user.click(await body.findByRole('button', { name: '취소' }));

    // await waitFor(() => {
    //   expect(args.onClose).toHaveBeenCalledTimes(1);
    // });
  },
};

// 닫힌 상태
export const RecurringDialogClosed: RecurringEventDialogStory = {
  args: {
    open: false,
    mode: 'edit',
    event: mockRecurringEvent,
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '다이얼로그가 닫힌 상태',
      },
    },
  },
};

// ========== 겹침 경고 다이얼로그 ==========

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
}: OverlapDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
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
};

// OverlapDialog를 위한 래퍼 컴포넌트
const OverlapDialogWrapper = (args: {
  open: boolean;
  overlappingEvents: Event[];
  isDragOverlapDialog?: boolean;
  onClose: () => void;
  onContinue?: () => void;
}) => {
  const [open, setOpen] = useState(args.open);

  useEffect(() => {
    setOpen(args.open);
  }, [args.open]);

  return (
    <OverlapDialog
      {...args}
      open={open}
      onClose={() => {
        setOpen(false);
        args.onClose();
      }}
      onContinue={() => {
        setOpen(false);
        args.onContinue?.();
      }}
    />
  );
};

export const OverlapDialogMeta = {
  title: 'Dialogs/OverlapDialog',
  component: OverlapDialogWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '일정 겹침 시 표시되는 경고 다이얼로그',
      },
    },
  },
  tags: ['autodocs'],
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
    open: {
      control: 'boolean',
      description: '다이얼로그 열림 상태',
    },
    isDragOverlapDialog: {
      control: 'boolean',
      description: '드래그 앤 드롭으로 인한 겹침인지 여부',
    },
    overlappingEvents: {
      control: 'object',
      description: '겹치는 일정 목록',
    },
  },
  args: {
    open: true,
    onClose: fn(),
    onContinue: fn(),
  },
} satisfies Meta<typeof OverlapDialogWrapper>;

type IOverlapDialogStory = StoryObj<typeof OverlapDialogMeta>;

export const OverlapDialogStory: IOverlapDialogStory = {
  args: {
    open: true,
    overlappingEvents: [],
    isDragOverlapDialog: false,
    onClose: fn(),
    onContinue: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });

    await body.findByRole('dialog', { name: '일정 겹침 경고' });
    await user.click(await body.findByRole('button', { name: '취소' }));

    await waitFor(() => {
      expect(args.onClose).toHaveBeenCalledTimes(1);
    });
  },
};

const mockOverlappingEvents: Event[] = [
  {
    id: '1',
    title: '기존 회의',
    date: '2025-10-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '기존 일정',
    location: '회의실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: '2',
    title: '다른 회의',
    date: '2025-10-15',
    startTime: '14:30',
    endTime: '15:30',
    description: '다른 일정',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
];

// 일반 생성/수정 시 겹침 경고 (계속 진행 버튼 포함)
export const OverlapDialogWithContinue: IOverlapDialogStory = {
  args: {
    open: true,
    overlappingEvents: mockOverlappingEvents,
    isDragOverlapDialog: false,
    onClose: fn(),
    onContinue: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '일정 생성/수정 시 겹침이 발생하면 "계속 진행" 버튼이 표시됩니다.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });

    await body.findByRole('dialog', { name: '일정 겹침 경고' });
    await user.click(await body.findByRole('button', { name: '계속 진행' }));

    await waitFor(() => {
      expect(args.onContinue).toHaveBeenCalledTimes(1);
      expect(body.queryByRole('dialog', { name: '일정 겹침 경고' })).not.toBeInTheDocument();
    });
  },
};

// 드래그 앤 드롭 시 겹침 경고 (취소 버튼만)
export const OverlapDialogDragDrop: IOverlapDialogStory = {
  args: {
    open: true,
    overlappingEvents: mockOverlappingEvents,
    isDragOverlapDialog: true,
    onClose: fn(),
    onContinue: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '드래그 앤 드롭으로 인한 겹침 시 "취소" 버튼만 표시되고 드롭이 취소됩니다.',
      },
    },
  },
};

// 단일 겹침 일정
export const OverlapDialogSingleEvent: IOverlapDialogStory = {
  args: {
    open: true,
    overlappingEvents: [mockOverlappingEvents[0]],
    isDragOverlapDialog: false,
    onClose: fn(),
    onContinue: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '하나의 일정과만 겹치는 경우',
      },
    },
  },
};

// 여러 겹침 일정
export const OverlapDialogMultipleEvents: IOverlapDialogStory = {
  args: {
    open: true,
    overlappingEvents: [
      ...mockOverlappingEvents,
      {
        id: '3',
        title: '세 번째 회의',
        date: '2025-10-15',
        startTime: '15:00',
        endTime: '16:00',
        description: '추가 일정',
        location: '회의실 C',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ],
    isDragOverlapDialog: false,
    onClose: fn(),
    onContinue: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '여러 일정과 겹치는 경우',
      },
    },
  },
};

// 닫힌 상태
export const OverlapDialogClosed: IOverlapDialogStory = {
  args: {
    open: false,
    overlappingEvents: mockOverlappingEvents,
    isDragOverlapDialog: false,
    onClose: fn(),
    onContinue: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '다이얼로그가 닫힌 상태',
      },
    },
  },
};

// ========== 편집 모드 취소 다이얼로그 ==========

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
}: EditCancelDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
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
};

// EditCancelDialog를 위한 래퍼 컴포넌트
const EditCancelDialogWrapper = (args: {
  open: boolean;
  isDragDrop?: boolean;
  onClose: () => void;
  onKeep: () => void;
  onCancel: () => void;
}) => {
  const [open, setOpen] = useState(args.open);

  useEffect(() => {
    setOpen(args.open);
  }, [args.open]);

  return (
    <EditCancelDialog
      {...args}
      open={open}
      onClose={() => {
        setOpen(false);
        args.onClose();
      }}
      onKeep={() => {
        setOpen(false);
        args.onKeep();
      }}
      onCancel={() => {
        setOpen(false);
        args.onCancel();
      }}
    />
  );
};

export const EditCancelDialogMeta = {
  title: 'Dialogs/EditCancelDialog',
  component: EditCancelDialogWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '편집 모드 중 다른 작업을 시도할 때 표시되는 다이얼로그',
      },
    },
  },
  tags: ['autodocs'],
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
    open: {
      control: 'boolean',
      description: '다이얼로그 열림 상태',
    },
    isDragDrop: {
      control: 'boolean',
      description: '드래그 앤 드롭으로 인한 다이얼로그인지 여부',
    },
  },
  args: {
    open: true,
    onClose: fn(),
    onKeep: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof EditCancelDialogWrapper>;

type IEditCancelDialogStory = StoryObj<typeof EditCancelDialogMeta>;

export const EditCancelDialogStory: IEditCancelDialogStory = {
  args: {
    open: true,
    isDragDrop: false,
    onClose: fn(),
    onKeep: fn(),
    onCancel: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const canvas = within(canvasElement.ownerDocument.body);
    const title = await canvas.findByRole('heading', { name: '편집 모드 취소' });
    const targetDialog = title.closest('[role="dialog"]') as HTMLElement | null;

    expect(targetDialog).not.toBeNull();

    const dialogWithin = within(targetDialog as HTMLElement);
    const cancelButton = await dialogWithin.findByRole('button', { name: /편집 취소/ });

    await user.click(cancelButton);

    await waitFor(() => {
      expect(args.onCancel).toHaveBeenCalledTimes(1);
    });
  },
};

// 날짜 클릭 시 편집 모드 취소 다이얼로그
export const EditCancelDialogDateClick: IEditCancelDialogStory = {
  args: {
    open: true,
    isDragDrop: false,
    onClose: fn(),
    onKeep: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          '편집 중인 상태에서 날짜 셀을 클릭하면 표시되는 다이얼로그. 편집을 취소하고 새 일정을 생성할지 선택할 수 있습니다.',
      },
    },
  },
};

// 드래그 앤 드롭 시 편집 모드 취소 다이얼로그
export const EditCancelDialogDragDrop: IEditCancelDialogStory = {
  args: {
    open: true,
    isDragDrop: true,
    onClose: fn(),
    onKeep: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          '편집 중인 상태에서 다른 일정을 드래그하면 표시되는 다이얼로그. 편집을 취소하고 일정을 이동할지 선택할 수 있습니다.',
      },
    },
  },
};

// 닫힌 상태
export const EditCancelDialogClosed: IEditCancelDialogStory = {
  args: {
    open: false,
    isDragDrop: false,
    onClose: fn(),
    onKeep: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '다이얼로그가 닫힌 상태',
      },
    },
  },
};

// ========== 모든 다이얼로그 통합 뷰 ==========

const AllDialogsComponent = () => {
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [overlapOpen, setOverlapOpen] = useState(false);
  const [editCancelOpen, setEditCancelOpen] = useState(false);
  const [recurringMode, setRecurringMode] = useState<'edit' | 'delete'>('edit');
  const [isDragOverlap, setIsDragOverlap] = useState(false);
  const [isDragDrop, setIsDragDrop] = useState(false);

  return (
    <Stack spacing={4} sx={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h4">다이얼로그 회귀 테스트</Typography>

      <Box>
        <Typography variant="h6" gutterBottom>
          반복 일정 다이얼로그
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setRecurringMode('edit');
              setRecurringOpen(true);
            }}
          >
            반복 일정 수정 다이얼로그 열기
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setRecurringMode('delete');
              setRecurringOpen(true);
            }}
          >
            반복 일정 삭제 다이얼로그 열기
          </Button>
        </Stack>
        <RecurringEventDialog
          open={recurringOpen}
          mode={recurringMode}
          event={mockRecurringEvent}
          onClose={() => setRecurringOpen(false)}
          onConfirm={() => setRecurringOpen(false)}
        />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          겹침 경고 다이얼로그
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setIsDragOverlap(false);
              setOverlapOpen(true);
            }}
          >
            일반 겹침 다이얼로그 열기
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setIsDragOverlap(true);
              setOverlapOpen(true);
            }}
          >
            드래그 겹침 다이얼로그 열기
          </Button>
        </Stack>
        <OverlapDialog
          open={overlapOpen}
          overlappingEvents={mockOverlappingEvents}
          isDragOverlapDialog={isDragOverlap}
          onClose={() => setOverlapOpen(false)}
          onContinue={() => setOverlapOpen(false)}
        />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          편집 모드 취소 다이얼로그
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setIsDragDrop(false);
              setEditCancelOpen(true);
            }}
          >
            날짜 클릭 다이얼로그 열기
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setIsDragDrop(true);
              setEditCancelOpen(true);
            }}
          >
            드래그 앤 드롭 다이얼로그 열기
          </Button>
        </Stack>
        <EditCancelDialog
          open={editCancelOpen}
          isDragDrop={isDragDrop}
          onClose={() => setEditCancelOpen(false)}
          onKeep={() => setEditCancelOpen(false)}
          onCancel={() => setEditCancelOpen(false)}
        />
      </Box>
    </Stack>
  );
};

export const AllDialogsMeta = {
  title: 'Dialogs/All Dialogs',
  component: AllDialogsComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '모든 다이얼로그를 한 번에 확인할 수 있는 통합 뷰',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ padding: '20px', width: '100%', minHeight: '100vh' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof AllDialogsComponent>;

export const AllDialogs: StoryObj<typeof AllDialogsMeta> = {
  parameters: {
    docs: {
      description: {
        story: '모든 다이얼로그를 한 화면에서 테스트할 수 있는 통합 뷰입니다.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });

    const openRecurringButton = await canvas.findByRole('button', {
      name: '반복 일정 수정 다이얼로그 열기',
    });
    await user.click(openRecurringButton);
    await body.findByRole('dialog', { name: '반복 일정 수정' });

    const openOverlapButton = await canvas.findByRole('button', {
      name: '일반 겹침 다이얼로그 열기',
    });
    await user.click(openOverlapButton);
    await body.findByRole('dialog', { name: '일정 겹침 경고' });

    const openEditCancelButton = await canvas.findByRole('button', {
      name: '날짜 클릭 다이얼로그 열기',
    });
    await user.click(openEditCancelButton);
    await body.findByRole('dialog', { name: '편집 모드 취소' });
  },
};
