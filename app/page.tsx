import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, Eclipse, Orbit, ScanLine, Sparkles, Waypoints } from 'lucide-react';
import styles from './astra.module.css';

const tools = [
  { title: 'Birth chart', description: 'See the sidereal sky from the place and moment you were born.', href: '/birth-form', Icon: ScanLine },
  { title: 'Dasha timeline', description: 'Follow the planetary periods that organize your chart into chapters.', href: '/dashboard/timeline', Icon: Orbit },
  { title: 'Compatibility', description: 'Compare two charts and reflect on the patterns you share.', href: '/dashboard/compatibility', Icon: Waypoints },
];

export default function Home() {
  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><Eclipse size={25} aria-hidden="true" /> ASTRA</Link>
        <nav aria-label="Main navigation">
          <a href="#features">Explore</a>
          <Link href="/ask-astra">Ask Astra</Link>
          <Link href="/sign-in">Sign in <ArrowUpRight size={13} aria-hidden="true" /></Link>
        </nav>
      </header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="astra-title">
          <div className={styles.intro}>
            <h1 id="astra-title" className={styles.title}>A sky of <em>your own.</em></h1>
            <p>Explore your Vedic birth chart and bring your questions to Astra AI. See what the sky at your birth can help you reflect on today.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/birth-form">Create my birth chart <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className={styles.textLink} href="/ask-astra"><Sparkles size={17} aria-hidden="true" /> Ask Astra</Link>
            </div>
          </div>

          <div className={styles.sky} aria-hidden="true">
            <div className={styles.chart}>
              <div className={styles.dial} />
              <div className={styles.horizon} />
              <div className={styles.planet} />
              <div className={styles.satellite} />
              <Sparkles className={styles.star} size={24} />
            </div>
          </div>
        </section>

        <div className={styles.legend}>
          <a href="#features">Explore Astra <ArrowDown size={14} aria-hidden="true" /></a>
          <span>Illustration · Sidereal sky</span>
        </div>

        <section id="features" className={styles.features} aria-labelledby="feature-title">
          <div className={styles.sectionHeading}>
            <h2 id="feature-title">Read your sky.</h2>
            <p>Start with your birth details, then explore the parts of your chart that make you curious.</p>
          </div>
          <ul className={styles.tools}>
            {tools.map(({ title, description, href, Icon }) => (
              <li key={title}>
                <Link href={href}>
                  <Icon size={24} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <ArrowUpRight className={styles.toolArrow} size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.askBanner}>
            <div>
              <h2>What’s on your mind?</h2>
              <p>Bring a question about work, relationships, or a life chapter to Ask Astra.</p>
            </div>
            <Link className={styles.primary} href="/ask-astra">Open Ask Astra <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}><Eclipse size={21} aria-hidden="true" /> ASTRA</Link>
        <a href="https://github.com/DarkCarnage06/Astra">GitHub <ArrowUpRight size={14} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}
