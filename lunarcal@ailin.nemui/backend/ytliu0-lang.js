
var tlMap = {}

// en
tlMap[0] = {
  "%(Y60)年%(M60)月%(D60)日": "Y:%(Y60) M:%(M60) D:%(D60)",
  "%(YUE)月": "M%(YUE)",
  "%(NIAN)年%(YUE)月%(RI)日": "%(csy)-%(YUE)-%(RI)",
  "%(YUE)月%(RI)日": "%(YUE)-%(RI)",
  soltermNames: [
    "Slight cold", // J12
    "Great cold",
    "Beginning of spring",
    "Rain water",
    "Waking of insects",
    "Spring divide",
    "Pure brightness",
    "Grain rain",
    "Beginning of summer",
    "Grain full",
    "Grain in ear",
    "Summer extremity",
    "Slight heat",
    "Great heat",
    "Beginning of autumn",
    "Limit of heat",
    "White dew",
    "Autumn divide",
    "Cold dew",
    "Descent of frost",
    "Beginning of winter",
    "Slight snow",
    "Great snow",
    "Winter extremity", // Z11
  ],
}
tlMap[-1] = {
  ...tlMap[0],
  hours: undefined,
  elements: ["Wood", "Fire", "Earth", "Metal", "Water"],
  elementsJoin: (h, e) => `${h} ${e}`,
}

// de
tlMap[-2] = {
  "%(Y60)年%(M60)月%(D60)日": "J:%(Y60) M:%(M60) T:%(D60)",
  "%(YUE)月": "M%(YUE)",
  "%(NIAN)年%(YUE)月%(RI)日": "%(csy)-%(YUE)-%(RI)",
  "%(YUE)月%(RI)日": "%(YUE)-%(RI)",
  soltermNames: [
    "Mäßige Kälte", // J12
    "Große Kälte",
    "Frühlingsanfang",
    "Regen",
    "Erwachen der Insekten",
    "Frühlingstagundnachtgleiche",
    "Klar und hell",
    "Regen auf die Saat",
    "Sommeranfang",
    "Kleine Fülle",
    "Körner mit Grannen",
    "Sommersonnenwende",
    "Mäßige Hitze",
    "Große Hitze",
    "Herbstanfang",
    "Ende der Hitze",
    "Weißer Tau",
    "Herbsttagundnachtgleiche",
    "Kalter Tau",
    "Reif",
    "Winteranfang",
    "Mäßiger Schnee",
    "Großer Schnee",
    "Wintersonnenwende", // Z11
  ],
  animal: [
    "Ratte",
    "Büffel",
    "Tiger",
    "Hase",
    "Drache",
    "Schlange",
    "Pferd",
    "Schaf",
    "Affe",
    "Hahn",
    "Hund",
    "Schwein", 
  ],
}
const animalGen3 = ['', 's', 's', 'n', 'n', '', 's', 's', 'n', 'es', 'es', 's']
tlMap[-3] = {
  ...tlMap[-2],
  hours: tlMap[-2].animal.map((e, i) => e + animalGen3[i]),
  elements: ["Holz", "Feuer", "Erd", "Metall", "Wasser"],
  elementsJoin: (h, e) => `${h}-${e}`,
}

var tlLeap = ['\u2217', '閏', '闰']
