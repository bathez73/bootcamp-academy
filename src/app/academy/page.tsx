import Link from 'next/link';
import Nav from '@/components/Nav';
import StudentNav from '@/components/StudentNav';
import { FORMATIONS } from '@/lib/formations';
import { getCohortAccess } from '@/lib/cohort-server';
import { getServerClient, getServiceRoleClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Formations Academy | Novenetech', description: 'Formations pratiques en IA, marketing digital et digitalisation des entreprises.' };

const whatsapp = 'https://wa.me/22952527913';

export default async function Academy() {
 const sb = await getServerClient();
 const user = sb ? (await sb.auth.getUser()).data.user : null;
 const service = await getServiceRoleClient();
 let purchased: string[] = [];
 let cohortApproved = false;
 if (user && service) {
  // Les achats déjà vérifiés restent téléchargeables.
  const { data, error } = await service.from('payments').select('formation').eq('user_id', user.id).eq('verified', true);
  purchased = error ? [] : (data || []).map(row => String(row.formation));
  cohortApproved = (await getCohortAccess(user.id)).approved;
 }
 return (
  <div className="wrap">
   <Nav />
   {user && <StudentNav />}
   <section className="section">
    <p className="accent"><b>NOVENETECH ACADEMY</b></p>
    <h1>Des compétences digitales appliquées à des résultats business</h1>
    <p className="muted">Trois formations complémentaires, proposées séparément du Challenge 28 jours.</p>

    {!cohortApproved && (
     <div className="card" style={{ maxWidth: 620, marginBottom: 24 }}>
      <h3>Accès à l’Academy verrouillé</h3>
      <p className="muted">Ton accès est ouvert par l’équipe après vérification de ton paiement de l’accompagnement.</p>
      <Link className="btn" href="/inscription">Rejoindre l’accompagnement</Link>
     </div>
    )}

    <div className="grid">
     {FORMATIONS.map((f) => (
      <div className="card" key={f.nom}>
       <h3>{f.nom}</h3>
       <p className="muted">{f.promesse}</p>
       <div className="price" style={{ fontSize: 28, margin: '14px 0' }}>
        {f.prix.toLocaleString('fr-FR')} <small>FCFA</small>
       </div>
       {purchased.includes(f.nom)
        ? <p><a className="text-link" href={`/pdf/${f.file}`}>Télécharger mon achat</a></p>
        : <a className="btn" href={`${whatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite suivre la formation « ${f.nom} ».`)}`} target="_blank" rel="noopener noreferrer">Je suis intéressé(e)</a>}
      </div>
     ))}
    </div>
   </section>
  </div>
 );
}
