/**
 * Mots courants (noms concrets) pour l'épreuve de codage.
 * Liste rédigée à la main pour ce projet (pas de copie d'une base protégée).
 * Elle est volontairement courte au départ : à étendre vers 500-1 000 mots
 * (voir TODO-FORMATS.md). Tous en minuscules, sans doublon (vérifié par les tests).
 */
const BRUT = `
arbre avion argent animal armoire assiette auto ampoule abeille aiguille
bateau balcon banane bureau bouteille bougie brosse billet bonnet bijou boussole branche
cheval chaise cuisine chemin couteau cahier camion canard clavier cerise cadeau carotte chapeau cloche
dessin dragon drapeau douche dentiste désert dauphin diamant danseur disque
escalier étoile enfant école éponge épice étagère écharpe enveloppe
fenêtre fleur forêt fromage fusée farine fourchette frigo fontaine fourmi fumée
garage gâteau genou girafe guitare gomme glace galet gant grenier
hôtel horloge hiver hibou harpe hôpital hélice hamac
île image insecte iris igloo
jardin jambe jouet journal jupe jumelles jungle
koala kiwi kayak
lampe livre lune lapin lunettes légume lion lit lac levier lettre
maison miroir montagne marteau musée moto mouton melon manteau marché médaille moulin
nuage navire neige noix nuit nappe nid note
orange oiseau ours océan olive ordinateur orage oreille
pomme plage pont porte poisson prairie parc pinceau piano pantalon poule peigne plume poire pull
quai quartier quille
radio rivière robe rocher renard roue rideau règle racine rame ruban
soleil sac stylo salon serpent sable singe savon saison sapin sifflet sentier statue
table train tapis tigre tomate toit tableau tunnel tracteur théière tambour tente tortue tuile
usine uniforme urne
voiture vélo village valise verre vague volcan voile violon vitrine vallée
wagon
xylophone
yaourt yacht
zèbre zéro zone
`;

export const MOTS: readonly string[] = BRUT.split(/\s+/).filter((m) => m.length > 0);
