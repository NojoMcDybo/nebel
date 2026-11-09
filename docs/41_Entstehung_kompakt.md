# nebel. kompakt

*Kurzfassung, Stand 10.11.2026.*

## Worum es geht

nebel. ist ein Simulator für Typ-1-Diabetes, der im Browser läuft. Er ist für Angehörige und Freunde von Menschen mit Typ-1-Diabetes gedacht. Man verbringt einen Tag im Körper einer erfundenen Person: essen, Insulin geben, sich bewegen, schlafen. Dabei verlässt man sich auf einen Sensorwert, der nie ganz stimmt. nebel. soll zeigen, wie sich dieser Alltag anfühlt. Für die Therapie ist es nicht gedacht. Die App gibt es auf Deutsch unter https://nojomcdybo.github.io/nebel/ und auf Englisch unter https://nojomcdybo.github.io/nebel/en/.

nebel. ist ein Lernsystem und kein Medizinprodukt. Es hat keinen Bolusrechner, gibt keine Dosierungsempfehlung und nimmt keine eigenen Werte an.

Fünf Dinge soll nebel. zeigen, die man von außen kaum sieht:

1. Die Belastung hört nie auf, auch wenn gerade nichts passiert.
2. Entscheidungen wirken verzögert, und man trifft sie, ohne alles zu wissen.
3. Die Zahl auf dem Display ist nicht der Körper.
4. Wer zweimal dasselbe tut, bekommt nicht zweimal dasselbe Ergebnis.
5. Bewegung senkt den Zucker nicht einfach. Harte Belastung kann ihn sogar heben.

## Wie es entstanden ist

- **September 2026: Konzept und Prototyp.** Am Anfang standen ein klickbarer Prototyp und drei Konzeptdokumente. Bei der Prüfung stellte sich heraus, dass die erste Gleichungssammlung drei verschiedene Modellfamilien vermischte.
- **Ein veröffentlichtes Modell statt eines eigenen.** Seitdem rechnet nebel. mit dem erweiterten Hovorka-Modell aus der Arbeitsgruppe von Ali Cinar am Illinois Institute of Technology. Das Modell bildet Bewegung über die Herzfrequenz ab, und dazu gibt es 20 veröffentlichte virtuelle Patienten.
- **Erst prüfen, dann erweitern.** Die eigene Umsetzung wurde Zahl für Zahl mit der offenen Referenzbibliothek py-mgipsim verglichen. Die Abweichungen liegen in der Größenordnung von Rundungsfehlern. Über 140 automatische Tests halten das fest.
- **Korrigieren, wo es Belege gibt.** An drei Stellen passten die Quellwerte nicht zu Fachinformation und Studien: Das Insulin wirkte zu träge, der Sensor hinkte zu weit hinterher, und die Wirkung von Sport war nach Minuten vorbei statt nach vielen Stunden. Diese Stellen sind an Studien kalibriert und einzeln dokumentiert.
- **Eigene Schichten.** Sensor, Pumpe und Alltag kommen im Quellmodell nicht vor. Diese Teile hat nebel. selbst gebaut und kennzeichnet sie auch so.
- **Oktober 2026: Veröffentlichung.** Nach einer rechtlichen Einordnung und mit Zustimmung der Autoren der Referenzbibliothek ist nebel. seit dem 28.10. öffentlich, unter einer Open-Source-Lizenz und ohne kommerzielle Absicht.
- **November 2026: Feinschliff.** Reserven und Hunger, ein abgestimmtes Bewegungssystem, die lange Nachwirkung von Sport und eine neue Wischgeste fürs iPhone.

## Was die Simulation berücksichtigt

**Essen.** Schnelle und langsame Kohlenhydrate, wie lange man isst, Fett und Eiweiß. Fett verzögert die Aufnahme und schwächt das Insulin über Stunden. Eiweiß liefert Stunden später zusätzlichen Zucker. Was man wirklich gegessen hat, weicht von der Schätzung ab.

**Insulin.** Bolus, verzögerter Bolus, Basalrate, temporäre Basalrate und Pumpenpause. Insulin wirkt nach einigen Minuten, am stärksten nach etwa einer Stunde, und nach drei bis vier Stunden ist die Wirkung vorbei.

**Bewegung.** Alltagsbewegung und angekündigtes Training. Moderate Belastung senkt den Wert, harte kann ihn heben. Danach wirkt Insulin viele Stunden lang stärker, oft bis in die Nacht.

**Der Körper.** Zehn Personen, jede mit eigenen Modellwerten. Dieselbe Handlung wirkt bei jeder anders, beim Sport besonders deutlich.

**Der Sensor.** Er misst verzögert, und jeder Sensor liegt etwas anders daneben. Am ersten Tag und bei Bewegung rauscht er stärker. Wer nachts auf dem Sensor liegt, sieht womöglich einen Unterzucker, den es gar nicht gibt. Ob ein Abfall echt war, zeigt erst der Rückblick.

**Der Alltag.** Die Person wird hungrig und braucht Reserven. Auf Wunsch läuft die Simulation in Echtzeit mit und meldet sich auch nachts. Die Auswertung zeigt, was die eigenen Entscheidungen in den nächsten Stunden noch bewirken.

