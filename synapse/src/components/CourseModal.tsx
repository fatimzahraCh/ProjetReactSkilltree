import { useState, useEffect } from 'react';
import { type Node } from 'reactflow';
import { useStore } from '../store/useStore';
import Quiz, { type Question } from './Quiz';
import { generateCourseAndQuiz } from '../api/llmService';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
}

// Le format des données que l'IA va nous renvoyer
interface NodeContent {
  course: { introduction: string; keyPoints: string[]; youtubeSearchTerms: string[] };
  quiz: Question[];
}

export default function CourseModal({ isOpen, onClose, node }: CourseModalProps) {
  const completeSkill = useStore((state) => state.completeSkill);
  
  const [showQuiz, setShowQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Nouveaux états pour gérer le chargement de l'IA
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [content, setContent] = useState<NodeContent | null>(null);

  // À chaque fois qu'on ouvre un nœud, on demande à l'IA de créer le cours
  useEffect(() => {
    if (isOpen && node) {
      setShowQuiz(false);
      setErrorMsg('');
      setContent(null); // On vide l'ancien contenu
      setIsLoadingContent(true);

      // On appelle Gemini avec le nom du nœud !
      generateCourseAndQuiz(node.data.label)
        .then((generatedContent) => {
          setContent(generatedContent);
          setIsLoadingContent(false);
        })
        .catch(() => {
          setErrorMsg("Impossible de générer le cours pour le moment.");
          setIsLoadingContent(false);
        });
    }
  }, [isOpen, node]);

  if (!isOpen || !node) return null;

  const handleQuizSuccess = () => {
    completeSkill(node.id);
    onClose();
  };

  const handleQuizFail = () => {
    setShowQuiz(false);
    setErrorMsg("Échec du test. Relisez bien le cours avant de réessayer !");
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>{node.data.label}</h2>
          <span style={{ background: node.data.status === 'completed' ? '#2ecc71' : '#f1c40f', color: 'white', padding: '5px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            {node.data.status.toUpperCase()}
          </span>
        </div>

        {errorMsg && <div style={{ background: '#ffeef0', color: '#d32f2f', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>❌ {errorMsg}</div>}

        {/* AFFICHAGE DU CHARGEMENT */}
        {isLoadingContent && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <p>🤖 L'IA génère votre cours sur mesure...</p>
          </div>
        )}

        {/* AFFICHAGE DU COURS GÉNÉRÉ */}
        {!isLoadingContent && content && !showQuiz && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ background: '#f4f6f8', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
              <p style={{ marginTop: 0 }}><strong>Introduction :</strong><br/>{content.course.introduction}</p>
              
              <strong>Points clés à retenir :</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                {content.course.keyPoints.map((point, i) => <li key={i} style={{ marginBottom: '8px' }}>{point}</li>)}
              </ul>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', background: '#fdf2e9', borderRadius: '8px' }}>
              <strong style={{ color: '#e67e22' }}>📺 Recherches YouTube suggérées :</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', marginBottom: 0 }}>
                {content.course.youtubeSearchTerms.map((term, i) => (
                  <li key={i}>
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`} target="_blank" rel="noreferrer" style={{ color: '#d35400', textDecoration: 'none', fontWeight: 'bold' }}>
                      ▶️ {term}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* AFFICHAGE DU QUIZ DYNAMIQUE */}
        {!isLoadingContent && content && showQuiz && (
          <Quiz questions={content.quiz} onSuccess={handleQuizSuccess} onFail={handleQuizFail} />
        )}
        
        {/* BOUTONS D'ACTION */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '10px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: '#e0e0e0', fontWeight: 'bold' }}>
            Fermer
          </button>
          
          {!isLoadingContent && content && !showQuiz && node.data.status === 'unlocked' && (
            <button onClick={() => setShowQuiz(true)} style={{ padding: '10px 15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Passer l'épreuve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}