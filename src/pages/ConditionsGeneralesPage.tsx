import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Printer } from "@/components/ui/Icons";
import ClaudeChat from "@/components/ClaudeChat";
import { chatConditionsGenerales, ClaudeMessage } from "@/services/claudeService";

// ─── Données structurées du document ─────────────────────────────────────────

const CG_DATE        = "2024";
const CG_VERSION     = "1.0";
const CG_DATE_EFFET  = "01 janvier 2026";

interface Article {
  titre: string;
  contenu: React.ReactNode;
}

interface Chapitre {
  numero:   string;
  titre:    string;
  articles: Article[];
}

export const CHAPITRES: Chapitre[] = [
  {
    numero: "1",
    titre:  "Étendue de la garantie",
    articles: [
      {
        titre: "Article 1 — Objet du contrat",
        contenu: (
          <div className="space-y-3 text-sm leading-relaxed">
            <p>Le présent contrat a pour objet de <em>rembourser à l'assuré ou à ses ayants droits</em> conformément aux dispositions prévues aux Conditions Particulières, les dépenses d'ordre médical et chirurgical qu'il a pu engager à la suite de maladie ou d'accident dont il aurait été victime.</p>
            <div className="grid sm:grid-cols-3 gap-3 my-3">
              {[
                { term: "Maladie", def: "Altération de la santé constatée par un médecin." },
                { term: "Accident", def: "Toute atteinte corporelle non intentionnelle provenant de l'action soudaine d'une cause extérieure." },
                { term: "Assuré", def: "Les personnes désignées aux Conditions Particulières sous la rubrique « assuré »." },
              ].map(({ term, def }) => (
                <div key={term} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-semibold text-blue-800 text-xs uppercase mb-1">{term}</p>
                  <p className="text-xs text-blue-700">{def}</p>
                </div>
              ))}
            </div>
            <p>La garantie ne pourra être accordée en cours de contrat à d'autres personnes que celles figurant aux Conditions Particulières qu'après signature d'un avenant et, pour les nouveau-nés, sous réserve des dispositions de l'article 3.</p>
            <p>L'assurance peut être accordée <strong>sans franchise ou avec franchise</strong>. Dans ce dernier cas, le montant est indiqué aux Conditions Particulières et vient en déduction de l'indemnité.</p>
            <p className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">Les indemnités garanties viendront en complément des prestations de même nature (Sécurité Sociale, autre contrat), sans que l'assuré puisse recevoir au total un montant supérieur aux débours réels. <strong>(art. 34 du Code des assurances)</strong></p>
            <p>L'assuré a <strong>libre choix</strong> de son médecin ou spécialiste, du chirurgien et de la clinique ou hôpital.</p>
          </div>
        ),
      },
      {
        titre: "Article 2 — Territoire de garantie",
        contenu: (
          <div className="space-y-2 text-sm leading-relaxed">
            <p>Cette assurance s'exerce au <strong>Sénégal</strong>.</p>
            <p>Toutefois, à la demande du souscripteur et si expressément stipulée aux Conditions Particulières, la garantie peut être étendue à d'autres pays. Les règlements concernant les accidents ou maladies survenus en dehors du Sénégal seront effectués conformément aux Conditions Particulières.</p>
          </div>
        ),
      },
    ],
  },
  {
    numero: "2",
    titre:  "Entrée en vigueur des garanties",
    articles: [
      {
        titre: "Article 3 — Délais d'acquisition",
        contenu: (
          <div className="space-y-3 text-sm leading-relaxed">
            <p>Les garanties sont acquises :</p>
            <div className="space-y-2">
              {[
                {
                  label: "a) Accidents & maladies infectieuses",
                  delay: "IMMÉDIATEMENT",
                  color: "bg-green-50 border-green-300 text-green-800",
                  note: "Maladies infectieuses couvertes : oreillons, rougeole, coqueluche, diphtérie, varicelle, scarlatine, fièvre typhoïde et paratyphoïde, rubéole, dysenterie amibienne, choléra, petite vérole, typhus, poliomyélite.",
                },
                {
                  label: "b) Autres maladies",
                  delay: "3 MOIS",
                  color: "bg-amber-50 border-amber-300 text-amber-800",
                  note: "Délai porté à 12 mois pour les traitements en préventorium/sanatorium et les traitements du cancer.",
                },
                {
                  label: "c) Complications de grossesse",
                  delay: "7ème mois",
                  color: "bg-blue-50 border-blue-300 text-blue-800",
                  note: "À partir du 7ème mois, sauf convention contraire.",
                },
                {
                  label: "d) Complications d'accouchement",
                  delay: "9 MOIS",
                  color: "bg-purple-50 border-purple-300 text-purple-800",
                  note: "À compter de la prise d'effet du contrat.",
                },
              ].map(({ label, delay, color, note }) => (
                <div key={label} className={`border rounded-lg p-3 ${color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs">{label}</span>
                    <Badge className="text-xs">{delay}</Badge>
                  </div>
                  <p className="text-xs opacity-80">{note}</p>
                </div>
              ))}
              <div className="border rounded-lg p-3 bg-orange-50 border-orange-300 text-orange-800">
                <p className="font-semibold text-xs mb-1">e) Enfants nouveau-nés</p>
                <p className="text-xs">Dès accord de la Société, sous conditions :</p>
                <ul className="text-xs list-disc ml-4 mt-1 space-y-0.5">
                  <li>Parents assurés depuis au moins <strong>6 mois</strong> avant la naissance</li>
                  <li>Demande par lettre recommandée dans les <strong>4 semaines</strong> suivant la naissance</li>
                  <li>Absence de réponse de la Société dans les <strong>15 jours</strong> = accord tacite <em>(art. 6 Code des assurances)</em></li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    numero: "3",
    titre:  "Risques exclus",
    articles: [
      {
        titre: "Article 4 — Exclusions",
        contenu: (
          <div className="space-y-3 text-sm leading-relaxed">
            <p className="text-red-700 font-semibold">Ne donnent droit à aucune indemnité :</p>
            <div className="grid gap-2">
              {[
                { letter: "a", title: "Guerre, sports dangereux", desc: "Guerre civile ou étrangère, émeutes, rixes (sauf légitime défense), courses/paris, aviation (sauf passager lignes commerciales), sports dangereux : rugby, boxe, ski, bobsleigh, montagne avec guide, karting, chasse sous-marine, spéléologie, lutte, karaté, judo et arts martiaux." },
                { letter: "b", title: "Soins non prescrits", desc: "Traitements, médicaments, appareils ou hospitalisations non prescrits par des médecins ou auxiliaires médicaux dûment diplômés et/ou mandatés par la compagnie." },
                { letter: "c", title: "Addictions & psychiatrie", desc: "Toxicomanies, ivresse, éthylisme, tentative de suicide, mutilations volontaires, psychopathies, séjours en clinique psychiatrique, maison de convalescence ou de cure." },
                { letter: "d", title: "Esthétique & prévention", desc: "Traitements esthétiques, cures d'amaigrissement ou de rajeunissement, cures thermales, vaccinations préventives, traitement de la stérilité (si non bénéficiaire avant mariage), anomalies constitutionnelles (surdité, cécité, pieds bots, etc.)." },
                { letter: "e", title: "Complications d'accouchement hors liste", desc: "Complications autres que césarienne, fièvre puerpérale, phlébite, éclampsie. Pour ces derniers, l'hospitalisation n'est prise en charge qu'à partir du 13e jour." },
                { letter: "f", title: "Dentaire & optique (hors CP)", desc: "Soins dentaires et lunetterie, sauf stipulation aux Conditions Particulières." },
                { letter: "g", title: "Nucléaire & radiations", desc: "Maladies ou accidents résultant d'explosions nucléaires ou de radiations ionisantes (combustibles nucléaires, réacteurs). Aussi : toutes radiations liées à l'activité professionnelle habituelle." },
                { letter: "h–t", title: "Autres exclusions", desc: "Renouvellements d'ordonnance non prescrits, produits alimentaires, objets à usage médical (thermomètre, seringue…), massages/kinésithérapie non prescrits, transports médicaux non prescrits, visites prénatales, accidents du travail, séjours en maison de repos, soins militaires, frais postérieurs à la cessation de garantie, usage d'aéronefs (sauf passager d'appareils agréés), produits de pharmacie familiale." },
              ].map(({ letter, title, desc }) => (
                <div key={letter} className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <span className="shrink-0 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{letter}</span>
                  <div>
                    <p className="font-semibold text-xs text-red-800 mb-0.5">{title}</p>
                    <p className="text-xs text-red-700">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 border rounded p-3 text-xs">
              <p className="font-semibold mb-1">Pharmacie familiale non remboursée :</p>
              <p className="text-muted-foreground">Alcool, Mercurochrome, teinture d'iode, eau oxygénée, éther, éosine, sérum physiologique, tricostéril, fortifiant, mintézol, huile de paraffine, poudre paps, Vicks, Vaxigrip, pastilles, sparadrap, tampons antibio, coton et compresses, sucre de régime, savon, tout produit contraceptif.</p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    numero: "4",
    titre:  "Formation et durée du contrat",
    articles: [
      {
        titre: "Article 5 — Suspension militaire",
        contenu: (
          <div className="text-sm leading-relaxed space-y-2">
            <p>Les effets du contrat sont <strong>suspendus d'office</strong> à compter du moment où le bénéficiaire est placé sous le contrôle de l'autorité militaire, à l'exception des périodes militaires en temps de paix n'excédant pas un mois.</p>
            <p>Il reprendra ses effets après signature d'un avenant, à charge par le bénéficiaire d'informer la société de son retour et de remplir un nouveau questionnaire médical.</p>
          </div>
        ),
      },
      {
        titre: "Article 6 — Formation, durée et résiliation",
        contenu: (
          <div className="text-sm leading-relaxed space-y-3">
            <p>Le contrat est parfait dès signature par le souscripteur. Il produit ses effets le <strong>lendemain à midi</strong> du paiement de la première prime.</p>
            <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
              <p className="font-semibold text-indigo-800 mb-1">Durée & reconduction</p>
              <p className="text-xs text-indigo-700">Souscrit pour <strong>1 an</strong>, reconduit automatiquement d'année en année sauf dénonciation par lettre recommandée au moins <strong>1 mois</strong> avant l'échéance. La tacite reconduction ne peut excéder 1 an. <em>(Art. 24 Code des assurances)</em></p>
            </div>
            <p className="font-semibold">Cas de résiliation :</p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              {[
                { by: "Par la Société", cases: ["Non-paiement des primes (art. 13)", "Aggravation du risque (art. 15)", "Fausse déclaration intentionnelle (art. 18)", "Fausse déclaration non intentionnelle (art. 19)", "Faillite du souscripteur (art. 17)"] },
                { by: "Par le souscripteur", cases: ["Disparition des circonstances aggravantes (art. 15)", "Résiliation par la Société d'un autre contrat après sinistre (art. 23)", "Par la masse des créanciers en cas de faillite (art. 17)"] },
              ].map(({ by, cases }) => (
                <div key={by} className="bg-gray-50 border rounded p-2">
                  <p className="font-semibold mb-1">{by}</p>
                  <ul className="list-disc ml-3 space-y-0.5 text-muted-foreground">
                    {cases.map(c => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    numero: "5–8",
    titre:  "Cessation, déclaration, primes & sinistre",
    articles: [
      {
        titre: "Chapitre 5 — Cessation des garanties",
        contenu: (
          <div className="text-sm leading-relaxed space-y-2">
            <p><strong>1 — Résiliation par l'assuré :</strong> cessation des prestations à compter de la date de résiliation.</p>
            <p><strong>2 — Résiliation par la Société :</strong></p>
            <ul className="list-disc ml-5 text-xs space-y-1">
              <li>En cas de non-paiement ou fausse déclaration : cessation immédiate à la date de résiliation.</li>
              <li>En cas d'aggravation du risque, faillite, dénonciation : prise en charge des sinistres antérieurs à la résiliation.</li>
              <li>Les maladies soumises à délai d'attente survenant après la résiliation sont couvertes pendant une période égale à la moitié du délai de carence.</li>
            </ul>
          </div>
        ),
      },
      {
        titre: "Article 7 — Déclaration du risque",
        contenu: (
          <div className="text-sm leading-relaxed space-y-2">
            <p>Le souscripteur doit remettre un <strong>questionnaire-proposition</strong> dûment rempli et déclarer toute modification du risque par lettre recommandée dans les 15 jours :</p>
            <ul className="list-disc ml-5 text-xs space-y-0.5">
              <li>Changement de domicile</li>
              <li>Changement de profession d'un assuré</li>
              <li>Toute incorporation de membres de famille</li>
              <li>Retraite ou cessation d'activité</li>
              <li>Changement de situation ou de régime matrimonial</li>
            </ul>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">Si la modification constitue une aggravation, la Société peut dénoncer le contrat ou proposer un nouveau taux. Si elle atténue le risque, le souscripteur a droit à une réduction de prime.</p>
          </div>
        ),
      },
      {
        titre: "Article 8 — Primes",
        contenu: (
          <div className="text-sm leading-relaxed space-y-2">
            <p>La prise d'effet est subordonnée au paiement de la prime <em>(art. 13 Code des assurances)</em>.</p>
            <p>En cas de non-paiement dans les <strong>10 jours</strong> de l'échéance, la Société peut, par lettre recommandée, <strong>suspendre la garantie 30 jours</strong> après envoi. Elle peut ensuite résilier 10 jours après ce délai.</p>
            <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs">
              <p className="font-semibold text-orange-800">Assurance TAXAWU :</p>
              <p className="text-orange-700">La prime pour les enfants est majorée par avenant à partir de l'échéance suivant leur 18e anniversaire. À défaut d'acceptation, la garantie prend fin 30 jours après notification.</p>
            </div>
          </div>
        ),
      },
      {
        titre: "Article 9 — Obligations en cas de sinistre",
        contenu: (
          <div className="text-sm leading-relaxed space-y-2">
            <p>L'assuré doit déclarer tout sinistre <strong>sous peine de déchéance</strong> :</p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="font-semibold text-red-800">Accident / intervention chirurgicale</p>
                <p className="text-red-700">Dans les <strong>10 jours</strong> suivants</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <p className="font-semibold text-amber-800">Maladie</p>
                <p className="text-amber-700">Dans les <strong>30 jours</strong> suivant la première constatation médicale</p>
              </div>
            </div>
            <p className="text-xs">L'assuré doit également transmettre toutes pièces justificatives dans les <strong>30 jours</strong> suivant la guérison, et se soumettre à tout examen demandé par la Société.</p>
            <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded p-2">La production de documents intentionnellement faux entraîne la <strong>déchéance du droit à indemnité</strong>.</p>
          </div>
        ),
      },
      {
        titre: "Article 10 — Expertise",
        contenu: (
          <div className="text-sm leading-relaxed">
            <p>Les contestations médicales entre la Société et l'Assuré sont soumises à l'expertise d'un médecin nommé amiablement ou par ordonnance du Président du Tribunal compétent. Chaque partie supporte par moitié les honoraires de l'expert.</p>
          </div>
        ),
      },
      {
        titre: "Article 11 — Règlement des prestations",
        contenu: (
          <div className="text-sm leading-relaxed">
            <p>Le règlement est effectué dans un délai de <strong>30 jours</strong> à compter de l'accord des parties ou de la décision judiciaire. La Société est subrogée dans les droits de l'assuré contre les responsables du sinistre <em>(art. 42 Code des assurances)</em>.</p>
          </div>
        ),
      },
      {
        titre: "Article 12 — Prescription",
        contenu: (
          <div className="text-sm leading-relaxed">
            <p>Toutes actions dérivant du présent contrat sont prescrites par <strong>2 ans</strong> à compter de l'événement qui leur donne naissance <em>(art. 28 Code des assurances)</em>.</p>
          </div>
        ),
      },
    ],
  },
];

// ─── Conventions Spéciales ────────────────────────────────────────────────────

const CONVENTIONS: Chapitre = {
  numero: "CS",
  titre:  "Conventions Spéciales",
  articles: [
    {
      titre: "Article CS-1 — Adhésion à l'assurance",
      contenu: (
        <div className="text-sm leading-relaxed space-y-2">
          <p>Toute personne demandant son affiliation doit remplir et signer un bulletin comportant les renseignements d'État Civil, pour elle-même et les membres de sa famille, ainsi que répondre aux questions médicales du bulletin d'adhésion.</p>
          <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded p-2">Toute fausse déclaration, intentionnelle ou non, expose l'assuré aux sanctions prévues par la loi.</p>
        </div>
      ),
    },
    {
      titre: "Article CS-2 — Conditions d'admission",
      contenu: (
        <div className="text-sm leading-relaxed">
          <p>L'assureur se réserve le droit :</p>
          <ul className="list-disc ml-5 text-xs space-y-1 mt-2">
            <li>De subordonner son acceptation à l'exclusion de certains assurés ou membres de leur famille.</li>
            <li>D'exclure certaines maladies préexistantes à la date d'affiliation.</li>
            <li>De fixer des conditions sur le montant des primes.</li>
          </ul>
        </div>
      ),
    },
    {
      titre: "Article CS-3 — Garanties (Groupes A et B)",
      contenu: (
        <div className="text-sm leading-relaxed space-y-3">
          <p>Selon le régime stipulé aux Conditions Particulières :</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
              <p className="font-semibold text-blue-800 mb-2">Groupe A — Risques Graves (H.C.)</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Hospitalisation médicale</li>
                <li>• Traitement des tumeurs</li>
                <li>• Hospitalisation chirurgicale</li>
                <li>• Intervention chirurgicale</li>
              </ul>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-3">
              <p className="font-semibold text-green-800 mb-2">Groupe B — Garanties Complètes</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Soins médicaux (omnipraticiens, spécialistes, auxiliaires)</li>
                <li>• Médicaments</li>
                <li>• Analyses — Radio</li>
                <li>• Hospitalisation médicale & chirurgicale</li>
                <li>• Traitement des tumeurs</li>
                <li>• Maternité</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      titre: "Article CS-5 — Maternité",
      contenu: (
        <div className="text-sm leading-relaxed space-y-2">
          <p>En cas d'accouchement, les frais occasionnés par la grossesse, l'accouchement et la période suivante jusqu'au retour des couches seront pris en charge. Il en est de même pour les complications postérieures (fièvre puerpérale, phlébite, éclampsie).</p>
        </div>
      ),
    },
    {
      titre: "Article CS-6 — Cessation de garanties",
      contenu: (
        <div className="text-sm leading-relaxed space-y-2">
          <p>Tout assuré cesse d'être garanti :</p>
          <ul className="list-disc ml-5 text-xs space-y-1">
            <li>Dès le jour où il quitte le service de la contractante (décès ou séjour hors Sénégal)</li>
            <li>Lorsqu'il atteint l'âge de <strong>60 ans</strong></li>
            <li>Pendant la durée du service militaire excédant 1 mois</li>
          </ul>
        </div>
      ),
    },
    {
      titre: "Article CS-8 — Prime & Compte d'ajustement",
      contenu: (
        <div className="text-sm leading-relaxed space-y-3">
          <p>La prime forfaitaire est une <strong>prime provisionnelle</strong> ajustée à l'échéance selon un rapport Sinistres/Primes (S/P).</p>
          <div className="bg-teal-50 border border-teal-200 rounded p-3 text-xs">
            <p className="font-semibold text-teal-800 mb-1">Ajustement à l'échéance :</p>
            <ul className="text-teal-700 space-y-0.5 list-disc ml-3">
              <li><strong>Sinistres</strong> = total des dépenses effectuées ou restant à effectuer pour les bénéficiaires</li>
              <li><strong>Primes</strong> = total des primes nettes acquises au titre de l'exercice</li>
              <li>Si l'assuré refuse la nouvelle prime ajustée : notification par LR dans 1 mois. Les 3 premiers mois sont alors facturés à 68 % de la prime précédente.</li>
            </ul>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            {[
              { cas: "Non-paiement à la signature", action: "Suspension 30 jours après mise en demeure (CIMA)" },
              { cas: "Après 10 jours supplémentaires", action: "Droit de résiliation + poursuites judiciaires" },
              { cas: "Prescription", action: "2 ans à compter de l'événement" },
            ].map(({ cas, action }) => (
              <div key={cas} className="bg-gray-50 border rounded p-2">
                <p className="font-semibold">{cas}</p>
                <p className="text-muted-foreground">{action}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      titre: "Article CS-13 — Séjour en clinique ou hôpital",
      contenu: (
        <div className="text-sm leading-relaxed space-y-2">
          <p>Les frais de séjour sont soumis à la formalité de l'<strong>ACCORD PRÉALABLE</strong>, sauf cas fortuit ou force majeure.</p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 border rounded p-2">
              <p className="font-semibold">Hôpital</p>
              <p className="text-muted-foreground">Prise en charge sur la base de la 1ère catégorie de l'Hôpital Principal.</p>
            </div>
            <div className="bg-gray-50 border rounded p-2">
              <p className="font-semibold">Clinique</p>
              <p className="text-muted-foreground">Frais de séjour (chambre), nourriture, service paramédical, location salle d'opération. Honoraires et pharmacie remboursés sur barème.</p>
              <p className="text-red-600 mt-1">Non remboursés : Taxes, téléphone, divers.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      titre: "Article CS-14 — Accord préalable",
      contenu: (
        <div className="text-sm leading-relaxed space-y-2">
          <p>Lorsque la prise en charge est subordonnée à l'accord préalable, l'assuré adresse au Médecin-Conseil une demande par <strong>lettre recommandée avec AR</strong>, signée par le praticien prescripteur, accompagnée des pièces justificatives.</p>
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-amber-50 border border-amber-200 rounded p-2">
              <p className="font-semibold text-amber-800">Absence de réponse sous 15 jours</p>
              <p className="text-amber-700">= Accord tacite de l'assureur</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="font-semibold text-red-800">Urgence</p>
              <p className="text-red-700">Frais engageables immédiatement, formalités à remplir dans les 5 jours. Mention « ACTE D'URGENCE » obligatoire.</p>
            </div>
          </div>
        </div>
      ),
    },
  ],
};

// ─── Liens de navigation ──────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "ch-1",   label: "Étendue de la garantie" },
  { id: "ch-2",   label: "Entrée en vigueur" },
  { id: "ch-3",   label: "Risques exclus" },
  { id: "ch-4",   label: "Formation et durée" },
  { id: "ch-5",   label: "Cessation & sinistre" },
  { id: "ch-cs",  label: "Conventions Spéciales" },
];

// ─── Composant articles collapsibles ─────────────────────────────────────────

function ChapitreSection({ ch }: { ch: Chapitre }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900 mb-3">
        {ch.numero !== "CS" ? `Chapitre ${ch.numero} — ` : ""}{ch.titre}
      </h2>
      {ch.articles.map((art, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-900">{art.titre}</span>
          </div>
          <div className="px-4 pb-4 pt-3 text-muted-foreground">
            {art.contenu}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function ConditionsGeneralesPage() {
  const navigate  = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active,   setActive]   = useState("ch-1");
  const [scrolled, setScrolled] = useState(false);

  // Scroll spy + shrink navbar
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrolled(container.scrollTop > 60);
      for (const { id } of [...NAV_SECTIONS].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 100) {
          setActive(id);
          return;
        }
      }
      setActive(NAV_SECTIONS[0].id);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) scrollRef.current?.scrollTo({ top: el.offsetTop - 110, behavior: "smooth" });
  };

  const handlePrint = () => {
    const el = scrollRef.current;
    if (!el) return;

    // Expand container so all content is visible for print
    el.style.height = "auto";
    el.style.overflowY = "visible";

    // Inject print styles: hide fixed UI elements
    const style = document.createElement("style");
    style.id = "__cg_print__";
    style.textContent = `@media print { [data-noprint] { display: none !important; } }`;
    document.head.appendChild(style);

    window.print();

    // Restore after dialog closes
    setTimeout(() => {
      el.style.height = "100vh";
      el.style.overflowY = "auto";
      document.getElementById("__cg_print__")?.remove();
    }, 500);
  };

  return (
    <div ref={scrollRef} style={{ overflowY: "auto", height: "100vh" }}>

      {/* ── Navbar shrink ─────────────────────────────────────────────────── */}
      <div data-noprint className={`fixed left-1/2 -translate-x-1/2 z-[100] bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm flex items-center px-4 transition-all duration-300 ${
        scrolled
          ? "top-2 w-[min(520px,calc(100vw-2rem))] h-10"
          : "top-3 w-[min(860px,calc(100vw-2rem))] h-12"
      }`}>
        <div className="flex items-center justify-between w-full gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center shrink-0">
            <img src="/logo1.png" alt="Logo" className={`w-auto object-contain transition-all duration-300 ${scrolled ? "h-7" : "h-10"}`} />
          </button>

          {!scrolled && (
            <div className="hidden md:flex items-center gap-1">
              <a href="/#features"     className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">Fonctionnalités</a>
              <a href="/#testimonials" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">Témoignages</a>
              <a href="/contact"       className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">Contact</a>
              <div className="w-px h-5 mx-1 bg-gray-200" />
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {scrolled && <span className="text-xs text-gray-400 hidden sm:block mr-2">Conditions Générales v{CG_VERSION}</span>}
            <button onClick={() => navigate('/login')} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all">Connexion</button>
            {!scrolled && (
              <button onClick={() => navigate('/login')} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors">Commencer</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Barre chapitres fixe ──────────────────────────────────────────── */}
      <div data-noprint className={`fixed left-1/2 -translate-x-1/2 z-50 w-[min(900px,calc(100vw-2rem))] bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm transition-all duration-300 ${
        scrolled ? "top-[52px]" : "top-[64px]"
      }`}>
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-2">Chapitres :</span>
            {NAV_SECTIONS.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active === id ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 pt-32 pb-10 space-y-12">

        {/* En-tête institutionnel */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-blue-600 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-100 mb-1">Document officiel</p>
                <h1 className="text-xl sm:text-2xl font-bold leading-snug">Conditions Générales d'Assurance Santé</h1>
                <p className="text-blue-100 text-sm mt-1">Police d'Assurance Maladie — Papy Services Assurances</p>
              </div>
              <img src="/logo1.png" alt="Logo" className="h-12 w-auto object-contain opacity-90 shrink-0 hidden sm:block" />
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex flex-wrap gap-x-8 gap-y-2 text-sm border-t border-gray-200">
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Version</span><span className="font-semibold text-gray-800">v{CG_VERSION}</span></div>
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Date d'effet</span><span className="font-semibold text-gray-800">{CG_DATE_EFFET}</span></div>
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Réglementation</span><span className="font-semibold text-gray-800">Code CIMA</span></div>
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Émetteur</span><span className="font-semibold text-gray-800">Papy Services Assurances</span></div>
          </div>
          {/* Boutons PDF */}
          <div data-noprint className="px-6 py-4 flex flex-wrap gap-3 border-t border-gray-100 bg-white">
            <a
              href="/conditions-generales.pdf"
              download="Conditions-Generales-Papy-Services.pdf"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Download size={15} /> Télécharger le PDF
            </a>
            <a
              href="/conditions-generales.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
            >
              <Printer size={15} /> Imprimer
            </a>
          </div>
        </div>

        {/* Table des matières */}
        <div className="border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Table des matières</h2>
          </div>
          <ol className="space-y-1.5">
            {NAV_SECTIONS.map(({ id, label }, i) => (
              <li key={id}>
                <button onClick={() => scrollTo(id)}
                  className="flex items-center gap-3 w-full text-left group hover:text-blue-600 transition-colors">
                  <span className="text-xs font-mono text-gray-400 w-5 shrink-0">{i + 1}.</span>
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-600 border-b border-dashed border-gray-200 pb-0.5">{label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* Chapitres */}
        <section id="ch-1">  <ChapitreSection ch={CHAPITRES[0]} /></section>
        <section id="ch-2">  <ChapitreSection ch={CHAPITRES[1]} /></section>
        <section id="ch-3">  <ChapitreSection ch={CHAPITRES[2]} /></section>
        <section id="ch-4">  <ChapitreSection ch={CHAPITRES[3]} /></section>
        <section id="ch-5">  <ChapitreSection ch={CHAPITRES[4]} /></section>
        <section id="ch-cs"> <ChapitreSection ch={CONVENTIONS}  /></section>

        <p className="text-center text-xs text-gray-400 pb-4">
          © {CG_DATE} Papy Services Assurances — Tous droits réservés — Régi par le Code CIMA
        </p>
      </div>

      {/* ── Footer sobre ──────────────────────────────────────────────────── */}
      <footer data-noprint className="border-t border-gray-200 bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo1.png" alt="Logo" className="h-7 w-auto object-contain" />
            <span className="text-sm font-semibold text-gray-700">Papy Services Assurances</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-500">
            <button onClick={() => scrollTo("ch-1")} className="hover:text-blue-600 transition-colors">Conditions Générales</button>
            <span className="text-gray-300 hidden sm:inline">·</span>
            <button onClick={() => scrollTo("ch-1")} className="hover:text-blue-600 transition-colors">Garanties</button>
            <span className="text-gray-300 hidden sm:inline">·</span>
            <a href="/contact" className="hover:text-blue-600 transition-colors">Contact</a>
            <span className="text-gray-300 hidden sm:inline">·</span>
            <button className="hover:text-blue-600 transition-colors">Politique de confidentialité</button>
          </nav>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Tous droits réservés</p>
        </div>
      </footer>

      {/* Chatbot IA sur les conditions générales */}
      <ClaudeChat
        title="Assistant Conditions Générales"
        placeholder="Ex : Quelles sont les exclusions ?"
        systemContext="les conditions générales d'assurance maladie"
        suggestedQuestions={[
          "Quels actes sont pris en charge ?",
          "Quelles sont les principales exclusions ?",
          "Comment fonctionne le remboursement ?",
          "Quelles sont les conditions de souscription ?",
        ]}
        onAsk={(question: string, history: ClaudeMessage[]) => {
          const texte = CHAPITRES.map(ch =>
            `${ch.numero}. ${ch.titre}\n` +
            ch.articles.map(a => `  - ${a.titre}`).join("\n")
          ).join("\n\n");
          return chatConditionsGenerales(question, history, texte);
        }}
      />
    </div>
  );
}
