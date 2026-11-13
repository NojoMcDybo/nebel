# nebel. in detail: how it came about, decisions and foundations

*Detailed version, as of 10 November 2026. The short version without formulas is [nebel. in brief](41_Entstehung_kompakt.en.md).*

nebel. is a type 1 diabetes simulator that runs in the browser. It is aimed at the family and friends of people with type 1 diabetes and tries to let them experience what a day with this condition demands: constant attention, the delay between a decision and its effect, and the uncertainty of a number that is never quite right. The app runs without installation at https://nojomcdybo.github.io/nebel/ (German) and https://nojomcdybo.github.io/nebel/en/ (English). Source code and documentation are open at https://github.com/NojoMcDybo/nebel.

nebel. is a learning system and not a medical device. There is no dosing advice, no bolus calculator and no way to enter your own values. No number from the simulation may influence a real therapy decision.

This text covers how the project came about and why each decision was made. It also covers the model, the factors it takes into account, the calibrations against studies and the limits. Author and year in the text point to the sources at the end. The project documentation it is based on is in German.

---

## 1. Starting point

### 1.1 Who it is for

The primary audience is partners, parents, siblings, friends, flatmates and coaches at the sports club. Later, and with lower priority, student teachers and teachers with school sport in mind. It is not meant for people with type 1 diabetes themselves, for medical professionals, or for any kind of therapy decision.

Family members see the result, not the process: the glance at the phone during a meal, the bad mood at three in the morning, the cancelled meet-up. What they are missing are five insights. These became the learning goals:

| No. | Learning goal | How you can tell it landed |
|---|---|---|
| 1 | The load is permanent and cannot be switched off | After the session, people describe the effort, not a single event |
| 2 | Effects come late, and decisions are made under uncertainty | People can say why a correction came too late |
| 3 | The displayed number is not the body | Sensor reading and actual glucose are told apart |
| 4 | Variability is not carelessness | Two different courses after the same action can be explained |
| 5 | Exercise is not simply "glucose down" | The difference between moderate and hard exercise is known |

The first learning goal comes from a self-experiment. What stuck most was the background process in the head that never stops. Single exceptional situations weighed less. That is why the permanent load is at the centre and not the drama.

The learning goals lead to exclusions: no points for "good values" (that would reinforce exactly the judging attitude family members tend to bring along anyway), no reward for time in range, no dosing tips and no simulation of a specific real person.

### 1.2 The first documents and the prototype

It started with an interactive prototype (`index.html`) with its own simplified calculation and three concept documents from 14 September 2026: a scientific foundation for the engine, an equation and parameter specification, and a risk review with 15 ways the content could fail. The prototype shaped interaction and design. Its formulas and time constants are explicitly not a physiological basis.

---

## 2. Timeline

| Date | Step |
|---|---|
| 14 Sep 2026 | Three concept documents: foundation, equation specification V1, risk review |
| 15 Sep 2026 | Decision for the extended Hovorka model (ExtHovorka) as the engine core |
| 22 Sep 2026 | Consistency review of the documents (W1 to W12). Reference implementation py-mgipsim found. Audience, learning goals, real-time mode, hunger as a need, research on paediatrics, legal assessment, Apache 2.0 licence. Engine built: 84 tests, numerical comparison against py-mgipsim passed |
| 23 Sep 2026 | Prototype interface switched to the verified engine. Sensor delay calibrated to 5 min. First the published Dexcom G6 error model, then a sensor model V2 of our own |
| 23/24 Sep 2026 | Bug found in the exercise scenario that had distorted figures in the documentation. Four adapter bugs fixed. Inconsistency W13 (daily plan) resolved |
| 26 Sep 2026 | The look back reveals pressure on the sensor. Insulin absorption calibrated to 50 min. Calibration centralised in the engine. Ten selectable people. Forecast in the review. Dexcom trend arrows. Fat and protein in the engine |
| 12 Oct 2026 | Publication prepared: GitHub Pages, a separate GPL file for the parameter sets, local fonts, a legal page, build pipeline, English README |
| 28 Oct 2026 | Reply from the py-mgipsim authors: no objections. Notice before first use. Repository public, release v1.0.0. English version at `/en/`, release v1.1.0 |
| 9 Nov 2026 | Language choice in the notice. Reserves fill up when eating, "ravenous" hint. Exercise system made consistent, training can be cancelled. Long aftereffect of exercise calibrated |
| 10 Nov 2026 | Swipe gesture for the iPhone reworked. These texts on how nebel. came about added to the start page, in German and English |
| 11 Nov 2026 | Web app for the iPhone home screen. Training types alternate hard and easy minutes, exercise shows up in the effect chart, the sensor scatters less. Release v1.2.0 |
| 12 Nov 2026 | Review and legal check of the live site. Start of the iPhone app with real heart rate from a chest strap |
| 13 Nov 2026 | After Reddit feedback: settings with mmol/L, "Full daily life" mode with lows at the wrong time, body feeling, rollercoaster, remarks, day plan and invitations. Sitemap for Google. Release v1.3.0 |

---

## 3. Basic decisions

| Question | Decision | Date |
|---|---|---|
| Audience | Family and friends; school sport later | 22 Sep |
| Engine core | ExtHovorka, 16 states, driven by heart rate | 15 Sep |
| Therapy | Insulin pump (CSII), open loop | 09/2026 |
| Architecture | Standalone TypeScript module with a test suite, runs without an interface | 22 Sep |
| Reference implementation | py-mgipsim only as a numerical comparison oracle, no code taken over | 22 Sep |
| Units | SI internally (mmol/L, mmol, mU), conversion only at the display boundary | 22 Sep |
| Time of day | No circadian rhythm, no dawn phenomenon in V1 | 22 Sep |
| Real-time mode | Core feature, carries learning goal 1 | 22 Sep |
| Children | Not in V1, because no suitable parameter set exists | 22 Sep |
| Hunger | A need in the experience layer, not a new physiological state | 22 Sep |
| People | Ten made-up characters on ten published model bodies | 26 Sep |
| Own profile | No entry of values | 26 Sep |
| Calibration | Sensor delay 5 min, insulin absorption 50 min, in one central place | 26 Sep |
| Fat and protein | In the engine, without a new state | 26 Sep |
| Trend arrow | Seven steps as on the Dexcom G6 | 26 Sep |
| Publication | Public repository, app on GitHub Pages, parameter sets as a separate GPL file | 12 Oct |
| Long aftereffect of exercise | An input without a new state, calibrated against DirecNet | 9 Nov |

