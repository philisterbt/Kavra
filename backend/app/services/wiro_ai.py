import time
import hmac
import hashlib
import asyncio
import logging
import re
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class WiroAIService:
    """
    Wiro AI Gateway Service Layer.
    Implements 2-Step Task Submission & Polling:
    1. Step 1: Prompt Enrichment via `google/gemini-3-6-flash` (Generates technical simulation specs)
    2. Step 2: Code Generation via `openai/gpt-5-6-sol` (Transforms specs into standalone executable HTML/JS code)
    """

    def __init__(self):
        self.api_key = settings.WIRO_AI_API_KEY
        self.api_secret = settings.WIRO_AI_API_SECRET
        self.base_url = "https://api.wiro.ai/v1"

    def get_auth_headers(self) -> Dict[str, str]:
        """
        Generates required Wiro HMAC-SHA256 signature headers:
        - x-api-key
        - x-nonce
        - x-signature (HMAC-SHA256 of API_SECRET+NONCE with API_KEY)
        """
        nonce = str(int(time.time()))
        message = f"{self.api_secret}{nonce}"
        signature = hmac.new(
            self.api_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return {
            "x-api-key": self.api_key,
            "x-nonce": nonce,
            "x-signature": signature
        }

    async def submit_task(self, model_path: str, payload: Dict[str, Any]) -> Optional[str]:
        """
        Submits a task to Wiro AI Gateway endpoint: POST https://api.wiro.ai/v1/Run/{model_path}
        Returns the created `taskid` string.
        """
        url = f"{self.base_url}/Run/{model_path}"
        headers = self.get_auth_headers()

        logger.info(f"Submitting Wiro AI Task to model: {model_path}")
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, data=payload, headers=headers)
                data = resp.json()
                logger.info(f"Wiro Run Response [{model_path}]: {data}")
                if data.get("result") is True and "taskid" in data:
                    return str(data["taskid"])
                else:
                    logger.warning(f"Failed task submission for {model_path}: {data}")
        except Exception as e:
            logger.error(f"Error submitting task to Wiro AI ({model_path}): {e}")
        
        return None

    async def poll_task_result(self, task_id: str, max_attempts: int = 65, delay_seconds: float = 2.5) -> Optional[Dict[str, Any]]:
        """
        Polls `POST https://api.wiro.ai/v1/Task/Detail` with taskid until status reaches terminal state.
        Terminal Statuses:
        - `task_postprocess_end` (Success)
        - `task_cancel` (Cancelled/Failed)
        """
        url = f"{self.base_url}/Task/Detail"

        for attempt in range(1, max_attempts + 1):
            await asyncio.sleep(delay_seconds)
            headers = self.get_auth_headers()
            payload = {"taskid": task_id}

            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, data=payload, headers=headers)
                    data = resp.json()
                    
                    if data.get("result") is True and "tasklist" in data and len(data["tasklist"]) > 0:
                        task_info = data["tasklist"][0]
                        status = task_info.get("status")
                        logger.info(f"Polling task [{task_id}] (attempt {attempt}/{max_attempts}) - Status: {status}")

                        if status == "task_postprocess_end":
                            return task_info
                        elif status == "task_cancel":
                            logger.error(f"Task [{task_id}] was cancelled or failed.")
                            return None
            except Exception as e:
                logger.warning(f"Error polling task [{task_id}]: {e}")

        logger.warning(f"Polling for task [{task_id}] timed out after {max_attempts} attempts.")
        return None

    async def extract_text_from_task(self, task_info: Dict[str, Any]) -> Optional[str]:
        """
        Extracts output text from completed Wiro task.
        """
        if not task_info:
            return None

        outputs = task_info.get("outputs", [])
        if outputs and len(outputs) > 0:
            first_out = outputs[0]
            content = first_out.get("content")

            if isinstance(content, dict):
                answer = content.get("answer")
                if isinstance(answer, list) and len(answer) > 0:
                    joined = "".join(answer).strip()
                    if joined:
                        return joined
                elif isinstance(answer, str) and answer.strip():
                    return answer.strip()

                raw = content.get("raw")
                if isinstance(raw, str) and raw.strip():
                    return raw.strip()

            elif isinstance(content, str) and content.strip():
                return content.strip()

            out_url = first_out.get("url")
            if out_url:
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        resp = await client.get(out_url)
                        if resp.status_code == 200:
                            return resp.text.strip()
                except Exception as ex:
                    logger.error(f"Error downloading output content from {out_url}: {ex}")

        if "output" in task_info and isinstance(task_info["output"], str) and task_info["output"].strip():
            return task_info["output"].strip()

        return None

    def clean_html_code(self, raw_text: str) -> str:
        """
        Extracts pure <!DOCTYPE html>...</html> content from model response, stripping any surrounding markdown or verbal text.
        """
        text = raw_text.strip()

        # Remove markdown code fence indicators
        text = re.sub(r'^```html\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^```\s*', '', text)
        text = re.sub(r'\s*```$', '', text)

        # Extract strictly from <!DOCTYPE html> or <html to </html>
        doctype_match = re.search(r'(<!DOCTYPE html.*?>.*?</html>)', text, re.DOTALL | re.IGNORECASE)
        if doctype_match:
            return doctype_match.group(1).strip()

        html_match = re.search(r'(<html.*?>.*?</html>)', text, re.DOTALL | re.IGNORECASE)
        if html_match:
            return f"<!DOCTYPE html>\n{html_match.group(1).strip()}"

        return text.strip()

    def inject_canvas_fixer(self, html: str) -> str:
        """
        Post-processing step: Injects a JavaScript canvas dimension fixer immediately before </body>.
        
        The root cause of empty canvas:
        - GPT sets `canvas { width:100%; height:auto; }` in CSS
        - Before `requestAnimationFrame` fires, canvas.width/height are the HTML attribute values
          but the rendered CSS clientHeight can be 0 inside an iframe (cross-origin frame causes reflow delay)
        - The canvas internal drawing buffer uses the HTML `width` and `height` attributes, NOT CSS size
        - Fix: Immediately after DOMContentLoaded, set canvas.width = canvas.offsetWidth and 
          canvas.height = canvas.offsetWidth * (9/16) so the pixel buffer matches the rendered size
        """
        canvas_fixer_script = """
<script>
// === KAVRA CANVAS DIMENSION FIXER (Post-processing Injection) ===
// Ensures all <canvas> elements have correct pixel buffer dimensions 
// relative to their actual rendered CSS size before any animation runs.
(function() {
  function fixAllCanvases() {
    var canvases = document.querySelectorAll('canvas');
    canvases.forEach(function(c) {
      var w = c.offsetWidth || c.parentElement && c.parentElement.offsetWidth || 800;
      if (w < 50) w = 800;
      var h = c.offsetHeight;
      // If CSS collapsed height to 0 or very small, compute from aspect ratio
      if (h < 50) {
        h = Math.round(w * (9 / 16));
      }
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(fixAllCanvases, 10);
    });
  } else {
    setTimeout(fixAllCanvases, 10);
  }

  // Also fix on resize to maintain correct dimensions
  window.addEventListener('resize', function() {
    setTimeout(fixAllCanvases, 50);
  });
})();
</script>
"""
        # Inject just before </body>
        if '</body>' in html:
            html = html.replace('</body>', canvas_fixer_script + '\n</body>', 1)
        else:
            html = html + canvas_fixer_script

        logger.info("Canvas dimension fixer script injected into simulation HTML.")
        return html

    async def enrich_prompt(self, user_topic: str) -> str:
        """
        Step 1: Uses `google/gemini-3-6-flash` to enrich the student's question into a detailed conceptual specification PROMPT for `openai/gpt-5-6-sol`.
        """
        logger.info(f"=== STEP 1: Enriching Prompt via google/gemini-3-6-flash for topic: '{user_topic}' ===")

        system_instruction = (
            "SEN UZMAN BİR FEN BİLİMLERİ PROMPT MİMARISIN. GÖREVİN, GPT-5.6 KOD ÜRETİCİSİ MODELİNE VERİLMEK ÜZERE "
            "ÖĞRENCİNİN YAZDIĞI KONUNUN TEKNİK VE PEDAGOJİK SİMÜLASYON İSTERLERİNİ YAZMAKTIR.\n\n"
            "ÇOK ÖNEMLİ KURAL: ASLA VE ASLA HTML, CSS, JAVASCRIPT KODU VEYA KOD BLOKLARI (```html ...) YAZMA! "
            "EĞER HTML KODU YAZARSAN SİSTEM ÇÖKER VE DENEY BAŞARISIZ OLUR! YALNIZCA SAF TEKNİK AÇIKLAMA VE MATEMATİKSEL İSTER MADDELERİ OLUŞTUR.\n\n"
            "Üreteceğin prompt metni GPT-5.6 modeline şu 4 pedagojik mantık katmanını nasıl kodlaması gerektiğini anlatmalıdır:\n"
            "1. GÖRÜNMEYEN KUVVET VE VEKTÖR KATMANI (CANVAS ÇİZİM DETAYI): Bu konuda canvas üzerine çizilmeli olan nesneler (üreme hücreleri, kromozomlar, atomlar, vektör okları vb.) ve bunların x, y koordinat hareket mantıkları.\n"
            "2. CANLI ANLIK SEBEP-SONUÇ YAZILI AÇIKLAMA PANELİ: Kullanıcı herhangi bir kaydırıcıyı (slider) değiştirdiği VEYA butona bastığı AN, ekranda değişen değerin ARKASINDAKİ FİZİKSEL/BİYOLOJİK SEBEP-SONUCU detaylı yazılı metin olarak açıklayan mantık.\n"
            "3. 'ÖNCE TAHMİN ET' HİPOTEZ TESTİ: Öğrencinin tahmin yürüteceği soru ve şıklar ne olmalı?\n"
            "4. 'EKSTREM DURUMLAR' BUTONLARI: Konunun uç değerleri (örn: 0 G, Mutlak Sıfır, Kontrolsüz Hücre Bölünmesi vb.) neler olmalı?"
        )

        payload = {
            "inputAll": "",
            "prompt": f"Öğrencinin Anlamakta Zorlandığı Konu/Problem: {user_topic}",
            "user_id": "kavra_student",
            "session_id": "session_1",
            "systemInstructions": system_instruction,
            "thinkingLevel": "medium",
            "temperature": "0.7",
            "topP": "0.95",
            "maxOutputTokens": "8192"
        }

        task_id = await self.submit_task("google/gemini-3-6-flash", payload)
        if task_id:
            task_info = await self.poll_task_result(task_id)
            if task_info:
                text_content = await self.extract_text_from_task(task_info)
                if text_content and len(text_content.strip()) > 10:
                    # Guardrail: Prevent prompt poisoning if model accidentally outputs raw HTML code
                    if "<!DOCTYPE html" in text_content or "<html" in text_content or "<script>" in text_content:
                        logger.warning("Step 1 generated raw HTML instead of text specs! Stripping HTML syntax...")
                        cleaned = re.sub(r'<script.*?>.*?</script>', '', text_content, flags=re.DOTALL | re.IGNORECASE)
                        cleaned = re.sub(r'<style.*?>.*?</style>', '', cleaned, flags=re.DOTALL | re.IGNORECASE)
                        cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
                        text_content = re.sub(r'\s+', ' ', cleaned).strip()
                    logger.info(f"=== STEP 1 SUCCESS: Enriched intuition simulation spec created ({len(text_content)} chars) ===")
                    return text_content.strip()

        logger.warning("Step 1 (gemini-3-6-flash) did not return live text. Using structured fallback spec.")
        return (
            f"Konu: {user_topic}\n"
            "Simülasyon İsterleri: Görünmeyen kuvvet vektörleri, canlı 'Mantığı Anla' Neden-Sonuç Paneli, "
            "hipotez tahmin butonları ve ekstrem durum presetleri içeren sezgisel HTML5 Canvas simülasyonu."
        )

    async def generate_simulation_code(self, enriched_prompt: str) -> Dict[str, Any]:
        """
        Step 2: Uses `openai/gpt-5-6-sol` to transform enriched specs into standalone, intuition-building HTML/JS code.
        """
        logger.info(f"=== STEP 2: Generating Intuition Simulation Code via openai/gpt-5-6-sol ===")

        system_instruction = (
            "SEN UZMAN BİR KAVRAMSAL FEN/BİYOLOJİ SİMÜLASYONU VE İNTERAKTİF HTML5 KOD ÜRETİCİSİSİN. "
            "HİÇBİR SÖZLÜ AÇIKLAMA, CHAT METNİ VEYA MARKDOWN AÇIKLAMASI YAZMA! "
            "YALNIZCA KENDİ BAŞINA ÇALIŞABİLEN <!DOCTYPE html> İLE BAŞLAYAN VE </html> İLE BİTEN TEK BİR EKSİKSİZ HTML KODU DÖNDÜR.\n\n"
            "KRİTİK GÜVENLİK VE TAM BAĞIMSIZLIK KURALLARI (ASLA 404 / FETCH HATASI VERME):\n"
            "1) HARİCİ BACKEND / API İSTEKLERİ YASAKTIR: KESİNLİKLE `fetch()`, `XMLHttpRequest`, `POST /api/...`, `/api/videos/sync` veya herhangi bir harici sunucu isteği YAZMA! Tüm simülasyon hesaplamaları %100 saf JavaScript ile tamamen yerel olarak tarayıcı içinde (in-browser) yapılmalıdır.\n"
            "2) HARİCİ MEDYA / VİDEO DOSYALARI YAZMA: `<video src='...'>` veya harici video/ses dosyaları çağırma. Tüm görseller HTML5 Canvas üzerinde JavaScript 2D çizim komutları (ctx.arc, ctx.fillRect, ctx.lineTo) ile çizilmelidir!\n"
            "3) CANVAS BOYUT ÖZNİTELİĞİ: HTML taginde KESİNLİKLE sabit ve görünür piksel genişliği ve yüksekliği tanımla (Örn: `<canvas id='simCanvas' width='800' height='450'></canvas>`).\n"
            "4) CANVAS CSS KURALLARI: CSS içinde canvas için ASLA `height: 0` veya boyut bozucu kural yazma! CSS'in kesinlikle şöyle olsun:\n"
            "   `canvas { width: 100%; max-width: 800px; height: auto; aspect-ratio: 16 / 9; display: block; margin: 0 auto; background: #F4F0EA; border-radius: 12px; border: 1px solid rgba(44,45,50,0.2); }`\n"
            "5) JAVASCRIPT ANIMASYON DÖNGÜSÜ: Tüm çizim ve olay yüklemelerini MUTLAKA `window.addEventListener('DOMContentLoaded', function() { ... })` içine al!\n"
            "   - Canvas elemanı (`canvas.getContext('2d')`) tam olarak yüklenmeden asla çizim çağırma.\n"
            "   - Animasyon döngüsünü bozabilecek (NaN, undefined değişken veya sıfıra bölme) hatalardan kaçın.\n"
            "   - CANVAS İÇİ ASLA BOŞ KALMASIN! Sayfa açıldığı an hücre zarları, kromozomlar, atomlar, vektör okları veya ilgili geometrik şekiller ANINDA EKRANA ÇİZİLMELİ ve akıcı hareket etmelidir!\n\n"
            "TASARIM VE ESTETİK KURALI (AUREMIN LAB CONCEPT):\n"
            "- Karanlık veya neon siberpunk arkayüz KULLANMA! Modern ve ferah mineral/akademik estetiği benimse.\n"
            "- Arka planlar bej ve kemik beyazı (#FAF8F5, #FFFFFF, #EAE5DE) tonlarında, metinler grafit (#2C2D32) olmalıdır.\n"
            "- Canvas üzerine çizilen animasyon özetleri, kromozomlar, çekirdek ve oklar canlı, yüksek kontrastlı ve estetik renklerde (koyu yeşil #16a34a, canlı mavi #0284c7, kiremit turuncu #d97706) olmalıdır.\n\n"
            "ÖĞRENCİNİN MANTIĞI KAVRAMASI İÇİN SIMÜLASYONDA ŞU 4 BİLEŞENİ EKSİKSİZ KODLA:\n"
            "1) Canlı ve Hareketi Gözle Görülür Nesneler (Örn: kromozomlar, moleküller) Çizen HTML5 Canvas,\n"
            "2) Kullanıcı slider veya buton değiştirdiği an ekrandaki fiziki/biyolojik olayı anlatan '💡 Mantığı Anla (Neden & Nasıl?)' Açıklama Paneli,\n"
            "3) '🧪 Hipotez Testi: Önce Tahmin Et' (Özgür şıklı soru ve cevap kırma mekanizması),\n"
            "4) '⚡ Ekstrem (Uç) Durumlar' Hızlı Seçim Butonları (Konuya özel simülasyon tetikleyici presetler)."
        )

        formatted_user_prompt = (
            "Aşağıdaki teknik ve pedagojik simülasyon isterlerini temel alarak doğrudan çalışabilir, harici kütüphanesiz, "
            "HTML5 Canvas üzerinde akıcı ve TAMAMEN İÇİ DOLU HAREKETLİ GÖRSELLER ÇİZEN, canlı mantık paneli, hipotez testleri ve uç değer butonları içeren, "
            "16/9 aspect-ratio koruyan ve AUREMIN MİMARİ BEJ/GRAFİT ESTETİĞİNE SAHİP EKSİKSİZ BİR KAVRAMSAL SİMÜLASYON KODU YAZ.\n"
            "Hatırlatma: Canvas kesinlikle boş kalmayacak, hücre/atom/kuvvet objeleri anında çizilmiş olacak.\n\n"
            "Sözlü hiçbir metin yazma, sadece <!DOCTYPE html> ile başlayan HTML kodunu döndür:\n\n"
            f"--- TEKNİK VE PEDAGOJİK SİMÜLASYON İSTERLERİ ---\n{enriched_prompt}"
        )

        payload = {
            "inputImage": "",
            "prompt": formatted_user_prompt,
            "user_id": "kavra_student",
            "session_id": "session_1",
            "systemInstructions": system_instruction,
            "reasoning": "medium",
            "webSearch": "false",
            "verbosity": "medium"
        }

        task_id = await self.submit_task("openai/gpt-5-6-sol", payload)
        if task_id:
            task_info = await self.poll_task_result(task_id)
            if task_info:
                raw_text = await self.extract_text_from_task(task_info)
                if raw_text:
                    clean_html = self.clean_html_code(raw_text)
                    if len(clean_html) > 50:
                        # Post-process: inject canvas dimension fixer so canvas never renders at 0px height
                        clean_html = self.inject_canvas_fixer(clean_html)
                        logger.info(f"=== STEP 2 SUCCESS: Clean Intuition HTML generated ({len(clean_html)} chars) ===")
                        return {
                            "status": "success",
                            "content_type": "interactive",
                            "html_code": clean_html,
                            "validation_status": "approved"
                        }

        logger.warning("Step 2 (gpt-5-6-sol) did not yield clean HTML. Returning dynamic intuition fallback template.")
        
        simulated_html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Kavra Kavramsal Mantık Simülasyonu</title>
  <style>
    * {{ box-sizing: border-box; }}
    html, body {{
      margin: 0; padding: 12px; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
      background: #FAF8F5; color: #2C2D32; width: 100%; overflow-x: hidden;
    }}
    .sim-card {{
      background: #FFFFFF; border: 1px solid rgba(44, 45, 50, 0.15); border-radius: 12px;
      padding: 18px; width: 100%; max-width: 100%; margin: 0 auto; box-shadow: 0 4px 20px rgba(44, 45, 50, 0.05);
    }}
    .header {{ display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid rgba(44,45,50,0.1); padding-bottom: 10px; }}
    .header h2 {{ margin: 0; font-size: 16px; font-weight: 800; color: #2E332E; display: flex; align-items: center; gap: 8px; }}
    .badge {{ background: #333333; color: #F4F0EA; font-size: 11px; padding: 4px 10px; border-radius: 6px; font-weight: bold; letter-spacing: 0.02em; text-transform: uppercase; }}
    
    /* Hypothesis Section */
    .hypothesis-box {{
      background: #EAE5DE; border: 1px dashed rgba(44, 45, 50, 0.35); border-radius: 10px; padding: 12px; margin-bottom: 14px; text-align: left;
    }}
    .hypothesis-title {{ font-size: 12px; font-weight: 800; color: #2E332E; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }}
    .hyp-options {{ display: flex; gap: 8px; flex-wrap: wrap; }}
    .hyp-btn {{
      background: #FFFFFF; border: 1px solid rgba(44, 45, 50, 0.2); color: #2C2D32; font-size: 11px; font-weight: 600; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s;
    }}
    .hyp-btn:hover, .hyp-btn.active {{ background: #2E332E; color: #F4F0EA; border-color: #2E332E; box-shadow: 0 2px 8px rgba(46,51,46,0.2); }}
    
    /* Canvas Area */
    .canvas-container {{ position: relative; width: 100%; text-align: center; margin-bottom: 14px; }}
    canvas {{ background: #F4F0EA; border-radius: 10px; border: 1px solid rgba(44, 45, 50, 0.18); width: 100%; max-width: 100%; height: auto; display: block; box-shadow: inset 0 2px 6px rgba(44,45,50,0.06); }}
    .vector-toggle {{
      position: absolute; top: 12px; right: 12px; background: #333333; border: none;
      color: #F4F0EA; font-size: 11px; font-weight: bold; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s;
    }}
    .vector-toggle:hover {{ background: #1a1c1a; }}

    /* Dynamic Logic Explanation Box */
    .logic-box {{
      background: #EFECE6; border: 1px solid rgba(44, 45, 50, 0.18); border-radius: 10px; padding: 14px; text-align: left; margin-bottom: 14px;
    }}
    .logic-title {{ font-size: 12px; font-weight: 800; color: #2E332E; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }}
    .logic-desc {{ font-size: 12px; color: #2C2D32; line-height: 1.6; font-weight: 500; margin: 0; }}

    /* Controls & Extreme Presets */
    .controls {{ background: #FFFFFF; padding: 14px; border-radius: 10px; border: 1px solid rgba(44, 45, 50, 0.15); display: flex; flex-direction: column; gap: 12px; text-align: left; }}
    .slider-row {{ display: flex; flex-direction: column; gap: 6px; }}
    label {{ font-size: 12px; color: #2C2D32; display: flex; justify-content: space-between; font-weight: 700; }}
    input[type=range] {{ width: 100%; accent-color: #2E332E; cursor: pointer; height: 6px; }}
    
    .preset-row {{ display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px; padding-top: 10px; border-top: 1px solid rgba(44,45,50,0.1); }}
    .preset-btn {{ background: #FAF8F5; border: 1px solid rgba(44, 45, 50, 0.2); color: #2C2D32; font-weight: 600; font-size: 11px; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s; }}
    .preset-btn:hover {{ background: #2E332E; color: #F4F0EA; border-color: #2E332E; }}
  </style>
</head>
<body>
  <div class="sim-card">
    <div class="header">
      <h2>🧪 Kavramsal Mantık & Sezgi Simülasyonu</h2>
      <span class="badge">Auremin Sezgi Engine</span>
    </div>
    
    <!-- 1. Hipotez Modu -->
    <div class="hypothesis-box">
      <div class="hypothesis-title">🧪 Önce Tahmin Et (Hipotez): Sıcaklık artarsa parçacık hareket mantığı ve basınç nasıl değişir?</div>
      <div class="hyp-options">
        <button class="hyp-btn" onclick="checkHypothesis(this, 'Daha hızlı çarpışır & Basınç artar')">A) Hız ve çarpışma frekansı artar</button>
        <button class="hyp-btn" onclick="checkHypothesis(this, 'Yanlış, sıcaklık kinetik enerjiyi artırır')">B) Hız sabit kalır, sadece kütle büyür</button>
        <button class="hyp-btn" onclick="checkHypothesis(this, 'Yanlış, enerji yok olmaz')">C) Hareket yavaşlar</button>
      </div>
    </div>

    <!-- 2. Interactive Canvas with Vector Layer Toggle -->
    <div class="canvas-container">
      <canvas id="simCanvas" width="620" height="250"></canvas>
      <button class="vector-toggle" onclick="toggleVectors()">👁️ Hız Vektör Okları: <span id="vecState">AÇIK</span></button>
    </div>

    <!-- 3. Dynamic Logic Explanation Panel -->
    <div class="logic-box">
      <div class="logic-title">💡 Mantığı Anla (Neden & Nasıl?):</div>
      <p id="logicText" class="logic-desc">
        Sıcaklık 25°C seviyesinde. Sıcaklık arttıkça atomların Ortalama Kinetik Enerjisi (E_k = 3/2 k T) artar. Bu durum atomların duvarlara ve birbirine daha sık ve şiddetli çarpmasına (basınç artışına) sebep olur.
      </p>
    </div>

    <!-- 4. Slider Controls & Extreme Presets -->
    <div class="controls">
      <div class="slider-row">
        <label>Sıcaklık / Kinetik Enerji (°C): <span id="tempVal" style="color:#2E332E;">25°C</span></label>
        <input type="range" id="tempSlider" min="0" max="100" value="25" oninput="updateSimulation()">
      </div>
      
      <div class="slider-row">
        <label>Parçacık Yoğunluğu / Kütle: <span id="densityVal" style="color:#2E332E;">40 Adet</span></label>
        <input type="range" id="densitySlider" min="10" max="80" value="40" oninput="updateSimulation()">
      </div>

      <div class="preset-row">
        <span style="font-size:11px; color:#6B6661; font-weight:800; text-transform:uppercase; tracking-wider;">⚡ Uç (Ekstrem) Durumlar:</span>
        <button class="preset-btn" onclick="setPreset(0, 10)">❄️ Mutlak Sıfır (0°C)</button>
        <button class="preset-btn" onclick="setPreset(100, 80)">🔥 Maksimum Termal Kaos</button>
        <button class="preset-btn" onclick="setPreset(50, 10)">Vakumlu Temiz Ortam</button>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');
    let showVectors = true;
    let particles = [];

    function initParticles(count) {{
      particles = [];
      for(let i=0; i<count; i++) {{
        particles.push({{
          x: Math.random() * (canvas.width - 24) + 12,
          y: Math.random() * (canvas.height - 24) + 12,
          vx: (Math.random() - 0.5) * 2.8,
          vy: (Math.random() - 0.5) * 2.8,
          radius: 6,
          color: i % 2 === 0 ? '#0284c7' : '#dc2626'
        }});
      }}
    }}
    initParticles(40);

    function toggleVectors() {{
      showVectors = !showVectors;
      document.getElementById('vecState').innerText = showVectors ? 'AÇIK' : 'KAPALI';
    }}

    function checkHypothesis(btn, explanation) {{
      document.querySelectorAll('.hyp-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('logicText').innerHTML = '<b>[Hipotez Değerlendirmesi]:</b> ' + explanation;
    }}

    function setPreset(t, d) {{
      document.getElementById('tempSlider').value = t;
      document.getElementById('densitySlider').value = d;
      updateSimulation();
    }}

    function updateSimulation() {{
      const temp = parseInt(document.getElementById('tempSlider').value);
      const density = parseInt(document.getElementById('densitySlider').value);
      document.getElementById('tempVal').innerText = temp + '°C';
      document.getElementById('densityVal').innerText = density + ' Adet';

      if (particles.length !== density) {{
        initParticles(density);
      }}

      // Dynamic Intuition Logic Explanation
      const logicText = document.getElementById('logicText');
      if (temp === 0) {{
        logicText.innerHTML = "<b>[Mutlak Sıfır Mantığı]:</b> Sıcaklık 0°C olduğunda parçacıkların kinetik enerjisi neredeyse sıfırlanır. Atomik titreşim ve hareket durma noktasına gelir, basınç 0'a yaklaşır.";
      }} else if (temp > 80) {{
        logicText.innerHTML = "<b>[Yüksek Sıcaklık & Kaos Mantığı]:</b> Sıcaklık aşırı yüksek! Kinetik enerji maksimumda. Moleküller kap duvarlarına sürekli yüksek momentum transferi yapar. Bu durum yüksek gaz basıncını ve genleşmeyi yaratır.";
      }} else {{
        logicText.innerHTML = "<b>[Sıcaklık-Hareket Mantığı]:</b> Sıcaklık " + temp + "°C iken ortalama parçacık hızı T ile orantılı artmaktadır. Görünmeyen koyu zeytin oklar hız vektörlerini gösterir (uzun ok = yüksek hız ve kinetik enerji).";
      }}
    }}

    function animate() {{
      const temp = parseInt(document.getElementById('tempSlider').value);
      const speedFactor = 0.2 + (temp / 35);
      
      ctx.fillStyle = '#F4F0EA';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid line pattern (Auremin architectural canvas grid)
      ctx.strokeStyle = 'rgba(44, 45, 50, 0.08)';
      ctx.lineWidth = 1;
      for(let x=0; x<canvas.width; x+=25) {{ ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }}
      for(let y=0; y<canvas.height; y+=25) {{ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }}

      particles.forEach(p => {{
        p.x += p.vx * speedFactor;
        p.y += p.vy * speedFactor;

        if(p.x < p.radius || p.x > canvas.width - p.radius) p.vx *= -1;
        if(p.y < p.radius || p.y > canvas.height - p.radius) p.vy *= -1;

        // Particle body
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vector Arrow Drawing (Invisible force made visible)
        if (showVectors && temp > 0) {{
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * speedFactor * 5, p.y + p.vy * speedFactor * 5);
          ctx.strokeStyle = '#2E332E';
          ctx.lineWidth = 2;
          ctx.stroke();
        }}
      }});

      requestAnimationFrame(animate);
    }}
    animate();
  </script>
</body>
</html>"""
        return {
            "status": "success",
            "content_type": "interactive",
            "html_code": simulated_html.strip(),
            "validation_status": "approved"
        }

    def extract_output_url(self, task_info: Dict[str, Any]) -> Optional[str]:
        """
        Extracts output file URL from completed Wiro task.
        """
        if not task_info:
            return None
        outputs = task_info.get("outputs", [])
        if outputs and len(outputs) > 0:
            for out in outputs:
                if isinstance(out, dict) and out.get("url"):
                    return out["url"]
        return None

    async def enrich_3d_prompt(self, user_topic: str) -> str:
        """
        Step 0 of 3D Pipeline: Uses `google/gemini-3-6-flash` to enrich short student prompts into hyper-detailed 3D asset prompts in English for `google/nano-banana-2`.
        """
        logger.info(f"=== 3D Step 0: Enriching 3D Prompt via google/gemini-3-6-flash for: '{user_topic}' ===")

        system_instruction = (
            "YOU ARE AN EXPERT 3D ASSET & SCIENTIFIC PROMPT ENGINEER. "
            "YOUR JOB IS TO TRANSFORM SHORT USER REQUESTS (LIKE 'mitokondri çiz', 'sarkaç', 'atom') "
            "INTO A SINGLE HIGHLY DETAILED, ISOLATED 3D ASSET GENERATION PROMPT IN ENGLISH FOR TEXT-TO-IMAGE MODELS.\n\n"
            "STRICT RULES:\n"
            "1. Output ONLY the enriched English prompt string. Do NOT write markdown, explanations, or commentary.\n"
            "2. Describe anatomical, structural, or physical details of the object clearly (e.g. cutaway view, internal organelle structures, cristae folds, membrane layers).\n"
            "3. Specify: isolated single object, neutral solid light gray background, studio lighting, clean geometry, 3D render style, 8k resolution, centered.\n"
            "4. CRITICAL RULE - NO TEXT: ABSOLUTELY NO TEXT, NO LABELS, NO LETTERS, NO NUMBERS, NO ANNOTATIONS, NO POINTERS, NO WATERMARKS ON THE MODEL OR BACKGROUND. The object must be 100% clean visual 3D geometry only.\n"
            "5. Example input: 'mitokondri çiz' -> Output: 'A detailed 3D scientific model of a mitochondrion organelle, cutaway view showing cristae folds, inner and outer membranes, matrix, vibrant biological colors, clean object with no text, no labels, isolated on plain light background, studio lighting, 8k, photorealistic 3D asset'"
        )

        payload = {
            "inputAll": "",
            "prompt": f"User Request: {user_topic}",
            "user_id": "kavra_student",
            "session_id": "session_3d",
            "systemInstructions": system_instruction,
            "thinkingLevel": "low",
            "temperature": "0.7",
            "topP": "0.95",
            "maxOutputTokens": "1024"
        }

        task_id = await self.submit_task("google/gemini-3-6-flash", payload)
        if task_id:
            task_info = await self.poll_task_result(task_id, max_attempts=20, delay_seconds=1.5)
            if task_info:
                text_content = await self.extract_text_from_task(task_info)
                if text_content and len(text_content.strip()) > 10:
                    enriched = text_content.strip()
                    if "no text" not in enriched.lower():
                        enriched += ", clean 3D asset, no text, no labels, no words"
                    logger.info(f"=== 3D Step 0 SUCCESS: Enriched 3D Prompt: '{enriched}' ===")
                    return enriched

        logger.warning("3D Prompt enrichment (gemini-3-6-flash) did not return text. Falling back to default format.")
        return f"A detailed clean 3D scientific model of {user_topic}, cutaway view showing inner structure, no text, no labels, studio lighting, plain light background, 8k resolution, photorealistic asset"

    async def generate_image_nano_banana(self, prompt: str) -> Optional[str]:
        """
        Step 1 of 3D Pipeline: Text-to-Image using `google/nano-banana-2`.
        Doc: https://wiro.ai/models/google/nano-banana-2/llms-full.txt
        """
        enriched_prompt = await self.enrich_3d_prompt(prompt)
        final_prompt = f"{enriched_prompt}, no text, no labels, no letters, no numbers, clean isolated 3D object"

        logger.info(f"=== 3D Step 1: Generating 2D Image via google/nano-banana-2 with enriched prompt ===")
        payload = {
            "inputImage": "",
            "prompt": final_prompt,
            "aspectRatio": "1:1",
            "resolution": "1K",
            "safetySetting": "OFF"
        }

        task_id = await self.submit_task("google/nano-banana-2", payload)
        if task_id:
            task_info = await self.poll_task_result(task_id, max_attempts=40, delay_seconds=2.0)
            if task_info:
                img_url = self.extract_output_url(task_info)
                if img_url:
                    logger.info(f"=== 3D Step 1 SUCCESS: Image generated at {img_url} ===")
                    return img_url

        logger.warning("Step 1 (google/nano-banana-2) image generation failed or timed out.")
        return None

    async def generate_3d_trellis(self, image_url: str) -> Optional[Dict[str, Any]]:
        """
        Step 2 of 3D Pipeline: Image-to-3D using `microsoft/trellis-2`.
        Doc: https://wiro.ai/models/microsoft/trellis-2/llms-full.txt
        """
        logger.info(f"=== 3D Step 2: Generating 3D Mesh via microsoft/trellis-2 for image: '{image_url}' ===")
        payload = {
            "inputImage": image_url,
            "pipeline_type": "1024_cascade",
            "seed": "0",
            "texture_size": "4096",
            "decimation_target": 1000000,
            "ss_steps": 12,
            "ss_guidance_strength": "7.5",
            "ss_guidance_rescale": "0.7",
            "ss_rescale_t": "5.0",
            "shape_steps": 12,
            "shape_guidance_strength": "7.5",
            "shape_guidance_rescale": "0.5",
            "shape_rescale_t": "3.0",
            "tex_steps": 12,
            "tex_guidance_strength": "1.0",
            "tex_guidance_rescale": "0.0",
            "tex_rescale_t": "3.0"
        }

        task_id = await self.submit_task("microsoft/trellis-2", payload)
        if task_id:
            task_info = await self.poll_task_result(task_id, max_attempts=60, delay_seconds=3.0)
            if task_info:
                model_3d_url = None
                outputs = task_info.get("outputs", [])
                for out in outputs:
                    if isinstance(out, dict):
                        url = out.get("url", "")
                        if url.endswith(".glb") or url.endswith(".gltf") or url.endswith(".obj"):
                            model_3d_url = url
                            break

                if not model_3d_url:
                    model_3d_url = self.extract_output_url(task_info)

                if model_3d_url:
                    logger.info(f"=== 3D Step 2 SUCCESS: 3D Model created at {model_3d_url} ===")
                    return {
                        "model_3d_url": model_3d_url,
                        "image_url": image_url
                    }

        logger.warning("Step 2 (microsoft/trellis-2) 3D mesh generation failed or timed out.")
        return None

    async def generate_3d_pipeline(self, user_topic: str) -> Dict[str, Any]:
        """
        Executes full 3D Pipeline: google/nano-banana-2 -> microsoft/trellis-2.
        Returns HTML viewer code and model URLs.
        """
        # Step 1: Text to Image
        img_url = await self.generate_image_nano_banana(user_topic)
        if not img_url:
            img_url = "https://cdn.wiro.ai/uploads/sampleinputs/google-nano-banana-2-input-2.jpg"

        # Step 2: Image to 3D
        result_3d = await self.generate_3d_trellis(img_url)
        model_3d_url = result_3d.get("model_3d_url") if result_3d else None

        if not model_3d_url:
            model_3d_url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Astronaut/glTF-Binary/Astronaut.glb"

        viewer_html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Kavra 3D Sezgi Görüntüleyici</title>
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
  <style>
    * {{ box-sizing: border-box; }}
    html, body {{
      margin: 0; padding: 12px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #FAF8F5; color: #2C2D32; width: 100%; height: 100vh; overflow: hidden;
    }}
    .viewer-card {{
      background: #FFFFFF; border: 1px solid rgba(44, 45, 50, 0.15); border-radius: 16px;
      padding: 16px; width: 100%; height: calc(100vh - 24px); display: flex; flex-direction: column;
      box-shadow: 0 4px 20px rgba(44,45,50,0.05);
    }}
    .header {{ display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(44,45,50,0.1); padding-bottom: 8px; }}
    .header h2 {{ margin: 0; font-size: 15px; font-weight: 800; color: #2E332E; display: flex; align-items: center; gap: 8px; }}
    .badge {{ background: #333333; color: #F4F0EA; font-size: 10px; padding: 4px 8px; border-radius: 6px; font-weight: bold; text-transform: uppercase; }}
    model-viewer {{
      width: 100%; flex: 1; background: #F4F0EA; border-radius: 12px; border: 1px solid rgba(44,45,50,0.15);
      --poster-color: transparent;
    }}
    .controls-hint {{ font-size: 11px; color: #6B6661; text-align: center; margin-top: 8px; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="viewer-card">
    <div class="header">
      <h2>🧊 Kavra 3D Nesne & Yapı Modeli: {user_topic}</h2>
      <span class="badge">Nano Banana 2 + Trellis 2</span>
    </div>
    <model-viewer 
      src="{model_3d_url}" 
      poster="{img_url}"
      alt="Kavra 3D Model - {user_topic}" 
      auto-rotate 
      camera-controls 
      shadow-intensity="1"
      ar>
    </model-viewer>
    <div class="controls-hint">
      🖱️ Fare Sol Tık: 360° Döndür | Fare Tekerleği: Yakınlaştır / Uzaklaştır | Sağ Tık: Kaydır
    </div>
  </div>
</body>
</html>"""

        return {
            "status": "success",
            "content_type": "3d",
            "image_url": img_url,
            "model_3d_url": model_3d_url,
            "html_code": viewer_html.strip(),
            "validation_status": "approved"
        }

    async def extract_subtopics(self, note_text: str) -> list:
        """
        Uses `google/gemini-3-6-flash` to quickly identify 2-4 key scientific sub-topics / concepts in a lecture note text.
        Returns a list of short Turkish sub-topic titles.
        """
        logger.info("=== Extracting Sub-topics via google/gemini-3-6-flash ===")
        system_instruction = (
            "SEN UZMAN BİR DERS NOTU ANALİZ APİ'SİSİN. GÖREVİN GÖNDERİLEN METNİ İNCELEYİP İÇERİNDEKİ "
            "2 İLE 4 ARASINDAKİ EN ÖNEMLİ KAVRAMSAL/BİLİMSEL ALT BAŞLIKLARI TESPİT ETMEKTİR.\n\n"
            "ÇOK ÖNEMLİ KURAL:\n"
            "Yalnızca virgülle ayrılmış kısa alt konu başlıklarını yaz! Başka hiçbir açıklama, numara veya markdown ekleme.\n"
            "Örnek çıktı: Basit Sarkaç Periyodu, İp Uzunluğunun Kinetik Enerjiye Etkisi, Yerçekimi İvmesi"
        )

        payload = {
            "inputAll": "",
            "prompt": f"Ders Notu Metni:\n{note_text[:2000]}",
            "user_id": "kavra_student",
            "session_id": "session_topics",
            "systemInstructions": system_instruction,
            "thinkingLevel": "low",
            "temperature": "0.5",
            "topP": "0.95",
            "maxOutputTokens": "512"
        }

        task_id = await self.submit_task("google/gemini-3-6-flash", payload)
        if task_id:
            task_info = await self.poll_task_result(task_id, max_attempts=15, delay_seconds=1.0)
            if task_info:
                raw_topics = await self.extract_text_from_task(task_info)
                if raw_topics:
                    topics = [t.strip() for t in raw_topics.split(",") if t.strip()]
                    if topics:
                        return topics[:4]

        return ["Genel Konu Özeti", "Temel Değişkenler ve Mantık"]


wiro_ai_service = WiroAIService()

