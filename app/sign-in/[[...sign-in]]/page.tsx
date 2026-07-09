import { SignIn } from '@clerk/nextjs';
import { Background } from '../../../components/background/background';

export const metadata = {
  title: 'Sign In — ASTRA',
  description: 'Sign in to your ASTRA account to access your birth chart and cosmic insights.',
};

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Background />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="text-center mb-2">
          <p className="text-[#D4AF37] text-sm tracking-[0.25em] uppercase font-semibold mb-2">Welcome Back</p>
          <h1 className="font-display text-3xl font-semibold text-white">Sign in to ASTRA</h1>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-[24px] shadow-2xl',
              headerTitle: 'text-white font-display',
              headerSubtitle: 'text-[#B8BCC8]',
              formButtonPrimary: 'bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-semibold rounded-full',
              formFieldInput: 'bg-white/5 border-white/10 text-white rounded-xl focus:border-[#D4AF37]',
              formFieldLabel: 'text-[#B8BCC8]',
              footerActionLink: 'text-[#D4AF37] hover:text-[#D4AF37]/80',
              identityPreviewText: 'text-white',
              identityPreviewEditButtonIcon: 'text-[#D4AF37]',
              dividerLine: 'bg-white/10',
              dividerText: 'text-[#B8BCC8]',
              socialButtonsBlockButton: 'border-white/10 bg-white/5 text-white hover:bg-white/10',
              socialButtonsBlockButtonText: 'text-white',
            },
          }}
        />
      </div>
    </main>
  );
}
