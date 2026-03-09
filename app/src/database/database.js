import AsyncStorage from '@react-native-async-storage/async-storage';

// Determine the base API URL dynamically.
// If loaded via file:// or app:// (Electron standalone without webview), it defaults to localhost:3000.
// If loaded via a regular web browser (Students over IP or localhost), it uses the host path ''.
const isWeb = typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http');
const API_BASE = isWeb ? '' : 'http://localhost:3000';

async function apiFetch(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = { method, headers: {} };

  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`API returned status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

// === INITIALIZATION ===

export async function initDatabase() {
  // Hit the backend init endpoint to ensure the default data exists
  await apiFetch('/api/init', 'GET');
}

// === QUIZZY CRUD ===

export async function getSelectedTopics() {
  const res = await apiFetch('/api/selectedTopics', 'GET');
  return res.selectedTopics;
}

export async function saveSelectedTopics(topics) {
  await apiFetch('/api/selectedTopics', 'PUT', { selectedTopics: topics });
}

export async function getQuizNames() {
  return await apiFetch('/api/quizNames', 'GET');
}

export async function getQuizByName(quizname) {
  return await apiFetch(`/api/quizByName/${encodeURIComponent(quizname)}`, 'GET');
}

export async function getAllQuizItems() {
  return await apiFetch('/api/quizAll', 'GET');
}

export async function addQuizItem(quizname, query, answer) {
  const res = await apiFetch('/api/quizItem', 'POST', { quizname, query, answer });
  return res.id;
}

export async function deleteQuizItem(id) {
  await apiFetch(`/api/quizItem/${id}`, 'DELETE');
}

export async function updateQuizItem(id, quizname, query, answer) {
  await apiFetch(`/api/quizItem/${id}`, 'PUT', { quizname, query, answer });
}

export async function deleteQuizByName(quizname) {
  await apiFetch(`/api/quizByName/${encodeURIComponent(quizname)}`, 'DELETE');
}

// === VOKABELN CRUD ===

export async function getAllVokabeln() {
  return await apiFetch('/api/vokabelnAll', 'GET');
}

export async function addVokabel(name, vokabel, sprache = 'EN') {
  const res = await apiFetch('/api/vokabel', 'POST', { name, vokabel, sprache });
  return res.id;
}

export async function deleteVokabel(id) {
  await apiFetch(`/api/vokabel/${id}`, 'DELETE');
}

export async function searchVokabeln(searchTerm) {
  return await apiFetch(`/api/vokabelnSearch?q=${encodeURIComponent(searchTerm)}`, 'GET');
}

// === ADMIN ===

export async function verifyAdmin(username, password) {
  return await apiFetch('/api/verifyAdmin', 'POST', { username, password });
}

export async function getAdminCredentials() {
  return await apiFetch('/api/adminCredentials', 'GET');
}

export async function updateAdminPassword(newPassword) {
  await apiFetch('/api/adminPassword', 'PUT', { newPassword });
}

// === QUIZ RESULTS ===

export async function saveQuizResult(username, quizname, score, totalQuestions, details) {
  const res = await apiFetch('/api/quizResult', 'POST', { username, quizname, score, totalQuestions, details });
  return res.id;
}

export async function getAllQuizResults() {
  return await apiFetch('/api/quizResults', 'GET');
}

export async function deleteQuizResult(id) {
  await apiFetch(`/api/quizResult/${id}`, 'DELETE');
}

export async function deleteAllQuizResults() {
  await apiFetch('/api/quizResultsAll', 'DELETE');
}
