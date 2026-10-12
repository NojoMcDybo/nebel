# nebel.

A browser-based type 1 diabetes simulator for the **relatives and friends** of people living with type 1 diabetes.

**Try it:** https://nojomcdybo.github.io/nebel/. It runs in the browser, on phones too, with nothing to install. The app itself is in German.

## Intended purpose

nebel. is meant exclusively for **education and perspective-taking**. It simulates fictional adults with type 1 diabetes so that the people around them can feel the effort, the delays and the uncertainty that come with the condition every day.

nebel. is explicitly **not** intended for the diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of any disease. It is **not a medical device** within the meaning of Regulation (EU) 2017/745 and is not promoted as one.

- No dosing recommendations and no individual advice. There is no bolus calculator.
- No real health data. There is no way to enter your own glucose, insulin or meal values.
- The simulation covers **ten fictional adults**. Children, adolescents and poorly controlled diabetes are not covered.
- No number from nebel. may ever inform a real therapy decision. That is the job of your diabetes care team.

Legal assessment and the conditions for publishing (in German): `docs/30_Rechtliche_Einordnung.md`.

## What you can do

- **Pick a person.** Ten invented people (name, age, everyday life, look), each running on one of the published virtual-patient parameter sets. Fold out a card to see how their body differs from the others.
- **Live their day.** Eat, bolus, change the basal rate, exercise. A day plan with everyday movement and training runs alongside.
- **Watch the sensor.** A CGM reading every five minutes with realistic error and lag, Dexcom-style trend arrows, the difference to the previous reading, and alarms at night.
- **Real-time mode.** The simulation follows the real clock, so it can run alongside your own day.
- **Review.** Time in range, how far the sensor was off, a 12-hour forecast of what your decisions still do, and the effects split into carbohydrates, fat, protein and insulin. Errors the sensor made are only revealed here.

## How it works

The physiology is the extended Hovorka model (ExtHovorka): 16 states, with exercise driven by heart rate. It is implemented in TypeScript as a standalone, headless and deterministic engine in `engine/`.

- **Validated** numerically against the reference implementation py-mgipsim. Derivatives agree to better than 1e-12 relative over 120 random states and three subjects. A 24-hour trajectory with a meal, bolus and exercise agrees to better than 1e-9 mmol/L.
- **Calibrated** where source values demonstrably don't match reality: sensor delay 5 min, insulin absorption 50 min. Both corrections live in one place, `engine/src/calibration.ts`, with their evidence.
- **Extended** with a CGM error model and with fat and protein. Fat delays gastric emptying and lowers insulin sensitivity for hours. Protein adds late glucose from the liver. These parts are calibrated against published studies (Wolpert 2013, Paterson 2016) and checked against two more (Smart 2013, O'Connell 2021).
- **Tests:** 133, including the numerical comparison with the reference.

All design decisions, sources, calibrations and known limits are documented in `docs/` (in German). Start with `docs/README.md`.

## Repository layout

| Path | Contents |
|---|---|
| `app/` | The app: interface (`template.html`), adapter to the engine, people, legal page |
| `engine/` | Physiology engine as a standalone TypeScript module with its test suite and build scripts |
| `docs/` | Target audience, engine specification, parameter registry, research, legal assessment, changelog (German) |
| `.github/workflows/pages.yml` | Tests, builds and publishes the app to GitHub Pages |
| `index.html` | Early UX and interaction prototype. **Not** a physiological source |
| `*.docx` | Historical documentation as of 14 Sep 2026, see `docs/README.md` |

## Build it yourself

Requires Node.js 22. Python 3 with numpy is only needed for the numerical reference test.

```
cd engine
npm install
npm run oracle:fetch      # downloads py-mgipsim (GPL-3.0) into engine/vendor/, pinned and hash-checked
npm run oracle:reference  # reference values for the numerical comparison (needs numpy)
npm test
npm run viewer            # builds engine/dist/site/ (the app) and engine/dist/nebel-viewer.html
```

Open `engine/dist/site/index.html` in a browser. The viewer is a developer tool for the engine and stays local.

**Publishing:** every push to `main` runs `.github/workflows/pages.yml`. It runs the tests, builds with `--release` and deploys `engine/dist/site/` to GitHub Pages. The release build refuses to publish without imprint details (repository variables `NEBEL_IMPRESSUM_NAME`, `NEBEL_IMPRESSUM_ANSCHRIFT`, `NEBEL_IMPRESSUM_EMAIL`), without license texts, or if a page would load anything from a third-party server.

## License and provenance

- **Code and documentation:** Apache License 2.0, see `LICENSE`.
- **Model:** implemented from the publications, not from code:
  - Hobbs et al. (2019), *Computers & Chemical Engineering*
  - Siket, Rashid & Cinar (2025), *Journal of Diabetes Science and Technology*
- **py-mgipsim:** The reference implementation [py-mgipsim](https://github.com/illinoistech-itm/py-mgipsim) (GPL-3.0) serves as a numerical oracle in the test suite.
  - No code was copied from it.
  - Neither the library nor its parameter sets are part of this repository.
- **The published app** ships ten of the twenty py-mgipsim parameter sets.
  - They come as a separate file, `personen-daten.js`, **under GPL-3.0**, with source, license text and a modification notice.
  - The rest of the app is Apache 2.0.
  - Reasoning: `docs/30_Rechtliche_Einordnung.md`, section 7.
- **Fonts:** DM Mono and Plus Jakarta Sans, SIL Open Font License 1.1, served with the app.
- **No monetization.** nebel. is a private, non-commercial educational project.
