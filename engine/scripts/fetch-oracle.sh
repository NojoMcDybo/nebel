#!/usr/bin/env bash
# Holt die GPL-lizenzierte Referenzimplementierung py-mgipsim.
#  - Testorakel fuer die Engine (tests/, scripts/oracle_reference.py)
#  - Quelle der zehn Parametersaetze, die die veroeffentlichte Seite als eigene
#    Datei unter GPL-3.0 mitliefert (dist/site/personen-daten.js)
# Wird NICHT ins Repo uebernommen (vendor/ ist gitignored).
#
# Festgehalten auf einen Commit, damit die Seite nicht still andere Koerper
# bekommt, wenn sich der Datensatz oben aendert. Neuer Stand: REF und
# PATIENTS_SHA256 bewusst gemeinsam aendern und die Registry nachziehen.
#
# Tarball statt git clone: In synchronisierten oder rechtebeschraenkten Ordnern
# scheitert git am Anlegen und Loeschen seiner Lock-Dateien.
set -euo pipefail

REF="${PYMGIPSIM_REF:-b985f8c2ea385d1b2b8480957b730866e07772f1}"   # main, 25.02.2026
PATIENTS_SHA256="c0f024725fdf3b39d6944931840426e7e23dc00add15fcd300f32f9e038c0185"
PATIENTS="vendor/py-mgipsim/pymgipsim/VirtualPatient/Models/T1DM/ExtHovorka/Patients"

check_patients() {
  local got
  got="$(cd "$PATIENTS" && sha256sum Patient_*.json | sort -k2 | sha256sum | cut -d' ' -f1)"
  if [ "$got" != "$PATIENTS_SHA256" ]; then
    echo "Parametersaetze weichen vom festgehaltenen Stand ab ($got)." >&2
    exit 1
  fi
}

mkdir -p vendor
tmp="$(mktemp -d)"
if [ ! -d vendor/py-mgipsim/pymgipsim ]; then
  curl -fsSL -o "$tmp/pm.tar.gz" "https://codeload.github.com/illinoistech-itm/py-mgipsim/tar.gz/$REF"
  tar xzf "$tmp/pm.tar.gz" -C "$tmp"
  src="$(find "$tmp" -maxdepth 1 -type d -name 'py-mgipsim-*' | head -1)"
  mkdir -p vendor/py-mgipsim
  cp -rn "$src"/pymgipsim vendor/py-mgipsim/
  cp -n "$src"/LICENSE vendor/py-mgipsim/LICENSE
  echo "$REF" > vendor/py-mgipsim/REF
  echo "Orakel bereit: vendor/py-mgipsim ($REF)"
else
  echo "Orakel bereits vorhanden: vendor/py-mgipsim"
fi
# Aeltere Abrufe hatten den Lizenztext nicht mitgenommen. Die Seite braucht ihn.
if [ ! -f vendor/py-mgipsim/LICENSE ]; then
  curl -fsSL -o vendor/py-mgipsim/LICENSE "https://raw.githubusercontent.com/illinoistech-itm/py-mgipsim/$REF/LICENSE"
  echo "Lizenztext nachgeholt."
fi
[ -f vendor/py-mgipsim/REF ] || echo "$REF" > vendor/py-mgipsim/REF
check_patients
echo "Parametersaetze geprueft: Stand $REF"
