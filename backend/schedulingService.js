const { DateTime, Interval } = require('luxon');
const { BUSINESS_HOURS, DEFAULT_TIMEZONE, SERVICE_TYPES, SLOT_STEP_MINUTES, MODALITIES } = require('./config');
const { getBusyIntervals } = require('./googleCalendarService');

function validateModalityAndType(modality, serviceType) {
  if (!MODALITIES[modality]) throw new Error('Modalidade inválida.');
  if (!SERVICE_TYPES[serviceType]) throw new Error('Tipo de atendimento inválido.');
}

function getDurationMinutes(serviceType) {
  return SERVICE_TYPES[serviceType].durationMinutes;
}

function getBusinessWindow(dateISO) {
  const date = DateTime.fromISO(dateISO, { zone: DEFAULT_TIMEZONE });
  const weekday = date.weekday; // 1 segunda ... 7 domingo
  const hours = BUSINESS_HOURS[weekday];
  if (!hours) return null;

  const start = DateTime.fromISO(`${dateISO}T${hours.start}`, { zone: DEFAULT_TIMEZONE });
  const end = DateTime.fromISO(`${dateISO}T${hours.end}`, { zone: DEFAULT_TIMEZONE });

  return { start, end };
}

function overlapsAny(start, end, busyIntervals) {
  const slot = Interval.fromDateTimes(start, end);
  return busyIntervals.some((busy) => {
    const busyStart = DateTime.fromISO(busy.start, { zone: DEFAULT_TIMEZONE });
    const busyEnd = DateTime.fromISO(busy.end, { zone: DEFAULT_TIMEZONE });
    return slot.overlaps(Interval.fromDateTimes(busyStart, busyEnd));
  });
}

async function getAvailableSlots({ date, modality, serviceType }) {
  validateModalityAndType(modality, serviceType);
  const duration = getDurationMinutes(serviceType);
  const window = getBusinessWindow(date);
  if (!window) return [];

  const busyIntervals = await getBusyIntervals(window.start.toISO(), window.end.toISO());
  const now = DateTime.now().setZone(DEFAULT_TIMEZONE);

  const slots = [];
  let cursor = window.start;

  while (cursor.plus({ minutes: duration }) <= window.end) {
    const slotEnd = cursor.plus({ minutes: duration });

    const isPast = cursor <= now;
    const hasConflict = overlapsAny(cursor, slotEnd, busyIntervals);

    if (!isPast && !hasConflict) {
      slots.push({
        start: cursor.toISO(),
        end: slotEnd.toISO(),
        label: `${cursor.toFormat('HH:mm')} - ${slotEnd.toFormat('HH:mm')}`,
      });
    }

    cursor = cursor.plus({ minutes: SLOT_STEP_MINUTES });
  }

  return slots;
}

module.exports = {
  getAvailableSlots,
  getDurationMinutes,
  validateModalityAndType,
};
