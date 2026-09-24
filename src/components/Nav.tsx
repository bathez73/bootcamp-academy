import Link from 'next/link';
import Brand from '@/components/Brand';
import ThemeToggle from '@/components/ThemeToggle';
export default function Nav(){
  return <nav className="nav">
    <Brand />
    <div className="nav-links">
      <Link href="/programme">Programme</Link>
      <Link href="/academy">Academy</Link>
      <Link href="/login">Espace étudiant</Link>
      <ThemeToggle />
    </div>
  </nav>;
}
