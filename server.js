import { randomUUID } from 'crypto';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import express from 'express';

const app = express();
const port = 3000;
const __dirname = path.resolve();

app.use(express.json());

// 워커별 데이터베이스 파일 지원
// X-Test-DB-File 헤더 또는 TEST_DB_FILE 환경 변수로 데이터베이스 파일 선택
const getDbName = (req) => {
  // 요청 헤더에서 데이터베이스 파일명 가져오기 (워커별 독립성)
  const headerDbName = req.headers['x-test-db-file'];
  if (headerDbName) {
    return headerDbName;
  }
  // 환경 변수에서 가져오기 (폴백)
  return process.env.TEST_ENV === 'e2e' ? 'e2e.json' : 'realEvents.json';
};

const getEvents = async (dbName) => {
  const data = await readFile(`${__dirname}/src/__mocks__/response/${dbName}`, 'utf8');

  return JSON.parse(data);
};

app.get('/api/events', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  res.json(events);
});

app.post('/api/events', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  const newEvent = { id: randomUUID(), ...req.body };

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: [...events.events, newEvent],
    })
  );

  res.status(201).json(newEvent);
});

app.put('/api/events/:id', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  const id = req.params.id;
  const eventIndex = events.events.findIndex((event) => event.id === id);
  if (eventIndex > -1) {
    const newEvents = [...events.events];
    newEvents[eventIndex] = { ...events.events[eventIndex], ...req.body };

    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: newEvents,
      })
    );

    res.json(events.events[eventIndex]);
  } else {
    res.status(404).send('Event not found');
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  const id = req.params.id;

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: events.events.filter((event) => event.id !== id),
    })
  );

  res.status(204).send();
});

app.post('/api/events-list', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  const repeatId = randomUUID();
  const newEvents = req.body.events.map((event) => {
    const isRepeatEvent = event.repeat.type !== 'none';
    return {
      id: randomUUID(),
      ...event,
      repeat: {
        ...event.repeat,
        id: isRepeatEvent ? repeatId : undefined,
      },
    };
  });

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: [...events.events, ...newEvents],
    })
  );

  res.status(201).json(newEvents);
});

app.put('/api/events-list', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  let isUpdated = false;

  const newEvents = [...events.events];
  req.body.events.forEach((event) => {
    const eventIndex = events.events.findIndex((target) => target.id === event.id);
    if (eventIndex > -1) {
      isUpdated = true;
      newEvents[eventIndex] = { ...events.events[eventIndex], ...event };
    }
  });

  if (isUpdated) {
    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: newEvents,
      })
    );

    res.json(events.events);
  } else {
    res.status(404).send('Event not found');
  }
});

app.delete('/api/events-list', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  const newEvents = events.events.filter((event) => !req.body.eventIds.includes(event.id)); // ? ids를 전달하면 해당 아이디를 기준으로 events에서 제거

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: newEvents,
    })
  );

  res.status(204).send();
});

app.put('/api/recurring-events/:repeatId', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  const repeatId = req.params.repeatId;
  const updateData = req.body;

  const seriesEvents = events.events.filter((event) => event.repeat.id === repeatId);

  if (seriesEvents.length === 0) {
    return res.status(404).send('Recurring series not found');
  }

  const newEvents = events.events.map((event) => {
    if (event.repeat.id === repeatId) {
      return {
        ...event,
        title: updateData.title || event.title,
        description: updateData.description || event.description,
        location: updateData.location || event.location,
        category: updateData.category || event.category,
        notificationTime: updateData.notificationTime || event.notificationTime,
        startTime: updateData.startTime || event.startTime,
        endTime: updateData.endTime || event.endTime,
        repeat: updateData.repeat ? { ...event.repeat, ...updateData.repeat } : event.repeat,
      };
    }
    return event;
  });

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({ events: newEvents })
  );

  res.json(seriesEvents);
});

app.delete('/api/recurring-events/:repeatId', async (req, res) => {
  const dbName = getDbName(req);
  const events = await getEvents(dbName);
  const repeatId = req.params.repeatId;

  const remainingEvents = events.events.filter((event) => event.repeat.id !== repeatId);

  if (remainingEvents.length === events.events.length) {
    return res.status(404).send('Recurring series not found');
  }

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({ events: remainingEvents })
  );

  res.status(204).send();
});

app.listen(port, () => {
  // 기본 데이터베이스 파일 초기화 (워커별 파일은 테스트에서 생성)
  const defaultDbName = 'realEvents.json';
  if (!fs.existsSync(`${__dirname}/src/__mocks__/response/${defaultDbName}`)) {
    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${defaultDbName}`,
      JSON.stringify({
        events: [],
      })
    );
  }
  console.log(`Server running at http://localhost:${port}`);
});
