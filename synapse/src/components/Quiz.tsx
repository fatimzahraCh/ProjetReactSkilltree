import { useState } from 'react';

// On définit le type des questions qui viendront de l'IA
export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizProps {
  questions: Question[]; // Le composant reçoit les questions en paramètre
  onSuccess: () => void;
  onFail: () => void;
}

export default function Quiz({ questions, onSuccess, onFail }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);

  if (!questions || questions.length === 0) return <p>Chargement du quiz...</p>;

  const handleAnswer = (selectedIndex: number) => {
    const isCorrect = selectedIndex === questions[currentQuestion].correctIndex;
    const newScore = isCorrect ? score + 1 : score;
    
    if (isCorrect) setScore(newScore);

    if (currentQuestion === questions.length - 1) {
      if (newScore === questions.length) {
        onSuccess();
      } else {
        onFail();
      }
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  return (
    <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
      <h4 style={{ color: '#2c3e50', marginTop: 0 }}>
        Question {currentQuestion + 1} / {questions.length}
      </h4>
      <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>
        {questions[currentQuestion].question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {questions[currentQuestion].options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            style={{
              padding: '12px', textAlign: 'left', background: 'white',
              border: '2px solid #bdc3c7', borderRadius: '6px', cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3498db'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#bdc3c7'}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}