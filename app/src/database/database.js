import AsyncStorage from '@react-native-async-storage/async-storage';

const QUIZ_KEY = '@quizzy_items';
const VOKABEL_KEY = '@vokabeln_items';
const RESULTS_KEY = '@quizzy_results';
const ADMIN_KEY = '@quizzy_admin';
const INIT_KEY = '@quizzy_initialized';

let nextQuizId = 1;
let nextVokabelId = 1;
let nextResultId = 1;

// === INITIALIZATION ===

export async function initDatabase() {
  const initialized = await AsyncStorage.getItem(INIT_KEY);

  // Load existing data to determine next IDs
  const quizItems = await _getQuizData();
  const vokabelItems = await _getVokabelData();
  const resultItems = await _getResultsData();

  if (quizItems.length > 0) {
    nextQuizId = Math.max(...quizItems.map(i => i.id)) + 1;
  }
  if (vokabelItems.length > 0) {
    nextVokabelId = Math.max(...vokabelItems.map(i => i.id)) + 1;
  }
  if (resultItems.length > 0) {
    nextResultId = Math.max(...resultItems.map(i => i.id)) + 1;
  }

  if (!initialized) {
    await seedDefaultQuizData();
    await seedDefaultAdmin();
    await AsyncStorage.setItem(INIT_KEY, 'true');
  }

  // Ensure admin exists (for upgrades from older versions)
  const adminData = await AsyncStorage.getItem(ADMIN_KEY);
  if (!adminData) {
    await seedDefaultAdmin();
  }
}

async function seedDefaultQuizData() {
  const quizName = 'DB Grundbegriffe';
  const data = [
    ['Beziehung', 'ist eine Verbindung zwischen zwei oder mehr Entitäten. Beispielsweise könnte es eine Beziehung zwischen den Entitäten Person und Unternehmen geben, wenn eine Person dort beschäftigt ist.'],
    ['Normalisierung', 'der Prozess wird bei der Konzeption von Datenbanken verwendet, um Redundanzen und Inkonsistenzen in der Datenstruktur zu vermeiden.'],
    ['Tupel (Datensatz)', 'repräsentiert alle Merkmalswerte einer Entität einer Entitätsmenge.'],
    ['Foreign Key', 'ist ein Attribut oder eine Kombination von Attributen, das/die in einer Entity gespeichert wird und auf den Primary Key einer anderen Entity verweist.'],
    ['Relationale Datenbank', 'ist eine Art von Datenbank, bei der die Daten in Form von Tabellen (sogenannten Relationen) gespeichert werden und miteinander verknüpft werden können.'],
    ['DBMS', 'Datenbank Management System'],
    ['Attribut', 'ist ein Merkmal oder eine Eigenschaft einer Entity. Zum Beispiel könnten dies der Name und das Geschlecht einer Entity Person sein.'],
    ['NoSQL-Datenbank', 'sind eine Klasse von Datenbanken, die nicht das Relationenmodell verwenden, sondern alternative Ansätze zur Speicherung und Verarbeitung von Daten anbieten.'],
    ['Relation', 'besteht aus einer Entitätsbezeichnung, deren Attributen und Tupeln.'],
    ['Entity (Entität)', 'ist eine abstrakte Repräsentation eines realen Objekts oder Konzepts, z.B. eine Person oder ein Unternehmen oder ein Produkt.'],
    ['Denormalisierung', 'bezieht sich auf den Prozess, bei dem mehrere Tabellen zu einer zusammengeführt werden, um die Performance von Abfragen zu verbessern.'],
    ['Primary Key', 'ist ein Attribut oder eine Kombination von Attributen, das jeder Entität in einer Datenbank eindeutig zugeordnet ist. Er dient dazu, die Entität eindeutig zu identifizieren.'],
  ];

  const items = data.map(([query, answer]) => ({
    id: nextQuizId++,
    quizname: quizName,
    query,
    answer,
  }));

  await AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(items));
}

async function seedDefaultAdmin() {
  const adminData = {
    username: 'admin',
    password: 'lehrer1',
  };
  await AsyncStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
}

// === INTERNAL HELPERS ===

