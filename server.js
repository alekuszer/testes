require('dotenv').config();
const express = require('express');
const path = require('path');
const { DateTime } = require('luxon');
const { getAvailableSlots, getDurationMinutes, validateModalityAndType } = require('./backend/schedulingService');
const { createCalendarEvent } = require('./backend/googleCalendarService');
const { DEFAULT_TIMEZONE, MODALITIES, SERVICE_TYPES } = require('./backend/config');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

app.get('/api/availability', async (req, res) => {
  try {
    const { date, modality, serviceType } = req.query;

    if (!date || !modality || !serviceType) {
      return badRequest(res, 'Parâmetros obrigatórios: date, modality e serviceType.');
    }

    const dateParsed = DateTime.fromISO(date, { zone: DEFAULT_TIMEZONE });
    if (!dateParsed.isValid) return badRequest(res, 'Data inválida. Use YYYY-MM-DD.');

    validateModalityAndType(modality, serviceType);

    const slots = await getAvailableSlots({ date, modality, serviceType });

    return res.json({
      date,
      modality,
      serviceType,
      durationMinutes: getDurationMinutes(serviceType),
      slots,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Não foi possível consultar disponibilidade no momento.' });
  }
});

app.post('/api/book', async (req, res) => {
  try {
    const {
      modality,
      serviceType,
      date,
      start,
      fullName,
      email,
      phone,
      notes,
    } = req.body;

    if (!modality || !serviceType || !date || !start || !fullName || !email || !phone) {
      return badRequest(res, 'Preencha todos os campos obrigatórios do agendamento.');
    }

    validateModalityAndType(modality, serviceType);

    const durationMinutes = getDurationMinutes(serviceType);
    const startDT = DateTime.fromISO(start, { zone: DEFAULT_TIMEZONE });

    if (!startDT.isValid) return badRequest(res, 'Horário inválido.');

    const slots = await getAvailableSlots({ date, modality, serviceType });
    const selected = slots.find((slot) => slot.start === startDT.toISO());
    if (!selected) {
      return res.status(409).json({ error: 'Este horário já não está disponível. Escolha outro horário.' });
    }

    const endDT = startDT.plus({ minutes: durationMinutes });
    const isOnline = modality === 'online';

    const summary = `Consulta ${SERVICE_TYPES[serviceType].label} (${MODALITIES[modality].label}) - ${fullName}`;
    const description = [
      `Paciente: ${fullName}`,
      `Email: ${email}`,
      `Telefone/WhatsApp: ${phone}`,
      `Modalidade: ${MODALITIES[modality].label}`,
      `Tipo de atendimento: ${SERVICE_TYPES[serviceType].label}`,
      `Duração: ${durationMinutes} minutos`,
      notes ? `Observações: ${notes}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const event = await createCalendarEvent({
      summary,
      description,
      startDateTime: startDT.toISO(),
      endDateTime: endDT.toISO(),
      withMeet: isOnline,
      location: isOnline ? undefined : MODALITIES.presencial.location,
      attendees: [{ email, displayName: fullName }],
    });

    const meetLink = event.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri;

    return res.status(201).json({
      success: true,
      appointment: {
        modality: MODALITIES[modality].label,
        serviceType: SERVICE_TYPES[serviceType].label,
        durationMinutes,
        start: startDT.toISO(),
        end: endDT.toISO(),
        fullName,
        email,
        phone,
        notes,
      },
      event: {
        id: event.id,
        htmlLink: event.htmlLink,
        meetLink,
        location: isOnline ? null : MODALITIES.presencial.location,
      },
    });
  } catch (error) {
    console.error(error);

    if (error.message?.includes('Credenciais Google não configuradas')) {
      return res.status(500).json({ error: 'Configuração do Google Calendar incompleta no servidor.' });
    }

    return res.status(500).json({ error: 'Não foi possível concluir o agendamento. Tente novamente.' });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ativo em http://localhost:${PORT}`);
});
