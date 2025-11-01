const STORAGE_KEY = 'comments_tree_v1';
let comments = loadFromStorage();
function generateId() {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load comments', e);
    return [];
  }
}