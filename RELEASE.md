# Quizzy 🧠 — Release Notes v1.0.2

> Designed by Martin Metzler, implementation assisted by AI.
> Lizenz: [GPL-3.0-or-later](LICENSE)

---

## Beschreibung

**Quizzy** ist eine plattformübergreifende Lern-App für den Schulunterricht. Sie ermöglicht es Lehrkräften, individuelle Quiz-Themen zu erstellen und Schülerinnen und Schülern, diese interaktiv zu bearbeiten. Alle Ergebnisse werden zentral gespeichert und sind im Lehrer-Dashboard einsehbar.

---

## Funktionsübersicht

### 👤 Schüler-Bereich

#### Anmeldung
- Namenseingabe zum Starten der App (kein Passwort erforderlich)
- QR-Code auf der Startseite zeigt die Netzwerkadresse an — Mitschüler können die App direkt über WLAN im Browser öffnen, ohne Installation
- Hell-/Dunkelmodus-Umschalter

#### Quiz
- Auswahl eines Themas aus den vom Lehrer freigegebenen Quiz-Themen
- Interaktives **Drag-&-Drop-Zuordnungsspiel**: Begriffe werden per Maus/Touch den passenden Beschreibungen zugewiesen
- Alternativ: Tippen auf Begriff und Zielfeld (für Touch-Geräte)
- Nach dem Einreichen: sofortige Auswertung mit Punktestand, Prozentwert und farbig markierten richtigen/falschen Zuordnungen
- Ergebnis wird automatisch im System gespeichert

#### Vokabeln
- Durchsuchbare Vokabelliste (Begriffe + Übersetzungen / Erklärungen)
- Lernmodus zum Üben der Vokabeln (Karteikarten-Prinzip)

---

### 🔐 Lehrer-Bereich (passwortgeschützt)

#### Dashboard
- Passwortgeschützter Zugang (Administrator-Login)
- Passwort jederzeit in der App änderbar

#### Quiz-Verwaltung
- Neue Quiz-Themen anlegen
- Fragen (Begriff + Antwort/Erklärung) zu einem Thema hinzufügen, bearbeiten und löschen
- Ganze Quiz-Themen löschen
- Auswahl der **freigegebenen Themen** für Schüler (Prüfungsmodus: nur bestimmte Themen sichtbar)

#### Ergebnis-Auswertung
- Übersicht aller eingereichten Ergebnisse mit Schülername, Thema, Punktzahl, Prozentwert und Zeitstempel
- Filterung nach Schülernamen
- Detailansicht: Aufklappen eines Ergebnisses zeigt alle Zuordnungen mit Richtig-/Falsch-Markierung
- Einzelne Ergebnisse oder alle Ergebnisse löschen
- Durchschnittswert über alle Ergebnisse

---

## Plattformen

| Plattform | Datei |
|---|---|
| Windows | `Quizzy-Setup-1.0.2.exe` (NSIS Installer) |
| Linux | `Quizzy-1.0.2.AppImage` (keine Installation nötig) |
| Web/Browser | via `npm start` (Expo) oder über WLAN-QR-Code |

---

## Netzwerk-Synchronisation

Quizzy enthält einen integrierten Express-Server (`npm run api`), über den alle Daten (Quiz-Inhalte, Ergebnisse, Einstellungen) zwischen Geräten im selben Netzwerk synchronisiert werden. Schüler können die App direkt im Browser nutzen, ohne sie installieren zu müssen — der QR-Code auf der Loginseite erleichtert den Zugang.

---

## Technologie

- **React Native / Expo** (Web-Target via Electron)
- **Electron** für Windows- und Linux-Desktop-Apps
- **SQLite** (lokal) / **JSON-Server-API** (Netzwerk)
- **@dnd-kit** für Drag-&-Drop
- **expo-linear-gradient**, **react-native-qrcode-svg**

---

## Lizenz

Dieses Programm ist freie Software. Es wird unter den Bedingungen der [GNU General Public License Version 3](LICENSE) oder einer späteren Version verteilt.
