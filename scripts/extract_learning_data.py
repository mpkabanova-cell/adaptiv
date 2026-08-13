"""Convert the source workbook into browser-friendly prototype data."""

from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from pathlib import Path

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "ФИНАЛ для прототипа ии_тьютора.xlsx"
OUTPUT = ROOT / "src" / "data" / "learning-data.json"


def normalized(value: object) -> str:
    text = str(value or "").translate(
        {
            ord("\u200b"): None,
            ord("\u200c"): None,
            ord("\u200d"): None,
            ord("\ufeff"): None,
        }
    )
    return " ".join(text.split())


def clean_content(value: object) -> str:
    return str(value or "").translate(
        {
            ord("\u200b"): None,
            ord("\u200c"): None,
            ord("\u200d"): None,
            ord("\ufeff"): None,
        }
    ).strip()


def rows(workbook, sheet: str):
    worksheet = workbook[sheet]
    for row in worksheet.iter_rows(min_row=2, values_only=True):
        if any(value is not None for value in row):
            yield row


def main() -> None:
    workbook = load_workbook(SOURCE, read_only=True, data_only=True)

    skill_names = [normalized(row[0]) for row in rows(workbook, "Список навыков")]
    skill_names = [name for name in skill_names if name]
    descriptions = {
        normalized(row[0]): normalized(row[1])
        for row in rows(workbook, "Навык+описание")
        if row[0]
    }
    theories = {
        normalized(row[0]): clean_content(row[1])
        for row in rows(workbook, "Теория-Навык")
        if row[0] and row[1]
    }

    prerequisites: dict[str, list[str]] = defaultdict(list)
    next_skills: dict[str, list[str]] = defaultdict(list)
    for row in rows(workbook, "Пререквизитные отношения"):
        skill, prerequisite = normalized(row[0]), normalized(row[1])
        if skill and prerequisite:
            prerequisites[skill].append(prerequisite)
            next_skills[prerequisite].append(skill)

    open_answers = {
        normalized(row[0]): normalized(row[1])
        for row in rows(workbook, "Ответы открытые задания")
        if row[0] and row[1]
    }
    test_answers: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows(workbook, "Ответы тест"):
        task, option, marker = normalized(row[0]), normalized(row[1]), row[2]
        if task and option:
            is_correct = str(marker or "").strip().lower() in {
                "1",
                "true",
                "да",
                "верно",
                "+",
            }
            test_answers[task].append({"text": option, "correct": is_correct})

    task_skills: dict[str, list[str]] = defaultdict(list)
    for row in rows(workbook, "Задача - Навык"):
        task, skill = normalized(row[0]), normalized(row[1])
        if task and skill and skill not in task_skills[task]:
            task_skills[task].append(skill)

    all_names = list(
        dict.fromkeys(
            skill_names
            + list(descriptions)
            + list(theories)
            + list(prerequisites)
            + [name for values in prerequisites.values() for name in values]
            + [name for values in task_skills.values() for name in values]
        )
    )
    ids = {name: f"s{index:04d}" for index, name in enumerate(all_names, 1)}

    tasks_by_skill: dict[str, list[dict[str, object]]] = defaultdict(list)
    for index, (text, skills) in enumerate(task_skills.items(), 1):
        task = {
            "id": f"t{index:04d}",
            "text": text,
            "answer": open_answers.get(text, ""),
            "options": test_answers.get(text, []),
        }
        for skill in skills:
            tasks_by_skill[skill].append(task)

    skills = []
    for name in all_names:
        theory = theories.get(name, "")
        tasks = tasks_by_skill.get(name, [])
        skills.append(
            {
                "id": ids[name],
                "title": name,
                "description": descriptions.get(name, ""),
                "theory": theory,
                "prerequisites": [
                    ids[item] for item in dict.fromkeys(prerequisites.get(name, []))
                    if item in ids
                ],
                "next": [
                    ids[item] for item in dict.fromkeys(next_skills.get(name, []))
                    if item in ids
                ],
                "tasks": tasks,
                "search": normalized(f"{name} {descriptions.get(name, '')}").lower(),
            }
        )

    featured = next(
        (
            ids[name]
            for name in all_names
            if theories.get(name) and len(tasks_by_skill.get(name, [])) >= 3
        ),
        skills[0]["id"],
    )
    payload = {
        "meta": {
            "source": SOURCE.name,
            "skills": len(skills),
            "theories": sum(bool(skill["theory"]) for skill in skills),
            "tasks": len(task_skills),
            "relations": sum(len(skill["prerequisites"]) for skill in skills),
            "fingerprint": hashlib.sha1(SOURCE.read_bytes()).hexdigest()[:10],
        },
        "featuredSkillId": featured,
        "skills": skills,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT.relative_to(ROOT)}: "
        f"{len(skills)} skills, {len(task_skills)} tasks"
    )


if __name__ == "__main__":
    main()
