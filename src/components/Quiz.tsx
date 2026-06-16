import { useState } from 'react';
import './Quiz.css';

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizProps {
  questions: Question[];
  onSuccess: () => void;
  onFail: () => void;
}

const CORRECT_REACTIONS = [
  { emoji: '🎉', text: 'Bravo ! C\'est exact !' },
  { emoji: '🌟', text: 'Parfait ! Tu gères !' },
  { emoji: '🔥', text: 'En pleine forme !' },
  { emoji: '💪', text: 'Continue comme ça !' },
  { emoji: '✨', text: 'Impeccable !' },
  { emoji: '🏆', text: 'Champion !' },
];

const INCORRECT_REACTIONS = [
  { emoji: '💥', text: 'Oups ! Pas cette fois.' },
  { emoji: '🤔', text: 'Presque ! Réessaie.' },
  { emoji: '💡', text: 'Pas tout à fait...' },
  { emoji: '🧐', text: 'Raté ! Mais tu apprends.' },
  { emoji: '📚', text: 'Petite erreur, ça arrive.' },
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export default function Quiz({ questions, onSuccess, onFail }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [reaction, setReaction] = useState<{ emoji: string; text: string } | null>(null);

  if (!questions || questions.length === 0) {
    return <div className="quiz-empty">Chargement du quiz...</div>;
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (selectedIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(selectedIndex);
    setShowFeedback(true);

    const isCorrect = selectedIndex === questions[currentQuestion].correctIndex;
    const newScore = isCorrect ? score + 1 : score;

    const reactions = isCorrect ? CORRECT_REACTIONS : INCORRECT_REACTIONS;
    setReaction(pick(reactions, currentQuestion + selectedIndex));

    setTimeout(() => {
      setReaction(null);
      if (isCorrect) setScore(newScore);

      if (currentQuestion === questions.length - 1) {
        if (newScore === questions.length) {
          onSuccess();
        } else {
          onFail();
        }
      } else {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 1200);
  };

  const getOptionClass = (index: number) => {
    if (!showFeedback || selectedAnswer === null) return '';
    if (index === questions[currentQuestion].correctIndex) return 'quiz-option-btn--correct';
    if (index === selectedAnswer) return 'quiz-option-btn--incorrect';
    return '';
  };

  const isCorrectAnswer = showFeedback && selectedAnswer !== null &&
    selectedAnswer === questions[currentQuestion].correctIndex;

  return (
    <div className={`quiz-container ${showFeedback ? (isCorrectAnswer ? 'quiz-container--correct' : 'quiz-container--incorrect') : ''}`}>
      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="quiz-progress-text">{currentQuestion + 1}/{questions.length}</span>
      </div>

      <p className="quiz-question-number">Question {currentQuestion + 1}</p>
      <p className="quiz-question-text">{questions[currentQuestion].question}</p>

      <div className="quiz-options">
        {questions[currentQuestion].options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className={`quiz-option-btn ${getOptionClass(index)} ${
              showFeedback && index === selectedAnswer ? 'quiz-option-btn--selected' : ''
            }`}
            disabled={showFeedback}
          >
            <span className="quiz-option-letter">{String.fromCharCode(65 + index)}</span>
            <span className="quiz-option-text">{option}</span>
            {showFeedback && index === questions[currentQuestion].correctIndex && (
              <span className="quiz-option-icon">✅</span>
            )}
            {showFeedback && index === selectedAnswer && index !== questions[currentQuestion].correctIndex && (
              <span className="quiz-option-icon">❌</span>
            )}
          </button>
        ))}
      </div>

      {reaction && (
        <div className={`quiz-reaction ${showFeedback ? 'quiz-reaction--visible' : ''}`}>
          <span className="quiz-reaction-emoji">{reaction.emoji}</span>
          <span className="quiz-reaction-text">{reaction.text}</span>
        </div>
      )}
    </div>
  );
}
