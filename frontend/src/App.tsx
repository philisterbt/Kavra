import { useState } from 'react';
import { AuthModal } from './components/auth/AuthModal';
import { LibraryPage, type ExperimentItem } from './components/library/LibraryPage';
import { DigitalLabNotebook } from './components/notebook/DigitalLabNotebook';
import { ChatInterface, type OutputMode } from './components/chat/ChatInterface';
import { LandingPage } from './components/home/LandingPage';
import { CellArchitectureStudio, type StudioModelItem } from './components/studio/CellArchitectureStudio';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'simulator' | 'library' | 'notebook' | 'studio'>('home');
  const [guestTrialLeft, setGuestTrialLeft] = useState<number>(20);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [userMaterials, setUserMaterials] = useState<StudioModelItem[]>([]);
  const [userExperiments, setUserExperiments] = useState<ExperimentItem[]>([]);
  const [selectedLibrarySimulation, setSelectedLibrarySimulation] = useState<ExperimentItem | null>(null);

  const handleSaveMaterial = (newMaterial: StudioModelItem) => {
    setUserMaterials((prev) => [newMaterial, ...prev]);
  };

  const handleSaveSimulation = (newExperiment: ExperimentItem) => {
    setUserExperiments((prev) => [newExperiment, ...prev]);
  };

  const handleSimulateRequest = async (topic: string, mode: OutputMode): Promise<string | null> => {
    if (guestTrialLeft <= 0) {
      setIsAuthModalOpen(true);
      return null;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/generate/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, output_type: mode }),
      });
      const data = await res.json();
      if (data && data.html_code) {
        if (guestTrialLeft > 0) {
          setGuestTrialLeft((prev) => prev - 1);
        }
        return data.html_code;
      }
    } catch (err) {
      console.error('Simulation API error:', err);
    }
    return null;
  };

  const handleSelectExperimentFromLibrary = (exp: ExperimentItem) => {
    setSelectedLibrarySimulation(exp);
    setCurrentView('simulator');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-body selection:bg-[#094cb2] selection:text-white">
      {/* Header / Navbar (Alexandria Glassmorphism 80% Opacity + 20px Blur) */}
      <header className="sticky top-0 z-50 bg-[#f8fafc]/80 backdrop-blur-xl px-6 md:px-10 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          
          {/* Logo (Alexandria Primary Accent #094cb2) */}
          <div onClick={() => setCurrentView('home')} className="flex items-center gap-3 cursor-pointer group z-10 flex-shrink-0">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center p-1.5 group-hover:bg-[#eff6ff] transition">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#094cb2] stroke-[7]">
                <path d="M40 15 H60 M50 15 V35 L80 85 C83 90 77 95 70 95 H30 C23 95 17 90 20 85 L50 35" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M35 72 L45 62 L55 77 L65 67 L75 77" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                <circle cx="50" cy="50" r="4" fill="#094cb2" />
              </svg>
            </div>
            <span className="text-2xl font-headline font-black tracking-tight text-[#0f172a]">
              Kavra
            </span>
          </div>

          {/* Nav Links (Ana Sayfa Centered in the middle of all tabs) */}
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-label font-bold text-[#0f172a]/70 uppercase tracking-wider md:absolute md:left-1/2 md:-translate-x-1/2">
            <button
              onClick={() => setCurrentView('simulator')}
              className={`transition relative py-1.5 ${
                currentView === 'simulator'
                  ? 'text-[#094cb2] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#094cb2]'
                  : 'hover:text-[#094cb2]'
              }`}
            >
              Simülatör
            </button>
            <button
              onClick={() => setCurrentView('studio')}
              className={`transition relative py-1.5 ${
                currentView === 'studio'
                  ? 'text-[#094cb2] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#094cb2]'
                  : 'hover:text-[#094cb2]'
              }`}
            >
              Materyaller
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className={`transition relative py-1.5 ${
                currentView === 'home'
                  ? 'text-[#094cb2] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#094cb2]'
                  : 'hover:text-[#094cb2]'
              }`}
            >
              Ana Sayfa
            </button>
            <button
              onClick={() => setCurrentView('library')}
              className={`transition relative py-1.5 ${
                currentView === 'library'
                  ? 'text-[#094cb2] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#094cb2]'
                  : 'hover:text-[#094cb2]'
              }`}
            >
              Laboratuvar Kütüphanesi
            </button>
            <button
              onClick={() => setCurrentView('notebook')}
              className={`transition relative py-1.5 ${
                currentView === 'notebook'
                  ? 'text-[#094cb2] font-extrabold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#094cb2]'
                  : 'hover:text-[#094cb2]'
              }`}
            >
              Dijital Defterim
            </button>
          </nav>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col w-full">
        {currentView === 'home' && (
          <LandingPage
            onStartSimulator={() => setCurrentView('simulator')}
            onExploreLibrary={() => setCurrentView('library')}
            onOpenNotebook={() => setCurrentView('notebook')}
          />
        )}

        {currentView === 'simulator' && (
          <ChatInterface
            onSimulateRequest={handleSimulateRequest}
            guestTrialLeft={guestTrialLeft}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onSaveMaterial={handleSaveMaterial}
            onSaveSimulation={handleSaveSimulation}
            initialSimulation={selectedLibrarySimulation}
          />
        )}

        {currentView === 'studio' && (
          <CellArchitectureStudio userMaterials={userMaterials} />
        )}

        {currentView === 'library' && (
          <LibraryPage 
            onSelectExperiment={handleSelectExperimentFromLibrary} 
            userExperiments={userExperiments}
          />
        )}

        {currentView === 'notebook' && (
          <DigitalLabNotebook 
            onOpenTopicInSimulator={(topic) => {
              setSelectedLibrarySimulation({
                id: 'note-' + Date.now(),
                title: topic,
                subject: 'general',
                description: `"${topic}" ders notundan türetilmiş interaktif sezgisel simülasyon.`,
                grade_level: 'Not Entegreli',
                simulation_type: 'Sezgisel Simülasyon',
                gradient: 'bg-white border-[#292524]/15 hover:border-[#8C4A00]'
              });
              setCurrentView('simulator');
            }}
            onSaveSimulation={handleSaveSimulation}
          />
        )}
      </main>

      {/* Auth Modal Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#292524]/10 py-8 px-6 bg-[#FDFCF9] text-xs font-label font-semibold text-[#292524]/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <span className="font-headline text-xl font-bold text-[#292524]">Kavra</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-[#292524]/70 uppercase tracking-wider">
            <a href="#iletisim" className="hover:text-[#8C4A00] transition">İletişim</a>
            <a href="#kosullar" className="hover:text-[#8C4A00] transition">Kullanım Koşulları</a>
            <a href="#gizlilik" className="hover:text-[#8C4A00] transition">Gizlilik Politikası</a>
            <a href="#kvkk" className="hover:text-[#8C4A00] transition">KVKK</a>
          </div>

          <p className="text-[11px]">© 2026 Kavra. Tüm Hakları Saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
