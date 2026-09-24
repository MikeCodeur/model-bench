/* @ds-bundle: {"format":4,"namespace":"DesignSystem_7bd165","components":[],"sourceHashes":{"high-tiket-platform-v4.7.js":"e469a2b74436","high-tiket-theme.js":"5bc01b6b638d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_7bd165 = window.DesignSystem_7bd165 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// high-tiket-platform-v4.7.js
try { (() => {
const root = document.querySelector('#screen-root');
const sidebar = document.querySelector('.sidebar');
const scrim = document.querySelector('.mobile-scrim');
const mobileNavButton = document.querySelector('.mobile-app-nav');
const globalSearch = document.querySelector('.app-search input');
const toast = document.querySelector('#demo-toast');
const pilotageMarkup = root.innerHTML;
const screenNames = {
  pilotage: 'Pilotage',
  candidatures: 'Candidatures',
  membres: 'Membres',
  coaching: 'Calls & coaching',
  agents: 'Agents internes',
  encaissements: 'Encaissements',
  communaute: 'Communauté',
  cohortes: 'Cohortes',
  progression: 'Progression membres',
  livrables: 'Livrables à relire',
  lives: 'Lives & ateliers',
  formations: 'Formations vidéo',
  'communaute-thread': 'Thread · Communauté',
  lecteur: 'Lecteur · Formations',
  atelier: 'Atelier live'
};
const parentScreens = {
  'communaute-thread': 'communaute',
  lecteur: 'formations',
  atelier: 'lives'
};
const avatar = initials => `<span class="avatar">${initials}</span>`;
const status = (label, tone = '') => `<span class="chip"><span class="status-dot ${tone ? `status-dot--${tone}` : ''}"></span>${label}</span>`;
const button = (label, variant = 'outline') => `<button class="button button--small ${variant === 'default' ? '' : `button--${variant}`}" data-demo-action="${label}">${label}</button>`;
const screenLink = (label, href, variant = 'outline') => `<a class="button button--small ${variant === 'default' ? '' : `button--${variant}`}" href="#${href}">${label}</a>`;
const heading = ({
  title,
  context,
  actions = ''
}) => `
  <header class="screen-heading">
    <div>
      <p class="data-label" style="margin:0 0 .8rem">${context}</p>
      <h1>${title}</h1>
    </div>
    <div class="screen-heading__actions">${actions}</div>
  </header>`;
const summaries = items => `
  <section class="screen-summary" aria-label="Résumé">
    ${items.map(({
  label,
  value,
  note = '',
  tone = ''
}) => `
        <div class="screen-summary__item">
          <div class="data-label">${label}</div>
          <div class="screen-summary__value tabular" ${tone ? `style="color:var(--${tone})"` : ''}>${value}</div>
          <div class="${note.startsWith('▲') ? 'delta' : 'meta'}">${note}</div>
        </div>`).join('')}
  </section>`;
const panel = (title, body, action = '') => `
  <section class="surface surface--sharp">
    <div class="panel-head"><span class="meta">${title}</span>${action}</div>
    ${body}
  </section>`;
const progressTriple = (learning, execution, outcome) => `
  <div class="progress-triple" aria-label="Apprentissage ${learning} %, exécution ${execution} %, outcome ${outcome} %">
    <span style="--value:${learning}%;--tone:var(--line-strong)"></span>
    <span style="--value:${execution}%"></span>
    <span style="--value:${outcome}%;--tone:var(--success)"></span>
  </div>`;
const candidates = [['YB', 'Yanis Belkacem', 'Lead dev · Fintech', '87', 'Call 14h', 'qualified'], ['CR', 'Camille Roussel', 'CTO · Northbound Studio', '92', 'Admis', 'admitted'], ['TL', 'Thomas Lenoir', 'Consultant · Indépendant', '74', 'Rappeler', 'followup'], ['AM', 'Aïcha Mbaye', 'Staff engineer · Kaelis', '81', 'Call 25.08', 'qualified'], ['SG', 'Simon Garreau', 'Freelance · Verso', '58', 'Hors cible', 'rejected'], ['LB', 'Louise Bernard', 'Engineering manager · Agora', '90', 'À décider', 'qualified']];
const memberData = [['JM', 'Julie Marchand', 'C-04 · Groupe A', 94, 82, 64, 'Dans les temps', 'active'], ['CR', 'Camille Roussel', 'C-04 · Groupe B', 88, 76, 71, 'Review demain', 'active'], ['SG', 'Simon Garreau', 'C-04 · Groupe A', 62, 34, 20, 'Inactif 8 jours', 'risk'], ['LB', 'Louise Bernard', 'C-04 · Groupe B', 79, 68, 52, 'Feedback attendu', 'review'], ['AM', 'Aïcha Mbaye', 'C-04 · Groupe A', 100, 91, 82, 'En avance', 'active'], ['TR', 'Thomas Roussel', 'C-03 · Alumni', 100, 100, 88, 'Terminé', 'completed']];
const screens = {
  candidatures: () => `
    ${heading({
    title: 'Transformer les bons profils en décisions claires.',
    context: 'Acquisition · Cohorte 05',
    actions: `${button('Importer', 'outline')}${button('Nouvelle candidature', 'default')}`
  })}
    ${summaries([{
    label: 'À qualifier',
    value: '21',
    note: '▲ 6 cette semaine'
  }, {
    label: 'Calls planifiés',
    value: '27',
    note: '44 % du flux'
  }, {
    label: 'Score moyen',
    value: '78',
    note: 'sur 100'
  }, {
    label: 'Places restantes',
    value: '4',
    note: 'sur 18',
    tone: 'warning'
  }])}
    <div class="screen-grid">
      ${panel('Pipeline · 62 candidatures', `<div class="toolbar">
          <div class="toolbar__filters" data-filter-group>
            <button class="filter-button" aria-pressed="true" data-filter="all">Tout</button>
            <button class="filter-button" aria-pressed="false" data-filter="qualified">Qualifiés</button>
            <button class="filter-button" aria-pressed="false" data-filter="followup">À rappeler</button>
            <button class="filter-button" aria-pressed="false" data-filter="rejected">Hors cible</button>
          </div>
          <span class="meta">tri · score décroissant</span>
        </div>
        <div class="record-list">
          ${candidates.map(([initials, name, meta, score, action, filter]) => `
              <div class="record-row" data-filter-value="${filter}" data-searchable="${name} ${meta}">
                <div class="record-primary">${avatar(initials)}<span><strong>${name}</strong><span class="meta" style="display:block">${meta}</span></span></div>
                <span class="record-secondary">Score agent</span>
                <strong class="tabular">${score}</strong>
                <div class="record-actions">${button(action, filter === 'qualified' ? 'outline' : 'ghost')}</div>
              </div>`).join('')}
          <div class="empty-filter">Aucune candidature ne correspond à ce filtre.</div>
        </div>`)}
      <div class="screen-stack">
        ${panel('À décider aujourd’hui', `<div class="panel-body">
            <p class="data-label">Louise Bernard · score 90</p>
            <h2 class="panel-title" style="margin-top:.7rem">Le niveau est confirmé. La disponibilité reste ambiguë.</h2>
            <p style="color:var(--muted)">L’agent recommande un call court centré sur l’engagement hebdomadaire et le projet d’application.</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.5rem">${button('Planifier le call', 'default')}${button('Voir le dossier', 'outline')}</div>
          </div>`)}
        ${panel('Sources', `<div class="panel-body">
            <div class="data-row"><span class="status-dot status-dot--active"></span><span>LinkedIn organique</span><strong class="tabular">31</strong></div>
            <div class="data-row"><span class="status-dot"></span><span>Recommandation</span><strong class="tabular">18</strong></div>
            <div class="data-row"><span class="status-dot"></span><span>YouTube</span><strong class="tabular">9</strong></div>
            <div class="data-row"><span class="status-dot"></span><span>Autre</span><strong class="tabular">4</strong></div>
          </div>`)}
      </div>
    </div>`,
  membres: () => `
    ${heading({
    title: 'Chaque membre, son état réel et sa prochaine action.',
    context: 'Delivery · 74 enrollments actifs',
    actions: `${button('Exporter', 'outline')}${button('Ajouter un membre', 'default')}`
  })}
    ${summaries([{
    label: 'Dans les temps',
    value: '58',
    note: '78 %'
  }, {
    label: 'En avance',
    value: '7',
    note: '▲ 2 cette semaine'
  }, {
    label: 'À risque',
    value: '3',
    note: 'intervention requise',
    tone: 'danger'
  }, {
    label: 'Sans Next Action',
    value: '0',
    note: 'objectif respecté',
    tone: 'success'
  }])}
    <div class="screen-grid">
      ${panel('Membres · C-04', `<div class="toolbar"><div class="toolbar__filters" data-filter-group><button class="filter-button" aria-pressed="true" data-filter="all">Tous</button><button class="filter-button" aria-pressed="false" data-filter="risk">À risque</button><button class="filter-button" aria-pressed="false" data-filter="review">Review</button><button class="filter-button" aria-pressed="false" data-filter="completed">Terminés</button></div><span class="meta">Learning · Exécution · Outcome</span></div>
        <div class="record-list">
          ${memberData.map(([initials, name, group, learn, execute, outcome, next, filter]) => `
              <div class="record-row" data-filter-value="${filter}" data-searchable="${name} ${group} ${next}">
                <div class="record-primary">${avatar(initials)}<span><strong>${name}</strong><span class="meta" style="display:block">${group}</span></span></div>
                ${progressTriple(learn, execute, outcome)}
                <span class="record-secondary">${next}</span>
                <div class="record-actions">${button('Ouvrir', filter === 'risk' ? 'default' : 'outline')}</div>
              </div>`).join('')}
          <div class="empty-filter">Aucun membre dans cet état.</div>
        </div>`)}
      <div class="screen-stack">
        ${panel('Signal prioritaire', `<div class="panel-body">
            <div style="display:flex;align-items:center;gap:.8rem">${avatar('SG')}<span><strong>Simon Garreau</strong><span class="meta" style="display:block">C-04 · Groupe A</span></span></div>
            <h2 class="panel-title" style="margin-top:1.5rem">Huit jours sans activité, livrable non commencé.</h2>
            <p style="color:var(--muted)">Le dernier blocker « manque de temps » est toujours ouvert. Prochaine action : contact coach avant demain 18:00.</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.5rem">${button('Intervenir', 'default')}${button('Voir la timeline', 'outline')}</div>
          </div>`)}
        ${panel('Légende progression', `<div class="panel-body"><div class="data-row"><span style="width:1rem;height:.3rem;background:var(--line-strong)"></span><span>Learning</span><span class="meta">contenu</span></div><div class="data-row"><span style="width:1rem;height:.3rem;background:var(--cobalt)"></span><span>Exécution</span><span class="meta">actions</span></div><div class="data-row"><span style="width:1rem;height:.3rem;background:var(--success)"></span><span>Outcome</span><span class="meta">résultats</span></div></div>`)}
      </div>
    </div>`,
  coaching: () => `
    ${heading({
    title: 'Préparer moins. Décider mieux pendant chaque session.',
    context: 'Coaching · Semaine du 24 août',
    actions: `${button('Synchroniser', 'outline')}${button('Nouvelle session', 'default')}`
  })}
    <div class="calendar-strip" aria-label="Semaine de coaching">
      ${[['Lun. 24', '3 sessions', ''], ['Mar. 25', '5 sessions', ''], ['Mer. 26', '4 sessions', 'today'], ['Jeu. 27', '6 sessions', ''], ['Ven. 28', '3 sessions', ''], ['Sam. 29', 'Atelier', ''], ['Dim. 30', 'Libre', '']].map(([day, event, today]) => `<div class="calendar-day ${today ? 'calendar-day--today' : ''}"><div class="data-label">${day}</div><div class="calendar-event">${event}</div></div>`).join('')}
    </div>
    <div class="screen-grid">
      ${panel('Aujourd’hui · 4 sessions', `<div class="schedule-row"><span class="meta tabular">09:30</span><span><span class="schedule-row__title">Coaching 1:1 — Camille Roussel</span><span class="meta" style="display:block">Positionnement · 3 actions ouvertes</span></span>${button('Préparer', 'default')}</div>
        <div class="schedule-row"><span class="meta tabular">11:00</span><span><span class="schedule-row__title">Atelier — Architecture d’agents</span><span class="meta" style="display:block">22 inscrits · 4 questions</span></span>${button('Ouvrir', 'outline')}</div>
        <div class="schedule-row"><span class="meta tabular">14:00</span><span><span class="schedule-row__title">Call d’admission — Yanis</span><span class="meta" style="display:block">Score 87 · disponibilité à valider</span></span>${button('Brief', 'outline')}</div>
        <div class="schedule-row"><span class="meta tabular">16:30</span><span><span class="schedule-row__title">Revue collective — Groupe B</span><span class="meta" style="display:block">6 membres · 6 rendus</span></span>${button('6 rendus', 'outline')}</div>`)}
      <div class="screen-stack">
        ${panel('Brief automatique · 09:30', `<div class="panel-body"><p class="data-label">Camille Roussel · depuis le dernier call</p><h2 class="panel-title" style="margin-top:.7rem">Le livrable est validé. Le blocker s’est déplacé vers le positionnement.</h2><div style="margin-top:1.5rem"><div class="data-row"><span class="status-dot status-dot--success"></span><span>Milestone 03 validé</span><span class="meta">+1</span></div><div class="data-row"><span class="status-dot status-dot--active"></span><span>3 offres comparées</span><span class="meta">nouveau</span></div><div class="data-row"><span class="status-dot status-dot--danger"></span><span>Pricing non décidé</span><span class="meta">blocker</span></div></div><div style="margin-top:1.5rem">${button('Ouvrir le contexte', 'default')}</div></div>`)}
        ${panel('Charge coach', `<div class="panel-body"><div class="data-row"><span class="meta">Marc</span><span>14 enrollments</span><strong>82 %</strong></div><div class="data-row"><span class="meta">Sarah</span><span>12 enrollments</span><strong>68 %</strong></div><div class="data-row"><span class="meta">Nicolas</span><span>11 enrollments</span><strong>61 %</strong></div></div>`)}
      </div>
    </div>`,
  agents: () => `
    ${heading({
    title: 'Des agents visibles, bornés et responsables de leurs actions.',
    context: 'Agents internes · 5 configurés',
    actions: `${button('Voir les tools', 'outline')}${button('Configurer un agent', 'default')}`
  })}
    ${summaries([{
    label: 'Actifs',
    value: '4',
    note: 'sur 5'
  }, {
    label: 'Runs aujourd’hui',
    value: '248',
    note: '97,6 % réussis'
  }, {
    label: 'Approvals',
    value: '3',
    note: 'en attente',
    tone: 'warning'
  }, {
    label: 'Actions refusées',
    value: '7',
    note: 'hors scope'
  }])}
    <div class="screen-grid">
      ${panel('Catalogue et autonomie', `<div class="agent-row"><span class="agent-glyph">ACQ</span><span><strong>Acquisition</strong><span class="meta" style="display:block">enrichissement · attribution</span></span><span>Read · Suggest</span>${status('Actif', 'active')}${button('Configurer', 'outline')}</div>
        <div class="agent-row"><span class="agent-glyph">SET</span><span><strong>Setting</strong><span class="meta" style="display:block">conversation · relance</span></span><span>Read · Suggest</span>${status('Actif', 'active')}${button('Configurer', 'outline')}</div>
        <div class="agent-row"><span class="agent-glyph">CS</span><span><strong>Student Success</strong><span class="meta" style="display:block">risques · interventions</span></span><span>Read · Suggest</span>${status('Actif', 'active')}${button('Configurer', 'outline')}</div>
        <div class="agent-row"><span class="agent-glyph">CO</span><span><strong>Coach Copilot</strong><span class="meta" style="display:block">briefs · next actions</span></span><span>Read</span>${status('Actif', 'active')}${button('Configurer', 'outline')}</div>
        <div class="agent-row"><span class="agent-glyph">OPS</span><span><strong>Content Ops</strong><span class="meta" style="display:block">drafts · ressources</span></span><span>Read · Suggest</span>${status('Inactif')}${button('Configurer', 'outline')}</div>`)}
      <div class="screen-stack">
        ${panel('Approvals à décider', `<div class="panel-body"><div class="data-row"><span class="status-dot status-dot--active"></span><span>Relancer 3 onboardings</span><span class="meta">CS</span></div><div class="data-row"><span class="status-dot status-dot--active"></span><span>Qualifier Louise à 90</span><span class="meta">ACQ</span></div><div class="data-row"><span class="status-dot status-dot--danger"></span><span>Changer 6 Next Actions</span><span class="meta">CS</span></div><div style="display:flex;gap:.5rem;margin-top:1.5rem;flex-wrap:wrap">${button('Ouvrir la queue', 'default')}${button('Tout auditer', 'outline')}</div></div>`)}
        ${panel('Derniers runs', `<div class="panel-body"><div class="data-row"><span class="meta tabular">10:42</span><span>Coach brief · Camille</span><span class="chip">1,2 s</span></div><div class="data-row"><span class="meta tabular">10:40</span><span>Risk scan · C-04</span><span class="chip">4,8 s</span></div><div class="data-row"><span class="meta tabular">10:38</span><span>Lead enrichment · 6</span><span class="chip">8,1 s</span></div></div>`)}
      </div>
    </div>`,
  encaissements: () => `
    ${heading({
    title: 'Relier le cash collecté aux ventes et aux accès délivrés.',
    context: 'Commerce · Août 2026',
    actions: `${button('Rapprocher', 'outline')}${button('Exporter', 'outline')}${button('Nouvel encaissement', 'default')}`
  })}
    ${summaries([{
    label: 'Encaissé ce mois',
    value: '52,4 k€',
    note: '▲ 11,8 %'
  }, {
    label: 'À recevoir',
    value: '18,2 k€',
    note: '14 échéances'
  }, {
    label: 'Impayés',
    value: '3,4 k€',
    note: '4 comptes',
    tone: 'danger'
  }, {
    label: 'Lifetime',
    value: '486,2 k€',
    note: 'depuis le lancement'
  }])}
    <div class="screen-grid">
      ${panel('Derniers mouvements', `<div class="toolbar"><div class="toolbar__filters" data-filter-group><button class="filter-button" aria-pressed="true" data-filter="all">Tous</button><button class="filter-button" aria-pressed="false" data-filter="paid">Payés</button><button class="filter-button" aria-pressed="false" data-filter="due">À venir</button><button class="filter-button" aria-pressed="false" data-filter="failed">Échecs</button></div><span class="meta">EUR · TTC</span></div>
        <div class="record-list">
          <div class="money-row" data-filter-value="paid" data-searchable="Camille Roussel"><span><strong>Camille Roussel</strong><span class="meta" style="display:block">HT-C04 · comptant</span></span><span>Stripe</span><strong class="tabular">3 400 €</strong>${status('Payé', 'success')}${button('Ouvrir', 'outline')}</div>
          <div class="money-row" data-filter-value="due" data-searchable="Yanis Belkacem"><span><strong>Yanis Belkacem</strong><span class="meta" style="display:block">HT-C05 · échéance 2/4</span></span><span>28.08</span><strong class="tabular">850 €</strong>${status('À venir')}${button('Ouvrir', 'outline')}</div>
          <div class="money-row" data-filter-value="failed" data-searchable="Simon Garreau"><span><strong>Simon Garreau</strong><span class="meta" style="display:block">HT-C04 · échéance 3/4</span></span><span>Carte refusée</span><strong class="tabular">850 €</strong>${status('Échec', 'danger')}${button('Résoudre', 'default')}</div>
          <div class="money-row" data-filter-value="paid" data-searchable="Aïcha Mbaye"><span><strong>Aïcha Mbaye</strong><span class="meta" style="display:block">HT-C04 · comptant</span></span><span>Virement</span><strong class="tabular">3 400 €</strong>${status('Payé', 'success')}${button('Ouvrir', 'outline')}</div>
          <div class="empty-filter">Aucun mouvement dans cet état.</div>
        </div>`)}
      <div class="screen-stack">
        ${panel('Réconciliation', `<div class="panel-body"><div class="data-row"><span class="status-dot status-dot--danger"></span><span>Payé sans enrollment</span><strong>1</strong></div><div class="data-row"><span class="status-dot status-dot--danger"></span><span>Enrollment sans order</span><strong>2</strong></div><div class="data-row"><span class="status-dot status-dot--success"></span><span>Webhooks rapprochés</span><strong>100 %</strong></div><div style="margin-top:1.5rem">${button('Traiter 3 écarts', 'default')}</div></div>`)}
        ${panel('Échéances à risque', `<div class="panel-body"><div class="data-row"><span class="meta">28.08</span><span>4 échéances</span><strong>3,4 k€</strong></div><div class="data-row"><span class="meta">05.09</span><span>6 échéances</span><strong>5,1 k€</strong></div><div class="data-row"><span class="meta">12.09</span><span>4 échéances</span><strong>3,4 k€</strong></div></div>`)}
      </div>
    </div>`,
  communaute: () => `
    ${heading({
    title: 'La doctrine se construit dans les conversations.',
    context: 'Communauté · 142 membres · 7 espaces',
    actions: `${button('Gérer les espaces', 'outline')}${button('Nouveau thread', 'default')}`
  })}
    <section class="community-feature" aria-labelledby="featured-thread-title">
      <div class="community-feature__main">
        <div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem">
            <span class="chip">Réponse retenue</span>
            <span class="chip">Vérification</span>
            <span class="chip">Milestone 04</span>
          </div>
          <h2 id="featured-thread-title" class="community-feature__title">Comment rendre testable un invariant « aucune perte de donnée » ?</h2>
          <p style="max-width:58ch;color:#c5c0b4">Julie documente un cas réel de migration interrompue. La réponse retenue propose un harnais différentiel et une vérification par comptage avant/après.</p>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:.75rem">${avatar('JM')}<span><strong>Julie Marchand</strong><span class="meta" style="display:block">il y a 2 h · 14 réponses</span></span></div>
          ${screenLink('Lire la conversation', 'communaute-thread', 'default')}
        </div>
      </div>
      <aside class="community-feature__aside">
        <span class="data-label">Connaissance vivante · 7 jours</span>
        <div class="knowledge-stat"><div class="knowledge-stat__value tabular">18</div><div class="meta">réponses retenues</div></div>
        <div class="knowledge-stat"><div class="knowledge-stat__value tabular">42</div><div class="meta">ressources suggérées</div></div>
        <div class="knowledge-stat"><div class="knowledge-stat__value tabular">27</div><div class="meta">questions résolues sans nouveau thread</div></div>
      </aside>
    </section>
    <nav class="space-list" aria-label="Espaces communautaires">
      ${[['Questions', '18 nouveaux · 4 sans réponse'], ['Retours de terrain', '12 cette semaine'], ['Vitrine de livrables', '6 nouvelles preuves'], ['Offres & tarifs', '31 discussions'], ['Recrutement & missions', '8 opportunités'], ['Alumni', '42 membres actifs']].map(([name, note]) => `<a class="space-item" href="#communaute" data-demo-action="Filtrer l’espace ${name}"><span class="data-label">Espace</span><strong style="display:block;margin-top:.65rem;font-family:var(--font-display);font-size:1.25rem">${name}</strong><span class="meta" style="display:block;margin-top:.7rem">${note}</span></a>`).join('')}
    </nav>
    <div class="screen-grid">
      ${panel('Questions actives', `<div class="toolbar"><div class="toolbar__filters" data-filter-group><button class="filter-button" aria-pressed="true" data-filter="all">Récentes</button><button class="filter-button" aria-pressed="false" data-filter="unanswered">Sans réponse</button><button class="filter-button" aria-pressed="false" data-filter="retained">Réponse retenue</button></div><span class="meta">4 espaces suivis</span></div>
        <div class="record-list">
          <article class="thread-row" data-filter-value="retained" data-searchable="invariant perte donnée"><span class="avatar">JM</span><div><span class="meta">Vérification · il y a 2 h</span><h3 style="margin:.35rem 0 .5rem;font-size:1rem">Comment rendre testable un invariant « aucune perte de donnée » ?</h3><span class="chip">14 réponses</span> <span class="chip">Réponse retenue</span></div>${screenLink('Ouvrir', 'communaute-thread')}</article>
          <article class="thread-row" data-filter-value="unanswered" data-searchable="agents écriture lock"><span class="avatar">SL</span><div><span class="meta">Orchestration · il y a 38 min</span><h3 style="margin:.35rem 0 .5rem;font-size:1rem">Trois agents sur le même module : quelle stratégie de lock ?</h3><span class="chip">0 réponse</span> <span class="chip">Groupe B</span></div>${screenLink('Répondre', 'communaute-thread', 'default')}</article>
          <article class="thread-row" data-filter-value="retained" data-searchable="contexte jetons précision"><span class="avatar">AB</span><div><span class="meta">Contexte · hier</span><h3 style="margin:.35rem 0 .5rem;font-size:1rem">Jetons divisés par quatre sans perte de précision</h3><span class="chip">22 réponses</span> <span class="chip">94 utiles</span></div>${screenLink('Ouvrir', 'communaute-thread')}</article>
          <article class="thread-row" data-filter-value="all" data-searchable="migration post mortem"><span class="avatar">TR</span><div><span class="meta">Post-mortem · hier</span><h3 style="margin:.35rem 0 .5rem;font-size:1rem">L’agent a supprimé une migration et les tests étaient verts</h3><span class="chip">40 réponses</span> <span class="chip">M-04</span></div>${screenLink('Ouvrir', 'communaute-thread')}</article>
          <div class="empty-filter">Aucun thread ne correspond à ce filtre.</div>
        </div>`)}
      <div class="screen-stack">
        ${panel('À répondre par un coach', `<div class="panel-body"><p class="data-label">4 threads · SLA 24 h</p><h2 class="panel-title" style="margin-top:.7rem">Deux questions bloquent une action en cours.</h2><p style="color:var(--muted)">Les threads liés à un blocker ouvert passent avant les discussions générales.</p><div style="margin-top:1.5rem">${screenLink('Traiter la queue', 'communaute-thread', 'default')}</div></div>`)}
        ${panel('Espaces suivis', `<div class="panel-body"><div class="data-row"><span class="status-dot status-dot--active"></span><span>Questions</span><strong>18</strong></div><div class="data-row"><span class="status-dot"></span><span>Retours de terrain</span><strong>12</strong></div><div class="data-row"><span class="status-dot"></span><span>Vitrine de livrables</span><strong>6</strong></div><div class="data-row"><span class="status-dot"></span><span>Offres & tarifs</span><strong>31</strong></div></div>`)}
      </div>
    </div>`,
  'communaute-thread': () => `
    ${heading({
    title: 'Comment rendre testable un invariant « aucune perte de donnée » ?',
    context: 'Communauté / Questions / Vérification',
    actions: `${screenLink('Retour aux threads', 'communaute', 'outline')}${button('Suivre le thread', 'default')}`
  })}
    <div class="thread-detail-grid">
      <div>
        <article class="surface thread-article">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:.8rem">${avatar('JM')}<span><strong>Julie Marchand</strong><span class="meta" style="display:block">C-04 · Groupe A · il y a 2 h</span></span></div>
            <div style="display:flex;gap:.5rem"><span class="chip">Vérification</span><span class="chip">M-04</span></div>
          </div>
          <div class="thread-copy">
            <p>Je dois migrer environ 18 millions de lignes. Mon invariant principal est « aucune perte de donnée », mais mon test actuel ne fait que comparer le nombre de lignes avant et après une exécution nominale.</p>
            <p>Le problème apparaît lorsqu’un worker tombe après l’écriture mais avant l’acknowledgement. Le retry peut rejouer le même lot. Je cherche une preuve qui couvre interruption, reprise et idempotence sans comparer manuellement chaque enregistrement.</p>
          </div>
          <pre class="thread-code"><code>Given 18 042 817 source rows
When migration stops after batch #284
And the same batch is retried twice
Then target row count = source row count
And every source business key exists exactly once
And the migration journal explains each replay</code></pre>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-top:1.5rem">
            <div style="display:flex;gap:.5rem"><button class="filter-button" aria-pressed="true" data-demo-action="Vote utile">23 utiles</button><button class="filter-button" aria-pressed="false" data-demo-action="Enregistrer le thread">Enregistrer</button></div>
            <span class="meta">14 réponses · dernière activité il y a 18 min</span>
          </div>
        </article>

        <section class="reply-list surface surface--sharp" aria-labelledby="answers-title">
          <div class="panel-head"><span id="answers-title" class="meta">14 réponses · triées par utilité</span><button class="button button--small button--ghost" data-demo-action="Changer le tri">Plus utiles</button></div>
          <article class="reply reply--retained">
            ${avatar('MB')}
            <div>
              <div class="reply__head"><span><strong>Marc Bertrand</strong><span class="meta" style="margin-left:.5rem">Coach · il y a 1 h</span></span><span class="chip"><span class="status-dot status-dot--active"></span> Réponse retenue</span></div>
              <p>Le comptage global est nécessaire, mais insuffisant. Ta preuve doit porter sur la clé métier et sur le journal de reprise. Construis trois assertions séparées : conservation du cardinal, unicité de chaque business key, puis couverture de tous les batches par un état terminal.</p>
              <p>Ensuite, injecte volontairement une interruption entre write et ack. Le même test doit passer après un, deux et cinq retries. Tu ne prouves pas que « le script a fini » ; tu prouves que chaque ligne source possède exactement une image cible explicable.</p>
              <div class="thread-code" style="margin-top:1rem">source_keys EXCEPT target_keys = ∅<br />target_keys GROUP BY key HAVING count(*) ≠ 1 = ∅<br />journal batches without terminal state = ∅</div>
              <div style="display:flex;gap:.5rem;margin-top:1rem"><button class="filter-button" aria-pressed="true" data-demo-action="Vote utile">41 utiles</button><button class="filter-button" aria-pressed="false" data-demo-action="Répondre à Marc">Répondre</button></div>
            </div>
          </article>
          <article class="reply">
            ${avatar('SL')}
            <div><div class="reply__head"><span><strong>Sofia Lorca</strong><span class="meta" style="margin-left:.5rem">C-04 · il y a 47 min</span></span><span class="meta">12 utiles</span></div><p>J’ajouterais un checksum par partition, mais uniquement comme diagnostic. Il permet de localiser vite le lot divergent ; il ne remplace pas la preuve d’unicité sur la clé métier.</p></div>
          </article>
          <article class="reply">
            ${avatar('AB')}
            <div><div class="reply__head"><span><strong>Amine Bertin</strong><span class="meta" style="margin-left:.5rem">Alumni · il y a 31 min</span></span><span class="meta">8 utiles</span></div><p>Sur notre migration, on a aussi persisté l’idempotency key avec le numéro de batch. Ça rend le replay observable et évite que le test dépende d’un timing artificiel.</p></div>
          </article>
        </section>

        <form class="surface reply-composer" data-demo-form="reply">
          <label for="reply-body"><span class="data-label">Votre réponse</span></label>
          <textarea id="reply-body" class="field" placeholder="Décrivez la décision, la preuve ou le retour terrain utile…"></textarea>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-top:1rem"><span class="meta">Markdown · code · fichiers · mention</span><button class="button button--small" type="submit">Publier la réponse</button></div>
        </form>
      </div>

      <aside class="screen-stack">
        ${panel('Contexte de delivery', `<a class="context-link" href="#lecteur"><span class="meta">M-04</span><span><strong>Vérification et tests</strong><span class="meta" style="display:block">Lesson 04.2 · invariant testable</span></span></a><a class="context-link" href="#livrables"><span class="meta">TASK</span><span><strong>Harnais de migration</strong><span class="meta" style="display:block">Deliverable · C-04</span></span></a><a class="context-link" href="#atelier"><span class="meta">LIVE</span><span><strong>Revue ouverte vendredi</strong><span class="meta" style="display:block">14:00 · 18 inscrits</span></span></a>`)}
        ${panel('Ressources citées', `<div class="panel-body"><div class="data-row"><span class="meta">MD</span><span>migration-invariants.md</span>${button('Ouvrir', 'ghost')}</div><div class="data-row"><span class="meta">TS</span><span>harness.contract.spec.ts</span>${button('Ouvrir', 'ghost')}</div><div class="data-row"><span class="meta">LIVE</span><span>Replay · retries</span>${button('38 min', 'ghost')}</div></div>`)}
        ${panel('Participants', `<div class="panel-body"><div style="display:flex;align-items:center;gap:-.25rem">${['JM', 'MB', 'SL', 'AB', 'TR'].map(avatar).join('')}</div><p class="meta" style="margin-top:1rem">9 membres · 2 coaches · 3 alumni</p></div>`)}
      </aside>
    </div>`,
  cohortes: () => `
    ${heading({
    title: 'Des contextes de delivery, pas des dossiers de membres.',
    context: 'Cohortes · 4 actives',
    actions: `${button('Comparer', 'outline')}${button('Créer une cohorte', 'default')}`
  })}
    <div class="cohort-board">
      ${[['C-04', 'HighTiket · Août', 'Semaine 5 / 8', '74 / 80', 5, 'active'], ['C-05', 'HighTiket · Octobre', 'Admissions', '14 / 18', 1, 'active'], ['C-03', 'HighTiket · Avril', 'Terminée', '68 / 72', 8, 'success'], ['EV-01', 'HighTiket Evergreen', 'Day 0 individuel', '21 / ∞', 3, '']].map(([code, name, phase, capacity, done, tone]) => `<article class="surface cohort-sheet">
            <div class="cohort-sheet__head"><div><span class="data-label">${code}</span><h2 class="panel-title" style="margin-top:.5rem">${name}</h2></div>${status(phase, tone)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:2rem"><div><span class="data-label">Capacité</span><strong class="tabular" style="display:block;font-size:1.4rem;margin-top:.3rem">${capacity}</strong></div><div><span class="data-label">À risque</span><strong class="tabular" style="display:block;font-size:1.4rem;margin-top:.3rem">${tone === 'success' ? '—' : Math.max(0, 6 - done)}</strong></div></div>
            <div class="cohort-phase" aria-label="Progression de la cohorte">${Array.from({
    length: 8
  }, (_, i) => `<span data-done="${i < done}"></span>`).join('')}</div>
            <div style="display:flex;gap:.5rem;margin-top:2rem">${button('Ouvrir', 'outline')}${button('Membres', 'ghost')}</div>
          </article>`).join('')}
    </div>
    <div class="screen-grid screen-grid--equal">
      ${panel('Capacité à 30 jours', `<div class="panel-body"><div class="data-row"><span class="meta">C-04</span><span>6 places disponibles</span><strong>92 %</strong></div><div class="data-row"><span class="meta">C-05</span><span>4 places disponibles</span><strong>78 %</strong></div><div class="data-row"><span class="meta">EV-01</span><span>Admissions continues</span><strong>21</strong></div></div>`)}
      ${panel('Prochaines transitions', `<div class="panel-body"><div class="data-row"><span class="meta">28.08</span><span>C-04 · Semaine 6</span>${button('Préparer', 'outline')}</div><div class="data-row"><span class="meta">12.09</span><span>C-04 · Bilan final</span>${button('Voir', 'outline')}</div><div class="data-row"><span class="meta">01.10</span><span>C-05 · Démarrage</span>${button('Voir', 'outline')}</div></div>`)}
    </div>`,
  progression: () => `
    ${heading({
    title: 'Voir ce qui est appris, exécuté et réellement obtenu.',
    context: 'Progression · Cohorte 04',
    actions: `${button('Configurer les outcomes', 'outline')}${button('Exporter', 'outline')}`
  })}
    ${summaries([{
    label: 'Learning moyen',
    value: '81 %',
    note: 'contenu'
  }, {
    label: 'Exécution moyenne',
    value: '68 %',
    note: 'actions'
  }, {
    label: 'Outcome moyen',
    value: '41 %',
    note: 'résultats'
  }, {
    label: 'Milestones validés',
    value: '186',
    note: 'sur 296'
  }])}
    <div class="screen-grid">
      ${panel('Progression multidimensionnelle', `<div class="toolbar"><span class="meta">Membre</span><span class="meta">Learning · Exécution · Outcome</span></div>
        ${memberData.slice(0, 5).map(([initials, name, group, learn, execute, outcome, next]) => `<div class="record-row" data-searchable="${name} ${group}"><div class="record-primary">${avatar(initials)}<span><strong>${name}</strong><span class="meta" style="display:block">${group}</span></span></div>${progressTriple(learn, execute, outcome)}<span class="record-secondary">${next}</span><strong class="tabular">${execute} %</strong></div>`).join('')}`)}
      <div class="screen-stack">
        ${panel('Outcome · Offre vendable', `<div class="panel-body"><div class="metric-value tabular">23 / 74</div><p style="color:var(--muted)">Membres ayant validé une offre, un tarif et au moins trois conversations marché.</p><div class="progress-track" style="margin-top:1.5rem"><div class="progress-fill" style="width:31%;background:var(--success)"></div></div><p class="meta">31 % · cible semaine 8 : 45 %</p></div>`)}
        ${panel('Blockers récurrents', `<div class="panel-body"><div class="data-row"><span class="meta">12</span><span>Positionnement</span><strong>34 %</strong></div><div class="data-row"><span class="meta">8</span><span>Temps disponible</span><strong>23 %</strong></div><div class="data-row"><span class="meta">6</span><span>Feedback attendu</span><strong>17 %</strong></div></div>`)}
      </div>
    </div>`,
  livrables: () => `
    ${heading({
    title: 'Une review est une décision, pas seulement un commentaire.',
    context: 'Execution · 6 livrables en attente',
    actions: `${button('Mes reviews', 'outline')}${button('Configurer les critères', 'outline')}`
  })}
    ${summaries([{
    label: 'À reviewer',
    value: '6',
    note: '2 en retard',
    tone: 'warning'
  }, {
    label: 'Changes requested',
    value: '4',
    note: 'resoumission attendue'
  }, {
    label: 'Validés cette semaine',
    value: '18',
    note: '▲ 5'
  }, {
    label: 'Délai moyen',
    value: '19 h',
    note: 'objectif < 24 h'
  }])}
    <div class="screen-grid">
      ${panel('Queue de review', `<div class="toolbar"><div class="toolbar__filters" data-filter-group><button class="filter-button" aria-pressed="true" data-filter="all">Tous</button><button class="filter-button" aria-pressed="false" data-filter="late">En retard</button><button class="filter-button" aria-pressed="false" data-filter="changes">À corriger</button></div><span class="meta">SLA 24 h</span></div>
        <div class="record-list">
          <div class="review-row" data-filter-value="late" data-searchable="Louise Bernard spec migration"><div class="record-primary">${avatar('LB')}<span><strong>Spec de migration v4</strong><span class="meta" style="display:block">Louise Bernard · M-03</span></span></div><span>Soumis il y a 2 j</span>${status('En retard', 'danger')}${button('Reviewer', 'default')}</div>
          <div class="review-row" data-filter-value="all" data-searchable="Camille Roussel offre"><div class="record-primary">${avatar('CR')}<span><strong>Positionnement & offre</strong><span class="meta" style="display:block">Camille Roussel · M-04</span></span></div><span>Soumis il y a 8 h</span>${status('À reviewer', 'active')}${button('Reviewer', 'outline')}</div>
          <div class="review-row" data-filter-value="changes" data-searchable="Simon Garreau workflow"><div class="record-primary">${avatar('SG')}<span><strong>Workflow agentique v2</strong><span class="meta" style="display:block">Simon Garreau · M-03</span></span></div><span>Version 2 · 3 changements</span>${status('Changes requested', 'warning')}${button('Comparer', 'outline')}</div>
          <div class="review-row" data-filter-value="all" data-searchable="Aïcha Mbaye prix"><div class="record-primary">${avatar('AM')}<span><strong>Grille de prix testée</strong><span class="meta" style="display:block">Aïcha Mbaye · M-05</span></span></div><span>Soumis il y a 3 h</span>${status('À reviewer', 'active')}${button('Reviewer', 'outline')}</div>
          <div class="empty-filter">Aucun livrable ne correspond à ce filtre.</div>
        </div>`)}
      <div class="screen-stack">
        ${panel('Prochaine décision', `<div class="panel-body"><p class="data-label">Spec de migration v4</p><h2 class="panel-title" style="margin-top:.7rem">L’invariant principal n’a aucune preuve automatisée.</h2><p style="color:var(--muted)">Critère manquant : démontrer qu’aucune ligne n’est perdue sur un retry après interruption.</p><div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.5rem">${button('Ouvrir la review', 'default')}${button('Voir v3 ↔ v4', 'outline')}</div></div>`)}
        ${panel('Charge reviewer', `<div class="panel-body"><div class="data-row"><span class="meta">Marc</span><span>3 à traiter</span><strong>18 h</strong></div><div class="data-row"><span class="meta">Sarah</span><span>2 à traiter</span><strong>11 h</strong></div><div class="data-row"><span class="meta">Nicolas</span><span>1 à traiter</span><strong>6 h</strong></div></div>`)}
      </div>
    </div>`,
  lives: () => `
    ${heading({
    title: 'Des sessions reliées aux actions avant et après le direct.',
    context: 'Live · 6 sessions à venir',
    actions: `${button('Voir les replays', 'outline')}${button('Planifier une session', 'default')}`
  })}
    <div class="calendar-strip" aria-label="Prochains lives">
      ${[['Mer. 26', 'Coaching 1:1', 'today'], ['Jeu. 27', 'Orchestration', ''], ['Ven. 28', 'Revue ouverte', ''], ['Sam. 29', 'Hot seats', ''], ['Dim. 30', '—', ''], ['Lun. 31', 'Q&A', ''], ['Mar. 01', 'Tests & spec', '']].map(([day, event, today]) => `<div class="calendar-day ${today ? 'calendar-day--today' : ''}"><div class="data-label">${day}</div><div class="calendar-event">${event}</div></div>`).join('')}
    </div>
    <div class="screen-grid">
      ${panel('Sessions à venir', `<div class="schedule-row"><span class="meta tabular">27.08</span><span><span class="schedule-row__title">Orchestration : arbitrer les conflits</span><span class="meta" style="display:block">Atelier · 8 places · Marc</span></span>${screenLink('Ouvrir l’atelier', 'atelier', 'default')}</div>
        <div class="schedule-row"><span class="meta tabular">29.08</span><span><span class="schedule-row__title">Post-mortem d’exécution</span><span class="meta" style="display:block">Ouvert · Cohorte 04 · Sarah</span></span>${button('18 inscrits', 'outline')}</div>
        <div class="schedule-row"><span class="meta tabular">03.09</span><span><span class="schedule-row__title">Dériver les tests depuis la spec</span><span class="meta" style="display:block">Atelier · 8 places · Nicolas</span></span>${button('5 places', 'outline')}</div>
        <div class="schedule-row"><span class="meta tabular">05.09</span><span><span class="schedule-row__title">Politique de contexte</span><span class="meta" style="display:block">Lecture + Q/R · Marc</span></span>${button('Ouvrir', 'outline')}</div>`)}
      <div class="screen-stack">
        ${panel('Prochaine session · 27.08', `<div class="panel-body"><p class="data-label">Agenda · 90 min</p><h2 class="panel-title" style="margin-top:.7rem">Arbitrer un conflit d’écriture réel.</h2><div style="margin-top:1.5rem"><div class="data-row"><span class="meta">00–15</span><span>Cadre et invariant</span><span></span></div><div class="data-row"><span class="meta">15–55</span><span>Hot seat · 2 cas</span><span></span></div><div class="data-row"><span class="meta">55–80</span><span>Implémentation guidée</span><span></span></div><div class="data-row"><span class="meta">80–90</span><span>Next Actions</span><span></span></div></div><div style="margin-top:1.5rem">${screenLink('Ouvrir la room', 'atelier', 'default')}</div></div>`)}
        ${panel('Replays récents', `<div class="panel-body"><div class="data-row"><span class="meta">22.08</span><span>Specs non ambiguës</span>${button('42 min', 'ghost')}</div><div class="data-row"><span class="meta">15.08</span><span>Budget de contexte</span>${button('58 min', 'ghost')}</div><div class="data-row"><span class="meta">08.08</span><span>Revue croisée</span>${button('67 min', 'ghost')}</div></div>`)}
      </div>
    </div>`,
  formations: () => `
    ${heading({
    title: 'Le contenu sert une transformation et une preuve attendue.',
    context: 'Programme · HighTiket 12 semaines',
    actions: `${screenLink('Ouvrir le lecteur membre', 'lecteur', 'outline')}${button('Nouvelle lesson', 'default')}`
  })}
    <section class="course-resume" aria-labelledby="continue-course-title">
      <div class="course-resume__visual">
        <div>
          <button class="play-button" type="button" data-go-screen="lecteur" aria-label="Regarder la vidéo Conflits d’écriture et arbitrage">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="m9 7 8 5-8 5Z" fill="currentColor" /></svg>
          </button>
          <p class="meta" style="margin-top:1.25rem;color:#b8b2a5">M-03.4 · vidéo · 43:20</p>
        </div>
      </div>
      <div class="course-resume__content">
        <div>
          <span class="chip"><span class="status-dot status-dot--active"></span> Continuer la formation</span>
          <h2 id="continue-course-title" class="panel-title" style="margin-top:1.5rem">Conflits d’écriture et arbitrage.</h2>
          <p style="max-width:54ch;color:var(--muted)">Apprendre à isoler la write surface, détecter une collision avant mutation et produire une décision explicable.</p>
        </div>
        <div>
          <div class="progress-track"><div class="progress-fill" style="width:43%"></div></div>
          <div style="display:flex;justify-content:space-between;gap:1rem;margin-top:.6rem" class="meta"><span>18:42 regardées</span><span>43 %</span></div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.5rem">${screenLink('Regarder la vidéo', 'lecteur', 'default')}${button('Voir le plan du module', 'outline')}</div>
        </div>
      </div>
    </section>
    ${summaries([{
    label: 'Modules',
    value: '14',
    note: '5 milestones'
  }, {
    label: 'Lessons publiées',
    value: '38',
    note: '4 drafts'
  }, {
    label: 'Ressources',
    value: '62',
    note: 'fichiers et liens'
  }, {
    label: 'Durée vidéo',
    value: '11 h 24',
    note: 'hors ateliers'
  }])}
    <div class="screen-grid">
      <section class="curriculum">
        <div class="panel-head"><span class="meta">Curriculum · Path principal</span><button class="button button--small button--ghost" data-demo-action="Réordonner les modules">Réordonner</button></div>
        <div class="module-row"><span class="meta">M-01</span><span><strong>Spécification exécutable</strong><span class="meta" style="display:block">6 lessons · 1 deliverable</span></span><span>100 % publié</span>${screenLink('Revoir', 'lecteur', 'outline')}</div>
        <div class="module-row"><span class="meta">M-02</span><span><strong>Ingénierie de contexte</strong><span class="meta" style="display:block">6 lessons · 2 ressources</span></span><span>100 % publié</span>${screenLink('Revoir', 'lecteur', 'outline')}</div>
        <div class="module-row"><span class="meta">M-03</span><span><strong>Orchestration multi-agents</strong><span class="meta" style="display:block">8 lessons · 1 atelier</span></span>${status('Actif', 'active')}${screenLink('Regarder', 'lecteur', 'default')}</div>
        <div class="module-row"><span class="meta">M-04</span><span><strong>Vérification et tests</strong><span class="meta" style="display:block">7 lessons · 2 deliverables</span></span><span>6 publiées · 1 draft</span>${screenLink('Prévisualiser', 'lecteur', 'outline')}</div>
        <div class="module-row"><span class="meta">M-05</span><span><strong>Supervision en production</strong><span class="meta" style="display:block">7 lessons · 1 review finale</span></span><span>4 publiées · 3 drafts</span>${screenLink('Prévisualiser', 'lecteur', 'outline')}</div>
      </section>
      <div class="screen-stack">
        ${panel('Lesson active · M-03.4', `<div class="panel-body"><p class="data-label">Atelier · 52 min</p><h2 class="panel-title" style="margin-top:.7rem">Conflits d’écriture et arbitrage.</h2><p style="color:var(--muted)">Objectif : isoler la write surface, détecter le conflit et produire une décision explicable.</p><div style="margin-top:1.5rem"><div class="data-row"><span class="meta">Vidéo</span><span>38:20</span>${status('Publié', 'success')}</div><div class="data-row"><span class="meta">Template</span><span>conflict-map.md</span>${status('Publié', 'success')}</div><div class="data-row"><span class="meta">Exercice</span><span>Arbitrage réel</span>${status('Draft')}</div></div><div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.5rem">${button('Éditer', 'default')}${screenLink('Voir côté membre', 'lecteur', 'outline')}</div></div>`)}
        ${panel('Qualité de publication', `<div class="panel-body"><div class="data-row"><span class="status-dot status-dot--success"></span><span>Objectif explicite</span><strong>38/38</strong></div><div class="data-row"><span class="status-dot status-dot--success"></span><span>Next Action liée</span><strong>34/38</strong></div><div class="data-row"><span class="status-dot status-dot--danger"></span><span>Alt / transcript manquant</span><strong>3</strong></div></div>`)}
      </div>
    </div>`,
  lecteur: () => `
    ${heading({
    title: 'Conflits d’écriture et arbitrage.',
    context: 'Parcours membre / M-03 / Lesson 04',
    actions: `${screenLink('Retour aux formations', 'formations', 'outline')}${button('Je suis bloqué', 'outline')}`
  })}
    <div class="video-layout">
      <div class="screen-stack">
        <section class="video-stage" data-playing="false" data-complete="false" aria-label="Lecteur vidéo de démonstration">
          <div class="video-stage__content">
            <button class="play-button" type="button" data-video-toggle aria-label="Lire la vidéo">
              <svg data-play-icon aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="m9 7 8 5-8 5Z" fill="currentColor" /></svg>
              <svg data-pause-icon aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" hidden><path d="M8 7h3v10H8zm5 0h3v10h-3z" fill="currentColor" /></svg>
            </button>
            <h2 class="panel-title video-lesson-name" style="margin-top:1.5rem;color:var(--on-emphasis)">Séparer les pouvoirs avant de paralléliser.</h2>
            <p style="color:#b8b2a5">Une write surface, un owner. L’escalade commence avant le conflit.</p>
          </div>
          <div class="video-controls"><div class="progress-track"><div class="progress-fill" data-video-progress style="width:43%"></div></div><div style="display:flex;justify-content:space-between;margin-top:.6rem" class="meta"><span data-video-time>18:42 / 43:20</span><span data-video-status>En pause · 1,25× · transcript</span></div></div>
        </section>
        <section class="surface surface--sharp">
          <div class="panel-head"><span class="meta">Objectif de la lesson</span>${status('En cours', 'active')}</div>
          <div class="panel-body"><h2 class="panel-title">Produire une carte de write surfaces et un protocole d’escalade.</h2><p style="max-width:68ch;color:var(--muted)">À la fin, vous devez pouvoir assigner plusieurs agents sans qu’ils modifient le même agrégat ou la même migration sans coordination explicite.</p><div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.5rem">${button('Télécharger conflict-map.md', 'outline')}${button('Ouvrir le transcript', 'ghost')}<button class="button button--small button--outline" type="button" data-complete-lesson>Marquer comme terminée</button></div></div>
        </section>
        <section class="surface surface--sharp">
          <div class="panel-head"><span class="meta">Action à réaliser</span><span class="chip">Deliverable requis</span></div>
          <div class="panel-body"><h2 class="panel-title">Cartographier un conflit réel de votre base.</h2><p style="color:var(--muted)">Identifiez les fichiers, agrégats et migrations concernés. Nommez le propriétaire de chaque écriture, le signal de collision et la règle d’arrêt.</p><div class="artifact-row"><span class="meta">ATTENDU</span><strong>conflict-map.md + une décision</strong><span class="chip">avant ven. 18:00</span></div><div style="margin-top:1.5rem">${button('Déposer le livrable', 'default')}</div></div>
        </section>
      </div>
      <aside class="screen-stack">
        <section class="surface lesson-list">
          <div class="panel-head"><span class="meta">M-03 · Orchestration</span><span class="meta">4 / 8</span></div>
          <a class="lesson-row" href="#lecteur" data-lesson-title="Pourquoi séparer les rôles" data-lesson-duration="18:04"><span class="meta">03.1</span><span><strong>Pourquoi séparer les rôles</strong><span class="meta" style="display:block">18:04</span></span><span class="status-dot status-dot--success"></span></a>
          <a class="lesson-row" href="#lecteur" data-lesson-title="Planifier sans écrire" data-lesson-duration="21:30"><span class="meta">03.2</span><span><strong>Planifier sans écrire</strong><span class="meta" style="display:block">21:30</span></span><span class="status-dot status-dot--success"></span></a>
          <a class="lesson-row" href="#lecteur" data-lesson-title="Déclarer une write surface" data-lesson-duration="24:10"><span class="meta">03.3</span><span><strong>Déclarer une write surface</strong><span class="meta" style="display:block">24:10</span></span><span class="status-dot status-dot--success"></span></a>
          <a class="lesson-row" href="#lecteur" aria-current="true" data-lesson-title="Conflits d’écriture et arbitrage" data-lesson-duration="43:20"><span class="meta">03.4</span><span><strong>Conflits et arbitrage</strong><span class="meta" style="display:block">43:20</span></span><span class="status-dot status-dot--active"></span></a>
          <a class="lesson-row" href="#lecteur" data-lesson-title="Seuils d’escalade" data-lesson-duration="19:52"><span class="meta">03.5</span><span><strong>Seuils d’escalade</strong><span class="meta" style="display:block">19:52</span></span><span class="status-dot"></span></a>
          <a class="lesson-row" href="#lecteur" data-lesson-title="Atelier : arbitrage réel" data-lesson-duration="90:00"><span class="meta">03.6</span><span><strong>Atelier : arbitrage réel</strong><span class="meta" style="display:block">Live · 90 min</span></span><span class="status-dot"></span></a>
        </section>
        ${panel('Votre progression', `<div class="panel-body"><div class="metric-value tabular">58 %</div><div class="progress-track" style="margin-top:1rem"><div class="progress-fill" style="width:58%"></div></div><div style="margin-top:1.5rem"><div class="data-row"><span class="meta">Learning</span><span></span><strong>79 %</strong></div><div class="data-row"><span class="meta">Exécution</span><span></span><strong>58 %</strong></div><div class="data-row"><span class="meta">Outcome</span><span></span><strong>31 %</strong></div></div></div>`)}
        ${panel('Obtenir de l’aide', `<div class="panel-body"><a class="context-link" href="#communaute-thread"><span class="meta">THREAD</span><span><strong>Conflits d’écriture</strong><span class="meta" style="display:block">14 réponses · coach retenu</span></span></a><a class="context-link" href="#atelier"><span class="meta">LIVE</span><span><strong>Atelier jeudi</strong><span class="meta" style="display:block">2 places restantes</span></span></a></div>`)}
      </aside>
    </div>`,
  atelier: () => `
    ${heading({
    title: 'Orchestration : arbitrer les conflits d’écriture.',
    context: 'Atelier live · 27 août · 11:00–12:30',
    actions: `${screenLink('Retour aux lives', 'lives', 'outline')}${button('Quitter la session', 'outline')}`
  })}
    <section class="workshop-stage" aria-label="Atelier live de démonstration">
      <div class="workshop-main">
        <div><span class="chip"><span class="status-dot status-dot--danger"></span> En direct · 38:12</span><h2 class="community-feature__title" style="margin-inline:auto">Deux agents veulent modifier la même migration.</h2><p style="max-width:54ch;margin:1rem auto 0;color:#b8b2a5">Marc cartographie le conflit de Simon. La prochaine décision porte sur la propriété du journal d’idempotence.</p><div style="display:flex;justify-content:center;gap:.5rem;flex-wrap:wrap;margin-top:2rem">${button('Lever la main', 'outline')}${button('Partager mon écran', 'default')}</div></div>
      </div>
      <aside class="workshop-rail"><span class="data-label">Participants · 8</span><div style="margin-top:1rem"><div class="participant">${avatar('MB')}<span><strong>Marc</strong><span class="meta" style="display:block">Facilitateur</span></span><span class="status-dot status-dot--active"></span></div><div class="participant">${avatar('SG')}<span><strong>Simon</strong><span class="meta" style="display:block">Hot seat</span></span><span class="status-dot status-dot--danger"></span></div><div class="participant">${avatar('JM')}<span><strong>Julie</strong><span class="meta" style="display:block">Main levée</span></span><span class="status-dot status-dot--active"></span></div><div class="participant">${avatar('CR')}<span><strong>Camille</strong><span class="meta" style="display:block">Écoute</span></span><span class="status-dot"></span></div><div class="participant">${avatar('+4')}<span><strong>4 autres</strong><span class="meta" style="display:block">Participants</span></span><span></span></div></div></aside>
    </section>
    <div class="workshop-bottom">
      <section class="surface surface--sharp"><div class="panel-head"><span class="meta">Agenda · 90 minutes</span><span class="chip">Étape 02 / 04</span></div><div class="agenda-row"><span class="meta">00–15</span><span><strong>Cadre et invariant</strong><span class="meta" style="display:block">Fait · cardinalité et idempotence</span></span></div><div class="agenda-row" style="background:var(--cobalt-soft)"><span class="meta">15–55</span><span><strong>Hot seats · 2 cas</strong><span class="meta" style="display:block">En cours · Simon, puis Julie</span></span></div><div class="agenda-row"><span class="meta">55–80</span><span><strong>Implémentation guidée</strong><span class="meta" style="display:block">Conflict map et ownership</span></span></div><div class="agenda-row"><span class="meta">80–90</span><span><strong>Next Actions</strong><span class="meta" style="display:block">Une action par participant</span></span></div></section>
      <section class="surface surface--sharp"><div class="panel-head"><span class="meta">Chat · 12 messages</span><button class="button button--small button--ghost" data-demo-action="Ouvrir les questions">Questions</button></div><div class="chat-message"><span class="meta">11:31</span><span><strong>Julie</strong><span style="display:block">Le lock porte sur le fichier ou sur l’agrégat ?</span></span></div><div class="chat-message"><span class="meta">11:34</span><span><strong>Marc</strong><span style="display:block">Sur la décision métier. Le fichier n’est qu’une conséquence.</span></span></div><div class="chat-message"><span class="meta">11:36</span><span><strong>Camille</strong><span style="display:block">Je partage notre exemple dans le thread.</span></span></div><form class="reply-composer" style="margin:0;border:0" data-demo-form="chat"><label for="chat-body" class="data-label">Message</label><textarea id="chat-body" class="field" style="min-height:5rem" placeholder="Écrire dans le chat…"></textarea><button class="button button--small" type="submit" style="margin-top:.75rem">Envoyer</button></form></section>
    </div>`
};
let toastTimer;
function showToast(message) {
  toast.textContent = `${message} — interaction de démonstration`;
  toast.dataset.visible = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.dataset.visible = 'false';
  }, 2400);
}
function closeMobileNav() {
  sidebar.dataset.open = 'false';
  scrim.dataset.open = 'false';
  mobileNavButton.setAttribute('aria-expanded', 'false');
}
function currentScreen() {
  const hash = location.hash.replace('#', '');
  return Object.hasOwn(screenNames, hash) ? hash : 'pilotage';
}
function bindScreenInteractions() {
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    group.addEventListener('click', event => {
      const target = event.target.closest('[data-filter]');
      if (!target) return;
      const filter = target.dataset.filter;
      group.querySelectorAll('[data-filter]').forEach(buttonElement => {
        buttonElement.setAttribute('aria-pressed', String(buttonElement === target));
      });
      const container = group.closest('.surface') || root;
      let visible = 0;
      container.querySelectorAll('[data-filter-value]').forEach(row => {
        const matches = filter === 'all' || row.dataset.filterValue === filter;
        row.hidden = !matches;
        if (matches) visible += 1;
      });
      const empty = container.querySelector('.empty-filter');
      if (empty) empty.dataset.visible = String(visible === 0);
    });
  });
}
function updateNav(screen) {
  const activeScreen = parentScreens[screen] || screen;
  document.querySelectorAll('[data-screen-link]').forEach(link => {
    if (link.dataset.screenLink === activeScreen) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}
function renderScreen({
  focus = false
} = {}) {
  const screen = currentScreen();
  root.innerHTML = screen === 'pilotage' ? pilotageMarkup : screens[screen]();
  root.classList.remove('screen-transition');
  requestAnimationFrame(() => root.classList.add('screen-transition'));
  updateNav(screen);
  bindScreenInteractions();
  document.title = `HighTiket — ${screenNames[screen]} · Plateforme 4.6`;
  globalSearch.value = '';
  closeMobileNav();
  if (focus) root.focus({
    preventScroll: true
  });
  window.scrollTo({
    top: 0,
    behavior: 'instant'
  });
}
window.addEventListener('hashchange', () => renderScreen({
  focus: true
}));
document.addEventListener('click', event => {
  const screenTarget = event.target.closest('[data-go-screen]');
  if (screenTarget) {
    location.hash = screenTarget.dataset.goScreen;
    return;
  }
  const videoToggle = event.target.closest('[data-video-toggle]');
  if (videoToggle) {
    const stage = videoToggle.closest('.video-stage');
    const playing = stage.dataset.playing !== 'true';
    stage.dataset.playing = String(playing);
    videoToggle.setAttribute('aria-label', playing ? 'Mettre la vidéo en pause' : 'Lire la vidéo');
    videoToggle.querySelector('[data-play-icon]').hidden = playing;
    videoToggle.querySelector('[data-pause-icon]').hidden = !playing;
    stage.querySelector('[data-video-status]').textContent = playing ? 'Lecture en cours · 1,25× · transcript' : 'En pause · 1,25× · transcript';
    stage.querySelector('[data-video-progress]').style.width = playing ? '58%' : '43%';
    stage.querySelector('[data-video-time]').textContent = playing ? '25:08 / 43:20' : '18:42 / 43:20';
    showToast(playing ? 'Lecture démarrée' : 'Vidéo mise en pause');
    return;
  }
  const lesson = event.target.closest('[data-lesson-title]');
  if (lesson) {
    event.preventDefault();
    root.querySelectorAll('[data-lesson-title]').forEach(row => row.removeAttribute('aria-current'));
    lesson.setAttribute('aria-current', 'true');
    root.querySelector('.video-lesson-name').textContent = lesson.dataset.lessonTitle;
    root.querySelector('[data-video-time]').textContent = `00:00 / ${lesson.dataset.lessonDuration}`;
    root.querySelector('[data-video-progress]').style.width = '0%';
    const stage = root.querySelector('.video-stage');
    stage.dataset.playing = 'false';
    stage.dataset.complete = 'false';
    stage.querySelector('[data-video-status]').textContent = 'Prête · 1× · transcript';
    stage.querySelector('[data-play-icon]').hidden = false;
    stage.querySelector('[data-pause-icon]').hidden = true;
    showToast(`Lesson chargée : ${lesson.dataset.lessonTitle}`);
    return;
  }
  const completeLesson = event.target.closest('[data-complete-lesson]');
  if (completeLesson) {
    const stage = root.querySelector('.video-stage');
    const completed = stage.dataset.complete !== 'true';
    stage.dataset.complete = String(completed);
    completeLesson.textContent = completed ? 'Lesson terminée' : 'Marquer comme terminée';
    completeLesson.classList.toggle('button--outline', !completed);
    completeLesson.classList.toggle('button--cobalt', completed);
    showToast(completed ? 'Progression enregistrée' : 'Completion retirée');
    return;
  }
  const action = event.target.closest('[data-demo-action]');
  if (action) {
    event.preventDefault();
    showToast(action.dataset.demoAction);
  }
});
document.addEventListener('submit', event => {
  const form = event.target.closest('[data-demo-form]');
  if (!form) return;
  event.preventDefault();
  const textarea = form.querySelector('textarea');
  if (!textarea?.value.trim()) {
    showToast('Écrivez un message avant de publier');
    textarea?.focus();
    return;
  }
  showToast(form.dataset.demoForm === 'chat' ? 'Message envoyé' : 'Réponse publiée');
  textarea.value = '';
});
globalSearch.addEventListener('input', () => {
  const query = globalSearch.value.trim().toLocaleLowerCase('fr');
  let visible = 0;
  root.querySelectorAll('[data-searchable]').forEach(row => {
    const matches = !query || row.dataset.searchable.toLocaleLowerCase('fr').includes(query);
    row.hidden = !matches;
    if (matches) visible += 1;
  });
  if (query) {
    showToast(`${visible} résultat${visible > 1 ? 's' : ''} pour « ${globalSearch.value.trim()} »`);
  }
});
mobileNavButton.setAttribute('aria-expanded', 'false');
mobileNavButton.addEventListener('click', () => {
  const open = sidebar.dataset.open !== 'true';
  sidebar.dataset.open = String(open);
  scrim.dataset.open = String(open);
  mobileNavButton.setAttribute('aria-expanded', String(open));
});
scrim.addEventListener('click', closeMobileNav);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMobileNav();
});
if (!location.hash || !Object.hasOwn(screenNames, location.hash.slice(1))) {
  history.replaceState(null, '', '#pilotage');
}
renderScreen();
})(); } catch (e) { __ds_ns.__errors.push({ path: "high-tiket-platform-v4.7.js", error: String((e && e.message) || e) }); }

// high-tiket-theme.js
try { (() => {
/* HighTiket 4.7 — pilotage du thème. Clair par défaut ; sombre et auto opt-in. */
;
(() => {
  const KEY = 'hightiket-theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  };
  const write = value => {
    try {
      localStorage.setItem(KEY, value);
    } catch (error) {
      /* stockage indisponible : le choix reste valable pour la session */
    }
  };
  const preference = () => {
    const stored = read();
    return stored === 'dark' || stored === 'auto' || stored === 'light' ? stored : 'light';
  };
  const resolve = pref => pref === 'dark' || pref === 'auto' && media.matches ? 'dark' : 'light';
  function apply() {
    const pref = preference();
    const root = document.documentElement;
    root.dataset.theme = resolve(pref);
    root.dataset.themePref = pref;
    document.querySelectorAll('[data-theme-set]').forEach(option => {
      option.setAttribute('aria-pressed', String(option.dataset.themeSet === pref));
    });
  }
  document.addEventListener('click', event => {
    const option = event.target.closest('[data-theme-set]');
    if (!option) return;
    write(option.dataset.themeSet);
    apply();
  });
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key === KEY) apply();
  });
  apply();
  document.addEventListener('DOMContentLoaded', apply);
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "high-tiket-theme.js", error: String((e && e.message) || e) }); }

})();
