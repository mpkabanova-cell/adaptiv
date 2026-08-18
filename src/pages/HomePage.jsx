import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Wallet,
} from "lucide-react";
import { courseList } from "../data/courses.js";

const CARD_ICONS = {
  math: BookOpen,
  fingram: Wallet,
};

export default function HomePage({ onSelect }) {
  return (
    <div className="home-shell">
      <header className="home-topbar">
        <div className="brand">
          <span className="brand__mark">
            <Sparkles size={19} />
          </span>
          <span>
            <b>Адаптив</b>
            <small>ИИ-тьютор</small>
          </span>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <p className="home-hero__eyebrow">Адаптивное обучение</p>
          <h1>Выберите курс</h1>
          <p className="home-hero__lead">
            Теория, практика, карта знаний и ИИ-помощник — в одном прототипе.
          </p>
        </section>

        <section className="home-grid" aria-label="Курсы">
          {courseList.map((course) => {
            const Icon = CARD_ICONS[course.id] || BookOpen;
            return (
              <button
                key={course.id}
                type="button"
                className={`home-card home-card--${course.cardAccent}`}
                onClick={() => onSelect(course.id)}
              >
                <span className="home-card__icon" aria-hidden="true">
                  <Icon size={28} />
                </span>
                <span className="home-card__body">
                  <strong>{course.title}</strong>
                  <span>{course.subtitle}</span>
                  <p>{course.description}</p>
                </span>
                <span className="home-card__action">
                  Открыть
                  <ArrowRight size={18} />
                </span>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
}