async function _getQuizData() {
  try {
    const data = await AsyncStorage.getItem(QUIZ_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function _saveQuizData(items) {
  await AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(items));
}

async function _getVokabelData() {
  try {
    const data = await AsyncStorage.getItem(VOKABEL_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function _saveVokabelData(items) {
  await AsyncStorage.setItem(VOKABEL_KEY, JSON.stringify(items));
}

// === QUIZZY CRUD ===

export async function getQuizNames() {
  const items = await _getQuizData();
  const names = [...new Set(items.map(i => i.quizname))];
  return names.sort();
}

export async function getQuizByName(quizname) {
  const items = await _getQuizData();
  return items
    .filter(i => i.quizname === quizname)
    .sort((a, b) => a.id - b.id);
}

export async function getAllQuizItems() {
  const items = await _getQuizData();
  return items.sort((a, b) => {
    if (a.quizname !== b.quizname) return a.quizname.localeCompare(b.quizname);
    return a.id - b.id;
  });
}

export async function addQuizItem(quizname, query, answer) {
  const items = await _getQuizData();
  const newItem = { id: nextQuizId++, quizname, query, answer };
  items.push(newItem);
  await _saveQuizData(items);
  return newItem.id;
}

export async function deleteQuizItem(id) {
  const items = await _getQuizData();
  const filtered = items.filter(i => i.id !== id);
  await _saveQuizData(filtered);
}

export async function updateQuizItem(id, quizname, query, answer) {
  const items = await _getQuizData();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], quizname, query, answer };
    await _saveQuizData(items);
  }
}

export async function deleteQuizByName(quizname) {
  const items = await _getQuizData();
  const filtered = items.filter(i => i.quizname !== quizname);
  await _saveQuizData(filtered);
}

// === VOKABELN CRUD ===

export async function getAllVokabeln() {
  const items = await _getVokabelData();
  return items.sort((a, b) => a.id - b.id);
}

export async function addVokabel(name, vokabel, sprache = 'EN') {
  const items = await _getVokabelData();
  const newItem = { id: nextVokabelId++, name, sprache, vokabel };
  items.push(newItem);
  await _saveVokabelData(items);
  return newItem.id;
}

export async function deleteVokabel(id) {
  const items = await _getVokabelData();
  const filtered = items.filter(i => i.id !== id);
  await _saveVokabelData(filtered);
}

export async function searchVokabeln(searchTerm) {
  const items = await _getVokabelData();
  const lower = searchTerm.toLowerCase();
  return items.filter(
    i => i.name.toLowerCase().includes(lower) || i.vokabel.toLowerCase().includes(lower)
  );
}

// === ADMIN ===

export async function verifyAdmin(username, password) {
  try {
    const data = await AsyncStorage.getItem(ADMIN_KEY);
    if (!data) return false;
    const admin = JSON.parse(data);
    return admin.username === username && admin.password === password;
  } catch {
    return false;
  }
}

export async function getAdminCredentials() {
  try {
    const data = await AsyncStorage.getItem(ADMIN_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function updateAdminPassword(newPassword) {
  const data = await AsyncStorage.getItem(ADMIN_KEY);
  const admin = data ? JSON.parse(data) : { username: 'admin' };
  admin.password = newPassword;
  await AsyncStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

// === QUIZ RESULTS ===

async function _getResultsData() {
  try {
    const data = await AsyncStorage.getItem(RESULTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function _saveResultsData(items) {
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(items));
}

export async function saveQuizResult(username, quizname, score, totalQuestions, details) {
  const results = await _getResultsData();
  const newResult = {
    id: nextResultId++,
    username,
    quizname,
    score,
    totalQuestions,
    percentage: Math.round((score / totalQuestions) * 100),
    details, // Array of { query, userAnswer, correctAnswer, isCorrect }
    timestamp: new Date().toISOString(),
  };
  results.push(newResult);
  await _saveResultsData(results);
  return newResult.id;
}

export async function getAllQuizResults() {
  const results = await _getResultsData();
  return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function deleteQuizResult(id) {
  const results = await _getResultsData();
  const filtered = results.filter(r => r.id !== id);
  await _saveResultsData(filtered);
}

export async function deleteAllQuizResults() {
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify([]));
}
