import mathData from "./learning-data-math.json";
import fingramData from "./learning-data-fingram.json";

export const courses = {
  math: {
    id: "math",
    title: "Математика",
    subtitle: "Части, проценты и пропорции",
    brandLabel: "математика",
    description:
      "Практические задачи на части, проценты и пропорции: теория, задания и карта навыков.",
    cardAccent: "math",
    data: mathData,
  },
  fingram: {
    id: "fingram",
    title: "Финансовая грамотность",
    subtitle: "Банковские вклады",
    brandLabel: "финграм",
    description:
      "Выбор и управление банковским вкладом: теория, задания и карта навыков.",
    cardAccent: "fingram",
    data: fingramData,
  },
};

export const courseList = [courses.math, courses.fingram];
