# Nebel — Echtzeit-Modus

Stand: 2026-09-22. Anforderung an Engine und Persistenz, nicht an die Oberfläche.

## Was der Modus ist

Nebel läuft über einen echten Tag mit: eine Minute Simulationszeit entspricht einer Minute Realzeit. Der Nutzer trägt den simulierten Diabetes durch seinen eigenen Alltag — mit Handy in der Tasche, mit Benachrichtigungen, mit einer Nacht dazwischen.

Damit löst sich der Zielkonflikt aus `05_Zielgruppe_und_Lernziele.md`: Lernziel 1 ist die **passive Dauerbelastung**, und die lässt sich in einer Zehn-Minuten-Sitzung nicht vermitteln. Sie entsteht dadurch, dass der Simulator nicht aufhört, wenn man wegschaut. Der Echtzeit-Modus ist deshalb kein Zusatzfeature, sondern der Träger des wichtigsten Lernziels.

Zwei Betriebsarten derselben Engine:

| Modus | Zeitverhältnis | Zweck |
|---|---|---|
| Echtzeit | 1:1, an die Uhr gekoppelt | Der eigentliche Erfahrungsmodus |
| Sandbox / Analyse | beliebig schnell, frei spulbar | Verlauf nachvollziehen, Alternativen durchspielen |

## Konsequenzen für die Engine

### 1. Nachholintegration statt Dauerlauf
Der Browser läuft nicht durch. Tab geschlossen, Handy gesperrt, Akku leer — die Engine rechnet dann nicht. Beim nächsten Öffnen muss von der letzten integrierten Minute bis jetzt nachgerechnet werden.

Das funktioniert nur, weil die Engine deterministisch und ereignisbasiert ist: **Zustand + Eventliste + Ankerzeit + Seed** genügen, um jeden Zeitpunkt zu rekonstruieren. 1440 Schritte pro Tag sind rechnerisch nichts; acht Stunden Nachholen sind 480 Schritte und laufen in Millisekunden.

### 2. Der Zufallsgenerator muss zählerbasiert sein
Ein zustandstragender PRNG liefert nach einer Nachholintegration eine andere Folge als beim Durchlaufen. Damit wäre der angezeigte Verlauf davon abhängig, wie oft der Nutzer die App geöffnet hat — inakzeptabel.

**Regel:** Das Sensorrauschen wird aus `(seed, schrittIndex)` berechnet, nicht aus einem fortgeschriebenen Generatorzustand. Dann ist jede Minute unabhängig reproduzierbar, egal in welchen Häppchen gerechnet wurde.

### 3. Der Echtzeitlauf ist append-only
Ereignisse dürfen nur in der Gegenwart oder Zukunft eingetragen werden. Ein nachträglich eingefügter Bolus um 14:00 Uhr würde einen Verlauf ändern, den der Nutzer bereits gesehen hat.

Die Sandbox arbeitet deshalb immer auf einer **Kopie** der Sitzung. „Was wäre gewesen, wenn ich früher gebolust hätte" verändert nie den echten Lauf. Das ist zugleich die technische Grundlage des Analyse-Screens.

### 4. Die Uhr ist nicht vertrauenswürdig
Systemzeit kann springen, Zeitzonen wechseln, Sommerzeit umstellen. Der Anker ist ein Zeitstempel in Epoch-Millisekunden; die Simulationsminute ergibt sich als Differenz. Eine rückwärts laufende Uhr darf nie negative Schritte erzeugen — dann wird nicht integriert, sondern gewartet.

### 5. Persistenz
Gespeichert werden: Ankerzeitpunkt, Seed, Subjekt-ID, Zustandsvektor zum Anker, vollständige Eventliste, letzte integrierte Minute. Das ist klein und passt in `localStorage`. Die Verlaufsspur selbst wird **nicht** gespeichert, sondern bei Bedarf neu gerechnet — sie ist aus den fünf Angaben exakt rekonstruierbar. Wer sie trotzdem cachen will, nimmt IndexedDB.

## Die Nacht

Für Angehörige ist die Nacht der wichtigste Teil. Die Hypo-Angst um 3 Uhr ist das, was niemand von außen sieht. Eine Nacht, die beim Aufwachen nur nachgerechnet und als fertige Kurve präsentiert wird, vermittelt davon nichts.

**Anforderung:** Benachrichtigungen bei Alarmgrenzen, auch nachts, standardmäßig an und jederzeit abschaltbar. Das Handy, das um 3:12 Uhr klingelt, ist die ehrlichste Stelle des ganzen Projekts.

Gegengewicht: Nebel darf niemandem den Schlaf ruinieren. Der Nachtmodus wird vor dem Start ausdrücklich abgefragt, nicht stillschweigend aktiviert, und der Simulator sagt vorher, was passieren wird.

## Offene Produktentscheidung: läuft der Alltag ohne den Nutzer weiter?

Wenn der Nutzer sechs Stunden nichts einträgt, gibt es zwei mögliche Verhaltensweisen:

| Option | Verhalten | Wirkung |
|---|---|---|
| **A — passiv** | Ohne Eingabe isst die simulierte Person nichts. Glukose driftet nur über Basal und EGP | Ehrlich in der Zuschreibung, aber langweilig und unrealistisch. Wer wegschaut, wird belohnt |
| **B — Tagesplan** | Ein vorgegebener Tagesablauf mit Mahlzeiten und Aktivität läuft weiter; der Nutzer muss darauf reagieren | Erzeugt genau die Dauerbelastung, um die es geht. Wegschauen hat Folgen |

Empfehlung: **B**, mit einem Tagesplan, der zwischen den Durchläufen variiert, damit Lernziel 4 (Variabilität) nicht durch auswendig gelernte Abläufe kaputtgeht. Der Plan gehört in die Szenarioschicht, nicht in die Engine — die Engine sieht nur Events.

**Entschieden am 22.09.2026 — keine der beiden Optionen, sondern ein Bedürfnismodell.** Die simulierte Person wird hungrig; der Nutzer muss reagieren, auch in die positive Richtung. Damit läuft nichts hinter seinem Rücken ab, und Wegschauen hat trotzdem Folgen. Siehe `08_Beduerfnisse_und_Hunger.md`. Ein Tagesplan bleibt optional für geführte Szenarien.

**Präzisiert am 24.09.2026 (W13):** Das gilt für Mahlzeiten. Bewegung kommt wie im Prototyp aus einem Tagesplan — Training angekündigt, Alltagsbewegung ohne Ankündigung. Zur Bestätigung offen.

Die Engine bleibt davon unberührt: sie bekommt Events, egal wer sie erzeugt hat.

## Was das für die Validierung heißt

Zwei zusätzliche Testfälle über die Matrix in `10_Engine_Spec_V2` hinaus:

| Test | Erwartung |
|---|---|
| Nachholen ist äquivalent | Ein 24-h-Lauf am Stück und derselbe Lauf in beliebig vielen Teilstücken liefern bitgleich dasselbe Ergebnis |
| Serialisierung ist verlustfrei | Zustand speichern, laden, weiterrechnen ergibt denselben Verlauf wie ohne Unterbrechung |

Beide stehen in `engine/tests/realtime.test.ts` und sind rot, bis `realtime.ts` gebaut ist.
