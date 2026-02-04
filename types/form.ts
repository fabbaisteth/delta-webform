// TypeScript types matching the Python CustomerForm structure
export interface CustomerForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  from_location: Location;
  to_location: Location;
  services: Services;
  goods: GoodsRoom[];
  total_volume_m3: number;
  moving_out_date: string; // Format: DD-MM-YYYY
  moving_in_date: string; // Format: DD-MM-YYYY
  storage_info?: StorageInfo | null;
  cartonage_info?: CartonageInfo | null;
  notes?: string | null;
}

export interface AIFeatures {
  waste_disposal: boolean;
  waste_disposal_cbm?: number | null;
  external_lift: boolean;
}

export interface Services {
  carton_pack: boolean; // Einpacken Kartonagen
  carton_unpack: boolean; // Auspacken Kartonagen
  furniture_disassembly: boolean; // Möbeldemontage
  furniture_assembly: boolean; // Möbelmontage
  lamps_disassembly: boolean; // Lampendemontage
  number_of_lamps_to_disassemble: number;
  lamps_assembly: boolean;
  number_of_lamps_to_assemble: number;
  kitchen_disassembly: boolean;
  kitchen_assembly: boolean;
  storage: boolean;
}

export interface Location {
  address: string;
  // Individual address components (optional, for display/parsing)
  house_number?: string;
  street_name?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  object_type: 'Wohnung' | 'Haus';
  floor: number;
  living_space_m2: number;
  has_elevator: boolean;
  needs_parking_zone: boolean;
  walkway_m: number;
  country_code?: string | null; // ISO 3166-1 alpha-2 code
}

export interface GoodsItem {
  description: string;
  quantity: number;
  volume_per_item_m3: number;
}

export interface GoodsRoom {
  name: string;
  items: GoodsItem[];
  volume_m3: number;
}

export interface StorageInfo {
  wants_storage: boolean | null; // Möchten Sie Ihre Sachen einlagern?
  move_out_matches_storage_date: boolean | null; // Entspricht ihr Auszugsdatum dem Einlagerungsdatum?
  move_in_matches_retrieval_date: boolean | null; // Entspricht ihr Einzugsdatum dem Auslagerungsdatum?
  retrieval_address_matches_move_in: boolean | null; // Entspricht die Adresse bei Auslagerung mit ihrer Einzugsadresse überein?
  storage_date: string; // Datum der Einlagerung - Format: DD-MM-YYYY
  retrieval_date: string; // Datum der Auslagerung - Format: DD-MM-YYYY
  retrieval_address: Location; // Adresse, an die wir nach Auslagerung liefern
}

export interface CartonageInfo {
  box_quantity: number; // Number of boxes to transport
  boxes_to_buy: number; // Standard boxes to buy
  boxes_to_rent: number; // Standard boxes to rent
  wardrobe_boxes_to_rent: number; // Wardrobe boxes to rent
  packing_service_quantity: number; // Number of boxes for packing service
  unpacking_service_quantity: number; // Number of boxes for unpacking service
  packing_material_package: string | null; // Selected packing material package
  delivery_date: string; // Delivery date for boxes/materials (DD-MM-YYYY format)
  cartonage_notes: string; // Additional notes about boxes
}



export type RoomType = {
  name: string;
  label: string;
  icon: string;
}

export type FurnitureItem = {
  name: string;
  label: string;
  icon: string;
  volume_m3: number; // Volume in cubic meters
  requires_assembly_disassembly?: boolean; // True if this item requires assembly/disassembly services (kitchen items, lamps)
}

export type Catalog = {
  rooms: RoomType[];
  furniture_items: FurnitureItem[];
}

