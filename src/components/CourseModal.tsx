import { useState, useEffect, useCallback } from 'react';
import { type Node } from 'reactflow';
import { useStore } from '../store/useStore';
import Quiz from './Quiz';
import { generateCourseAndQuiz, type CourseContent } from '../api/llmService';
import './CourseModal.css';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
}

function CourseModalContent({ node, onClose }: { node: Node; onClose: () => void }) {
  const completeSkill = useStore((state) => state.completeSkill);
  const [showQuiz, setShowQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [content, setContent] = useState<CourseContent | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setDots(prev => prev.length >= 3 ? '' : prev + '.'), 500);
    return () => clearInterval(timer);
  }, []);

  const fetchContent = useCallback(async () => {
    setIsLoadingContent(true);
    setErrorMsg('');
    try {
      const generatedContent = await generateCourseAndQuiz(String(node.data.label));
      setContent(generatedContent);
      if (generatedContent.retryAfterSeconds) {
        setCountdown(generatedContent.retryAfterSeconds);
      }
      setIsLoadingContent(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de générer le cours pour le moment.';
      setErrorMsg(message);
      setIsLoadingContent(false);
    }
  }, [node.data.label]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchContent();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, fetchContent]);

  const handleQuizSuccess = () => {
    completeSkill(node.id);
    onClose();
  };

  const handleQuizFail = () => {
    setShowQuiz(false);
    setErrorMsg('Échec du test. Relisez bien le cours avant de réessayer !');
  };

  const statusBadgeClass = `modal-status-badge--${node.data.status}`;

  return (
    <div className="modal-card">
      <div className="modal-header">
        <h2 className="modal-title">{node.data.label}</h2>
        <span className={`modal-status-badge ${statusBadgeClass}`}>
          {String(node.data.status)}
        </span>
      </div>

      {content?.fallbackReason && (
        <div className="modal-alert modal-alert--warning">
          <span>⚠️</span>
          <span>
            {content.fallbackReason}
            {countdown > 0 && (
              <span className="modal-countdown"> Nouvelle tentative dans <strong>{countdown}s</strong></span>
            )}
            {countdown === 0 && content.isFallback && (
              <span className="modal-countdown--ready"> ☝️ Rafraîchis la page pour recharger le contenu IA</span>
            )}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="modal-alert modal-alert--error">
          <span>❌</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoadingContent && (
        <div className="modal-loading">
          <div className="modal-loading-spinner" />
          <p className="modal-loading-text">🤖 L'IA génère votre cours sur mesure{dots}</p>
        </div>
      )}

      {!isLoadingContent && content && !showQuiz && (
        <div className="modal-course">
          <div className="modal-course-content">
            <p className="modal-course-intro"><strong>Introduction :</strong><br />{content.course.introduction}</p>
            <p className="modal-course-section-title">Points clés à retenir</p>
            <ul className="modal-course-key-points">
              {content.course.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="modal-youtube-section">
            <p className="modal-youtube-title">📺 Recherches YouTube suggérées</p>
            <ul className="modal-youtube-list">
              {content.course.youtubeSearchTerms.map((term, i) => (
                <li key={i}>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="modal-youtube-link"
                  >
                    ▶️ {term}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!isLoadingContent && content && showQuiz && (
        <Quiz questions={content.quiz} onSuccess={handleQuizSuccess} onFail={handleQuizFail} />
      )}

      <div className="modal-footer">
        <button onClick={onClose} className="modal-btn modal-btn--secondary">
          Fermer
        </button>
        {!isLoadingContent && content && !showQuiz && node.data.status === 'unlocked' && (
          <button onClick={() => setShowQuiz(true)} className="modal-btn modal-btn--primary">
            Passer l'épreuve
          </button>
        )}
      </div>
    </div>
  );
}

export default function CourseModal({ isOpen, onClose, node }: CourseModalProps) {
  if (!isOpen || !node) return null;
  return (
    <div className="modal-overlay">
      <CourseModalContent key={node.id} node={node} onClose={onClose} />
    </div>
  );
}
