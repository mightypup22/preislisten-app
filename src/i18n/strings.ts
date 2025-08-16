export type Lang = 'de' | 'en'

type Dict = Record<string, string>

export const dict: Record<Lang, Dict> = {
  de: {
    brand: 'Günther Maschinenbau GmbH',
    price_list: 'Preisliste',

    // UI
    search_placeholder: 'Suche…',
    show_more: 'Mehr anzeigen',
    show_less: 'Weniger anzeigen',
    show_more_count: 'Mehr anzeigen ({count})',
    page: 'Seite',
    of: 'von',
    previous: 'Zurück',
    next: 'Weiter',
    all: 'Alle Hauptgruppen',
    all_groups: 'Alle Maschinengruppen',

    // Tabs
    products_tab: 'Produkte',
    labor_tab: 'Arbeit',

    // Produktkarte
    base_price: 'Basispreis',
    add: 'Hinzufügen',
    reset_selection: 'Auswahl zurücksetzen',
    clear_selection: 'Auswahl löschen',
    preview_subtotal: 'Zwischensumme (Vorschau)',
    no_options_for_filter: 'Keine Optionen für den Filter.',
    no_options_available: 'Keine Zusatzoptionen verfügbar.',
    price_on_request: 'auf Anfrage',
    price_label: 'Preis',
    open_options: 'Zusatzoptionen',
    additional_options: 'Zusatzoptionen',
    selected_options: 'Ausgewählte Optionen',
    remove: 'Entfernen',
    apply: 'Übernehmen',
    cancel: 'Abbrechen',

    // Sortierung
    sort_by: 'Sortieren',
    sort_name: 'Name (A–Z)',
    sort_price_asc: 'Preis (aufsteigend)',
    sort_price_desc: 'Preis (absteigend)',

    // Summary
    summary_title: 'Angebotszusammenfassung',
    customer: 'Kunde',
    hardware_costs: 'Produktkosten',
    no_hw: 'Keine Produkte hinzugefügt.',
    labor_costs: 'Arbeitskosten',
    no_labor: 'Keine Arbeitskosten hinzugefügt.',
    days: 'Tage',
    day_rate: 'Tagessatz',
    subtotal_item: 'Zwischensumme (Position)',
    subtotal_labor_item: 'Zwischensumme (Arbeit)',
    subtotal_products: 'Zwischensumme Produkte',
    subtotal_labor: 'Zwischensumme Arbeit',
    subtotal_cart: 'Warenkorb Zwischensumme',
    discount_on_hw: 'Rabatt auf Produkte',
    discount_on_labor: 'Rabatt auf Arbeit',
    discount_percent: 'Rabatt %',
    discount: 'Rabatt',
    final_price: 'Endpreis',
    print: 'Drucken / PDF',

    // Labor
    avg_symbol: 'Ø Aufwand',
    price_per_day: 'Preis pro Tag',
  },
  en: {
    brand: 'Günther Maschinenbau GmbH',
    price_list: 'Price List',

    // UI
    search_placeholder: 'Search…',
    show_more: 'Show more',
    show_less: 'Show less',
    show_more_count: 'Show more ({count})',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    all: 'All main groups',
    all_groups: 'All machine groups',

    // Tabs
    products_tab: 'Products',
    labor_tab: 'Labor',

    // Product card
    base_price: 'Base price',
    add: 'Add',
    reset_selection: 'Reset selection',
    clear_selection: 'Clear selection',
    preview_subtotal: 'Subtotal (preview)',
    no_options_for_filter: 'No options for the filter.',
    no_options_available: 'No additional options available.',
    price_on_request: 'on request',
    price_label: 'Price',
    open_options: 'Additional options',
    additional_options: 'Additional options',
    selected_options: 'Selected options',
    remove: 'Remove',
    apply: 'Apply',
    cancel: 'Cancel',

    // Sorting
    sort_by: 'Sort by',
    sort_name: 'Name (A–Z)',
    sort_price_asc: 'Price (low → high)',
    sort_price_desc: 'Price (high → low)',

    // Summary
    summary_title: 'Quote Summary',
    customer: 'Customer',
    hardware_costs: 'Product costs',
    no_hw: 'No products added.',
    labor_costs: 'Labor costs',
    no_labor: 'No labor added.',
    days: 'Days',
    day_rate: 'Day rate',
    subtotal_item: 'Subtotal (item)',
    subtotal_labor_item: 'Subtotal (labor)',
    subtotal_products: 'Subtotal hardware',
    subtotal_labor: 'Subtotal labor',
    subtotal_cart: 'Cart subtotal',
    discount_on_hw: 'Discount on hardware',
    discount_on_labor: 'Discount on labor',
    discount_percent: 'Discount %',
    discount: 'Discount',
    final_price: 'Final price',
    print: 'Print / PDF',

    // Labor
    avg_symbol: 'Ø Effort',
    price_per_day: 'Price per day',
  }
}
