import { AVERTISSEMENT_DUREES, CHRONOS } from '../lib/chrono';
import type { ChronoPref } from '../lib/types';
import { useStockage } from '../state/Stockage';

/** Réglage du chrono de l'examen blanc (durées non officielles, donc ajustables). */
export default function ChoixChrono() {
  const { donnees, majPrefs } = useStockage();
  return (
    <>
      <fieldset className="segmente" data-guide="reglage-chrono">
        <legend>Chrono de l’examen blanc</legend>
        {CHRONOS.map((c) => (
          <label key={c.id}>
            <input
              type="radio"
              name="chrono"
              checked={donnees.prefs.chrono === c.id}
              onChange={() => majPrefs({ chrono: c.id as ChronoPref })}
            />
            <span>{c.libelle}</span>
          </label>
        ))}
      </fieldset>
      <p className="discret reglages-aide">{AVERTISSEMENT_DUREES}</p>
    </>
  );
}
