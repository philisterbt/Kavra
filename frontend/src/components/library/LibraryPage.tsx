import React, { useState } from 'react';
import { Play, Search, Atom, FlaskConical, Filter, CheckCircle2, X, Sparkles, Maximize2 } from 'lucide-react';

export interface ExperimentItem {
  id: string | number;
  title: string;
  subject: 'physics' | 'chemistry' | 'biology' | 'general';
  description: string;
  grade_level: string;
  simulation_type: string;
  gradient: string;
  icon?: React.ReactNode;
  html_code?: string;
  timestamp?: string;
}

const CURATED_EXPERIMENTS: ExperimentItem[] = [];

interface LibraryPageProps {
  onSelectExperiment: (exp: ExperimentItem) => void;
  userExperiments?: ExperimentItem[];
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ 
  onSelectExperiment,
  userExperiments = []
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalSim, setActiveModalSim] = useState<ExperimentItem | null>(null);

  const allExperiments = [...userExperiments, ...CURATED_EXPERIMENTS];

  const filtered = allExperiments.filter((exp) => {
    const matchesSubject = selectedSubject === 'all' || exp.subject === selectedSubject;
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto py-6 text-[#292524] font-body px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-[#0f172a] flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-[#094cb2]" /> Laboratuvar Kütüphanesi
          </h2>
          <p className="text-[#0f172a]/75 text-xs sm:text-sm mt-1 font-medium">
            Simülatör ekranından ürettiğiniz tüm sezgisel bilimsel simülasyonlar burada saklanır.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 font-label">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0f172a]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Simülasyon veya konu ara..."
            className="w-full bg-white text-[#0f172a] placeholder-[#0f172a]/50 pl-10 pr-4 py-2.5 rounded-xl border border-[#0f172a]/20 focus:outline-none focus:border-[#094cb2] text-xs font-semibold shadow-inner"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5 mb-8 overflow-x-auto pb-2 font-label">
        <button
          onClick={() => setSelectedSubject('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            selectedSubject === 'all'
              ? 'bg-[#094cb2] text-white shadow-md'
              : 'bg-white text-[#0f172a] border border-[#0f172a]/20 hover:bg-[#f1f5f9]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" /> Tüm Simülasyonlar ({allExperiments.length})
        </button>
      </div>

      {/* Experiment Grid or Empty State */}
      {allExperiments.length === 0 ? (
        <div className="glass-card bg-[#f1f5f9] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 border border-[#0f172a]/12 shadow-sm font-label my-4">
          <div className="p-4 rounded-full bg-[#eff6ff] border border-[#094cb2]/20 text-[#094cb2]">
            <FlaskConical className="w-10 h-10" />
          </div>
          <h3 className="font-headline text-2xl font-bold text-[#0f172a]">Henüz Kaydedilmiş Simülasyonunuz Yok</h3>
          <p className="text-xs text-[#0f172a]/75 max-w-md font-medium leading-relaxed">
            Simülatör sekmesindeki <strong>"Simüle Et"</strong> modunu kullanarak herhangi bir bilimsel veya matematiksel konuyu yazıp ilk interaktif simülasyonunuzu üretebilirsiniz. Üretilen tüm simülasyonlar kütüphanenize otomatik kaydedilir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="glass-card bg-[#f1f5f9] rounded-2xl p-6 border border-[#0f172a]/12 flex flex-col justify-between shadow-sm hover:border-[#094cb2]/40 transition duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2.5 rounded-xl bg-white border border-[#0f172a]/15 shadow-sm text-[#094cb2]">
                    {exp.icon || <Atom className="w-5 h-5 text-[#094cb2]" />}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#094cb2] px-2.5 py-1 rounded-md">
                    {exp.grade_level || 'Sezgisel Simülasyon'}
                  </span>
                </div>
                <h3 className="text-lg font-headline font-bold text-[#0f172a] mb-2">{exp.title}</h3>
                <p className="text-xs text-[#0f172a]/80 leading-relaxed font-medium min-h-[48px]">{exp.description}</p>
              </div>

              {/* Simulation Preview Frame if HTML exists */}
              {exp.html_code && (
                <div className="my-4 w-full h-36 bg-[#FDFCF9] rounded-xl border border-[#292524]/10 overflow-hidden relative pointer-events-none">
                  <iframe
                    srcDoc={exp.html_code}
                    title={exp.title}
                    className="w-full h-full border-0 scale-90"
                    sandbox="allow-scripts"
                  />
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#292524]/12 flex items-center justify-between font-label gap-2 flex-wrap">
                <span className="text-[11px] text-[#292524]/70 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kayıtlı Simülasyon
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (exp.html_code) {
                        setActiveModalSim(exp);
                      }
                    }}
                    className="kavra-btn-primary py-2 px-3 text-xs flex items-center gap-1.5 font-bold"
                    title="Simülasyonu Tam Ekranda Çalıştır"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Çalıştır
                  </button>

                  <button
                    onClick={() => onSelectExperiment(exp)}
                    className="kavra-btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 font-bold"
                    title="Simülatör Ekranına Aktar"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Simülatörde Aç
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Interactive Simulation Modal */}
      {activeModalSim && activeModalSim.html_code && (
        <div className="fixed inset-0 z-[100] bg-[#0f172a]/90 backdrop-blur-md p-4 md:p-6 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 bg-white border border-[#0f172a]/20 rounded-t-2xl text-[#0f172a] shadow-sm font-label">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#094cb2] text-white shadow-sm">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-headline font-extrabold text-[#0f172a]">
                  {activeModalSim.title} - Sezgisel Simülasyon
                </h3>
                <p className="text-xs text-[#0f172a]/70 font-semibold">Laboratuvar Kütüphanesi Kayıtlı Deney Ekranı</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModalSim(null)}
              className="p-2.5 rounded-xl bg-white text-[#0f172a] border border-[#0f172a]/20 transition shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 w-full bg-white rounded-b-2xl border border-t-0 border-[#0f172a]/20 p-2 overflow-hidden auremin-grid shadow-2xl">
            <iframe
              srcDoc={activeModalSim.html_code}
              title={activeModalSim.title}
              className="w-full h-full rounded-xl border-0 bg-white block"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
};
