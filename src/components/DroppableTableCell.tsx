import { useDroppable } from '@dnd-kit/core';
import { TableCell, Typography } from '@mui/material';
import { ReactNode } from 'react';

import { Event } from '../types';

interface DroppableTableCellProps {
  id: string;
  dateString: string;
  day: number | null;
  holiday?: string;
  children: ReactNode;
  onClick: () => void;
  dayEvents: Event[];
  view: 'week' | 'month';
}

export const DroppableTableCell = ({
  id,
  dateString,
  day,
  holiday,
  children,
  onClick,
  dayEvents,
  view,
}: DroppableTableCellProps) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      dateString,
      day,
      view,
    },
  });

  return (
    <TableCell
      ref={setNodeRef}
      onClick={onClick}
      role="button"
      tabIndex={day && dateString && dayEvents.length === 0 ? 0 : -1}
      sx={{
        height: '120px',
        verticalAlign: 'top',
        width: '14.28%',
        padding: 1,
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        position: 'relative',
        cursor: day && dayEvents.length === 0 ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      {day && (
        <>
          <Typography
            variant="body2"
            fontWeight="bold"
            onClick={(e) => e.stopPropagation()}
            sx={{
              pointerEvents: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              lineHeight: 1.2,
            }}
          >
            {day}
          </Typography>
          {holiday && (
            <Typography
              variant="body2"
              color="error"
              onClick={(e) => e.stopPropagation()}
              sx={{
                pointerEvents: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                lineHeight: 1.2,
              }}
            >
              {holiday}
            </Typography>
          )}
          {children}
        </>
      )}
    </TableCell>
  );
};
