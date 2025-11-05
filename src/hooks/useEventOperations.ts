import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../messages';
import { Event, EventForm } from '../types';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import { generateRepeatEvents } from '../utils/generateRepeatEvents';

export const useEventOperations = (onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchEvents = async () => {
    try {
      const response = await apiGet('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar(ERROR_MESSAGES.FETCH_FAILED, { variant: 'error' });
    }
  };

  // 순수 API 함수: 이벤트 생성
  const createEvent = async (eventData: EventForm): Promise<boolean> => {
    try {
      const response = await apiPost('/api/events', eventData);

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(SUCCESS_MESSAGES.EVENT_ADDED, { variant: 'success' });
      return true;
    } catch (error) {
      console.error('Error creating event:', error);
      enqueueSnackbar(ERROR_MESSAGES.SAVE_FAILED, { variant: 'error' });
      return false;
    }
  };

  // 순수 API 함수: 이벤트 수정
  const updateEvent = async (eventData: Event): Promise<boolean> => {
    try {
      const editingEvent = {
        ...eventData,
        // ! TEST CASE
        repeat: eventData.repeat ?? {
          type: 'none',
          interval: 0,
          endDate: '',
        },
      };

      const response = await apiPut(`/api/events/${eventData.id}`, editingEvent);

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(SUCCESS_MESSAGES.EVENT_UPDATED, { variant: 'success' });
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      enqueueSnackbar(ERROR_MESSAGES.SAVE_FAILED, { variant: 'error' });
      return false;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await apiDelete(`/api/events/${id}`);

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar(SUCCESS_MESSAGES.EVENT_DELETED, { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar(ERROR_MESSAGES.DELETE_FAILED, { variant: 'error' });
    }
  };

  const createRepeatEvent = async (eventData: EventForm) => {
    try {
      const newEvents = generateRepeatEvents(eventData);
      const response = await apiPost('/api/events-list', { events: newEvents });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(SUCCESS_MESSAGES.EVENT_ADDED, { variant: 'success' });
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar(ERROR_MESSAGES.SAVE_FAILED, { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar(SUCCESS_MESSAGES.EVENTS_LOADED, { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    events,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    createRepeatEvent,
  };
};
