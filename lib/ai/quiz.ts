// lib/ai/quiz.ts
//
// Code-enforced guarantees for generated quizzes. The generation prompt (see
// QUIZ_CONTRACT) ASKS the model for plausible distractors, varied answer
// positions, and real diagram URLs — but a prompt asking for something isn't
// the same as it happening. This is the enforcement layer: a real Fisher-Yates
// shuffle of every MCQ's options (with correctIndex remapped to match), a pass
// that breaks up any run of 3+ same-letter correct answers, and validation
// that drops malformed questions or "diagram" questions pointing at an image
// the model wasn't actually given (rather than trusting it not to hallucinate
// a URL).

export type QuizQuestion = Record<string, any>;

const VALID_TYPES = new Set(["mcq", "fill_blank", "listing", "diagram"]);

function isValidQuestion(q: QuizQuestion, allowedImageUrls: Set<string>): boolean {
  if (!q || typeof q !== "object" || typeof q.q !== "string" || !q.q.trim()) return false;
  const type = VALID_TYPES.has(q.type) ? q.type : (Array.isArray(q.options) ? "mcq" : null);
  if (!type) return false;

  switch (type) {
    case "mcq":
      return (
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every((o: any) => typeof o === "string" && o.trim()) &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3
      );
    case "fill_blank":
      return typeof q.modelAnswer === "string" && q.modelAnswer.trim().length > 0;
    case "listing":
      return (
        Array.isArray(q.modelAnswers) &&
        q.modelAnswers.length > 0 &&
        q.modelAnswers.every((a: any) => typeof a === "string" && a.trim())
      );
    case "diagram":
      return (
        typeof q.imageUrl === "string" &&
        allowedImageUrls.has(q.imageUrl) &&
        typeof q.modelAnswer === "string" &&
        q.modelAnswer.trim().length > 0
      );
    default:
      return false;
  }
}

function shuffleOptions(options: string[], correctIndex: number): { options: string[]; correctIndex: number } {
  const correctValue = options[correctIndex];
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { options: shuffled, correctIndex: shuffled.indexOf(correctValue) };
}

/** Prevents the correct letter from repeating 3+ times in a row across the MCQ
 *  subset (in question order) — re-shuffles the offending question until its
 *  slot differs, with a guaranteed swap fallback so this can never loop forever. */
function breakAnswerRuns(questions: QuizQuestion[]): void {
  let prev1: number | null = null;
  let prev2: number | null = null;

  for (const q of questions) {
    if (q.type !== "mcq") continue;

    if (prev1 !== null && prev1 === prev2 && q.correctIndex === prev1) {
      let attempts = 0;
      while (q.correctIndex === prev1 && attempts < 8) {
        const reshuffled = shuffleOptions(q.options, q.correctIndex);
        q.options = reshuffled.options;
        q.correctIndex = reshuffled.correctIndex;
        attempts += 1;
      }
      if (q.correctIndex === prev1) {
        const newIndex = (q.correctIndex + 1) % q.options.length;
        [q.options[q.correctIndex], q.options[newIndex]] = [q.options[newIndex], q.options[q.correctIndex]];
        q.correctIndex = newIndex;
      }
    }

    prev2 = prev1;
    prev1 = q.correctIndex;
  }
}

/** Validates, shuffles, and re-numbers a freshly-generated quiz. allowedImageUrls
 *  is the set of vault_document_images URLs that were actually offered to the
 *  model this call — any "diagram" question citing anything else is dropped. */
export function postProcessQuiz(quiz: any, allowedImageUrls: Iterable<string> = []): any {
  const allowed = new Set(allowedImageUrls);
  const rawQuestions: QuizQuestion[] = Array.isArray(quiz?.questions) ? quiz.questions : [];

  const questions: QuizQuestion[] = rawQuestions
    .filter((q) => isValidQuestion(q, allowed))
    .map((q, i): QuizQuestion => ({ ...q, id: i + 1, type: VALID_TYPES.has(q.type) ? q.type : "mcq" }));

  for (const q of questions) {
    if (q.type === "mcq") {
      const shuffled = shuffleOptions(q.options, q.correctIndex);
      q.options = shuffled.options;
      q.correctIndex = shuffled.correctIndex;
    }
  }

  breakAnswerRuns(questions);

  return { ...quiz, questions };
}
