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
function addComment(text, author='Anonymous') {
  if (!text || text.trim().length === 0) return null;
  const node = {
    id: generateId(),
    text: text.trim(),
    author,
    timestamp: Date.now(),
    edited: false,
    editedAt: null,
    replies: []
  };
  comments.push(node);
  saveToStorage();
  return node;
}
function addReply(parentId, text, author='Anonymous', maxDepth=100) {
  if (!text || text.trim().length === 0) return false;
  const reply = {
    id: generateId(),
    text: text.trim(),
    author,
    timestamp: Date.now(),
    edited: false,
    editedAt: null,
    replies: []
  };
  function dfsInsert(nodes, depth){
    if (depth > maxDepth) return false;
    for (let node of nodes) {
      if (node.id === parentId) {
        node.replies.push(reply);
        return true;
      }
      if (node.replies && node.replies.length) {
        if (dfsInsert(node.replies, depth+1)) return true;
      }
    }
    return false;
  }
  const ok = dfsInsert(comments, 0);
  if (ok) saveToStorage();
  return ok;
}
function findCommentById(targetId) {
  function dfs(nodes) {
    for (let node of nodes) {
      if (node.id === targetId) return node;
      const found = dfs(node.replies);
      if (found) return found;
    }
    return null;
  }
  return dfs(comments);
}
function clearAll() {
  comments = [];
  saveToStorage();
}