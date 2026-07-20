(function (window) {
  const fallbackImage = 'assets-premium/header-outings-realistic-v1.png';

  const outings = [
    {
      id: 'deux-caps',
      title: 'Site des Deux Caps',
      category: 'Sortie à la journée',
      teaser: 'Gris Nez & Blanc Nez — randonnée littorale.',
      description: 'Une journée entre falaises, mer et chemins du littoral, dans un cadre propice à la marche et à la découverte.',
      image: 'assets-premium/marche.png',
      fallbackImage,
      location: 'Gris-Nez & Blanc-Nez',
      coordinates: { lat: 50.866, lng: 1.593, bbox: '1.54%2C50.80%2C1.72%2C50.91' },
      date: null,
      schedule: null,
      status: 'Informations pratiques à venir',
      mapLabel: 'Site des Deux Caps'
    },
    {
      id: 'baie-somme',
      title: 'Baie de Somme',
      category: 'Sortie à la journée',
      teaser: 'Traversée de la baie et grands espaces.',
      description: 'Une sortie tournée vers les paysages de la baie, les grands espaces et le plaisir de partager une journée au grand air.',
      image: 'assets-premium/randonnee.png',
      fallbackImage,
      location: 'Baie de Somme',
      coordinates: { lat: 50.22, lng: 1.62, bbox: '1.53%2C50.17%2C1.85%2C50.29' },
      date: null,
      schedule: null,
      status: 'Informations pratiques à venir',
      mapLabel: 'Baie de Somme'
    },
    {
      id: 'treport-criel',
      title: 'Le Tréport & Criel-sur-Mer',
      category: 'Sortie à la journée',
      teaser: "Côte d'Albâtre, falaises et patrimoine.",
      description: "Une escapade entre panoramas maritimes, patrimoine côtier et chemins de la Côte d'Albâtre.",
      image: 'assets-premium/marche.png',
      fallbackImage,
      location: 'Le Tréport & Criel-sur-Mer',
      coordinates: { lat: 50.065, lng: 1.37, bbox: '1.28%2C50.01%2C1.56%2C50.11' },
      date: null,
      schedule: null,
      status: 'Informations pratiques à venir',
      mapLabel: 'Le Tréport et Criel-sur-Mer'
    },
    {
      id: 'dieppe',
      title: 'Dieppe',
      category: 'Sortie à la journée',
      teaser: 'Une journée entre mer, ville et convivialité.',
      description: 'Une destination idéale pour profiter du bord de mer, découvrir la ville et partager un moment avec le club.',
      image: 'assets-premium/real-sortie-senlis.png',
      fallbackImage,
      location: 'Dieppe',
      coordinates: { lat: 49.922, lng: 1.08, bbox: '1.04%2C49.88%2C1.16%2C49.97' },
      date: null,
      schedule: null,
      status: 'Informations pratiques à venir',
      mapLabel: 'Dieppe'
    },
    {
      id: 'giverny',
      title: 'Giverny',
      category: 'Sortie à la journée',
      teaser: 'Jardins de Monet et village impressionniste.',
      description: 'Une parenthèse culturelle et bucolique au cœur des jardins et du village de Giverny.',
      image: 'assets-premium/randonnee.png',
      fallbackImage,
      location: 'Giverny',
      coordinates: { lat: 49.075, lng: 1.53, bbox: '1.48%2C49.01%2C1.62%2C49.10' },
      date: null,
      schedule: null,
      status: 'Informations pratiques à venir',
      mapLabel: 'Giverny'
    },
    {
      id: 'paris',
      title: 'Paris',
      category: 'Sortie à la journée',
      teaser: 'Quais de Seine, Saint-Leu et Montmartre.',
      description: 'Une journée pour découvrir Paris autrement, entre promenade, patrimoine et quartiers emblématiques.',
      image: 'assets-premium/marche.png',
      fallbackImage,
      location: 'Paris',
      coordinates: { lat: 48.8566, lng: 2.3522, bbox: '2.26%2C48.80%2C2.44%2C48.91' },
      date: null,
      schedule: null,
      status: 'Informations pratiques à venir',
      mapLabel: 'Paris'
    },
    {
      id: 'hortillonnages-amiens',
      title: "Hortillonnages d'Amiens",
      category: 'Sortie à la journée',
      teaser: 'Promenade en barque dans les jardins flottants.',
      description: 'Une découverte paisible des jardins flottants et des paysages singuliers des Hortillonnages.',
      image: 'assets-premium/randonnee.png',
      fallbackImage,
      location: "Hortillonnages d'Amiens",
      coordinates: { lat: 49.89, lng: 2.30, bbox: '2.24%2C49.82%2C2.39%2C49.94' },
      date: null,
      schedule: null,
      status: 'Informations pratiques à venir',
      mapLabel: "Hortillonnages d'Amiens"
    },
    {
      id: 'forges-les-eaux',
      title: 'Forges-les-Eaux',
      category: 'Sortie à la journée',
      teaser: "Au cœur de la forêt d'Eawy.",
      description: "Une sortie nature pour respirer, marcher et profiter de l'environnement forestier de Forges-les-Eaux.",
      image: 'assets-premium/randonnee.png',
      fallbackImage,
      location: 'Forges-les-Eaux',
      coordinates: { lat: 49.61, lng: 1.55, bbox: '1.46%2C49.56%2C1.65%2C49.69' },
      date: null,
      schedule: null,
      status: 'Informations pratiques à venir',
      mapLabel: 'Forges-les-Eaux'
    }
  ];

  const events = [
    {
      id: 'repas-touquet',
      title: 'Repas des bénévoles au Touquet',
      category: 'Vie du club',
      teaser: 'Un moment de reconnaissance pour celles et ceux qui font vivre le CBRS.',
      description: 'Une journée conviviale consacrée aux bénévoles et à la vie collective du club.',
      image: 'assets-premium/real-sortie-senlis.png',
      fallbackImage,
      location: 'Le Touquet',
      coordinates: { lat: 50.52, lng: 1.59, bbox: '1.53%2C50.48%2C1.65%2C50.56' },
      date: '11 juin 2026',
      schedule: null,
      status: 'Horaire à confirmer',
      mapLabel: 'Le Touquet'
    },
    {
      id: 'plan-eau-canada-2026',
      title: "Journée au Plan d'eau du Canada",
      category: 'Sortie & événement',
      teaser: 'Une journée conviviale autour d’activités variées sous le soleil.',
      description: "Une journée au bord de l'eau pour se retrouver, bouger et profiter d'activités variées.",
      image: 'assets-premium/real-sortie-senlis.png',
      fallbackImage,
      location: "Plan d'eau du Canada, Beauvais",
      coordinates: { lat: 49.445, lng: 2.10, bbox: '2.08%2C49.43%2C2.13%2C49.46' },
      date: '27 mai 2026',
      schedule: null,
      status: 'Horaire à confirmer',
      mapLabel: "Plan d'eau du Canada"
    },
    {
      id: 'journee-animateurs-dieppe',
      title: 'Journée des animateurs — Dieppe',
      category: 'Vie du club',
      teaser: 'Une journée dédiée aux animateurs et aux bénévoles.',
      description: 'Un temps de rencontre pour les animateurs, les bénévoles et les personnes qui accompagnent les activités du CBRS.',
      image: 'assets-premium/real-sortie-senlis.png',
      fallbackImage,
      location: 'Dieppe',
      coordinates: { lat: 49.922, lng: 1.08, bbox: '1.04%2C49.88%2C1.16%2C49.97' },
      date: '3 juin 2025',
      schedule: null,
      status: 'Événement passé',
      mapLabel: 'Dieppe'
    },
    {
      id: 'plan-eau-canada-2025',
      title: "Journée au Plan d'eau du Canada",
      category: 'Sortie & événement',
      teaser: 'Un rendez-vous partagé autour des activités du club.',
      description: "Un souvenir de journée conviviale au Plan d'eau du Canada.",
      image: 'assets-premium/real-sortie-senlis.png',
      fallbackImage,
      location: "Plan d'eau du Canada, Beauvais",
      coordinates: { lat: 49.445, lng: 2.10, bbox: '2.08%2C49.43%2C2.13%2C49.46' },
      date: '13 mai 2025',
      schedule: null,
      status: 'Événement passé',
      mapLabel: "Plan d'eau du Canada"
    },
    {
      id: 'olympiades-seniors',
      title: 'Journée Olympiades Séniors',
      category: 'Événement',
      teaser: 'Une journée sportive et ludique pour les seniors du Beauvaisis.',
      description: 'Une rencontre placée sous le signe du sport, du jeu et de la convivialité.',
      image: 'assets-premium/real-sortie-senlis.png',
      fallbackImage,
      location: 'Beauvais',
      coordinates: { lat: 49.430, lng: 2.08, bbox: '2.03%2C49.40%2C2.13%2C49.47' },
      date: '15 avril 2024',
      schedule: null,
      status: 'Événement passé',
      mapLabel: 'Beauvais'
    }
  ];

  window.CBRS_OUTINGS = outings;
  window.CBRS_EVENTS = events;
  window.CBRS_OUTINGS_FALLBACK = fallbackImage;
})(window);
