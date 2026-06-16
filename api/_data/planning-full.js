const activities = [
  {
    id: 'aquagym',
    name: 'Aquagym',
    category: 'sport',
    categoryLabel: 'Sport',
    categoryColor: 'blue',
    slots: [
      { day: 'Lundi', time: 'Voir planning', location: 'Piscine Bellier' },
      { day: 'Vendredi', time: 'Voir planning', location: 'Piscine Bellier' }
    ],
    sort_order: 1
  },
  {
    id: 'petanque',
    name: 'Pétanque',
    category: 'plein-air',
    categoryLabel: 'Plein air',
    categoryColor: 'green',
    slots: [
      { day: 'Lundi', time: '14h00 – 16h00', location: 'Parc Kennedy' },
      { day: 'Vendredi', time: '14h00 – 16h00', location: 'Parc Kennedy' }
    ],
    sort_order: 2
  },
  {
    id: 'cyclisme',
    name: 'Cyclisme',
    category: 'plein-air',
    categoryLabel: 'Plein air',
    categoryColor: 'green',
    slots: [
      { day: 'Mercredi', time: '13h30', location: 'Parking cimetière du Tilloy' },
      { day: 'Vendredi', time: '13h30', location: 'Parking Saint Quentin / Cimetière du Tilloy' }
    ],
    sort_order: 3
  },
  {
    id: 'tir-a-larc',
    name: "Tir à l'arc",
    category: 'sport',
    categoryLabel: 'Sport',
    categoryColor: 'blue',
    slots: [
      { day: 'Mardi', time: '9h30 – 11h00', location: 'Parc Marcel Dassault' },
      { day: 'Vendredi', time: '9h30 – 11h00', location: 'Parc Marcel Dassault' }
    ],
    sort_order: 4
  },
  {
    id: 'tennis-de-table',
    name: 'Tennis de Table',
    category: 'sport',
    categoryLabel: 'Sport',
    categoryColor: 'blue',
    slots: [
      { day: 'Lundi', time: '10h00 – 12h00', location: 'Gymnase Briard' },
      { day: 'Mardi', time: '9h00 – 12h00', location: 'Gymnase Briard' },
      { day: 'Mercredi', time: '9h00 – 12h00', location: 'Gymnase Briard' },
      { day: 'Jeudi', time: '14h00 – 17h00', location: 'Gymnase Goincourt' }
    ],
    sort_order: 5
  },
  {
    id: 'tennis',
    name: 'Tennis',
    category: 'sport',
    categoryLabel: 'Sport',
    categoryColor: 'blue',
    slots: [
      { day: '—', time: 'Voir planning', location: 'Complexe sportif de Beauvais' }
    ],
    sort_order: 6
  },
  {
    id: 'randonnee',
    name: 'Randonnée',
    category: 'plein-air',
    categoryLabel: 'Plein air',
    categoryColor: 'green',
    slots: [
      { day: 'Jeudi', time: '9h30 (été) / 14h10 (hiver)', location: "Plan d'eau du Canada" },
      { day: 'Jeudi', time: '14h00', location: 'Bois du Parc Saint Quentin' },
      { day: 'Jeudi', time: 'Après-midi (variable)', location: 'Randonnées externes' }
    ],
    sort_order: 7
  },
  {
    id: 'marche-nordique',
    name: 'Marche Nordique',
    category: 'plein-air',
    categoryLabel: 'Plein air',
    categoryColor: 'green',
    slots: [
      { day: 'Mercredi', time: '9h30 – 11h00', location: "Plan d'eau du Canada" }
    ],
    sort_order: 8
  },
  {
    id: 'gymnastique',
    name: 'Gymnastique',
    category: 'remise-en-forme',
    categoryLabel: 'Remise en forme',
    categoryColor: 'purple',
    slots: [
      { day: 'Lundi', time: '9h30', location: 'Salle Carnot' },
      { day: 'Mardi', time: 'Voir planning', location: 'Salle Coubertin' },
      { day: 'Vendredi', time: 'Voir planning', location: 'Salle Coubertin' }
    ],
    sort_order: 9
  },
  {
    id: 'pickleball',
    name: 'Pickleball',
    category: 'sport',
    categoryLabel: 'Sport',
    categoryColor: 'blue',
    slots: [
      { day: 'Mercredi', time: '11h00 – 13h00', location: 'Coubertin Plateau' },
      { day: 'Jeudi', time: '11h00 – 13h00', location: 'Gymnase R Briard, St Just' }
    ],
    sort_order: 10
  },
  {
    id: 'tai-chi-chuan',
    name: 'Tai Chi Chuan',
    category: 'bien-etre',
    categoryLabel: 'Bien-être',
    categoryColor: 'orange',
    slots: [
      { day: 'Lundi', time: '10h00 – 11h00', location: 'Coubertin Plateau' },
      { day: 'Vendredi', time: '11h15 – 12h15', location: 'Coubertin Plateau' }
    ],
    sort_order: 11
  },
  {
    id: 'echecs-bridge',
    name: 'Échecs / Bridge',
    category: 'loisir',
    categoryLabel: 'Loisir',
    categoryColor: 'yellow',
    slots: [
      { day: 'Lundi', time: '14h00 – 17h00', location: 'Salle de réunion CBRS' },
      { day: 'Jeudi', time: '14h00 – 17h00', location: 'Salle de réunion CBRS' }
    ],
    sort_order: 12
  },
  {
    id: 'jeux-de-cartes',
    name: 'Jeux de Cartes',
    category: 'loisir',
    categoryLabel: 'Loisir',
    categoryColor: 'yellow',
    slots: [
      { day: 'Lundi', time: '13h30 – 17h15', location: 'Salle Boibessot' },
      { day: 'Mardi', time: '13h30 – 17h15', location: 'Salle Boibessot' },
      { day: 'Jeudi', time: '13h30 – 17h15', location: 'Salle Boibessot' }
    ],
    sort_order: 13
  },
  {
    id: 'danse',
    name: 'Danse',
    category: 'bien-etre',
    categoryLabel: 'Bien-être',
    categoryColor: 'orange',
    slots: [
      { day: '—', time: 'Voir planning', location: 'Salle de danse – Beauvais' }
    ],
    sort_order: 14
  },
  {
    id: 'atelier-memoire',
    name: 'Atelier Mémoire',
    category: 'cognitif',
    categoryLabel: 'Cognitif',
    categoryColor: 'pink',
    slots: [
      { day: 'Mercredi', time: 'Voir planning', location: 'Salle de réunion CBRS' }
    ],
    sort_order: 15
  }
];

module.exports = activities;
