import { Background } from '../../components/background/background';
import { BirthForm } from '../../components/birth-form/birth-form';
import { Navbar } from '../../components/navbar/navbar';

export const metadata = {
  title: 'Begin Your Journey — ASTRA',
  description: 'Enter your birth details and let ASTRA generate your personal cosmic blueprint.',
};

export default function BirthFormPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Background />
      <Navbar />
      <BirthForm />
    </main>
  );
}
