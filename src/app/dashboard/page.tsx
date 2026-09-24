import Link from 'next/link';
import Brand from '@/components/Brand';
import ThemeToggle from '@/components/ThemeToggle';
import TasksWidget from '@/components/TasksWidget';
import { logoutAction } from '@/app/auth/actions';
import { getServerClient } from '@/lib/supabase/server';

export default async function Dashboard() {
  const supabase = await getServerClient();
  let email: string | null = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <div className="dash">
      <aside className="side">
        <Brand />
        <Link href="/dashboard">Tableau de bord</Link>
        <Link href="/programme">Cours</Link>
        <Link href="/crm">Mes prospects</Link>
        <Link href="/academy">Academy</Link>
        <Link href="/">Ressources</Link>
        <div className="side-user">
          {email && <p className="muted" style={{ margin: '0 0 10px', fontSize: 13 }}>{email}</p>}
          <form action={logoutAction}>
            <button type="submit" className="btn btn2" style={{ padding: '10px 14px', width: '100%', margin: 0 }}>
              Se déconnecter
            </button>
          </form>
        </div>
        <ThemeToggle />
      </aside>
      <main className="main">
        <p className="accent eyebrow"><b>TABLEAU DE BORD</b></p>
        <h1>Ton Challenge Premier Client</h1>
        <TasksWidget />
      </main>
    </div>
  );
}
