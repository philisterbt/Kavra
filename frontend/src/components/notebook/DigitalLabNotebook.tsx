import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Heart, 
  Search, 
  Grid, 
  List, 
  FileText, 
  FlaskConical, 
  Microscope, 
  Calculator, 
  FileUp, 
  Loader2, 
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export interface SavedNote {
  id: number;
  title: string;
  subject: string;
  notes: string;
  saved_at: string;
  parameters?: string;
  pdf_filename?: string;
  topics?: string[];
  selectedTopic?: string;
  generated_html?: string;
  isGeneratingSim?: boolean;
  showSim?: boolean;
  isFavorite?: boolean;
}

const INITIAL_NOTES: SavedNote[] = [];

interface DigitalLabNotebookProps {
  onOpenTopicInSimulator?: (topic: string) => void;
  onSaveSimulation?: (experiment: any) => void;
}

export const DigitalLabNotebook: React.FC<DigitalLabNotebookProps> = ({
  onOpenTopicInSimulator,
  onSaveSimulation
}) => {
  const [notes, setNotes] = useState<SavedNote[]>(INITIAL_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal / Upload States
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Fizik');
  const [newContent, setNewContent] = useState('');

  // Inline simulation generation state per note
  const [generatingNoteId, setGeneratingNoteId] = useState<number | null>(null);

  const handleAddNote = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const entry: SavedNote = {
      id: Date.now(),
      title: newTitle.trim(),
      subject: newSubject,
      notes: newContent.trim(),
      saved_at: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }),
      topics: [newTitle.trim(), `${newSubject} Temel Kavramları`],
      showSim: false
    };
    setNotes([entry, ...notes]);
    setNewTitle('');
    setNewContent('');
    setIsNewNoteModalOpen(false);
  };

  const handleDelete = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const toggleFavorite = (id: number) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
  };

  const handlePdfFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/generate/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data && data.status === 'success') {
        const extractedTitle = data.topic || file.name.replace('.pdf', '');
        const newPdfNote: SavedNote = {
          id: Date.now(),
          title: extractedTitle,
          subject: 'Biyoloji',
          notes: data.extracted_text_preview || 'PDF içeriği başarıyla işlendi ve konular tespit edildi.',
          saved_at: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }),
          pdf_filename: file.name,
          topics: data.topics && data.topics.length > 0 ? data.topics : [extractedTitle, 'Hücre Yapısı ve Bölünmesi'],
          showSim: false
        };
        setNotes([newPdfNote, ...notes]);
      }
    } catch (err) {
      console.error('PDF parsing error:', err);
    } finally {
      setIsUploadingPdf(false);
      event.target.value = '';
    }
  };

  const handleGenerateInlineSimulation = async (noteId: number, topic: string) => {
    setGeneratingNoteId(noteId);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/generate/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, output_type: 'simulate' }),
      });
      const data = await res.json();
      if (data && data.html_code) {
        setNotes(prev => prev.map(n => {
          if (n.id === noteId) {
            return {
              ...n,
              generated_html: data.html_code,
              showSim: true,
              selectedTopic: topic
            };
          }
          return n;
        }));

        // Also save to library if callback available
        if (onSaveSimulation) {
          onSaveSimulation({
            id: 'exp-' + Date.now(),
            title: topic,
            subject: 'general',
            description: `"${topic}" notundan otomatik üretilmiş interaktif sezgi simülasyonu.`,
            grade_level: 'Not Entegreli',
            simulation_type: 'Sezgisel Simülasyon',
            gradient: 'bg-white border-[#292524]/15 hover:border-[#8C4A00]',
            html_code: data.html_code,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
    } catch (err) {
      console.error('Inline simulation generation error:', err);
    } finally {
      setGeneratingNoteId(null);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || n.subject.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-7xl mx-auto py-6 text-[#292524] font-body px-4 md:px-6">
      
      {/* Top Header Row (Literata Headline) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-[#292524]/10 pb-6">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-[#292524]">
            Dijital Defterim
          </h1>
          <p className="text-xs text-[#292524]/70 font-medium mt-1">
            Yüklediğiniz veya yazdığınız tüm ders notları AI simülasyon motoruna anında entegre edilir.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto font-label">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-[#292524]/50 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Defterde ara..."
              className="w-full bg-[#f1f5f9] text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-[#0f172a]/15 focus:outline-none focus:border-[#094cb2]"
            />
          </div>

          {/* Grid / List Toggles */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-xl border border-[#0f172a]/15 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-[#ffffff] text-[#094cb2]' : 'text-[#0f172a]/60'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-[#ffffff] text-[#094cb2]' : 'text-[#0f172a]/60'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Sidebar Upload & Categories */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* PDF Upload Dotted Box */}
          <label className="relative border-2 border-dashed border-[#8C4A00]/30 hover:border-[#8C4A00] bg-[#F3EFEA] hover:bg-[#FFFBEB] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-sm group">
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfFileUpload}
              disabled={isUploadingPdf}
              className="hidden"
            />
            {isUploadingPdf ? (
              <div className="flex flex-col items-center gap-2 text-[#8C4A00]">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold font-label">PDF İşleniyor & Konular Ayrıştırılıyor...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#0f172a]/15 flex items-center justify-center text-[#094cb2] shadow-sm group-hover:scale-105 transition">
                  <FileUp className="w-6 h-6" />
                </div>
                <h3 className="font-headline text-xl font-bold text-[#292524]">PDF Not Yükle</h3>
                <p className="text-xs text-[#292524]/70 font-medium leading-relaxed">
                  Ders notunuzu buraya sürükleyin. AI anında konuları çıkarıp <span className="text-[#8C4A00] underline font-bold font-label">simülasyon oluşturacaktır</span>.
                </p>
              </div>
            )}
          </label>

          {/* Categories List */}
          <div className="flex flex-col gap-2 font-label">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#292524]/60 px-2">Kategoriler</h4>
            
            <button
              onClick={() => setActiveCategory('all')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition text-left ${activeCategory === 'all' ? 'bg-[#F3EFEA] shadow-sm border border-[#292524]/15 text-[#8C4A00]' : 'text-[#292524]/80 hover:bg-[#F3EFEA]/60'}`}
            >
              <FileText className="w-4 h-4 text-[#8C4A00]" />
              <span>Tüm Notlar ({notes.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('fizik')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition text-left ${activeCategory === 'fizik' ? 'bg-[#F3EFEA] shadow-sm border border-[#292524]/15 text-[#8C4A00]' : 'text-[#292524]/80 hover:bg-[#F3EFEA]/60'}`}
            >
              <FlaskConical className="w-4 h-4 text-[#4F46E5]" />
              <span>Fizik Simülasyonları</span>
            </button>

            <button
              onClick={() => setActiveCategory('biyoloji')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition text-left ${activeCategory === 'biyoloji' ? 'bg-[#F3EFEA] shadow-sm border border-[#292524]/15 text-[#8C4A00]' : 'text-[#292524]/80 hover:bg-[#F3EFEA]/60'}`}
            >
              <Microscope className="w-4 h-4 text-[#0D9488]" />
              <span>Biyoloji Notları</span>
            </button>

            <button
              onClick={() => setActiveCategory('matematik')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition text-left ${activeCategory === 'matematik' ? 'bg-[#F3EFEA] shadow-sm border border-[#292524]/15 text-[#8C4A00]' : 'text-[#292524]/80 hover:bg-[#F3EFEA]/60'}`}
            >
              <Calculator className="w-4 h-4 text-[#D97706]" />
              <span>Matematik Formülleri</span>
            </button>
          </div>

        </div>

        {/* Right Column: Main Cards Grid */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {filteredNotes.length === 0 ? (
            <div className="glass-card bg-[#F3EFEA] rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3 border border-[#292524]/12 shadow-sm font-label">
              <FileText className="w-10 h-10 text-[#8C4A00]/60" />
              <h3 className="font-headline text-xl font-bold text-[#292524]">Henüz Not Yüklenmedi</h3>
              <p className="text-xs text-[#292524]/70 max-w-sm">
                Sol taraftan ders notu PDF'inizi yükleyerek veya yeni not ekleyerek anında AI simülasyonları üretebilirsiniz.
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
              {filteredNotes.map((n) => (
                <div key={n.id} className="glass-card bg-[#F3EFEA] rounded-3xl p-6 border border-[#292524]/12 flex flex-col justify-between shadow-sm relative group">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 font-label">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        n.subject === 'Fizik' ? 'badge-physics' : n.subject === 'Biyoloji' ? 'badge-biology' : 'badge-chemistry'
                      }`}>
                        {n.subject}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFavorite(n.id)}
                          className="p-1.5 text-[#292524]/40 hover:text-rose-500 transition"
                        >
                          <Heart className={`w-4 h-4 ${n.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-1.5 text-[#292524]/30 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-headline text-xl font-bold text-[#292524] mb-2">{n.title}</h3>

                    {n.pdf_filename ? (
                      <div className="my-3 p-3 bg-[#FDFCF9] rounded-xl border border-[#292524]/10 flex items-center gap-2 text-xs font-label font-bold text-[#292524]/80">
                        <FileText className="w-4 h-4 text-[#8C4A00] flex-shrink-0" />
                        <span className="truncate">{n.pdf_filename}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-[#292524]/75 font-medium leading-relaxed mb-4 line-clamp-3">
                        {n.notes}
                      </p>
                    )}

                    {/* AI Extracted Sub-Topics & Simulation Actions */}
                    {n.topics && n.topics.length > 0 && (
                      <div className="my-3 pt-3 border-t border-[#292524]/10 flex flex-col gap-2">
                        <span className="text-[10px] font-label font-bold text-[#8C4A00] uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#8C4A00]" /> TESBİT EDİLEN AI SİMÜLASYON KONULARI:
                        </span>
                        
                        <div className="flex flex-wrap gap-1.5 font-label">
                          {n.topics.map((tp, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleGenerateInlineSimulation(n.id, tp)}
                              disabled={generatingNoteId === n.id}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border ${
                                n.selectedTopic === tp && n.showSim 
                                  ? 'bg-[#8C4A00] text-white border-[#8C4A00]' 
                                  : 'bg-[#FDFCF9] text-[#8C4A00] hover:bg-[#8C4A00] hover:text-white border-[#292524]/15'
                              }`}
                              title={`"${tp}" konusunu bu not ekranında simüle et ve kütüphaneye kaydet`}
                            >
                              {generatingNoteId === n.id && n.selectedTopic === tp ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                              <span>{tp}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inline Generated Simulation Viewer */}
                    {n.showSim && n.generated_html && (
                      <div className="my-3 w-full bg-[#FDFCF9] rounded-2xl border border-[#8C4A00]/40 overflow-hidden relative shadow-md animate-in fade-in duration-300">
                        <div className="p-3 bg-[#8C4A00] text-white flex items-center justify-between text-xs font-label font-bold">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {n.selectedTopic} Simülasyonu (Kütüphaneye Kaydedildi)
                          </span>
                          <div className="flex items-center gap-2">
                            {onOpenTopicInSimulator && (
                              <button
                                onClick={() => onOpenTopicInSimulator(n.selectedTopic || n.title)}
                                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] transition font-bold"
                              >
                                Simülatörde Aç
                              </button>
                            )}
                            <button
                              onClick={() => setNotes(notes.map(item => item.id === n.id ? { ...item, showSim: false } : item))}
                              className="p-1 hover:bg-white/20 rounded-md transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="w-full h-80 bg-[#FDFCF9]">
                          <iframe
                            srcDoc={n.generated_html}
                            title={n.selectedTopic}
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-4 border-t border-[#292524]/10 flex items-center justify-between text-[11px] font-label font-bold gap-2">
                    <span className="flex items-center gap-1 text-[#292524]/60">
                      <Calendar className="w-3.5 h-3.5 text-[#8C4A00]" /> {n.saved_at}
                    </span>

                    <button
                      onClick={() => {
                        const targetTopic = n.topics && n.topics.length > 0 ? n.topics[0] : n.title;
                        handleGenerateInlineSimulation(n.id, targetTopic);
                      }}
                      disabled={generatingNoteId === n.id}
                      className="kavra-btn-primary py-2 px-4 text-xs flex items-center gap-1.5 font-bold shadow-md"
                    >
                      {generatingNoteId === n.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Simülasyon Üretiliyor...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> AI Simülasyon Oluştur
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Note Creation Dotted Card */}
          <div
            onClick={() => setIsNewNoteModalOpen(true)}
            className="border-2 border-dashed border-[#8C4A00]/30 hover:border-[#8C4A00] bg-[#F3EFEA] hover:bg-[#FFFBEB] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[200px] shadow-sm group"
          >
            <div className="w-12 h-12 rounded-full bg-white border border-[#292524]/15 flex items-center justify-center text-[#8C4A00] mb-3 group-hover:scale-110 transition shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-xl font-bold text-[#292524]">Yeni Not Oluştur</h3>
            <p className="text-xs text-[#292524]/70 font-medium mt-1">
              Boş bir sayfa açarak yazmaya başla ve AI simülasyonlarını bağla.
            </p>
          </div>

        </div>

      </div>

      {/* New Note Modal */}
      {isNewNoteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-[#1c1e1c]/80 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div className="glass-card bg-[#FDFCF9] rounded-3xl p-8 max-w-md w-full border border-[#292524]/20 shadow-2xl flex flex-col gap-4 text-[#292524]">
            <div className="flex items-center justify-between border-b border-[#292524]/15 pb-3">
              <h3 className="font-headline text-2xl font-bold">Yeni Not Ekle</h3>
              <button onClick={() => setIsNewNoteModalOpen(false)} className="p-1 text-[#292524]/60 hover:text-[#292524]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-label">
              <div>
                <label className="text-xs font-bold text-[#292524]/80 mb-1 block">Başlık</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Not başlığı..."
                  className="w-full bg-[#F3EFEA] text-xs font-semibold p-3 rounded-xl border border-[#292524]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#292524]/80 mb-1 block">Ders</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-[#F3EFEA] text-xs font-semibold p-3 rounded-xl border border-[#292524]/20 focus:outline-none"
                >
                  <option value="Fizik">Fizik</option>
                  <option value="Kimya">Kimya</option>
                  <option value="Biyoloji">Biyoloji</option>
                  <option value="Matematik">Matematik</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#292524]/80 mb-1 block">İçerik</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Notlarınızı yazın..."
                  className="w-full bg-[#F3EFEA] text-xs font-medium p-3 rounded-xl border border-[#292524]/20 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAddNote}
                className="kavra-btn-primary w-full py-3 text-xs mt-2"
              >
                Deftere Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
