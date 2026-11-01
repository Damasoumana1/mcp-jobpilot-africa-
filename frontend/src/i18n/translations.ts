export type Language = 'fr' | 'en';

export interface Translations {
  nav: {
    jobs: string;
    matching: string;
    applications: string;
    interview: string;
    profile: string;
    copilot: string;
    tagline: string;
  };
  jobs: {
    search_placeholder: string;
    country_all: string;
    remote_only: string;
    post_job: string;
    match_score: string;
    letter_pitch: string;
    apply: string;
    remote_badge: string;
    view_details: string;
    closing_soon: string;
    no_jobs_found: string;
  };
  matching: {
    title: string;
    subtitle: string;
    select_job: string;
    matched_skills: string;
    missing_skills: string;
    strategic_advice: string;
    generate_pack: string;
    mobility: string;
    remote_compatible: string;
  };
  applications: {
    title: string;
    total: string;
    sent: string;
    interviews: string;
    offers: string;
    status_saved: string;
    status_applied: string;
    status_interview: string;
    status_offer: string;
    status_rejected: string;
    no_applications: string;
  };
  interview: {
    title: string;
    subtitle: string;
    target_role: string;
    category: string;
    generate_btn: string;
    star_method: string;
    checklist_title: string;
    before_phase: string;
    during_phase: string;
    after_phase: string;
  };
  profile: {
    available: string;
    busy: string;
    explore_jobs: string;
    scan_cv: string;
    skills_title: string;
    pitch_title: string;
    education_title: string;
    experience_years: string;
    mcp_id: string;
  };
  copilot: {
    title: string;
    subtitle: string;
    placeholder: string;
    quick_remote: string;
    quick_matching: string;
    quick_interview: string;
  };
  common: {
    close: string;
    copy: string;
    copied: string;
    save: string;
    loading: string;
  };
}

