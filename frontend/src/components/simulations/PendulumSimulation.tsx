import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, Zap, Info } from 'lucide-react';

interface PendulumProps {
  initialLength?: number;
  initialGravity?: number;
}

export const PendulumSimulation: React.FC<PendulumProps> = ({
  initialLength = 1.5,
  initialGravity = 9.8,
}) => {
  const [length, setLength] = useState<number>(initialLength); // meters
  const [gravity, setGravity] = useState<number>(initialGravity); // m/s^2
  const [damping, setDamping] = useState<number>(0.05); // friction
  const [angleDeg, setAngleDeg] = useState<number>(30); // starting angle
  const [isRunning, setIsRunning] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Physics State
  const stateRef = useRef({
    angle: (30 * Math.PI) / 180,
    angularVelocity: 0,
    angularAcceleration: 0,
  });

  // Calculate Theoretical Period: T = 2 * PI * sqrt(L / g)
  const period = (2 * Math.PI * Math.sqrt(length / gravity)).toFixed(2);
  const frequency = (1 / parseFloat(period)).toFixed(2);

  const handleReset = () => {
    stateRef.current = {
      angle: (angleDeg * Math.PI) / 180,
      angularVelocity: 0,
      angularAcceleration: 0,
    };
  };

  useEffect(() => {
    handleReset();
  }, [angleDeg]);

  useEffect(() => {
    let animationFrameId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = 0.03; // time step

    const render = () => {
      if (isRunning) {
        // Physics Calculation: alpha = (-g / L) * sin(theta) - damping * omega
        const alpha =
          (-gravity / length) * Math.sin(stateRef.current.angle) -
          damping * stateRef.current.angularVelocity;

        stateRef.current.angularAcceleration = alpha;
        stateRef.current.angularVelocity += alpha * dt;
        stateRef.current.angle += stateRef.current.angularVelocity * dt;
      }

      // Draw Simulation
      const width = canvas.width;
      const height = canvas.height;
      const originX = width / 2;
      const originY = 40;

      // Scale meters to pixels
      const pixelLength = length * 90;
      const bobX = originX + pixelLength * Math.sin(stateRef.current.angle);
      const bobY = originY + pixelLength * Math.cos(stateRef.current.angle);

      ctx.clearRect(0, 0, width, height);

      // Draw Support Beam
      ctx.beginPath();
      ctx.moveTo(originX - 50, originY);
      ctx.lineTo(originX + 50, originY);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Draw Pendulum Rod
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Bob (Ball)
      ctx.beginPath();
      ctx.arc(bobX, bobY, 18, 0, 2 * Math.PI);
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Pivot Point
      ctx.beginPath();
      ctx.arc(originX, originY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, length, gravity, damping]);

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel rounded-2xl p-6 shadow-2xl border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-400" /> Basit Sarkaç ve Periyot Simülasyonu
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Fizik Laboratuvarı — Kütle, uzunluk ve yerçekimi ivmesinin hareket periyoduna etkisi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Duraklat' : 'Başlat'}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 transition"
            title="Sıfırla"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Interactive Canvas Render */}
        <div className="lg:col-span-2 flex flex-col items-center bg-slate-950/80 rounded-xl p-4 border border-slate-800">
          <canvas
            ref={canvasRef}
            width={480}
            height={280}
            className="w-full max-w-[480px] h-[280px]"
          />
          {/* Live Physics HUD */}
          <div className="grid grid-cols-3 gap-3 w-full mt-4 pt-4 border-t border-slate-800/80 text-center">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Hesaplanan Periyot (T)</span>
              <span className="text-lg font-bold text-sky-400">{period} saniye</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Frekans (f)</span>
              <span className="text-lg font-bold text-indigo-400">{frequency} Hz</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">İp Uzunluğu (L)</span>
              <span className="text-lg font-bold text-rose-400">{length} m</span>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-400" /> Değişken Kontrolleri
          </h4>

          {/* Length Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>İp Uzunluğu (L)</span>
              <span className="font-semibold text-sky-400">{length} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={length}
              onChange={(e) => setLength(parseFloat(e.target.value))}
              className="w-full accent-sky-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Gravity Preset Buttons / Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Yerçekimi İvmesi (g)</span>
              <span className="font-semibold text-indigo-400">{gravity} m/s²</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button
                onClick={() => setGravity(1.6)}
                className={`py-1 text-xs rounded border transition ${
                  gravity === 1.6
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Ay (1.6)
              </button>
              <button
                onClick={() => setGravity(9.8)}
                className={`py-1 text-xs rounded border transition ${
                  gravity === 9.8
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Dünya (9.8)
              </button>
              <button
                onClick={() => setGravity(24.7)}
                className={`py-1 text-xs rounded border transition ${
                  gravity === 24.7
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Jüpiter (24.7)
              </button>
            </div>
          </div>

          {/* Initial Angle */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Başlangıç Açısı (θ)</span>
              <span className="font-semibold text-rose-400">{angleDeg}°</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={angleDeg}
              onChange={(e) => setAngleDeg(parseInt(e.target.value))}
              className="w-full accent-rose-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Damping / Friction */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Sürtünme / Hava Direnci</span>
              <span className="font-semibold text-amber-400">{damping}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={damping}
              onChange={(e) => setDamping(parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Formula Note */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2 mt-1">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Küçük açılarda basit sarkaç periyodu <strong className="text-slate-200">T = 2π√(L/g)</strong> formülü ile hesaplanır. Kütleye bağlı değildir!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
