# Phase 3 editorial inventory

Inventory date: 2026-07-30. The typed registry in `src/lib/seo-content.ts` remains the source of truth.

| Route | Primary category | User question / decision | Primary tool |
|---|---|---|---|
| `/ghid-panouri-fotovoltaice` | Începe de aici | Where do I begin and how are the decisions connected? | System recommendation |
| `/calculator-panouri-fotovoltaice` | Începe de aici | Which inputs make a photovoltaic estimate useful? | System recommendation |
| `/dimensionare-sistem-fotovoltaic` | Dimensionare | How should consumption and roof constraints become system power? | System recommendation |
| `/cate-panouri-fotovoltaice-imi-trebuie` | Dimensionare | How many modules fit the intended power and real roof? | System recommendation |
| `/sistem-fotovoltaic-5-kw` | Dimensionare | What does a 5 kW package mean and could it fit my home? | System recommendation |
| `/cost-panouri-fotovoltaice` | Costuri și amortizare | What is included in the complete installed price? | Offer analysis |
| `/amortizare-sistem-fotovoltaic` | Costuri și amortizare | How do I evaluate payback without a guaranteed number? | System recommendation |
| `/productie-panouri-fotovoltaice` | Producție și economii | Which physical factors change monthly and annual output? | Solar map |
| `/productie-si-economii-panouri-fotovoltaice` | Producție și economii | How do produced kWh become financial savings? | Solar map |
| `/baterie-pentru-panouri-fotovoltaice` | Baterii și autoconsum | Which battery specifications and use cases matter? | System recommendation |
| `/autoconsum-energie-solara` | Baterii și autoconsum | How are autoconsumption and self-sufficiency different? | System recommendation |
| `/sistem-fotovoltaic-cu-baterie-sau-fara` | Baterii și autoconsum | Should I buy storage now, prepare for it, or omit it? | System recommendation |
| `/invertor-fotovoltaic-ghid` | Echipamente și garanții | Is the inverter electrically and operationally suitable? | Offer analysis |
| `/mentenanta-panouri-fotovoltaice` | Echipamente și garanții | What should be monitored and when is specialist intervention needed? | Offer analysis |
| `/garantii-panouri-fotovoltaice` | Echipamente și garanții | Who guarantees each component and what is actually covered? | Offer analysis |
| `/cum-devii-prosumator` | Prosumator și finanțare | Which responsibilities and official sources govern the process? | System recommendation |
| `/finantare-panouri-fotovoltaice` | Prosumator și finanțare | How should direct payment, credit and public programmes be compared? | Offer analysis |
| `/cum-verifici-o-oferta-fotovoltaica` | Oferte și instalatori | Which configuration, work, price and contract details require clarification? | Offer analysis |

## Intent ownership corrections

The guide hub owns orientation and library discovery, not calculator intent. The calculator landing page owns calculator intent; the technical sizing guide owns engineering-method intent. The combined production/economy page owns the decision question, while the production guide owns physical estimation fundamentals. The battery comparison owns the choice; the battery guide owns specifications. Offer verification remains the only owner for offer-comparison intent.

## Relationship rules

Each page stores up to three explicit related slugs. Rendering resolves those slugs through the central registry, removes the current page, discards non-editorial or missing targets and limits output to three. Relationships represent a prerequisite, a complementary decision or the next practical decision; they are not generated from keyword similarity.
