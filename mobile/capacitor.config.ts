import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.nojo.nebel",
  appName: "nebel.",
  webDir: "www",
  ios: { backgroundColor: "#0A0D0D" },   // kein weisser Blitz zwischen Startbild und Seite
};

export default config;
