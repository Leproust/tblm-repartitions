function onOpen() {

    SpreadsheetApp.getUi()

        .createMenu("🎾 Répartition Tennis")

        .addItem("Calculer les groupes","calculer")

        .addSeparator()

        .addItem("Statistiques","genererStatistiques")

        .addSeparator()

        .addItem("Réinitialiser","reinitialiser")

        .addToUi();

}
