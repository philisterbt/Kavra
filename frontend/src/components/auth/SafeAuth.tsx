import React from 'react';
import { useUser, SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';

// Check if Clerk is active
const isClerkAvailable = () => {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  return Boolean(key && key !== 'pk_test_sample_key_here' && (key.startsWith('pk_test_') || key.startsWith('pk_live_')));
};

export const SafeUserHeader: React.FC<{ guestTrialLeft: number }> = ({ guestTrialLeft }) => {
  if (!isClerkAvailable()) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#F4F0EA] font-semibold hidden sm:inline-flex items-center gap-1.5 bg-[#333333] px-3 py-1.5 rounded shadow-sm tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {guestTrialLeft > 0 ? `Kayıtsız ${guestTrialLeft} Deneme` : 'Deneme Hakkı Doldu'}
        </span>
        <button
          onClick={() => alert("Clerk API anahtarı .env dosyasına eklendiğinde canlı kayıt sistemi aktifleşir.")}
          className="auremin-btn py-2 text-xs"
        >
          Giriş Yap / Kaydol
        </button>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <span className="text-xs text-[#F4F0EA] font-semibold hidden sm:inline-flex items-center gap-1.5 bg-[#333333] px-3 py-1.5 rounded shadow-sm tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {guestTrialLeft > 0 ? `Kayıtsız ${guestTrialLeft} Deneme` : 'Deneme Hakkı Doldu'}
        </span>
        <SignInButton mode="modal">
          <button className="auremin-btn py-2 text-xs">
            Giriş Yap / Kaydol
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-3">
          <UserGreeting />
          <UserButton showName={false} />
        </div>
      </SignedIn>
    </>
  );
};

const UserGreeting = () => {
  try {
    const { isLoaded, user } = useUser();
    return (
      <span className="text-xs text-[#2C2D32] font-semibold hidden sm:inline-block border border-[#2C2D32]/20 px-3 py-1 rounded bg-[#EAE5DE]">
        {isLoaded && user?.fullName ? `Hoş geldin, ${user.fullName}` : 'Öğrenci Hesabı'}
      </span>
    );
  } catch {
    return <span className="text-xs text-[#2C2D32] font-semibold hidden sm:inline-block border border-[#2C2D32]/20 px-3 py-1 rounded bg-[#EAE5DE]">Öğrenci Hesabı</span>;
  }
};
