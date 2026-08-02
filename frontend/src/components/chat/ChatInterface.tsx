import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Plus, Send, Atom, Box, Image as ImageIcon, Video, Bot, User, CheckCircle2, Maximize2, X, ChevronDown } from 'lucide-react';
import type { StudioModelItem } from '../studio/CellArchitectureStudio';
import type { ExperimentItem } from '../library/LibraryPage';

export type OutputMode = 'simulate' | '3d' | 'image' | 'video';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  mode: OutputMode;
  html_code?: string;
  timestamp: string;
  savedToMaterials?: boolean;
}

interface ChatInterfaceProps {
  onSimulateRequest: (topic: string, mode: OutputMode) => Promise<string | null>;
  guestTrialLeft: number;
  onRequireAuth: () => void;
  onSaveMaterial?: (material: StudioModelItem) => void;
  onSaveSimulation?: (experiment: ExperimentItem) => void;
  initialSimulation?: ExperimentItem | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSimulateRequest,
  guestTrialLeft,
  onRequireAuth,
  onSaveMaterial,
  onSaveSimulation,
  initialSimulation,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<OutputMode>('simulate');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullscreenHtml, setFullscreenHtml] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialSimulation && initialSimulation.html_code) {
      setMessages([
        {
          id: 'init-sim-' + Date.now(),
          sender: 'ai',
          text: `Laboratuvar Kütüphanenizden "${initialSimulation.title}" simülasyonu yüklendi.`,
          mode: 'simulate',
          html_code: initialSimulation.html_code,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          savedToMaterials: true
        }
      ]);
    }
  }, [initialSimulation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const cleanTextTitle = (rawText: string): string => {
    let text = rawText.trim();
    text = text.replace(/^(bana|lütfen|detaylarıyla|detaylı|bir|hakkında|anlat|çiz|üret|göster|simüle\set|simülasyonu)\s+/gi, '');
    text = text.replace(/\s+(anlatacağım|anlat|çiz|üret|göster|yapısı|simülasyonu|modeli|konusu)$/gi, '');
    text = text.trim();
    if (!text) return 'Simülasyon Deneyi';
    return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const handleSend = async () => {
    if (!inputPrompt.trim() || isLoading) return;

    if (guestTrialLeft <= 0) {
      onRequireAuth();
      return;
    }

    const userText = inputPrompt.trim();
    const currentMode = selectedMode;
    setInputPrompt('');
    setIsMenuOpen(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      mode: currentMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const generatedHtml = await onSimulateRequest(userText, currentMode);
      if (generatedHtml) {
        let isSaved = false;

        // Auto-save generated 3D material to Materyaller studio tab
        if (currentMode === '3d' && onSaveMaterial) {
          const cleanTitle = cleanTextTitle(userText);
          const cleanDesc = `${cleanTitle} yapısını, hücresel/moleküler katmanlarını ve biyolojik işlevlerini 3B ortamlarda inceleyen özel bilimsel materyal.`;

          onSaveMaterial({
            id: 'mat-' + Date.now(),
            title: cleanTitle,
            category: 'AI Üretimi',
            badge: 'AI Üretimi',
            description: cleanDesc,
            visualColor: 'from-[#8C4A00] via-[#D97706] to-[#B45309]',
            organelles: [],
            html_code: generatedHtml
          });
          isSaved = true;
        }

        // Auto-save generated simulation to Laboratuvar Kütüphanesi
        if (currentMode === 'simulate' && onSaveSimulation) {
          const cleanTitle = cleanTextTitle(userText);
          onSaveSimulation({
            id: 'exp-' + Date.now(),
            title: cleanTitle,
            subject: 'general',
            description: `"${cleanTitle}" konusu için özel olarak üretilmiş interaktif sezgisel simülasyon.`,
            grade_level: 'Etkileşimli',
            simulation_type: 'Sezgisel Simülasyon',
            gradient: 'bg-white border-[#292524]/15 hover:border-[#8C4A00]',
            html_code: generatedHtml,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          isSaved = true;
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: currentMode === '3d'
            ? `"${userText}" konusu için 3D materyal üretildi ve Materyaller sekmenize otomatik kaydedildi!`
            : `"${userText}" konusu için interaktif sezgi simülasyonu üretildi ve Laboratuvar Kütüphanenize otomatik kaydedildi!`,
          mode: currentMode,
          html_code: generatedHtml,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          savedToMaterials: isSaved
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'İçerik üretilirken bir hata oluştu veya üyelik sınırına ulaşıldı.',
          mode: currentMode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const modeLabels: Record<OutputMode, { label: string; icon: React.ReactNode }> = {
    simulate: { label: 'Simüle Et', icon: <Atom className="w-4 h-4" /> },
    '3d': { label: 'Materyal Üret', icon: <Box className="w-4 h-4" /> },
    image: { label: 'Görsel', icon: <ImageIcon className="w-4 h-4" /> },
    video: { label: 'Video', icon: <Video className="w-4 h-4" /> },
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-140px)] min-h-[620px] rounded-3xl overflow-hidden kavra-chat-gradient p-4 md:p-8 relative shadow-inner font-body">
      
      {/* If No Messages Yet: Show Hero Layout */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto gap-6 z-10">

          {/* Heading (Literata Headline) */}
          <h1 className="text-3xl md:text-5xl font-headline font-bold text-[#292524] tracking-tight leading-tight">
            Selam Batuhan, bugün ne keşfetmek istersin?
          </h1>

          {/* Floating Search Dock */}
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-full p-2.5 shadow-2xl border border-white/80 flex items-center gap-3 relative mt-4">
            
            {/* Plus (+) Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-full hover:bg-[#F3EFEA] transition text-[#292524]/70 font-bold"
              title="Seçenekler (+)"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Input */}
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Kavra'ya bir konu yaz veya bir dosya yükle..."
              className="flex-1 bg-transparent text-[#292524] placeholder-[#292524]/50 px-2 py-2 text-sm font-semibold focus:outline-none"
            />

            {/* Dropdown Selector */}
            <div className="relative font-label">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1.5 bg-[#F3EFEA] hover:bg-[#EAE7E1] text-[#292524] px-3.5 py-2 rounded-full text-xs font-bold transition border border-[#292524]/10"
              >
                <span>{modeLabels[selectedMode].label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#292524]/70" />
              </button>

              {/* Popup Menu */}
              {isMenuOpen && (
                <div className="absolute bottom-full right-0 mb-3 w-56 bg-white rounded-2xl p-2 border border-[#0f172a]/15 shadow-2xl z-50 text-[#0f172a]">
                  <div className="text-[10px] font-bold text-[#0f172a]/60 px-3 py-1.5 uppercase">Üretim Modu</div>
                  <button
                    onClick={() => { setSelectedMode('simulate'); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${selectedMode === 'simulate' ? 'bg-[#094cb2] text-white' : 'hover:bg-[#f1f5f9]'}`}
                  >
                    <Atom className="w-4 h-4" /> Simüle Et
                  </button>
                  <button
                    onClick={() => { setSelectedMode('3d'); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${selectedMode === '3d' ? 'bg-[#094cb2] text-white' : 'hover:bg-[#f1f5f9]'}`}
                  >
                    <Box className="w-4 h-4" /> Materyal Üret
                  </button>
                </div>
              )}
            </div>

            {/* Microphone / Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || !inputPrompt.trim()}
              className="p-3 rounded-full bg-[#f1f5f9] hover:bg-[#094cb2] text-[#0f172a] hover:text-white transition disabled:opacity-40"
              title="Gönder"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

        </div>
      ) : (
        /* Messages Scroll Area (Centered & Balanced Layout) */
        <div className="flex-1 overflow-y-auto space-y-6 px-2 md:px-8 mb-4 scrollbar-thin max-w-5xl mx-auto w-full">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#0f172a] text-white'
                    : 'bg-[#094cb2] text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`rounded-2xl p-4 text-sm leading-relaxed transition-all ${
                  msg.html_code ? 'w-full max-w-full' : 'max-w-[85%] sm:max-w-[70%]'
                } ${
                  msg.sender === 'user'
                    ? 'bg-[#0f172a] text-white rounded-tr-none shadow-md font-medium border border-[#0f172a]/20'
                    : 'bg-white/95 text-[#0f172a] border border-[#0f172a]/15 rounded-tl-none font-medium backdrop-blur-md shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2 border-b border-current/10 pb-1.5 font-label">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {msg.sender === 'user' ? 'Sen' : 'Kavra AI Lab'}
                  </span>
                  <span className="text-[10px] opacity-60 font-semibold">{msg.timestamp}</span>
                </div>

                <p className="text-sm">{msg.text}</p>

                {msg.savedToMaterials && (
                  <div className="mt-2 text-xs font-bold text-[#0D9488] bg-[#E6F4F1] p-2 rounded-lg border border-[#0D9488]/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Bu 3D materyal <strong>Materyaller</strong> sekmenize kaydedildi!</span>
                  </div>
                )}

                {msg.html_code && (
                  <div className="mt-4 w-full bg-[#FDFCF9] rounded-xl p-3 border border-[#292524]/15 shadow-lg overflow-hidden auremin-grid">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 mb-3 bg-white/90 rounded-lg border border-[#292524]/10 text-xs text-[#292524] font-label">
                      <span className="flex items-center gap-1.5 font-bold text-[#0D9488]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {msg.mode === '3d' ? '3D Üretilen Materyal' : 'Kavramsal Sezgi Simülatörü'}
                      </span>
                      <button
                        onClick={() => setFullscreenHtml(msg.html_code || null)}
                        className="kavra-btn-primary py-1.5 px-3 text-[11px]"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Tam Ekran Laboratuvarda Aç
                      </button>
                    </div>
                    <iframe
                      srcDoc={msg.html_code}
                      title="Kavra Result"
                      className="w-full h-[600px] rounded-lg border border-[#292524]/10 bg-[#FDFCF9] block overflow-hidden shadow-inner"
                      sandbox="allow-scripts"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3.5 max-w-5xl mx-auto w-full">
              <div className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-white/95 text-[#292524] rounded-2xl rounded-tl-none p-4 text-xs font-bold flex items-center gap-3 border border-[#292524]/15 shadow-md font-label">
                <Sparkles className="w-4 h-4 text-[#0D9488] animate-spin" />
                <span>
                  {selectedMode === '3d'
                    ? 'Wiro AI Nano Banana 2 ile 3D materyal görseli üretiliyor & Trellis 2 ile 3D mesh oluşturuluyor...'
                    : 'Wiro AI Gemini 3.1 Pro ile pedagojik şema kurguluyor & GPT-5.6 Sol ile sezgi simülasyonu kodluyor...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Persistent Bottom Input Bar (Centered) */}
      {messages.length > 0 && (
        <div className="relative bg-white/95 backdrop-blur-xl rounded-full p-2.5 shadow-2xl border border-white/80 flex items-center gap-3 max-w-4xl mx-auto w-full">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 rounded-full hover:bg-[#F3EFEA] transition text-[#292524]/70 font-bold"
          >
            <Plus className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Kavra'ya bir konu yaz veya bir dosya yükle..."
            className="flex-1 bg-transparent text-[#292524] placeholder-[#292524]/50 px-2 py-2 text-sm font-semibold focus:outline-none"
          />

          <button
            onClick={handleSend}
            disabled={isLoading || !inputPrompt.trim()}
            className="kavra-btn-primary p-3 rounded-full disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fullscreen Workbench Modal */}
      {fullscreenHtml && (
        <div className="fixed inset-0 z-[100] bg-[#0f172a]/90 backdrop-blur-md p-4 md:p-6 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 bg-white border border-[#0f172a]/20 rounded-t-2xl text-[#0f172a] shadow-sm font-label">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#094cb2] text-white shadow-sm">
                <Atom className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-headline font-extrabold text-[#0f172a]">
                  Kavra AI Tam Ekran Laboratuvar Masası
                </h3>
                <p className="text-xs text-[#0f172a]/70 font-semibold">Scrollbarsız, tam ferahlıkta profesyonel bilimsel etkileşim ekranı</p>
              </div>
            </div>
            <button
              onClick={() => setFullscreenHtml(null)}
              className="p-2.5 rounded-xl bg-white text-[#0f172a] border border-[#0f172a]/20 transition shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 w-full bg-white rounded-b-2xl border border-t-0 border-[#0f172a]/20 p-2 overflow-hidden auremin-grid shadow-2xl">
            <iframe
              srcDoc={fullscreenHtml}
              title="Kavra Fullscreen Studio"
              className="w-full h-full rounded-xl border-0 bg-white block"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
};
