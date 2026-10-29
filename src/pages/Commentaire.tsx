import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { construireMessage, LONGUEUR_MAX, refValide, TYPES_COMMENTAIRE, type TypeCommentaire } from '../lib/commentaire';

/** Description du navigateur et de l'écran, utile pour reproduire un bug (visible avant copie, facultatif). */
function contexteTechnique(): string {
  try {
    return `${navigator.userAgent} · écran ${window.innerWidth}×${window.innerHeight}`;
  } catch {
    return '';
  }
}

export default function Commentaire() {
  const [params] = useSearchParams();
  const refInitiale = refValide(params.get('ref'));
  const [type, setType] = useState<TypeCommentaire>(refInitiale ? 'question' : 'bug');
  const [description, setDescription] = useState('');
  const [etapes, setEtapes] = useState('');
  const [ref, setRef] = useState(refInitiale);
  const [avecContexte, setAvecContexte] = useState(true);
  const [copie, setCopie] = useState<'non' | 'oui' | 'echec'>('non');
  const apercu = useRef<HTMLTextAreaElement>(null);

  const consigne = TYPES_COMMENTAIRE.find((t) => t.id === type)!.consigne;
  const message = useMemo(
    () =>
      construireMessage({
        type,
        description,
        etapes,
        ref: type === 'question' || ref ? refValide(ref) : '',
        contexte: avecContexte ? contexteTechnique() : '',
      }),
    [type, description, etapes, ref, avecContexte],
  );
  const pret = description.trim().length >= 10;

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopie('oui');
    } catch {
      // Presse-papiers indisponible : on sélectionne le texte pour qu'il soit copié à la main.
      apercu.current?.focus();
      apercu.current?.select();
      setCopie('echec');
    }
  };

  return (
    <article aria-labelledby="titre-commentaire" className="apropos">
      <h1 id="titre-commentaire">Envoyer un commentaire</h1>
      <p>
        Un problème, une erreur dans une question, une idée ? Écris-le ici : l’appli prépare un message clair et complet,
        que tu copies puis que tu colles sur le sujet du forum où tu as trouvé ce site. Ça nous aide à retrouver et à
        corriger vite.
      </p>
      <p className="encadre" role="note">
        Rien n’est envoyé depuis cette page : le message est préparé sur ton appareil, c’est toi qui le publies.
      </p>

      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>De quoi s’agit-il ?</legend>
          {TYPES_COMMENTAIRE.map((t) => (
            <label key={t.id} className="choix">
              <input type="radio" name="type" checked={type === t.id} onChange={() => setType(t.id)} />
              {t.libelle}
            </label>
          ))}
        </fieldset>

        {(type === 'question' || ref) && (
          <p>
            <label htmlFor="ref">
              Référence de la question <span className="discret">(affichée en petit sous la question)</span>
            </label>
            <br />
            <input
              id="ref"
              type="text"
              value={ref}
              maxLength={80}
              onChange={(e) => setRef(e.target.value.trim())}
              placeholder="ex. codage-v2-d2-s48213"
              aria-describedby="aide-ref"
            />
            <span id="aide-ref" className="discret">
              {' '}
              {ref && !refValide(ref) ? 'Cette référence semble incorrecte : copie-la telle qu’elle est affichée.' : ''}
            </span>
          </p>
        )}

        <p>
          <label htmlFor="description">{consigne}</label>
          <br />
          <textarea
            id="description"
            rows={6}
            maxLength={LONGUEUR_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-describedby="aide-description"
            style={{ width: '100%' }}
          />
          <span id="aide-description" className="discret">
            Au moins 10 caractères. Plus c’est précis, plus c’est facile à corriger.
          </span>
        </p>

        {type === 'bug' && (
          <p>
            <label htmlFor="etapes">
              Comment le reproduire ? <span className="discret">(facultatif : les étapes, une par ligne)</span>
            </label>
            <br />
            <textarea
              id="etapes"
              rows={3}
              maxLength={LONGUEUR_MAX}
              value={etapes}
              onChange={(e) => setEtapes(e.target.value)}
              style={{ width: '100%' }}
            />
          </p>
        )}

        <label className="choix">
          <input type="checkbox" checked={avecContexte} onChange={(e) => setAvecContexte(e.target.checked)} />
          Ajouter mon navigateur et la taille de mon écran (utile pour comprendre un bug)
        </label>

        <h2>Ton message</h2>
        <label htmlFor="apercu" className="visuellement-cache">
          Message prêt à copier
        </label>
        <textarea id="apercu" ref={apercu} readOnly rows={8} value={message} style={{ width: '100%' }} />
        <div className="actions">
          <button type="button" className="bouton" onClick={copier} disabled={!pret}>
            Copier le message
          </button>
          <Link className="bouton bouton-secondaire" to="/">
            Retour
          </Link>
        </div>
        <p role="status">
          {copie === 'oui' && 'Message copié : colle-le sur le sujet du forum.'}
          {copie === 'echec' && 'Copie automatique impossible : le message est sélectionné, copie-le avec Ctrl+C (ou Cmd+C).'}
          {copie === 'non' && !pret && 'Écris au moins une phrase pour pouvoir copier le message.'}
        </p>
      </form>

      <h2>Ajouter une capture d’écran</h2>
      <p>Une image vaut mille mots, surtout pour un bug d’affichage. Elle se joint directement sur le forum :</p>
      <ul>
        <li>
          <strong>Windows</strong> : touches Windows + Maj + S, puis sélectionne la zone.
        </li>
        <li>
          <strong>Mac</strong> : touches Cmd + Maj + 4.
        </li>
        <li>
          <strong>Téléphone</strong> : boutons volume bas + marche/arrêt (ou selon ton modèle).
        </li>
      </ul>
      <p>
        Dans ta réponse sur le forum, ajoute l’image avec le bouton de téléversement ou un simple glisser-déposer. Pense
        à masquer ce qui est personnel avant de la publier.
      </p>
    </article>
  );
}
