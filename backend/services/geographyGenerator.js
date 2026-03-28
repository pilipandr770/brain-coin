/**
 * Geography Question Generator
 *
 * Generates capital city quiz questions from a static dataset — no AI API needed.
 * Two question types:
 *   1. "Was ist die Hauptstadt von [country]?" (country → capital)
 *   2. "In welchem Land ist [capital] die Hauptstadt?" (capital → country)
 *
 * Wrong answers are other real capitals / countries from the dataset,
 * making the questions educationally meaningful without being trivial.
 */

// [country, capital] pairs — German country names, real capitals
const CAPITALS_DATA = [
  // Europe
  ['Deutschland', 'Berlin'],
  ['Frankreich', 'Paris'],
  ['Spanien', 'Madrid'],
  ['Italien', 'Rom'],
  ['Portugal', 'Lissabon'],
  ['Großbritannien', 'London'],
  ['Irland', 'Dublin'],
  ['Norwegen', 'Oslo'],
  ['Schweden', 'Stockholm'],
  ['Dänemark', 'Kopenhagen'],
  ['Finnland', 'Helsinki'],
  ['Island', 'Reykjavik'],
  ['Niederlande', 'Amsterdam'],
  ['Belgien', 'Brüssel'],
  ['Luxemburg', 'Luxemburg'],
  ['Schweiz', 'Bern'],
  ['Österreich', 'Wien'],
  ['Polen', 'Warschau'],
  ['Tschechien', 'Prag'],
  ['Slowakei', 'Bratislava'],
  ['Ungarn', 'Budapest'],
  ['Rumänien', 'Bukarest'],
  ['Bulgarien', 'Sofia'],
  ['Griechenland', 'Athen'],
  ['Albanien', 'Tirana'],
  ['Serbien', 'Belgrad'],
  ['Kroatien', 'Zagreb'],
  ['Slowenien', 'Ljubljana'],
  ['Ukraine', 'Kiew'],
  ['Weißrussland', 'Minsk'],
  ['Lettland', 'Riga'],
  ['Litauen', 'Vilnius'],
  ['Estland', 'Tallinn'],
  ['Russland', 'Moskau'],
  ['Malta', 'Valletta'],
  ['Zypern', 'Nikosia'],
  ['Moldawien', 'Chișinău'],
  ['Nordmazedonien', 'Skopje'],
  ['Bosnien und Herzegowina', 'Sarajevo'],
  ['Montenegro', 'Podgorica'],
  ['Kosovo', 'Pristina'],
  // Americas
  ['USA', 'Washington D.C.'],
  ['Kanada', 'Ottawa'],
  ['Mexiko', 'Mexiko-Stadt'],
  ['Brasilien', 'Brasília'],
  ['Argentinien', 'Buenos Aires'],
  ['Chile', 'Santiago'],
  ['Peru', 'Lima'],
  ['Kolumbien', 'Bogotá'],
  ['Venezuela', 'Caracas'],
  ['Kuba', 'Havanna'],
  ['Ecuador', 'Quito'],
  ['Bolivien', 'Sucre'],
  ['Paraguay', 'Asunción'],
  ['Uruguay', 'Montevideo'],
  ['Guatemala', 'Guatemala-Stadt'],
  ['Costa Rica', 'San José'],
  ['Panama', 'Panama-Stadt'],
  ['Jamaika', 'Kingston'],
  // Asia
  ['China', 'Peking'],
  ['Japan', 'Tokio'],
  ['Südkorea', 'Seoul'],
  ['Nordkorea', 'Pjöngjang'],
  ['Indien', 'Neu-Delhi'],
  ['Pakistan', 'Islamabad'],
  ['Bangladesh', 'Dhaka'],
  ['Thailand', 'Bangkok'],
  ['Vietnam', 'Hanoi'],
  ['Malaysia', 'Kuala Lumpur'],
  ['Singapur', 'Singapur'],
  ['Indonesien', 'Jakarta'],
  ['Philippinen', 'Manila'],
  ['Kambodscha', 'Phnom Penh'],
  ['Myanmar', 'Naypyidaw'],
  ['Iran', 'Teheran'],
  ['Irak', 'Bagdad'],
  ['Saudi-Arabien', 'Riad'],
  ['Türkei', 'Ankara'],
  ['Syrien', 'Damaskus'],
  ['Libanon', 'Beirut'],
  ['Israel', 'Jerusalem'],
  ['Jordanien', 'Amman'],
  ['Afghanistan', 'Kabul'],
  ['Kasachstan', 'Astana'],
  ['Usbekistan', 'Taschkent'],
  ['Aserbaidschan', 'Baku'],
  ['Armenien', 'Eriwan'],
  ['Georgien', 'Tiflis'],
  ['Mongolei', 'Ulaanbaatar'],
  ['Nepal', 'Kathmandu'],
  ['Sri Lanka', 'Sri Jayawardenepura Kotte'],
  ['Laos', 'Vientiane'],
  ['Taiwan', 'Taipeh'],
  ['Katar', 'Doha'],
  ['Kuwait', 'Kuwait-Stadt'],
  ['Vereinigte Arabische Emirate', 'Abu Dhabi'],
  // Africa
  ['Ägypten', 'Kairo'],
  ['Marokko', 'Rabat'],
  ['Tunesien', 'Tunis'],
  ['Algerien', 'Algier'],
  ['Libyen', 'Tripolis'],
  ['Äthiopien', 'Addis Abeba'],
  ['Nigeria', 'Abuja'],
  ['Ghana', 'Accra'],
  ['Kenia', 'Nairobi'],
  ['Tansania', 'Dodoma'],
  ['Südafrika', 'Pretoria'],
  ['Angola', 'Luanda'],
  ['Senegal', 'Dakar'],
  ['Demokratische Republik Kongo', 'Kinshasa'],
  ['Sudan', 'Khartum'],
  ['Mosambik', 'Maputo'],
  ['Madagaskar', 'Antananarivo'],
  ['Kamerun', 'Jaunde'],
  ['Simbabwe', 'Harare'],
  ['Sambia', 'Lusaka'],
  ['Uganda', 'Kampala'],
  ['Ruanda', 'Kigali'],
  ['Kap Verde', 'Praia'],
  // Oceania
  ['Australien', 'Canberra'],
  ['Neuseeland', 'Wellington'],
  ['Fidschi', 'Suva'],
  ['Papua-Neuguinea', 'Port Moresby'],
];

