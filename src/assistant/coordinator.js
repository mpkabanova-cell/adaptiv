import {
  buildCoordinatorContext,
  buildCoordinatorMessages,
} from "./prompts.js";

const QUICK_PROMPTS = {
  solve: "Помоги мне решить текущую задачу. Начни с одного наводящего вопроса.",
  explain: "Объясни тему простыми словами и задай один вопрос для проверки понимания.",
  start: "С чего начать изучение этой темы? Дай один конкретный первый шаг.",
  check: "Проверь мою идею: я думаю, что нужно сначала понять, что дано в задаче. Это верно?",
};

function extractTheoryHint(theory) {
  const lines = String(theory || "")
    .replace(/<[^>]+>/g, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => line.length > 40 && !line.startsWith("#")) || lines[0] || "";
}

function pickQuestion(skillTitle, taskText, theory) {
  if (taskText) {
    return "Что в условии задачи является исходным числом, а что нужно найти?";
  }
  if (/процент/i.test(skillTitle + theory)) {
    return "Как ты понимаешь, что такое процент от числа в этой теме?";
  }
  if (/част/i.test(skillTitle + theory)) {
    return "Что означает «найти часть от числа» — какое действие здесь главное?";
  }
  return "Какое правило из теории поможет начать решение?";
}

function mockCoordinatorReply({ skill, taskText, userMessage, history }) {
  const theoryHint = extractTheoryHint(skill.theory);
  const lower = userMessage.toLowerCase();

  if (/объясни|тем/i.test(lower)) {
    return {
      message: theoryHint
        ? `В этой теме важно: ${theoryHint.slice(0, 220)}${theoryHint.length > 220 ? "…" : ""}\n\nЧто из этого тебе уже знакомо?`
        : `Давай разберём тему «${skill.title}» по шагам. С чего бы ты начал(а) — с условия или с правила?`,
      progress_status: "ознакомился с теорией темы",
      solved: false,
    };
  }

  if (/помог|реши|задач/i.test(lower) && taskText) {
    return {
      message: `В задаче нужно внимательно выделить данные и то, что ищем.\n\n${pickQuestion(skill.title, taskText, skill.theory)}`,
      progress_status: "начал разбор задачи",
      solved: false,
    };
  }

  if (/с чего нач/i.test(lower)) {
    return {
      message: `Начни с теории навыка «${skill.title}»: прочитай правило и попробуй применить его к простому примеру.\n\nКакое определение или формула кажется тебе ключевой?`,
      progress_status: "определил первый шаг",
      solved: false,
    };
  }

  if (/провер|иде/i.test(lower)) {
    return {
      message: "Хорошая мысль начать с того, что дано в задаче. 👍\n\nМожешь своими словами назвать, какие числа или величины уже известны?",
      progress_status: "проверил идею ученика",
      solved: false,
    };
  }

  if (history.filter((item) => item.role === "user").length <= 1) {
    return {
      message: taskText
        ? `Давай разберём задачу вместе. ${pickQuestion(skill.title, taskText, skill.theory)}`
        : `Я знаю теорию по теме «${skill.title}» и помогу разобраться. ${pickQuestion(skill.title, "", skill.theory)}`,
      progress_status: "начал диалог",
      solved: false,
    };
  }

  return {
    message: `Понял тебя. ${pickQuestion(skill.title, taskText, skill.theory)}`,
    progress_status: "продолжил диалог",
    solved: false,
  };
}

function parseAssistantPayload(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.message) return parsed;
    }
  } catch {
    /* fall through */
  }
  return { message: trimmed, progress_status: "", solved: false };
}

async function callAssistantApi(messages) {
  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return parseAssistantPayload(data.content || data.message || "");
  } catch {
    return null;
  }
}

export async function askCoordinator({
  skill,
  taskText = "",
  solverSolution = "",
  userMessage,
  history = [],
  progressStatus = "нет",
}) {
  const context = buildCoordinatorContext({
    skillTitle: skill.title,
    skillTheory: skill.theory,
    skillDescription: skill.description,
    problemText: taskText,
    progressStatus,
    solverSolution,
  });

  const messages = buildCoordinatorMessages(context, [
    ...history,
    { role: "user", content: userMessage },
  ]);

  const apiReply = await callAssistantApi(messages);
  if (apiReply) return apiReply;

  return mockCoordinatorReply({
    skill,
    taskText,
    userMessage,
    history,
  });
}

export { QUICK_PROMPTS };
