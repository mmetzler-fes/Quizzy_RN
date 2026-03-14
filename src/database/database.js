const API_URL = 'http://localhost:3000/api';

// Fallback logic for web/other clients: assume port 3000 on the same host
const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:3000/api`;
  }
  return API_URL;
};

// === INITIALIZATION ===

export async function initDatabase() {
  try {
    await fetch(`${getBaseUrl()}/init`);
  } catch (error) {
    console.warn('API Init failed (likely offline/dev):', error);
  }
}

// === QUIZZY CRUD ===

export async function getQuizNames() {
  const res = await fetch(`${getBaseUrl()}/quizNames`);
  return await res.json();
}

export async function getQuizByName(quizname) {
  const res = await fetch(`${getBaseUrl()}/quizByName/${encodeURIComponent(quizname)}`);
  return await res.json();
}

export async function getAllQuizItems() {
  const res = await fetch(`${getBaseUrl()}/quizAll`);
  return await res.json();
}

export async function addQuizItem(quizname, query, answer) {
  const res = await fetch(`${getBaseUrl()}/quizItem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizname, query, answer })
  });
  const data = await res.json();
  return data.id;
}

export async function deleteQuizItem(id) {
  await fetch(`${getBaseUrl()}/quizItem/${id}`, { method: 'DELETE' });
}

export async function updateQuizItem(id, quizname, query, answer) {
  await fetch(`${getBaseUrl()}/quizItem/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizname, query, answer })
  });
}

export async function deleteQuizByName(quizname) {
  await fetch(`${getBaseUrl()}/quizByName/${encodeURIComponent(quizname)}`, { method: 'DELETE' });
}

// === VOKABELN CRUD ===

export async function getAllVokabeln() {
  const res = await fetch(`${getBaseUrl()}/vokabelnAll`);
  return await res.json();
}

export async function addVokabel(name, vokabel, sprache = 'EN') {
  const res = await fetch(`${getBaseUrl()}/vokabel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, vokabel, sprache })
  });
  const data = await res.json();
  return data.id;
}

export async function deleteVokabel(id) {
  await fetch(`${getBaseUrl()}/vokabel/${id}`, { method: 'DELETE' });
}

export async function searchVokabeln(searchTerm) {
  const items = await getAllVokabeln();
  const lower = searchTerm.toLowerCase();
  return items.filter(
    i => i.name.toLowerCase().includes(lower) || i.vokabel.toLowerCase().includes(lower)
  );
}

// === ADMIN ===

export async function verifyAdmin(username, password) {
  const res = await fetch(`${getBaseUrl()}/verifyAdmin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

export async function getAdminCredentials() {
  const res = await fetch(`${getBaseUrl()}/adminCredentials`);
  return await res.json();
}

export async function updateAdminPassword(newPassword) {
  await fetch(`${getBaseUrl()}/adminPassword`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  });
}

// === SELECTED TOPICS (SYNCED) ===

export async function getSelectedTopics() {
  const res = await fetch(`${getBaseUrl()}/selectedTopics`);
  const data = await res.json();
  return data.selectedTopics;
}

export async function setSelectedTopics(topics) {
  await fetch(`${getBaseUrl()}/selectedTopics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedTopics: topics })
  });
}

// === QUIZ RESULTS ===

export async function saveQuizResult(username, quizname, score, totalQuestions, details) {
  const res = await fetch(`${getBaseUrl()}/quizResult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, quizname, score, totalQuestions, details })
  });
  const data = await res.json();
  return data.id;
}

export async function getAllQuizResults() {
  const res = await fetch(`${getBaseUrl()}/quizResults`);
  return await res.json();
}

export async function deleteQuizResult(id) {
  await fetch(`${getBaseUrl()}/quizResult/${id}`, { method: 'DELETE' });
}

export async function deleteAllQuizResults() {
  await fetch(`${getBaseUrl()}/quizResultsAll`, { method: 'DELETE' });
}
