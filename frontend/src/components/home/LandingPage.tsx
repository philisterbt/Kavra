import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  FlaskConical, 
  Check, 
  X,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onStartSimulator: () => void;
  onExploreLibrary: () => void;
  onOpenNotebook: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSimulator,
  onExploreLibrary,
}) => {
  return (
    <div className="w-full text-[#292524] flex flex-col gap-20 py-8 max-w-7xl mx-auto px-4 md:px-6 font-body">
      
      {/* Hero Section (Ezberleme Mantığını KAVRA Layout - Full Initial Viewport) */}
      <section className="w-full min-h-[calc(100vh-140px)] flex flex-col justify-center pt-2 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12">
          
          {/* Left Column: Giant Editorial Serif Typography */}
          <div className="lg:col-span-6 flex flex-col items-start text-left gap-4">
            <h1 className="font-headline text-5xl sm:text-7xl lg:text-[84px] font-black text-[#0f172a] tracking-tight leading-[0.95] select-none">
              Ezberleme,<br />
              Mantığını<br />
              <span className="font-extrabold tracking-wider uppercase">KAVRA.</span>
            </h1>

            <div className="mt-4 sm:mt-6 flex flex-col gap-1 text-left">
              <p className="font-headline text-base sm:text-xl text-[#0f172a]/80 font-medium leading-snug">
                Anlamadığın her konu, kendi rafında bekliyor.
              </p>
            </div>

            {/* Single CTA Button: Hemen Dene (Alexandria Gradient Fill #094cb2 -> #1d64d8) */}
            <div className="mt-6 font-label">
              <button
                onClick={onStartSimulator}
                className="bg-gradient-to-r from-[#094cb2] to-[#1d64d8] hover:from-[#073b8c] hover:to-[#1754b8] text-white py-3.5 px-8 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 transition hover:scale-105"
              >
                <span>Hemen Dene</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Right Column: 3D Isometric Glass Shelf Graphic */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <div className="relative w-full max-w-lg lg:max-w-xl group">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#D97706]/10 via-[#0D9488]/10 to-[#4F46E5]/10 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition duration-500" />
              <img
                src="/fland.svg"
                alt="Ezberleme Mantığını Kavra Visual"
                className="relative w-full h-auto object-contain rounded-2xl drop-shadow-2xl transition transform group-hover:scale-[1.02] duration-300"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Section 2: Nasıl Çalışır? (Pushed Below the Fold) */}
      <section className="flex flex-col items-center gap-10 pt-24 md:pt-36 border-t border-[#292524]/10">
        <div className="text-center">
          <h2 className="font-headline text-3xl md:text-4xl text-[#292524]">Nasıl Çalışır?</h2>
          <div className="w-12 h-1 bg-[#D97706] mx-auto mt-2 rounded-full opacity-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="glass-card bg-[#F3EFEA] rounded-2xl p-8 border border-[#292524]/10 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#FFFBEB] border border-amber-200 flex items-center justify-center text-[#D97706]">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-headline text-xl font-bold text-[#292524]">1. Konu Yaz / PDF Yükle</h3>
            <p className="text-xs text-[#292524]/75 font-medium leading-relaxed">
              Öğrenmek istediğiniz konuyu metin olarak girin veya ders notlarınızı yükleyin.
            </p>
          </div>

          <div className="glass-card bg-[#F3EFEA] rounded-2xl p-8 border border-[#292524]/10 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#CCFBF1] border border-teal-200 flex items-center justify-center text-[#0D9488]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-headline text-xl font-bold text-[#292524]">2. AI Simülasyon Üret</h3>
            <p className="text-xs text-[#292524]/75 font-medium leading-relaxed">
              Yapay zeka metin veya dosya içeriğini analiz eder ve etkileşimli, 3 boyutlu bir öğrenme deneyimi oluşturur.
            </p>
          </div>

          <div className="glass-card bg-[#F3EFEA] rounded-2xl p-8 border border-[#292524]/10 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#EEF2FF] border border-indigo-200 flex items-center justify-center text-[#4F46E5]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h3 className="font-headline text-xl font-bold text-[#292524]">3. Lab'ına Kaydedilir</h3>
            <p className="text-xs text-[#292524]/75 font-medium leading-relaxed">
              Oluşturulan deney kalıcı olarak kişisel dijital laboratuvarınıza eklenir, dilediğiniz zaman tekrar edilir.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Laboratuvar Kütüphanesi */}
      <section className="flex flex-col gap-8">
        <div className="flex items-end justify-between border-b border-[#292524]/10 pb-4">
          <div>
            <h2 className="font-headline text-3xl text-[#292524]">Laboratuvar Kütüphanesi</h2>
            <p className="text-xs text-[#292524]/70 font-semibold mt-1">Popüler simülasyonları keşfedin</p>
          </div>
          <button
            onClick={onExploreLibrary}
            className="text-xs font-label font-bold text-[#8C4A00] hover:underline flex items-center gap-1"
          >
            <span>Tümünü gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 glass-card bg-gradient-to-r from-[#262626] to-[#171717] text-white rounded-3xl p-8 border border-white/10 flex flex-col justify-between h-64 relative overflow-hidden shadow-lg">
            <span className="px-3 py-1 rounded-full text-[10px] font-label font-bold badge-biology w-fit z-10">Biyoloji</span>
            <div className="z-10 max-w-md">
              <h3 className="font-headline text-2xl font-bold mb-2">DNA Replikasyonu ve Hücre Bölünmesi</h3>
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                Hücre bölündüğünde DNA molekülünün kendisini eşleme mekanizmasını nükleotit düzeyinde inceleyin.
              </p>
            </div>
            <button
              onClick={onStartSimulator}
              className="kavra-btn-primary py-2 px-4 text-xs font-bold w-fit z-10"
            >
              Simüle Et
            </button>
          </div>

          <div className="md:col-span-4 glass-card bg-[#F3EFEA] rounded-3xl p-6 border border-[#292524]/10 flex flex-col justify-between shadow-sm">
            <span className="px-3 py-1 rounded-full text-[10px] font-label font-bold badge-physics w-fit">Fizik</span>
            <div>
              <h3 className="font-headline text-xl font-bold text-[#292524] mb-1">Kuantum Dolaşıklık</h3>
              <p className="text-xs text-[#292524]/70 font-medium">
                Parçacıkların spin durumlarının birbirine bağımlı olduğu kuantum alanını keşfedin.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 glass-card bg-[#F3EFEA] rounded-3xl p-6 border border-[#292524]/10 flex flex-col justify-between shadow-sm">
            <span className="px-3 py-1 rounded-full text-[10px] font-label font-bold badge-chemistry w-fit">Kimya</span>
            <div>
              <h3 className="font-headline text-xl font-bold text-[#292524] mb-1">Kristal Kafes Yapıları</h3>
              <p className="text-xs text-[#292524]/70 font-medium">
                Kovalent ve iyonik kristal yapıların atomik dizilimini 3D inceleyin.
              </p>
            </div>
          </div>

          <div className="md:col-span-8 glass-card bg-[#F3EFEA] rounded-3xl p-6 border border-[#292524]/10 flex flex-row items-center justify-between shadow-sm gap-6">
            <div className="flex flex-col gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-label font-bold badge-biology w-fit">Biyoloji & Fizik</span>
              <h3 className="font-headline text-xl font-bold text-[#292524]">Fotosentez ve Termodinamik</h3>
              <p className="text-xs text-[#292524]/70 font-medium">
                Enerji dönüşümünün biyolojik ve fiziksel temellerini tek simülasyonda keşfedin.
              </p>
            </div>
            <div className="w-24 h-24 rounded-2xl bg-[#FDFCF9] border border-[#292524]/10 flex items-center justify-center text-[#292524] flex-shrink-0">
              <Play className="w-8 h-8 text-[#8C4A00]" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Fikirden Gerçeğe */}
      <section className="glass-card bg-[#F3EFEA] rounded-3xl p-8 md:p-12 border border-[#292524]/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-sm">
        <div className="flex flex-col gap-4">
          <h2 className="font-headline text-3xl md:text-4xl text-[#292524]">
            Fikirden Gerçeğe, Saniyeler İçinde
          </h2>
          <p className="text-xs md:text-sm text-[#292524]/80 font-medium leading-relaxed">
            Geleneksel ders kitaplarının sınırlarını aşın. Sadece ne öğrenmek istediğinizi söyleyin, Kavra sizin için interaktif bir deney tasarlasın.
          </p>

          <div className="flex flex-col gap-3 pt-2 text-xs font-bold text-[#292524]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
              <div>
                <span>Doğal Dil Anlama</span>
                <p className="text-[11px] font-normal text-[#292524]/70">Soru sorar gibi konu başlığı girin.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
              <div>
                <span>Anında Görselleştirme</span>
                <p className="text-[11px] font-normal text-[#292524]/70">Kavramları anında 3D modellere dönüştürün.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#292524]/10 shadow-md flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#292524]/70 border-b border-[#292524]/10 pb-3">
            <Sparkles className="w-4 h-4 text-[#8C4A00]" />
            <span>Simülasyon İstemi</span>
          </div>
          <div className="p-3 bg-[#F3EFEA] rounded-xl text-xs font-medium border border-[#292524]/10 text-[#292524]">
            "Nöron hücrelerinin yapısını, akson terminalini gösteren detaylı bir 3D model oluştur."
          </div>
          <div className="h-32 rounded-xl bg-[#EAE7E1] border border-[#292524]/10 flex flex-col items-center justify-center gap-2 text-xs font-bold text-[#292524]/70 auremin-grid">
            <FlaskConical className="w-6 h-6 animate-pulse text-[#8C4A00]" />
            <span>Hücre yapısı oluşturuluyor...</span>
          </div>
        </div>
      </section>

      {/* Section 5: Planlar */}
      <section className="flex flex-col items-center gap-10 py-4">
        <div className="text-center">
          <h2 className="font-headline text-3xl md:text-4xl text-[#292524]">Öğrenme Yolculuğunuzu Seçin</h2>
          <p className="text-xs text-[#292524]/70 font-semibold mt-1">Sade, şeffaf ve öğrenci dostu planlar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl font-label">
          <div className="glass-card bg-[#F3EFEA] rounded-3xl p-8 border border-[#292524]/10 flex flex-col justify-between gap-6 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#292524]/60">Kayıtsız</span>
              <p className="text-xs text-[#292524]/70 mt-0.5">Kaydolmaya gerek yok</p>
              <div className="mt-4 font-headline text-4xl font-bold text-[#292524]">₺0</div>

              <ul className="flex flex-col gap-3 mt-6 text-xs font-medium text-[#292524]/85">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>20 Ücretsiz deneme simülasyon üretimi</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Temel Laboratuvar Kütüphanesine erişim</span>
                </li>
                <li className="flex items-center gap-2 text-[#292524]/40 line-through">
                  <X className="w-4 h-4" />
                  <span>Kişisel Dijital Defterim</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onStartSimulator}
              className="kavra-btn-outline w-full py-3 text-xs"
            >
              Hemen Başla
            </button>
          </div>

          <div className="glass-card bg-[#F3EFEA] rounded-3xl p-8 border-2 border-[#8C4A00] flex flex-col justify-between gap-6 shadow-xl relative">
            <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#8C4A00] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
              EN ÇOK TERCİH EDİLEN
            </span>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C4A00]">Akademik</span>
              <p className="text-xs text-[#292524]/70 mt-0.5">Tam potansiyele erişin</p>
              <div className="mt-4 font-headline text-4xl font-bold text-[#292524]">₺149<span className="text-xs font-body font-normal text-[#292524]/70"> / ay</span></div>

              <ul className="flex flex-col gap-3 mt-6 text-xs font-medium text-[#292524]/85">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Sınırsız simülasyon üretimi</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>PDF yükleme ve analiz desteği</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Sınırsız Laboratuvar Kütüphanesi</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Kişisel Dijital Defterim depolama</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onStartSimulator}
              className="kavra-btn-primary w-full py-3 text-xs shadow-lg"
            >
              Aramıza Katıl
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
