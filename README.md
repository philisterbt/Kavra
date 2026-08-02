# Kavra AI Lab — AI Destekli Fen Bilimleri Laboratuvarı & Etkileşimli Simülasyon Platformu 🔬⚛️🧬

> **"Ezberleme, Mantığını KAVRA."**  
> Karmaşık fen bilimleri konseptlerini sezgisel 3D simülasyonlara ve deneylere dönüştüren yapay zeka destekli editoryal dijital laboratuvar platformu.

---

## 🌟 Proje Hakkında

**Kavra AI Lab**, fizik, kimya, biyoloji ve matematik konularını soyut tanımlardan kurtarıp öğrencilerin gözle deneyimleyebileceği etkileşimli simülasyonlara dönüştüren akademik bir platformdur. 

**"Alexandria — High-End Editorial"** akademik ve ferah tasarım diliyle geliştirilen platform, öğrencilerin doğal dilde sorduğu soruları veya yüklediği PDF ders notlarını analiz eder ve arka planda çalışan iki kademeli AI mimarisi ile anında taranabilir, çalıştırılabilir HTML5 Canvas simülasyonları üretir.

---

## ✨ Öne Çıkan Özellikler

- **🤖 Sezgisel AI Simülatör (`ChatInterface`)**:
  - Doğal dille yazılan fen bilimleri konularını (Örn: *"Newton'ın Eylemsizlik Yasası"*, *"DNA Replikasyonu"*) anında çalışabilir simülasyona dönüştürür.
  - **"Simüle Et"** (Canvas Animasyonları) ve **"Materyal Üret"** (3B Nesne Tasarımı) modları.
- **🎨 3D Materyal Tezgahı (`CellArchitectureStudio`)**:
  - Üretilen 3B biyolojik hücre, atom veya molekül yapılarını interaktif tezgahta inceleme.
  - **Cross-Section (Kesit Modu)**, **İzolasyon Modu**, **Otomatik Döndürme** ve **Ekran Görüntüsü (Screenshot)** alma.
- **📚 Laboratuvar Kütüphanesi (`LibraryPage`)**:
  - Üretilen tüm simülasyonların kişisel arşivde saklanması.
  - Simülasyonları **Tam Ekran (Fullscreen)** kesintisiz çalıştırma veya tekrar simülatöre aktarma.
- **📓 Dijital Defterim (`DigitalLabNotebook`)**:
  - PDF ders notlarını sürükleyip bırakarak yükleme.
  - AI ile not metnini alt konu başlıklarına ayırma ve tek tıkla nota özel simülasyon üretme.
- **🏛️ Alexandria Editorial Tasarım Sistemi**:
  - Noto Serif ve Public Sans editoryal tipografi, Kraliyet Mavisi (`#094cb2`) aksanları, cam efekti (glassmorphism) ve çizgisiz katman mimarisi.

---

## 🛠️ Teknolojik Mimari

### Frontend
- **Framework**: React 18 + Vite
- **Dil**: TypeScript
- **Stil & Tasarım**: Tailwind CSS + Custom Design System Tokens (Noto Serif, Inter, Public Sans)
- **İkon Seti**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Veritabanı**: SQLAlchemy + SQLite
- **Yapay Zeka Gateway**: Wiro AI Gateway
  - **Prompt Zenginleştirme**: `google/gemini-3-6-flash`
  - **Kod Üretimi**: `openai/gpt-5-6-sol`
  - **3D Boru Hattı**: `google/nano-banana-2` & `microsoft/trellis-2`

---

## 🚀 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/philisterbt/Kavra.git
cd Kavra
```

### 2. Backend Kurulumu ve Çalıştırma
```bash
cd backend
python -m venv venv

# Windows için:
venv\Scripts\activate
# Linux/macOS için:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend varsayılan olarak `http://localhost:8000` adresinde çalışacaktır. API Dokümantasyonuna `http://localhost:8000/docs` üzerinden erişebilirsiniz.

### 3. Frontend Kurulumu ve Çalıştırma
```bash
cd ../frontend
npm install
npm run dev
```
Frontend `http://localhost:5173` adresinde çalışacaktır.

---


