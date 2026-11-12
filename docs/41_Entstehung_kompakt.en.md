# nebel. in brief

*Short version, as of 10 November 2026.*

## What it is

nebel. is a type 1 diabetes simulator that runs in the browser. It is meant for the family and friends of people with type 1 diabetes. You spend a day in the body of a made-up person: eating, giving insulin, moving, sleeping. All the while you rely on a sensor reading that is never quite right. nebel. tries to show what this everyday life feels like. It is not meant for therapy. The app is available in German at https://nojomcdybo.github.io/nebel/ and in English at https://nojomcdybo.github.io/nebel/en/.

nebel. is a learning system and not a medical device. It has no bolus calculator, gives no dosing advice and does not accept your own values.

nebel. wants to get five things across that are hard to see from the outside:

1. The load never stops, even when nothing is happening.
2. Decisions take effect late, and you make them without knowing everything.
3. The number on the display is not the body.
4. Doing the same thing twice does not give the same result twice.
5. Exercise does not simply lower glucose. Hard exercise can even raise it.

## How it came about

- **September 2026: concept and prototype.** It started with a clickable prototype and three concept documents. A review showed that the first set of equations mixed three different model families.
- **A published model instead of a home-made one.** Since then nebel. has run on the extended Hovorka model from Ali Cinar's group at the Illinois Institute of Technology. The model handles exercise through heart rate, and it comes with 20 published virtual patients.
- **Check first, then extend.** nebel.'s own implementation was compared number by number with the open reference library py-mgipsim. The differences are on the order of rounding errors. More than 140 automated tests keep it that way.
- **Correct where there is evidence.** In three places the source values did not match the prescribing information and the studies: insulin acted too slowly, the sensor lagged too far behind, and the effect of exercise was gone after minutes instead of many hours. These three places are calibrated against studies and documented one by one.
- **Own layers.** The source model has no sensor, no pump and no everyday life. nebel. built these parts itself and labels them as such.
- **October 2026: publication.** After a legal assessment and with the consent of the authors of the reference library, nebel. has been public since 28 October, under an open-source licence and with no commercial intent.
- **November 2026: polish.** Reserves and hunger, a consistent exercise system, the long aftereffect of exercise and a new swipe gesture for the iPhone.

## What the simulation takes into account

**Food.** Fast and slow carbohydrates, how long you take to eat, fat and protein. Fat slows absorption and weakens insulin for hours. Protein adds extra glucose hours later. What you actually ate differs from your estimate.

**Insulin.** Bolus, extended bolus, basal rate, temporary basal rate and pump suspend. Insulin starts working after a few minutes, peaks after about an hour, and its effect is over after three to four hours.

**Exercise.** Everyday activity and announced training. Moderate exercise lowers the value, hard exercise can raise it. Afterwards insulin works more strongly for many hours, often into the night.

**The body.** Ten people, each with their own model values. The same action works differently for each of them, most clearly with exercise.

**The sensor.** It measures with a delay, and every sensor is off in its own way. On the first day and during exercise it is noisier. If you lie on the sensor at night, you may see a low that is not really there. Only the look back shows whether a drop was real.

**Everyday life.** The person gets hungry and needs reserves. If you like, the simulation runs in real time and gets in touch at night too. The review shows what your decisions will still do over the next hours.

Not taken into account: time of day, stress, illness, sleep, alcohol and the menstrual cycle. All ten people are adults.

## Key decisions

- **No dosing help and no real data.** This is intended for teaching reasons, and it also marks the line to a medical device.
- **Made-up people, real model bodies.** Names, ages and looks are invented. The physiology comes from published data sets.
- **No children.** There is no suitable published data set, and scaling adult values would be guesswork.
- **No score.** A good day is allowed to look boring.
- **Every number has a source.** Anything without a source is marked as an assumption in the documentation, and so are open questions.
- **Data minimal.** No cookies, no tracking, no fonts from other servers. Your progress stays in the browser.

## Limits

nebel. shows orders of magnitude and how things connect. It predicts nothing for a real person. Some of the studies used for calibration looked at children and adolescents. Some effects come out too strong or too weak, for example pure fat or the very strong exercise response of a few people. For your own therapy, your diabetes team is always the one to ask.

## Sources

1. Hovorka R, et al. (2004). Nonlinear model predictive control of glucose concentration in subjects with type 1 diabetes. *Physiol Meas* 25(4):905–920. [DOI](https://doi.org/10.1088/0967-3334/25/4/010)
2. Rashid M, et al., Cinar A (2019). Simulation software for assessment of nonlinear and adaptive multivariable control algorithms: Glucose–insulin dynamics in type 1 diabetes. *Comput Chem Eng* 130:106565. [DOI](https://doi.org/10.1016/j.compchemeng.2019.106565)
3. Siket M, Rashid MM, Cinar A (2025). py-mgipsim: An open-source Python library for simulating type 1 diabetes with diverse meals and physical activities. *J Diabetes Sci Technol* 19(3):855–856. [DOI](https://doi.org/10.1177/19322968251328664) · https://github.com/illinoistech-itm/py-mgipsim
4. Summary of Product Characteristics, NovoRapid PumpCart (insulin aspart), sections 5.1 and 5.2. https://www.medicines.org.uk/emc/product/7922/smpc
5. Tauschmann M, et al. (2022). ISPAD Clinical Practice Consensus Guidelines 2022: Diabetes technologies: Glucose monitoring. *Pediatr Diabetes* 23(8):1390–1405. [DOI](https://doi.org/10.1111/pedi.13451)
6. Vettoretti M, et al. (2019). Development of an error model for a factory-calibrated continuous glucose monitoring sensor with 10-day lifetime. *Sensors* 19(23):5320. [DOI](https://doi.org/10.3390/s19235320)
7. Mensh BD, et al. (2013). Susceptibility of interstitial continuous glucose monitor performance to sleeping position. *J Diabetes Sci Technol* 7(4):863–870. [DOI](https://doi.org/10.1177/193229681300700408)
8. Tsalikian E, et al. (DirecNet) (2005). Impact of exercise on overnight glycemic control in children with type 1 diabetes mellitus. *J Pediatr* 147(4):528–534. [DOI](https://doi.org/10.1016/j.jpeds.2005.04.065)
9. Dalla Man C, Breton MD, Cobelli C (2009). Physical activity into the meal glucose-insulin model of type 1 diabetes: in silico studies. *J Diabetes Sci Technol* 3(1):56–67. [DOI](https://doi.org/10.1177/193229680900300107)
10. Wolpert HA, et al. (2013). Dietary fat acutely increases glucose concentrations and insulin requirements in patients with type 1 diabetes. *Diabetes Care* 36(4):810–816. [DOI](https://doi.org/10.2337/dc12-0092)
11. Paterson MA, et al. (2016). Influence of dietary protein on postprandial blood glucose levels in individuals with type 1 diabetes mellitus using intensive insulin therapy. *Diabet Med* 33(5):592–598. [DOI](https://doi.org/10.1111/dme.13011)
12. Smart CEM, et al. (2013). Both dietary protein and fat increase postprandial glucose excursions in children with type 1 diabetes, and the effect is additive. *Diabetes Care* 36(12):3897–3902. [DOI](https://doi.org/10.2337/dc13-1195)
13. Regulation (EU) 2017/745 (MDR) and MDCG 2019-11 rev.1 (June 2025) on the qualification of software. https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf

The detailed version with every decision, number and source: [nebel. in detail](40_Entstehung_ausfuehrlich.en.md).
