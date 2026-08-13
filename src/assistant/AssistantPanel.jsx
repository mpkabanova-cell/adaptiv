import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { ChevronsLeft, ChevronsRight, Send, Sparkles } from "lucide-react";
import { askCoordinator, QUICK_PROMPTS } from "./coordinator.js";

const WELCOME =
  "Привет! Я рядом и помогу разобраться. Задавай вопрос или выбери подсказку ниже.";

const CHIPS = [
  { id: "solve", label: "Помоги решить" },
  { id: "explain", label: "Объясни тему" },
  { id: "start", label: "С чего начать?" },
  { id: "check", label: "Проверь мою идею" },
];

export default function AssistantPanel({
  skill,
  taskText = "",
  solverSolution = "",
  collapsed = false,
  onToggleCollapse,
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState("нет");
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: WELCOME }]);
    setInput("");
    setProgressStatus("нет");
  }, [skill.id, taskText, solverSolution]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const history = useMemo(
    () =>
      messages
        .filter((item) => item.content !== WELCOME)
        .map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: item.content,
        })),
    [messages],
  );

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await askCoordinator({
        skill,
        taskText,
        solverSolution,
        userMessage: trimmed,
        history,
        progressStatus,
      });
      setProgressStatus(reply.progress_status || progressStatus);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Сейчас не получилось получить ответ. Попробуй переформулировать вопрос.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onChip = (id) => send(QUICK_PROMPTS[id]);

  return (
    <aside
      className={[
        "assistant-panel",
        "side-panel",
        collapsed ? "side-panel--collapsed" : "",
        collapsed ? "assistant-panel--collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="ИИ-помощник"
    >
      <div className="side-panel__rail">
        <button
          type="button"
          className="side-panel__expand"
          onClick={onToggleCollapse}
          aria-label="Развернуть ИИ-помощника"
        >
          <ChevronsLeft size={18} />
        </button>
        <span className="side-panel__rail-icon" aria-hidden="true">
          <Sparkles size={18} />
        </span>
      </div>

      <div className="side-panel__body assistant-panel__body">
        <header className="side-panel__header side-panel__header--collapse-start">
          <button
            type="button"
            className="side-panel__collapse"
            onClick={onToggleCollapse}
            aria-label="Свернуть ИИ-помощника"
          >
            <ChevronsRight size={18} />
          </button>
          <div className="side-panel__title">
            <span className="side-panel__title-icon side-panel__title-icon--accent">
              <Sparkles size={16} strokeWidth={2.2} />
            </span>
            <span className="side-panel__heading">ИИ-помощник</span>
          </div>
        </header>

        <div className="assistant-panel__messages" ref={scrollRef}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={[
                "assistant-bubble",
                message.role === "assistant"
                  ? "assistant-bubble--bot"
                  : "assistant-bubble--user",
              ].join(" ")}
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div className="assistant-bubble assistant-bubble--bot assistant-bubble--typing">
              Печатает…
            </div>
          )}
          {messages.length <= 1 && !loading && (
            <div className="assistant-panel__chips">
              {CHIPS.map((chip) => (
                <button key={chip.id} type="button" onClick={() => onChip(chip.id)}>
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          className="assistant-panel__composer"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Напиши, с чем тебе помочь"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Отправить">
            <Send size={16} strokeWidth={2.2} />
          </button>
        </form>

        <p className="assistant-panel__disclaimer">
          ИИ-помощник может допускать ошибки
        </p>
      </div>
    </aside>
  );
}
