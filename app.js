// =======================================================
// app.js — Nested Comments System (Recursion + DFS)
// =======================================================

// ---------- Storage & State ----------
const STORAGE_KEY = "comments_tree_v2";
let comments = loadFromStorage();

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

function generateId() {
  return "c_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ---------- Core DSA Functions (Recursion + DFS) ----------

// O(1)
function addComment(text, author = "Anonymous") {
  if (!text.trim()) return;
  const newComment = {
    id: generateId(),
    text: text.trim(),
    author,
    timestamp: Date.now(),
    edited: false,
    editedAt: null,
    replies: [],
    collapsed: false
  };
  comments.push(newComment);
  saveToStorage();
}

// O(n)
function addReply(parentId, text, author = "Anonymous") {
  const newReply = {
    id: generateId(),
    text: text.trim(),
    author,
    timestamp: Date.now(),
    edited: false,
    editedAt: null,
    replies: [],
    collapsed: false
  };

  function dfs(nodes) {
    for (let node of nodes) {
      if (node.id === parentId) {
        node.replies.push(newReply);
        return true;
      }
      if (dfs(node.replies)) return true;
    }
    return false;
  }

  if (dfs(comments)) {
    saveToStorage();
  }
}

// O(n)
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

// O(n)
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

// O(n)
function countComments() {
  function dfs(nodes) {
    return nodes.reduce((acc, node) => acc + 1 + dfs(node.replies), 0);
  }
  return dfs(comments);
}

// ---------- UI Utilities ----------
const container = document.getElementById("commentsContainer");
const countSpan = document.getElementById("count");

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[s]);
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---------- Rendering (Recursive) ----------
function render() {
  container.innerHTML = renderComments(comments, 0);
  countSpan.textContent = `Comments: ${countComments()}`;
  saveToStorage();
}

function renderComments(nodes, depth = 0) {
  return nodes
    .map((node) => {
      const replies = node.replies.length
        ? `<div id="replies-${node.id}" class="replies" style="display:${node.collapsed ? "none" : "block"}">
            ${renderComments(node.replies, depth + 1)}
          </div>`
        : "";

      return `
      <div class="comment" style="margin-left:${Math.min(depth * 20, 200)}px">
        <div class="meta">
          <strong>${escapeHtml(node.author)}</strong> • ${timeAgo(node.timestamp)}
          ${node.edited ? " • edited" : ""}
        </div>
        <div class="text">${escapeHtml(node.text)}</div>
        <div class="actions">
          ${node.replies.length ? `<button class="btn small" onclick="toggleReplies('${node.id}')">${node.collapsed ? "Expand" : "Collapse"}</button>` : ""}
          <button class="btn small" onclick="uiReply('${node.id}')">Reply</button>
          <button class="btn small" onclick="uiEdit('${node.id}')">Edit</button>
          <button class="btn small danger" onclick="uiDelete('${node.id}')">Delete</button>
        </div>
        ${replies}
      </div>`;
    })
    .join("");
}

// ---------- Interactions ----------
document.getElementById("postBtn").addEventListener("click", () => {
  const author = document.getElementById("author").value || "Anonymous";
  const text = document.getElementById("commentText").value;
  if (!text.trim()) return alert("Please write a comment!");
  addComment(text, author);
  document.getElementById("commentText").value = "";
  render();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all comments?")) {
    comments = [];
    saveToStorage();
    render();
  }
});

function findNodeById(id, nodes = comments) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(id, node.replies);
    if (found) return found;
  }
  return null;
}

// ---------- UI Action Handlers ----------
window.uiReply = function (parentId) {
  const text = prompt("Enter your reply:");
  if (!text) return;
  const author = prompt("Your name:", "Anonymous") || "Anonymous";
  addReply(parentId, text, author);
  render();
};

window.uiEdit = function (id) {
  const node = findNodeById(id);
  if (!node) return alert("Comment not found!");
  const newText = prompt("Edit your comment:", node.text);
  if (newText && newText.trim()) {
    editComment(id, newText);
    render();
  }
};

window.uiDelete = function (id) {
  if (confirm("Delete this comment and its replies?")) {
    deleteComment(id);
    render();
  }
};

window.toggleReplies = function (id) {
  function dfsToggle(nodes) {
    for (let node of nodes) {
      if (node.id === id) {
        node.collapsed = !node.collapsed;
        return true;
      }
      if (dfsToggle(node.replies)) return true;
    }
    return false;
  }
  dfsToggle(comments);
  render();
};

// ---------- Initial Render ----------
render();
