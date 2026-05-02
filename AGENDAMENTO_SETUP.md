# Configuração do Agendamento (Google Calendar)

## 1) Pré-requisitos
- Node.js 18+
- Projeto Google Cloud com Google Calendar API ativa
- Conta/agenda do Psicólogo partilhada com o Service Account

## 2) Variáveis de ambiente
Crie um `.env` com:

```bash
GOOGLE_CLIENT_EMAIL=service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
GOOGLE_TIMEZONE=Europe/Lisbon
PORT=3000
```

> Importante: em `GOOGLE_PRIVATE_KEY`, manter quebras de linha com `\n`.

## 3) Permissões no Google Calendar
1. No Google Calendar do psicólogo, abrir **Configurações e partilha** da agenda principal.
2. Em **Partilhar com pessoas/grupos**, adicionar o `GOOGLE_CLIENT_EMAIL`.
3. Dar permissão de **Fazer alterações a eventos**.

## 4) Instalação e execução
```bash
npm install
npm run start
```

Abrir:
- Home: `http://localhost:3000/`
- Agendamento: `http://localhost:3000/agendamento.html`

## 5) Endpoints criados
- `GET /api/availability?date=YYYY-MM-DD&modality=online|presencial&serviceType=individual|casal|familia`
  - Consulta disponibilidade real
  - Considera duração (60/90 min)
  - Remove horários passados e com conflito

- `POST /api/book`
  - Cria evento no Google Calendar
  - Revalida disponibilidade para evitar dupla marcação
  - Online: cria Google Meet automaticamente
  - Presencial: grava local com endereço do consultório

## 6) Regras implementadas
- Duração:
  - Individual: 60 min
  - Casal: 90 min
  - Família: 90 min
- Modalidades:
  - Online (com Google Meet)
  - Presencial (sem Meet; com local)
- Bloqueio de sobreposição e encaixe quebrado (slot precisa comportar duração inteira)

## 7) Observações
- Sem credenciais válidas, os endpoints retornam erro amigável de configuração.
- A integração com Google Calendar ocorre **somente no backend**.
