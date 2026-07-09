import { SignUp } from '@clerk/nextjs';
import { Background } from '../../../components/background/background';

export const metadata = {
  title: 'Create Account — ASTRA',
  description: 'Create your ASTRA account and begin your journey with Vedic astrology.',
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Background />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="text-center mb-2">
          <p className="text-[#D4AF37] text-sm tracking-[0.25em] uppercase font-semibold mb-2">Begin Your Journey</p>
          <h1 className="font-display text-3xl font-semibold text-white">Create Your Account</h1>
        </div>
        <SignUp
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