// Build lookup maps
const COUNTRIES = CAPITALS_DATA.map(([c]) => c);
const CAPITALS  = CAPITALS_DATA.map(([, cap]) => cap);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, exclude, count) {
  const pool = arr.filter(x => x !== exclude);
  const picked = [];
  const used = new Set();
  while (picked.length < count && used.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) { used.add(idx); picked.push(pool[idx]); }
  }
  return picked.slice(0, count);
}

/**
 * Generate capital city questions (country→capital, capital→country).
 */
function generateCapitalQuestions() {
  const questions = [];

  CAPITALS_DATA.forEach(([country, capital]) => {
    // Type 1: country → capital
    const wrongCapitals = pickRandom(CAPITALS, capital, 3);
    const answers1 = shuffle([capital, ...wrongCapitals]);
    questions.push({
      text: `Was ist die Hauptstadt von ${country}?`,
      answers: answers1,
      correct_index: answers1.indexOf(capital),
      difficulty: 'medium',
    });

    // Type 2: capital → country
    const wrongCountries = pickRandom(COUNTRIES, country, 3);
    const answers2 = shuffle([country, ...wrongCountries]);
    questions.push({
      text: `In welchem Land ist ${capital} die Hauptstadt?`,
      answers: answers2,
      correct_index: answers2.indexOf(country),
      difficulty: 'medium',
    });
  });

  return questions;
}

// ─── Rivers dataset ──────────────────────────────────────────────────────────
// [name, main_country, continent]
const RIVERS_DATA = [
  ['Nil',             'Ägypten',                       'Afrika'],
  ['Amazonas',        'Brasilien',                     'Südamerika'],
  ['Jangtse',         'China',                         'Asien'],
  ['Mississippi',     'USA',                           'Nordamerika'],
  ['Ob',              'Russland',                      'Asien'],
  ['Jenissei',        'Russland',                      'Asien'],
  ['Gelber Fluss',    'China',                         'Asien'],
  ['Amur',            'Russland',                      'Asien'],
  ['Kongo',           'Demokratische Republik Kongo',  'Afrika'],
  ['Niger',           'Nigeria',                       'Afrika'],
  ['Wolga',           'Russland',                      'Europa'],
  ['Donau',           'Rumänien',                      'Europa'],
  ['Rhein',           'Deutschland',                   'Europa'],
  ['Elbe',            'Deutschland',                   'Europa'],
  ['Oder',            'Polen',                         'Europa'],
  ['Weichsel',        'Polen',                         'Europa'],
  ['Seine',           'Frankreich',                    'Europa'],
  ['Themse',          'Großbritannien',                'Europa'],
  ['Dnjepr',          'Ukraine',                       'Europa'],
  ['Tiber',           'Italien',                       'Europa'],
  ['Euphrat',         'Irak',                          'Asien'],
  ['Tigris',          'Irak',                          'Asien'],
  ['Ganges',          'Indien',                        'Asien'],
  ['Indus',           'Pakistan',                      'Asien'],
  ['Mekong',          'Vietnam',                       'Asien'],
  ['Orinoco',         'Venezuela',                     'Südamerika'],
  ['Paraná',          'Argentinien',                   'Südamerika'],
  ['Sambesi',         'Sambia',                        'Afrika'],
  ['Murray',          'Australien',                    'Australien'],
  ['Jordan',          'Israel',                        'Asien'],
];

