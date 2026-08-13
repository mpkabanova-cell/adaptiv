import { useEffect, useMemo, useRef, useState, Children } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  GraduationCap,
  Menu,
  Network,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import learningData from "./data/learning-data.json";
import AssistantPanel from "./assistant/AssistantPanel.jsx";
import KnowledgeMap from "./knowledge-map/KnowledgeMap.jsx";

function mdastToString(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(mdastToString).join("");
  if (node.type === "text" || node.type === "inlineCode") return node.value || "";
  return mdastToString(node.children || []);
}

function isRuleParagraph(node) {
  if (!node || node.type !== "paragraph") return false;
  const first = node.children?.[0];
  if (first?.type === "strong") {
    return /^правило\b/i.test(mdastToString(first));
  }
  return /^правило\b/i.test(mdastToString(node).trim());
}

function isRuleContinuation(node) {
  if (!node) return false;
  return node.type === "list" || node.type === "math" || node.type === "code";
}

/** Wrap **Правило …** (+ list/formula) into the same callout style as «Обрати внимание». */
function remarkRuleBlocks() {
  return (tree) => {
    const children = tree.children || [];
    const next = [];

    for (let i = 0; i < children.length; i += 1) {
      const node = children[i];

      if (node.type === "thematicBreak") {
        continue;
      }

      if (isRuleParagraph(node)) {
        const group = [node];
        while (i + 1 < children.length) {
          const candidate = children[i + 1];
          if (candidate.type === "thematicBreak") {
            i += 1;
            continue;
          }
          if (!isRuleContinuation(candidate)) break;
          i += 1;
          group.push(candidate);
        }

        next.push({
          type: "theoryBlock",
          data: {
            hName: "div",
            hProperties: { className: ["theory-rule-root"] },
          },
          children: group,
        });
        continue;
      }

      next.push(node);
    }

    tree.children = next;
  };
}

function RuleCallout({ children }) {
  const items = Children.toArray(children);
  const [first, ...rest] = items;

  return (
    <details className="theory-callout theory-callout--rule" open>
      <summary className="theory-callout__summary">
        <span className="theory-callout__icon" aria-hidden="true">
          <Sparkles size={16} />
        </span>
        <span className="theory-callout__title">{first}</span>
      </summary>
      {rest.length > 0 ? (
        <div className="theory-callout__body">{rest}</div>
      ) : null}
    </details>
  );
}