### 3.1 Why a published model

The first equation specification mixed three model families: glucose and uptake from the UVA/Padova model (Dalla Man), insulin and insulin action from Hovorka, exercise from Dalla Man and Breton. This broke its own rule not to mix models without explicit harmonisation (inconsistency W1). On top of that came action pathways without coupling (W2), an undefined renal term (W3), orphaned parameters (W4), open units (W5), a recommendation for a model family of its own (W6), a state list that was too short (W7), contradicting statements on time of day (W8), a missing sensor model and a contradicting sensor delay (W9), an unclear therapy (W10) and thresholds in the wrong unit (W11).

Instead of repairing the mix, nebel. replaces it entirely with a single published model: the extended Hovorka model from Ali Cinar's group at the Illinois Institute of Technology (Hovorka et al. 2004; Rashid et al. 2019; Siket, Rashid & Cinar 2025). The reasons:

- One fully specified model instead of a combination of three families.
- Exercise is part of the model itself. That matters because sport is a fixed part of nebel. (learning goal 5).
- There are 20 published parameter sets of virtual patients, with basal rate, carb ratio, correction factor, resting heart rate, HbA1c and body measurements. nebel. does not have to invent therapy parameters.
- With py-mgipsim there is an open-source reference implementation against which nebel.'s own implementation can be checked numerically.

nebel.'s own work is deliberately limited to three layers the source model does not have: the sensor (observation), the pump and the experience. nebel. touches the physiology only in a few places, each with its own justification (section 6).

### 3.2 Architecture: layers as one-way streets

```
EVENTS        meal · insulin · heart rate
   ↓
PHYSIOLOGY    16 states, SI units, deterministic             ExtHovorka, published
   ↓
OBSERVATION   interstitium · sensor error · 5-min grid       nebel.
   ↓
EXPERIENCE    display, alarms, needs, review                 nebel.
```

Rules enforced in the code:

1. **Real time first.** The engine computes in chunks. Every extension has to survive a catch-up computation without changing the result.
2. **No code from py-mgipsim.** Everything is implemented from the publications. py-mgipsim serves only as a comparison in the test suite.
3. **No patient data in the repository.** The 20 parameter sets are read at test time from a local folder that is not under version control.
4. **No invented parameters.** Every number is in the parameter register with a source or as a declared assumption.
5. **Observation never changes physiology.** A measurement error never changes the simulated body.
6. **Determinism.** Same person, same seed and same events give a bit-identical course.

### 3.3 Therapy

nebel. models an insulin pump in an open loop: basal profile, bolus, extended bolus, temporary basal rate and pump suspend. The model takes insulin as a continuous flow, which fits a pump directly. There is no automated insulin delivery algorithm (AID).

### 3.4 What is deliberately missing

- No daily rhythm of insulin sensitivity, no dawn phenomenon. ExtHovorka has no such term. The clock is for display and for timing events, not a physiological factor.
- No glucagon or counter-regulation model.
- No multipliers for stress, illness, sleep, alcohol or the menstrual cycle.
- No liver glycogen as a separate state (section 8.2).
- No children or adolescents (section 11).
- No bolus calculator and no entry of your own values (section 10).

---

## 4. The physiological model

### 4.1 States and inputs

ExtHovorka describes the body with 16 states:

| Group | States |
|---|---|
| Insulin under the skin and in the blood | `S1`, `S2` (subcutaneous, mU), `I` (plasma, mU/L) |
| Insulin action | `x1` (glucose transport), `x2` (disposal in tissue), `x3` (suppression of the liver) |
| Glucose | `Q1` (central, mmol), `Q2` (peripheral, mmol), `IG` (interstitial fluid, mmol/L) |
| Carbohydrates in the gut | two compartments each for fast and slow carbohydrates |
| Exercise | `EEfast` (fast response), `EEhigh` (share above the ventilatory threshold), `EElong` (short aftereffect) |

Inputs are fast and slow carbohydrates (mmol/min), insulin (mU/min) and heart rate (bpm). nebel. adds two optional inputs that are neutral when unused: extra glucose from protein, and a factor on insulin sensitivity (`siFactor`) through which fat and the long aftereffect of exercise act.

### 4.2 Equations in brief

Insulin absorption and plasma insulin:

```
dS1/dt = uInsulin − S1/tmaxI
dS2/dt = (S1 − S2)/tmaxI
dI/dt  = S2/(VI · tmaxI) − ke · I
```

Glucose-dependent insulin sensitivity: it rises during a low and falls during a high (a `tanh` mapping normalised to 5 mmol/L, and a linear reduction above 5.55 mmol/L). This has nothing to do with time of day, and the app does not explain it that way.

```
dx1/dt = kb1' · I − ka1 · x1        kb' = kb · SIhypo · SIhyper · siFactor
dx2/dt = kb2' · I − ka2 · x2
dx3/dt = kb3' · I − ka3 · x3
```

Liver, brain, kidney:

```
EGP  = max(0, EGP0 · (1 − x3) · (1 + p1 · EEfast + p2 · EEhigh))
F01n = BW · F01, lowered linearly below 4.5 mmol/L
FR   = 0.003 · (G − 9) · VG from 9 mmol/L, otherwise 0
```

Glucose balance:

```
dQ1/dt = − x1·Q1 + k12·Q2 − F01n − FR + uptake from the gut + EGP − p3·EEfast   [+ glucose from protein]
dQ2/dt =   x1·Q1 − k12·Q2 − x2·Q2 + p3·EEfast − p4·EEfast − p5·x2·EElong
dIG/dt = (G − IG)/tsub
```

Exercise, driven by heart rate reserve `HRR = (HR − resting HR)/(max HR − resting HR)`:

