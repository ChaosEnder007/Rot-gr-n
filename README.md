# Rot gegen Gruen PWA – Quellcode & Handy-Anleitung

## Was ist das?
Ein installierbarer Web-App-Prototyp (PWA) für Android. Enthält Lobby/Einladung, Rollenwahl, Setzphase, 60-Sekunden-Ablauf mit zufälligem Muster bei unvollständiger Platzierung, Löschwerkzeug und Suchphase.

**Noch nicht produktionsfertig:** Der Code ist ein Prototyp. PeerJS-Verbindung und Rollen-/Spielzustand sind nur grundlegend umgesetzt; bei Rollenvergabe/Start muss noch weiter abgesichert werden. Es gibt keine dauerhafte Cloud-Speicherung, kein Konto und keine Anti-Cheat-Sicherheit. Die Lobby-„Code“-Anzeige ist eine Kurzkennung; der PeerJS-Link enthält die tatsächliche Peer-ID.

## Dateien
- `index.html` – App-Oberfläche
- `style.css` – Gestaltung
- `app.js` – Spiellogik und PeerJS
- `manifest.json`, `sw.js` – Installierbarkeit als PWA

## Am Handy einrichten (ohne PC)
Du brauchst einen Hosting-Dienst, der statische Dateien veröffentlicht. GitHub Pages ist eine mögliche kostenlose Option. Am bequemsten ist die GitHub-Webseite in Chrome (ggf. „Desktopwebsite“ aktivieren); GitHub-App allein kann nicht alle Repository-Einstellungen bedienen.

1. Öffne github.com und erstelle/öffne ein Konto.
2. Erstelle ein neues Repository, z. B. `wunschduell`.
3. Lade die fünf Dateien dieses Ordners in das Repository hoch (`Add file` → `Upload files`). Du kannst die ZIP zuerst im Handy-Dateimanager entpacken.
4. In den Repository-Einstellungen: `Pages` → `Deploy from a branch` → Branch `main`, Ordner `/root` → Save. Warte, bis GitHub die veröffentlichte Seitenadresse zeigt.
5. Öffne diese Seitenadresse in Chrome auf Android. Für PWA-Installation: Chrome-Menü `⋮` → `Zum Startbildschirm hinzufügen` bzw. `App installieren` (Wortlaut kann variieren).
6. Zum Spielen: Spieler 1 öffnet die Seite und tippt `Lobby erstellen`. Er teilt den erzeugten Einladungslink (nicht nur den angezeigten Kurzcode) mit Spieler 2. Spieler 2 öffnet den Link auf seinem Handy. Beide wählen unterschiedliche Rollen und drücken `Bereit`.

## Einschränkungen/Fehlerbehebung
- Beide Geräte brauchen Internet und die Seite muss über HTTPS laufen (GitHub Pages bietet HTTPS).
- PeerJS nutzt einen öffentlichen Vermittlungsdienst für die WebRTC-Verbindung; Verfügbarkeit/limits können sich ändern. Manche Netzwerke benötigen TURN-Relay.
- Diese erste Version ist für einen technischen Test gedacht. Wenn Lobby/Verbindung nicht funktioniert, prüfe, ob beide die gleiche veröffentlichte HTTPS-Adresse öffnen, und teile den Link über `Einladung teilen`.
- Ein Browser kann eine PWA nicht automatisch als native APK ausgeben. Eine APK benötigt später einen Android-Build (z. B. Capacitor/Android-Projekt und Build-Umgebung).
