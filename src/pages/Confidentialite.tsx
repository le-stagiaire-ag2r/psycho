export default function Confidentialite() {
  return (
    <article>
      <h1>Confidentialité</h1>
      <p>
        <strong>Aucune donnée n’est collectée.</strong> Il n’y a pas de compte, pas de pub, pas de traceur, pas de
        serveur qui reçoit tes réponses.
      </p>
      <ul>
        <li>
          Les questions sont générées directement dans ton navigateur.
        </li>
        <li>
          Ta progression (scores, historique, préférences) est enregistrée uniquement dans le stockage local de ton
          navigateur. Elle ne quitte jamais ton appareil.
        </li>
        <li>
          Tu peux l’exporter en fichier JSON pour changer d’appareil, l’importer ailleurs, ou tout effacer depuis la
          page Progression.
        </li>
        <li>
          Deux petits indicateurs techniques, « page de bienvenue déjà lue » et « guide de départ déjà vu », sont aussi gardés dans ton navigateur pour ne
          pas te les remontrer à chaque visite. Tes préférences (niveau, thème, chrono) y sont enregistrées de la
          même façon.
        </li>
        <li>
          Le questionnaire de personnalité n’enregistre rien : tes réponses disparaissent à la fermeture de la page.
        </li>
      </ul>
      <h2>Hébergement</h2>
      <p>
        Le site est hébergé gratuitement par Vercel. Comme pour tout site web, l’hébergeur peut conserver des journaux
        techniques de connexion (adresse IP, date, page demandée) pour assurer la sécurité et le fonctionnement du
        service. Ces journaux ne contiennent ni tes réponses ni ta progression, qui restent sur ton appareil.
      </p>
    </article>
  );
}
