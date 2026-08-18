import mathData from "./learning-data-math.json";
import fingramData from "./learning-data-fingram.json";

export const courses = {
  math: {
    id: "math",
    title: "Математика",
    subtitle: "Части, проценты и пропорции",
    brandLabel: "математика",
    description:
      "Практика с частями, процентами и пропорциями: теория, задания и карта навыков.",
    cardAccent: "math",
    data: mathData,
  },
  fingram: {
    id: "fingram",
    title: "Финграм",
    subtitle: "Финансовая грамотность",
    brandLabel: "финграм",
    description:
      "Банковские вклады, кредиты и личные финансы: теория, задания и карта навыков.",
    cardAccent: "fingram",
    data: fingramData,
  },
};

export const courseList = [courses.math, courses.fingram];