Nicht berücksichtigt sind Tageszeit, Stress, Krankheit, Schlaf, Alkohol und Zyklus. Alle zehn Personen sind Erwachsene.

## Wichtige Entscheidungen

- **Keine Dosierungshilfe und keine echten Daten.** Das ist pädagogisch so gewollt und zieht zugleich die Grenze zum Medizinprodukt.
- **Erfundene Menschen, echte Modellkörper.** Namen, Alter und Aussehen sind ausgedacht. Die Physiologie stammt aus veröffentlichten Datensätzen.
- **Keine Kinder.** Es gibt keinen passenden veröffentlichten Datensatz, und Erwachsenenwerte hochzurechnen wäre Raten.
- **Kein Punktestand.** Ein guter Tag darf langweilig aussehen.
- **Jede Zahl mit Quelle.** Was keine Quelle hat, steht als Annahme gekennzeichnet in der Dokumentation, offene Fragen ebenso.
- **Datensparsam.** Keine Cookies, kein Tracking, keine Schriften von fremden Servern. Der Spielstand bleibt im Browser.

## Grenzen

nebel. zeigt Größenordnungen und Zusammenhänge. Für einen echten Menschen sagt es nichts voraus. Einige Studien, an denen kalibriert wurde, haben Kinder und Jugendliche untersucht. Manche Wirkungen fallen zu stark oder zu schwach aus, etwa bei reinem Fett oder bei der sehr starken Sportreaktion einzelner Personen. Für die eigene Therapie ist immer das Diabetesteam zuständig.

## Quellen

1. Hovorka R, et al. (2004). Nonlinear model predictive control of glucose concentration in subjects with type 1 diabetes. *Physiol Meas* 25(4):905–920. [DOI](https://doi.org/10.1088/0967-3334/25/4/010)
2. Rashid M, et al., Cinar A (2019). Simulation software for assessment of nonlinear and adaptive multivariable control algorithms: Glucose–insulin dynamics in type 1 diabetes. *Comput Chem Eng* 130:106565. [DOI](https://doi.org/10.1016/j.compchemeng.2019.106565)
3. Siket M, Rashid MM, Cinar A (2025). py-mgipsim: An open-source Python library for simulating type 1 diabetes with diverse meals and physical activities. *J Diabetes Sci Technol* 19(3):855–856. [DOI](https://doi.org/10.1177/19322968251328664) · https://github.com/illinoistech-itm/py-mgipsim
4. Fachinformation NovoRapid PumpCart (Insulin aspart), Abschnitte 5.1 und 5.2. https://www.medicines.org.uk/emc/product/7922/smpc
5. Tauschmann M, et al. (2022). ISPAD Clinical Practice Consensus Guidelines 2022: Diabetes technologies: Glucose monitoring. *Pediatr Diabetes* 23(8):1390–1405. [DOI](https://doi.org/10.1111/pedi.13451)
6. Vettoretti M, et al. (2019). Development of an error model for a factory-calibrated continuous glucose monitoring sensor with 10-day lifetime. *Sensors* 19(23):5320. [DOI](https://doi.org/10.3390/s19235320)
7. Mensh BD, et al. (2013). Susceptibility of interstitial continuous glucose monitor performance to sleeping position. *J Diabetes Sci Technol* 7(4):863–870. [DOI](https://doi.org/10.1177/193229681300700408)
8. Tsalikian E, et al. (DirecNet) (2005). Impact of exercise on overnight glycemic control in children with type 1 diabetes mellitus. *J Pediatr* 147(4):528–534. [DOI](https://doi.org/10.1016/j.jpeds.2005.04.065)
9. Dalla Man C, Breton MD, Cobelli C (2009). Physical activity into the meal glucose-insulin model of type 1 diabetes: in silico studies. *J Diabetes Sci Technol* 3(1):56–67. [DOI](https://doi.org/10.1177/193229680900300107)
10. Wolpert HA, et al. (2013). Dietary fat acutely increases glucose concentrations and insulin requirements in patients with type 1 diabetes. *Diabetes Care* 36(4):810–816. [DOI](https://doi.org/10.2337/dc12-0092)
11. Paterson MA, et al. (2016). Influence of dietary protein on postprandial blood glucose levels in individuals with type 1 diabetes mellitus using intensive insulin therapy. *Diabet Med* 33(5):592–598. [DOI](https://doi.org/10.1111/dme.13011)
12. Smart CEM, et al. (2013). Both dietary protein and fat increase postprandial glucose excursions in children with type 1 diabetes, and the effect is additive. *Diabetes Care* 36(12):3897–3902. [DOI](https://doi.org/10.2337/dc13-1195)
13. Verordnung (EU) 2017/745 (MDR) und MDCG 2019-11 zur Einordnung von Software. https://health.ec.europa.eu/system/files/2020-09/md_mdcg_2019_11_guidance_en_0.pdf

Die ausführliche Fassung mit allen Entscheidungen, Zahlen und Quellen: [nebel. ausführlich](40_Entstehung_ausfuehrlich.md).
