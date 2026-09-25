import fs from 'fs';
import path from 'path';

export interface BibleVerse {
  number: number;
  text: string;
}

export interface ParsedReference {
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
}

// Function to normalize string (remove accents, lowercase)
const normalize = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Alias map for common variations in Spanish mapping to English names used in JSON
const bookAliases: Record<string, string> = {
  'genesis': 'Genesis', 'gen': 'Genesis',
  'exodo': 'Exodus', 'exo': 'Exodus',
  'levitico': 'Leviticus', 'lev': 'Leviticus',
  'numeros': 'Numbers', 'num': 'Numbers',
  'deuteronomio': 'Deuteronomy', 'deut': 'Deuteronomy',
  'josue': 'Joshua', 'jos': 'Joshua',
  'jueces': 'Judges', 'jue': 'Judges',
  'rut': 'Ruth',
  '1 samuel': '1 Samuel', '1samuel': '1 Samuel', '1 sam': '1 Samuel',
  '2 samuel': '2 Samuel', '2samuel': '2 Samuel', '2 sam': '2 Samuel',
  '1 reyes': '1 Kings', '1reyes': '1 Kings', '1 rey': '1 Kings',
  '2 reyes': '2 Kings', '2reyes': '2 Kings', '2 rey': '2 Kings',
  '1 cronicas': '1 Chronicles', '1cronicas': '1 Chronicles', '1 cro': '1 Chronicles',
  '2 cronicas': '2 Chronicles', '2cronicas': '2 Chronicles', '2 cro': '2 Chronicles',
  'esdras': 'Ezra', 'esd': 'Ezra',
  'nehemias': 'Nehemiah', 'neh': 'Nehemiah',
  'ester': 'Esther', 'est': 'Esther',
  'job': 'Job',
  'salmos': 'Psalms', 'salmo': 'Psalms', 'sal': 'Psalms',
  'proverbios': 'Proverbs', 'prov': 'Proverbs',
  'eclesiastes': 'Ecclesiastes', 'ecl': 'Ecclesiastes',
  'cantares': 'Song of Solomon', 'cantar de los cantares': 'Song of Solomon', 'can': 'Song of Solomon',
  'isaias': 'Isaiah', 'isa': 'Isaiah',
  'jeremias': 'Jeremiah', 'jer': 'Jeremiah',
  'lamentaciones': 'Lamentations', 'lam': 'Lamentations',
  'ezequiel': 'Ezekiel', 'eze': 'Ezekiel',
  'daniel': 'Daniel', 'dan': 'Daniel',
  'oseas': 'Hosea', 'ose': 'Hosea',
  'joel': 'Joel',
  'amos': 'Amos',
  'abdias': 'Obadiah', 'abd': 'Obadiah',
  'jonas': 'Jonah', 'jon': 'Jonah',
  'miqueas': 'Micah', 'miq': 'Micah',
  'nahum': 'Nahum', 'nah': 'Nahum',
  'habacuc': 'Habakkuk', 'hab': 'Habakkuk',
  'sofonias': 'Zephaniah', 'sof': 'Zephaniah',
  'hageo': 'Haggai', 'hag': 'Haggai',
  'zacarias': 'Zechariah', 'zac': 'Zechariah',
  'malaquias': 'Malachi', 'mal': 'Malachi',
  'mateo': 'Matthew', 'mat': 'Matthew',
  'marcos': 'Mark', 'mar': 'Mark',
  'lucas': 'Luke', 'luc': 'Luke',
  'juan': 'John', 'jn': 'John',
  'hechos': 'Acts', 'hech': 'Acts',
  'romanos': 'Romans', 'rom': 'Romans',
  '1 corintios': '1 Corinthians', '1corintios': '1 Corinthians', '1 cor': '1 Corinthians',
  '2 corintios': '2 Corinthians', '2corintios': '2 Corinthians', '2 cor': '2 Corinthians',
  'galatas': 'Galatians', 'gal': 'Galatians',
  'efesios': 'Ephesians', 'efe': 'Ephesians',
  'filipenses': 'Philippians', 'fil': 'Philippians',
  'colosenses': 'Colossians', 'col': 'Colossians',
  '1 tesalonicenses': '1 Thessalonians', '1tesalonicenses': '1 Thessalonians', '1 tes': '1 Thessalonians',
  '2 tesalonicenses': '2 Thessalonians', '2tesalonicenses': '2 Thessalonians', '2 tes': '2 Thessalonians',
  '1 timoteo': '1 Timothy', '1timoteo': '1 Timothy', '1 tim': '1 Timothy',
  '2 timoteo': '2 Timothy', '2timoteo': '2 Timothy', '2 tim': '2 Timothy',
  'tito': 'Titus', 'tit': 'Titus',
  'filemon': 'Philemon', 'flm': 'Philemon',
  'hebreos': 'Hebrews', 'heb': 'Hebrews',
  'santiago': 'James', 'sant': 'James',
  '1 pedro': '1 Peter', '1pedro': '1 Peter', '1 pe': '1 Peter',
  '2 pedro': '2 Peter', '2pedro': '2 Peter', '2 pe': '2 Peter',
  '1 juan': '1 John', '1juan': '1 John', '1 jn': '1 John',
  '2 juan': '2 John', '2juan': '2 John', '2 jn': '2 John',
  '3 juan': '3 John', '3juan': '3 John', '3 jn': '3 John',
  'judas': 'Jude', 'jud': 'Jude',
  'apocalipsis': 'Revelation', 'apo': 'Revelation',
};

