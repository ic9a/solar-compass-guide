export const SITE_URL = "https://raportsolar.ro";
export const SEO_LAST_MODIFIED = "2026-07-30";

export type EditorialSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export const EDITORIAL_CATEGORIES = [
  { id: "incepe", label: "Începe de aici", description: "Reperele de bază pentru o decizie informată." },
  { id: "dimensionare", label: "Dimensionare", description: "Putere, număr de panouri și configurații potrivite consumului." },
  { id: "costuri", label: "Costuri și amortizare", description: "Preț complet, finanțare și recuperarea investiției." },
  { id: "productie", label: "Producție și economii", description: "Estimări locale, variații lunare și transformarea kWh în economie." },
  { id: "baterii", label: "Baterii și autoconsum", description: "Stocare, consum direct și decizia cu sau fără baterie." },
  { id: "echipamente", label: "Echipamente și garanții", description: "Invertor, mentenanță, garanții și continuitatea sistemului." },
  { id: "prosumator", label: "Prosumator și finanțare", description: "Pași administrativi, surse oficiale și opțiuni de finanțare." },
  { id: "oferte", label: "Oferte și instalatori", description: "Cum verifici configurația, lucrarea și promisiunile comerciale." },
] as const;

export type EditorialSlug =
  | "ghid-panouri-fotovoltaice"
  | "dimensionare-sistem-fotovoltaic"
  | "cost-panouri-fotovoltaice"
  | "productie-panouri-fotovoltaice"
  | "baterie-pentru-panouri-fotovoltaice"
  | "invertor-fotovoltaic-ghid"
  | "cum-devii-prosumator"
  | "cum-verifici-o-oferta-fotovoltaica"
  | "autoconsum-energie-solara"
  | "finantare-panouri-fotovoltaice"
  | "mentenanta-panouri-fotovoltaice"
  | "garantii-panouri-fotovoltaice"
  | "calculator-panouri-fotovoltaice"
  | "cate-panouri-fotovoltaice-imi-trebuie"
  | "amortizare-sistem-fotovoltaic"
  | "productie-si-economii-panouri-fotovoltaice"
  | "sistem-fotovoltaic-cu-baterie-sau-fara"
  | "sistem-fotovoltaic-5-kw";

export type EditorialCategory = (typeof EDITORIAL_CATEGORIES)[number]["id"];
export type EditorialTool = "recommendation" | "solar_map" | "offer_analysis";

export type EditorialPage = {
  slug: EditorialSlug;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  summary: string;
  category: EditorialCategory;
  audience: string;
  readingMinutes: number;
  featured: boolean;
  primaryTool: EditorialTool;
  sections: EditorialSection[];
  faq: { question: string; answer: string }[];
  related: EditorialSlug[];
  sources: { label: string; url: string }[];
  primaryCta?: {
    label: string;
    destination: "/recomandare-sistem" | "/harta-solara-romania" | "/upload-oferta";
    tool: "recommendation" | "solar_map" | "offer_analysis";
  };
};

