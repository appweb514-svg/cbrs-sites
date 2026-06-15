const activities = [
  {
    id: '01', name: 'Aquagym', slug: 'aquagym', category: 'Activité',
    logo: '01_aquagym.png',
    short_description: "Gymnastique aquatique en piscine. Exercices adaptés pour un renforcement musculaire et une mobilité articulaire en douceur, sans impact sur les articulations.",
    presentation: "<p>L'aquagym du CBRS se pratique à la piscine Bellier de Beauvais dans une eau chauffée. Les séances, encadrées par un maître-nageur et un animateur diplômé, combinent cardio, renforcement musculaire et assouplissements.</p><p>Accessible à tous, l'aquagym est particulièrement recommandée pour préserver ses articulations tout en maintenant une bonne condition physique.</p>",
    meeting_point: "Piscine Bellier — 6 rue Maurice Segonds, 60000 Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Apporter maillot, bonnet, lunettes et serviette",
      "Douche savonnée obligatoire avant l'entrée dans le bassin",
      "Certificat médical demandé pour la première séance"
    ],
    animators: [
      { name: 'Patrick L.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Vendredi', time: 'Voir planning', location: 'Piscine Bellier' }
    ],
    published: 1
  },
  {
    id: '02', name: 'Pétanque', slug: 'petanque', category: 'Activité',
    logo: '02_petanque.png',
    short_description: "La pétanque se pratique toute l'année sur les terrains mis à disposition. Un moment de détente et de convivialité pour tous.",
    presentation: "<p>La pétanque du CBRS se joue au Plan d'eau du Canada à Beauvais sur des terrains stabilisés. Plusieurs jeux sont organisés en parallèle selon le niveau des participants.</p><p>Tournois amicaux internes plusieurs fois par saison, et participation aux rencontres interclubs du Beauvaisis.</p>",
    meeting_point: "Plan d'eau du Canada — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Boules prêtées pour les débutants",
      "Chaises pliantes recommandées",
      "Gobelet et eau apportés par chacun"
    ],
    animators: [
      { name: 'Michel B.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Mardi', time: '14h00', location: "Plan d'eau" },
      { day: 'Jeudi', time: '14h00', location: "Plan d'eau" }
    ],
    published: 1
  },
  {
    id: '03', name: 'Cyclisme', slug: 'cyclisme', category: 'Activité',
    logo: '03_cyclisme.png',
    short_description: "Sorties vélo sur les routes du Beauvaisis et du Pays de Bray. Des itinéraires variés adaptés au rythme de chacun.",
    presentation: "<p>Le groupe cyclisme du CBRS propose trois niveaux de sortie chaque semaine: easy (30-40 km, dénivelé modéré), medium (50-70 km) et sport (80+ km).</p><p>Les parcours sont préparés par les animateurs et publiés chaque semaine. Les sorties ont lieu en groupe encadré avec respect strict du code de la route.</p>",
    meeting_point: "Place Hachette — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "VTT ou VTC selon les sorties, en bon état",
      "Casque obligatoire",
      "Gilet jaune recommandé"
    ],
    animators: [
      { name: 'Jean-Pierre M.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Jeudi', time: '9h00', location: 'Place Hachette' }
    ],
    published: 1
  },
  {
    id: '04', name: "Tir à l'arc", slug: 'tir-a-l-arc', category: 'Activité',
    logo: '04_tir_a_l_arc.png',
    short_description: "Découverte et pratique du tir à l'arc. Une activité de précision qui développe concentration et maîtrise de soi.",
    presentation: "<p>Le tir à l'arc du CBRS se pratique à la salle Jean Moulin avec du matériel adapté. Les animateurs diplômés FFRS vous accompagnent du premier tir jusqu'à la maîtrise des techniques avancées.</p><p>Entraînements hebdomadaires et participation possible aux compétitions amicales du département.</p>",
    meeting_point: "Salle Jean Moulin — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Matériel fourni par le club pour les débutants",
      "Tenue confortable, pas de débardeur",
      "10 places par séance"
    ],
    animators: [
      { name: 'Sylvie D.', phone: '', email: '', role: 'Animatrice' }
    ],
    schedule: [
      { day: 'Jeudi', time: '13h30', location: 'Salle Jean Moulin' }
    ],
    published: 1
  },
  {
    id: '05', name: 'Tennis de Table', slug: 'tennis-de-table', category: 'Activité',
    logo: '05_ping_pong.png',
    short_description: "Le Ping Pong se pratique dans une ambiance conviviale. Plusieurs tables disponibles pour jouer en simple ou en double.",
    presentation: "<p>Le tennis de table du CBRS accueille joueurs débutants et confirmés dans une ambiance détendue. Plusieurs tables sont installées à la salle Carnot pour des parties en simple, double ou en rotation.</p><p>Tournois amicaux organisés régulièrement au cours de la saison.</p>",
    meeting_point: "Salle Carnot — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Raquette prêtée pour les premières séances",
      "Chaussures de sport propres obligatoires",
      "Possibilité de prêt de balles"
    ],
    animators: [
      { name: 'Bernard V.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Lundi', time: '14h00', location: 'Salle Carnot' }
    ],
    published: 1
  },
  {
    id: '06', name: 'Tennis', slug: 'tennis', category: 'Activité',
    logo: '06_tennis.png',
    short_description: "Pratique du tennis en salle pour maintenir sa condition physique tout en s'amusant.",
    presentation: "<p>Le CBRS propose des séances de tennis en salle au gymnase de la rue de Buzanval. Cours collectifs et jeux libres, adaptés au niveau de chacun.</p>",
    meeting_point: "Gymnase de Buzanval — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Raquette personnelle recommandée",
      "Balles fournies par le club",
      "Chaussures de sport propres"
    ],
    animators: [
      { name: 'Christophe P.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Mercredi', time: '14h00', location: 'Gymnase Buzanval' }
    ],
    published: 1
  },
  {
    id: '07', name: 'Randonnée', slug: 'randonnee', category: 'Activité',
    logo: '07_randonnée.png',
    short_description: "Parcourez les sentiers du Beauvaisis et d'ailleurs. Des itinéraires variés en fonction des saisons et du niveau des participants.",
    presentation: "<p>La randonnée est l'activité phare du CBRS avec plus de 300 adhérents. Plusieurs niveaux sont proposés chaque semaine: facile (8-10 km, dénivelé modéré), moyen (12-15 km) et soutenu (18+ km).</p><p>Sorties à la journée et demi-journée, en Picardie, en Normandie et lors de week-ends en province.</p>",
    meeting_point: "Variable — Voir planning hebdomadaire",
    level: 'Tous niveaux',
    practical_info: [
      "Chaussures de marche montantes",
      "Eau (1,5L minimum) et en-cas",
      "Vêtements adaptés à la météo"
    ],
    animators: [
      { name: 'Alain R.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Jeudi', time: 'Après-midi', location: 'Variable' },
      { day: 'Vendredi', time: '9h00', location: 'Beauvaisis' }
    ],
    published: 1
  },
  {
    id: '08', name: 'Marche Nordique', slug: 'marche-nordique', category: 'Activité',
    logo: '08_marche_nordique.png',
    short_description: "La marche nordique sollicite l'ensemble du corps grâce aux bâtons spécifiques. Activité complète et accessible.",
    presentation: "<p>La marche nordique est une discipline complète qui fait travailler 80% des muscles du corps. Encadrée par un animateur formé, elle se pratique au stade Brisson et dans les parcs beauvaisiens.</p><p>Initiation gratuite pour les nouveaux adhérents en début de saison.</p>",
    meeting_point: "Stade Brisson — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Bâtons prêtés pour les premières séances",
      "Chaussures de marche basses",
      "Tenue sportive confortable"
    ],
    animators: [
      { name: 'Françoise L.', phone: '', email: '', role: 'Animatrice' }
    ],
    schedule: [
      { day: 'Mardi', time: '8h30', location: 'Stade Brisson' }
    ],
    published: 1
  },
  {
    id: '09', name: 'Gymnastique', slug: 'gymnastique', category: 'Activité',
    logo: '09_gymnastique.png',
    short_description: "Séances de gymnastique d'entretien pour préserver souplesse, équilibre et tonicité musculaire.",
    presentation: "<p>La gymnastique douce du CBRS vise à entretenir la mobilité articulaire, l'équilibre et le tonus musculaire. Les exercices sont adaptés à un public senior.</p><p>Travail cardiovasculaire modéré, étirements, renforcement musculaire doux et exercices d'équilibre.</p>",
    meeting_point: "Salle Carnot — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Tapis personnel recommandé",
      "Bouteille d'eau",
      "Tenue souple et chaussures propres"
    ],
    animators: [
      { name: 'Marie-Hélène G.', phone: '', email: '', role: 'Animatrice' }
    ],
    schedule: [
      { day: 'Lundi', time: '9h30', location: 'Salle Carnot' }
    ],
    published: 1
  },
  {
    id: '10', name: 'Pickleball', slug: 'pickleball', category: 'Activité',
    logo: '10_pickleball.png',
    short_description: "Sport de raquette combinant tennis, badminton et ping-pong. Se joue en double sur un terrain réduit.",
    presentation: "<p>Le pickleball est un sport convivial et accessible qui se joue à 2 ou 4 joueurs. Raquette, balle perforée et terrain plus petit que le tennis en font une activité facile à prendre en main.</p><p>Le CBRS propose des séances d'initiation et de perfectionnement.</p>",
    meeting_point: "Gymnase municipal — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Raquettes prêtées pour les débutants",
      "Chaussures de sport propres",
      "Eau recommandée"
    ],
    animators: [
      { name: 'Daniel H.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Mardi', time: '10h00', location: 'Gymnase municipal' }
    ],
    published: 1
  },
  {
    id: '11', name: 'Tai Chi Chuan', slug: 'tai-chi-chuan', category: 'Activité',
    logo: '11_tai_chi.png',
    short_description: "Art martial chinois pratiqué pour ses bienfaits sur la santé. Enchaînements lents favorisant équilibre, concentration et sérénité.",
    presentation: "<p>Le Tai Chi Chuan proposé par le CBRS se pratique en salle Beauvoir, enchaîne les mouvements lents et précis. Il améliore la posture, l'équilibre, la concentration et la respiration.</p><p>Accessible à tous, ne nécessite pas de condition physique particulière. Pratique debout en chaussons ou chaussures légères.</p>",
    meeting_point: "Salle Beauvoir — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Vêtements amples et confortables",
      "Chaussures à semelle plate ou chaussons",
      "Eau recommandée"
    ],
    animators: [
      { name: 'Yves T.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Mercredi', time: '9h00', location: 'Salle Beauvoir' }
    ],
    published: 1
  },
  {
    id: '12', name: 'Échecs / Bridge', slug: 'echecs-bridge', category: 'Activité',
    logo: '12_échecs.png',
    short_description: "Jouez aux échecs ou au bridge dans une ambiance détendue. Tournois amicaux organisés régulièrement.",
    presentation: "<p>Le CBRS propose deux activités de réflexion en alternance: échecs et bridge. Les deux disciplines se pratiquent en petits groupes dans une ambiance détendue, idéale pour stimuler les fonctions cognitives.</p>",
    meeting_point: "Salle de réunion — Maison des associations",
    level: 'Tous niveaux',
    practical_info: [
      "Échiquiers et cartes fournis",
      "Adhésion à la FFE recommandée pour les échecs"
    ],
    animators: [
      { name: 'Pierre L.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Lundi', time: '14h00', location: 'Salle de réunion' }
    ],
    published: 1
  },
  {
    id: '13', name: 'Jeux de Cartes', slug: 'jeux-de-cartes', category: 'Activité',
    logo: '13_jeux_de_cartes.png',
    short_description: "Belote, tarot et autres jeux de cartes dans une ambiance conviviale. Un bon moyen de stimuler sa mémoire.",
    presentation: "<p>Le club de jeux de cartes du CBRS se retrouve chaque semaine pour des parties de belote, tarot et autres jeux traditionnels. Une activité conviviale qui fait travailler la mémoire et la stratégie.</p>",
    meeting_point: "Salle de réunion — Maison des associations",
    level: 'Tous niveaux',
    practical_info: [
      "Cartes fournies",
      "Goûter partagé (chacun apporte)"
    ],
    animators: [
      { name: 'Gérard S.', phone: '', email: '', role: 'Animateur' }
    ],
    schedule: [
      { day: 'Jeudi', time: '14h00', location: 'Salle de réunion' }
    ],
    published: 1
  },
  {
    id: '14', name: 'Danse', slug: 'danse', category: 'Activité',
    logo: '14_danse.png',
    short_description: "Cours de danse de salon et danse en ligne. Apprenez ou perfectionnez vos pas dans une ambiance musicale et joyeuse.",
    presentation: "<p>Les cours de danse du CBRS mêlent danses de salon (valse, tango, cha-cha) et danses en ligne. Ouverts à tous les niveaux, ils se déroulent dans une ambiance musicale et joyeuse.</p>",
    meeting_point: "Salle des fêtes — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Chaussures de danse ou de salle",
      "Bouteille d'eau",
      "Tenue souple"
    ],
    animators: [
      { name: 'Claudine M.', phone: '', email: '', role: 'Animatrice' }
    ],
    schedule: [
      { day: 'Mardi', time: '14h30', location: 'Salle des fêtes' }
    ],
    published: 1
  },
  {
    id: '15', name: 'Atelier Mémoire', slug: 'atelier-memoire', category: 'Activité',
    logo: '15_atelier_mémoire.png',
    short_description: "Exercices ludiques pour stimuler et entretenir sa mémoire. Jeux, quiz et activités cognitives en petit groupe.",
    presentation: "<p>L'atelier mémoire du CBRS propose des exercices ludiques et variés pour stimuler les différentes formes de mémoire: visuelle, auditive, sémantique, épisodique. Animé par une neuropsychologue diplômée.</p><p>Séances en petit groupe (10 personnes maximum) tous les 15 jours.</p>",
    meeting_point: "Maison des associations — Beauvais",
    level: 'Tous niveaux',
    practical_info: [
      "Crayon et bloc-notes fournis",
      "Goûter partagé"
    ],
    animators: [
      { name: 'Dr Anne-Sophie R.', phone: '', email: '', role: 'Animatrice' }
    ],
    schedule: [
      { day: 'Mercredi', time: '14h00', location: 'Maison des associations' }
    ],
    published: 1
  }
];

module.exports = activities;