```
dEEfast/dt = p6 · (HRR − EEfast)
dEEhigh/dt = p8 · (HRRhigh − EEhigh)        HRRhigh: share above the ventilatory threshold
dEElong/dt = p6 · EEfast − p7 · EElong
```

Moderate exercise lowers the value through `p3` and `p4`. Hard exercise above the ventilatory threshold drives the liver through `p2` and can make the value rise. This is the mechanism behind learning goal 5.

Numerical guard rails without physiological meaning: glucose between 1 and 32 mmol/L, liver production not negative.

### 4.3 Parameters

35 parameters, 16 of them different for each person and 19 the same for all. The ranges in the register are the values observed across the 20 data sets, not population distributions. Two parameters (`beta`, `a`) are leftovers of an older exercise model, are not used in any equation and were not taken over.

Worth noting: the exercise response differs between people almost entirely through `p3`, `p4`, `p5`, resting and maximum heart rate, and the ventilatory threshold. `p3` alone spans a factor of 13. The same moderate session lowers the value by 2 to 89 mg/dL depending on the person.

All 20 data sets are adults with an HbA1c between 5.7 and 7.6 %. Age and sex are not included. Every basal rate holds exactly 108 mg/dL without food, because it was fitted to do so.

### 4.4 Numerics

Step size 1 min, explicit Euler method, events at exact time boundaries. Checked against RK4 and against half and quarter step sizes, with long runs over seven days. The basal steady state is integrated out over 72 hours instead of solved algebraically: with a fitted basal rate the balance has a root without a sign change, where every bisection method fails. A side effect: the closed-form expression of the reference did not need to be touched.

---

## 5. Validation

### 5.1 Numerical comparison with the reference

Before any extension of its own, nebel. checked that the implementation computes exactly the published model. A script loads only the equation function of py-mgipsim, runs it and writes a table of numbers. No code moves into the project.

| Check | Result |
|---|---|
| Derivatives at 120 random states, three people | Relative difference below 1e-12 |
| 24 hours with a meal, bolus and exercise | Difference below 1e-9 mmol/L |
| Counter-check with one parameter detuned by 1 % | Gets caught, so the comparison is sharp |

Confirmed independently: the published basal rate of patient 1 (1.14 U/h) holds exactly 6.0 mmol/L in the model for twelve hours. A unit error by a factor of 60 or 1000 would have shown up immediately.

### 5.2 Test suite

149 automated tests, plus 65 checkpoints for the connection between app and engine. Among other things they check equations and units, insulin, meals, exercise, the renal threshold, lows, differences between people, the sensor model, catch-up computation (24 hours in one go and in arbitrary pieces are bit-identical), lossless saving and loading, the calibrations against their studies, and the neutrality of all extensions. Every push to the main branch runs the tests before the site is published again.

### 5.3 Bugs the checks found

- **Exercise scenario.** Heart rate is a linearly interpolated track. The helper for an exercise block did not set a resting point before it. Between two blocks the heart rate therefore climbed all day. This made the sensor accuracy in the register wrong ("four times as inaccurate in the low range" instead of the correct "twice"). Fixed and covered by a regression test.
- **Planned exercise never ran.** The display counted down to a training session that never took place.
- **Overlapping sessions changed the past**, because a new support point shifted the interpolation before it. Now an anchor holds the last computed value.
- **Saving lost the physiology.** Only the display was saved. Now state, inputs and reserves are stored.
- **Every session looked the same**, because the seed was fixed. Now every new session rolls its own.
- **Eating never refilled the reserves**, and "ravenous" never appeared. Both were written but not wired up.

### 5.4 An open finding

With daily exercise and no adjustment of food or insulin, some people sink to the numerical floor over several days. The reference shows the same, so the implementation is correct. Whether this strength is physiologically right is open. Below 40 mg/dL the sensor therefore shows "LO", and the range counts as the edge of the model.

---

## 6. Where nebel. corrects the source

Where a source value demonstrably does not match reality, nebel. corrects it with evidence. Changed parameters live in exactly one place (`engine/src/calibration.ts`). Additional inputs such as fat, protein and the long aftereffect live in their own modules and are neutral without their input. The engine knows two parameter sets: the source set for the comparison and the equation tests, and the nebel. set for app, viewer and calibration scripts. The two are never mixed.

### 6.1 Sensor delay: 15 → 5 minutes

ExtHovorka delays interstitial glucose with `tsub` = 15 min. The ISPAD guideline gives 5 to 10 min (Tauschmann et al. 2022), and the G6 error model estimates 3.8 min (Vettoretti et al. 2019). nebel. uses 5 min. This is allowed because no other state reads `IG`. The correction affects only the observation, not the body.

### 6.2 Insulin absorption: `tmaxI` 50 minutes

During testing, one unit without food barely did anything. With the source values (58 to 131 min), 1 U lowered glucose by 2 mg/dL after one hour, acted most strongly after 1.7 h, and the lowest point came after 6 h. The prescribing information for insulin aspart gives onset after 10 to 20 min, maximum after 1 to 3 h, duration 3 to 5 h and a plasma peak after about 40 min.

| `tmaxI` | Plasma peak | Steepest drop | Lowest point | 1 U lowers by (median) |
|---|---|---|---|---|
| Source (58 to 131 min) | 122 min | 1.7 h | 6.1 h | 29 mg/dL |
| 40 min | 49 min | 0.8 h | 3.0 h | 32 mg/dL |
| **50 min** | **59 min** | **1.0 h** | **3.5 h** | **31 mg/dL** |
| 55 min | 64 min | 1.1 h | 3.7 h | 31 mg/dL |

A single parameter cannot hit the plasma peak and the maximum effect at the same time. The effect takes priority, because only the effect is visible. 50 min put the maximum and duration within the limits of the prescribing information, and the plasma peak comes about 20 min late. Since then the start page says: "peaks after about an hour, over after three to four".

### 6.3 Long aftereffect of exercise

**Finding.** In the source model the aftereffect `EElong` decays within 10 min. One hour of moderate training at 4 pm lowered the following night by a median of only 1 mg/dL. Measured, it is 23 mg/dL: in the DirecNet study the overnight mean after afternoon exercise was 131 instead of 154 mg/dL, and nocturnal lows were more frequent (Tsalikian et al. 2005).

