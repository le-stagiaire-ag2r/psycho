import type { Item } from '../lib/types';
import { Miniature } from './QuestionView';

interface Props {
  item: Item;
  /** Proposition choisie (null = question non traitée) */
  choix: number | null;
}

function Reponse({ item, index, etiquette, ton }: { item: Item; index: number; etiquette: string; ton: 'ok' | 'ko' }) {
  return (
    <div className={`rep rep-${ton}`}>
      <span className="rep-etiquette">{etiquette}</span>
      <span className="rep-valeur">
        <Miniature item={item} index={index} />
      </span>
    </div>
  );
}

/**
 * Correction pédagogique : ta réponse face à la bonne, pourquoi l'une est fausse et l'autre juste,
 * la règle à retenir, et le sort de chaque proposition.
 */
export default function Correction({ item, choix }: Props) {
  const juste = choix === item.bonneReponse;
  const detailBonne = item.pourquoi[item.bonneReponse];
  return (
    <div className="correction">
      <div className="correction-duel">
        {choix !== null && !juste && <Reponse item={item} index={choix} etiquette="Ta réponse" ton="ko" />}
        <Reponse item={item} index={item.bonneReponse} etiquette="Bonne réponse" ton="ok" />
      </div>

      {choix !== null && !juste && (
        <section>
          <h3>Pourquoi ta réponse est fausse</h3>
          <p>{item.pourquoi[choix]}</p>
        </section>
      )}
      <section>
        <h3>{juste ? 'Pourquoi c’est juste' : 'Pourquoi la bonne réponse est juste'}</h3>
        <p>{detailBonne}</p>
      </section>
      {!detailBonne.includes(item.explication) && (
        <section className="a-retenir">
          <h3>À retenir</h3>
          <p>{item.explication}</p>
        </section>
      )}

      <details className="correction-toutes">
        <summary>Voir toutes les propositions</summary>
        <ul>
          {item.options.map((o, i) => (
            <li key={i} className={i === item.bonneReponse ? 'prop-bonne' : 'prop-fausse'}>
              <span aria-hidden="true" className="prop-signe">
                {i === item.bonneReponse ? '✓' : '✗'}
              </span>
              <div>
                <strong>{o}</strong>
                <span className="visuellement-cache">{i === item.bonneReponse ? ' (bonne réponse)' : ' (fausse)'}</span>
                <p>{item.pourquoi[i]}</p>
              </div>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
