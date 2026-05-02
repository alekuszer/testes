const DEFAULT_TIMEZONE = process.env.GOOGLE_TIMEZONE || 'Europe/Lisbon';

const SERVICE_TYPES = {
  individual: { label: 'Individual', durationMinutes: 60 },
  casal: { label: 'Casal', durationMinutes: 90 },
  familia: { label: 'Família', durationMinutes: 90 },
};

const MODALITIES = {
  online: { label: 'Online' },
  presencial: {
    label: 'Presencial',
    location: 'Av. Comendador Ferreira de Matos 122, 1 andar C 3, Matosinhos, Porto',
  },
};

// Horário padrão da clínica
const BUSINESS_HOURS = {
  1: { start: '08:00', end: '21:00' }, // segunda
  2: { start: '08:00', end: '21:00' },
  3: { start: '08:00', end: '21:00' },
  4: { start: '08:00', end: '21:00' },
  5: { start: '08:00', end: '17:00' }, // sexta
};

module.exports = {
  DEFAULT_TIMEZONE,
  SERVICE_TYPES,
  MODALITIES,
  BUSINESS_HOURS,
  SLOT_STEP_MINUTES: 30,
};
