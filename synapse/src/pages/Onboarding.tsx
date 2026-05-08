import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSkillTree } from '../api/llmService'; 
import { useStore } from '../store/useStore'; 

export default function Onboarding() {
  const [currentSkills, setCurrentSkills] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  
  // CORRECTION 1 : On récupère la bonne fonction que nous avons créée dans le store
  const setGeneratedTree = useStore(state => state.setGeneratedTree);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      // 1. On appelle notre IA (Gemini)
      const generatedData = await generateSkillTree(currentSkills, targetGoal);
      
      // CORRECTION 2 : On utilise la fonction du store pour mettre à jour les données proprement
      setGeneratedTree({ 
        nodes: generatedData.nodes, 
        edges: generatedData.edges, 
        xp: generatedData.xp
      });
      
      // 3. On navigue vers le tableau de bord
      navigate('/dashboard');
      
    } catch (error) {
      console.error(error); // Pratique pour voir l'erreur exacte dans la console (F12)
      alert("Erreur lors de la génération. Vérifiez la console et votre clé API.");
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', 
      alignItems: 'center', backgroundColor: '#2c3e50', color: 'white', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'white', color: '#333', padding: '40px', borderRadius: '12px', 
        width: '500px', maxWidth: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', marginTop: 0 }}>🧠 Synapse</h1>
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '30px' }}>
          Générez votre parcours d'apprentissage sur mesure grâce à l'IA.
        </p>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Que savez-vous déjà faire ?</label>
            <input 
              required
              type="text" 
              placeholder="Ex: HTML, CSS, bases de Python..." 
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Quel est votre objectif ?</label>
            <input 
              required
              type="text" 
              placeholder="Ex: Devenir développeur React..." 
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isGenerating}
            style={{ 
              padding: '15px', background: isGenerating ? '#95a5a6' : '#3498db', 
              color: 'white', border: 'none', borderRadius: '6px', cursor: isGenerating ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold', fontSize: '1.1rem', marginTop: '10px', transition: 'background 0.3s'
            }}
          >
            {isGenerating ? 'Analyse par l\'IA en cours... 🤖' : 'Générer mon parcours 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}