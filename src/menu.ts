/**
 * ===========================================================
 * MENU GOOGLE SHEETS
 * ===========================================================
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎾 Répartition Tennis")
    .addItem("▶ Calculer la répartition", "lancerRepartition")
    .addItem("✔ Valider la répartition", "validerRepartition")
    .addItem("🔁 Rejouer la répartition", "relancerRepartition")
    .addItem("📊 Générer rapport", "lancerRapports")
    .addSeparator()
    .addItem("🔄 Optimiser les groupes", "lancerOptimisation")
    .addItem("📋 Exporter les groupes", "lancerExport")
    .addItem("📊 Générer statistiques", "lancerStatistiques")
    .addItem("📊 Voir les places disponibles", "exporterOccupation")
    .addItem("👤 Voir joueurs sans créneau", "exporterJoueursSansCreneau")
    .addSeparator()
    .addItem("🧪 Diagnostic données", "diagnosticDonnees")
    .addToUi();
}
