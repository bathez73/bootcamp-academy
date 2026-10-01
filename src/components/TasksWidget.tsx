'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import { MISSIONS } from '@/lib/curriculum';

const PIPELINE_STATUSES = ['À contacter', 'Contacté', 'Intéressé', 'Client'] as const;

type ProspectStatus = (typeof PIPELINE_STATUSES)[number];

export default function TasksWidget() {
	const [done, setDone] = useState<number[]>([]);
	const [userId, setUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [lastAction, setLastAction] = useState<{ day: number; done: boolean } | null>(null);
	const [pendingMission, setPendingMission] = useState<number | null>(null);
	const [insightError, setInsightError] = useState('');
	const [prospectCounts, setProspectCounts] = useState<Record<ProspectStatus, number>>({
		'À contacter': 0,
		Contacté: 0,
		Intéressé: 0,
		Client: 0,
	});
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		if (!lastAction) return;
		const timeout = window.setTimeout(() => setLastAction(null), 2200);
		return () => window.clearTimeout(timeout);
	}, [lastAction]);

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const supabase = getBrowserClient();
				if (!supabase) throw Error('Connexion indisponible.');

				const { data, error: authError } = await supabase.auth.getUser();
				if (authError || !data.user) throw Error('Reconnecte-toi pour retrouver ta progression.');

				const [progressResult, prospectsResult] = await Promise.all([
					supabase.from('progress').select('day, done').eq('user_id', data.user.id),
					supabase.from('crm_prospects').select('statut'),
				]);

				if (progressResult.error) throw Error('Impossible de charger la progression.');

				if (active) {
					setUserId(data.user.id);
					setDone((progressResult.data || []).filter((row) => row.done).map((row) => Number(row.day)));
					setError('');

					if (prospectsResult.error) {
						setInsightError('Le pipeline CRM est momentanément indisponible.');
					} else {
						const counts: Record<ProspectStatus, number> = {
							'À contacter': 0,
							Contacté: 0,
							Intéressé: 0,
							Client: 0,
						};
						(prospectsResult.data || []).forEach((prospect) => {
							if (PIPELINE_STATUSES.includes(prospect.statut as ProspectStatus)) {
								counts[prospect.statut as ProspectStatus] += 1;
							}
						});
						setProspectCounts(counts);
						setInsightError('');
					}
				}
			} catch (loadError) {
				if (active) setError(loadError instanceof Error ? loadError.message : 'Chargement impossible.');
			} finally {
				if (active) setLoading(false);
			}
		}

		void load();
		return () => { active = false; };
	}, [attempt]);

	async function toggle(day: number) {
		if (busy || loading || !userId) return;
		setBusy(true);
		setError('');
		try {
			const supabase = getBrowserClient();
			if (!supabase) throw Error();
			const next = !done.includes(day);
			const { error: saveError } = await supabase.from('progress').upsert(
				{ user_id: userId, day, done: next, updated_at: new Date().toISOString() },
				{ onConflict: 'user_id,day' },
			);
			if (saveError) throw saveError;
			setDone((current) => next ? [...current, day] : current.filter((currentDay) => currentDay !== day));
			setLastAction({ day, done: next });
		} catch {
			setError('La progression n’a pas été enregistrée. Réessaie.');
			setLastAction({ day, done: !done.includes(day) });
		} finally {
			setBusy(false);
		}
	}

	const nextMission = MISSIONS.find((mission) => !done.includes(mission.day));
	const totalProspects = Object.values(prospectCounts).reduce((total, count) => total + count, 0);
	const pendingMissionData = pendingMission ? MISSIONS.find((mission) => mission.day === pendingMission) ?? null : null;
	const pendingMissionIsDone = pendingMissionData ? done.includes(pendingMissionData.day) : false;

	async function confirmMissionToggle() {
		if (pendingMissionData) {
			await toggle(pendingMissionData.day);
			setPendingMission(null);
		}
	}

	return (
		<>
			{pendingMissionData && (
				<div className="premium-modal-backdrop" onClick={() => setPendingMission(null)}>
					<div className="premium-modal" role="dialog" aria-modal="true" aria-labelledby="mission-modal-title" onClick={(event) => event.stopPropagation()}>
						<div className="premium-modal__header">
							<div>
								<p className="accent eyebrow">Confirmation</p>
								<h3 id="mission-modal-title">{pendingMissionIsDone ? 'Remettre la mission à faire ?' : 'Valider cette mission ?'}</h3>
							</div>
							<button className="premium-modal__close" type="button" aria-label="Fermer la modale" onClick={() => setPendingMission(null)}>×</button>
						</div>
						<p>
							{pendingMissionIsDone
								? `Tu vas remettre le jour ${pendingMissionData.day} en attente.`
								: `Tu vas valider le jour ${pendingMissionData.day} : ${pendingMissionData.title}.`}
						</p>
						<div className="premium-modal__actions">
							<button className="premium-modal__button premium-modal__button--secondary" type="button" onClick={() => setPendingMission(null)}>
								Annuler
							</button>
							<button className="premium-modal__button premium-modal__button--primary" type="button" onClick={confirmMissionToggle} disabled={busy || loading}>
								{pendingMissionIsDone ? 'Remettre à faire' : 'Valider'}
							</button>
						</div>
					</div>
				</div>
			)}
			<div className="card">
				<h2>Ta progression</h2>
				<p>{loading ? 'Chargement…' : `${done.length} missions sur 28 · ${Math.round(done.length / 28 * 100)}%`}</p>
				<progress max={28} value={done.length} aria-label="Progression du challenge" />
				{lastAction && (
					<div className="status-pill" role="status" aria-live="polite">
						<span className="status-pill__dot" aria-hidden="true" />
						{lastAction.done ? `Mission ${lastAction.day} validée.` : `Mission ${lastAction.day} remise à faire.`}
					</div>
				)}
				{error && (
					<p role="alert">
						{error}{' '}
						<button className="btn btn2" onClick={() => { setLoading(true); setAttempt((value) => value + 1); }}>
							Recharger
						</button>
					</p>
				)}
			</div>

			<section className="dashboard-overview" aria-label="Résumé de ton activité">
				<article className="card dashboard-next">
					<p className="accent eyebrow">Prochaine action</p>
					{loading ? <p>Chargement de ta prochaine mission…</p> : nextMission ? (
						<>
							<h2>Jour {nextMission.day} · {nextMission.title}</h2>
							<p>{nextMission.instruction}</p>
							<a className="btn btn2" href={`#mission-${nextMission.day}`}>Continuer la mission</a>
						</>
					) : (
						<>
							<h2>Challenge terminé</h2>
							<p>Tu as validé les 28 missions. Retrouve tes livrables et prépare la suite.</p>
							<Link className="btn btn2" href="/ressources">Voir les ressources</Link>
						</>
					)}
				</article>

				<article className="card dashboard-chart">
					<div className="dashboard-card-heading">
						<div>
							<p className="accent eyebrow">Challenge · 28 jours</p>
							<h2>Avancement par semaine</h2>
						</div>
						<span className="muted">{loading ? '…' : `${done.length}/28`}</span>
					</div>
					<div className="dashboard-bars" aria-label="Missions terminées par semaine">
						{[1, 2, 3, 4].map((week) => {
							const completed = done.filter((day) => day > (week - 1) * 7 && day <= week * 7).length;
							return (
								<div className="dashboard-bar-row" key={week}>
									<span>S{week}</span>
									<progress max={7} value={loading ? 0 : completed} aria-label={`Semaine ${week} : ${completed} missions sur 7 terminées`} />
									<span>{loading ? '–' : `${completed}/7`}</span>
								</div>
							);
						})}
					</div>
				</article>

				<article className="card dashboard-pipeline">
					<div className="dashboard-card-heading">
						<div>
							<p className="accent eyebrow">Prospection</p>
							<h2>Mon pipeline</h2>
						</div>
						<Link href="/crm" aria-label="Ouvrir le CRM">Ouvrir le CRM</Link>
					</div>
					{insightError ? <p role="status">{insightError}</p> : loading ? <p>Chargement du pipeline…</p> : totalProspects === 0 ? (
						<p>Pas encore de prospects. Ajoute ton premier contact dans le CRM.</p>
					) : (
						<div className="dashboard-pipeline-rows">
							{PIPELINE_STATUSES.map((status) => (
								<div className="dashboard-pipeline-row" key={status}>
									<span>{status}</span>
									<strong>{prospectCounts[status]}</strong>
									<progress max={totalProspects} value={prospectCounts[status]} aria-label={`${status} : ${prospectCounts[status]} prospects`} />
								</div>
							))}
						</div>
					)}
				</article>
			</section>

			{[1, 2, 3, 4].map((week) => (
				<section className="section" key={week}>
					<h2>Semaine {week}</h2>
					{MISSIONS.slice((week - 1) * 7, week * 7).map((mission) => (
						<details className="mission card" id={`mission-${mission.day}`} key={mission.day} open={!loading && nextMission?.day === mission.day}>
							<summary>Jour {mission.day} — {mission.title}{done.includes(mission.day) ? ' ✓' : ''}</summary>
							<p>{mission.instruction}</p>
							<p><strong>Livrable :</strong> {mission.deliverable}</p>
							<button
								className="btn btn2"
								disabled={loading || busy || !userId}
								aria-pressed={done.includes(mission.day)}
								onClick={() => setPendingMission(mission.day)}
							>
								{done.includes(mission.day) ? 'Marquer à faire' : 'Marquer comme terminé'}
							</button>
						</details>
					))}
				</section>
			))}
		</>
	);
}
