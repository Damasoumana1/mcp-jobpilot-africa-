import React, { useState, useEffect } from 'react';
import { Mic, CheckSquare, Sparkles, Check, RefreshCw } from 'lucide-react';
import type { ChecklistItem } from '../types';

export const InterviewTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'questions' | 'checklist'>('questions');
  
  // Questions Generator state
  const [roleTitle, setRoleTitle] = useState('Fullstack Developer (Python & React)');
  const [category, setCategory] = useState('tech');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch('/api/interview/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_title: roleTitle, category }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchChecklist = async () => {
    setLoadingChecklist(true);
    try {
      const res = await fetch('/api/interview/checklist');
      if (res.ok) {
        const data = await res.json();
        setChecklist(data.checklist || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChecklist(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchChecklist();
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">

      {/* Subtab navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('questions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeSubTab === 'questions'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Simulateur & Questions IA</span>
        </button>
        <button
          onClick={() => setActiveSubTab('checklist')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeSubTab === 'checklist'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Checklist Entretien (Avant / Pendant / Après)</span>
        </button>
      </div>

      {/* SUBTAB 1: Questions Generator */}
      {activeSubTab === 'questions' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Controls */}
          <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Poste ciblé
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="ex: Backend Engineer, Data Scientist, DevOps..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="tech">Technique</option>
                  <option value="culture">Culture Fit</option>
                  <option value="problem_solving">Problem Solving</option>
                </select>
              </div>

              <div>
                <button
                  onClick={fetchQuestions}
                  disabled={loadingQuestions}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loadingQuestions ? 'Génération...' : 'Générer Questions'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Questions Grid */}
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q, index) => (
              <div
                key={index}
                className="bg-[#0d1424] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/30">
                      {index + 1}
                    </span>
                    <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      {q.type || 'Question Technique & Pratique'}
                    </span>
                  </div>
                  {q.difficulty && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                      {q.difficulty}
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-white font-display">
                  {q.question}
                </h4>

                {q.tips && (
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 space-y-1">
                    <span className="text-emerald-400 font-semibold block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Conseil de réponse (Méthode STAR) :
                    </span>
                    <p className="leading-relaxed text-slate-300">{q.tips}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUBTAB 2: Checklist */}
      {activeSubTab === 'checklist' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-emerald-300">
            <span>
              🎯 Cocher les étapes au fur et à mesure pour maximiser vos chances de conversion en offre.
            </span>
            <span className="font-bold">
              {Object.values(checkedMap).filter(Boolean).length} / {checklist.length} complétés
            </span>
          </div>

          {loadingChecklist && (
            <div className="flex items-center justify-center p-8 text-emerald-400 space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Chargement de la checklist...</span>
            </div>
          )}

          <div className="bg-[#0d1424] border border-slate-800 rounded-2xl shadow-xl divide-y divide-slate-800">
            {checklist.map((item) => {
              const isChecked = !!checkedMap[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-colors ${
                    isChecked ? 'bg-emerald-950/20 opacity-70' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400">
                        {item.phase}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          isChecked ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {item.task}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      <span className="text-slate-500">Pourquoi c'est décisif :</span> {item.why_it_matters}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
