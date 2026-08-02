import React, { useState, useRef } from 'react';
import { 
  Box, 
  Layers, 
  Atom, 
  RotateCw, 
  RotateCcw, 
  Camera, 
  Download, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Grid,
  Activity,
  Maximize2,
  Minimize2,
  Check
} from 'lucide-react';

export interface StudioModelItem {
  id: string;
  title: string;
  category: string;
  badge: 'Karmaşık' | 'Organel' | 'AI Üretimi';
  description: string;
  visualColor: string;
  organelles: string[];
  html_code?: string;
  biologicalNotes?: string[];
  occurrence?: {
    title: string;
    description: string;
  };
  isFavorite?: boolean;
}

const PRESET_STUDIO_MODELS: StudioModelItem[] = [];

interface CellArchitectureStudioProps {
  userMaterials?: StudioModelItem[];
}

export const CellArchitectureStudio: React.FC<CellArchitectureStudioProps> = ({
  userMaterials = []
}) => {
  const allMaterials = [...userMaterials, ...PRESET_STUDIO_MODELS];
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(allMaterials[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dynamic Interactive View Modes & Controls
  const [viewMode, setViewMode] = useState<'3d' | 'cross' | 'isolate'>('3d');
  const [isCrossSectionActive, setIsCrossSectionActive] = useState<boolean>(false);
  const [rotationDegree, setRotationDegree] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isIsolated, setIsIsolated] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);

  const activeMaterial = allMaterials.find((m) => m.id === selectedMaterialId) || allMaterials[0];

  const filteredMaterials = allMaterials.filter((m) => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Dynamic Rotate Action
  const handleRotateToggle = () => {
    if (isAutoRotating) {
      setIsAutoRotating(false);
      showToast("Döndürme durduruldu.");
    } else {
      setIsAutoRotating(true);
      setRotationDegree((prev) => (prev + 90) % 360);
      showToast("360° Döndürme aktif.");
    }
  };

  // Dynamic Reset View Action
  const handleResetView = () => {
    setRotationDegree(0);
    setIsAutoRotating(false);
    setIsCrossSectionActive(false);
    setViewMode('3d');
    setIsIsolated(false);
    showToast("Görünüm varsayılana sıfırlandı.");
  };

  // Dynamic Isolate Action
  const handleIsolateToggle = () => {
    setIsIsolated(!isIsolated);
    setViewMode(isIsolated ? '3d' : 'isolate');
    showToast(isIsolated ? "İzolasyon modundan çıkıldı." : "Materyal izole edildi.");
  };

  // Dynamic Screenshot Action
  const handleScreenshot = () => {
    showToast("📸 Ekran görüntüsü indiriliyor...");
    const link = document.createElement('a');
    link.download = `${activeMaterial?.title.replace(/\s+/g, '_') || '3D_Materyal'}_Screenshot.png`;
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#FDFCF9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#8C4A00">Kavra 3D: ${activeMaterial?.title || 'Materyal'}</text></svg>`;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // Dynamic 3D Export Action
  const handleExport3D = () => {
    if (!activeMaterial) return;
    showToast("📦 3D Materyal paketi indiriliyor (.html / .3d)");
    const blob = new Blob([activeMaterial.html_code || `<h1>${activeMaterial.title}</h1>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeMaterial.title.replace(/\s+/g, '_')}_3D_Model.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto py-6 text-[#292524] flex flex-col gap-6 px-4 md:px-8 font-body">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[120] bg-[#8C4A00] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-label font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section Header */}
      <div className="flex flex-col gap-2 border-b border-[#292524]/10 pb-4">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#292524]">
          Materyaller
        </h1>
        <p className="text-xs text-[#292524]/75 font-medium leading-relaxed max-w-3xl">
          Kayıtlı ve AI ile ürettiğiniz 3D bilimsel materyalleri interaktif tezgahta inceleyin, kesit modlarını (Cross-Section) çalıştırın ve detaylı biyolojik işlevlerini öğrenin.
        </p>
      </div>

      {/* Main Studio Grid (Empty State or 3-Column Layout) */}
      {allMaterials.length === 0 ? (
        <div className="glass-card bg-[#F3EFEA] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 border border-[#292524]/12 shadow-sm font-label my-4">
          <div className="p-4 rounded-full bg-[#FFFBEB] border border-[#8C4A00]/20 text-[#8C4A00]">
            <Box className="w-10 h-10" />
          </div>
          <h3 className="font-headline text-2xl font-bold text-[#292524]">Henüz Kaydedilmiş 3D Materyaliniz Yok</h3>
          <p className="text-xs text-[#292524]/75 max-w-md font-medium leading-relaxed">
            Simülatör sekmesindeki <strong>+</strong> menüsünden <strong>"Materyal Üret"</strong> seçeneğini seçip istem yazarak ilk 3D materyalinizi üretebilirsiniz. Üretilen tüm 3D materyaller buraya otomatik kaydedilir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
          {/* LEFT COLUMN: MATERYALLERİM LIST */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="glass-card bg-[#F3EFEA] rounded-2xl p-5 border border-[#292524]/12 shadow-sm flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-label font-extrabold uppercase tracking-wider text-[#8C4A00] flex items-center gap-1.5">
                  <Grid className="w-4 h-4" /> Materyallerim ({filteredMaterials.length})
                </h3>
              </div>

              {/* Search Bar */}
              <div className="relative w-full font-label">
                <Search className="w-3.5 h-3.5 text-[#292524]/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Materyallerde ara..."
                  className="w-full bg-[#ffffff] text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-[#0f172a]/15 focus:outline-none focus:border-[#094cb2]"
                />
              </div>

              {/* Materials List */}
              <div className="flex flex-col gap-2.5 max-h-[680px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredMaterials.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => setSelectedMaterialId(mat.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition ${
                      selectedMaterialId === mat.id || (!selectedMaterialId && mat.id === activeMaterial?.id)
                        ? 'bg-[#094cb2] text-white shadow-md border border-[#094cb2]'
                        : 'bg-[#ffffff] text-[#0f172a] hover:bg-[#e2e8f0] border border-[#0f172a]/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full overflow-hidden">
                      {/* Material 3D Image / Thumbnail Preview */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border shadow-inner ${
                        selectedMaterialId === mat.id || (!selectedMaterialId && mat.id === activeMaterial?.id) ? 'bg-white/20 border-white/40 text-white' : 'bg-[#e2e8f0] border-[#0f172a]/10 text-[#094cb2]'
                      }`}>
                        {mat.html_code ? (
                          <iframe
                            srcDoc={mat.html_code}
                            title={mat.title}
                            className="w-full h-full border-0 pointer-events-none scale-125"
                            sandbox="allow-scripts"
                          />
                        ) : (
                          <Atom className="w-6 h-6 animate-pulse" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 truncate">
                        <h4 className="text-xs font-bold font-label truncate">{mat.title}</h4>
                        <span className={`text-[10px] font-semibold ${selectedMaterialId === mat.id || (!selectedMaterialId && mat.id === activeMaterial?.id) ? 'text-white/80' : 'text-[#0f172a]/60'}`}>
                          {mat.badge === 'AI Üretimi' ? 'AI Üretimi' : mat.category}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* CENTER COLUMN: INTERACTIVE 3D WORKBENCH STAGE */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className={`glass-card bg-[#f1f5f9] rounded-2xl p-6 border border-[#0f172a]/12 shadow-sm flex flex-col gap-4 relative auremin-grid transition-all ${
              isIsolated ? 'ring-4 ring-[#094cb2] shadow-2xl scale-[1.01]' : ''
            }`}>
              
              {/* Stage Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0f172a]/10 pb-4">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-[#0f172a]">{activeMaterial?.title}</h2>
                  <p className="text-xs text-[#0f172a]/70 font-semibold font-label">{activeMaterial?.category}</p>
                </div>

                {/* Dynamic View Mode & Cross-Section Controls */}
                <div className="flex items-center gap-3">
                  {/* View Mode Buttons */}
                  <div className="flex items-center gap-1 p-1 bg-[#ffffff] rounded-xl border border-[#0f172a]/15 text-xs font-label">
                    <button
                      onClick={() => { setViewMode('3d'); setIsCrossSectionActive(false); showToast("3D Görünüm açıldı."); }}
                      className={`p-2 rounded-lg transition ${viewMode === '3d' && !isCrossSectionActive ? 'bg-[#094cb2] text-white' : 'text-[#0f172a]/70 hover:text-[#0f172a]'}`}
                      title="3D Görünüm"
                    >
                      <Box className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setViewMode('cross'); setIsCrossSectionActive(true); showToast("Cross-Section Kesit Modu açıldı."); }}
                      className={`p-2 rounded-lg transition ${viewMode === 'cross' || isCrossSectionActive ? 'bg-[#094cb2] text-white' : 'text-[#0f172a]/70 hover:text-[#0f172a]'}`}
                      title="Cross-Section Kesit Modu"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleIsolateToggle}
                      className={`p-2 rounded-lg transition ${isIsolated ? 'bg-[#094cb2] text-white' : 'text-[#0f172a]/70 hover:text-[#0f172a]'}`}
                      title="İzolasyon Modu"
                    >
                      <Atom className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cross-Section Switch */}
                  <div className="flex items-center gap-2 bg-[#FDFCF9] px-3 py-1.5 rounded-xl border border-[#292524]/15 text-xs font-label">
                    <span className="text-[11px] font-bold text-[#292524]/80">Cross-Section</span>
                    <input
                      type="checkbox"
                      checked={isCrossSectionActive}
                      onChange={(e) => {
                        setIsCrossSectionActive(e.target.checked);
                        setViewMode(e.target.checked ? 'cross' : '3d');
                        showToast(e.target.checked ? "Kesit modu aktif" : "Kesit modu kapalı");
                      }}
                      className="accent-[#8C4A00] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Tip Sticky Note Box */}
              <div className="bg-[#FFFBEB] border border-[#8C4A00]/20 rounded-xl p-2.5 text-[11px] font-semibold text-[#8C4A00] flex items-center justify-between">
                <span>Tip: Drag to rotate, Scroll to zoom, Ctrl + drag to pan</span>
                <span className="text-[10px] font-bold uppercase bg-[#8C4A00] text-white px-2 py-0.5 rounded">
                  {isCrossSectionActive ? 'Kesit Açık' : isAutoRotating ? 'Döndürme Aktif' : '3D Mod'}
                </span>
              </div>

              {/* FULL-HEIGHT 3D CANVAS / STAGE (680px Height!) */}
              <div 
                ref={stageRef}
                className="relative w-full h-[680px] bg-[#FDFCF9] rounded-xl border border-[#292524]/15 flex items-center justify-center overflow-hidden shadow-inner"
              >
                {activeMaterial?.html_code ? (
                  <iframe
                    srcDoc={activeMaterial.html_code}
                    title={activeMaterial.title}
                    className={`w-full h-full rounded-xl border-0 transition-transform duration-500 ${
                      isAutoRotating ? 'scale-105' : ''
                    } ${isCrossSectionActive ? 'contrast-125' : ''}`}
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div 
                    className="relative transition-transform duration-500 flex items-center justify-center"
                    style={{ transform: `rotateY(${rotationDegree}deg) scale(1.1)` }}
                  >
                    <div className="w-80 h-64 rounded-3xl bg-gradient-to-br from-[#F3EFEA] via-[#FDFCF9] to-[#EAE7E1] border-2 border-[#292524]/20 shadow-2xl relative flex items-center justify-center overflow-hidden p-4 auremin-grid">
                      <div className="absolute inset-2 rounded-2xl border-4 border-dashed border-[#8C4A00]/30 pointer-events-none" />

                      {isCrossSectionActive && (
                        <div className="absolute inset-y-0 right-0 w-1/2 bg-[#8C4A00]/10 border-l-2 border-[#8C4A00]/30 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#8C4A00] bg-white px-2 py-0.5 rounded border border-[#8C4A00]/20">
                            Cross-Section
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-3 relative z-10">
                        <div className={`p-5 rounded-full bg-gradient-to-br ${activeMaterial?.visualColor || 'from-[#8C4A00] to-[#D97706]'} text-white shadow-xl ${isAutoRotating ? 'animate-spin' : 'animate-pulse'}`}>
                          <Atom className="w-12 h-12" />
                        </div>
                        <span className="text-xs font-bold text-[#292524] bg-white/90 px-3 py-1 rounded-full border border-[#292524]/15 shadow-sm font-label">
                          {activeMaterial?.title}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DYNAMIC BOTTOM CONTROL TOOLBAR (Placed neatly BELOW the 3D Stage) */}
              <div className="flex items-center justify-between gap-2 flex-wrap bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#0f172a]/15 text-xs shadow-md font-label">
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRotateToggle}
                    className={`py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 rounded-xl transition ${
                      isAutoRotating 
                        ? 'bg-[#094cb2] text-white shadow-sm' 
                        : 'bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0] border border-[#0f172a]/15'
                    }`}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} /> 
                    <span>{isAutoRotating ? 'Rotate ON' : 'Rotate'}</span>
                  </button>

                  <button
                    onClick={handleIsolateToggle}
                    className={`py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 rounded-xl transition ${
                      isIsolated 
                        ? 'bg-[#094cb2] text-white shadow-sm' 
                        : 'bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0] border border-[#0f172a]/15'
                    }`}
                  >
                    {isIsolated ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isIsolated ? 'Isolated' : 'Isolate'}</span>
                  </button>

                  <button
                    onClick={handleResetView}
                    className="py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 rounded-xl bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0] border border-[#0f172a]/15 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset View
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleScreenshot}
                    className="kavra-btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" /> Screenshot
                  </button>
                  
                  <button
                    onClick={handleExport3D}
                    className="kavra-btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> 3D Export
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: MATERYAL NOTLARI & DETAYLARI */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Main Material Notes Card */}
            <div className="glass-card bg-[#F3EFEA] rounded-2xl p-5 border border-[#292524]/12 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#292524]/10 pb-3">
                <h3 className="text-xs font-label font-extrabold uppercase tracking-wider text-[#8C4A00] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8C4A00]" /> MATERYAL NOTLARI
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-headline text-lg font-bold text-[#292524]">{activeMaterial?.title}</h4>
                
                {/* Scientific Explanation / Description */}
                <p className="text-xs text-[#292524]/85 font-medium leading-relaxed bg-[#FDFCF9] p-3.5 rounded-xl border border-[#292524]/10 shadow-sm">
                  {activeMaterial?.description}
                </p>

                {/* Biological Facts */}
                {activeMaterial?.biologicalNotes && activeMaterial.biologicalNotes.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 text-xs">
                    <span className="text-[11px] font-label font-bold text-[#8C4A00] uppercase">Önemli İşlevler & Notlar:</span>
                    <ul className="flex flex-col gap-2">
                      {activeMaterial.biologicalNotes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-medium text-[#292524]/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 mt-0.5 flex-shrink-0" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Where It Occurs Card */}
            {activeMaterial?.occurrence && (
              <div className="glass-card bg-[#FDFCF9] rounded-2xl p-5 border border-[#292524]/12 shadow-sm flex flex-col gap-2">
                <h3 className="text-xs font-label font-extrabold uppercase tracking-wider text-[#8C4A00] flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> BİYOLOJİK KONUM
                </h3>
                <h4 className="text-xs font-bold text-[#292524] font-label">{activeMaterial.occurrence.title}</h4>
                <p className="text-xs text-[#292524]/75 font-medium leading-relaxed">
                  {activeMaterial.occurrence.description}
                </p>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
};