export const catalog: Catalog = {
  rooms: [
    { name: 'livingroom', label: 'Wohnzimmer', icon: 'fas fa-couch' },
    { name: 'diningroom', label: 'Esszimmer', icon: 'fas fa-utensils' },
    { name: 'bedroom', label: 'Schlafzimmer', icon: 'fas fa-bed' },
    { name: 'kitchen', label: 'Küche', icon: 'fas fa-kitchen-set' },
    { name: 'bathroom', label: 'Bad', icon: 'fas fa-shower' },
    { name: 'office', label: 'Büro', icon: 'fas fa-laptop' },
    { name: 'garage', label: 'Garage', icon: 'fas fa-car' },
    { name: 'garden', label: 'Garten', icon: 'fas fa-tree' },
    { name: 'other', label: 'Sonstiges', icon: 'fas fa-question' },
  ],
  furniture_items: [
    { name: 'aktenschrank_hoch_1_2m', label: 'Aktenschrank hoch (Breite 1–2 m)', icon: 'fas fa-archive', volume_m3: 0.8 },
    { name: 'aktenschrank_niedrig_0_1m', label: 'Aktenschrank niedrig (Breite 0–1 m)', icon: 'fas fa-archive', volume_m3: 0.6 },
    { name: 'aktenschrank_niedrig_1_2m', label: 'Aktenschrank niedrig (Breite 1–2 m)', icon: 'fas fa-archive', volume_m3: 0.8 },
    { name: 'autoreifen', label: 'Autoreifen (je Reifen)', icon: 'fas fa-circle', volume_m3: 0.1 },
    { name: 'bank_2_sitzer', label: 'Bank (2-Sitzer)', icon: 'fas fa-couch', volume_m3: 0.4 },
    { name: 'bank_4_sitzer', label: 'Bank (4-Sitzer)', icon: 'fas fa-couch', volume_m3: 0.8 },
    { name: 'bank_5_sitzer', label: 'Bank (5-Sitzer)', icon: 'fas fa-couch', volume_m3: 1 },
    { name: 'bank_6_sitzer', label: 'Bank (6-Sitzer)', icon: 'fas fa-couch', volume_m3: 1.2 },
    { name: 'barhocker', label: 'Barhocker', icon: 'fas fa-chair', volume_m3: 0.3 },
    { name: 'baum_pflanze_0_1m', label: 'Baum / Blume / Pflanze (Höhe 0–1 m)', icon: 'fas fa-leaf', volume_m3: 0.3 },
    { name: 'baum_pflanze_1_2m', label: 'Baum / Blume / Pflanze (Höhe 1–2 m)', icon: 'fas fa-tree', volume_m3: 0.8 },
    { name: 'beistelltisch', label: 'Beistelltisch', icon: 'fas fa-table', volume_m3: 0.8 },
    { name: 'bettsofa', label: 'Bettsofa', icon: 'fas fa-couch', volume_m3: 2 },
    { name: 'bettzeug', label: 'Bettzeug', icon: 'fas fa-bed', volume_m3: 0.2 },
    { name: 'bild_s', label: 'Bild S (Längste Seite unter 1 m)', icon: 'fas fa-image', volume_m3: 0.1 },
    { name: 'bild_l', label: 'Bilder L (Längste Seite über 1 m)', icon: 'fas fa-image', volume_m3: 0.2 },
    { name: 'bild_xl', label: 'Bild XL (Längste Seite über 1 m)', icon: 'fas fa-image', volume_m3: 0.4 },
    { name: 'billardtisch', label: 'Billardtisch', icon: 'fas fa-table', volume_m3: 2.6 },
    { name: 'blumenkuebel', label: 'Blumenkübel / Kasten', icon: 'fas fa-seedling', volume_m3: 0.1 },
    { name: 'boxsack', label: 'Boxsack', icon: 'fas fa-dumbbell', volume_m3: 1.5 },
    { name: 'boxspringbett', label: 'Boxspringbett', icon: 'fas fa-bed', volume_m3: 2.4 },
    { name: 'bruecke_laeufer', label: 'Brücke / Läufer (Teppich)', icon: 'fas fa-square', volume_m3: 0.1 },
    { name: 'buegeleisen_buegelbrett', label: 'Bügeleisen / Bügelbrett', icon: 'fas fa-tshirt', volume_m3: 0.1 },
    { name: 'campingstuhl', label: 'Campingstuhl', icon: 'fas fa-chair', volume_m3: 0.2 },
    { name: 'chaiselongue_ottomane', label: 'Chaiselongue / Ottomane', icon: 'fas fa-couch', volume_m3: 1.2 },
    { name: 'computer_pc', label: 'Computer (PC)', icon: 'fas fa-desktop', volume_m3: 0.3 },
    { name: 'couch_1_sitzer', label: 'Couch / Sofa (1-Sitzer)', icon: 'fas fa-couch', volume_m3: 0.4 },
    { name: 'couch_2_sitzer', label: 'Couch / Sofa (2-Sitzer)', icon: 'fas fa-couch', volume_m3: 0.8 },
    { name: 'couch_3_sitzer', label: 'Couch / Sofa (3-Sitzer)', icon: 'fas fa-couch', volume_m3: 1.2 },
    { name: 'couch_4_sitzer', label: 'Couch / Sofa (4-Sitzer)', icon: 'fas fa-couch', volume_m3: 1.6 },
    { name: 'couch_5_sitzer', label: 'Couch / Sofa (5-Sitzer)', icon: 'fas fa-couch', volume_m3: 2 },
    { name: 'couch_6_sitzer', label: 'Couch / Sofa (6-Sitzer)', icon: 'fas fa-couch', volume_m3: 2.5 },
    { name: 'couchtisch', label: 'Couchtisch', icon: 'fas fa-table', volume_m3: 0.5 },
    { name: 'dachbox', label: 'Dachbox', icon: 'fas fa-box', volume_m3: 2 },
    { name: 'decken_haengelampe', label: 'Decken- / Hängelampe', icon: 'fas fa-lightbulb', volume_m3: 0.2, requires_assembly_disassembly: true },
    { name: 'deckenventilator', label: 'Deckenventilator', icon: 'fas fa-fan', volume_m3: 0.5 },
    { name: 'doppelbett', label: 'Doppelbett (Breite über 100 cm) – inkl. Lattenrost/ Boxspringbett/ Bett mit Unterkasten', icon: 'fas fa-bed', volume_m3: 2 },
    { name: 'doppelbett_matratze', label: 'Doppelbett-Matratze', icon: 'fas fa-bed', volume_m3: 0.8 },
    { name: 'dreirad_laufrad', label: 'Dreirad / Laufrad', icon: 'fas fa-bicycle', volume_m3: 0.5 },
    { name: 'drucker_klein', label: 'Drucker klein / Tischkopierer', icon: 'fas fa-print', volume_m3: 0.3 },
    { name: 'drucker_kopierer', label: 'Drucker / Kopierer', icon: 'fas fa-print', volume_m3: 0.9 },
    { name: 'dunstabzugshaube', label: 'Dunstabzugshaube', icon: 'fas fa-wind', volume_m3: 0.2, requires_assembly_disassembly: true },
    { name: 'e_bike', label: 'E-Bike', icon: 'fas fa-bicycle', volume_m3: 0.5 },
    { name: 'einzelbett_0_100cm', label: 'Einzelbett (Breite 0–100 cm) – inkl. Lattenrost/ Boxspringbett/ Bett mit Unterkasten', icon: 'fas fa-bed', volume_m3: 1 },
    { name: 'einzelbett_matratze_0_100cm', label: 'Einzelbett-Matratze (0–100 cm)', icon: 'fas fa-bed', volume_m3: 0.5 },
    { name: 'ergometer_spinningrad', label: 'Ergometer / Spinningrad', icon: 'fas fa-bicycle', volume_m3: 0.8 },
    { name: 'esstisch_0_1m', label: 'Esstisch (Länge 0–1 m)', icon: 'fas fa-utensils', volume_m3: 0.5 },
    { name: 'esstisch_1_3m', label: 'Esstisch (Länge 1–3 m)', icon: 'fas fa-utensils', volume_m3: 1.5 },
    { name: 'esstisch_3_5m', label: 'Esstisch (Länge 3–5 m)', icon: 'fas fa-utensils', volume_m3: 2 },
    { name: 'fahrrad', label: 'Fahrrad', icon: 'fas fa-bicycle', volume_m3: 0.5 },
    { name: 'fernsehschrank_0_1m', label: 'Fernsehschrank/Tisch / Lowboard (Breite 0–1 m)', icon: 'fas fa-tv', volume_m3: 0.6 },
    { name: 'fernsehschrank_1_2m', label: 'Fernsehschrank/Tisch / Lowboard (Breite 1–2 m)', icon: 'fas fa-tv', volume_m3: 1.2 },
    { name: 'fernsehschrank_2_3m', label: 'Fernsehschrank/Tisch / Lowboard (Breite 2–3 m)', icon: 'fas fa-tv', volume_m3: 1.5 },
    { name: 'flipchart', label: 'Flipchart', icon: 'fas fa-chalkboard', volume_m3: 0.2 },
    { name: 'garderobe_0_2m', label: 'Garderobe (Breite 0–2 m)', icon: 'fas fa-tshirt', volume_m3: 0.4 },
    { name: 'garderobe_2_4m', label: 'Garderobe (Breite 2–4 m)', icon: 'fas fa-tshirt', volume_m3: 0.8 },
    { name: 'garderobenstange', label: 'Garderobenstange', icon: 'fas fa-grip-lines', volume_m3: 0.1 },
    { name: 'gardinenstange', label: 'Gardinenstange', icon: 'fas fa-grip-lines', volume_m3: 0.1 },
    { name: 'gartengeraete', label: 'Gartengeräte (pro Stück)', icon: 'fas fa-tools', volume_m3: 0.1 },
    { name: 'gartenstuhl', label: 'Gartenstuhl', icon: 'fas fa-chair', volume_m3: 0.2 },
    { name: 'gartentisch_0_1m', label: 'Gartentisch (Länge 0–1 m)', icon: 'fas fa-table', volume_m3: 0.5 },
    { name: 'gartentisch_1_2m', label: 'Gartentisch (Länge 1–2 m)', icon: 'fas fa-table', volume_m3: 1 },
    { name: 'gasgrill', label: 'Gasgrill', icon: 'fas fa-fire', volume_m3: 1.5 },
    { name: 'golf_trolley', label: 'Golf-Trolley', icon: 'fas fa-golf-ball', volume_m3: 0.3 },
    { name: 'golftasche', label: 'Golftasche', icon: 'fas fa-golf-ball', volume_m3: 0.2 },
    { name: 'grill', label: 'Grill', icon: 'fas fa-fire', volume_m3: 0.8 },
    { name: 'handkoffer', label: 'Handkoffer', icon: 'fas fa-suitcase', volume_m3: 0.1 },
    { name: 'heizpilz', label: 'Heizpilz', icon: 'fas fa-fire', volume_m3: 0.8 },
    { name: 'herd_ofen', label: 'Herd / Ofen', icon: 'fas fa-fire', volume_m3: 0.5, requires_assembly_disassembly: true },
    { name: 'hochbeet', label: 'Hohbeet', icon: 'fas fa-seedling', volume_m3: 1 },
    { name: 'hochbett_stockbett', label: 'Hochbett/ Stockbett', icon: 'fas fa-bed', volume_m3: 1.6 },
    { name: 'hochschrank_0_1m', label: 'Hochschrank (Breite 0–1 m, Höhe 1–3 m)', icon: 'fas fa-door-open', volume_m3: 1.2 },
    { name: 'hocker', label: 'Hocker', icon: 'fas fa-chair', volume_m3: 0.3 },
    { name: 'holzbank', label: 'Holzbank', icon: 'fas fa-chair', volume_m3: 0.8 },
    { name: 'kaffeemaschine', label: 'Kaffeemaschine', icon: 'fas fa-coffee', volume_m3: 0.1 },
    { name: 'kinder_spielkueche', label: 'Kinder- / Spielküche', icon: 'fas fa-utensils', volume_m3: 0.3 },
    { name: 'kinderbett_0_70cm', label: 'Kinderbett (Breite 0–70 cm)', icon: 'fas fa-bed', volume_m3: 0.7 },
    { name: 'kinderfahrrad', label: 'Kinderfahrrad', icon: 'fas fa-bicycle', volume_m3: 0.2 },
    { name: 'kinderhochstuhl', label: 'Kinderhochstuhl', icon: 'fas fa-chair', volume_m3: 0.3 },
    { name: 'kindermatratze', label: 'Kindermatratze', icon: 'fas fa-bed', volume_m3: 0.28 },
    { name: 'kinderschrank', label: 'Kinderschrank', icon: 'fas fa-door-open', volume_m3: 0.76 },
    { name: 'kinderstuhl', label: 'Kinderstuhl', icon: 'fas fa-chair', volume_m3: 0.3 },
    { name: 'kindertisch', label: 'Kindertisch', icon: 'fas fa-table', volume_m3: 0.3 },
    { name: 'kinderwagen', label: 'Kinderwagen', icon: 'fas fa-baby', volume_m3: 0.5 },
    { name: 'kinderwiege_babybett', label: 'Kinderwiege / Babybett', icon: 'fas fa-baby', volume_m3: 0.4 },
    { name: 'klapprad', label: 'Klapprad', icon: 'fas fa-bicycle', volume_m3: 0.3 },
    { name: 'klappstuhl', label: 'Klappstuhl', icon: 'fas fa-chair', volume_m3: 0.2 },
    { name: 'klapptisch', label: 'Klapptisch', icon: 'fas fa-table', volume_m3: 0.2 },
    { name: 'kleiderwagen', label: 'Kleiderwagen', icon: 'fas fa-tshirt', volume_m3: 0.2 },
    { name: 'kleiderschrank_0_1m', label: 'Kleiderschrank (Breite 0–1 m)', icon: 'fas fa-door-open', volume_m3: 0.8 },
    { name: 'kleiderschrank_1_2m', label: 'Kleiderschrank (Breite 1–2 m)', icon: 'fas fa-door-open', volume_m3: 1.6 },
    { name: 'kleiderschrank_2_3m', label: 'Kleiderschrank (Breite 2–3 m)', icon: 'fas fa-door-open', volume_m3: 2.4 },
    { name: 'kleiderschrank_3_4m', label: 'Kleiderschrank (Breite 3–4 m)', icon: 'fas fa-door-open', volume_m3: 3.2 },
    { name: 'kochfeld', label: 'Kochfeld', icon: 'fas fa-fire', volume_m3: 0.1 },
    { name: 'kommode_0_1m', label: 'Kommode / Sideboard (Breite 0–1 m)', icon: 'fas fa-drawer', volume_m3: 0.7 },
    { name: 'kommode_1_2m', label: 'Kommode / Sideboard (Breite 1–2 m)', icon: 'fas fa-drawer', volume_m3: 1.4 },
    { name: 'kommode_2_3m', label: 'Kommode / Sideboard (Breite 2–3 m)', icon: 'fas fa-drawer', volume_m3: 2.1 },
    { name: 'kommode_3_4m', label: 'Kommode / Sideboard (Breite 3–4 m)', icon: 'fas fa-drawer', volume_m3: 2.8 },
    { name: 'koffer', label: 'Koffer', icon: 'fas fa-suitcase', volume_m3: 0.1 },
    { name: 'kueche_arbeitsplatte_0_1m', label: 'Küche- / Arbeitsplatte (Breite 0–1 m)', icon: 'fas fa-kitchen-set', volume_m3: 0.1, requires_assembly_disassembly: true },
    { name: 'kueche_arbeitsplatte_1_2m', label: 'Küche- / Arbeitsplatte (Breite 1–2 m)', icon: 'fas fa-kitchen-set', volume_m3: 0.2, requires_assembly_disassembly: true },
    { name: 'kueche_arbeitsplatte_2_3m', label: 'Küche- / Arbeitsplatte (Breite 2–3 m)', icon: 'fas fa-kitchen-set', volume_m3: 0.3, requires_assembly_disassembly: true },
    { name: 'kueche_arbeitsplatte_3_4m', label: 'Küche- / Arbeitsplatte (Breite 3–4 m)', icon: 'fas fa-kitchen-set', volume_m3: 0.4, requires_assembly_disassembly: true },
    { name: 'kuechenoberschrank_0_1m', label: 'Küchenoberschrank (Breite 0–1 m)', icon: 'fas fa-kitchen-set', volume_m3: 0.4, requires_assembly_disassembly: true },
    { name: 'kuechenoberschrank_1_2m', label: 'Küchenoberschrank (Breite 1–2 m)', icon: 'fas fa-kitchen-set', volume_m3: 0.8, requires_assembly_disassembly: true },
    { name: 'kuechenunterschrank_0_1m', label: 'Küchenunterschrank (Breite 0–1 m)', icon: 'fas fa-kitchen-set', volume_m3: 0.4, requires_assembly_disassembly: true },
    { name: 'kuechenunterschrank_1_2m', label: 'Küchenunterschrank (Breite 1–2 m)', icon: 'fas fa-kitchen-set', volume_m3: 0.8, requires_assembly_disassembly: true },
    { name: 'kuechenzeile_1_2m', label: 'Küchenzeile (Breite 1–2 m)', icon: 'fas fa-kitchen-set', volume_m3: 1.5, requires_assembly_disassembly: true },
    { name: 'kuechenzeile_2_3m', label: 'Küchenzeile (Breite 2–3 m)', icon: 'fas fa-kitchen-set', volume_m3: 2.5, requires_assembly_disassembly: true },
    { name: 'kuechenzeile_3_4m', label: 'Küchenzeile (Breite 3–4 m)', icon: 'fas fa-kitchen-set', volume_m3: 3.5, requires_assembly_disassembly: true },
    { name: 'kuehlschrank', label: 'Kühlschrank', icon: 'fas fa-snowflake', volume_m3: 0.5, requires_assembly_disassembly: true },
    { name: 'kuehlschrank_gefrierkombi', label: 'Kühlschrank (Gefrierkombi)', icon: 'fas fa-snowflake', volume_m3: 0.6, requires_assembly_disassembly: true },
    { name: 'kuehlschrank_amerikanisch', label: 'Kühlschrank (amerikanisch)', icon: 'fas fa-snowflake', volume_m3: 1.5, requires_assembly_disassembly: true },
    { name: 'kurzhantel_set_0_50kg', label: 'Kurzhantel-Set (0–50 kg)', icon: 'fas fa-dumbbell', volume_m3: 0.1 },
    { name: 'kurzhantel_set_50_100kg', label: 'Kurzhantel-Set (50–100 kg)', icon: 'fas fa-dumbbell', volume_m3: 0.2 },
    { name: 'langhantel_set', label: 'Langhantel-Set', icon: 'fas fa-dumbbell', volume_m3: 0.2 },
    { name: 'lastenfahrrad', label: 'Lastenfahrrad', icon: 'fas fa-bicycle', volume_m3: 1.5 },
    { name: 'lattenrost_0_1m', label: 'Lattenrost (Breite 0–1 m)', icon: 'fas fa-bed', volume_m3: 0.1 },
    { name: 'lattenrost_ueber_1m', label: 'Lattenrost (Breite über 1 m)', icon: 'fas fa-bed', volume_m3: 0.2 },
    { name: 'leiter', label: 'Leiter', icon: 'fas fa-ladder', volume_m3: 0.2 },
    { name: 'liegestuhl', label: 'Liegestuhl', icon: 'fas fa-chair', volume_m3: 0.4 },
    { name: 'loungetisch', label: 'Loungetisch', icon: 'fas fa-table', volume_m3: 0.5 },
    { name: 'mikrowelle', label: 'Mikrowelle', icon: 'fas fa-microphone', volume_m3: 0.2, requires_assembly_disassembly: true },
    { name: 'monitor', label: 'Monitor', icon: 'fas fa-desktop', volume_m3: 0.2 },
    { name: 'muelltonne', label: 'Mülltonne', icon: 'fas fa-trash', volume_m3: 0.5 },
    { name: 'nachttisch_nachtkasten', label: 'Nachttisch / Nachtkasten', icon: 'fas fa-bed', volume_m3: 0.2 },
    { name: 'naehmaschine', label: 'Nähmaschine', icon: 'fas fa-sewing-machine', volume_m3: 0.4 },
    { name: 'regal_0_1m', label: 'Regal (Breite 0–1 m)', icon: 'fas fa-shelf', volume_m3: 0.4 },
    { name: 'regal_1_2m', label: 'Regal (Breite 1–2 m)', icon: 'fas fa-shelf', volume_m3: 0.8 },
    { name: 'regal_2_3m', label: 'Regal (Breite 2–3 m)', icon: 'fas fa-shelf', volume_m3: 1.2 },
    { name: 'regal_3_4m', label: 'Regal (Breite 3–4 m)', icon: 'fas fa-shelf', volume_m3: 1.6 },
    { name: 'regal_4_5m', label: 'Regal (Breite 4–5 m)', icon: 'fas fa-shelf', volume_m3: 2 },
    { name: 'regentonne', label: 'Regentonne', icon: 'fas fa-tint', volume_m3: 0.5 },
    { name: 'rollator', label: 'Rollator', icon: 'fas fa-wheelchair', volume_m3: 0.3 },
    { name: 'rollcontainer', label: 'Rollcontainer', icon: 'fas fa-box', volume_m3: 0.3 },
    { name: 'roller_vespa', label: 'Roller / Vespa', icon: 'fas fa-motorcycle', volume_m3: 1 },
    { name: 'rasenmaeher', label: 'Rasenmäher', icon: 'fas fa-tools', volume_m3: 1 },
    { name: 'schlafcouch_schlafsofa', label: 'Schlafcouch / Schlafsofa', icon: 'fas fa-couch', volume_m3: 1.8 },
    { name: 'schlitten', label: 'Schlitten', icon: 'fas fa-sleigh', volume_m3: 0.2 },
    { name: 'schmink_spiegeltisch', label: 'Schmink- / Spiegeltisch', icon: 'fas fa-mirror', volume_m3: 0.6 },
    { name: 'schrank_0_1m', label: 'Schrank (Breite 0–1 m)', icon: 'fas fa-door-open', volume_m3: 0.8 },
    { name: 'schrank_1_2m', label: 'Schrank (Breite 1–2 m)', icon: 'fas fa-door-open', volume_m3: 1.6 },
    { name: 'schrank_2_3m', label: 'Schrank (Breite 2–3 m)', icon: 'fas fa-door-open', volume_m3: 2.4 },
    { name: 'schrank_3_4m', label: 'Schrank (Breite 3–4 m)', icon: 'fas fa-door-open', volume_m3: 3.2 },
    { name: 'schreibtisch_0_1m', label: 'Schreibtisch (Breite 0–1 m)', icon: 'fas fa-desktop', volume_m3: 1 },
    { name: 'schreibtisch_1_2m', label: 'Schreibtisch (Breite 1–2 m)', icon: 'fas fa-desktop', volume_m3: 1.7 },
    { name: 'schreibtischcontainer_rollcontainer', label: 'Schreibtischcontainer / Rollcontainer', icon: 'fas fa-box', volume_m3: 0.3 },
    { name: 'schreibtischstuhl_buerostuhl', label: 'Schreibtischstuhl / Bürostuhl', icon: 'fas fa-chair', volume_m3: 0.3 },
    { name: 'schubkarre_sackkarre', label: 'Schubkarre / Sackkarre', icon: 'fas fa-tools', volume_m3: 0.4 },
    { name: 'schuhschrank_0_1m', label: 'Schuhschrank (Breite 0–1 m)', icon: 'fas fa-shoe-prints', volume_m3: 0.4 },
    { name: 'schuhschrank_1_2m', label: 'Schuhschrank (Breite 1–2 m)', icon: 'fas fa-shoe-prints', volume_m3: 0.6 },
    { name: 'scooter', label: 'Scooter', icon: 'fas fa-scooter', volume_m3: 0.2 },
    { name: 'servierwagen', label: 'Servierwagen', icon: 'fas fa-table', volume_m3: 0.3 },
    { name: 'sessel', label: 'Sessel', icon: 'fas fa-chair', volume_m3: 0.8 },
    { name: 'ski', label: 'Ski', icon: 'fas fa-skiing', volume_m3: 0.2 },
    { name: 'snowboard', label: 'Snowboard', icon: 'fas fa-snowboarding', volume_m3: 0.2 },
    { name: 'sonnenschirm', label: 'Sonnenschirm', icon: 'fas fa-umbrella', volume_m3: 0.3 },
    { name: 'spiegel_s', label: 'Spiegel S (Längste Seite unter 1 m)', icon: 'fas fa-mirror', volume_m3: 0.1 },
    { name: 'spiegel_l', label: 'Spiegel L (Längste Seite über 1 m)', icon: 'fas fa-mirror', volume_m3: 0.2 },
    { name: 'spuelbecken', label: 'Spülbecken', icon: 'fas fa-sink', volume_m3: 0.2, requires_assembly_disassembly: true },
    { name: 'spuelmaschine', label: 'Spülmaschine', icon: 'fas fa-sink', volume_m3: 0.6, requires_assembly_disassembly: true },
    { name: 'staubsauger', label: 'Staubsauger', icon: 'fas fa-wind', volume_m3: 0.2 },
    { name: 'stehlampe', label: 'Stehlampe', icon: 'fas fa-lightbulb', volume_m3: 0.3, requires_assembly_disassembly: true },
    { name: 'stepper_hometrainer_laufband', label: 'Stepper / Hometrainer / Laufband', icon: 'fas fa-running', volume_m3: 0.5 },
    { name: 'stuhl', label: 'Stuhl', icon: 'fas fa-chair', volume_m3: 0.2 },
    { name: 'teppich', label: 'Teppich', icon: 'fas fa-square', volume_m3: 0.3 },
    { name: 'tisch_rund', label: 'Tisch rund', icon: 'fas fa-table', volume_m3: 0.5 },
    { name: 'tischfussball_kicker', label: 'Tischfußball / Kicker', icon: 'fas fa-table', volume_m3: 1 },
    { name: 'tischtennisplatte', label: 'Tischtennisplatte', icon: 'fas fa-table', volume_m3: 2 },
    { name: 'toilettenschrank', label: 'Toilettenschrank', icon: 'fas fa-door-open', volume_m3: 0.2 },
    { name: 'trockner_waeschetrockner', label: 'Trockner / Wäschetrockner', icon: 'fas fa-tshirt', volume_m3: 0.5 },
    { name: 'tv_0_49zoll', label: 'TV / Fernseher (0–49 Zoll)', icon: 'fas fa-tv', volume_m3: 0.5 },
    { name: 'tv_49_100zoll', label: 'TV / Fernseher (49–100 Zoll)', icon: 'fas fa-tv', volume_m3: 1 },
    { name: 'vitrine_0_1m', label: 'Vitrine / Glasschrank (Breite 0–1 m)', icon: 'fas fa-door-open', volume_m3: 0.8 },
    { name: 'vitrine_1_2m', label: 'Vitrine / Glasschrank (Breite 1–2 m)', icon: 'fas fa-door-open', volume_m3: 1 },
    { name: 'wandbrett_0_2m', label: 'Wandbrett (0–2 m)', icon: 'fas fa-shelf', volume_m3: 0.1 },
    { name: 'wandbrett_2_4m', label: 'Wandbrett (2–4 m)', icon: 'fas fa-shelf', volume_m3: 0.2 },
    { name: 'wandgarderobe', label: 'Wandgarderobe', icon: 'fas fa-tshirt', volume_m3: 0.1 },
    { name: 'wanduhr', label: 'Wanduhr', icon: 'fas fa-clock', volume_m3: 0.2 },
    { name: 'waschbeckenunterschrank', label: 'Waschbeckenunterschrank', icon: 'fas fa-sink', volume_m3: 0.4 },
    { name: 'waschmaschine', label: 'Waschmaschine', icon: 'fas fa-tshirt', volume_m3: 0.5 },
    { name: 'wasserbett', label: 'Wasserbett', icon: 'fas fa-bed', volume_m3: 1.5 },
    { name: 'waeschestaender', label: 'Wäscheständer', icon: 'fas fa-tshirt', volume_m3: 0.1 },
    { name: 'waeschekorb', label: 'Wäschekorb', icon: 'fas fa-tshirt', volume_m3: 0.2 },
    { name: 'werkbank_zerlegbar', label: 'Werkbank (zerlegbar)', icon: 'fas fa-tools', volume_m3: 0.4 },
    { name: 'werkzeugkoffer', label: 'Werkzeugkoffer', icon: 'fas fa-tools', volume_m3: 0.1 },
    { name: 'werkzeugschrank_0_1m', label: 'Werkzeugschrank (Breite 0–1 m)', icon: 'fas fa-tools', volume_m3: 0.4 },
    { name: 'werkzeugschrank_1_2m', label: 'Werkzeugschrank (Breite 1–2 m)', icon: 'fas fa-tools', volume_m3: 0.8 },
    { name: 'wickeltisch_babykommode', label: 'Wickeltisch / Babykommode', icon: 'fas fa-baby', volume_m3: 0.7 },
    { name: 'winkelschreibtisch', label: 'Winkelschreibtisch', icon: 'fas fa-desktop', volume_m3: 2 },
    { name: 'wohnwand_0_2m', label: 'Wohnwand (Breite 0–2 m)', icon: 'fas fa-tv', volume_m3: 2 },
    { name: 'wohnwand_2_3m', label: 'Wohnwand (Breite 2–3 m)', icon: 'fas fa-tv', volume_m3: 3 },
    { name: 'zelt', label: 'Zelt', icon: 'fas fa-campground', volume_m3: 0.2 },
  ],
}