export const editorialPages: EditorialPage[] = [
  {
    slug: "ghid-panouri-fotovoltaice",
    summary: "Un traseu complet de la consum și dimensionare până la ofertă, instalare și exploatare.",
    category: "incepe",
    audience: "Proprietari aflați la începutul documentării",
    readingMinutes: 8,
    featured: true,
    primaryTool: "recommendation",
    title: "Ghid panouri fotovoltaice pentru locuințe",
    description:
      "Ghid independent despre dimensionare, producție, echipamente, ofertare și pașii de verificat înaintea unui sistem fotovoltaic.",
    eyebrow: "Ghid de pornire",
    intro:
      "Un sistem bun pornește de la consumul real al locuinței, nu de la numărul de panouri dintr-un pachet comercial. Ghidul leagă deciziile tehnice de cost, autoconsum și riscurile care trebuie clarificate în ofertă.",
    sections: [
      {
        heading: "Începe cu profilul de consum",
        paragraphs: [
          "Centralizează cel puțin 12 luni de facturi și separă consumatorii care funcționează ziua de cei folosiți seara. Două locuințe cu același consum anual pot avea rezultate economice diferite dacă una consumă energia în timp ce panourile produc.",
          "Notează schimbările probabile: pompă de căldură, mașină electrică, aer condiționat sau extinderea locuinței. Acestea sunt scenarii, nu motive pentru supradimensionare automată.",
        ],
        bullets: ["consum anual și lunar", "puteri mari simultane", "suprafață, orientare și umbrire", "tipul branșamentului"],
      },
      {
        heading: "Compară sisteme, nu doar componente",
        paragraphs: [
          "Puterea DC a panourilor, puterea AC a invertorului, protecțiile, structura, cablurile, monitorizarea și montajul formează un singur sistem. Cere modele exacte, fișe tehnice și delimitarea lucrărilor incluse.",
          "O garanție lungă nu compensează o instalare slabă. Verifică emitentul garanției, condițiile, excluderile și cine răspunde de intervenție.",
        ],
      },
      {
        heading: "Decizia economică trebuie testată",
        paragraphs: [
          "Folosește intervale pentru producție, autoconsum și prețurile energiei. Un singur termen de recuperare, prezentat fără ipoteze, ascunde incertitudinea. Compară varianta fără baterie cu una pregătită pentru baterie și cu una care o include.",
        ],
      },
    ],
    faq: [
      { question: "Care este primul document util?", answer: "Facturile pe 12 luni, din care poți reconstrui consumul sezonier." },
      { question: "Este obligatorie bateria?", answer: "Nu. Valoarea ei depinde de consumul de seară, obiectivul de backup și diferența dintre costul cumpărării și valoarea energiei injectate." },
    ],
    related: ["calculator-panouri-fotovoltaice", "cum-verifici-o-oferta-fotovoltaica", "autoconsum-energie-solara"],
    sources: [{ label: "PVGIS — instrumentul Comisiei Europene", url: "https://re.jrc.ec.europa.eu/pvg_tools/en/" }],
  },
  {
    slug: "dimensionare-sistem-fotovoltaic",
    summary: "Datele și verificările care transformă consumul unei locuințe într-o putere orientativă.",
    category: "dimensionare",
    audience: "Proprietari care compară puteri și configurații",
    readingMinutes: 6,
    featured: true,
    primaryTool: "recommendation",
    title: "Dimensionarea unui sistem fotovoltaic",
    description:
      "Cum estimezi puterea panourilor și a invertorului pornind de la consum, amplasament, autoconsum și limitele instalației.",
    eyebrow: "Dimensionare",
    intro:
      "Dimensionarea nu înseamnă împărțirea consumului anual la o producție generică. Este o comparație între cererea locuinței, resursa solară locală, geometria acoperișului și obiectivul proprietarului.",
    sections: [
      {
        heading: "Datele minime",
        paragraphs: [
          "Ai nevoie de consum lunar, localitate, orientare, înclinație, umbrire, suprafață utilă și tipul branșamentului. O fotografie sau o captură din satelit ajută, dar nu înlocuiește măsurătorile și inspecția structurii.",
        ],
        bullets: ["12 luni de consum", "intervalele de consum din timpul zilei", "obstacole și umbriri", "tablou electric și branșament"],
      },
      {
        heading: "DC, AC și limitările reale",
        paragraphs: [
          "Puterea înscrisă pe panouri este DC; invertorul livrează AC. Raportul dintre ele se alege împreună cu orientarea și clima. O diferență controlată poate fi normală, dar trebuie justificată prin simulare și limitele tehnice ale invertorului.",
          "Verifică tensiunea șirurilor la temperaturi joase, curentul pe intrări MPPT și distribuția panourilor pe orientări. Aceste verificări nu se pot deduce doar din kWp.",
        ],
      },
      {
        heading: "Testează mai multe variante",
        paragraphs: [
          "Compară minimum trei puteri apropiate folosind aceleași ipoteze. Urmărește producția, energia folosită direct, excedentul, costul total și sensibilitatea la schimbarea consumului.",
        ],
      },
    ],
    faq: [
      { question: "Mai mare înseamnă întotdeauna mai bun?", answer: "Nu. Puterea suplimentară poate produce mai ales excedent cu valoare economică mai mică." },
      { question: "Orientarea est–vest este greșită?", answer: "Nu. Poate întinde producția spre dimineață și seară și uneori se potrivește mai bine consumului." },
    ],
    related: ["productie-panouri-fotovoltaice", "invertor-fotovoltaic-ghid", "autoconsum-energie-solara"],
    sources: [{ label: "PVGIS documentation", url: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en" }],
  },
  {
    slug: "cost-panouri-fotovoltaice",
    summary: "Ce intră în prețul complet instalat și cum normalizezi două oferte înainte de comparație.",
    category: "costuri",
    audience: "Proprietari care bugetează sau compară oferte",
    readingMinutes: 5,
    featured: true,
    primaryTool: "offer_analysis",
    title: "Costul unui sistem fotovoltaic: ce intră în preț",
    description:
      "Ghid pentru compararea costurilor sistemelor fotovoltaice fără a confunda prețul echipamentelor cu prețul complet instalat.",
    eyebrow: "Cost și ofertare",
    intro:
      "Prețul pe kWp este util doar după ce ofertele au aceeași arie de lucrări. O ofertă ieftină poate exclude protecții, adaptări ale tabloului, schelă, dosare sau punerea în funcțiune.",
    sections: [
      {
        heading: "Normalizează ofertele",
        paragraphs: [
          "Construiește un tabel cu TVA, echipamente, structură, protecții DC și AC, cablare, montaj, transport, proiectare, documentație și intervenții. Marchează explicit fiecare element ca inclus, opțional sau absent.",
        ],
      },
      {
        heading: "Cost total, nu doar achiziție",
        paragraphs: [
          "Include mentenanța, eventualele înlocuiri, abonamentele de monitorizare și costurile financiare. Pentru baterie, compară energia utilă, puterea, ciclurile garantate și condițiile de funcționare, nu doar capacitatea nominală.",
        ],
        bullets: ["preț final cu TVA", "termen și condiții de plată", "costuri condiționate de șantier", "garanții și service local"],
      },
      {
        heading: "Evită falsa precizie",
        paragraphs: [
          "Prețurile comerciale se schimbă. Folosește intervale datate și oferte comparabile, nu o medie națională fără sursă. RaportSolar nu vinde și nu intermediază instalația analizată.",
        ],
      },
    ],
    faq: [
      { question: "Este suficient prețul pe kWp?", answer: "Nu. Este relevant numai între oferte cu aceeași configurație și același domeniu de lucrări." },
      { question: "Avansul mare este un semnal de risc?", answer: "Poate fi. Corelează plățile cu livrabile verificabile și citește condițiile de restituire." },
    ],
    related: ["cum-verifici-o-oferta-fotovoltaica", "finantare-panouri-fotovoltaice", "baterie-pentru-panouri-fotovoltaice"],
    sources: [{ label: "ANPC — informații pentru consumatori", url: "https://anpc.ro/" }],
  },
  {
    slug: "productie-panouri-fotovoltaice",
    summary: "Cum influențează localitatea, acoperișul și pierderile producția lunară și anuală.",
    category: "productie",
    audience: "Proprietari care vor o estimare realistă",
    readingMinutes: 5,
    featured: false,
    primaryTool: "solar_map",
    title: "Producția panourilor fotovoltaice în România",
    description:
      "Cum se estimează producția solară și de ce localitatea, orientarea, umbrirea, pierderile și vremea schimbă rezultatul.",
    eyebrow: "Producție",
    intro:
      "O estimare credibilă arată sursa datelor, geometria sistemului și pierderile folosite. Producția reală variază de la un an la altul și nu trebuie prezentată ca o promisiune.",
    sections: [
      {
        heading: "Factorii principali",
        paragraphs: [
          "Localitatea definește resursa solară, iar orientarea și înclinația schimbă energia captată. Temperatura, murdăria, cablurile, invertorul, nepotrivirile dintre module și disponibilitatea sistemului introduc pierderi.",
        ],
        bullets: ["iradiere locală", "orientare și înclinație", "umbrire apropiată și îndepărtată", "pierderi tehnice"],
      },
      {
        heading: "Cum citești o simulare",
        paragraphs: [
          "Caută producția lunară, nu doar totalul anual. Verifică versiunea sursei, puterea instalată, pierderea de sistem și dacă simularea folosește orizontul local. Păstrează un interval de incertitudine pentru vreme și indisponibilitate.",
        ],
      },
      {
        heading: "Producție nu înseamnă economie",
        paragraphs: [
          "Economia depinde de câtă energie folosești direct, cât injectezi și condițiile contractuale aplicabile. Separă kWh produși de lei economisiți în orice comparație.",
        ],
      },
    ],
    faq: [
      { question: "De ce diferă doi ani?", answer: "Vremea și temperatura variază; o simulare climatică reprezintă o medie, nu fiecare an." },
      { question: "Harta solară înlocuiește proiectul?", answer: "Nu. Ea este orientativă și nu surprinde toate umbrele sau limitele clădirii." },
    ],
    related: ["productie-si-economii-panouri-fotovoltaice", "dimensionare-sistem-fotovoltaic", "mentenanta-panouri-fotovoltaice"],
    sources: [{ label: "PVGIS", url: "https://re.jrc.ec.europa.eu/pvg_tools/en/" }],
  },
  {
    slug: "baterie-pentru-panouri-fotovoltaice",
    summary: "Capacitate utilă, putere, backup și criterii economice pentru alegerea unei baterii.",
    category: "baterii",
    audience: "Proprietari care analizează stocarea",
    readingMinutes: 6,
    featured: false,
    primaryTool: "recommendation",
    title: "Baterie pentru panouri fotovoltaice: când merită",
    description:
      "Cum compari capacitatea utilă, puterea, backup-ul, ciclurile și economia unei baterii pentru un sistem fotovoltaic rezidențial.",
    eyebrow: "Stocare",
    intro:
      "Bateria mută energie între ore; nu produce energie. Valoarea ei depinde de excedentul din timpul zilei, consumul de seară, tarife, obiectivul de rezervă și pierderile sistemului.",
    sections: [
      {
        heading: "Separă două obiective",
        paragraphs: [
          "Creșterea autoconsumului și alimentarea la întreruperi sunt obiective diferite. Backup-ul cere echipamente compatibile, circuite prioritare și o putere suficientă; o baterie prezentă în ofertă nu garantează automat funcționarea la căderea rețelei.",
        ],
      },
      {
        heading: "Capacitate utilă și putere",
        paragraphs: [
          "Compară kWh utili, kW de încărcare și descărcare, randamentul, adâncimea de descărcare și condițiile garanției. Dimensionează pe profilul orar, nu pe consumul anual.",
        ],
        bullets: ["energie utilă", "putere continuă și de vârf", "funcționare la temperatură", "cicluri și energie garantată"],
      },
      {
        heading: "Calculează varianta fără baterie",
        paragraphs: [
          "O comparație onestă include sistemul fotovoltaic simplu, configurația pregătită pentru stocare și bateria instalată acum. Astfel vezi costul flexibilității și nu atribui bateriei economiile create de panouri.",
        ],
      },
    ],
    faq: [
      { question: "Bateria asigură automat backup?", answer: "Nu. Sunt necesare funcția dedicată, comutarea și circuitele configurate pentru rezervă." },
      { question: "Se dimensionează după kWp?", answer: "Doar orientativ. Profilul de excedent și consumul de seară sunt decisive." },
    ],
    related: ["autoconsum-energie-solara", "invertor-fotovoltaic-ghid", "cost-panouri-fotovoltaice"],
    sources: [{ label: "European Commission — energy storage", url: "https://energy.ec.europa.eu/topics/research-and-technology/energy-storage_en" }],
  },
  {
    slug: "invertor-fotovoltaic-ghid",
    summary: "Compatibilitate electrică, MPPT, monitorizare, backup, garanție și service pentru invertor.",
    category: "echipamente",
    audience: "Proprietari care verifică echipamentele",
    readingMinutes: 5,
    featured: false,
    primaryTool: "offer_analysis",
    title: "Ghid pentru alegerea invertorului fotovoltaic",
    description:
      "Ce verifici la un invertor: putere, MPPT, tensiuni, compatibilitate, monitorizare, zgomot, garanție și opțiuni de baterie.",
    eyebrow: "Echipamente",
    intro:
      "Invertorul trebuie verificat împreună cu șirurile de panouri, branșamentul și obiectivele sistemului. Marca singură nu confirmă o configurație corectă.",
    sections: [
      {
        heading: "Compatibilitatea electrică",
        paragraphs: [
          "Proiectantul trebuie să verifice tensiunea maximă la rece, fereastra MPPT, curentul pe intrare și puterea admisă. Orientările diferite cer de regulă urmărire separată sau o soluție echivalentă justificată.",
        ],
      },
      {
        heading: "Monofazat, trifazat și backup",
        paragraphs: [
          "Alegerea depinde de branșament, putere și cerințele operatorului. Pentru backup, cere schema de funcționare: ce circuite rămân alimentate, la ce putere și în ce condiții.",
        ],
        bullets: ["număr de MPPT", "limite DC", "putere AC", "protecție și decuplare", "actualizări și monitorizare"],
      },
      {
        heading: "Service și continuitate",
        paragraphs: [
          "Citește garanția, timpul estimat de înlocuire și cine gestionează dosarul. Accesul la date și exportul istoricului reduc dependența de o singură aplicație.",
        ],
      },
    ],
    faq: [
      { question: "Un invertor mai mare produce mai mult?", answer: "Nu în mod automat; producția depinde de generatorul DC și de profilul de funcționare." },
      { question: "Microinvertoarele sunt mereu mai bune?", answer: "Nu. Pot ajuta în anumite geometrii, dar costul, mentenanța și accesul trebuie comparate." },
    ],
    related: ["dimensionare-sistem-fotovoltaic", "baterie-pentru-panouri-fotovoltaice", "mentenanta-panouri-fotovoltaice"],
    sources: [{ label: "IEC — renewable energy standards overview", url: "https://www.iec.ch/renewables/solar-power" }],
  },
  {
    slug: "cum-devii-prosumator",
    summary: "O hartă orientativă a pașilor și responsabilităților, cu verificare în surse oficiale actuale.",
    category: "prosumator",
    audience: "Viitori prosumatori înainte de racordare",
    readingMinutes: 5,
    featured: false,
    primaryTool: "recommendation",
    title: "Cum devii prosumator în România",
    description:
      "Hartă orientativă a pașilor pentru racordare și statutul de prosumator, cu trimiteri către sursele oficiale care trebuie verificate.",
    eyebrow: "Proces administrativ",
    intro:
      "Procedurile și regulile se pot modifica. Folosește această pagină ca listă de verificare și confirmă versiunea curentă la ANRE, operatorul de distribuție și furnizor înainte de a lua o decizie.",
    sections: [
      {
        heading: "Înainte de instalare",
        paragraphs: [
          "Clarifică soluția de racordare, puterea aprobată și documentele cerute. Instalatorul trebuie să explice cine depune fiecare document și ce activități sunt incluse în contract.",
        ],
      },
      {
        heading: "Documente și responsabilități",
        paragraphs: [
          "Păstrează contractul, facturile, declarațiile de conformitate, schemele, procesele-verbale, certificatele și corespondența. Cere confirmare scrisă pentru termene și pentru orice cost suplimentar.",
        ],
        bullets: ["operator de distribuție", "furnizor", "instalator autorizat", "proprietarul instalației"],
      },
      {
        heading: "Verifică sursa și data",
        paragraphs: [
          "Nu trata un articol comercial drept procedură oficială. Pagina ANRE dedicată prosumatorilor și operatorul relevant sunt punctele de control pentru formulare și cerințe actuale.",
        ],
      },
    ],
    faq: [
      { question: "RaportSolar depune dosarul?", answer: "Nu. Serviciul este independent și nu acționează ca instalator, furnizor sau operator." },
      { question: "Pașii sunt identici peste tot?", answer: "Cadrul este comun, dar fluxurile și canalele operatorilor pot diferi." },
    ],
    related: ["cum-verifici-o-oferta-fotovoltaica", "ghid-panouri-fotovoltaice", "finantare-panouri-fotovoltaice"],
    sources: [{ label: "ANRE — Cum devin prosumator", url: "https://anre.ro/consumatori/energie-electrica/cum-devin-prosumator/" }],
  },
  {
    slug: "cum-verifici-o-oferta-fotovoltaica",
    summary: "Un checklist practic pentru configurație, lucrări, preț, garanții și afirmații economice.",
    category: "oferte",
    audience: "Proprietari care au primit deja o ofertă",
    readingMinutes: 6,
    featured: true,
    primaryTool: "offer_analysis",
    title: "Cum verifici o ofertă fotovoltaică înainte să semnezi",
    description:
      "Checklist independent pentru echipamente, proiectare, montaj, garanții, preț, producție estimată și clauze contractuale.",
    eyebrow: "Verificarea ofertei",
    intro:
      "O ofertă poate arăta complet și totuși să lase neclare modele, cantități, lucrări sau condiții. Transformă promisiunile în câmpuri comparabile și întrebări scrise.",
    sections: [
      {
        heading: "Identifică exact configurația",
        paragraphs: [
          "Cere producător, model, număr de bucăți, puteri, fișe tehnice și schema orientativă. Formulări precum «sau echivalent» trebuie să definească parametrii minimi și mecanismul de acceptare.",
        ],
      },
      {
        heading: "Delimitează lucrarea",
        paragraphs: [
          "Verifică structura, etanșarea, traseele, protecțiile, priza de pământ, adaptarea tabloului, accesul, schela, documentația și punerea în funcțiune. Notează ce situații pot schimba prețul.",
        ],
        bullets: ["preț final și TVA", "calendar și livrabile", "recepție și teste", "garanții separate", "service și răspundere"],
      },
      {
        heading: "Testează afirmațiile economice",
        paragraphs: [
          "Estimarea trebuie să arate localitatea, orientarea, pierderile, autoconsumul și ipotezele de preț. Solicită producția lunară și un scenariu conservator.",
        ],
      },
    ],
    faq: [
      { question: "Pot compara două PDF-uri direct?", answer: "Da, după normalizarea domeniului de lucrări și a configurației, nu doar a totalului." },
      { question: "Analiza înlocuiește proiectarea?", answer: "Nu. Ea semnalează întrebări și diferențe; proiectantul și instalatorul răspund de soluția tehnică." },
    ],
    related: ["cost-panouri-fotovoltaice", "dimensionare-sistem-fotovoltaic", "garantii-panouri-fotovoltaice"],
    sources: [{ label: "ANPC", url: "https://anpc.ro/" }],
  },
  {
    slug: "autoconsum-energie-solara",
    summary: "Diferența dintre autoconsum și autosuficiență și efectul profilului zilnic asupra economiei.",
    category: "baterii",
    audience: "Proprietari care vor să folosească mai mult energia produsă",
    readingMinutes: 5,
    featured: false,
    primaryTool: "recommendation",
    title: "Autoconsumul energiei solare explicat",
    description:
      "Ce este autoconsumul, cum diferă de autosuficiență și cum îl influențează profilul de consum, puterea sistemului și bateria.",
    eyebrow: "Consum și economie",
    intro:
      "Autoconsumul este partea din producția fotovoltaică folosită direct în locuință. Autosuficiența este partea din consum acoperită de sistem. Procentele răspund la întrebări diferite.",
    sections: [
      {
        heading: "Două rapoarte diferite",
        paragraphs: [
          "Un sistem mic poate avea autoconsum ridicat fiindcă aproape toată producția este folosită, dar poate acoperi puțin din consum. Un sistem mare poate crește acoperirea și, simultan, procentul injectat.",
        ],
      },
      {
        heading: "Măsuri fără baterie",
        paragraphs: [
          "Mutarea programabilă a boilerului, pompei, mașinii de spălat sau încărcării auto către orele de producție poate crește utilizarea directă. Automatizarea trebuie să respecte confortul și limitele instalației.",
        ],
        bullets: ["măsoară înainte", "mută sarcini flexibile", "evită suprapunerea vârfurilor", "compară lunar"],
      },
      {
        heading: "Folosește serii orare",
        paragraphs: [
          "Mediile anuale ascund nepotrivirea dintre soare și consum. Pentru baterie sau pompe de căldură, o simulare orară este mai informativă decât un procent generic.",
        ],
      },
    ],
    faq: [
      { question: "Autoconsumul de 100% este ținta corectă?", answer: "Nu neapărat; poate indica un sistem prea mic. Optimizează obiectivul total și costul." },
      { question: "Bateria crește producția?", answer: "Nu. Ea poate crește partea utilizată local, cu pierderi de conversie și stocare." },
    ],
    related: ["baterie-pentru-panouri-fotovoltaice", "dimensionare-sistem-fotovoltaic", "productie-panouri-fotovoltaice"],
    sources: [{ label: "JRC — PVGIS", url: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en" }],
  },
  {
    slug: "finantare-panouri-fotovoltaice",
    summary: "Cum compari plata directă, creditul și programele publice fără a ascunde costul total.",
    category: "prosumator",
    audience: "Proprietari care aleg o metodă de finanțare",
    readingMinutes: 5,
    featured: false,
    primaryTool: "offer_analysis",
    title: "Finanțarea panourilor fotovoltaice",
    description:
      "Cum compari plata integrală, creditul și programele de sprijin fără a ascunde dobânda, condițiile și riscul de calendar.",
    eyebrow: "Finanțare",
    intro:
      "Finanțarea schimbă fluxul de numerar, nu performanța tehnică. Compară costul total și condițiile folosind aceeași configurație și aceleași ipoteze de producție. Păstrează și o rezervă pentru costuri neprevăzute, intervenții și diferențe de calendar.",
    sections: [
      {
        heading: "Construiește trei scenarii",
        paragraphs: [
          "Compară plata integrală, finanțarea comercială și un program de sprijin disponibil. Include avans, dobândă, comisioane, asigurări, contribuție proprie și momentul fiecărei plăți.",
        ],
      },
      {
        heading: "Separă eligibilitatea de contract",
        paragraphs: [
          "Nu semna presupunând că finanțarea va fi aprobată. Citește condițiile de retragere, substituirea echipamentelor, termenele și cine suportă diferențele neeligibile.",
        ],
        bullets: ["cost total plătibil", "rata și durata", "condiții suspensive", "riscul întârzierii", "proprietatea echipamentelor"],
      },
      {
        heading: "Actualizează datele",
        paragraphs: [
          "Programele și ofertele financiare sunt temporale. Confirmă informația în sursa oficială și păstrează data consultării; această pagină nu este consultanță financiară.",
        ],
      },
    ],
    faq: [
      { question: "Subvenția face orice ofertă avantajoasă?", answer: "Nu. Calitatea, diferența plătită, obligațiile și costurile ulterioare rămân relevante." },
      { question: "Termenul de recuperare include dobânda?", answer: "Numai dacă modelul o introduce explicit. Cere fluxurile folosite în calcul." },
    ],
    related: ["cost-panouri-fotovoltaice", "cum-verifici-o-oferta-fotovoltaica", "ghid-panouri-fotovoltaice"],
    sources: [{ label: "AFM — programe de finanțare", url: "https://www.afm.ro/" }],
  },
  {
    slug: "mentenanta-panouri-fotovoltaice",
    summary: "Monitorizare, inspecții, curățare și semnale care justifică intervenția unui specialist.",
    category: "echipamente",
    audience: "Proprietari care operează sau evaluează un sistem",
    readingMinutes: 5,
    featured: false,
    primaryTool: "offer_analysis",
    title: "Mentenanța sistemelor fotovoltaice",
    description:
      "Plan practic pentru monitorizare, inspecții, curățare, siguranță, documente și diagnosticarea scăderilor de producție.",
    eyebrow: "Operare",
    intro:
      "Mentenanța începe cu monitorizarea și siguranța. Nu presupune curățare frecventă în orice amplasament și nu implică intervenții DIY pe circuite DC. Un jurnal simplu al producției, alertelor și intervențiilor face comparațiile ulterioare mai utile.",
    sections: [
      {
        heading: "Stabilește o referință",
        paragraphs: [
          "Păstrează producția estimată lunar, schema, fotografiile instalației, seriile și procesele-verbale. Monitorizarea comparată cu vremea și cu aceeași lună din anii anteriori poate evidenția abateri.",
        ],
      },
      {
        heading: "Inspecții și curățare",
        paragraphs: [
          "Verificarea vizuală urmărește cabluri, fixări, infiltrații, vegetație și alerte. Curățarea depinde de depuneri, pantă și ploaie; trebuie făcută fără risc de cădere sau deteriorare.",
        ],
        bullets: ["alarme invertor", "producție lunară", "umbre noi", "integritatea structurii", "documentarea intervențiilor"],
      },
      {
        heading: "Când chemi un specialist",
        paragraphs: [
          "O scădere persistentă, încălzirea anormală, mirosul, zgomotul electric, deteriorarea sau declanșările repetate cer oprirea sigură conform instrucțiunilor și intervenție calificată.",
        ],
      },
    ],
    faq: [
      { question: "Panourile trebuie spălate anual?", answer: "Nu există o regulă universală; decide pe baza depunerilor, siguranței și pierderii observate." },
      { question: "Monitorizarea înlocuiește inspecția?", answer: "Nu. Ea arată comportamentul energetic, nu toate problemele mecanice sau electrice." },
    ],
    related: ["productie-panouri-fotovoltaice", "garantii-panouri-fotovoltaice", "invertor-fotovoltaic-ghid"],
    sources: [{ label: "IEC — solar power", url: "https://www.iec.ch/renewables/solar-power" }],
  },
  {
    slug: "garantii-panouri-fotovoltaice",
    summary: "Cum separi garanțiile produselor, performanței și montajului și ce dovezi păstrezi.",
    category: "echipamente",
    audience: "Proprietari care verifică riscul contractual",
    readingMinutes: 5,
    featured: false,
    primaryTool: "offer_analysis",
    title: "Garanțiile pentru panouri și sisteme fotovoltaice",
    description:
      "Cum citești garanția de produs, performanță, montaj, invertor și baterie și ce dovezi păstrezi pentru o reclamație.",
    eyebrow: "Garanții",
    intro:
      "Un sistem are mai multe garanții, emise de entități diferite. Durata mare dintr-un material comercial nu spune singură cine intervine, ce este acoperit sau cât costă remedierea.",
    sections: [
      {
        heading: "Separă garanțiile",
        paragraphs: [
          "Modulele pot avea garanție de produs și garanție de performanță; invertorul, bateria, structura și montajul au condiții proprii. Cere documentele înainte de semnare.",
        ],
      },
      {
        heading: "Citește mecanismul de remediere",
        paragraphs: [
          "Verifică emitentul, transferabilitatea, înregistrarea, excluderile, transportul, manopera și metoda prin care se dovedește defectul sau degradarea.",
        ],
        bullets: ["factură și serie", "proces-verbal", "fișe și certificate", "fotografii și schema", "istoric de monitorizare"],
      },
      {
        heading: "Garanția nu înlocuiește contractul",
        paragraphs: [
          "Contractul cu instalatorul trebuie să descrie recepția, termenele, răspunderea pentru acoperiș și instalația electrică și procesul de service. Păstrează toate promisiunile importante în scris.",
        ],
      },
    ],
    faq: [
      { question: "Garanția de performanță înseamnă producție anuală garantată?", answer: "De regulă, nu; se referă la caracteristicile modulului în condițiile documentului." },
      { question: "Cine plătește demontarea?", answer: "Depinde de condiții. Verifică explicit manopera, accesul și transportul." },
    ],
    related: ["cum-verifici-o-oferta-fotovoltaica", "mentenanta-panouri-fotovoltaice", "cost-panouri-fotovoltaice"],
    sources: [{ label: "ANPC", url: "https://anpc.ro/" }],
  },
  {
    slug: "calculator-panouri-fotovoltaice",
    summary: "Datele necesare și modul corect de interpretare a unei recomandări fotovoltaice orientative.",
    category: "incepe",
    audience: "Proprietari care vor un prim scenariu personalizat",
    readingMinutes: 5,
    featured: true,
    primaryTool: "recommendation",
    title: "Calculator panouri fotovoltaice: estimare orientativă",
    description:
      "Pregătește datele corecte pentru un calcul fotovoltaic: consum, localitate, acoperiș, autoconsum și schimbări viitoare ale locuinței.",
    eyebrow: "Calculator fotovoltaic",
    intro:
      "Un calculator util nu promite o putere perfectă dintr-o singură factură. El transformă consumul și constrângerile locuinței în variante orientative, apoi arată ipotezele care trebuie verificate de un proiectant și într-o ofertă.",
    sections: [
      {
        heading: "Ce date introduci",
        paragraphs: [
          "Folosește consumul din ultimele 12 luni, nu doar valoarea în lei a unei facturi. Adaugă localitatea, orientarea și înclinația acoperișului, suprafața disponibilă, umbrele observate și tipul branșamentului. Dacă nu cunoști o valoare, marcheaz-o ca ipoteză în loc să inventezi precizie.",
          "Separă consumul de zi de cel de seară când ai această informație. Autoconsumul influențează economia, iar două case cu același consum anual pot avea recomandări diferite.",
        ],
        bullets: ["consum lunar sau anual în kWh", "localitate și geometria acoperișului", "consumatori mari planificați", "interes pentru baterie ori backup"],
      },
      {
        heading: "Cum citești rezultatul",
        paragraphs: [
          "Privește recomandarea ca interval și compară scenariile apropiate. Verifică puterea DC, ipoteza de producție, energia folosită direct și excedentul. Rezultatul nu este proiect tehnic, ofertă comercială sau garanție de producție.",
          "O putere mai mare nu este automat mai rentabilă. Spațiul, limitele electrice și profilul de consum pot face ca o variantă mai mică să folosească mai eficient energia produsă.",
        ],
      },
      {
        heading: "Ce verifici înainte de decizie",
        paragraphs: [
          "Confruntă estimarea cu o simulare locală, o inspecție a acoperișului și minimum două oferte normalizate. Modelele exacte de panou și invertor, protecțiile, structura și documentația trebuie definite separat.",
        ],
      },
    ],
    faq: [
      { question: "Calculatorul oferă un proiect final?", answer: "Nu. Oferă o orientare transparentă; proiectarea cere măsurători, verificări electrice și responsabilitate profesională." },
      { question: "Pot calcula dintr-o singură factură?", answer: "Poți obține un reper slab, dar 12 luni surprind sezonalitatea și reduc riscul unei extrapolări greșite." },
    ],
    related: ["cate-panouri-fotovoltaice-imi-trebuie", "dimensionare-sistem-fotovoltaic", "productie-si-economii-panouri-fotovoltaice"],
    sources: [{ label: "PVGIS — Comisia Europeană", url: "https://re.jrc.ec.europa.eu/pvg_tools/en/tools.html" }],
    primaryCta: { label: "Calculează o recomandare", destination: "/recomandare-sistem", tool: "recommendation" },
  },
  {
    slug: "cate-panouri-fotovoltaice-imi-trebuie",
    summary: "Transformă puterea orientativă în module, ținând cont de model, șiruri și acoperiș.",
    category: "dimensionare",
    audience: "Proprietari care estimează numărul de module",
    readingMinutes: 5,
    featured: true,
    primaryTool: "recommendation",
    title: "Câte panouri fotovoltaice îmi trebuie?",
    description:
      "Află cum transformi consumul și puterea modulelor într-un număr orientativ de panouri, fără a ignora acoperișul și autoconsumul.",
    eyebrow: "Număr de panouri",
    intro:
      "Numărul de panouri este rezultatul unei dimensionări, nu punctul ei de pornire. Mai întâi estimezi puterea utilă pentru locuință, apoi o raportezi la puterea modulului ales și verifici dacă dispunerea este posibilă.",
    sections: [
      {
        heading: "Pornește de la energie, nu de la bucăți",
        paragraphs: [
          "Adună consumul pe 12 luni și observă lunile extreme. Estimează producția locală pentru orientarea și înclinația reale, apoi testează mai multe puteri instalate. Nu folosi o producție națională unică: clima, geometria și pierderile diferă.",
          "Puterea unui panou este exprimată în condiții standard. Producția anuală a întregului sistem nu se obține înmulțind simplu acea putere cu orele de lumină.",
        ],
      },
      {
        heading: "Transformă puterea în module",
        paragraphs: [
          "După alegerea unei puteri DC orientative, împarte-o la puterea nominală a modelului de panou și rotunjește numai după ce verifici șirurile invertorului. Modelele cu puteri diferite conduc la numere diferite pentru același kWp.",
          "Dispunerea trebuie să păstreze zonele de acces și distanțele necesare, să evite umbrele și să respecte structura acoperișului. Suprafața dintr-o fotografie nu este o măsurătoare suficientă.",
        ],
        bullets: ["dimensiunea exactă a modulului", "tensiunea și curentul șirurilor", "ferestre, coșuri și margini", "sarcina și sistemul de prindere"],
      },
      {
        heading: "Verifică efectul asupra autoconsumului",
        paragraphs: [
          "Panourile suplimentare pot crește mai ales excedentul de la prânz. Compară energia consumată direct și injectată pentru două sau trei variante, inclusiv dacă planifici pompă de căldură sau vehicul electric.",
        ],
      },
    ],
    faq: [
      { question: "Există un număr standard pentru o casă?", answer: "Nu. Consumul, modulul, amplasamentul, acoperișul și limitele electrice schimbă rezultatul." },
      { question: "Panouri mai puternice înseamnă mereu mai puține?", answer: "De obicei reduc numărul pentru același kWp, dar dimensiunea, compatibilitatea electrică și dispunerea pot schimba alegerea." },
    ],
    related: ["calculator-panouri-fotovoltaice", "sistem-fotovoltaic-5-kw", "dimensionare-sistem-fotovoltaic"],
    sources: [{ label: "PVGIS — documentație", url: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en" }],
    primaryCta: { label: "Estimează pentru locuința ta", destination: "/recomandare-sistem", tool: "recommendation" },
  },
  {
    slug: "amortizare-sistem-fotovoltaic",
    summary: "O metodă cu scenarii pentru cost, producție, autoconsum, tarife și recuperarea investiției.",
    category: "costuri",
    audience: "Proprietari care evaluează rentabilitatea",
    readingMinutes: 6,
    featured: true,
    primaryTool: "recommendation",
    title: "Amortizarea unui sistem fotovoltaic, fără promisiuni",
    description:
      "Calculează orientativ recuperarea investiției folosind costul complet, producția, autoconsumul, tarifele și scenarii explicite.",
    eyebrow: "Recuperarea investiției",
    intro:
      "Perioada de recuperare nu este o constantă a unui sistem de panouri. Ea rezultă din costul complet și fluxurile de numerar estimate, iar răspunsul se schimbă cu producția, autoconsumul, tarifele, mentenanța și finanțarea.",
    sections: [
      {
        heading: "Construiește baza de calcul",
        paragraphs: [
          "Pornește de la prețul final cu TVA și toate lucrările necesare. Scade doar finanțări confirmate și include costurile previzibile: finanțare, monitorizare, mentenanță sau înlocuiri care nu sunt acoperite.",
          "Separă energia folosită direct de energia injectată. Valoarea unui kWh autoconsumat și tratamentul unui kWh livrat în rețea nu trebuie presupuse egale; verifică factura și condițiile contractuale actuale.",
        ],
        bullets: ["investiție netă documentată", "producție anuală în interval", "rată de autoconsum", "tarife datate", "costuri pe durata analizată"],
      },
      {
        heading: "Testează trei scenarii",
        paragraphs: [
          "Folosește un scenariu conservator, unul central și unul favorabil. Schimbă producția, autoconsumul, indisponibilitatea și tarifele separat, astfel încât să vezi ce ipoteză controlează rezultatul.",
          "Recuperarea simplă este ușor de înțeles, dar nu surprinde valoarea în timp a banilor. Pentru decizii mari, compară și fluxurile actualizate și explică rata folosită.",
        ],
      },
      {
        heading: "Evită concluziile false",
        paragraphs: [
          "Nu extrapola un an neobișnuit și nu trata degradarea, vremea sau schimbarea consumului ca valori certe. Un calculator independent trebuie să afișeze ipotezele și să permită revizuirea lor, nu să garanteze economii.",
        ],
      },
    ],
    faq: [
      { question: "În câți ani se amortizează?", answer: "Nu există un termen universal. Este nevoie de costul și profilul energetic al cazului, plus scenarii pentru variabilele incerte." },
      { question: "Bateria scurtează mereu amortizarea?", answer: "Nu. Poate crește autoconsumul, dar adaugă cost, pierderi și limite; compară separat varianta fără baterie." },
    ],
    related: ["productie-si-economii-panouri-fotovoltaice", "autoconsum-energie-solara", "cost-panouri-fotovoltaice"],
    sources: [{ label: "ANRE — informații pentru prosumatori", url: "https://anre.ro/consumatori/energie-electrica/cum-devin-prosumator/" }],
    primaryCta: { label: "Construiește scenariul tău", destination: "/recomandare-sistem", tool: "recommendation" },
  },
  {
    slug: "productie-si-economii-panouri-fotovoltaice",
    summary: "Separă estimarea în kWh de economia financiară și face explicite ipotezele importante.",
    category: "productie",
    audience: "Proprietari care compară producția cu factura",
    readingMinutes: 5,
    featured: true,
    primaryTool: "solar_map",
    title: "Producție și economii pentru panouri fotovoltaice",
    description:
      "Separă producția estimată de economia financiară și verifică localitatea, pierderile, autoconsumul și ipotezele tarifare.",
    eyebrow: "Producție și economie",
    intro:
      "Producția se exprimă în kWh; economia se exprimă în bani și depinde de felul în care energia este folosită. Legarea lor într-o singură promisiune ascunde ipoteze importante despre autoconsum și contract.",
    sections: [
      {
        heading: "Estimează mai întâi energia",
        paragraphs: [
          "Alege localitatea, puterea instalată, orientarea, înclinația și pierderile. O sursă precum PVGIS oferă o bază climatică transparentă, dar nu vede toate umbrele apropiate, starea acoperișului sau opririle instalației.",
          "Analizează distribuția lunară. Totalul anual poate masca un excedent mare vara și un deficit iarna, exact când consumul unei pompe de căldură poate crește.",
        ],
        bullets: ["producție lunară și anuală", "interval pentru variația meteo", "pierderi explicite", "umbrire verificată la fața locului"],
      },
      {
        heading: "Transformă kWh în economie",
        paragraphs: [
          "Împarte producția între consum direct și injecție. Aplică fiecărei componente valoarea relevantă din condițiile actuale și datează ipoteza. Nu presupune că fiecare kWh produs reduce factura cu prețul integral de consum.",
          "Dacă profilul orar nu este disponibil, folosește un interval de autoconsum și arată sensibilitatea. Mutarea controlată a unor consumuri în orele solare poate schimba rezultatul fără panouri suplimentare.",
        ],
      },
      {
        heading: "Compară estimarea cu realitatea",
        paragraphs: [
          "După instalare, urmărește lunar producția invertorului și datele contorului. Compară perioade similare, notează opririle și investighează abaterile persistente, fără a interpreta o singură lună drept defect.",
        ],
      },
    ],
    faq: [
      { question: "Producția estimată este garantată?", answer: "Nu. Este o estimare climatică și tehnică; vremea, umbrele, pierderile și disponibilitatea produc variații." },
      { question: "Toată producția devine economie?", answer: "Nu. Valoarea depinde de energia consumată direct și de condițiile aplicabile energiei injectate." },
    ],
    related: ["autoconsum-energie-solara", "amortizare-sistem-fotovoltaic", "productie-panouri-fotovoltaice"],
    sources: [{ label: "PVGIS — instrumentul Comisiei Europene", url: "https://re.jrc.ec.europa.eu/pvg_tools/en/tools.html" }],
    primaryCta: { label: "Explorează producția locală", destination: "/harta-solara-romania", tool: "solar_map" },
  },
  {
    slug: "sistem-fotovoltaic-cu-baterie-sau-fara",
    summary: "Compară sistemul simplu, varianta pregătită pentru stocare și soluția cu baterie.",
    category: "baterii",
    audience: "Proprietari care decid dacă includ stocare",
    readingMinutes: 6,
    featured: true,
    primaryTool: "recommendation",
    title: "Sistem fotovoltaic cu baterie sau fără?",
    description:
      "Compară corect sistemul fără baterie, varianta pregătită pentru stocare și soluția cu baterie după consum, backup și cost.",
    eyebrow: "Decizie de stocare",
    intro:
      "Bateria poate muta excedentul solar spre seară și poate oferi anumite funcții de rezervă, dar nu este o condiție pentru a instala panouri. Alegerea bună pornește de la obiectiv și profilul orar, nu de la un pachet standard.",
    sections: [
      {
        heading: "Definește motivul",
        paragraphs: [
          "Dacă obiectivul este economia, măsoară excedentul de zi și consumul de seară. Dacă obiectivul este backup-ul, listează circuitele esențiale, puterea simultană și durata dorită. Aceste două probleme duc la dimensiuni și echipamente diferite.",
          "Un invertor hibrid sau o baterie instalată nu garantează alimentarea la întreruperea rețelei. Sunt necesare funcția, comutarea, schema și circuitele compatibile.",
        ],
      },
      {
        heading: "Compară trei configurații",
        paragraphs: [
          "Pune alături un sistem simplu, unul pregătit tehnic pentru stocare și unul cu baterie. Folosește aceeași putere a panourilor și aceleași tarife pentru a nu atribui bateriei beneficii produse de alte diferențe.",
          "Pentru baterie verifică energia utilă, puterea continuă și de vârf, randamentul, condițiile de temperatură, garanția în cicluri sau energie și costul intervenției.",
        ],
        bullets: ["cost incremental complet", "kWh mutați într-un an", "pierderi de conversie", "valoarea backup-ului", "compatibilitate și service"],
      },
      {
        heading: "Păstrează opțiunile deschise",
        paragraphs: [
          "Pregătirea pentru o baterie viitoare poate avea valoare, dar cere o definiție concretă. Compatibilitatea promisă trebuie documentată pentru modele, tensiuni, comunicație și garanție; termenul «battery-ready» singur nu este suficient.",
        ],
      },
    ],
    faq: [
      { question: "Merită bateria pentru orice prosumator?", answer: "Nu. Depinde de excedent, consumul de seară, tarife, cost și valoarea personală a backup-ului." },
      { question: "Pot adăuga bateria mai târziu?", answer: "Adesea da, dar compatibilitatea și modificările necesare trebuie verificate pentru configurația exactă." },
    ],
    related: ["baterie-pentru-panouri-fotovoltaice", "autoconsum-energie-solara", "amortizare-sistem-fotovoltaic"],
    sources: [{ label: "Comisia Europeană — stocarea energiei", url: "https://energy.ec.europa.eu/topics/research-and-technology/energy-storage_en" }],
    primaryCta: { label: "Compară variantele pentru casa ta", destination: "/recomandare-sistem", tool: "recommendation" },
  },
  {
    slug: "sistem-fotovoltaic-5-kw",
    summary: "Ce înseamnă 5 kW DC și AC, cum estimezi producția și când poate fi o mărime potrivită.",
    category: "dimensionare",
    audience: "Proprietari care evaluează un pachet de 5 kW",
    readingMinutes: 5,
    featured: false,
    primaryTool: "recommendation",
    title: "Sistem fotovoltaic de 5 kW: ce trebuie verificat",
    description:
      "Înțelege ce descrie un sistem de 5 kW, ce producție poate fi estimată și când această mărime se potrivește unei locuințe.",
    eyebrow: "Configurație de 5 kW",
    intro:
      "Eticheta «5 kW» nu descrie singură un sistem complet. Poate desemna puterea panourilor, puterea invertorului sau un pachet comercial, iar producția și potrivirea depind de configurația exactă și de locuință.",
    sections: [
      {
        heading: "Clarifică DC și AC",
        paragraphs: [
          "Cere separat puterea totală nominală a modulelor în kWp și puterea AC a invertorului în kW. Raportul dintre ele poate fi justificat de orientare și climă, dar trebuie verificat cu limitele de tensiune, curent și putere ale echipamentelor.",
          "Numărul de panouri depinde de puterea modelului ales. Verifică dimensiunile, dispunerea, șirurile și suprafața utilă, nu doar rezultatul unei împărțiri.",
        ],
      },
      {
        heading: "Estimează producția locală",
        paragraphs: [
          "Folosește localitatea, orientarea, înclinația și pierderile pentru o simulare lunară. Evită o valoare anuală fixă pentru toate regiunile și păstrează un interval pentru variația vremii și indisponibilitate.",
          "Producția nu dovedește potrivirea economică. Compară energia de zi cu profilul de consum și separă autoconsumul de injecție.",
        ],
        bullets: ["putere DC și AC", "producție pe luni", "umbrire și pierderi", "branșament și limite", "monitorizare și protecții"],
      },
      {
        heading: "Când poate fi potrivit",
        paragraphs: [
          "Un sistem din această zonă de putere poate fi un scenariu rezonabil pentru unele locuințe, dar nu există un prag universal de consum. Testează și variante apropiate, schimbările viitoare și limita acoperișului înainte de alegere.",
        ],
      },
    ],
    faq: [
      { question: "Cât produce exact un sistem de 5 kW?", answer: "Nu există o valoare exactă fără amplasament și configurație; simularea trebuie să prezinte ipotezele și variația." },
      { question: "Are nevoie obligatoriu de baterie?", answer: "Nu. Bateria se decide separat după profilul orar, obiectivul de backup și comparația economică." },
    ],
    related: ["cate-panouri-fotovoltaice-imi-trebuie", "productie-si-economii-panouri-fotovoltaice", "invertor-fotovoltaic-ghid"],
    sources: [{ label: "PVGIS — Comisia Europeană", url: "https://re.jrc.ec.europa.eu/pvg_tools/en/tools.html" }],
    primaryCta: { label: "Verifică dacă 5 kW ți se potrivește", destination: "/recomandare-sistem", tool: "recommendation" },
  },
];

export const BEGINNER_PATH = [
  "dimensionare-sistem-fotovoltaic",
  "cate-panouri-fotovoltaice-imi-trebuie",
  "productie-si-economii-panouri-fotovoltaice",
  "sistem-fotovoltaic-cu-baterie-sau-fara",
  "amortizare-sistem-fotovoltaic",
  "cum-verifici-o-oferta-fotovoltaica",
] as const;

export const FEATURED_GUIDE_SLUGS = [
  "calculator-panouri-fotovoltaice",
  "cate-panouri-fotovoltaice-imi-trebuie",
  "productie-si-economii-panouri-fotovoltaice",
  "cum-verifici-o-oferta-fotovoltaica",
] as const;

export const HOMEPAGE_GUIDE_SLUGS = [
  "calculator-panouri-fotovoltaice",
  "sistem-fotovoltaic-cu-baterie-sau-fara",
  "cum-verifici-o-oferta-fotovoltaica",
] as const;

export const TOOL_DESTINATIONS = {
  recommendation: {
    destination: "/recomandare-sistem",
    label: "Construiește recomandarea pentru locuința ta",
    description: "Introduci consumul și constrângerile locuinței și primești un scenariu orientativ explicat.",
  },
  solar_map: {
    destination: "/harta-solara-romania",
    label: "Explorează producția pentru localitatea ta",
    description: "Alegi locul și configurația pentru o estimare lunară bazată pe date PVGIS.",
  },
  offer_analysis: {
    destination: "/upload-oferta",
    label: "Verifică oferta pe care ai primit-o",
    description: "Încarci oferta și vezi ce este clar, ce lipsește și ce merită întrebat înainte de semnare.",
  },
} as const;

export function relatedEditorialPages(page: EditorialPage) {
  return page.related
    .filter((slug) => slug !== page.slug)
    .map((slug) => editorialBySlug[slug])
    .filter((related): related is EditorialPage => Boolean(related))
    .slice(0, 3);
}

export const editorialBySlug = Object.fromEntries(
  editorialPages.map((page) => [page.slug, page]),
) as Record<string, EditorialPage>;

export const indexablePaths = [
  "/",
  "/recomandare-sistem",
  "/upload-oferta",
  "/introducere-manuala",
  "/exemplu-raport",
  "/harta-solara-romania",
  "/cum-functioneaza",
  "/intrebari-frecvente",
  "/contact",
  ...editorialPages.map((page) => `/${page.slug}`),
] as const;

export const privatePathPrefixes = [
  "/admin",
  "/analiza",
  "/api",
  "/autentificare",
  "/cont",
  "/corectare",
  "/raport-complet",
  "/rezultat-gratuit",
] as const;

export function canonicalUrl(path: string) {
  const normalized = path === "/" ? "/" : `/${path.split("/").filter(Boolean).join("/")}`;
  return `${SITE_URL}${normalized}`;
}
