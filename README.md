# Адаптив — прототип ИИ-тьютора

Интерактивный прототип учебного сервиса на React. Данные автоматически
собираются из книги `ФИНАЛ для прототипа ии_тьютора.xlsx`:

- Markdown-теория и LaTeX-формулы;
- связи навыков и пререквизитов;
- задания, варианты и открытые ответы;
- описания навыков.

## Запуск

```bash
npm install
npm run dev
```

Ключ для ИИ-помощника — локально в `src/assistant/llm.config.js`:

```bash
cp src/assistant/llm.config.example.js src/assistant/llm.config.js
```

После изменения исходной таблицы обновите данные:

```bash
npm run data
```

## Production-сборка

```bash
npm run build
npm start
```

Перед `npm start` задайте переменные окружения (см. `.env.example`):

```bash
export ANTHROPIC_API_KEY=sk-or-...
export ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
npm start
```

Сервер отдаёт статику из `dist/` и обрабатывает `POST /api/assistant`.

## Деплой на Render (Web Service)

1. Запушьте репозиторий на GitHub.
2. В [Render Dashboard](https://dashboard.render.com) создайте **Web Service** из репозитория.
3. Настройки:
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
4. Environment Variables:
   - `ANTHROPIC_API_KEY` — секрет (OpenRouter `sk-or-...` или Anthropic)
   - `ANTHROPIC_MODEL` — `claude-sonnet-4-5-20250929`
   - `NODE_ENV` — `production`
5. Render сам задаёт `PORT`; сервер слушает `0.0.0.0:$PORT`.

Альтернатива: **New → Blueprint** и указать репозиторий с `render.yaml`.

