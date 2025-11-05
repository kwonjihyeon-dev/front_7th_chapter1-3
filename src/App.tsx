import { DndContext, DragEndEvent } from '@dnd-kit/core';
import {
  ChevronLeft,
  ChevronRight,
  Close,
  Delete,
  Edit,
  Notifications,
  Repeat,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { DraggableEventBox } from './components/DraggableEventBox.tsx';
import { DroppableTableCell } from './components/DroppableTableCell.tsx';
import RecurringEventDialog from './components/RecurringEventDialog.tsx';
import { useCalendarView } from './hooks/useCalendarView.ts';
import { useEventForm } from './hooks/useEventForm.ts';
import { useEventOperations } from './hooks/useEventOperations.ts';
import { useNotifications } from './hooks/useNotifications.ts';
import { useRecurringEventOperations } from './hooks/useRecurringEventOperations.ts';
import { useSearch } from './hooks/useSearch.ts';
import { Event, EventForm, RepeatType } from './types.ts';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from './utils/dateUtils.ts';
import { findOverlappingEvents } from './utils/eventOverlap.ts';
import { getTimeErrorMessage } from './utils/timeValidation.ts';

const categories = ['업무', '개인', '가족', '기타'];

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

const getRepeatTypeLabel = (type: RepeatType): string => {
  switch (type) {
    case 'daily':
      return '일';
    case 'weekly':
      return '주';
    case 'monthly':
      return '월';
    case 'yearly':
      return '년';
    default:
      return '';
  }
};

function App() {
  const {
    title,
    setTitle,
    date,
    setDate,
    startTime,
    endTime,
    description,
    setDescription,
    location,
    setLocation,
    category,
    setCategory,
    isRepeating,
    setIsRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    setRepeatInterval,
    repeatEndDate,
    setRepeatEndDate,
    notificationTime,
    setNotificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    setEditingEvent,
    handleStartTimeChange,
    handleEndTimeChange,
    resetForm,
    editEvent,
  } = useEventForm();

  const { events, saveEvent, deleteEvent, createRepeatEvent, fetchEvents } = useEventOperations(
    Boolean(editingEvent),
    () => setEditingEvent(null)
  );

  const { handleRecurringEdit, handleRecurringDelete } = useRecurringEventOperations(
    events,
    async () => {
      // After recurring edit, refresh events from server
      await fetchEvents();
    }
  );

  const { notifications, notifiedEvents, setNotifications } = useNotifications(events);
  const { view, setView, currentDate, holidays, navigate } = useCalendarView();
  const { searchTerm, filteredEvents, setSearchTerm } = useSearch(events, currentDate, view);

  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
  const [pendingRecurringEdit, setPendingRecurringEdit] = useState<Event | null>(null);
  const [pendingRecurringDelete, setPendingRecurringDelete] = useState<Event | null>(null);
  const [recurringEditMode, setRecurringEditMode] = useState<boolean | null>(null); // true = single, false = all
  const [recurringDialogMode, setRecurringDialogMode] = useState<'edit' | 'delete'>('edit');
  const [isEditCancelDialogOpen, setIsEditCancelDialogOpen] = useState(false);
  const [pendingClickDate, setPendingClickDate] = useState<string | null>(null);
  const [pendingDragDrop, setPendingDragDrop] = useState<{ event: Event; newDate: string } | null>(
    null
  );
  const [isDragOverlapDialog, setIsDragOverlapDialog] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const handleRecurringConfirm = async (editSingleOnly: boolean) => {
    if (recurringDialogMode === 'edit' && pendingRecurringEdit) {
      // 편집 모드 저장하고 편집 폼으로 이동
      setRecurringEditMode(editSingleOnly);
      editEvent(pendingRecurringEdit);
      setIsRecurringDialogOpen(false);
      setPendingRecurringEdit(null);
    } else if (recurringDialogMode === 'delete' && pendingRecurringDelete) {
      // 반복 일정 삭제 처리
      try {
        await handleRecurringDelete(pendingRecurringDelete, editSingleOnly);
        enqueueSnackbar('일정이 삭제되었습니다', { variant: 'success' });
      } catch (error) {
        console.error(error);
        enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
      }
      setIsRecurringDialogOpen(false);
      setPendingRecurringDelete(null);
    }
  };

  const isRecurringEvent = (event: Event): boolean => {
    return event.repeat.type !== 'none' && event.repeat.interval > 0;
  };

  const handleEditEvent = (event: Event) => {
    if (isRecurringEvent(event)) {
      // Show recurring edit dialog
      setPendingRecurringEdit(event);
      setRecurringDialogMode('edit');
      setIsRecurringDialogOpen(true);
    } else {
      // Regular event editing
      editEvent(event);
    }
  };

  const handleDeleteEvent = (event: Event) => {
    if (isRecurringEvent(event)) {
      // Show recurring delete dialog
      setPendingRecurringDelete(event);
      setRecurringDialogMode('delete');
      setIsRecurringDialogOpen(true);
    } else {
      // Regular event deletion
      deleteEvent(event.id);
    }
  };

  const handleDateCellClick = (clickedDate: string, day: number | null, dateObj?: Date) => {
    // clickedDate가 빈 문자열이면 무시
    if (!clickedDate) {
      return;
    }

    // 편집 모드인 경우 다이얼로그 표시 (FR4) - 일정 존재 여부와 관계없이 표시
    if (editingEvent) {
      setPendingClickDate(clickedDate);
      setIsEditCancelDialogOpen(true);
      return;
    }

    // 일정이 있는 셀인지 확인 (FR2) - 편집 모드가 아닐 때만
    let dayEvents: Event[] = [];
    if (dateObj) {
      // 주 뷰: Date 객체를 사용하여 날짜 비교
      dayEvents = filteredEvents.filter(
        (event) => new Date(event.date).toDateString() === dateObj.toDateString()
      );
    } else if (clickedDate) {
      // 월 뷰: clickedDate를 사용하여 날짜 비교 (getEventsForDay는 월을 고려하지 않음)
      dayEvents = filteredEvents.filter((event) => event.date === clickedDate);
    }

    if (dayEvents.length > 0) {
      return; // 일정이 있는 셀은 클릭 무시
    }

    // 일반 모드: 날짜 설정 (FR1, FR3)
    setDate(clickedDate);
    // 시간 필드는 빈 값 유지 (FR3) - resetForm을 호출하지 않음
  };

  const handleEditCancelConfirm = () => {
    // 편집 모드 취소 및 새 일정 생성 모드로 전환
    setEditingEvent(null);
    resetForm();
    if (pendingClickDate) {
      setDate(pendingClickDate);
    }
    setIsEditCancelDialogOpen(false);
    setPendingClickDate(null);
  };

  const handleEditKeep = () => {
    // 편집 모드 유지
    setIsEditCancelDialogOpen(false);
    setPendingClickDate(null);
  };

  // 드래그한 일정을 새 날짜로 이동하고 업데이트하는 공통 로직
  const updateDraggedEvent = async (draggedEvent: Event, newDate: string): Promise<boolean> => {
    // 같은 날짜로 드래그한 경우 변경 없음
    if (draggedEvent.date === newDate) {
      return false;
    }

    // 드래그한 일정을 새 날짜로 이동하고 단일 일정으로 변환 (나머지 반복 일정 인스턴스는 변경하지 않음)
    const updatedEvent: Event = {
      ...draggedEvent,
      date: newDate,
      repeat: {
        type: 'none' as const,
        interval: 0,
        endDate: undefined,
      },
    };

    // 겹침 검사
    const overlapping = findOverlappingEvents(updatedEvent, events);
    if (overlapping.length > 0) {
      setOverlappingEvents(overlapping);
      setIsDragOverlapDialog(true);
      setIsOverlapDialogOpen(true);
      return false;
    }

    // 드래그한 일정만 업데이트
    try {
      const response = await fetch(`/api/events/${updatedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 수정되었습니다', { variant: 'success' });
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
      return false;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // 드래그한 이벤트 찾기
    const draggedEvent = events.find((e) => e.id === active.id);
    if (!draggedEvent) {
      return;
    }

    // 드롭 위치가 없거나 드롭 가능한 영역이 아닌 경우 (드롭 불가능한 영역)
    if (!over || !over.data.current?.dateString) {
      return;
    }

    const newDate = over.data.current.dateString as string;

    // 편집 모드 중이고, 드래그한 이벤트가 편집 중인 이벤트가 아닌 경우
    if (editingEvent && editingEvent.id !== draggedEvent.id) {
      setPendingDragDrop({ event: draggedEvent, newDate });
      setIsEditCancelDialogOpen(true);
      return;
    }

    await updateDraggedEvent(draggedEvent, newDate);
  };

  const handleDragCancel = () => {
    // 드래그 취소 처리 (필요시 추가 로직 구현)
  };

  const handleEditCancelConfirmForDrag = async () => {
    // 편집 모드 취소 및 드래그 진행
    setEditingEvent(null);
    resetForm();
    setIsEditCancelDialogOpen(false);
    setPendingClickDate(null);

    // 드래그 앤 드롭 처리
    if (pendingDragDrop) {
      const { event: draggedEvent, newDate } = pendingDragDrop;
      await updateDraggedEvent(draggedEvent, newDate);
      setPendingDragDrop(null);
    }
  };

  const addOrUpdateEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
      enqueueSnackbar('필수 정보를 모두 입력해주세요.', { variant: 'error' });
      return;
    }

    if (startTimeError || endTimeError) {
      enqueueSnackbar('시간 설정을 확인해주세요.', { variant: 'error' });
      return;
    }

    const eventData: Event | EventForm = {
      id: editingEvent ? editingEvent.id : undefined,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: editingEvent
        ? editingEvent.repeat // Keep original repeat settings for recurring event detection
        : {
            type: isRepeating ? repeatType : 'none',
            interval: repeatInterval,
            endDate: repeatEndDate || undefined,
          },
      notificationTime,
    };

    const overlapping = findOverlappingEvents(eventData, events);
    const hasOverlapEvent = overlapping.length > 0;

    // 수정
    if (editingEvent) {
      if (hasOverlapEvent) {
        setOverlappingEvents(overlapping);
        setIsOverlapDialogOpen(true);
        return;
      }

      if (
        editingEvent.repeat.type !== 'none' &&
        editingEvent.repeat.interval > 0 &&
        recurringEditMode !== null
      ) {
        await handleRecurringEdit(eventData as Event, recurringEditMode);
        setRecurringEditMode(null);
      } else {
        await saveEvent(eventData);
      }

      resetForm();
      return;
    }

    // 생성
    if (isRepeating) {
      // 반복 생성은 반복 일정을 고려하지 않는다.
      await createRepeatEvent(eventData);
      resetForm();
      return;
    }

    if (hasOverlapEvent) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
      return;
    }

    await saveEvent(eventData);
    resetForm();
  };

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
                  const dayEvents = filteredEvents.filter(
                    (event) => new Date(event.date).toDateString() === date.toDateString()
                  );

                  return (
                    <DroppableTableCell
                      key={date.toISOString()}
                      id={`droppable-week-${dateString}`}
                      dateString={dateString}
                      day={date.getDate()}
                      onClick={() => handleDateCellClick(dateString, date.getDate(), date)}
                      dayEvents={dayEvents}
                      view="week"
                    >
                      {filteredEvents
                        .filter(
                          (event) => new Date(event.date).toDateString() === date.toDateString()
                        )
                        .map((event) => {
                          const isNotified = notifiedEvents.includes(event.id);

                          return (
                            <DraggableEventBox
                              key={event.id}
                              event={event}
                              isNotified={isNotified}
                              getRepeatTypeLabel={getRepeatTypeLabel}
                            />
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

                    const dayEvents = day ? getEventsForDay(filteredEvents, day) : [];

                    return (
                      <DroppableTableCell
                        key={dayIndex}
                        id={`droppable-month-${dateString}`}
                        dateString={dateString}
                        day={day}
                        holiday={holiday}
                        onClick={() => {
                          if (day && dateString) {
                            handleDateCellClick(dateString, day);
                          }
                        }}
                        dayEvents={dayEvents}
                        view="month"
                      >
                        {day &&
                          getEventsForDay(filteredEvents, day).map((event) => {
                            const isNotified = notifiedEvents.includes(event.id);

                            return (
                              <DraggableEventBox
                                key={event.id}
                                event={event}
                                isNotified={isNotified}
                                getRepeatTypeLabel={getRepeatTypeLabel}
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
    <DndContext onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
        <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
          <Stack spacing={2} sx={{ width: '20%' }}>
            <Typography variant="h4">{editingEvent ? '일정 수정' : '일정 추가'}</Typography>

            <FormControl fullWidth>
              <FormLabel htmlFor="title">제목</FormLabel>
              <TextField
                id="title"
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel htmlFor="date">날짜</FormLabel>
              <TextField
                id="date"
                size="small"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </FormControl>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <FormLabel htmlFor="start-time">시작 시간</FormLabel>
                <Tooltip title={startTimeError || ''} open={!!startTimeError} placement="top">
                  <TextField
                    id="start-time"
                    size="small"
                    type="time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    onBlur={() => getTimeErrorMessage(startTime, endTime)}
                    error={!!startTimeError}
                  />
                </Tooltip>
              </FormControl>
              <FormControl fullWidth>
                <FormLabel htmlFor="end-time">종료 시간</FormLabel>
                <Tooltip title={endTimeError || ''} open={!!endTimeError} placement="top">
                  <TextField
                    id="end-time"
                    size="small"
                    type="time"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    onBlur={() => getTimeErrorMessage(startTime, endTime)}
                    error={!!endTimeError}
                  />
                </Tooltip>
              </FormControl>
            </Stack>

            <FormControl fullWidth>
              <FormLabel htmlFor="description">설명</FormLabel>
              <TextField
                id="description"
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel htmlFor="location">위치</FormLabel>
              <TextField
                id="location"
                size="small"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel id="category-label">카테고리</FormLabel>
              <Select
                id="category"
                size="small"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-labelledby="category-label"
                aria-label="카테고리"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat} aria-label={`${cat}-option`}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!editingEvent && (
              <FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isRepeating}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsRepeating(checked);
                        if (checked) {
                          setRepeatType('daily');
                        } else {
                          setRepeatType('none');
                        }
                      }}
                    />
                  }
                  label="반복 일정"
                />
              </FormControl>
            )}

            {/* ! TEST CASE */}
            {isRepeating && !editingEvent && (
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <FormLabel>반복 유형</FormLabel>
                  <Select
                    size="small"
                    value={repeatType}
                    aria-label="반복 유형"
                    onChange={(e) => setRepeatType(e.target.value as RepeatType)}
                  >
                    <MenuItem value="daily" aria-label="daily-option">
                      매일
                    </MenuItem>
                    <MenuItem value="weekly" aria-label="weekly-option">
                      매주
                    </MenuItem>
                    <MenuItem value="monthly" aria-label="monthly-option">
                      매월
                    </MenuItem>
                    <MenuItem value="yearly" aria-label="yearly-option">
                      매년
                    </MenuItem>
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="repeat-interval">반복 간격</FormLabel>
                    <TextField
                      id="repeat-interval"
                      size="small"
                      type="number"
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 1 } }}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="repeat-end-date">반복 종료일</FormLabel>
                    <TextField
                      id="repeat-end-date"
                      size="small"
                      type="date"
                      value={repeatEndDate}
                      onChange={(e) => setRepeatEndDate(e.target.value)}
                    />
                  </FormControl>
                </Stack>
              </Stack>
            )}

            <FormControl fullWidth>
              <FormLabel htmlFor="notification">알림 설정</FormLabel>
              <Select
                id="notification"
                size="small"
                value={notificationTime}
                onChange={(e) => setNotificationTime(Number(e.target.value))}
              >
                {notificationOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              data-testid="event-submit-button"
              onClick={addOrUpdateEvent}
              variant="contained"
              color="primary"
            >
              {editingEvent ? '일정 수정' : '일정 추가'}
            </Button>
          </Stack>

          <Stack flex={1} spacing={5}>
            <Typography variant="h4">일정 보기</Typography>

            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <IconButton aria-label="Previous" onClick={() => navigate('prev')}>
                <ChevronLeft />
              </IconButton>
              <Select
                size="small"
                aria-label="뷰 타입 선택"
                value={view}
                onChange={(e) => setView(e.target.value as 'week' | 'month')}
              >
                <MenuItem value="week" aria-label="week-option">
                  Week
                </MenuItem>
                <MenuItem value="month" aria-label="month-option">
                  Month
                </MenuItem>
              </Select>
              <IconButton aria-label="Next" onClick={() => navigate('next')}>
                <ChevronRight />
              </IconButton>
            </Stack>

            {view === 'week' && renderWeekView()}
            {view === 'month' && renderMonthView()}
          </Stack>

          <Stack
            data-testid="event-list"
            spacing={2}
            sx={{ width: '30%', height: '100%', overflowY: 'auto' }}
          >
            <FormControl fullWidth>
              <FormLabel htmlFor="search">일정 검색</FormLabel>
              <TextField
                id="search"
                size="small"
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormControl>

            {filteredEvents.length === 0 ? (
              <Typography>검색 결과가 없습니다.</Typography>
            ) : (
              filteredEvents.map((event) => (
                <Box key={event.id} sx={{ border: 1, borderRadius: 2, p: 3, width: '100%' }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {notifiedEvents.includes(event.id) && <Notifications color="error" />}
                        {event.repeat.type !== 'none' && (
                          <Tooltip
                            title={`${event.repeat.interval}${getRepeatTypeLabel(
                              event.repeat.type
                            )}마다 반복${
                              event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
                            }`}
                          >
                            <Repeat fontSize="small" />
                          </Tooltip>
                        )}
                        <Typography
                          fontWeight={notifiedEvents.includes(event.id) ? 'bold' : 'normal'}
                          color={notifiedEvents.includes(event.id) ? 'error' : 'inherit'}
                        >
                          {event.title}
                        </Typography>
                      </Stack>
                      <Typography>{event.date}</Typography>
                      <Typography>
                        {event.startTime} - {event.endTime}
                      </Typography>
                      <Typography>{event.description}</Typography>
                      <Typography>{event.location}</Typography>
                      <Typography>카테고리: {event.category}</Typography>
                      {event.repeat.type !== 'none' && (
                        <Typography>
                          반복: {event.repeat.interval}
                          {event.repeat.type === 'daily' && '일'}
                          {event.repeat.type === 'weekly' && '주'}
                          {event.repeat.type === 'monthly' && '월'}
                          {event.repeat.type === 'yearly' && '년'}
                          마다
                          {event.repeat.endDate && ` (종료: ${event.repeat.endDate})`}
                        </Typography>
                      )}
                      <Typography>
                        알림:{' '}
                        {
                          notificationOptions.find(
                            (option) => option.value === event.notificationTime
                          )?.label
                        }
                      </Typography>
                    </Stack>
                    <Stack>
                      <IconButton aria-label="Edit event" onClick={() => handleEditEvent(event)}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        aria-label="Delete event"
                        onClick={() => handleDeleteEvent(event)}
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </Stack>

        <Dialog
          open={isOverlapDialogOpen}
          onClose={() => {
            setIsOverlapDialogOpen(false);
            setIsDragOverlapDialog(false);
          }}
        >
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
            <Button
              onClick={() => {
                setIsOverlapDialogOpen(false);
                setIsDragOverlapDialog(false);
              }}
            >
              취소
            </Button>
            {!isDragOverlapDialog && (
              <Button
                color="error"
                onClick={() => {
                  setIsOverlapDialogOpen(false);
                  setIsDragOverlapDialog(false);
                  if (editingEvent) {
                    saveEvent({
                      id: editingEvent.id,
                      title,
                      date,
                      startTime,
                      endTime,
                      description,
                      location,
                      category,
                      repeat: {
                        type: isRepeating ? repeatType : 'none',
                        interval: repeatInterval,
                        endDate: repeatEndDate || undefined,
                      },
                      notificationTime,
                    });
                  }
                }}
              >
                계속 진행
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <RecurringEventDialog
          open={isRecurringDialogOpen}
          onClose={() => {
            setIsRecurringDialogOpen(false);
            setPendingRecurringEdit(null);
            setPendingRecurringDelete(null);
          }}
          onConfirm={handleRecurringConfirm}
          event={recurringDialogMode === 'edit' ? pendingRecurringEdit : pendingRecurringDelete}
          mode={recurringDialogMode}
        />

        <Dialog open={isEditCancelDialogOpen} onClose={handleEditKeep}>
          <DialogTitle>편집 모드 취소</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {pendingDragDrop
                ? '편집 중인 일정이 있습니다. 편집을 취소하고 일정을 이동하시겠습니까?'
                : '편집 중인 일정이 있습니다. 편집을 취소하고 새 일정을 생성하시겠습니까?'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditKeep}>편집 유지</Button>
            <Button
              onClick={pendingDragDrop ? handleEditCancelConfirmForDrag : handleEditCancelConfirm}
              variant="contained"
              color="primary"
            >
              편집 취소
            </Button>
          </DialogActions>
        </Dialog>

        {notifications.length > 0 && (
          <Stack position="fixed" top={16} right={16} spacing={2} alignItems="flex-end">
            {notifications.map((notification, index) => (
              <Alert
                key={index}
                severity="info"
                sx={{ width: 'auto' }}
                action={
                  <IconButton
                    size="small"
                    onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Close />
                  </IconButton>
                }
              >
                <AlertTitle>{notification.message}</AlertTitle>
              </Alert>
            ))}
          </Stack>
        )}
      </Box>
    </DndContext>
  );
}

export default App;
