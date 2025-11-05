// =======================================================
// app.js — Nested Comments System (Tree + Recursion + DFS)
// =======================================================

// ---------- Global State ----------
const STORAGE_KEY = "comments_tree_final";
let comments = loadFromStorage();

// ---------- Storage ----------
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}
function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function generateId() {
  return "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Core Data Structure & DSA ----------
function addComment(text, author = "Anonymous") {
  if (!text.trim()) return;
  comments.push({
    id: generateId(),
    text: text.trim(),
    author,
    timestamp: Date.now(),
    votes: 0,
    edited: false,
    editedAt: null,
    replies: [],
    collapsed: false
  });
  saveToStorage();
}

function addReply(parentId, text, author = "Anonymous") {
  const reply = {
    id: generateId(),
    text: text.trim(),
    author,
    timestamp: Date.now(),
    votes: 0,
    edited: false,
    editedAt: null,
    replies: [],
    collapsed: false
  };
  function dfs(nodes) {
    for (let node of nodes) {
      if (node.id === parentId) {
        node.replies.push(reply);
        return true;
      }
      if (dfs(node.replies)) return true;
    }
    return false;
  }
  dfs(comments);
  saveToStorage();
}

function editComment(id, newText) {
  function dfs(nodes) {
    for (let node of nodes) {
      if (node.id === id) {
        node.text = newText;
        node.edited = true;
        node.editedAt = Date.now();
        return true;
      }
      if (dfs(node.replies)) return true;
    }
    return false;
  }
  dfs(comments);
  saveToStorage();
}

function deleteComment(id) {
  function dfs(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        nodes.splice(i, 1);
        return true;
      }
      if (dfs(nodes[i].replies)) return true;
    }
    return false;
  }
  dfs(comments);
  saveToStorage();
}

function vote(id, delta) {
  function dfs(nodes) {
    for (let node of nodes) {
      if (node.id === id) {
        node.votes += delta;
        return true;
      }
      if (dfs(node.replies)) return true;
    }
    return false;
  }
  dfs(comments);
  saveToStorage();
}

function toggleReplies(id, collapse = null) {
  function dfs(nodes) {
    for (let node of nodes) {
      if (node.id === id) {
        node.collapsed = collapse !== null ? collapse : !node.collapsed;
        return true;
      }
      if (dfs(node.replies)) return true;
    }
    return false;
  }
  dfs(comments);
  saveToStorage();
}

// ---------- Utility ----------
function countComments() {
  function dfs(nodes) {
    return nodes.reduce((acc, n) => acc + 1 + dfs(n.replies), 0);
  }
  return dfs(comments);
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (s) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
  );
}
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function findNodeById(id, nodes = comments) {
  for (let node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(id, node.replies);
    if (found) return found;
  }
  return null;
}

// ---------- Search + Sort ----------
let searchQuery = "";
function filterComments(nodes) {
  if (!searchQuery) return nodes;
  return nodes
    .filter((n) => n.text.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((n) => ({ ...n, replies: filterComments(n.replies) }));
}

function sortComments(order) {
  function dfs(nodes) {
    nodes.sort((a, b) => {
      if (order === "newest") return b.timestamp - a.timestamp;
      if (order === "oldest") return a.timestamp - b.timestamp;
      if (order === "top") return b.votes - a.votes;
      return 0;
    });
    nodes.forEach((n) => dfs(n.replies));
  }
  dfs(comments);
}

// ---------- Rendering ----------
const container = document.getElementById("commentsContainer");
const countSpan = document.getElementById("count");

function render() {
  const order = document.getElementById("sortSelect").value;
  sortComments(order);
  const filtered = filterComments(comments);
  container.innerHTML = renderComments(filtered, 0);
  countSpan.textContent = `Comments: ${countComments()}`;
}

function renderComments(nodes, depth = 0) {
  return nodes
    .map((n) => {
      const highlight = searchQuery
        ? n.text.replace(
            new RegExp(searchQuery, "gi"),
            (m) => `<mark>${m}</mark>`
          )
        : n.text;
      return `
        <div class="comment" style="margin-left:${Math.min(depth * 20, 200)}px">
          <div class="meta"><strong>${escapeHtml(n.author)}</strong> • ${timeAgo(
        n.timestamp
      )}${n.edited ? " • edited" : ""}</div>
          <div class="text">${escapeHtml(highlight)}</div>
          <div class="votes">Votes: ${n.votes}</div>
          <div class="actions">
            ${
              n.replies.length
                ? `<button class="btn small" onclick="toggleReplies('${n.id}')">${
                    n.collapsed ? "Expand" : "Collapse"
                  }</button>`
                : ""
            }
            <button class="btn small" onclick="vote('${n.id}', 1)">👍</button>
            <button class="btn small" onclick="vote('${n.id}', -1)">👎</button>
            <button class="btn small" onclick="uiReply('${n.id}')">Reply</button>
            <button class="btn small" onclick="uiEdit('${n.id}')">Edit</button>
            <button class="btn small danger" onclick="uiDelete('${n.id}')">Delete</button>
          </div>
          ${
            n.replies.length
              ? `<div class="replies" style="display:${
                  n.collapsed ? "none" : "block"
                }">${renderComments(n.replies, depth + 1)}</div>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

// ---------- UI Event Listeners ----------
document.getElementById("postBtn").onclick = () => {
  const author = document.getElementById("author").value || "Anonymous";
  const text = document.getElementById("commentText").value;
  if (!text.trim()) return alert("Write something!");
  addComment(text, author);
  document.getElementById("commentText").value = "";
  render();
};

document.getElementById("clearBtn").onclick = () => {
  if (confirm("Clear all comments?")) {
    comments = [];
    saveToStorage();
    render();
  }
};

document.getElementById("sortSelect").onchange = render;
document.getElementById("searchBox").oninput = (e) => {
  searchQuery = e.target.value;
  render();
};

document.getElementById("collapseAll").onclick = () => {
  function dfs(nodes) {
    nodes.forEach((n) => {
      n.collapsed = true;
      dfs(n.replies);
    });
  }
  dfs(comments);
  render();
};

document.getElementById("expandAll").onclick = () => {
  function dfs(nodes) {
    nodes.forEach((n) => {
      n.collapsed = false;
      dfs(n.replies);
    });
  }
  dfs(comments);
  render();
};

// ---------- UI Actions ----------
window.uiReply = (id) => {
  const text = prompt("Your reply:");
  if (!text) return;
  const author = prompt("Your name:", "Anonymous") || "Anonymous";
  addReply(id, text, author);
  render();
};
window.uiEdit = (id) => {
  const node = findNodeById(id);
  if (!node) return alert("Comment not found!");
  const newText = prompt("Edit comment:", node.text);
  if (newText && newText.trim()) {
    editComment(id, newText);
    render();
  }
};
window.uiDelete = (id) => {
  if (confirm("Delete this comment and its replies?")) {
    deleteComment(id);
    render();
  }
};

// ---------- Initial Render ----------
render();
