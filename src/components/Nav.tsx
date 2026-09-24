import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
export default function Nav(){
  return <nav className="nav">
    <Link href="/" className="brand">NOVENE<span className="accent">TECH</span> CAMPUS</Link>
    <div className="nav-links">
      <Link href="/programme">Programme</Link>
      <Link href="/academy">Academy</Link>
      <Link href="/login">Espace étudiant</Link>
      <ThemeToggle />
    </div>
  </nav>;
}