export const translations: Record<Language, Translations> = {
  fr: {
    nav: {
      jobs: 'Offres Tech',
      matching: 'Matching IA',
      applications: 'Candidatures',
      interview: 'Studio Entretien',
      profile: 'Mon Profil',
      copilot: 'Copilot IA',
      tagline: 'Accélérateur de carrière tech panafricain & Serveur MCP',
    },
    jobs: {
      search_placeholder: 'Rechercher un poste, une techno, une entreprise (Wave, Paystack, Flutterwave)...',
      country_all: 'Tous les pays africains',
      remote_only: '100% Télétravail (Remote)',
      post_job: 'Publier une offre',
      match_score: 'Score Match IA',
      letter_pitch: 'Lettre & Pitch',
      apply: 'Postuler',
      remote_badge: 'Télétravail',
      view_details: 'Voir le détail',
      closing_soon: 'Clôture prochaine',
      no_jobs_found: 'Aucune offre trouvée correspondant à ces filtres.',
    },
    matching: {
      title: 'Calculateur d’Adéquation & Gap Analysis',
      subtitle: 'Algorithme pondéré analysant les prérequis, compétences acquises et mobilité',
      select_job: 'Sélectionnez une opportunité tech',
      matched_skills: 'Compétences Validées',
      missing_skills: 'Compétences à Développer (Lacunes)',
      strategic_advice: 'Recommandation Stratégique IA',
      generate_pack: 'Générer Lettre & Pitch pour cette offre',
      mobility: 'Mobilité Géographique',
      remote_compatible: 'Compatible Télétravail',
    },
    applications: {
      title: 'Pipeline de Candidatures & Suivi',
      total: 'Total Suivies',
      sent: 'Candidatures Envoyées',
      interviews: 'Entretiens Décrochés',
      offers: 'Offres Reçues 🎉',
      status_saved: 'Sauvegardée',
      status_applied: 'Postulée',
      status_interview: 'Entretien',
      status_offer: 'Offre reçue',
      status_rejected: 'Refusée',
      no_applications: 'Aucune candidature suivie pour le moment. Cliquez sur "Postuler" depuis les offres !',
    },
    interview: {
      title: 'Studio d’Entretien & Coaching STAR',
      subtitle: 'Simulateur de questions d’entretien techniques et comportementales adaptées aux entreprises tech',
      target_role: 'Poste & Stack ciblés',
      category: 'Type de questions',
      generate_btn: 'Générer les Questions avec l’IA',
      star_method: 'Méthodologie STAR (Situation, Tâche, Action, Résultat)',
      checklist_title: 'Checklist de Préparation Interactive',
      before_phase: 'Phase 1 : Avant l’entretien',
      during_phase: 'Phase 2 : Pendant l’entretien',
      after_phase: 'Phase 3 : Suivi après l’entretien',
    },
    profile: {
      available: '● Immédiatement Disponible',
      busy: 'En poste',
      explore_jobs: 'Voir les offres adaptées',
      scan_cv: 'Analyser mon CV (IA)',
      skills_title: 'Compétences Techniques & Outils Maîtrisés',
      pitch_title: 'Pitch Professionnel',
      education_title: 'Formation & Portfolio',
      experience_years: "an(s) d'expérience",
      mcp_id: 'Identifiant MCP Unique',
    },
    copilot: {
      title: 'JobPilot Copilot IA',
      subtitle: 'Assistant conversationnel spécialisé dans la tech africaine',
      placeholder: 'Posez une question sur les offres, salaires ou entretiens...',
      quick_remote: 'Trouve-moi des opportunités en télétravail',
      quick_matching: 'Quel est mon meilleur score de compatibilité ?',
      quick_interview: 'Prépare-moi pour un entretien technique Python',
    },
    common: {
      close: 'Fermer',
      copy: 'Copier',
      copied: 'Copié !',
      save: 'Enregistrer',
      loading: 'Chargement en cours...',
    },
  },
  en: {
    nav: {
      jobs: 'Tech Jobs',
      matching: 'AI Matching',
      applications: 'Applications',
      interview: 'Interview Studio',
      profile: 'My Profile',
      copilot: 'AI Copilot',
      tagline: 'Pan-African Tech Career Accelerator & MCP Server',
    },
    jobs: {
      search_placeholder: 'Search by role, tech stack, company (Wave, Paystack, Flutterwave)...',
      country_all: 'All African Countries',
      remote_only: '100% Remote Only',
      post_job: 'Post a Job',
      match_score: 'AI Match Score',
      letter_pitch: 'Cover Letter & Pitch',
      apply: 'Apply Now',
      remote_badge: 'Remote Allowed',
      view_details: 'View Details',
      closing_soon: 'Closing Soon',
      no_jobs_found: 'No tech jobs found matching your criteria.',
    },
    matching: {
      title: 'AI Compatibility & Gap Analysis',
      subtitle: 'Weighted matching algorithm analyzing required skills, strengths, and mobility',
      select_job: 'Select a tech opportunity',
      matched_skills: 'Validated Skills',
      missing_skills: 'Skills to Develop (Gaps)',
      strategic_advice: 'AI Strategic Recommendation',
      generate_pack: 'Generate Cover Letter & Pitch',
      mobility: 'Geographic Mobility',
      remote_compatible: 'Remote Compatible',
    },
    applications: {
      title: 'Application Pipeline & Tracking',
      total: 'Total Tracked',
      sent: 'Applications Sent',
      interviews: 'Interviews Scheduled',
      offers: 'Job Offers 🎉',
      status_saved: 'Saved',
      status_applied: 'Applied',
      status_interview: 'Interviewing',
      status_offer: 'Offer Received',
      status_rejected: 'Declined',
      no_applications: 'No applications tracked yet. Click "Apply" on any job card!',
    },
    interview: {
      title: 'Interview Studio & STAR Coaching',
      subtitle: 'Simulate technical and cultural interview questions tailored to African tech companies',
      target_role: 'Target Role & Stack',
      category: 'Question Category',
      generate_btn: 'Generate Questions with AI',
      star_method: 'STAR Framework (Situation, Task, Action, Result)',
      checklist_title: 'Interactive Preparation Checklist',
      before_phase: 'Phase 1: Pre-Interview Prep',
      during_phase: 'Phase 2: During the Interview',
      after_phase: 'Phase 3: Post-Interview Follow-Up',
    },
    profile: {
      available: '● Immediately Available',
      busy: 'Employed',
      explore_jobs: 'Explore Matching Jobs',
      scan_cv: 'Scan My CV (AI)',
      skills_title: 'Technical Skills & Mastered Tools',
      pitch_title: 'Professional Pitch',
      education_title: 'Education & Portfolio',
      experience_years: 'year(s) of experience',
      mcp_id: 'Unique MCP Identifier',
    },
    copilot: {
      title: 'JobPilot AI Copilot',
      subtitle: 'Conversational assistant specialized in African tech careers',
      placeholder: 'Ask a question about jobs, salary benchmarks, or interviews...',
      quick_remote: 'Find remote tech internships',
      quick_matching: 'What is my highest match score?',
      quick_interview: 'Prep me for a Python backend interview',
    },
    common: {
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied!',
      save: 'Save',
      loading: 'Loading...',
    },
  },
};
