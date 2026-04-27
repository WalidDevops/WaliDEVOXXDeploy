/**
 * questions.js
 * 5 questions statiques utilisées dans les zones de quiz.
 * Chaque question possède : id, text, options (3 choix), correct (index), points.
 */
export const QUESTIONS = [
  {
    id: 0,
    text: "Quelle est la capitale de la France ?",
    options: ["Berlin", "Paris", "Madrid"],
    correct: 1,
    points: 100,
  },
  {
    id: 1,
    text: "Combien font 7 × 8 ?",
    options: ["54", "56", "64"],
    correct: 1,
    points: 100,
  },
  {
    id: 2,
    text: "Quel est le plus grand océan du monde ?",
    options: ["Atlantique", "Indien", "Pacifique"],
    correct: 2,
    points: 100,
  },
  {
    id: 3,
    text: "Qui a peint la Joconde ?",
    options: ["Michel-Ange", "Léonard de Vinci", "Raphaël"],
    correct: 1,
    points: 100,
  },
  {
    id: 4,
    text: "Combien y a-t-il de continents sur Terre ?",
    options: ["5", "6", "7"],
    correct: 2,
    points: 100,
  },
];
