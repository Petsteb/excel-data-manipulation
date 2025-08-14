const translations = {
  en: {
    // Header
    appTitle: "Excel File Merger",
    appSubtitle: "",
    remake: "Remake",
    
    // Upload Section
    uploadTitle: "Upload or drag and drop files here",
    uploadDescription: "Click to select Excel files to merge, or drag and drop them here",
    selectExcelFiles: "Select Excel Files",
    addMoreFiles: "Add More Files",
    
    // Uploaded Files Summary
    uploadedFilesSummary: "Summary of uploaded files",
    files: "files",
    totalRows: "total rows", 
    view: "View",
    viewUploadedFiles: "View",
    viewMergedFiles: "View",
    noFilesUploaded: "No files uploaded yet",
    
    // Header and Columns Selection
    headerColumnsSelection: "Header and Columns Selection",
    headerNumberOfRows: "Header number of rows:",
    headerNumberTooltip: "The number of lines that is common at the beginning of all the uploaded files, like the column names.",
    columnsRow: "Columns row:",
    columnsRowTooltip: "The row that contains the name of the columns.",
    uploadFilesToSeePreview: "Upload files to see column preview",
    
    // Date Columns
    dateColumnsTitle: "Columns that will be Formatted as Date",
    dateColumnsFound: "Date Columns Found:",
    dateColumnsTooltip: "Columns that will be automatically changed to date type. You can select or deselect more columns by clicking on 'View Columns'. By default the merge process takes all of the data as general and you can't sort the dates if they are not of date type.",
    andMore: "...and",
    more: "more",
    noDateColumnsDetected: "No date columns detected automatically",
    uploadFilesToDetectDate: "Upload files to detect date columns",
    viewColumns: "View Columns",
    
    // Merge Button
    mergeFiles: "Merge Files",
    processing: "Processing...",
    
    // Summary of Merged Files
    mergedFilesSummary: "Summary of merged files",
    filesMerged: "Files merged:",
    totalDataRows: "Total data rows:",
    commonHeaderRows: "Common header rows:",
    columnHeadersMatch: "Column headers match:",
    download: "Download",
    open: "Open",
    mergedFileSummaryWillAppear: "Merged file summary will appear here after processing",
    
    // Popup Headers
    allUploadedFiles: "All Uploaded Files",
    allColumns: "All Columns - Select/Deselect Date Columns",
    mergedFilesSummaryPopup: "Merged Files Summary",
    
    // Popup Actions
    selectAll: "Select All",
    deselectAll: "Deselect All",
    deleteSelected: "Delete Selected",
    close: "×",
    
    // File Info
    rows: "rows",
    headersMatch: "Headers match",
    headersDiffer: "Headers differ",
    totalFiles: "Total Files:",
    totalRowsPopup: "Total Rows:",
    commonHeaders: "Common Headers:",
    headerMatches: "Header Matches:",
    
    // Column Selection
    auto: "Auto",
    selected: "✅",
    
    // Status Messages
    filesSelected: "Files selected. Reading data...",
    excelFilesLoaded: "Excel files loaded successfully",
    addingFiles: "Adding",
    newFiles: "new files...",
    droppedFiles: "dropped files...",
    filesAdded: "added",
    allSelectedFilesAlreadyUploaded: "All selected files are already uploaded",
    allDroppedFilesAlreadyUploaded: "All dropped files are already uploaded",
    pleaseDropExcelFiles: "Please drop Excel files (.xlsx or .xls)",
    errorProcessingDroppedFiles: "Error processing dropped files:",
    errorSelectingFiles: "Error selecting files:",
    filesRemaining: "files remaining.",
    chooseSaveLocation: "Choosing save location...",
    saveCancel: "Save cancelled",
    mergingFiles: "Merging files...",
    successfullyCreatedMergedFile: "Successfully created merged file:",
    errorMergingFiles: "Error merging files:",
    fileOpenedSuccessfully: "File opened successfully",
    errorOpeningFile: "Error opening file:",
    fileLocationOpened: "File location opened",
    errorAccessingFile: "Error accessing file:",
    pleaseSelectExcelFiles: "Please select Excel files first",
    pleaseEnterValidCommonLines: "Please enter a valid number of common lines (0-100)",
    deletedFiles: "Deleted",
    columnsFound: "columns found",
    autoSelected: "Auto-selected",
    dateColumns: "date column(s).",
    columnsFoundFromRow: "columns found from row",
    errorExtractingColumns: "Error extracting column names:",
    failedToExtractColumns: "Failed to extract column names:",
    loadingExcelMerger: "Loading Excel Merger...",
    error: "Error:",
    
    // Language and Theme
    changeTheme: "Change Theme",
    changeLanguage: "Change Language",
    chooseTheme: "Choose Theme",
    chooseLanguage: "Choose Language",
    lightThemes: "☀️ Light Themes",
    darkThemes: "🌙 Dark Themes"
  },
  
  ro: {
    // Header
    appTitle: "Fuzionare de Fisiere Excel",
    appSubtitle: "",
    remake: "Refă",
    
    // Upload Section
    uploadTitle: "Incarca fisiere sau foloseste Drag and Drop",
    uploadDescription: "Fa clic pentru a selecta fisiere Excel de imbinant sau foloseste Drag and Drop",
    selectExcelFiles: "Selectează Fișiere Excel",
    addMoreFiles: "Adaugă Mai Multe Fișiere",
    
    // Uploaded Files Summary
    uploadedFilesSummary: "Rezumatul fișierelor încărcate",
    files: "fișiere",
    totalRows: "rânduri totale",
    view: "Vezi",
    viewUploadedFiles: "Vezi rezumat fisiere incarcate",
    viewMergedFiles: "Vezi rezumat imbinare fisiere",
    noFilesUploaded: "Nu au fost încărcate fișiere încă",
    
    // Header and Columns Selection
    headerColumnsSelection: "Selecția Antetului și Coloanelor",
    headerNumberOfRows: "Numărul rândurilor de antet:",
    headerNumberTooltip: "Numărul de linii comune la începutul tuturor fișierelor încărcate, cum ar fi numele coloanelor.",
    columnsRow: "Randul care contine capul de coloana:",
    columnsRowTooltip: "Rândul care conține numele coloanelor.",
    uploadFilesToSeePreview: "Încarcă fișiere pentru a vedea previzualizarea coloanelor",
    
    // Date Columns
    dateColumnsTitle: "Coloane care vor fi Formatate ca Dată",
    dateColumnsFound: "Coloane de Dată Găsite:",
    dateColumnsTooltip: "Coloane care vor fi schimbate automat la tipul dată. Poți selecta sau deselecta mai multe coloane făcând clic pe 'Vezi Coloane'. În mod implicit, procesul de îmbinare ia toate datele ca generale și nu poți sorta datele dacă nu sunt de tipul dată.",
    andMore: "...și",
    more: "mai multe",
    noDateColumnsDetected: "Nu au fost detectate automat coloane de dată",
    uploadFilesToDetectDate: "Încarcă fișiere pentru a detecta coloanele de dată",
    viewColumns: "Vezi Coloane",
    
    // Merge Button
    mergeFiles: "Îmbină Fișiere",
    processing: "Se procesează...",
    
    // Summary of Merged Files
    mergedFilesSummary: "Rezumatul fișierelor îmbinate",
    filesMerged: "Fișiere îmbinate:",
    totalDataRows: "Rânduri totale de date:",
    commonHeaderRows: "Rânduri comune de antet:",
    columnHeadersMatch: "Anteturile coloanelor se potrivesc:",
    download: "Descarca fisierul final",
    open: "Deschide fisirul final",
    mergedFileSummaryWillAppear: "Rezumatul fișierului îmbinat va apărea aici după procesare",
    
    // Popup Headers
    allUploadedFiles: "Toate Fișierele Încărcate",
    allColumns: "Toate Coloanele - Selectează/Deselectează Coloanele de Dată",
    mergedFilesSummaryPopup: "Rezumatul Fișierelor Îmbinate",
    
    // Popup Actions
    selectAll: "Selectează Tot",
    deselectAll: "Deselectează Tot",
    deleteSelected: "Șterge Selectate",
    close: "×",
    
    // File Info
    rows: "rânduri",
    headersMatch: "Anteturile se potrivesc",
    headersDiffer: "Anteturile diferă",
    totalFiles: "Fișiere Totale:",
    totalRowsPopup: "Rânduri Totale:",
    commonHeaders: "Antete Comune:",
    headerMatches: "Potriviri Antete:",
    
    // Column Selection
    auto: "Auto",
    selected: "✅",
    
    // Status Messages
    filesSelected: "Fișiere selectate. Se citesc datele...",
    excelFilesLoaded: "Fișiere Excel încărcate cu succes",
    addingFiles: "Se adaugă",
    newFiles: "fișiere noi...",
    droppedFiles: "fișiere trase...",
    filesAdded: "adăugate",
    allSelectedFilesAlreadyUploaded: "Toate fișierele selectate sunt deja încărcate",
    allDroppedFilesAlreadyUploaded: "Toate fișierele trase sunt deja încărcate",
    pleaseDropExcelFiles: "Te rog să tragi fișiere Excel (.xlsx sau .xls)",
    errorProcessingDroppedFiles: "Eroare la procesarea fișierelor trase:",
    errorSelectingFiles: "Eroare la selectarea fișierelor:",
    filesRemaining: "fișiere rămase.",
    chooseSaveLocation: "Se alege locația de salvare...",
    saveCancel: "Salvare anulată",
    mergingFiles: "Se îmbină fișierele...",
    successfullyCreatedMergedFile: "Fișier îmbinat creat cu succes:",
    errorMergingFiles: "Eroare la îmbinarea fișierelor:",
    fileOpenedSuccessfully: "Fișier deschis cu succes",
    errorOpeningFile: "Eroare la deschiderea fișierului:",
    fileLocationOpened: "Locația fișierului deschisă",
    errorAccessingFile: "Eroare la accesarea fișierului:",
    pleaseSelectExcelFiles: "Te rog să selectezi mai întâi fișiere Excel",
    pleaseEnterValidCommonLines: "Te rog să introduci un număr valid de linii comune (0-100)",
    deletedFiles: "Șterse",
    columnsFound: "coloane găsite",
    autoSelected: "Auto-selectate",
    dateColumns: "coloane de dată.",
    columnsFoundFromRow: "coloane găsite din rândul",
    errorExtractingColumns: "Eroare la extragerea numelor coloanelor:",
    failedToExtractColumns: "Eșec la extragerea numelor coloanelor:",
    loadingExcelMerger: "Se încarcă Îmbinătorul Excel...",
    error: "Eroare:",
    
    // Language and Theme
    changeTheme: "Schimbă Tema",
    changeLanguage: "Schimbă Limba",
    chooseTheme: "Alege Tema",
    chooseLanguage: "Alege Limba",
    lightThemes: "☀️ Teme Luminoase",
    darkThemes: "🌙 Teme Întunecate"
  },
  
  fr: {
    // Header
    appTitle: "Fusionneur de Fichiers Excel",
    appSubtitle: "",
    remake: "Refaire",
    
    // Upload Section
    uploadTitle: "Téléchargez ou glissez-déposez les fichiers ici",
    uploadDescription: "Cliquez pour sélectionner des fichiers Excel à fusionner ou glissez-les ici",
    selectExcelFiles: "Sélectionner Fichiers Excel",
    addMoreFiles: "Ajouter Plus de Fichiers",
    
    // Uploaded Files Summary
    uploadedFilesSummary: "Résumé des fichiers téléchargés",
    files: "fichiers",
    totalRows: "lignes totales",
    view: "Voir",
    viewUploadedFiles: "Voir",
    viewMergedFiles: "Voir",
    noFilesUploaded: "Aucun fichier téléchargé pour le moment",
    
    // Header and Columns Selection
    headerColumnsSelection: "Sélection d'En-tête et de Colonnes",
    headerNumberOfRows: "Nombre de lignes d'en-tête:",
    headerNumberTooltip: "Le nombre de lignes communes au début de tous les fichiers téléchargés, comme les noms de colonnes.",
    columnsRow: "Ligne des colonnes:",
    columnsRowTooltip: "La ligne qui contient le nom des colonnes.",
    uploadFilesToSeePreview: "Téléchargez des fichiers pour voir l'aperçu des colonnes",
    
    // Date Columns
    dateColumnsTitle: "Colonnes qui seront Formatées comme Date",
    dateColumnsFound: "Colonnes de Date Trouvées:",
    dateColumnsTooltip: "Colonnes qui seront automatiquement changées au type date. Vous pouvez sélectionner ou désélectionner plus de colonnes en cliquant sur 'Voir Colonnes'. Par défaut, le processus de fusion prend toutes les données comme générales et vous ne pouvez pas trier les dates si elles ne sont pas de type date.",
    andMore: "...et",
    more: "de plus",
    noDateColumnsDetected: "Aucune colonne de date détectée automatiquement",
    uploadFilesToDetectDate: "Téléchargez des fichiers pour détecter les colonnes de date",
    viewColumns: "Voir Colonnes",
    
    // Merge Button
    mergeFiles: "Fusionner Fichiers",
    processing: "Traitement...",
    
    // Summary of Merged Files
    mergedFilesSummary: "Résumé des fichiers fusionnés",
    filesMerged: "Fichiers fusionnés:",
    totalDataRows: "Lignes de données totales:",
    commonHeaderRows: "Lignes d'en-tête communes:",
    columnHeadersMatch: "Les en-têtes de colonnes correspondent:",
    download: "Télécharger",
    open: "Ouvrir",
    mergedFileSummaryWillAppear: "Le résumé du fichier fusionné apparaîtra ici après traitement",
    
    // Popup Headers
    allUploadedFiles: "Tous les Fichiers Téléchargés",
    allColumns: "Toutes les Colonnes - Sélectionner/Désélectionner les Colonnes de Date",
    mergedFilesSummaryPopup: "Résumé des Fichiers Fusionnés",
    
    // Popup Actions
    selectAll: "Tout Sélectionner",
    deselectAll: "Tout Désélectionner",
    deleteSelected: "Supprimer Sélectionnés",
    close: "×",
    
    // File Info
    rows: "lignes",
    headersMatch: "Les en-têtes correspondent",
    headersDiffer: "Les en-têtes diffèrent",
    totalFiles: "Fichiers Totaux:",
    totalRowsPopup: "Lignes Totales:",
    commonHeaders: "En-têtes Communs:",
    headerMatches: "Correspondances d'En-têtes:",
    
    // Column Selection
    auto: "Auto",
    selected: "✅",
    
    // Status Messages
    filesSelected: "Fichiers sélectionnés. Lecture des données...",
    excelFilesLoaded: "Fichiers Excel chargés avec succès",
    addingFiles: "Ajout de",
    newFiles: "nouveaux fichiers...",
    droppedFiles: "fichiers déposés...",
    filesAdded: "ajoutés",
    allSelectedFilesAlreadyUploaded: "Tous les fichiers sélectionnés sont déjà téléchargés",
    allDroppedFilesAlreadyUploaded: "Tous les fichiers déposés sont déjà téléchargés",
    pleaseDropExcelFiles: "Veuillez déposer des fichiers Excel (.xlsx ou .xls)",
    errorProcessingDroppedFiles: "Erreur lors du traitement des fichiers déposés:",
    errorSelectingFiles: "Erreur lors de la sélection des fichiers:",
    filesRemaining: "fichiers restants.",
    chooseSaveLocation: "Choix de l'emplacement de sauvegarde...",
    saveCancel: "Sauvegarde annulée",
    mergingFiles: "Fusion des fichiers...",
    successfullyCreatedMergedFile: "Fichier fusionné créé avec succès:",
    errorMergingFiles: "Erreur lors de la fusion des fichiers:",
    fileOpenedSuccessfully: "Fichier ouvert avec succès",
    errorOpeningFile: "Erreur lors de l'ouverture du fichier:",
    fileLocationOpened: "Emplacement du fichier ouvert",
    errorAccessingFile: "Erreur lors de l'accès au fichier:",
    pleaseSelectExcelFiles: "Veuillez d'abord sélectionner des fichiers Excel",
    pleaseEnterValidCommonLines: "Veuillez entrer un nombre valide de lignes communes (0-100)",
    deletedFiles: "Supprimés",
    columnsFound: "colonnes trouvées",
    autoSelected: "Auto-sélectionnées",
    dateColumns: "colonnes de date.",
    columnsFoundFromRow: "colonnes trouvées de la ligne",
    errorExtractingColumns: "Erreur lors de l'extraction des noms de colonnes:",
    failedToExtractColumns: "Échec de l'extraction des noms de colonnes:",
    loadingExcelMerger: "Chargement du Fusionneur Excel...",
    error: "Erreur:",
    
    // Language and Theme
    changeTheme: "Changer le Thème",
    changeLanguage: "Changer la Langue",
    chooseTheme: "Choisir le Thème",
    chooseLanguage: "Choisir la Langue",
    lightThemes: "☀️ Thèmes Clairs",
    darkThemes: "🌙 Thèmes Sombres"
  },
  
  de: {
    // Header
    appTitle: "Excel-Dateien Zusammenführer",
    appSubtitle: "",
    remake: "Neu Machen",
    
    // Upload Section
    uploadTitle: "Dateien hier hochladen oder per Drag & Drop ablegen",
    uploadDescription: "Klicken Sie, um Excel-Dateien zum Zusammenführen auszuwählen, oder ziehen Sie sie hierher",
    selectExcelFiles: "Excel-Dateien Auswählen",
    addMoreFiles: "Weitere Dateien Hinzufügen",
    
    // Uploaded Files Summary
    uploadedFilesSummary: "Zusammenfassung der hochgeladenen Dateien",
    files: "Dateien",
    totalRows: "Zeilen insgesamt",
    view: "Ansehen",
    viewUploadedFiles: "Hochgeladene Dateien ansehen",
    viewMergedFiles: "Zusammengeführte Dateien ansehen",
    noFilesUploaded: "Noch keine Dateien hochgeladen",
    
    // Header and Columns Selection
    headerColumnsSelection: "Kopfzeilen- und Spaltenauswahl",
    headerNumberOfRows: "Anzahl der Kopfzeilen:",
    headerNumberTooltip: "Die Anzahl der Zeilen, die am Anfang aller hochgeladenen Dateien gemeinsam sind, wie die Spaltennamen.",
    columnsRow: "Spaltenzeile:",
    columnsRowTooltip: "Die Zeile, die die Namen der Spalten enthält.",
    uploadFilesToSeePreview: "Laden Sie Dateien hoch, um die Spaltenvorschau zu sehen",
    
    // Date Columns
    dateColumnsTitle: "Spalten, die als Datum Formatiert werden",
    dateColumnsFound: "Datumsspalten Gefunden:",
    dateColumnsTooltip: "Spalten, die automatisch zum Datumstyp geändert werden. Sie können weitere Spalten auswählen oder abwählen, indem Sie auf 'Spalten Anzeigen' klicken. Standardmäßig nimmt der Zusammenführungsprozess alle Daten als allgemein und Sie können die Daten nicht sortieren, wenn sie nicht vom Datumstyp sind.",
    andMore: "...und",
    more: "weitere",
    noDateColumnsDetected: "Keine Datumsspalten automatisch erkannt",
    uploadFilesToDetectDate: "Laden Sie Dateien hoch, um Datumsspalten zu erkennen",
    viewColumns: "Spalten Anzeigen",
    
    // Merge Button
    mergeFiles: "Dateien Zusammenführen",
    processing: "Verarbeitung...",
    
    // Summary of Merged Files
    mergedFilesSummary: "Zusammenfassung der zusammengeführten Dateien",
    filesMerged: "Dateien zusammengeführt:",
    totalDataRows: "Datenzeilen insgesamt:",
    commonHeaderRows: "Gemeinsame Kopfzeilen:",
    columnHeadersMatch: "Spaltenüberschriften stimmen überein:",
    download: "Herunterladen",
    open: "Öffnen",
    mergedFileSummaryWillAppear: "Die Zusammenfassung der zusammengeführten Datei erscheint hier nach der Verarbeitung",
    
    // Popup Headers
    allUploadedFiles: "Alle Hochgeladenen Dateien",
    allColumns: "Alle Spalten - Datumsspalten Auswählen/Abwählen",
    mergedFilesSummaryPopup: "Zusammenfassung der Zusammengeführten Dateien",
    
    // Popup Actions
    selectAll: "Alles Auswählen",
    deselectAll: "Alles Abwählen",
    deleteSelected: "Ausgewählte Löschen",
    close: "×",
    
    // File Info
    rows: "Zeilen",
    headersMatch: "Kopfzeilen stimmen überein",
    headersDiffer: "Kopfzeilen unterscheiden sich",
    totalFiles: "Dateien Insgesamt:",
    totalRowsPopup: "Zeilen Insgesamt:",
    commonHeaders: "Gemeinsame Kopfzeilen:",
    headerMatches: "Kopfzeilen-Übereinstimmungen:",
    
    // Column Selection
    auto: "Auto",
    selected: "✅",
    
    // Status Messages
    filesSelected: "Dateien ausgewählt. Daten werden gelesen...",
    excelFilesLoaded: "Excel-Dateien erfolgreich geladen",
    addingFiles: "Hinzufügen von",
    newFiles: "neuen Dateien...",
    droppedFiles: "abgelegten Dateien...",
    filesAdded: "hinzugefügt",
    allSelectedFilesAlreadyUploaded: "Alle ausgewählten Dateien sind bereits hochgeladen",
    allDroppedFilesAlreadyUploaded: "Alle abgelegten Dateien sind bereits hochgeladen",
    pleaseDropExcelFiles: "Bitte legen Sie Excel-Dateien (.xlsx oder .xls) ab",
    errorProcessingDroppedFiles: "Fehler beim Verarbeiten der abgelegten Dateien:",
    errorSelectingFiles: "Fehler beim Auswählen der Dateien:",
    filesRemaining: "Dateien verbleibend.",
    chooseSaveLocation: "Speicherort wird gewählt...",
    saveCancel: "Speichern abgebrochen",
    mergingFiles: "Dateien werden zusammengeführt...",
    successfullyCreatedMergedFile: "Zusammengeführte Datei erfolgreich erstellt:",
    errorMergingFiles: "Fehler beim Zusammenführen der Dateien:",
    fileOpenedSuccessfully: "Datei erfolgreich geöffnet",
    errorOpeningFile: "Fehler beim Öffnen der Datei:",
    fileLocationOpened: "Dateispeicherort geöffnet",
    errorAccessingFile: "Fehler beim Zugriff auf die Datei:",
    pleaseSelectExcelFiles: "Bitte wählen Sie zuerst Excel-Dateien aus",
    pleaseEnterValidCommonLines: "Bitte geben Sie eine gültige Anzahl gemeinsamer Zeilen ein (0-100)",
    deletedFiles: "Gelöscht",
    columnsFound: "Spalten gefunden",
    autoSelected: "Automatisch ausgewählt",
    dateColumns: "Datumsspalten.",
    columnsFoundFromRow: "Spalten gefunden ab Zeile",
    errorExtractingColumns: "Fehler beim Extrahieren der Spaltennamen:",
    failedToExtractColumns: "Fehler beim Extrahieren der Spaltennamen:",
    loadingExcelMerger: "Excel-Zusammenführer wird geladen...",
    error: "Fehler:",
    
    // Language and Theme
    changeTheme: "Thema Ändern",
    changeLanguage: "Sprache Ändern",
    chooseTheme: "Thema Wählen",
    chooseLanguage: "Sprache Wählen",
    lightThemes: "☀️ Helle Themen",
    darkThemes: "🌙 Dunkle Themen"
  },
  
  es: {
    // Header
    appTitle: "Fusionador de Archivos Excel",
    appSubtitle: "",
    remake: "Rehacer",
    
    // Upload Section
    uploadTitle: "Sube o arrastra y suelta archivos aquí",
    uploadDescription: "Haz clic para seleccionar archivos Excel para fusionar, o arrástralos aquí",
    selectExcelFiles: "Seleccionar Archivos Excel",
    addMoreFiles: "Agregar Más Archivos",
    
    // Uploaded Files Summary
    uploadedFilesSummary: "Resumen de archivos subidos",
    files: "archivos",
    totalRows: "filas totales",
    view: "Ver",
    viewUploadedFiles: "Ver archivos subidos",
    viewMergedFiles: "Ver archivos fusionados",
    noFilesUploaded: "No se han subido archivos aún",
    
    // Header and Columns Selection
    headerColumnsSelection: "Selección de Encabezado y Columnas",
    headerNumberOfRows: "Número de filas de encabezado:",
    headerNumberTooltip: "El número de líneas que es común al comienzo de todos los archivos subidos, como los nombres de las columnas.",
    columnsRow: "Fila de columnas:",
    columnsRowTooltip: "La fila que contiene el nombre de las columnas.",
    uploadFilesToSeePreview: "Sube archivos para ver la vista previa de columnas",
    
    // Date Columns
    dateColumnsTitle: "Columnas que serán Formateadas como Fecha",
    dateColumnsFound: "Columnas de Fecha Encontradas:",
    dateColumnsTooltip: "Columnas que se cambiarán automáticamente al tipo fecha. Puedes seleccionar o deseleccionar más columnas haciendo clic en 'Ver Columnas'. Por defecto, el proceso de fusión toma todos los datos como generales y no puedes ordenar las fechas si no son del tipo fecha.",
    andMore: "...y",
    more: "más",
    noDateColumnsDetected: "No se detectaron automáticamente columnas de fecha",
    uploadFilesToDetectDate: "Sube archivos para detectar columnas de fecha",
    viewColumns: "Ver Columnas",
    
    // Merge Button
    mergeFiles: "Fusionar Archivos",
    processing: "Procesando...",
    
    // Summary of Merged Files
    mergedFilesSummary: "Resumen de archivos fusionados",
    filesMerged: "Archivos fusionados:",
    totalDataRows: "Filas totales de datos:",
    commonHeaderRows: "Filas comunes de encabezado:",
    columnHeadersMatch: "Los encabezados de columnas coinciden:",
    download: "Descargar",
    open: "Abrir",
    mergedFileSummaryWillAppear: "El resumen del archivo fusionado aparecerá aquí después del procesamiento",
    
    // Popup Headers
    allUploadedFiles: "Todos los Archivos Subidos",
    allColumns: "Todas las Columnas - Seleccionar/Deseleccionar Columnas de Fecha",
    mergedFilesSummaryPopup: "Resumen de Archivos Fusionados",
    
    // Popup Actions
    selectAll: "Seleccionar Todo",
    deselectAll: "Deseleccionar Todo",
    deleteSelected: "Eliminar Seleccionados",
    close: "×",
    
    // File Info
    rows: "filas",
    headersMatch: "Los encabezados coinciden",
    headersDiffer: "Los encabezados difieren",
    totalFiles: "Archivos Totales:",
    totalRowsPopup: "Filas Totales:",
    commonHeaders: "Encabezados Comunes:",
    headerMatches: "Coincidencias de Encabezados:",
    
    // Column Selection
    auto: "Auto",
    selected: "✅",
    
    // Status Messages
    filesSelected: "Archivos seleccionados. Leyendo datos...",
    excelFilesLoaded: "Archivos Excel cargados exitosamente",
    addingFiles: "Agregando",
    newFiles: "archivos nuevos...",
    droppedFiles: "archivos arrastrados...",
    filesAdded: "agregados",
    allSelectedFilesAlreadyUploaded: "Todos los archivos seleccionados ya están subidos",
    allDroppedFilesAlreadyUploaded: "Todos los archivos arrastrados ya están subidos",
    pleaseDropExcelFiles: "Por favor arrastra archivos Excel (.xlsx o .xls)",
    errorProcessingDroppedFiles: "Error procesando archivos arrastrados:",
    errorSelectingFiles: "Error seleccionando archivos:",
    filesRemaining: "archivos restantes.",
    chooseSaveLocation: "Eligiendo ubicación de guardado...",
    saveCancel: "Guardado cancelado",
    mergingFiles: "Fusionando archivos...",
    successfullyCreatedMergedFile: "Archivo fusionado creado exitosamente:",
    errorMergingFiles: "Error fusionando archivos:",
    fileOpenedSuccessfully: "Archivo abierto exitosamente",
    errorOpeningFile: "Error abriendo archivo:",
    fileLocationOpened: "Ubicación del archivo abierta",
    errorAccessingFile: "Error accediendo al archivo:",
    pleaseSelectExcelFiles: "Por favor selecciona archivos Excel primero",
    pleaseEnterValidCommonLines: "Por favor ingresa un número válido de líneas comunes (0-100)",
    deletedFiles: "Eliminados",
    columnsFound: "columnas encontradas",
    autoSelected: "Auto-seleccionadas",
    dateColumns: "columnas de fecha.",
    columnsFoundFromRow: "columnas encontradas de la fila",
    errorExtractingColumns: "Error extrayendo nombres de columnas:",
    failedToExtractColumns: "Falló la extracción de nombres de columnas:",
    loadingExcelMerger: "Cargando Fusionador Excel...",
    error: "Error:",
    
    // Language and Theme
    changeTheme: "Cambiar Tema",
    changeLanguage: "Cambiar Idioma",
    chooseTheme: "Elegir Tema",
    chooseLanguage: "Elegir Idioma",
    lightThemes: "☀️ Temas Claros",
    darkThemes: "🌙 Temas Oscuros"
  }
};

// Translation function
export const useTranslation = (currentLanguage) => {
  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };
  
  return { t };
};

export default translations;