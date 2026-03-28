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
 * Generate all possible geography questions from the dataset.
 * Returns an array of question objects ready to be saved to the DB.
 */
function generateAllGeographyQuestions() {
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

module.exports = { generateAllGeographyQuestions, CAPITALS_COUNT: CAPITALS_DATA.length };