**Decision.** `p7` stays as in the source, because a longer decay time would also have changed the drop during exercise, which is fitted to data. The long part is added as an input, following the pattern of fat resistance:

```
L(t)     = ∫ HRR(s) · e^(−(t−s)/600) ds      decaying exercise minutes
siFactor = siFactor_fat · (1 + 0.0045 · L)
```

- **Decay time 600 min** from the exercise model by Dalla Man, Breton & Cobelli (2009), which describes insulin action as "fast on, slow off". Breton (2008) set his values so that the difference is still measurable after 20 hours.
- **Strength 0.0045 per exercise minute**, calibrated against DirecNet: nebel. gives −22 mg/dL as the median.
- **Counter-check with Taplin et al. (2010):** 20 % less basal over six hours clearly raised the nightly minimum after exercise. In nebel. the same measure raises the night by 20 mg/dL and so nearly cancels the aftereffect (source alone: +29 against −1).
- Computed with the ten people who do not drop below 70 mg/dL in the afternoon. The others would have eaten in real life.

**Consequences.** 60 min at 55 % of heart rate reserve make insulin 14 % more effective. After 10 hours a good third of that is left, after 24 hours just under a tenth. The app shows "Aftereffect +X %" and, while reserves are below 62 %, "Reserves · refuel". Nights after training now drop low more often, as in the studies.

**Limits.** Both studies looked at children and adolescents, while the model people are adults. The aftereffect grows linearly with duration times intensity, without saturation. It is an order of magnitude, not a dose.

### 6.4 Fat and protein

**Question.** Can the effect of fat and protein be modelled just by changing carbohydrate values? For protein and for the gastric delay caused by fat, yes. For fat-induced insulin resistance, not honestly. Treating fat as "hidden sugar" would teach the wrong mechanism: extra insulin cancels extra carbohydrates, but it works less well against resistance. So the engine was extended, without a new state. Without information on fat, protein and eating time it computes exactly like the source.

**Eating time.** Previously every meal reached the gut within one minute, and the "meal duration" slider had no effect. Now the carbohydrates are delivered evenly over the eating time.

**Fat slows the stomach.** The carbohydrates of the same meal pass through a gastric store with a mean delay of `min(120 min, 1 min per g fat)`. The direction is supported by evidence (Smart et al. 2013; Lupoli et al. 2019; Faggionato et al. 2026), the size is an assumption.

**Fat lowers insulin sensitivity.**

```
R(t)     = 0.020 · max(0, fat − 20 g) · bell(t − t_meal)     peak after 5.5 h
siFactor = 1/(1 + R)
```

