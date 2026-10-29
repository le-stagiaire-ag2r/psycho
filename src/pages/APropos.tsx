import { Link, useNavigate } from 'react-router-dom';
import { NON_AFFILIATION } from '../config/app';
import { marquerAproposVu } from '../lib/guide';

/**
 * Page de bienvenue : affichée à la première visite, puis accessible depuis le menu.
 * Elle dit honnêtement ce qu'est l'appli, ce qu'elle n'est pas, et qu'elle est en bêta.
 */
export default function APropos() {
  const navigate = useNavigate();
  const continuer = () => {
    marquerAproposVu();
    navigate('/');
  };

  return (
    <article aria-labelledby="titre-apropos" className="apropos">
      <h1 id="titre-apropos">Bienvenue, avant de commencer</h1>
      <p className="encadre" role="note">
        <strong>Ce site est en bêta.</strong> Il peut contenir des erreurs, des bugs ou des questions ambiguës. C’est un
        outil d’entraînement fait par un candidat, pour des candidats : il ne remplace en rien la réalité.
      </p>

      <h2>À quoi sert ce site</h2>
      <p>
        T’entraîner aux tests psychotechniques, à l’anglais et au questionnaire de personnalité : découvrir comment ça se
        passe, te familiariser avec les formats, gagner en vitesse et en aisance, comprendre tes erreurs grâce aux
        corrections et aux fiches méthode.
      </p>

      <h2>Ce qu’il ne faut pas en attendre</h2>
      <ul>
        <li>
          <strong>Ce ne sont pas les vraies épreuves.</strong> Les tests officiels ne sont pas publiés. Les questions, les
          types d’exercices et la difficulté du jour J peuvent être différents.
        </li>
        <li>
          Les formats (nombre de questions, durées, ordre) sont <strong>reconstitués à partir de témoignages</strong> de
          candidats et d’informations publiques, qui ne sont pas toujours d’accord entre eux.
        </li>
        <li>
          Les objectifs par niveau et les repères E1 / E2 / E3 sont <strong>indicatifs</strong>. Ce ne sont pas des seuils
          officiels et ils ne prédisent pas ta note.
        </li>
        <li>
          Le questionnaire de personnalité n’a ni bonne réponse, ni score, ni profil : il sert seulement à découvrir le
          format.
        </li>
      </ul>

      <h2>Un projet gratuit et collaboratif</h2>
      <p>
        Le site est gratuit, sans compte et sans publicité, et il le restera. Il est fait sur du temps libre : ce n’est
        pas un métier à plein temps. Les corrections, les bugs et les questions s’améliorent petit à petit. Si tu vois une
        erreur ou si tu as une idée, dis-le : c’est ensemble qu’on pourra l’améliorer au maximum. Tu peux{' '}
        <Link to="/commentaire">envoyer un commentaire</Link> (la page prépare le message à coller sur le forum).
      </p>
      <p>En espérant que cela te sera utile.</p>

      <p className="non-affiliation">{NON_AFFILIATION}</p>

      <div className="actions">
        <button type="button" className="bouton bouton-grand" onClick={continuer} autoFocus>
          J’ai compris, c’est parti
        </button>
        <Link className="bouton bouton-secondaire" to="/confidentialite">
          Confidentialité
        </Link>
      </div>
    </article>
  );
}
