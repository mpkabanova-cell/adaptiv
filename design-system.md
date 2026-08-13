# Стиль и цветовое оформление сервиса

Документ описывает визуальный язык сервиса поиска и просмотра учебных заданий. Единый источник палитры — `ui/brand_colors.py` (гайд «Цветовая система» СберУм).

## Общий характер

- **Светлая тема** — тёмный режим в продукте не реализован.
- **Образовательный SaaS**: светлые фоны, белые «карточки», мягкие тени, акцентный фиолетово-синий.
- **Не корпоративный зелёный Сбера** (`#21A038` не используется). Основной акцент — **SberUm blue** `#503AE0` с дополнениями aqua, sky, mandarin.
- **Шрифт интерфейса** — [Inter](https://fonts.google.com/specimen/Inter) (400–700); в HTML заданий — системный стек (`Segoe UI`, Roboto и т.д.).

---

## Источники стилей

| Файл | Назначение |
|------|------------|
| `ui/brand_colors.py` | Константы палитры и CSS-переменные `BRAND_CSS_VARS` |
| `ui/styles.py` | Основное приложение (Streamlit): поиск, карточки, KG, детали задания |
| `ui/task_document.css` | Рендер содержимого заданий (варианты ответа, таблицы, галереи) |
| `ui/content_renderer.py` | Подключение CSS заданий к iframe/panel |
| `knowledge-graph/src/components/KnowledgeBrowser/knowledge-browser.css` | React-приложение «Браузер знаний» |
| `ui/kg_map.py`, `ui/analytics.py` | Цвета графов и диаграмм (Plotly, Altair) |

---

## Цветовая палитра

### Основной акцент — Blue

| Название | HEX | CSS-переменная | Применение |
|----------|-----|----------------|------------|
| Blue | `#503AE0` | `--brand-blue`, `--accent` | Кнопки, ссылки, активные фильтры, заголовки секций |
| Blue 60% | `#9689ED` | `--brand-blue-60`, `--accent-mid` | Градиенты, вторичный акцент |
| Blue 30% | `#CBC4F6` | `--brand-blue-30`, `--accent-soft`, `--border-accent` | Рамки, фоны бейджей, hover |

Hover акцента: `#4532C8` (`--accent-hover`).

### Дополнительные акценты

| Группа | Основной | 60% | 40% | Смысл |
|--------|----------|-----|-----|-------|
| **Mandarin** | `#FFAA57` | `#FFC286` | `#FFD6AE` | Тёплые акценты, cross-subject бейджи |
| **Aqua** | `#51D4AD` | `#AAEEDA` | `#C6F3E6` | Успех, правильные ответы, relevance |
| **Sky** | `#5EB2FF` | `#9CD0FF` | `#BDDFFF` | Информация, EOR-бейджи |

### Нейтрали

| Название | HEX | Переменная | Применение |
|----------|-----|------------|------------|
| White | `#FFFFFF` | `--brand-white`, `--surface` | Карточки, header |
| Gray BG | `#DCE5EE` | `--brand-gray-bg` | Вторичные кнопки, muted-бейджи, шапки таблиц |
| Gray Text | `#57626E` | `--brand-gray-text`, `--text` | Основной текст |
| Text Muted | `#7A8490` | `--text-muted` | Подписи, метаданные |
| Border | `#C8D4E0` | `--border` | Рамки карточек и полей |
| Surface Soft | `#F4F7FA` | `--surface-soft` | Фон страницы |
| Surface Accent | `#F5F3FD` | `--surface-accent` | Hover карточек, блоки KG |

### Специфичные для Knowledge Browser

| Элемент | Цвет |
|---------|------|
| Основной текст | `#1E2A36` |
| Рамки | `#D8E0EA` |
| Фон групп дерева | `#F4F1FF`, рамка `#E8E2FF` |
| Выбранный узел | `#EBE7FF` + inset-полоска `#503AE0` |
| Hover карточки | `#F8F6FF` |
| Ссылки (relations) | `#1F4FD6` → hover `#503AE0` |

### Семантические бейджи

| Тип | Фон | Текст |
|-----|-----|-------|
| Subject (default) | `#CBC4F6` | `#503AE0` |
| Muted | `#DCE5EE` | `#57626E` |
| EOR | `#BDDFFF` / `#E8F4FF` | `#503AE0` / `#1A6FB5` |
| Relevance | `#C6F3E6` | `#2F9B7D` |
| Cross-subject | `#FFF4E8` | `#B56B00` |

### Градиенты

```css
--gradient-brand: linear-gradient(135deg, #503AE0 0%, #51D4AD 100%);
--gradient-soft: linear-gradient(180deg, #ffffff 0%, #DCE5EE 55%, #CBC4F6 100%);
```

Кнопки и блоки KG: `linear-gradient(145deg, #503AE0 → #9689ED)`.

### Тени

| Тип | Значение |
|-----|----------|
| Accent | `rgba(80, 58, 224, 0.12)` — `--shadow-accent` |
| Панели | `0 8px 24px var(--shadow-accent)` |
| Hover карточки | `0 6px 18px rgba(80, 58, 224, 0.12)` |
| Focus ring | `0 0 0 2px rgba(80, 58, 224, 0.15)` |
| Lightbox | `rgba(15, 23, 42, 0.72)` backdrop |

### Цвета разделов на карте знаний

Используются в Plotly-графе (`ui/kg_map.py`):

| Раздел | HEX |
|--------|-----|
| Арифметика / выражения | `#503AE0` |
| Дроби / неравенства | `#FFAA57` |
| Геометрия / тригонометрия | `#51D4AD` |
| Уравнения / системы | `#5EB2FF` |
| Функции / многочлены | `#4532C8` |
| Проценты / степени | `#E07A2F` |
| Статистика | `#2E9B78` |
| Последовательности | `#9689ED` |
| Прочее | `#57626E` |

---

## Типографика

### Streamlit-приложение

- **Семейство:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Hero-заголовок:** 2rem / 700
- **Подзаголовок:** 0.95rem, muted
- **Заголовки секций:** 1.02–1.45rem / 700
- **Мета-лейблы (task detail):** 0.82rem / 700, uppercase, accent

### Knowledge Browser (React)

- **Семейство:** `Inter, system-ui, -apple-system, sans-serif`
- **Заголовок:** 1.2rem
- **Карточка задания:** 1.05rem / 700
- **Бейджи / meta:** 0.75–0.78rem / 600
- **Line-height:** 1.35–1.5 (body), 1.45 (app root)

### Содержимое заданий

- **Семейство:** system stack (`Segoe UI`, Roboto…)
- **Базовый размер:** 16px, line-height 1.5
- **Таблицы:** 13px
- **Page labels:** 11px uppercase

---

## Отступы и скругления

### Отступы

| Контекст | Значение |
|----------|----------|
| Контейнер страницы | padding 1.25rem, max-width `min(1800px, calc(100vw - 2.5rem))` |
| Карточки результатов | 18px 52px 18px 20px |
| KG sidebar | 380px (desktop) |
| Task detail | `--task-pad: 24px`, `--task-gap: 20px` |
| Сетки | gap 12–20px |

### Border radius

| px | Использование |
|----|---------------|
| 4 | Toggle дерева |
| 6–8 | Кнопки, inputs, selects |
| 10 | Вторичные кнопки, tooltips |
| 12 | Choice items, thumbs, primary buttons |
| 16 | Module blocks, stat pills |
| 18–20 | Search shell, filters, result cards |
| 999 | Бейджи, grade pills |

### Переходы

`0.12–0.15s ease` для border, background, box-shadow.

---

## Компоненты

### Карточка результата (`.result-card`, `.kb-result-card`)

- Белый фон, рамка `#C8D4E0`, radius 18px
- Hover: accent border, фон `#F5F3FD` / `#F8F6FF`, accent shadow
- Кнопка «Открыть»: 36×36px, фон `#DCE5EE`, текст accent

### Кнопки

| Тип | Стиль |
|-----|-------|
| Primary | `#503AE0` bg, white text, radius 12px; hover `#4532C8` |
| Secondary | white bg, `#C8D4E0` border, radius 10px, height 44px; hover `#F5F3FD` |
| Grade filter (active) | pill, filled `#503AE0` |
| Text link | accent, underline on hover |

### Дерево знаний (Knowledge Browser)

- Заголовок секции: `#503AE0` на полосе `#F4F1FF`
- Выбранный узел: `#EBE7FF` + left inset 3px `#503AE0`
- Приглушённые узлы: `opacity: 0.45`

### Интерактив заданий (`task_document.css`)

- **Варианты ответа:** white card, radius 12px; верная отметка — aqua `#51D4AD`
- **Ключ ответов:** фон `rgba(203, 196, 246, 0.3)`, рамка `#CBC4F6`
- **Пропуски (gap):** dashed blank → заполненный accent `#503AE0`
- **Изображения:** radius 12px, рамка `#C8D4E0`

### Аналитика

- Столбцы/кольца: палитра `ACCENT_PALETTE` из `brand_colors.py`
- Heatmap: `#CBC4F6` → `#9689ED` → `#503AE0`

---

## Макеты

### Streamlit-приложение

```
┌─ hero + search shell (gradient-soft) ─────────────┐
│ filters-card (white, accent border)               │
│ result cards grid                                 │
│ tabs: analytics | knowledge graph | task detail   │
└───────────────────────────────────────────────────┘
```

Фон страницы: `#F4F7FA`. Streamlit chrome (menu, footer, header) скрыт.

### Knowledge Browser (кратко)

```
┌─ kb-header (white) ──────────────────────────────┐
│ subject │ actions                               │
├─ kb-layout ──────────────────────────────────────┤
│ kb-sidebar 380px │ kb-main (#F4F7FA)            │
│ search + tree    │ task panel + cards            │
└──────────────────────────────────────────────────┘
```

На экранах ≤900px sidebar — выезжающий drawer с тенью `0 8px 24px rgba(0,0,0,0.12)`.

---

## Структура страницы «Граф знаний»

Страница — React-приложение **Knowledge Browser**, встроенное во вкладку Streamlit «Граф знаний» через iframe (`ui/knowledge_graph_embed.py` → `static/knowledge_graph/index.html`).

### Встраивание в Streamlit

```
app.py
└── вкладка «Граф знаний» (ui/knowledge_graph_tab.py)
    └── iframe 860px (ui/knowledge_graph_embed.py)
        └── KnowledgeBrowser (knowledge-graph/src/App.tsx)
```

- URL iframe: `#subject/{subjectId}` или `#subject/{subjectId}/node/{nodeId}`
- Смена предмета синхронизируется с query param `?kg_subject=` родительской страницы
- Источник данных заданий: `knowledge-graph/public/data/knowledge_browser.json` (экспорт из БД)

### Дерево компонентов

```
kb-app
├── kb-header
│   ├── kb-header__title-block
│   │   ├── kb-header__subject          — select «Предмет»
│   │   └── kb-header__title            — заголовок + выбранная тема
│   └── kb-header__actions
│       ├── «Свернуть всё»
│       └── «Темы» (mobile drawer)
│
└── kb-layout
    ├── kb-sidebar
    │   ├── KnowledgeSearch (kb-search)
    │   └── KnowledgeTree (kb-tree)
    │
    └── kb-main
        └── TaskPanel (kb-task-panel)
            ├── TaskPanelToolbar
            └── TaskPanelBody
                ├── KnowledgeRelations   — только для L3
                └── TaskList → TaskCard
```

Файлы: `knowledge-graph/src/components/KnowledgeBrowser/*.tsx`, стили — `knowledge-browser.css`.

### Макет страницы (desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER  kb-header                                    background: #FFFFFF │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ [Предмет ▼]  Математика 5–9 · Квадратное уравнение                   │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                              [Свернуть всё]                              │
├───────────────────────┬──────────────────────────────────────────────────┤
│ SIDEBAR  380px        │ MAIN  kb-main                    bg: #F4F7FA       │
│ bg: #FFFFFF           │                                                  │
│                       │ ┌─ kb-task-panel__toolbar ─────────────────────┐ │
│ ┌─ kb-search ───────┐ │ │ Задания по теме 158  [Уровень ▼] [Тип ▼]    │ │
│ │ 🔍 Найти тему…    │ │ └──────────────────────────────────────────────┘ │
│ └───────────────────┘ │                                                  │
│                       │ ┌─ kb-relations (L3) ──────────────────────────┐ │
│ ┌─ kb-tree ─────────┐ │ │ Связи темы                                   │ │
│ │ ▼ Математика/     │ │ │ Нужно знать раньше: …                        │ │
│ │   Алгебра    3290 │ │ │ Что изучать дальше: …                        │ │
│ │   ▼ Числа    227  │ │ └──────────────────────────────────────────────┘ │
│ │     ▼ Натуральные │ │                                                  │
│ │       • Сравнение │ │ ┌─ kb-task-list ───────────────────────────────┐ │
│ │ ▼ Геометрия  842  │ │ │ [kb-result-card] [kb-result-card] …          │ │
│ │ ▼ ВиС        1147 │ │ └──────────────────────────────────────────────┘ │
│ └───────────────────┘ │                                                  │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Header (`kb-header`)

| Элемент | Класс | Назначение |
|---------|-------|------------|
| Выбор предмета | `kb-header__subject-select` | Математика, Русский язык, Литература, Обществознание, Химия |
| Заголовок | `kb-header__title` | `{headerTitle}` + ` · ` + название выбранного узла |
| Свернуть всё | `kb-header__action` | Сбрасывает раскрытие веток дерева |
| Темы | `kb-header__drawer-btn` | Открывает sidebar на mobile (≤900px) |

Заголовок предмета задаётся в `knowledgeGraphCatalog.ts` (`headerTitle`: «Математика 5–9», «Русский язык 5–9» и т.д.).

### Sidebar: поиск (`KnowledgeSearch`)

| Элемент | Класс | Поведение |
|---------|-------|-----------|
| Поле поиска | `kb-search__input` | Placeholder: «Найти тему или знание» |
| Результаты | `kb-search__results` | До 12 совпадений по title узлов |
| Путь | `kb-search__result-path` | Цепочка предков: `Раздел → … → тема` |
| Пусто | `kb-search__empty` | «Ничего не найдено» |

Выбор результата раскрывает путь в дереве и выделяет узел.

### Sidebar: дерево знаний (`KnowledgeTree`)

Дерево строится из JSON-графа (`nodes` level 1–3, `prerequisiteEdges`). Уровни:

| Level | Пример | В дереве |
|-------|--------|----------|
| L1 | `numbers`, `geometry`, `probability` | Корень секции (или скрыт при `flattenL1`) |
| L2 | `fractions`, `triangles` | Промежуточная ветка |
| L3 | `quadratic_concept`, `pythagorean` | Конечное знание, привязка заданий |

#### Секции (математика)

Для предмета «Математика» дерево разбито на три curriculum-секции (`knowledgeSelectors.ts`):

| ID секции | Label | Корни L1 | Классы |
|-----------|-------|----------|--------|
| `math_algebra` | Математика/Алгебра | numbers, expressions, equations, functions | 5–9 |
| `geometry` | Геометрия | geometry (показ L2 без L1) | 5–9 |
| `vis_7_9` | Вероятность и статистика | probability (показ L2 без L1) | 7–9 |

У секции в заголовке — счётчик заданий (`kb-tree-group__count`), у узла — `kb-tree-node__count`.

#### Элемент узла дерева

```
kb-tree-node__row
├── kb-tree-node__toggle     — «+» / «−» (раскрытие ветки)
├── kb-tree-node__label      — название темы (selected: kb-tree-node__label--selected)
└── kb-tree-node__count      — число заданий на узле и потомках
```

- Выбранный узел: фон `#EBE7FF`, inset-полоска `#503AE0` слева
- Нерелевантные ветки при выборе: `kb-tree-node--dimmed` (opacity 0.45)
- Отступ вложенности: `depth × 16 + 8` px

#### Другие предметы

Русский язык, Литература, Обществознание, Химия — одна плоская секция `main` с корнями `index.level1Ids`. Задания привязаны только у **Математики** и **Русского языка** (`hasTaskBindings: true`).

### Main: панель заданий (`TaskPanel`)

#### Состояния

| Состояние | Класс / UI | Когда |
|-----------|------------|-------|
| Пусто | `kb-task-panel--empty` | Узел не выбран |
| Без привязок | текст в `TaskPanelBody` | Предмет без заданий (Литература и др.) |
| Загрузка | `kb-task-list--loading` + skeleton | Данные ещё не загружены |
| Нет заданий | `kb-task-panel__state` | Узел без primary/secondary |
| Список | `kb-task-list` | Есть задания |

#### Toolbar (`kb-task-panel__toolbar`)

- **Заголовок:** «Задания по теме» + счётчик
- **Фильтр «Уровень»** — `goalLevel` задания
- **Фильтр «Тип»** — `taskKind`
- Фильтры сбрасываются при смене узла

Если у L3 нет direct-заданий, автоматически подключаются secondary (`includeSecondary`).

#### Связи темы (`KnowledgeRelations`, только L3)

Блок `kb-relations` над списком заданий:

- **Нужно знать раньше** — prerequisites из графа
- **Что изучать дальше** — next knowledge
- Ссылки: `kb-relations__link` → навигация по дереву

#### Карточка задания (`TaskCard` / `kb-result-card`)

```
kb-result-card-shell (клик → открыть задание в родительском Streamlit)
└── kb-result-card
    ├── kb-result-card__open          — иконка ↗
    ├── kb-result-card__badges        — subject, класс, тип, EOR, «Дополнительное знание»
    ├── kb-result-card__title         — название задания
    └── kb-result-card__subtitle      — ссылка на модуль (SberClass) · «Задание на платформе»
```

Варианты бейджей: `--subject`, `--muted`, `--eor` (см. раздел «Семантические бейджи»).

### Mobile (≤900px)

1. Sidebar скрыт по умолчанию
2. Кнопка **«Темы»** открывает `kb-sidebar--open` как drawer поверх main
3. Выбор узла закрывает drawer
4. Task list — одна колонка

### Навигация и URL

| Механизм | Формат |
|----------|--------|
| Hash маршрут | `#subject/math/node/quadratic_concept` |
| Bootstrap | `window.__KG_BOOTSTRAP__` |
| PostMessage | `{ type: "kg-subject-change", subjectId }` → Streamlit query params |

---

## Страница задания (Task detail)

- Двухколоночный layout: контент слева, actions 220px справа
- Header + content cards, radius 16px, разделитель 1px border-top

---

## CSS-переменные (quick reference)

```css
:root {
  /* Brand */
  --brand-blue: #503AE0;
  --brand-blue-60: #9689ED;
  --brand-blue-30: #CBC4F6;
  --brand-mandarin: #FFAA57;
  --brand-aqua: #51D4AD;
  --brand-sky: #5EB2FF;
  --brand-gray-bg: #DCE5EE;
  --brand-gray-text: #57626E;

  /* Semantic */
  --text: #57626E;
  --text-muted: #7A8490;
  --accent: #503AE0;
  --accent-hover: #4532C8;
  --border: #C8D4E0;
  --surface: #FFFFFF;
  --surface-soft: #F4F7FA;
  --surface-accent: #F5F3FD;
  --shadow-accent: rgba(80, 58, 224, 0.12);
}
```

---

## Рекомендации при доработке UI

1. **Новые цвета** — добавлять в `ui/brand_colors.py`, не хардкодить в компонентах.
2. **React KG** — по возможности выносить повторяющиеся значения в CSS-переменные (сейчас часть hex захардкожена в `knowledge-browser.css`).
3. **Конtrast** — основной текст `#57626E` на `#F4F7FA` и `#FFFFFF`; акцентные кнопки — white on `#503AE0`.
4. **Единый паттерн** — карточка + pill-badge + мягкая accent-тень повторяется во всех частях сервиса.
