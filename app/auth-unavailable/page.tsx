import Link from 'next/link';
import styles from '../astra.module.css';

export const metadata = {
  title: 'Sign-in unavailable · Astra',
  robots: { index: false, follow: false },
};

export default function AuthUnavailable() {
  return (
    <main id="main-content" className={styles.site}>
      <section className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 py-8">
        <h1 className="font-display text-4xl">Sign-in is currently unavailable.</h1>
        <p>Account features, including your birth chart and Ask Astra, need sign-in.</p>
        <Link href="/" className={styles.primary}>Back to Astra</Link>
      </section>
    </main>
  );
}
