# RaportSolar design system

## Direcție

Sistemul extinde Homepage v2: verde profund, galben solar, suprafețe neutre calde, scene SVG/CSS de produs, titluri ferme și spațiu generos. Ilustrația explică produsul; pictogramele susțin textul, nu îl înlocuiesc.

## Tokenuri și ierarhie

| Element         | Regulă                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| Titlu principal | `clamp(2.7rem, 6vw, 5.6rem)`, line-height 0,98, tracking negativ         |
| Titlu secțiune  | `clamp(2.25rem, 4.8vw, 4.8rem)`                                          |
| Text principal  | 1–1,2rem, line-height 1,7–1,75, maximum 43rem                            |
| Conținut        | shell maxim 80rem; lectură 46rem                                         |
| Ritm vertical   | secțiuni 4,5–8rem; spații interne 0,75/1/1,5/2,25rem                     |
| Suprafețe       | alb, `#fffdf8`, `#edf8e9`, `#0d342c`, `#ffbd28`                          |
| Raze            | 1,25rem controale mari; 1,5–2,3rem suprafețe și scene                    |
| Umbre           | discrete, cu verde profund și difuzie mare                               |
| Buton principal | verde, formă capsulă, minimum 48px                                       |
| Buton secundar  | neutru translucid, contur verde discret                                  |
| Feedback        | succes verde, avertizare solar, eroare roșu închis, informație verde-gri |

## Componente

- `MarketingPageHero`: erou public cu text, acțiuni și scenă de produs.
- `SectionIntro`: număr/etichetă, titlu și explicație.
- `BrandSurface`: suprafețe light, paper, green și sun.
- `JourneyScene`: scene pentru recomandare, ofertă și contact.
- `PageState`: loading, empty, error și success cu semantică adecvată.
- `Reveal`: intrare discretă, dezactivată la reduced motion.
- `FormShell`, `FieldGroup`, `StepProgress`, `StickyActionBar`: faza instrumentelor.
- `ReportShell`, `ResultSummary`, `InsightPanel`: faza rezultatelor.
- `AccountShell`, `AdminShell`, `AdminTable`, `StatusBadge`: fazele cont/admin.

## Formulare și date

Etichetele rămân vizibile. Unitățile nu sunt ascunse în placeholder. Stările focus, invalid, disabled și loading trebuie să fie distincte fără a depinde doar de culoare. Graficele folosesc verde pentru producție/cunoscut, galben pentru estimări și portocaliu/roșu pentru atenționări.

## Responsive

Breakpoints validate: 320, 360, 390, 412, landscape, 768, 1024, 1280 și 1440 px. Shell-ul păstrează minimum 1rem lateral. Layouturile devin o singură coloană sub 768px; acțiunile critice ocupă lățimea disponibilă sub 640px.

## Motion

- intrare: 600–700ms, `cubic-bezier(.2,.8,.2,1)`;
- feedback/control: 160–220ms;
- flux energetic: maximum 2s și numai unde explică transferul;
- fără animație continuă în rapoarte, cont sau admin;
- `prefers-reduced-motion: reduce` elimină animațiile și tranzițiile neesențiale;
- transform și opacity numai, fără modificări care produc layout shift.
