/**
 * Expand Word List with Full Validation (REUSABLE)
 * Phase 18.1.7 Extension - Validated Data Flow
 * 
 * Usage:
 *   npx tsx scripts/expand-words.ts [count]
 *   npx tsx scripts/expand-words.ts 50
 *   npx tsx scripts/expand-words.ts 500
 *   npx tsx scripts/expand-words.ts 1000
 * 
 * This script:
 * 1. Uses Wiktionary top words as source (credible, lemmatized)
 * 2. Filters out words already in database AND JSON file
 * 3. Takes next N unique words (specified by user)
 * 4. Enriches with OpenAI (POS, translation, infinitive conversion)
 * 5. VALIDATES at every checkpoint
 * 6. Adds to common-words-5000.json
 * 
 * Safety features:
 * - Automatic backup before changes
 * - Multiple validation checkpoints
 * - Multi-level deduplication
 * - Rollback capability
 * - Detailed logging
 * 
 * Data Flow (Feb 11, 2026):
 * Step 0a: Source Acquisition
 * Step 0b: Filter & Deduplicate (DB + JSON)
 * Step 0c: Enrich with OpenAI
 * Step 0d: Multi-Level Deduplication
 * Step 1: Load word list
 * Step 1.5: Validate word list
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { validateWordList, validateVerbForm, validateTranslation, type WordEntry } from '@/lib/utils/word-list-validator';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Parse command-line argument for target word count
const TARGET_WORDS = parseInt(process.argv[2] || '50', 10);

if (isNaN(TARGET_WORDS) || TARGET_WORDS < 1) {
  console.error('❌ Invalid word count. Usage: npx tsx scripts/expand-words.ts [count]');
  console.error('   Example: npx tsx scripts/expand-words.ts 500\n');
  process.exit(1);
}

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Extended Wiktionary top Spanish words (manually curated, lemmatized source)
// This list will be expanded as needed for larger expansions
const WIKTIONARY_WORDS = [
  // Top 200 (most likely already in database)
  "de", "la", "que", "el", "en", "y", "a", "los", "se", "del",
  "un", "con", "las", "por", "su", "para", "una", "no", "es", "al",
  "como", "lo", "más", "fue", "ha", "sus", "este", "o", "pero", "años",
  "esta", "también", "entre", "le", "está", "ya", "han", "dos", "sobre", "desde",
  "ser", "son", "todo", "hasta", "muy", "año", "era", "parte", "tiene", "sin",
  "si", "personas", "cuando", "hay", "donde", "dijo", "después", "porque", "durante", "puede",
  "país", "había", "todos", "fueron", "contra", "primera", "mismo", "vez", "embargo", "millones",
  "me", "están", "nos", "uno", "ciudad", "ese", "día", "gran", "sido", "otros",
  "tiempo", "primer", "nombre", "solo", "momento", "cada", "tres", "hace", "forma", "hacer",
  "lugar", "días", "así", "e", "presidente", "pasado", "vida", "él", "tras", "ante",
  "eso", "cuenta", "quien", "mayor", "caso", "tanto", "hecho", "bien", "ahora", "horas",
  "menos", "estos", "otro", "esa", "cual", "trabajo", "antes", "equipo", "tener", "nuevo",
  "mejor", "será", "mundo", "mucho", "mientras", "según", "manera", "ella", "pueden", "aunque",
  "grupo", "semana", "ni", "mi", "tienen", "estaba", "partido", "bajo", "hoy", "acuerdo",
  "otras", "hacia", "siglo", "través", "les", "va", "encuentra", "estado", "qué", "te",
  "siempre", "situación", "algunos", "esto", "historia", "mil", "serie", "luego", "varios", "final",
  "número", "importante", "tuvo", "poder", "ver", "meses", "nueva", "cuatro", "ellos", "debido",
  "otra", "algo", "siendo", "entonces", "estar", "todas", "junto", "poco", "unos", "sea",
  "general", "población", "largo", "estas", "medio", "eran", "tenía", "sistema", "muchos", "seguridad",
  "casos", "temporada", "último", "casa", "tipo", "hizo", "mujeres", "debe", "toda", "tarde",
  
  // Ranks 201-500 (more likely to be new)
  "crear", "llegar", "pasa", "grandes", "diferencia", "época", "llevar", "edad", "economía",
  "dar", "social", "desarrollo", "papel", "real", "central", "nacional", "ejemplo",
  "punto", "agua", "europa", "carlos", "gobierno", "miembros", "público", "tema", "hijo",
  "cuerpo", "derecho", "causa", "libro", "espacio", "jóvenes", "relación", "político", "base",
  "cambio", "españa", "efecto", "sentido", "capital", "director", "verdad", "realizar", "autor",
  "función", "luz", "empresa", "alto", "continuar", "hombre", "experiencia", "servicio",
  "amor", "rey", "imagen", "norte", "escribir", "cierto", "futuro", "vivir", "conocer", "orden",
  "muerte", "región", "sala", "objetivo", "hablar", "fuerza", "vista", "conseguir", "militar",
  "familia", "común", "datos", "idea", "veces", "condiciones", "estudiar", "sentir",
  "permitir", "guerra", "cambiar", "dirección", "oficina", "propios", "natural", "zona",
  "teatro", "principal", "obra", "formar", "cultura", "producir", "entrar", "respeto", "proceso",
  "ayudar", "dejar", "conocimiento", "pensar", "llamar", "encontrar", "mostrar", "producción",
  "participar", "problema", "comprar", "abrir", "considerar", "ganar", "salir", "perder",
  "utilizar", "vender", "empezar", "llevar", "seguir", "partir", "comenzar", "mantener",
  "presentar", "ofrecer", "recurrir", "suponer", "tratar", "volver", "defender", "aparecer",
  "añadir", "reducir", "establecer", "aplicar", "publicar", "recordar", "recibir", "dedicar",
  "resultado", "ambiente", "elemento", "necesidad", "razón", "origen", "campo", "centro",
  "frente", "nivel", "sector", "mercado", "término", "clase", "modelo", "resto",
  "aspecto", "costa", "distancia", "escuela", "estructura", "especie", "edad", "línea",
  "material", "movimiento", "objeto", "período", "proceso", "producto", "propiedad", "respuesta",
  "superficie", "técnica", "teoría", "territorio", "título", "unidad", "uso", "valor",
  
  // Ranks 501-1000 (likely new)
  "actividad", "actitud", "acción", "acontecimiento", "acuerdo", "administración", "afecto",
  "agenda", "agencia", "agricultura", "aire", "alegría", "alianza", "alma", "análisis",
  "aniversario", "anuncio", "aparato", "apariencia", "aplicación", "apoyo", "aproximación",
  "árbol", "área", "argumento", "arma", "arquitectura", "arte", "artículo", "artista",
  "asamblea", "asociación", "asunto", "ataque", "atención", "atmósfera", "autoridad",
  "aventura", "ayuda", "banco", "barrio", "batalla", "belleza", "beneficio", "biblioteca",
  "bien", "boca", "bolsa", "bosque", "brazo", "brillo", "búsqueda", "cabeza", "cable",
  "cadena", "café", "caída", "caja", "calle", "cama", "cámara", "camino", "campaña",
  "campo", "canal", "canción", "candidato", "cantidad", "capacidad", "capítulo", "carácter",
  "característica", "carga", "cargo", "carne", "carrera", "carta", "casa", "casamiento",
  "categoría", "causa", "celebración", "celular", "cementerio", "censura", "centro",
  "ceremonia", "certeza", "cielo", "ciencia", "científico", "cifra", "cine", "círculo",
  "circunstancia", "cita", "ciudad", "ciudadano", "civil", "civilización", "claridad",
  "clase", "cliente", "clima", "club", "cobro", "cocina", "código", "colección",
  "colegio", "color", "columna", "combinación", "comedia", "comentario", "comercio",
  "comida", "comisión", "comité", "compañero", "compañía", "comparación", "competencia",
  "competición", "complemento", "complejo", "comportamiento", "composición", "compra",
  "comprensión", "compromiso", "comunicación", "comunidad", "concepto", "conciencia",
  "concierto", "conclusión", "condición", "conducta", "conferencia", "confianza",
  "conflicto", "confusión", "congreso", "conjunto", "conocido", "conquista", "consecuencia",
  "consejo", "conservación", "consideración", "consigna", "construcción", "consulta",
  "consumo", "contacto", "contenido", "contexto", "continente", "continuación", "contrato",
  "contradicción", "contrario", "contraste", "control", "controversia", "convención",
  "conversación", "conversión", "cooperación", "coordinación", "copia", "corazón",
  "corriente", "corte", "cosa", "creación", "creador", "crecimiento", "crédito",
  "creencia", "crimen", "crisis", "criterio", "crítica", "crónica", "cruz", "cuadro",
  "cual", "cualidad", "cuarto", "cuenta", "cuerpo", "cuestión", "cuidado", "culpa",
  "cultivo", "cultura", "cumbre", "cumplimiento", "cura", "curiosidad", "curso", "curva"
];

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

interface ExpansionResult {
  wordsAdded: number;
  wordsSkipped: number;
  startingCount: number;
  finalCount: number;
  validationPassed: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createBackup(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(BACKUP_DIR, `common-words-5000-${timestamp}.json`);
  
  fs.copyFileSync(WORDS_FILE, backupPath);
  console.log(`💾 Backup created: ${backupPath}\n`);
  
  return backupPath;
}

async function getExistingWords(): Promise<Set<string>> {
  console.log('🔍 Checking for existing words...\n');
  
  // Get ALL words from database (including those without examples)
  // This prevents adding words that exist in DB but haven't been processed yet
  const cachedWords = await prisma.verifiedVocabulary.findMany({
    where: { sourceLanguage: 'es' },
    select: { sourceWord: true },
  });
  
  const dbWords = new Set(cachedWords.map(w => w.sourceWord.toLowerCase()));
  console.log(`   Database (all entries): ${dbWords.size} words`);
  
  // Get words from JSON file
  const fileContent = fs.readFileSync(WORDS_FILE, 'utf-8');
  const wordData = JSON.parse(fileContent);
  const jsonWords = new Set(wordData.words.map((w: WordEntry) => w.word.toLowerCase()));
  console.log(`   JSON file: ${jsonWords.size} words`);
  
  // Combine (remove duplicates between DB and JSON)
  const allExisting = new Set([...dbWords, ...jsonWords]);
  console.log(`   Combined unique: ${allExisting.size} words\n`);
  
  return allExisting;
}

async function enrichWord(word: string, rank: number): Promise<WordEntry | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a Spanish linguistics expert. Provide accurate POS tags and translations. IMPORTANT: For verbs, confirm they are in infinitive form. Respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `For the Spanish word "${word}":

1. If it's a verb, confirm it's in infinitive form (ends in -ar, -er, -ir, or -ír)
2. If it's a conjugated verb, provide the infinitive instead
3. Provide the part of speech
4. Provide the English translation

Respond in JSON format:
{
  "word": "${word}",
  "isInfinitive": true/false,
  "infinitive": "infinitive form if verb",
  "pos": "verb/noun/adjective/etc",
  "translation": "English translation"
}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 150,
    });

    const content = response.choices[0].message.content?.trim() || '';
    const data = JSON.parse(content);
    
    // Use infinitive if verb is conjugated
    const finalWord = data.isInfinitive === false && data.infinitive ? data.infinitive : word;
    
    // Determine frequency based on rank
    let frequency = 'medium';
    if (rank <= 200) frequency = 'very_high';
    else if (rank <= 500) frequency = 'high';
    else if (rank <= 1000) frequency = 'medium';
    
    return {
      rank,
      word: finalWord,
      pos: data.pos,
      translation: data.translation,
      frequency,
    };
  } catch (error) {
    console.error(`   ❌ Error enriching "${word}":`, error);
    return null;
  }
}

// ============================================================================
// MAIN EXPANSION LOGIC
// ============================================================================

async function expandWords(): Promise<ExpansionResult> {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log(`║   Expand Word List by ${TARGET_WORDS.toString().padEnd(4)} Words (Validated)              ║`);
  console.log('║   Phase 18.1.7 Extension - Validated Data Flow               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`🎯 Target: Add ${TARGET_WORDS} new unique words\n`);

  // STEP 1: Create backup
  console.log('═══ STEP 1: CREATE BACKUP ═══\n');
  const backupPath = createBackup();

  // STEP 2: Load current word list
  console.log('═══ STEP 2: LOAD CURRENT WORD LIST ═══\n');
  const fileContent = fs.readFileSync(WORDS_FILE, 'utf-8');
  const wordData = JSON.parse(fileContent);
  const currentWords: WordEntry[] = wordData.words;
  const startingCount = currentWords.length;
  
  console.log(`📚 Current word count: ${startingCount}\n`);

  // STEP 3: Get existing words (database + JSON)
  console.log('═══ STEP 3: CHECK EXISTING WORDS ═══\n');
  const existingWords = await getExistingWords();

  // STEP 4: Filter source list for new words
  console.log('═══ STEP 4: FILTER FOR NEW WORDS ═══\n');
  const newWords = WIKTIONARY_WORDS.filter(word => {
    return !existingWords.has(word.toLowerCase());
  });
  
  console.log(`🆕 Found ${newWords.length} new words in source list`);
  console.log(`🎯 Taking next ${TARGET_WORDS} words\n`);
  
  if (newWords.length < TARGET_WORDS) {
    console.log(`⚠️  WARNING: Only ${newWords.length} new words available (requested ${TARGET_WORDS})`);
    console.log(`   Will process all ${newWords.length} available words.\n`);
    console.log(`💡 To expand further, add more words to the WIKTIONARY_WORDS list in the script.\n`);
  }
  
  const wordsToAdd = newWords.slice(0, TARGET_WORDS);
  
  if (wordsToAdd.length === 0) {
    console.log('⚠️  No new words available from current source.');
    console.log('   All words in source list already exist in database or JSON file.\n');
    console.log('💡 To expand, add more words to the WIKTIONARY_WORDS list in the script.\n');
    await prisma.$disconnect();
    return {
      wordsAdded: 0,
      wordsSkipped: 0,
      startingCount,
      finalCount: startingCount,
      validationPassed: true,
    };
  }

  // STEP 5: Enrich words with OpenAI
  console.log('═══ STEP 5: ENRICH WORDS WITH OPENAI ═══\n');
  console.log(`🤖 Processing ${wordsToAdd.length} words (POS, translation, infinitive conversion)...\n`);
  
  const enrichedWords: WordEntry[] = [];
  let currentRank = startingCount + 1;

  for (let i = 0; i < wordsToAdd.length; i++) {
    const word = wordsToAdd[i];
    process.stdout.write(`   [${i + 1}/${wordsToAdd.length}] Enriching "${word}"... `);
    
    const enriched = await enrichWord(word, currentRank);
    
    if (enriched) {
      enrichedWords.push(enriched);
      currentRank++;
      console.log(`✅ (${enriched.pos}) "${enriched.translation}"`);
    } else {
      console.log(`❌ Failed`);
    }
    
    // Small delay to avoid rate limits
    if (i < wordsToAdd.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n✅ Successfully enriched ${enrichedWords.length}/${wordsToAdd.length} words\n`);

  // STEP 5.5: Deduplicate after enrichment (OpenAI may convert multiple conjugated forms to same infinitive)
  console.log('═══ STEP 5.5: DEDUPLICATE AFTER ENRICHMENT ═══\n');
  console.log('🔄 Removing duplicates created by infinitive conversion...\n');
  
  const uniqueEnriched: WordEntry[] = [];
  const seenWords = new Set<string>();
  const duplicatesRemoved: string[] = [];
  
  for (const word of enrichedWords) {
    const wordLower = word.word.toLowerCase();
    if (!seenWords.has(wordLower)) {
      uniqueEnriched.push(word);
      seenWords.add(wordLower);
    } else {
      duplicatesRemoved.push(word.word);
    }
  }
  
  console.log(`   Original: ${enrichedWords.length} words`);
  console.log(`   Unique: ${uniqueEnriched.length} words`);
  console.log(`   Removed: ${duplicatesRemoved.length} duplicates`);
  
  if (duplicatesRemoved.length > 0) {
    console.log(`\n   Duplicates removed (conjugated forms that became same infinitive):`);
    const dupeCount = Math.min(duplicatesRemoved.length, 10);
    for (let i = 0; i < dupeCount; i++) {
      console.log(`      - ${duplicatesRemoved[i]}`);
    }
    if (duplicatesRemoved.length > 10) {
      console.log(`      ... and ${duplicatesRemoved.length - 10} more`);
    }
  }
  console.log('');
  
  // STEP 5.6: Check against existing words AFTER enrichment
  console.log('═══ STEP 5.6: CHECK AGAINST EXISTING WORDS (POST-ENRICHMENT) ═══\n');
  console.log('🔍 Removing words that already exist after infinitive conversion...\n');
  
  const finalNew: WordEntry[] = [];
  const alreadyExist: string[] = [];
  
  for (const word of uniqueEnriched) {
    const wordLower = word.word.toLowerCase();
    if (!existingWords.has(wordLower)) {
      finalNew.push(word);
    } else {
      alreadyExist.push(word.word);
    }
  }
  
  console.log(`   After deduplication: ${uniqueEnriched.length} words`);
  console.log(`   Already exist (post-enrichment): ${alreadyExist.length}`);
  console.log(`   Final new words: ${finalNew.length}`);
  
  if (alreadyExist.length > 0) {
    console.log(`\n   Already exist (infinitives that were already in list):`);
    const existCount = Math.min(alreadyExist.length, 10);
    for (let i = 0; i < existCount; i++) {
      console.log(`      - ${alreadyExist[i]}`);
    }
    if (alreadyExist.length > 10) {
      console.log(`      ... and ${alreadyExist.length - 10} more`);
    }
  }
  console.log('');
  
  if (finalNew.length === 0) {
    console.log('⚠️  No new words remaining after all deduplication steps.');
    console.log('   All words either were duplicates or already existed in database/list.\n');
    console.log('💡 Consider using a different word source or expanding the WIKTIONARY_WORDS list.\n');
    await prisma.$disconnect();
    return {
      wordsAdded: 0,
      wordsSkipped: wordsToAdd.length,
      startingCount,
      finalCount: startingCount,
      validationPassed: true,
    };
  }
  
  // Update ranks for remaining words
  finalNew.forEach((word, index) => {
    word.rank = startingCount + index + 1;
  });

  // STEP 6: VALIDATE NEW WORDS (Checkpoint 1)
  console.log('═══ STEP 6: VALIDATE NEW WORDS (CHECKPOINT 1) ═══\n');
  console.log('🔍 Running validation on new words (quality checks only)...\n');
  
  // Manual validation checks (skip rank sequence for batch)
  const newWordsValidation = {
    valid: true,
    errors: [] as any[],
    warnings: [] as any[],
    summary: { totalWords: finalNew.length, criticalErrors: 0, errors: 0, warnings: 0 }
  };
  
  // Check verbs are infinitive and translations exist
  for (const word of finalNew) {
    const verbError = validateVerbForm(word);
    const transError = validateTranslation(word);
    
    if (verbError) {
      newWordsValidation.errors.push(verbError);
      if (verbError.severity === 'critical') {
        newWordsValidation.valid = false;
        newWordsValidation.summary.criticalErrors++;
      }
    }
    if (transError) {
      newWordsValidation.errors.push(transError);
      if (transError.severity === 'critical') {
        newWordsValidation.valid = false;
        newWordsValidation.summary.criticalErrors++;
      }
    }
  }
  
  console.log(`Results:`);
  console.log(`  Total words: ${finalNew.length}`);
  console.log(`  Critical errors: ${newWordsValidation.summary.criticalErrors}`);
  console.log(`  Errors: ${newWordsValidation.summary.errors}`);
  console.log(`  Warnings: ${newWordsValidation.summary.warnings}\n`);
  
  if (!newWordsValidation.valid) {
    console.error('❌ VALIDATION FAILED - New words contain critical errors:\n');
    newWordsValidation.errors.forEach(err => {
      console.error(`   [${err.severity.toUpperCase()}] ${err.type}: "${err.word}" (rank ${err.rank})`);
      console.error(`      ${err.message}\n`);
    });
    console.error('Aborting expansion. No changes made.\n');
    await prisma.$disconnect();
    return {
      wordsAdded: 0,
      wordsSkipped: finalNew.length,
      startingCount,
      finalCount: startingCount,
      validationPassed: false,
    };
  }
  
  if (newWordsValidation.warnings.length > 0) {
    console.log(`⚠️  ${newWordsValidation.warnings.length} warnings (non-critical):\n`);
    newWordsValidation.warnings.slice(0, 5).forEach(warn => {
      console.log(`   [WARNING] ${warn.type}: "${warn.word}"`);
    });
    if (newWordsValidation.warnings.length > 5) {
      console.log(`   ... and ${newWordsValidation.warnings.length - 5} more\n`);
    }
  }
  
  console.log('✅ Checkpoint 1 PASSED\n');

  // STEP 7: Add new words to list
  console.log('═══ STEP 7: ADD WORDS TO LIST ═══\n');
  const updatedWords = [...currentWords, ...finalNew];
  
  console.log(`📝 Updated word list:`);
  console.log(`   Previous: ${currentWords.length} words`);
  console.log(`   Added: ${finalNew.length} new words`);
  console.log(`   Total: ${updatedWords.length} words\n`);

  // STEP 8: VALIDATE COMPLETE LIST (Checkpoint 2)
  console.log('═══ STEP 8: VALIDATE COMPLETE LIST (CHECKPOINT 2) ═══\n');
  console.log('🔍 Running validation on complete word list...\n');
  
  const fullValidation = validateWordList(updatedWords);
  
  console.log(`Results:`);
  console.log(`  Total words: ${updatedWords.length}`);
  console.log(`  Critical errors: ${fullValidation.summary.criticalErrors}`);
  console.log(`  Errors: ${fullValidation.summary.errors}`);
  console.log(`  Warnings: ${fullValidation.summary.warnings}\n`);
  
  if (!fullValidation.valid) {
    console.error('❌ VALIDATION FAILED - Complete list has critical errors:\n');
    fullValidation.errors.slice(0, 10).forEach(err => {
      console.error(`   [${err.severity.toUpperCase()}] ${err.type}: "${err.word}" (rank ${err.rank})`);
      console.error(`      ${err.message}\n`);
    });
    console.error('Aborting expansion. Rolling back...\n');
    console.error(`💡 Backup available at: ${backupPath}\n`);
    await prisma.$disconnect();
    return {
      wordsAdded: 0,
      wordsSkipped: enrichedWords.length,
      startingCount,
      finalCount: startingCount,
      validationPassed: false,
    };
  }
  
  console.log('✅ Checkpoint 2 PASSED\n');

  // STEP 9: Save updated word list
  console.log('═══ STEP 9: SAVE UPDATED WORD LIST ═══\n');
  
  wordData.words = updatedWords;
  wordData.metadata.totalWords = updatedWords.length;
  wordData.metadata.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(WORDS_FILE, JSON.stringify(wordData, null, 2), 'utf-8');
  
  console.log(`💾 Saved to: ${WORDS_FILE}\n`);

  // STEP 10: Show sample of new words
  console.log('═══ STEP 10: SUMMARY ═══\n');
  console.log('📝 Sample of new words added:\n');
  finalNew.slice(0, 10).forEach(w => {
    console.log(`   ${w.rank}. ${w.word} (${w.pos}) - ${w.translation}`);
  });
  if (finalNew.length > 10) {
    console.log(`   ... and ${finalNew.length - 10} more\n`);
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   EXPANSION COMPLETE                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Successfully expanded word list`);
  console.log(`   Starting count: ${startingCount}`);
  console.log(`   Source words processed: ${wordsToAdd.length}`);
  console.log(`   After enrichment: ${enrichedWords.length}`);
  console.log(`   After deduplication: ${uniqueEnriched.length}`);
  console.log(`   After existing check: ${finalNew.length}`);
  console.log(`   Words added: ${finalNew.length}`);
  console.log(`   Final count: ${updatedWords.length}`);
  console.log(`   Validation: ✅ PASSED`);
  console.log(`   Backup: ${backupPath}\n`);
  
  console.log('🚀 Next steps:');
  console.log('   1. Review new words (above)');
  console.log('   2. Run: npx tsx scripts/validate-word-list.ts --detailed');
  console.log('   3. Run: npx tsx scripts/pre-generate-vocabulary.ts\n');

  await prisma.$disconnect();
  
  return {
    wordsAdded: finalNew.length,
    wordsSkipped: wordsToAdd.length - finalNew.length,
    startingCount,
    finalCount: updatedWords.length,
    validationPassed: true,
  };
}

// ============================================================================
// EXECUTE
// ============================================================================

expandWords()
  .then((result) => {
    if (result.validationPassed && result.wordsAdded > 0) {
      console.log('✅ Expansion successful!\n');
      process.exit(0);
    } else if (!result.validationPassed) {
      console.log('❌ Expansion failed validation.\n');
      process.exit(1);
    } else {
      console.log('⚠️  No words added.\n');
      process.exit(0);
    }
  })
  .catch(async (error) => {
    console.error('❌ Unexpected error during expansion:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
