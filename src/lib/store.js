// Local persistence layer. Everything lives in the browser's localStorage.
// User-owned data only (skills, subscriptions, chat). Prices are never stored here.

const KEYS = {
  skills: 'kb.skills.v1',
  subs: 'kb.subs.v1',
  chat: 'kb.chat.v1',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (e) {
    // Corrupt / unavailable storage - fall back gracefully.
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Quota / private-mode failures shouldn't crash the app.
    return false;
  }
}

// Collision-resistant local id used across bot.js and the components.
export function uid() {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
}

// ---- Skills ----
export function loadSkills() {
  const arr = readJson(KEYS.skills, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveSkills(skills) {
  return writeJson(KEYS.skills, Array.isArray(skills) ? skills : []);
}

// ---- Subscriptions ----
export function loadSubs() {
  const arr = readJson(KEYS.subs, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveSubs(subs) {
  return writeJson(KEYS.subs, Array.isArray(subs) ? subs : []);
}

// ---- Chat ----
export function loadChat() {
  const arr = readJson(KEYS.chat, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveChat(messages) {
  return writeJson(KEYS.chat, Array.isArray(messages) ? messages : []);
}