// ─── Mountains dataset ───────────────────────────────────────────────────────
// [name, country, mountain_range]
const MOUNTAINS_DATA = [
  ['Mount Everest',       'Nepal',           'Himalaya'],
  ['K2',                  'Pakistan',        'Karakorum'],
  ['Kangchendzönga',      'Nepal',           'Himalaya'],
  ['Mont Blanc',          'Frankreich',      'Alpen'],
  ['Elbrus',              'Russland',        'Kaukasus'],
  ['Kilimandscharo',      'Tansania',        'Ostafrika'],
  ['Aconcagua',           'Argentinien',     'Anden'],
  ['Denali',              'USA',             'Alaska Range'],
  ['Zugspitze',           'Deutschland',     'Alpen'],
  ['Großglockner',        'Österreich',      'Alpen'],
  ['Matterhorn',          'Schweiz',         'Alpen'],
  ['Fuji',                'Japan',           'Japanische Inseln'],
  ['Olymp',               'Griechenland',    'Makedonisches Gebirge'],
  ['Ätna',                'Italien',         'Apenninen'],
  ['Teide',               'Spanien',         'Kanarische Inseln'],
  ['Ben Nevis',           'Großbritannien',  'Schottische Highlands'],
  ['Triglav',             'Slowenien',       'Julische Alpen'],
  ['Rysy',                'Polen',           'Hohe Tatra'],
  ['Vinson-Massif',       'Antarktis',       'Ellsworthberge'],
  ['Chimborazo',          'Ecuador',         'Anden'],
  ['Logan',               'Kanada',          'St.-Elias-Berge'],
  ['Pico de Orizaba',     'Mexiko',          'Sierra Madre'],
  ['Kosciuszko',          'Australien',      'Australische Alpen'],
  ['Vesuvio',             'Italien',         'Apenninen'],
  ['Popocatépetl',        'Mexiko',          'Sierra Nevada'],
];

function generateRiverQuestions() {
  const questions = [];
  const allContinents = [...new Set(RIVERS_DATA.map(([,, c]) => c))];
  const allCountries  = RIVERS_DATA.map(([, country]) => country);

  RIVERS_DATA.forEach(([river, country, continent]) => {
    // Type 1: country → river
    const wrongCountries = pickRandom(allCountries, country, 3);
    const ans1 = shuffle([country, ...wrongCountries]);
    questions.push({
      text: `Durch welches Land fließt der Fluss ${river} hauptsächlich?`,
      answers: ans1,
      correct_index: ans1.indexOf(country),
      difficulty: 'medium',
    });

    // Type 2: continent → river (which river is on this continent?)
    const wrongContinents = pickRandom(allContinents, continent, 3);
    const ans2 = shuffle([continent, ...wrongContinents]);
    questions.push({
      text: `Auf welchem Kontinent liegt der Fluss ${river}?`,
      answers: ans2,
      correct_index: ans2.indexOf(continent),
      difficulty: 'easy',
    });
  });

  return questions;
}

function generateMountainQuestions() {
  const questions = [];
  const allCountries = MOUNTAINS_DATA.map(([, c]) => c);
  const allRanges    = MOUNTAINS_DATA.map(([,, r]) => r);

  MOUNTAINS_DATA.forEach(([mountain, country, range]) => {
    // Type 1: in which country?
    const wrongCountries = pickRandom(allCountries, country, 3);
    const ans1 = shuffle([country, ...wrongCountries]);
    questions.push({
      text: `In welchem Land befindet sich der Berg ${mountain}?`,
      answers: ans1,
      correct_index: ans1.indexOf(country),
      difficulty: 'medium',
    });

    // Type 2: in which mountain range?
    const wrongRanges = pickRandom(allRanges, range, 3);
    const ans2 = shuffle([range, ...wrongRanges]);
    questions.push({
      text: `Zu welchem Gebirge gehört der Berg ${mountain}?`,
      answers: ans2,
      correct_index: ans2.indexOf(range),
      difficulty: 'hard',
    });
  });

  return questions;
}

/**
 * Generate all geography questions: capitals + rivers + mountains.
 * Returns ~440 diverse questions from 100% static data — zero API cost.
 */
function generateAllGeographyQuestions() {
  return [
    ...generateCapitalQuestions(),
    ...generateRiverQuestions(),
    ...generateMountainQuestions(),
  ];
}

module.exports = {
  generateAllGeographyQuestions,
  CAPITALS_COUNT: CAPITALS_DATA.length,
  RIVERS_COUNT:   RIVERS_DATA.length,
  MOUNTAINS_COUNT: MOUNTAINS_DATA.length,
};