// Caching the bible in memory (only runs on server)
let bibleData: any = null;

function getBibleData() {
  if (bibleData) return bibleData;
  const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'es_rvr.json');
  try {
    let fileContents = fs.readFileSync(filePath, 'utf8');
    // Strip BOM if present
    fileContents = fileContents.replace(/^\uFEFF/, '');
    bibleData = JSON.parse(fileContents);
    return bibleData;
  } catch (error) {
    console.error('Error reading Bible JSON:', error);
    return [];
  }
}

const englishToSpanish: Record<string, string> = {
  'Genesis': 'Génesis', 'Exodus': 'Éxodo', 'Leviticus': 'Levítico', 'Numbers': 'Números', 'Deuteronomy': 'Deuteronomio',
  'Joshua': 'Josué', 'Judges': 'Jueces', 'Ruth': 'Rut', '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes', '2 Kings': '2 Reyes', '1 Chronicles': '1 Crónicas', '2 Chronicles': '2 Crónicas',
  'Ezra': 'Esdras', 'Nehemiah': 'Nehemías', 'Esther': 'Ester', 'Job': 'Job', 'Psalms': 'Salmos',
  'Proverbs': 'Proverbios', 'Ecclesiastes': 'Eclesiastés', 'Song of Solomon': 'Cantares', 'Isaiah': 'Isaías',
  'Jeremiah': 'Jeremías', 'Lamentations': 'Lamentaciones', 'Ezekiel': 'Ezequiel', 'Daniel': 'Daniel',
  'Hosea': 'Oseas', 'Joel': 'Joel', 'Amos': 'Amós', 'Obadiah': 'Abdías', 'Jonah': 'Jonás',
  'Micah': 'Miqueas', 'Nahum': 'Nahúm', 'Habakkuk': 'Habacuc', 'Zephaniah': 'Sofonías', 'Haggai': 'Hageo',
  'Zechariah': 'Zacarías', 'Malachi': 'Malaquías', 'Matthew': 'Mateo', 'Mark': 'Marcos', 'Luke': 'Lucas',
  'John': 'Juan', 'Acts': 'Hechos', 'Romans': 'Romanos', '1 Corinthians': '1 Corintios', '2 Corinthians': '2 Corintios',
  'Galatians': 'Gálatas', 'Ephesians': 'Efesios', 'Philippians': 'Filipenses', 'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses', '2 Thessalonians': '2 Tesalonicenses', '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo', 'Titus': 'Tito', 'Philemon': 'Filemón', 'Hebrews': 'Hebreos', 'James': 'Santiago',
  '1 Peter': '1 Pedro', '2 Peter': '2 Pedro', '1 John': '1 Juan', '2 John': '2 Juan', '3 John': '3 Juan',
  'Jude': 'Judas', 'Revelation': 'Apocalipsis'
};

export function parseBibleRefs(refString: string): ParsedReference[] {
  const data = getBibleData();
  if (!data || data.length === 0) return [];

  // Simple split by comma for multiple references like "Efesios 2:14-16, Juan 3:16"
  const refs = refString.split(',').map(r => r.trim());
  const results: ParsedReference[] = [];

  const regex = /^((\d?\s*)?[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+(\d+):(\d+)(?:-(\d+))?$/i;

  for (const ref of refs) {
    const match = ref.match(regex);
    if (match) {
      const rawBookName = match[1].trim();
      const chapter = parseInt(match[3], 10);
      const startVerse = parseInt(match[4], 10);
      const endVerse = match[5] ? parseInt(match[5], 10) : startVerse;

      const normBook = normalize(rawBookName);
      const bookToSearch = bookAliases[normBook] || normBook;

      const book = data.find((b: any) => normalize(b.name) === normalize(bookToSearch));

      if (book) {
        // Chapters in the JSON are 0-indexed array of arrays
        const chapterData = book.chapters[chapter - 1];
        if (chapterData) {
          const verses: BibleVerse[] = [];
          for (let v = startVerse; v <= endVerse; v++) {
            const verseText = chapterData[v - 1];
            if (verseText) {
              verses.push({ number: v, text: verseText });
            }
          }
          if (verses.length > 0) {
            results.push({
              bookName: englishToSpanish[book.name] || book.name,
              chapter,
              verses
            });
          }
        }
      }
    }
  }

  return results;
}
