import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { Event } from '../types';
import { DraggableEventBox } from './DraggableEventBox';
import { DroppableTableCell } from './DroppableTableCell';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../utils/dateUtils';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

interface CalendarViewProps {
  view: 'week' | 'month';
  currentDate: Date;
  events: Event[];
  notifiedEvents?: string[];
  holidays?: Record<string, string>;
  onDateCellClick?: (dateString: string, date?: Date) => void;
}

export const CalendarView = ({
  view,
  currentDate,
  events,
  notifiedEvents = [],
  holidays = {},
  onDateCellClick,
}: CalendarViewProps) => {
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    return (
      <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatWeek(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {weekDates.map((date) => {
                  const dateString = formatDate(date, date.getDate());
                  const holiday = holidays[dateString];
                  const dayEvents = events.filter((event) => {
                    const eventDate = new Date(event.date);
                    return eventDate.toDateString() === date.toDateString();
                  });

                  return (
                    <DroppableTableCell
                      key={date.toISOString()}
                      id={`droppable-week-${dateString}`}
                      dateString={dateString}
                      day={date.getDate()}
                      holiday={holiday}
                      onClick={() => onDateCellClick?.(dateString, date)}
                      dayEvents={dayEvents}
                      view="week"
                    >
                      {dayEvents.map((event) => {
                        const isNotified = notifiedEvents.includes(event.id);

                        return (
                          <DraggableEventBox key={event.id} event={event} isNotified={isNotified} />
                        );
                      })}
                    </DroppableTableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  const renderMonthView = () => {
    const weeks = getWeeksAtMonth(currentDate);

    return (
      <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatMonth(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {weeks.map((week, weekIndex) => (
                <TableRow key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const dateString = day ? formatDate(currentDate, day) : '';
                    const holiday = holidays[dateString];
                    const dayEvents = day ? getEventsForDay(events, day) : [];
                    const filteredDayEvents = dayEvents.filter(
                      (event) => new Date(event.date).getMonth() === currentDate.getMonth()
                    );

                    return (
                      <DroppableTableCell
                        key={dayIndex}
                        id={`droppable-month-${dateString}`}
                        dateString={dateString}
                        day={day}
                        holiday={holiday}
                        onClick={() => onDateCellClick?.(dateString)}
                        dayEvents={filteredDayEvents}
                        view="month"
                      >
                        {filteredDayEvents.map((event) => {
                          const isNotified = notifiedEvents.includes(event.id);

                          return (
                            <DraggableEventBox
                              key={event.id}
                              event={event}
                              isNotified={isNotified}
                            />
                          );
                        })}
                      </DroppableTableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  return (
    <>
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </>
  );
};
