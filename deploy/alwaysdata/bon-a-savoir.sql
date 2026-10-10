-- Contenu initial de l'encadré « Bon à savoir » des fiches activité (repris des infos pratiques et des créneaux).
-- Rejouable : n'écrase que les champs encore vides, sur la fiche publiée et sur sa dernière version (celle que montre l'admin).
-- Usage : psql "$URI" -f bon-a-savoir.sql
BEGIN;
CREATE TEMP TABLE bas (slug text, tenue text, materiel text, intensite text, duree text, prix text) ON COMMIT DROP;
INSERT INTO bas VALUES
('01','Maillot de bain, bonnet','Serviette, sandales de piscine','douce',NULL,'Compris dans l''adhésion'),
('02','Tenue décontractée','Boules fournies par le club','douce','2 h','Compris dans l''adhésion'),
('03','Tenue de cycliste, casque recommandé','Vélo en bon état','soutenue','40 à 60 km','Compris dans l''adhésion'),
('04','Tenue confortable','Matériel fourni par le club','douce','1 h 30','Compris dans l''adhésion'),
('05','Tenue de sport, chaussures d''intérieur','Raquettes fournies','moderee','2 à 3 h','Compris dans l''adhésion'),
('06','Tenue de sport, chaussures de tennis','Raquette personnelle recommandée','moderee',NULL,'Compris dans l''adhésion'),
('07','Chaussures de marche, tenue selon la météo','Bâtons recommandés, eau','moderee','8 à 12 km','Compris dans l''adhésion'),
('08','Chaussures de sport','Bâtons fournis aux nouveaux pratiquants','moderee','1 h 30','Compris dans l''adhésion'),
('09','Tenue souple','Tapis de sol recommandé, bouteille d''eau','moderee',NULL,'Compris dans l''adhésion'),
('10','Tenue de sport, chaussures d''intérieur','Raquettes fournies','moderee','2 h','Compris dans l''adhésion'),
('11','Tenue souple, chaussures plates','Aucun','douce','1 h','Compris dans l''adhésion'),
('12',NULL,'Jeux fournis','douce','3 h','Compris dans l''adhésion'),
('13',NULL,'Jeux fournis','douce','3 h 45','Compris dans l''adhésion'),
('14','Tenue confortable, chaussures adaptées',NULL,'moderee',NULL,'Compris dans l''adhésion'),
('15',NULL,'Aucun matériel requis','douce',NULL,'Compris dans l''adhésion'),
('16',NULL,NULL,'douce',NULL,'Compris dans l''adhésion'),
('17','Tenue confortable',NULL,'douce',NULL,'Compris dans l''adhésion');

UPDATE activites a SET
  bon_a_savoir_tenue = COALESCE(NULLIF(a.bon_a_savoir_tenue,''), b.tenue),
  bon_a_savoir_materiel = COALESCE(NULLIF(a.bon_a_savoir_materiel,''), b.materiel),
  bon_a_savoir_intensite = COALESCE(a.bon_a_savoir_intensite, b.intensite::enum_activites_bon_a_savoir_intensite),
  bon_a_savoir_duree = COALESCE(NULLIF(a.bon_a_savoir_duree,''), b.duree),
  bon_a_savoir_prix = COALESCE(NULLIF(a.bon_a_savoir_prix,''), b.prix)
FROM bas b WHERE a.slug = b.slug;

UPDATE _activites_v v SET
  version_bon_a_savoir_tenue = COALESCE(NULLIF(v.version_bon_a_savoir_tenue,''), b.tenue),
  version_bon_a_savoir_materiel = COALESCE(NULLIF(v.version_bon_a_savoir_materiel,''), b.materiel),
  version_bon_a_savoir_intensite = COALESCE(v.version_bon_a_savoir_intensite, b.intensite::enum__activites_v_version_bon_a_savoir_intensite),
  version_bon_a_savoir_duree = COALESCE(NULLIF(v.version_bon_a_savoir_duree,''), b.duree),
  version_bon_a_savoir_prix = COALESCE(NULLIF(v.version_bon_a_savoir_prix,''), b.prix)
FROM activites a JOIN bas b ON a.slug = b.slug
WHERE v.parent_id = a.id AND v.latest;
COMMIT;
