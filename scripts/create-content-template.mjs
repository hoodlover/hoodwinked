import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const outputDir = path.join(process.cwd(), "public", "templates");
const outputPath = path.join(outputDir, "hoodwinked-content-template.xlsx");

function sheet(rows) {
  return XLSX.utils.aoa_to_sheet(rows);
}

const workbook = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
  workbook,
  sheet([
    ["Hoodwinked Content Template"],
    ["Fill in any tabs you want. Leave unused rows blank. Then import this workbook in Content Studio."],
    [],
    ["Tab", "Used by", "What to enter"],
    ["Prompts", "The Setup / Two-Faced", "Open-ended prompts players answer on their phones."],
    ["Trivia", "The Score", "Question, category, 2-4 choices, and correct answer number."],
    ["Surveys", "The Usual Suspects", "Survey prompt plus accepted answers, points, and optional aliases."],
    ["Images", "Now You See Me", "Answer, optional image URL, optional AI image prompt, aliases, and hint."],
    ["Puzzles", "Letter Heist", "Category and phrase to solve letter by letter."]
  ]),
  "Instructions"
);

XLSX.utils.book_append_sheet(
  workbook,
  sheet([
    ["Prompt"],
    ["What is one rule from today's lesson that everyone should remember?"],
    ["A bad excuse for forgetting the assignment"]
  ]),
  "Prompts"
);

XLSX.utils.book_append_sheet(
  workbook,
  sheet([
    ["Category", "Question", "Choice 1", "Choice 2", "Choice 3", "Choice 4", "Correct Choice Number"],
    ["Science", "Which planet is known as the Red Planet?", "Mercury", "Venus", "Mars", "Jupiter", 3],
    ["Vocabulary", "What does 'evidence' mean?", "A guess", "Proof or information", "A joke", "A shortcut", 2]
  ]),
  "Trivia"
);

XLSX.utils.book_append_sheet(
  workbook,
  sheet([
    [
      "Survey Prompt",
      "Answer 1",
      "Points 1",
      "Aliases 1",
      "Answer 2",
      "Points 2",
      "Aliases 2",
      "Answer 3",
      "Points 3",
      "Aliases 3",
      "Answer 4",
      "Points 4",
      "Aliases 4",
      "Answer 5",
      "Points 5",
      "Aliases 5"
    ],
    [
      "Name something a detective looks for",
      "Clues",
      40,
      "evidence, proof",
      "Fingerprints",
      25,
      "finger print",
      "Witnesses",
      20,
      "witness",
      "Motive",
      10,
      "reason",
      "Alibi",
      5,
      "where they were"
    ]
  ]),
  "Surveys"
);

XLSX.utils.book_append_sheet(
  workbook,
  sheet([
    ["Answer", "Hint", "Aliases", "Image URL", "AI Image Prompt"],
    ["microscope", "Lab tool", "scope", "", "A clear photo of a microscope on a classroom lab table, no readable text"],
    ["Eiffel Tower", "Paris landmark", "eiffel", "https://example.com/eiffel.jpg", ""]
  ]),
  "Images"
);

XLSX.utils.book_append_sheet(
  workbook,
  sheet([
    ["Category", "Puzzle Phrase"],
    ["Key Term", "SCIENTIFIC METHOD"],
    ["Phrase", "SHOW YOUR WORK"]
  ]),
  "Puzzles"
);

for (const worksheet of Object.values(workbook.Sheets)) {
  worksheet["!cols"] = Array.from({ length: 16 }, (_, index) => ({ wch: index === 0 ? 28 : 18 }));
}

fs.mkdirSync(outputDir, { recursive: true });
XLSX.writeFile(workbook, outputPath, { bookType: "xlsx" });
console.log(outputPath);
