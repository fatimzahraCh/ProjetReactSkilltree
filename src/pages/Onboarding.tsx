import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSkillTree } from '../api/llmService';
import { useStore } from '../store/useStore';
import './Onboarding.css';

export default function Onboarding() {
  const [currentSkills, setCurrentSkills] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const setGeneratedTree = useStore(state => state.setGeneratedTree);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const generatedData = await generateSkillTree(currentSkills, targetGoal);
      setGeneratedTree({
        nodes: generatedData.nodes,
        edges: generatedData.edges,
        xp: generatedData.xp,
      });
      setIsGenerating(false);
      navigate('/dashboard');
    } catch (error) {
      setIsGenerating(false);
      console.error(error);
      const message = error instanceof Error ? error.message : "Erreur lors de la g├®n├®ration.";
      setErrorMsg(message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-grid" />
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <div className="onboarding-logo-icon">­ƒºá</div>
        </div>
        <h1 className="onboarding-title">Synapse</h1>
        <p className="onboarding-subtitle">
          G├®n├®rez votre parcours d'apprentissage sur mesure gr├óce ├á l'IA.
        </p>

        <form className="onboarding-form" onSubmit={handleGenerate}>
          <div className="onboarding-field">
            <label className="onboarding-label">
              <span className="onboarding-label-icon">­ƒôÜ</span>
              Que savez-vous d├®j├á faire ?
            </label>
            <input
              required
              type="text"
              className="onboarding-input"
              placeholder="Ex: HTML, CSS, bases de Python..."
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
            />
          </div>
          <div className="onboarding-field">
            <label className="onboarding-label">
              <span className="onboarding-label-icon">­ƒÄ»</span>
              Quel est votre objectif ?
            </label>
            <input
              required
              type="text"
              className="onboarding-input"
              placeholder="Ex: Devenir d├®veloppeur React..."
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
            />
          </div>
          {errorMsg && (
            <div className="onboarding-error">{errorMsg}</div>
          )}
          <button
            type="submit"
            disabled={isGenerating}
            className="onboarding-submit"
          >
            {isGenerating ? (
              <span className="onboarding-submit-loading">
                <span className="onboarding-spinner" />
                Analyse par l'IA en cours...
              </span>
            ) : (
              'G├®n├®rer mon parcours ­ƒÜÇ'
            )}
          </button>
        </form>

        <div className="onboarding-features">
          <div className="onboarding-feature">
            <span className="onboarding-feature-icon">­ƒñû</span>
            Parcours g├®n├®r├® par IA
          </div>
          <div className="onboarding-feature">
            <span className="onboarding-feature-icon">­ƒÄ«</span>
            Apprentissage interactif
          </div>
          <div className="onboarding-feature">
            <span className="onboarding-feature-icon">­ƒÅå</span>
            Quiz de validation
          </div>
        </div>
      </div>
    </div>
  );
}
