export const AdaptiveEngine = {
  generateExam(questions) {
    const mcq = questions.filter(q => q.choices);
    const iden = questions.filter(q => !q.choices);

    const mcqLimit = 6;
    const idLimit = 4;

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    const result = [
      ...shuffle(mcq).slice(0, mcqLimit),
      ...shuffle(iden).slice(0, idLimit),
    ];

    return shuffle(result).slice(0, 10);
  }
};