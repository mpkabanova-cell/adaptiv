import { useState } from "react";
import { courses } from "./data/courses.js";
import HomePage from "./pages/HomePage.jsx";
import CourseApp from "./CourseApp.jsx";

export default function App() {
  const [activeCourseId, setActiveCourseId] = useState(null);

  if (!activeCourseId) {
    return <HomePage onSelect={setActiveCourseId} />;
  }

  const course = courses[activeCourseId];
  if (!course) {
    return <HomePage onSelect={setActiveCourseId} />;
  }

  return (
    <CourseApp
      key={course.id}
      course={course}
      onHome={() => setActiveCourseId(null)}
    />
  );
}
