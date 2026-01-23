# TODO

- [ ] Make move in date requirement


# Brain Dump. 

- [ ] Start with address search of both addis 
- [ ] Dates for move_in and move_out
- [ ] Storage based on that. 
- [ ] Furniture form, also takes assembly (later)
- [ ] Cartonage and Packaging Form
- [ ] Services Form (Insurance, Parking, Lift)
- [ ] 
- [ ] 



# Umzug Formular - Webform

Ein embeddable Formular für Umzugsanfragen, das sowohl eigenständig als auch in andere Websites (z.B. Wix) eingebettet werden kann.

## Features

- ✅ TypeScript für Type-Safety
- ✅ TailwindCSS für Styling
- ✅ daisyUI für vorgefertigte UI-Komponenten
- ✅ lucide-react für Icons
- ✅ Turbopack für schnelle Entwicklung
- ✅ Vollständige Formularvalidierung
- ✅ Responsive Design

## Setup

1. Installiere Dependencies:
```bash
npm install
```

2. Erstelle `.env.local` Datei:
```bash
cp .env.example .env.local
```

3. Setze die Umgebungsvariablen:
```
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Google Maps API Key Setup:**
- Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
- Erstelle ein neues Projekt oder wähle ein bestehendes
- Aktiviere die "Places API"
- Erstelle einen API-Schlüssel
- Füge den Schlüssel zu `.env.local` hinzu

## Entwicklung

Starte den Development Server mit Turbopack:
```bash
npm run dev
```

Die Anwendung läuft dann auf `http://localhost:3000`

## Build für Production

```bash
npm run build
npm start
```

## Einbettung

Das Formular kann in andere Websites eingebettet werden:

### Als iframe:
```html
<iframe 
  src="https://your-domain.com" 
  width="100%" 
  height="800px"
  frameborder="0">
</iframe>
```

### Als React Component:
```tsx
import MovingForm from '@/components/MovingForm';

export default function Page() {
  return <MovingForm />;
}
```

## Formular-Struktur

Das Formular ist in 5 Schritte unterteilt und entspricht der `CustomerForm` Struktur aus dem Backend:

1. **Adressen** (Schritt 1):
   - Von Adresse mit Google Maps Autovervollständigung
   - Nach Adresse mit Google Maps Autovervollständigung
   - Objekttyp, Etage, Wohnfläche, Aufzug, Parkzone, Wegstrecke

2. **Kontaktdaten** (Schritt 2):
   - Name, E-Mail, Telefon

3. **Umzugsdaten** (Schritt 3):
   - Auszug- und Einzugdatum (Format: DD-MM-YYYY)

4. **Zusätzliche Leistungen** (Schritt 4):
   - Einpacken/Auspacken Kartonagen
   - Möbel- und Lampendemontage/-montage
   - Küchendemontage/-montage
   - Einlagerung
   - Gesamtvolumen (m³)
   - Weitere Hinweise

5. **Übersicht** (Schritt 5):
   - Zusammenfassung aller Angaben
   - Finale Absendung

## Komponenten-Struktur

Das Formular ist in separate Komponenten aufgeteilt:

- `MovingForm.tsx` - Hauptkomponente mit Schritt-Navigation und State-Management
- `AddressForm.tsx` - Adress-Eingabe mit Google Maps Autocomplete
- `ContactForm.tsx` - Kontaktdaten-Eingabe
- `DatesForm.tsx` - Umzugsdaten-Eingabe
- `ServicesForm.tsx` - Zusätzliche Leistungen und Hinweise
- `ThankYouScreen.tsx` - Erfolgs-Seite nach Absendung

Alle Formulardaten werden im State gespeichert und bleiben beim Navigieren zwischen den Schritten erhalten.

## API Integration

Das Formular sendet POST-Requests an `/api/submit-form` mit der vollständigen `CustomerForm` Struktur.
