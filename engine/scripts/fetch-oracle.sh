#!/usr/bin/env bash
# Holt die GPL-lizenzierte Referenzimplementierung als Testorakel.
# Wird NICHT ins Repo uebernommen (vendor/ ist gitignored).
#
# Tarball statt git clone: In synchronisierten oder rechtebeschraenkten Ordnern
# scheitert git am Anlegen und Loeschen seiner Lock-Dateien.
set -euo pipefail
mkdir -p vendor
if [ -d vendor/py-mgipsim/pymgipsim ]; then
  echo "Orakel bereits vorhanden: vendor/py-mgipsim"
  exit 0
fi
tmp="$(mktemp -d)"
curl -sL -o "$tmp/pm.tar.gz" https://codeload.github.com/illinoistech-itm/py-mgipsim/tar.gz/refs/heads/main
tar xzf "$tmp/pm.tar.gz" -C "$tmp"
mkdir -p vendor/py-mgipsim
cp -rn "$tmp"/py-mgipsim-main/pymgipsim vendor/py-mgipsim/
echo "Orakel bereit: vendor/py-mgipsim"
