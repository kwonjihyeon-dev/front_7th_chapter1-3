import { useDraggable } from '@dnd-kit/core';
import { Notifications, Repeat } from '@mui/icons-material';
import { Box, Stack, Tooltip, Typography } from '@mui/material';

import { Event, RepeatType } from '../types';

interface DraggableEventBoxProps {
  event: Event;
  isNotified: boolean;
  getRepeatTypeLabel: (type: RepeatType) => string;
}

export const DraggableEventBox = ({
  event,
  isNotified,
  getRepeatTypeLabel,
}: DraggableEventBoxProps) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: event.id,
    data: {
      event,
    },
  });

  const isRepeating = event.repeat.type !== 'none';

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-event
      onClick={(e) => e.stopPropagation()}
      sx={{
        my: 0.5,
        p: 0.5,
        backgroundColor: isNotified ? '#ffebee' : '#f5f5f5',
        borderRadius: 1,
        fontWeight: isNotified ? 'bold' : 'normal',
        color: isNotified ? '#d32f2f' : 'inherit',
        minHeight: '18px',
        width: '100%',
        overflow: 'hidden',
        cursor: 'grab',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {isNotified && <Notifications fontSize="small" />}
        {isRepeating && (
          <Tooltip
            title={`${event.repeat.interval}${getRepeatTypeLabel(event.repeat.type)}마다 반복${
              event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
            }`}
          >
            <Repeat fontSize="small" />
          </Tooltip>
        )}
        <Typography variant="caption" noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
          {event.title}
        </Typography>
      </Stack>
    </Box>
  );
};
