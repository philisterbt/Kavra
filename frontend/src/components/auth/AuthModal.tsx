import React from 'react';
import { X, Sparkles, User, GraduationCap, Lock } from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  title = "Sınırsız AI Simülasyonu için Giriş Yapın",
  description = "Ücretsiz üye olarak sınırsız deney üretebilir, dijital laboratuvar defterinize kaydetmeye devam edebilirsiniz."
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1c1a]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#F4F0EA] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#2C2D32]/20 text-center text-[#2C2D32]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#2C2D32]/60 hover:text-[#2C2D32] hover:bg-[#2C2D32]/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon Badge */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#2E332E] text-[#F4F0EA] flex items-center justify-center shadow-md">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-[#2C2D32] tracking-tight">{title}</h3>
        <p className="text-xs text-[#2C2D32]/75 mt-2 leading-relaxed font-medium">{description}</p>

        {/* Role Selector Badges */}
        <div className="grid grid-cols-2 gap-3 my-6 text-left">
          <div className="p-3 rounded-xl bg-white/70 border border-[#2C2D32]/15 flex items-center gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-[#2E332E] text-[#F4F0EA]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2C2D32] block">Öğrenci</span>
              <span className="text-[10px] text-[#2C2D32]/60 font-medium">İnteraktif Deneyler</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-[#2C2D32]/15 flex items-center gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-[#4A4643] text-[#F4F0EA]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2C2D32] block">Öğretmen</span>
              <span className="text-[10px] text-[#2C2D32]/60 font-medium">Sınıf & İçerik Üretimi</span>
            </div>
          </div>
        </div>

        {/* Clerk Auth Actions */}
        <div className="flex flex-col gap-3">
          <SignUpButton mode="modal">
            <button className="w-full auremin-btn py-3.5 text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" /> Ücretsiz Hesap Oluştur
            </button>
          </SignUpButton>

          <SignInButton mode="modal">
            <button className="w-full auremin-btn-secondary py-3 text-xs">
              Zaten hesabın var mı? Giriş Yap
            </button>
          </SignInButton>
        </div>

        <p className="text-[11px] font-medium text-[#2C2D32]/60 mt-4">
          Kavra AI Lab — Kesintisiz Sezgi Motoru Teknolojisi.
        </p>
      </div>
    </div>
  );
};
