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
const container = document.getElementById('commentsContainer');
const countSpan = document.getElementById('count');

function render() {
  container.innerHTML = renderComments(comments, 0);
  countSpan.textContent = `Comments: ${countComments()}`;
}

function renderComments(nodes, depth = 0) {
  if (!nodes || nodes.length === 0) return '';
  return nodes.map(node => renderSingle(node, depth)).join('');
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
function escapeHtml(str) {
  // Basic XSS prevention
  return String(str).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}

function renderSingle(node, depth) {
  const indent = Math.min(depth * 20, 200); // visual guard
  const edited = node.edited ? ' • edited' : '';
  const repliesHtml = renderComments(node.replies, depth + 1);
  return `
  <div class="comment" style="margin-left:${indent}px">
    <div class="meta"><strong>${escapeHtml(node.author)}</strong> • ${timeAgo(node.timestamp)}${edited}</div>
    <div class="text">${escapeHtml(node.text)}</div>
    <div style="margin-top:8px">
      <button class="btn small" onclick="uiReply('${node.id}')">Reply</button>
      <button class="btn small" onclick="uiEdit('${node.id}')">Edit</button>
      <button class="btn small" onclick="uiDelete('${node.id}')">Delete</button>
    </div>
    <div class="replies">${repliesHtml}</div>
  </div>
  `;
}
document.getElementById('postBtn').addEventListener('click', () => {
  const txt = document.getElementById('commentText').value;
  const author = document.getElementById('author').value || 'Anonymous';
  addComment(txt, author);
  document.getElementById('commentText').value = '';
  render();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('Clear all comments?')) {
    clearAll();
    render();
  }
});
window.uiReply = function(parentId) {
  const text = prompt('Enter your reply:');
  if (!text) return;
  const author = prompt('Your name:', 'Anonymous') || 'Anonymous';
  const ok = addReply(parentId, text, author);
  if (!ok) alert('Failed to add reply (parent not found).');
  render();
};

window.uiEdit = function(targetId) {
  const node = findCommentById(targetId);
  if (!node) return alert('Comment not found');
  const newText = prompt('Edit your comment:', node.text);
  if (newText === null) return; // cancelled
  if (newText.trim().length === 0) return alert('Text cannot be empty');
  editComment(targetId, newText);
  render();
};