- Peak after 5.5 h: higher insulin needs 5 to 10 h after a high-fat meal (Wolpert et al. 2013), a significant effect from 4 to 8 h (O'Connell et al. 2021).
- Strength calibrated against Wolpert: 60 instead of 10 g of fat required about 40 % more insulin. nebel. reaches 1.43 on average across the 20 data sets (study: 1.42).
- **Threshold of 20 g per meal.** This is not physiology, O'Connell finds no threshold. It is a reference point: in real life, carb ratio and basal rate are set for ordinary food, while the studies measure contrasts against almost fat-free meals. Without the threshold, three ordinary meals would have raised one person's daily mean from 194 to 295 mg/dL.

**Protein supplies late glucose from the liver.**

```
Rate(t) = 0.19 · protein · Erlang₃(t − t_meal; 90 min)      directly into the blood
```

- Yield of 0.19 g glucose per g protein, calibrated against four measurement points from Paterson et al. (2016), all within the confidence intervals.
- Time constant based on the effect 3 to 5 hours after eating described in reviews (Paterson et al. 2015; Margaritis et al. 2025), since the data do not determine it.
- No threshold. Ordinary amounts of protein raise a day by about 15 mg/dL.

**Counter-checks.**

| Study | Scenario | Study | nebel. (mean of 20) | Reading |
|---|---|---|---|---|
| Smart et al. 2013 (children) | +35 g fat, after 5 h | +2.3 mmol/L | +1.54 | nebel. below |
| | +40 g protein, after 5 h | +2.4 mmol/L | +0.63 | nebel. clearly below |
| | both | +5.4 mmol/L | +2.24 | Effects add up, direction is right |
| O'Connell et al. 2021 (children, pure fat) | 26 g, from 330 min | +0.70 | +0.96 | |
| | 51 g | +1.40 | +4.26 | nebel. overestimates pure fat |

For mixed meals with insulin, the normal case in the app, nebel. matches the adult study. The model overestimates pure fat without insulin by a factor of two to three. In the app, fat always comes together with carbohydrates.

**Not modelled:** the early drop after pure protein, saturation at large amounts of protein, gastric delay caused by protein, scaling to body weight, and hormonal pathways (GLP-1, GIP, glucagon).

**Sources not read**, whose numbers were therefore not used: the methods section of Wolpert 2013, Smart 2013 in the original, Bell et al. 2015, Lodefalk et al. 2008, and a systematic review on protein (PubMed 31454430). The reasons were access barriers (rate limit, captcha, 403).

---

## 7. The sensor

Learning goal 3 requires that the displayed number is not the body. ExtHovorka ends at interstitial glucose. Everything after that is nebel.'s own work and labelled as such.

### 7.1 From the lab model to sensor model V2

First, the published error model of the Dexcom G6 ran (Vettoretti et al. 2019): gain with drift over the wear period, offset and autoregressive noise. It describes the error at individual reference measurements well. During quiet night phases, however, the display jumped from value to value by ±3.5 mg/dL, and 31 % of all steps were 4 mg/dL or larger. People who wear sensors know the pattern 90 → 92 → 93 → 89 as unrealistic.

Sensor model V2 therefore separates the error by time scale. A real sensor errs coherently: it is off by a similar amount for hours, and large deviations are rare and have a cause.

```
CGM(t) = a(t) · IG(t) + b0 + drift(t) + level(t) · jitter(k) − pressure(t)
```

| Component | Time scale | Value | Origin |
|---|---|---|---|
| Calibration character (gain, offset) | fixed per sensor | median 0.95 and 0.14 mg/dL | Vettoretti 2019, spread from the interquartile range |
| Gain drift | days | as in the G6 model | Vettoretti 2019 |
| Slow drift | hours | spread 4 mg/dL | assumption |
| Jitter | 5 to 10 min | spread 1.2 mg/dL | at the lower end of the range in Camerlingo et al. 2023 |
| First day after insertion | hours | noise ×2.5, fades | direction from Hanson et al. 2024 |
| Exercise | minutes | extra noise with the load | direction from Camerlingo 2023 |
| Pressure on the sensor | 30 to 90 min | about every fourth night, a drop of 15 to 40 mg/dL | Mensh et al. 2013; frequency from Baysal et al. 2014 |
| Wear period | 10 days | then a new sensor | G6 |

The structure is supported by evidence. The strengths of drift, jitter, first-day factor and exercise surcharge are calibration. Randomness is counter-based so that the catch-up computation stays bit-identical.

### 7.2 Check

Across 20 people, three days each with meals, boluses and daily training:

| Variant | MARD | Range | below 70 | quiet step | jumps ≥ 4 mg/dL |
|---|---|---|---|---|---|
| delay only | 0.7 % | 0.4 to 1.3 | n/a | ±0.4 | 0 % |
| G6 lab model | 5.3 % | 4.8 to 6.0 | 12.8 % | ±3.5 | 32 % |
| **nebel. V2** | **6.2 %** | 2.5 to 13.8 | 14.3 % | **±1.3** | **1 %** |

On average V2 is as accurate as the G6 model, but distributed differently: calm from value to value, while sensors differ clearly from one another. In the low range the sensor is about twice as inaccurate as in the target range. Both figures are below clinical reports (Hanson et al. 2024: 8.9 % and 13.6 %), because the reference here is the exact model glucose. The parameters are not tuned to a target MARD.

### 7.3 Design decisions

- **The first day stays calm.** At the start the sensor has already been in for 2 to 7 days, and the first change comes on day 3 at the earliest.
- **Events only from the second night.** Pressure on the sensor only during sleep.
- **Judge first, explain later.** Live, a pressure drop looks like a real low and does not appear in the log. Only the look back reveals it: as a marked area in the curve and as an entry with the displayed value, the real blood value and your own reaction ("you ate 15 g, for a measurement error"). The lesson lies in the moment you realise you believed a measurement error and acted on it.
- **Measuring range 40 to 400 mg/dL**, outside of which the display shows the limit.

### 7.4 Trend arrow

Seven steps as in the Dexcom app, with diagonal arrows, following the G6 arrow table (Dexcom Canada): flat below 1 mg/dL per minute, diagonal 1 to 2, straight 2 to 3, double arrow from 3. Behind it is the difference from the previous value, "0" when unchanged.

### 7.5 Clinical thresholds

Level 2 hypoglycaemia below 54 mg/dL, level 1 below 70, target range 70 to 180, hyperglycaemia above 180 (ADA 2026). Separate from these are the model thresholds of 4.5 mmol/L (brain) and 9 mmol/L (kidney). Symptoms are not derived from a single value.

---

## 8. The experience layer

### 8.1 Real-time mode

Learning goal 1, the passive permanent load, cannot be conveyed in ten minutes. It arises when the simulator does not stop as soon as you look away. In real-time mode one simulated minute equals one real minute. There is also a fast mode for following things through.

What this requires technically:

- **Catch-up computation.** When the tab is closed or the phone is locked, nothing is computed. On opening, the simulation computes from the last minute up to now. Eight hours are 480 steps and take milliseconds.
- **Counter-based randomness.** Noise comes from the seed and the step number, not from a generator that keeps advancing. Otherwise the course would depend on how often you opened the app.
- **Forward only.** Events can only be entered in the present or the future. What-if runs on a copy.
- **Distrust of the clock.** A system clock running backwards does not create negative steps. The simulation waits instead.
- **Saved in the browser:** anchor, seed, person, state, inputs, reserves. The curve itself is recomputed.
- **The night.** Alarms at the thresholds, at night too, asked for explicitly beforehand and switchable off at any time.

### 8.2 Hunger and reserves

Without hunger you learn only one action: inject. Hunger forces action in the other direction, eating even when there is nothing to correct. Design rule: nebel. must not turn into a bolus machine.

The prototype had a liver glycogen state that affected counter-regulation and liver production. ExtHovorka has no glycogen. Adding it would mean putting a 17th, unsupported state into the middle of the core. Hunger is therefore handled as a need in the experience layer:

- The reserve falls over time (from full to empty in about ten hours), faster during exercise and during the aftereffect, and refills with the amount of carbohydrate actually eaten.
- Hints: "eat something" below 30 %, "woke up hungry" in the morning, "lunchtime", "dinner time", "refuel" after exercise, "ravenous" during exercise with almost empty reserves.
- Physiological consequences arise only through real couplings: hunger plus exercise, hunger plus a bolus already given, hunger plus a wrong basal rate. Not eating on its own has no consequence with a correct basal rate, because that is what the basal rate is for.
- All time constants are assumptions and are never presented as physiological values.

The hunger belongs to the simulated person, not to the user. nebel. has no calorie or weight logic and does not judge food choices.

### 8.3 Exercise from the daily plan

Meals arise only from the need, not from a script. Exercise, by contrast, comes from a daily plan (inconsistency W13, confirmed on 9 November 2026): training is announced so you can prepare. If the sensor value is below 80 or above 280 mg/dL, it is postponed, cancelled after three attempts, and you can cancel it yourself. Everyday activity happens without warning, like the bus that does not wait in real life either.

### 8.4 People

On the start page you choose whose body you spend the day in. Ten people, each on one of the 20 parameter sets:

| Person | Data set | Notable |
|---|---|---|
| Lena, 23 (default) | 10 | close to the median in everything except the meal |
| Jonas, 22 | 4 | sensitive to insulin, hard exercise raises glucose strongly |
| Mira, 38 | 6 | exercise lowers the most, hard exercise does not raise |
| Aylin, 41 | 7 | least sensitive to insulin |
| Malik, 25 | 8 | medium exercise responder, flat meals |
| Tobias, 43 | 11 | exercise does almost nothing |
| Jana, 34 | 13 | highest peak after eating |
| Finn, 19 | 14 | sensitive, hard exercise barely raises |
| Sofia, 24 | 15 | strong response to exercise in both directions |
| David, 20 | 18 | exercise does little, flat meals |

Real from the data set are height, weight, resting heart rate, HbA1c, basal rate, carb ratio, correction factor and all model parameters. Invented, and labelled as invented, are first name, age (roughly from the maximum heart rate), one sentence about everyday life and appearance. The selection follows a maximin procedure over five features (effect of 1 U, peak after 60 g with a bolus, moderate exercise, hard exercise, weight): each further person is the one furthest from those already chosen. The comparison values ("What makes the difference") are recomputed by the engine on every build.

There is deliberately no own profile with real values. It would tip the intended purpose and process health data. Also, carb ratio and correction factor do not uniquely determine the model parameters, so a "personal" profile would fake precision. Instead the app suggests looking for the most similar person.

### 8.5 Review and forecast

The third layer shows time in range, how far off the sensor was, uncovered sensor events and a forecast: where does the value go over the next twelve hours if no further decision is made? Whatever is already under way continues. Below it, the effect in mg/dL per hour, split into fast and slow carbohydrates, protein, fat and insulin. It shows actual disposal and the suppressed liver, not the mere transport between blood and tissue, which would look three times as large. The app says explicitly: only the simulation knows this curve, in real life it does not exist.

### 8.6 Interface

- **Three layers** (start, simulator, review) that stack like sheets. What lies underneath stays in place and blurs.
- **Greeting:** the content of a new layer appears piece by piece, from top left to bottom right. Without scaling, so text does not shimmer blurrily. With reduced motion in the system settings, without animation.
- **Notice** before first use, with a language choice. Without confirming it, the app stays locked.
- **Light and dark**, the charts fade along with it.
- **English version** at `/en/`. The source stays German, the build replaces every text with its English counterpart and stops if one is missing.
- **Texts on how nebel. came about** on the start page: the short version to fold out, this detailed version as a page of its own. Both also exist in English.

**Swipe gesture, reworked on 10 November 2026.** On the iPhone, swiping between layers often did not respond or felt jerky. For comparison we read how two widely used libraries solve the problem: Embla Carousel (drag detection and velocity) and Swiper (touch events, angle, edge gestures). Found and fixed:

1. On touch devices a finger is first implicitly bound to the touched element (W3C Pointer Events, "implicit pointer capture"). When it was rebound to the page container, the element reported the loss, the report bubbled up to the container and ended every drag after the first frame. Only a fast first flick still switched pages. Now only a loss at the container itself counts.
2. Since the review became the third layer, the drag already sprang back from the second layer as if at an edge. The review followed the finger at only a third of its speed. Now only the real edge springs back.
3. As in Embla, the swipe velocity is computed over a sliding window of about 170 ms from the event timestamps, instead of from the distance between two single movements. Holding still for longer before letting go does not count as a swipe. A swipe against the drag direction leads back.
4. Drawing happens at most once per frame, even when several movements arrive.

Checked in the preview browser with simulated touch binding and scripted drags. The change has not yet been tested on a real iPhone.

---

## 9. Factors the simulation takes into account

**Body (physiology)**

- Carbohydrates, fast and slow, with eating time
- Fat: delayed gastric emptying and insulin weakened for hours, from 20 g per meal
- Protein: late glucose from the liver
- Insulin: bolus, extended bolus, basal profile, temporary basal rate, pump suspend
- Insulin sensitivity depending on the glucose value
- Liver production, suppressed by insulin, driven by exercise
- Glucose use of the brain, lowered during a low
- Excretion through the kidney from 162 mg/dL
- Exercise through heart rate: moderate lowers, hard above the ventilatory threshold can raise, a short aftereffect and a long one over many hours
- The individual body: ten people with their own parameters

**Measurement (sensor)**

- Delay between blood and tissue
- Calibration character per sensor, drift over hours and days
- Jitter, stronger on the first day and during exercise
- Pressure on the sensor during sleep
- Sensor change after ten days
- Measuring range 40 to 400 mg/dL

**Everyday life (experience)**

- Estimation error when eating: the amount actually eaten differs from the entry
- Hunger and reserves
- Announced training and unannounced everyday activity
- Real time, night and alarms

**Deliberately not taken into account**

Time of day and dawn phenomenon, stress, illness, lack of sleep, alcohol, menstrual cycle, liver glycogen as a state, glucagon, insulin degradation, infusion set problems, children's physiology.

---

## 10. Law and publication

### 10.1 Not a medical device

Under Art. 2(1) of Regulation (EU) 2017/745, whether software is a medical device depends on the manufacturer's intended purpose, not on the technology (MDCG 2019-11). Education, simulation and seeing things from another person's point of view are not medical purposes. What would tip it: entering your own values (monitoring), a bolus calculator (treatment, probably class IIb), forecasts from real data, modelling a real person, or advertising a therapeutic benefit. The teaching exclusions from section 1 are therefore also the legal basis.

### 10.2 Liability

The new Product Liability Directive (EU) 2024/2853 includes software, but excludes free and open-source software supplied outside a commercial activity. Open, free publication therefore lowers the risk. This leads to the condition: no monetisation, no pro version, no paid support. General liability under § 823 of the German Civil Code (BGB) remains, but requires a breach of duty. A clear intended purpose that states its limits openly argues against such a breach.

### 10.3 Licences and data

- Code and documentation: Apache 2.0.
- py-mgipsim is under GPL-3.0. Equations and parameter values from publications are not protected, code structure is. nebel. takes over no code. It is not a clean-room implementation: the reference was read, and variable names follow the published notation. This is stated openly.
- The ten parameter sets in use sit next to the app as a separate file under GPL-3.0, with origin (fixed commit, hash check), a change note and the licence text. As a separate work they form an "aggregate" with the app (GPL-3.0 §5), and the licence does not extend to the rest. A possible database right (§ 87a of the German Copyright Act, UrhG) is covered through GPL-3.0 §0.
- The authors of py-mgipsim replied on 28 October 2026: no objections. Their two requests are implemented: the app states explicitly that it is only a learning system, neither a medical device nor suitable for insulin dosing, and that is the first thing you confirm.

### 10.4 Data protection

- No cookies, no tracking, no health data. Progress and the choice of person stay in the browser only (§ 25(2) no. 2 TDDDG).
- Fonts are local. They used to come from Google Fonts, which sent every visitor's IP address to Google (see Munich Regional Court I, judgment of 20 January 2022, ref. 3 O 17493/20).
- Hosting on GitHub Pages, which logs IP addresses for security reasons (Art. 6(1)(f) GDPR).
- The legal notice (§ 18(1) MStV, and as a precaution § 5 DDG) comes from repository variables, so that no postal address stays in the Git history for good.

### 10.5 Build and publication

Every push to the main branch starts a GitHub Action: fetch and verify the reference, generate reference values, check types, tests and the app connection, build in release mode, publish the site. The release build stops if the legal notice or licence texts are missing, or if a page loads anything from other servers. If a step fails, the old site stays up.

The legal texts are a careful template, not legal advice. Before wide distribution they should be checked once by a lawyer.

---

## 11. Limits and open points

- **Adults only.** No published parameter set for children fits ExtHovorka (checked: Wilinska et al. 2010, Félix et al. 2022, UVA/Padova S2013, a virtual population in PLOS ONE 2019). Scaling adult values would be guessing with children's numbers. To be revisited when a suitable set appears, when a harmonisation between model families exists, or when nebel. deliberately switches model family. Parents of children with type 1 diabetes are one of the largest groups of family members. The app therefore states this limit openly.
- **Strong exercise responders.** Five of the 20 data sets drop to the numerical floor with 60 min of moderate exercise and no carbohydrates. This comes from the source. Whether it is realistic is open.
- **Correction factor of the data sets** does not match the model for every person (median ratio 0.93, range 0.37 to 1.58). The carb ratio has not been checked yet.
- **Pure fat** is overestimated, **protein in mixed meals** rather underestimated.
- **Long aftereffect:** calibrated against studies in children, linear, without saturation.
- **Sensor strengths** (drift, jitter, duration and depth of pressure drops) are assumptions and should be checked against real sensor traces.
- **Liver glycogen** remains a candidate for a later version, once dynamics and coupling are supported by evidence.
- **Similarity questions without numbers** ("exercise lowers my glucose strongly, moderately, barely") as a way to the closest person are planned, not built.
- **Swipe gesture** not yet checked on a real iPhone.
- **Smart 2013:** the PubMed abstract gives a rise of 2.4 versus 0.5 mmol/L for the high-protein meal. The counter-check in section 6.4 lists +2.4 as a difference. This needs to be checked against the original.

---

## 12. Sources

Entries marked "PubMed" were checked against PubMed on 9 November 2026.

### Model and reference implementation

1. Hovorka R, Canonico V, Chassin LJ, et al. (2004). Nonlinear model predictive control of glucose concentration in subjects with type 1 diabetes. *Physiol Meas* 25(4):905–920. [DOI](https://doi.org/10.1088/0967-3334/25/4/010) (PubMed)
2. Rashid M, Samadi S, Sevil M, Hajizadeh I, Kolodziej P, Hobbs N, et al., Cinar A (2019). Simulation software for assessment of nonlinear and adaptive multivariable control algorithms: Glucose–insulin dynamics in type 1 diabetes. *Comput Chem Eng* 130:106565. [DOI](https://doi.org/10.1016/j.compchemeng.2019.106565) (PubMed)
3. Siket M, Rashid MM, Cinar A (2025). py-mgipsim: An open-source Python library for simulating type 1 diabetes with diverse meals and physical activities. *J Diabetes Sci Technol* 19(3):855–856. [DOI](https://doi.org/10.1177/19322968251328664) (PubMed)
4. py-mgipsim, Illinois Institute of Technology, GPL-3.0. https://github.com/illinoistech-itm/py-mgipsim (version used: commit b985f8c)

### Insulin, sensor and thresholds

5. Summary of Product Characteristics, NovoRapid PumpCart (insulin aspart), sections 5.1 and 5.2. https://www.medicines.org.uk/emc/product/7922/smpc
6. Tauschmann M, Forlenza G, Hood K, et al. (2022). ISPAD Clinical Practice Consensus Guidelines 2022: Diabetes technologies: Glucose monitoring. *Pediatr Diabetes* 23(8):1390–1405. [DOI](https://doi.org/10.1111/pedi.13451) (PubMed)
7. Vettoretti M, Battocchio C, Sparacino G, Facchinetti A (2019). Development of an error model for a factory-calibrated continuous glucose monitoring sensor with 10-day lifetime. *Sensors* 19(23):5320. [DOI](https://doi.org/10.3390/s19235320) (PubMed)
8. Camerlingo N, Siviero I, Vettoretti M, Sparacino G, Del Favero S, Facchinetti A (2023). Bayesian denoising algorithm dealing with colored, non-stationary noise in continuous glucose monitoring timeseries. *Front Bioeng Biotechnol* 11:1280233. [DOI](https://doi.org/10.3389/fbioe.2023.1280233)
9. Hanson K, Kipnes M, Tran H (2024). Comparison of point accuracy between two widely used continuous glucose monitoring systems. *J Diabetes Sci Technol* 18(3):598–607. [DOI](https://doi.org/10.1177/19322968231225676) (PubMed)
10. Mensh BD, Wisniewski NA, Neil BM, Burnett DR (2013). Susceptibility of interstitial continuous glucose monitor performance to sleeping position. *J Diabetes Sci Technol* 7(4):863–870. [DOI](https://doi.org/10.1177/193229681300700408) (PubMed)
11. Baysal N, Cameron F, Buckingham BA, et al. (2014). A novel method to detect pressure-induced sensor attenuations (PISA) in an artificial pancreas. *J Diabetes Sci Technol* 8(6):1091–1096. [DOI](https://doi.org/10.1177/1932296814553267) (PubMed)
12. Dexcom Canada. Using Dexcom G6 Trend Arrows. https://s3-us-west-2.amazonaws.com/dexcommisc/Canada+HCP/Using+the+Trend+Arrows_with+ranges_ENGLISH.pdf
13. American Diabetes Association (2026). Standards of Care in Diabetes, section 6: Glycemic Goals, Hypoglycemia, and Hyperglycemic Crises. *Diabetes Care* 49(Suppl. 1):S132. https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927/

### Exercise

14. Tsalikian E, Mauras N, Beck RW, et al. (Diabetes Research in Children Network, DirecNet) (2005). Impact of exercise on overnight glycemic control in children with type 1 diabetes mellitus. *J Pediatr* 147(4):528–534. [DOI](https://doi.org/10.1016/j.jpeds.2005.04.065) (PubMed)
15. Taplin CE, Cobry E, Messer L, McFann K, Chase HP, Fiallo-Scharer R (2010). Preventing post-exercise nocturnal hypoglycemia in children with type 1 diabetes. *J Pediatr* 157(5):784–788. [DOI](https://doi.org/10.1016/j.jpeds.2010.06.004) (PubMed)
16. Dalla Man C, Breton MD, Cobelli C (2009). Physical activity into the meal glucose-insulin model of type 1 diabetes: in silico studies. *J Diabetes Sci Technol* 3(1):56–67. [DOI](https://doi.org/10.1177/193229680900300107) (PubMed)
17. Breton MD (2008). Physical activity – the major unaccounted impediment to closed loop control. *J Diabetes Sci Technol* 2(1):169–174. [DOI](https://doi.org/10.1177/193229680800200127) (PubMed)

### Fat and protein

18. Wolpert HA, Atakov-Castillo A, Smith SA, Steil GM (2013). Dietary fat acutely increases glucose concentrations and insulin requirements in patients with type 1 diabetes. *Diabetes Care* 36(4):810–816. [DOI](https://doi.org/10.2337/dc12-0092) (PubMed)
19. Paterson MA, Smart CEM, Lopez PE, et al. (2016). Influence of dietary protein on postprandial blood glucose levels in individuals with type 1 diabetes mellitus using intensive insulin therapy. *Diabet Med* 33(5):592–598. [DOI](https://doi.org/10.1111/dme.13011) (PubMed)
20. Smart CEM, Evans M, O'Connell SM, et al. (2013). Both dietary protein and fat increase postprandial glucose excursions in children with type 1 diabetes, and the effect is additive. *Diabetes Care* 36(12):3897–3902. [DOI](https://doi.org/10.2337/dc13-1195) (PubMed)
21. O'Connell SM, O'Toole NMA, Cronin CN, et al. (2021). Does dietary fat cause a dose dependent glycemic response in youth with type 1 diabetes? *Pediatr Diabetes* 22(8):1108–1114. [DOI](https://doi.org/10.1111/pedi.13273) (PubMed)
22. Paterson M, Bell KJ, O'Connell SM, Smart CE, Shafat A, King B (2015). The role of dietary protein and fat in glycaemic control in type 1 diabetes: implications for intensive diabetes management. *Curr Diab Rep* 15(9):61. [DOI](https://doi.org/10.1007/s11892-015-0630-5)
23. Lupoli R, Pisano F, Capaldo B (2019). Postprandial glucose control in type 1 diabetes: importance of the gastric emptying rate. *Nutrients* 11(7):1559. [DOI](https://doi.org/10.3390/nu11071559)
24. Faggionato E, Schiavon M, Ekhlaspour L, et al., Dalla Man C (2026). Quantifying the effect of fat and protein on the postprandial glucose excursion in individuals with type 1 diabetes using an automated insulin delivery system. *J Diabetes Sci Technol*, OnlineFirst. [DOI](https://doi.org/10.1177/19322968261440943)
25. Cai Y, et al. (2023). The effect of the modified fat-protein unit algorithm … a randomized crossover trial. *Nutr Metab* 20:43. [DOI](https://doi.org/10.1186/s12986-023-00757-w)
26. Margaritis K, et al. (2025). Dietary fat and protein intake and their impact on glycemic control in pediatric type 1 diabetes: a narrative review. *Children* 12:1664. [DOI](https://doi.org/10.3390/children12121664)

### Children (researched, not adopted)

27. Wilinska ME, Chassin LJ, Acerini CL, Allen JM, Dunger DB, Hovorka R (2010). Simulation environment to evaluate closed-loop insulin delivery systems in type 1 diabetes. *J Diabetes Sci Technol* 4(1):132–144. [DOI](https://doi.org/10.1177/193229681000400117) (PubMed)
28. Félix et al. (2022). ETH model with exercise, five children from the DiaActive study. *PLOS Comput Biol*. [DOI](https://doi.org/10.1371/journal.pcbi.1010289)
29. Statistical virtual population with exercise (2019). *PLOS ONE*. [DOI](https://doi.org/10.1371/journal.pone.0217301)

### Law

30. Regulation (EU) 2017/745 on medical devices (MDR), Art. 2(1).
31. MDCG 2019-11 rev.1 (June 2025): Guidance on qualification and classification of software in Regulation (EU) 2017/745 – MDR and Regulation (EU) 2017/746 – IVDR. https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf
32. Directive (EU) 2024/2853 on liability for defective products, Art. 2(2).
33. GNU General Public License v3. https://www.gnu.org/licenses/gpl-3.0.html
34. Munich Regional Court I (LG München I), judgment of 20 January 2022, ref. 3 O 17493/20 (Google Fonts).
35. GitHub Docs: About GitHub Pages; GitHub General Privacy Statement. https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages

### Interface

36. Embla Carousel, DragHandler and DragTracker. https://github.com/davidjerleke/embla-carousel
37. Swiper, touch events (onTouchStart, onTouchMove, onTouchEnd). https://github.com/nolimits4web/swiper
38. W3C Pointer Events, section "Implicit pointer capture". https://www.w3.org/TR/pointerevents/

### Project documentation

All numbers, derivations and test records are covered in more detail, in German, in the [project folder docs/](https://github.com/NojoMcDybo/nebel/tree/main/docs): changelog and consistency review (00), audience (05), real-time mode (06), paediatrics (07), needs (08), people (09), engine specification (10), fat and protein (11), parameter register (20), legal assessment (30).