const MARKDOWN_COMPONENTS = {
  details: ({ children, className, ...props }) => {
    const extra = Array.isArray(className)
      ? className.join(" ")
      : className || "";
    const isSolution = /\btheory-solution\b/.test(extra);
    const isNote = /\btheory-note\b/.test(extra);
    return (
      <details
        className={[
          "theory-callout",
          isSolution ? "theory-callout--solution" : "",
          isNote ? "theory-callout--note" : "",
          extra,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </details>
    );
  },
  summary: ({ children, ...props }) => (
    <summary className="theory-callout__summary" {...props}>
      <span className="theory-callout__icon" aria-hidden="true">
        <Sparkles size={16} />
      </span>
      <span className="theory-callout__title">{children}</span>
    </summary>
  ),
  div: ({ className, children, ...props }) => {
    const classes = Array.isArray(className)
      ? className.join(" ")
      : className || "";
    if (/\btheory-rule-root\b/.test(classes)) {
      return <RuleCallout>{children}</RuleCallout>;
    }
    return (
      <div className={classes || undefined} {...props}>
        {children}
      </div>
    );
  },
  h4: ({ children, ...props }) => {
    const text = String(
      Array.isArray(children)
        ? children.map((child) => (typeof child === "string" ? child : "")).join("")
        : children || "",
    ).trim();
    if (/^решение/i.test(text)) {
      return (
        <h4 className="theory-solution-heading" {...props}>
          {children}
        </h4>
      );
    }
    return <h4 {...props}>{children}</h4>;
  },
  hr: () => null,
  blockquote: ({ children }) => (
    <blockquote className="definition-block">
      <span className="definition-block__label">Определение</span>
      {children}
    </blockquote>
  ),
  p: ({ children, ...props }) => {
    // Inside rule summary the first paragraph should stay inline in the title.
    return <p {...props}>{children}</p>;
  },
};

/** Pull «Правило …» segments out of text; drop --- wrappers. */
function extractRules(text) {
  const rules = [];
  let cleaned = String(text || "");

  cleaned = cleaned.replace(
    /(?:^|\n)(?:---\s*\n+)*\*\*((?:Правило|правило)[^*]+?)\*\*([^\n]*)\n?([\s\S]*?)(?=(?:\n---\s*\n)|(?:\n---\s*$)|(?:\n#{1,3}\s)|(?:\n<details[\s>])|(?:\n<\/details>)|$)/g,
    (_, title, lead, body) => {
      const bodyClean = String(body || "")
        .replace(/^\s*---\s*$/gm, "")
        .trim();
      rules.push({
        title: String(title).trim(),
        lead: String(lead || "").trim(),
        body: bodyClean,
      });
      return "\n";
    },
  );

  cleaned = cleaned
    .replace(/^\s*---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { cleaned, rules };
}

function rulesToMarkdown(rules) {
  return rules
    .map((rule) => {
      const head = `**${rule.title}**${rule.lead ? ` ${rule.lead}` : ""}`;
      return rule.body ? `${head}\n\n${rule.body}` : head;
    })
    .join("\n\n");
}

/** Convert remaining `--- **Правило** ---` into plain markdown in place. */
function unwrapStandaloneRules(markdown) {
  return String(markdown || "")
    .replace(
      /(?:^|\n)---\s*\n+\*\*((?:Правило|правило)[^*]+?)\*\*([^\n]*)\n?([\s\S]*?)\n---\s*(?=\n|$)/g,
      (_, title, lead, body) => {
        const bodyClean = String(body || "")
          .replace(/^\s*---\s*$/gm, "")
          .trim();
        const head = `**${String(title).trim()}**${
          String(lead || "").trim() ? ` ${String(lead).trim()}` : ""
        }`;
        return `\n\n${bodyClean ? `${head}\n\n${bodyClean}` : head}\n\n`;
      },
    )
    .replace(/^\s*---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizeTheoryMarkdown(markdown) {
  const withDetails = String(markdown || "").replace(
    /<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi,
    (_, rawSummary, body) => {
      const summaryHtml = String(rawSummary).trim();
      const plain = summaryHtml
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const { cleaned: bodyClean, rules } = extractRules(body);
      const rulesMd = rulesToMarkdown(rules);

      if (/^обрати внимание/i.test(plain)) {
        const rest = plain.replace(/^обрати внимание\s*,?\s*/i, "");
        const note = [
          '<details class="theory-note" open>',
          "<summary><b>Обрати внимание</b>" +
            (rest ? `, ${rest}` : "") +
            "</summary>",
          bodyClean,
          "</details>",
        ].join("\n");
        return rulesMd ? `${note}\n\n${rulesMd}` : note;
      }

      if (/^решение|^краткое решение/i.test(plain)) {
        const block = [
          '<details class="theory-solution">',
          `<summary>${summaryHtml}</summary>`,
          bodyClean,
          "</details>",
        ].join("\n");
        return rulesMd ? `${block}\n\n${rulesMd}` : block;
      }

      const block = [
        '<details class="theory-callout">',
        `<summary>${summaryHtml}</summary>`,
        bodyClean,
        "</details>",
      ].join("\n");
      return rulesMd ? `${block}\n\n${rulesMd}` : block;
    },
  );

  return unwrapStandaloneRules(withDetails).trim();
}

function shortTitle(title, length = 46) {
  return title.length > length ? `${title.slice(0, length).trim()}…` : title;
}

/** Forest: roots = skills without prerequisites; nested = dependents via next. */
function buildSkillForest(skills) {
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const children = new Map(
    skills.map((skill) => [
      skill.id,
      skill.next.filter((id) => byId.has(id)),
    ]),
  );

  const roots = skills
    .filter((skill) => !skill.prerequisites.length)
    .map((skill) => skill.id);

  /** First path from any root — used to auto-expand to the selected skill. */
  const ancestorMap = new Map();
  const walk = (id, ancestors, seen) => {
    if (seen.has(id)) return;
    seen.add(id);
    if (!ancestorMap.has(id)) ancestorMap.set(id, ancestors);
    for (const childId of children.get(id) || []) {
      walk(childId, [...ancestors, id], seen);
    }
  };
  for (const rootId of roots) walk(rootId, [], new Set());

  return { roots, children, byId, ancestorMap };
}

function collectDescendantIds(forest, id, result = new Set()) {
  for (const childId of forest.children.get(id) || []) {
    result.add(childId);
    collectDescendantIds(forest, childId, result);
  }
  return result;
}

function resolveExpandedForSkill(forest, id) {
  const ancestors = forest.ancestorMap.get(id) || [];
  const childIds = forest.children.get(id) || [];
  const isRoot = forest.roots.includes(id);

  if (isRoot && childIds.length > 0) {
    return new Set([id]);
  }

  if (childIds.length > 0) {
    return new Set([...ancestors, id]);
  }

  return new Set(ancestors);
}

function TreeNode({
  id,
  depth,
  path,
  forest,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}) {
  const skill = forest.byId.get(id);
  if (!skill) return null;

  const childIds = (forest.children.get(id) || []).filter(
    (childId) => !path.includes(childId),
  );
  const hasChildren = childIds.length > 0;
  const isOpen = expanded.has(id);
  const isSelected = selectedId === id;
  const isRoot = depth === 0;

  return (
    <div className={`kb-tree-node ${isSelected ? "kb-tree-node--selected" : ""}`}>
      <div
        className={[
          "kb-tree-node__row",
          isSelected ? "kb-tree-node__row--selected" : "",
          isRoot ? "kb-tree-node__row--root" : "",
        ].join(" ")}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            className="kb-tree-node__toggle"
            onClick={() => onToggle(id, depth)}
            aria-label={isOpen ? "Свернуть" : "Развернуть"}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="kb-tree-node__dot" aria-hidden="true" />
        )}
        <button
          className="kb-tree-node__label"
          onClick={() => onSelect(id)}
          title={skill.title}
        >
          <span>{skill.title}</span>
        </button>
      </div>
      {hasChildren && isOpen && (
        <div className="kb-tree-node__children">
          {childIds.map((childId) => (
            <TreeNode
              key={`${path.join(">")}>${childId}`}
              id={childId}
              depth={depth + 1}
              path={[...path, id]}
              forest={forest}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KnowledgeTree({ selectedId, skills, onSelect }) {
  const forest = useMemo(() => buildSkillForest(skills), [skills]);
  const [expanded, setExpanded] = useState(() => new Set());
  const skipAutoExpandRef = useRef(true);

  useEffect(() => {
    if (skipAutoExpandRef.current) {
      skipAutoExpandRef.current = false;
      return;
    }
    setExpanded(resolveExpandedForSkill(forest, selectedId));
  }, [selectedId, forest]);

  const toggle = (id, depth) => {
    setExpanded((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        for (const descendantId of collectDescendantIds(forest, id)) {
          next.delete(descendantId);
        }
        return next;
      }

      if (depth === 0) {
        return new Set([id]);
      }

      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleSelect = (id) => {
    setExpanded(resolveExpandedForSkill(forest, id));
    onSelect(id);
  };

  return (
    <section className="knowledge-tree" aria-label="Дерево знаний">
      <div className="section-label">
        <Network size={16} />
        Граф знаний
      </div>
      <div className="kb-tree">
        {forest.roots.map((rootId) => (
          <TreeNode
            key={rootId}
            id={rootId}
            depth={0}
            path={[]}
            forest={forest}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={toggle}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  );
}

function Sidebar({ open, onClose, collapsed, onToggleCollapse, selectedId, skills, onSelect }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return skills.filter((skill) => skill.search.includes(value)).slice(0, 8);
  }, [query, skills]);

  const select = (id) => {
    onSelect(id);
    setQuery("");
    if (window.innerWidth <= 980) onClose();
  };

  return (
    <>
      <button
        className={`sidebar-scrim ${open ? "sidebar-scrim--visible" : ""}`}
        onClick={onClose}
        aria-label="Закрыть темы"
      />
      <aside
        className={[
          "sidebar",
          "side-panel",
          open ? "sidebar--open" : "",
          collapsed ? "side-panel--collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="sidebar__mobile-head">
          <span>Навигация по знаниям</span>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="side-panel__rail">
          <button
            type="button"
            className="side-panel__expand"
            onClick={onToggleCollapse}
            aria-label="Развернуть граф знаний"
          >
            <ChevronsRight size={18} />
          </button>
          <span className="side-panel__rail-icon" aria-hidden="true">
            <Network size={18} />
          </span>
        </div>

        <div className="side-panel__body">
          <div className="side-panel__header">
            <div className="side-panel__title">
              <span className="side-panel__title-icon">
                <Network size={16} />
              </span>
              <span className="side-panel__heading">Граф знаний</span>
            </div>
            <button
              type="button"
              className="side-panel__collapse"
              onClick={onToggleCollapse}
              aria-label="Свернуть граф знаний"
            >
              <ChevronsLeft size={18} />
            </button>
          </div>
          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти тему или навык"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Очистить поиск">
                <X size={16} />
              </button>
            )}
          </label>
          <div className="sidebar__content">
            {query && (
              <div className="search-results">
                <span className="search-results__label">
                  Найдено: {filtered.length}
                </span>
                {filtered.map((item) => (
                  <button key={item.id} onClick={() => select(item.id)}>
                    <span>{shortTitle(item.title, 68)}</span>
                    <small>
                      {item.theory ? "Теория" : "Без теории"} · {item.tasks.length} заданий
                    </small>
                  </button>
                ))}
                {!filtered.length && <p>Ничего не найдено</p>}
              </div>
            )}
            {!query && (
              <KnowledgeTree
                selectedId={selectedId}
                skills={skills}
                onSelect={select}
              />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function Theory({ skill, onPractice }) {
  const theoryMarkdown = useMemo(
    () => normalizeTheoryMarkdown(skill.theory),
    [skill.theory],
  );

  if (!skill.theory) {
    return (
      <div className="empty-state">
        <BookOpen size={34} />
        <h2>Теория для этой темы готовится</h2>
        <p>Можно перейти к связанным навыкам на карте слева.</p>
      </div>
    );
  }

  return (
    <div className="lesson-layout">
      <article className="theory-document">
        <div className="theory-document__intro">
          <p>{skill.description || "Разберём правило, примеры и способ решения."}</p>
        </div>
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkRuleBlocks]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={MARKDOWN_COMPONENTS}
        >
          {theoryMarkdown}
        </ReactMarkdown>
        <div className="lesson-finish">
          <div>
            <span className="lesson-finish__icon">
              <GraduationCap size={22} />
            </span>
            <div>
              <b>Закрепим тему на практике?</b>
              <p>Начнём с базового задания и адаптируем сложность.</p>
            </div>
          </div>
          <button className="primary-button" onClick={onPractice}>
            Тренироваться
            <ArrowRight size={17} />
          </button>
        </div>
      </article>
    </div>
  );
}

function normalizeAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[${}\\\s]/g, "")
    .replace(",", ".")
    .replace(/(text|mathrm|:)/g, "");
}

function Practice({ skill, onTheory, onTaskChange }) {
  const tasks = skill.tasks.slice(0, 10);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [statuses, setStatuses] = useState({});
  const task = tasks[index];

  useEffect(() => {
    setIndex(0);
    setAnswer("");
    setResult(null);
    setStatuses({});
  }, [skill.id]);

  useEffect(() => {
    onTaskChange?.({
      text: task?.text || "",
      answer: task?.answer || "",
    });
  }, [task, onTaskChange]);

  if (!task) {
    return (
      <div className="empty-state">
        <GraduationCap size={34} />
        <h2>Для этой темы пока нет заданий</h2>
        <button className="secondary-button" onClick={onTheory}>
          Вернуться к теории
        </button>
      </div>
    );
  }

  const settleCurrent = (outcome) => {
    setStatuses((prev) => {
      if (prev[index] === "correct") return prev;
      return { ...prev, [index]: outcome };
    });
  };

  const check = () => {
    if (!answer.trim()) return;
    const expected = normalizeAnswer(task.answer);
    const ok = expected ? normalizeAnswer(answer) === expected : false;
    if (!expected) {
      setResult("shown");
      settleCurrent("incorrect");
      return;
    }
    setResult(ok);
    settleCurrent(ok ? "correct" : "incorrect");
  };

  const goTo = (nextIndex) => {
    const clamped = Math.min(Math.max(nextIndex, 0), tasks.length - 1);
    if (clamped === index) return;
    setStatuses((prev) => {
      if (prev[index] === "correct") return prev;
      let outcome = "skipped";
      if (result === true) outcome = "correct";
      else if (result === false || result === "shown") outcome = "incorrect";
      else if (prev[index] === "incorrect") outcome = "incorrect";
      return { ...prev, [index]: outcome };
    });
    setIndex(clamped);
    setAnswer("");
    setResult(null);
  };

  return (
    <div className="practice">
      <div className="practice__meta">
        <span>Задание {index + 1} из {tasks.length}</span>
      </div>
      <div className="practice__progress">
        {tasks.map((_, itemIndex) => {
          const status = statuses[itemIndex];
          return (
            <button
              key={itemIndex}
              className={[
                itemIndex === index ? "is-current" : "",
                status === "correct" ? "is-correct" : "",
                status === "incorrect" ? "is-incorrect" : "",
                status === "skipped" ? "is-skipped" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => goTo(itemIndex)}
              aria-label={`Задание ${itemIndex + 1}`}
            />
          );
        })}
      </div>
      <article className="task-card">
        <div className="task-card__prompt">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {task.text}
          </ReactMarkdown>
        </div>
        {task.options.length > 0 ? (
          <div className="answer-options">
            {task.options.map((option, optionIndex) => (
              <button
                key={`${option.text}-${optionIndex}`}
                className={answer === option.text ? "is-selected" : ""}
                onClick={() => {
                  setAnswer(option.text);
                  setResult(null);
                }}
              >
                <span>{String.fromCharCode(65 + optionIndex)}</span>
                {option.text}
              </button>
            ))}
          </div>
        ) : (
          <label className="answer-field">
            <span>Ваш ответ</span>
            <input
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                setResult(null);
              }}
              onKeyDown={(event) => event.key === "Enter" && check()}
              placeholder="Введите число или выражение"
            />
          </label>
        )}
        {result !== null && (
          <div
            className={`answer-feedback ${
              result === true ? "answer-feedback--correct" : "answer-feedback--wrong"
            }`}
          >
            {result === true ? (
              <>
                <Check size={19} />
                <span>
                  <b>Верно!</b> Можно переходить к следующему заданию.
                </span>
              </>
            ) : (
              <>
                <CircleHelp size={19} />
                <span>
                  <b>Почти получилось.</b> Не получилось, попробуй ещё раз.
                </span>
              </>
            )}
          </div>
        )}
        <div className="task-card__actions">
          <button className="secondary-button" onClick={onTheory}>
            <BookOpen size={17} />
            Открыть теорию
          </button>
          {result === null ? (
            <button
              className="primary-button"
              onClick={check}
              disabled={!answer.trim()}
            >
              Проверить
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={() => goTo(index + 1)}
              disabled={index === tasks.length - 1}
            >
              Следующее
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

export default function App() {
  const skills = learningData.skills;
  const skillMap = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill])),
    [skills],
  );
  const initialId = useMemo(() => {
    const root = skills.find((skill) => !skill.prerequisites.length);
    return root?.id || learningData.featuredSkillId;
  }, [skills]);
  const [selectedId, setSelectedId] = useState(initialId);
  const [mode, setMode] = useState("theory");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);
  const [practiceTask, setPracticeTask] = useState({ text: "", answer: "" });
  const skill = skillMap.get(selectedId);
  const assistantTaskText = mode === "practice" ? practiceTask.text : "";
  const assistantSolver = mode === "practice" ? practiceTask.answer : "";

  const selectSkill = (id, options = {}) => {
    setSelectedId(id);
    if (!options.keepMode) setMode("theory");
    setPracticeTask({ text: "", answer: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            <Sparkles size={19} />
          </span>
          <span>
            <b>Адаптив</b>
            <small>математика</small>
          </span>
        </div>
        <div className="mode-switch" role="tablist">
          <button
            className={mode === "theory" ? "is-active" : ""}
            onClick={() => setMode("theory")}
          >
            <BookOpen size={16} />
            <span>Теория</span>
          </button>
          <button
            className={mode === "practice" ? "is-active" : ""}
            onClick={() => setMode("practice")}
          >
            <GraduationCap size={17} />
            <span>Практика</span>
          </button>
          <button
            className={mode === "map" ? "is-active" : ""}
            onClick={() => {
              setSidebarOpen(false);
              setMode("map");
            }}
          >
            <Network size={16} />
            <span>Карта знаний</span>
          </button>
        </div>
        <div className="topbar__actions">
          {mode !== "map" && (
            <button
              className={["assistant-toggle", !assistantCollapsed ? "is-active" : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setAssistantCollapsed((value) => !value)}
              aria-label={assistantCollapsed ? "Развернуть ИИ-помощника" : "Свернуть ИИ-помощника"}
            >
              <Sparkles size={18} />
            </button>
          )}
          {mode !== "map" && (
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Открыть темы"
            >
              <Menu size={21} />
            </button>
          )}
        </div>
      </header>

      <div
        className={[
          "workspace",
          mode === "map" ? "workspace--map" : "workspace--with-assistant",
          mode !== "map" && sidebarCollapsed ? "workspace--sidebar-collapsed" : "",
          mode !== "map" && assistantCollapsed ? "workspace--assistant-collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {mode !== "map" && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
            selectedId={selectedId}
            skills={skills}
            onSelect={selectSkill}
          />
        )}
        <main className={["content", mode === "map" ? "content--map" : ""].filter(Boolean).join(" ")}>
          {mode !== "map" && (
            <>
              <nav className="breadcrumbs">
                <span>Математика</span>
                <ChevronDown size={14} />
                <span>Части, проценты и пропорции</span>
              </nav>
              <div className="lesson-header">
                <div className="lesson-header__title-row">
                  <h1>{skill.title}</h1>
                  <span className="lesson-number">
                    {skill.prerequisites.length ? "Связанный навык" : "Стартовая тема"}
                  </span>
                </div>
                <button
                  className="lesson-header__map"
                  onClick={() => {
                    setSidebarOpen(false);
                    setMode("map");
                  }}
                >
                  <Network size={17} />
                  Карта знаний
                </button>
              </div>
            </>
          )}

          {mode === "theory" ? (
            <Theory skill={skill} onPractice={() => setMode("practice")} />
          ) : mode === "practice" ? (
            <Practice
              skill={skill}
              onTheory={() => setMode("theory")}
              onTaskChange={setPracticeTask}
            />
          ) : (
            <KnowledgeMap
              skills={skills}
              selectedId={selectedId}
              onSelect={(id) => selectSkill(id, { keepMode: true })}
            />
          )}
        </main>
        {mode !== "map" && skill && (
          <AssistantPanel
            skill={skill}
            taskText={assistantTaskText}
            solverSolution={assistantSolver}
            collapsed={assistantCollapsed}
            onToggleCollapse={() => setAssistantCollapsed((value) => !value)}
          />
        )}
      </div>
    </div>
  );
}
