const { google } = require('googleapis');
const { DEFAULT_TIMEZONE } = require('./config');

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Credenciais Google não configuradas. Defina GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY.');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

function getCalendarClient() {
  const auth = getAuthClient();
  return google.calendar({ version: 'v3', auth });
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

async function getBusyIntervals(timeMin, timeMax) {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: DEFAULT_TIMEZONE,
      items: [{ id: calendarId }],
    },
  });

  return response.data.calendars?.[calendarId]?.busy || [];
}

async function createCalendarEvent(eventInput) {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: eventInput.withMeet ? 1 : 0,
    requestBody: {
      summary: eventInput.summary,
      description: eventInput.description,
      start: {
        dateTime: eventInput.startDateTime,
        timeZone: DEFAULT_TIMEZONE,
      },
      end: {
        dateTime: eventInput.endDateTime,
        timeZone: DEFAULT_TIMEZONE,
      },
      location: eventInput.location,
      attendees: eventInput.attendees,
      conferenceData: eventInput.withMeet
        ? {
            createRequest: {
              conferenceSolutionKey: { type: 'hangoutsMeet' },
              requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            },
          }
        : undefined,
    },
  });

  return response.data;
}

module.exports = {
  getBusyIntervals,
  createCalendarEvent,
};
