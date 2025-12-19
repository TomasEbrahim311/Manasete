(function () {
  // --- Theme Toggle
  const themeToggleBtn = document.getElementById("themeToggle");
  const body = document.body;
  const THEME_KEY = "mysite_theme";

  function setTheme(theme) {
    if (theme === "dark") {
      body.classList.add("dark-mode");
      themeToggleBtn.textContent = "☀️";
      localStorage.setItem(THEME_KEY, "dark");
    } else {
      body.classList.remove("dark-mode");
      themeToggleBtn.textContent = "🌙";
      localStorage.setItem(THEME_KEY, "light");
    }
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || "light";
    setTheme(savedTheme);
  }

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = body.classList.contains("dark-mode")
      ? "dark"
      : "light";
    setTheme(currentTheme === "light" ? "dark" : "light");
  });

  // --- Quotes (daily deterministic)
  const quotes = [
    "💪 كن قويًا، فالأيام الصعبة تصنعك أقوى.",
    "🌟 كل يوم فرصة جديدة لتكون أفضل.",
    "🚀 لا تخف من الفشل، فهو خطوة للنجاح.",
    "😊 ابتسم، فابتسامتك تغير العالم.",
    "🎯 ابدأ بخطوة صغيرة، فالمسافة الطويلة تبدأ بخطوة.",
    "🧘‍♂️ لحظة هدوء اليوم تعيد ترتيب طاقتك.",
  ];
  function setDailyQuote() {
    const d = new Date();
    const idx =
      (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) %
      quotes.length;
    document.getElementById("quoteText").textContent = quotes[idx];
    document.getElementById(
      "quoteMeta"
    ).textContent = `جملة تحفيزية — ${d.toLocaleDateString("ar-EG")}`;
  }
  setDailyQuote();

  // --- Navigation
  const navButtons = document.querySelectorAll("#bottomNav button");
  const sections = document.querySelectorAll("main section");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => showSection(btn.dataset.section, btn));
  });
  function showSection(id, btn) {
    sections.forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    navButtons.forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (id === "profile") {
      checkAuthState();
    }
    if (id === "community") {
      renderPosts();
    }
  }

  // --- Chatbot
  const chatToggle = document.getElementById("chatToggle");
  const chatPopup = document.getElementById("chatPopup");
  const chatBody = document.getElementById("chatBody");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const clearBtn = document.getElementById("clearChat");
  const closeBtn = document.getElementById("closeChat");

  chatToggle.addEventListener("click", () => toggleChat());
  closeBtn.addEventListener("click", () => closeChat());
  clearBtn.addEventListener("click", () => clearChat());

  function toggleChat() {
    chatPopup.classList.toggle("open");
    if (chatPopup.classList.contains("open")) chatInput.focus();
  }
  function closeChat() {
    chatPopup.classList.remove("open");
  }

  const CHAT_KEY = "mysite_chat_messages_v1";
  function loadChat() {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) {
      appendMessage(
        "👋 مرحبًا! أنا هنا لدعمك في الصحة النفسية. اكتب سؤالك لبدء المحادثة.",
        "bot",
        false
      );
      return;
    }
    try {
      const arr = JSON.parse(raw);
      arr.forEach((m) => appendMessage(m.text, m.sender, false, m.time));
      chatBody.scrollTop = chatBody.scrollHeight;
    } catch (e) {
      console.warn("load chat fail", e);
    }
  }
  function saveChatObj(obj) {
    const raw = localStorage.getItem(CHAT_KEY);
    let arr = [];
    if (raw) {
      try {
        arr = JSON.parse(raw);
      } catch (e) {
        arr = [];
      }
    }
    arr.push(obj);
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn("save chat fail", e);
    }
  }
  function appendMessage(text, sender, save = true, time) {
    const msg = document.createElement("div");
    msg.classList.add("message", sender === "user" ? "user" : "bot");
    msg.innerHTML = `<div>${escapeHtml(text)}</div>`;
    const t =
      time ||
      new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });
    const tm = document.createElement("span");
    tm.className = "time";
    tm.textContent = t;
    msg.appendChild(tm);
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
    if (save) saveChatObj({ text, sender, time: t });
  }

  const API_KEY = "AIzaSyCA2V-BuOV4doNbFEyqgdeFH0lEpa7f0Ag";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  async function askGemini(prompt) {
    const instructions = `
أنت مختص في الصحة النفسية.
جاوب فقط على الأسئلة المتعلقة بالصحة النفسية، وقدم نصائح مبنية على أسس علمية موثوقة.
إذا كان السؤال خارج المجال، اعتذر ووضح أنك مختص بالصحة النفسية فقط.
قدم اجابات مختصرة ومباشرة، وابتعد عن التعقيد.اولا لكن اذا كان المستخدم يحتاج الى تفاصيل اكثر يمكنك ان تقول له انك ستقوم بتقديم اجابة مختصرة ثم تطلب منه ان يطلب منك المزيد من التفاصيل اذا اراد ذلك.
ولو في اكتر من حل في الاجابة قدمها علي هيئة نقاط مرتبة.
وخلي كل حل في سطر لوحده.
سؤال المستخدم: ${prompt}
  `;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instructions }] }],
        }),
      });

      const data = await res.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ حدث خطأ في جلب الرد."
      );
    } catch (err) {
      console.error(err);
      return "⚠️ حدث خطأ أثناء الاتصال بالخادم.";
    }
  }

  async function sendChatMessage(query) {
    const txt = query || chatInput.value.trim();
    if (!txt) return;
    appendMessage(txt, "user", true);
    chatInput.value = "";

    appendMessage("⏳ جاري التفكير...", "bot", true);

    const reply = await askGemini(txt);

    chatBody.lastChild.remove();
    appendMessage(reply, "bot", true);
  }

  sendBtn.addEventListener("click", () => sendChatMessage());
  chatInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  function clearChat() {
    let clearmsg = document.createElement("div");
    clearmsg.className = "clear-massage";
    clearmsg.textContent = "هل تريد مسح المحادثة؟ سيتم حذفها نهائيًا.";
    let btns = document.createElement("div");
    btns.className = "chat-clear-btns";
    let yesBtn = document.createElement("button");
    yesBtn.textContent = "نعم";
    yesBtn.className = "btn";
    yesBtn.addEventListener("click", () => {
      localStorage.removeItem(CHAT_KEY);
      chatBody.innerHTML = "";
      appendMessage(
        "👋 مرحبًا! أنا هنا لدعمك في الصحة النفسية. اكتب سؤالك لبدء المحادثة.",
        "bot",
        true
      );
      clearmsg.remove();
      btns.remove();
    });
    let noBtn = document.createElement("button");
    noBtn.className = "btn";
    noBtn.textContent = "لا";
    noBtn.addEventListener("click", () => {
      clearmsg.remove();
    });
    btns.appendChild(yesBtn);
    btns.appendChild(noBtn);
    clearmsg.appendChild(btns);
    chatBody.appendChild(clearmsg);
  }
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  loadChat();

  // --- Community
  const POSTS_KEY = "mysite_community_posts_v2";
  let posts = [];
  function loadPosts() {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
      posts = [];
      return;
    }
    try {
      posts = JSON.parse(raw);
    } catch (e) {
      posts = [];
      console.warn("load posts failed", e);
    }
  }
  function savePosts() {
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn("save posts fail", e);
    }
  }
  const postImageInput = document.getElementById("postImage");
  const previewWrap = document.getElementById("previewWrap");
  const publishBtn = document.getElementById("publishBtn");
  let imageDataURL = "";
  postImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      imageDataURL = "";
      previewWrap.innerHTML = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = function (evt) {
      imageDataURL = evt.target.result;
      previewWrap.innerHTML = `<img src="${imageDataURL}" style="max-width:100%;border-radius:8px;display:block">`;
    };
    reader.readAsDataURL(file);
  });
  publishBtn.addEventListener("click", () => {
    const title = document.getElementById("postTitle").value.trim();
    const content = document.getElementById("postContent").value.trim();
    const contentEl = document.getElementById("postContent");
    const errorEl = document.createElement("div");
    errorEl.className = "error";
    errorEl.textContent = "الرجاء إدخال محتوى للمنشور.";
    errorEl.style.color = "red";
    errorEl.style.fontWeight = "700";
    const author =
      document.getElementById("postAuthor").value.trim() || "مجهول";
    if (!content) {
      if (
        !contentEl.nextElementSibling ||
        contentEl.nextElementSibling.className !== "error"
      ) {
        contentEl.style.borderColor = "red";
        contentEl.style.borderWidth = "2px";
        contentEl.style.borderStyle = "solid";
        contentEl.after(errorEl);
      }

      return;
    } else {
      contentEl.style.borderColor = "";
      contentEl.style.borderWidth = "";
      contentEl.style.borderStyle = "";
      if (
        contentEl.nextElementSibling &&
        contentEl.nextElementSibling.className === "error"
      ) {
        contentEl.nextElementSibling.remove(); // Remove existing error
      }
    }
    const post = {
      id: Date.now() + Math.floor(Math.random() * 999),
      author,
      title,
      content,
      image: imageDataURL || "",
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    posts.push(post);
    savePosts();
    renderPosts();
    document.getElementById("postTitle").value = "";
    document.getElementById("postContent").value = "";
    document.getElementById("postAuthor").value = "";
    postImageInput.value = "";
    imageDataURL = "";
    previewWrap.innerHTML = "";
    showSection(
      "community",
      document.querySelector('nav#bottomNav button[data-section="community"]')
    );
  });
  function renderPosts() {
    const container = document.getElementById("postsContainer");
    container.innerHTML = "";
    const sorted = posts
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sorted.length === 0) {
      container.innerHTML = `<div class="muted" style="text-align:center;">لا توجد منشورات حتى الآن — كن أول من يشارك!</div>`;
      return;
    }
    const currentUserId = "user1";
    sorted.forEach((post) => {
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn ghost btn-d";
      deleteButton.setAttribute("data-action", "delete-post");
      deleteButton.setAttribute("data-id", `${post.id}`);
      let deleteButtonText = document.createTextNode("🗑️ حذف");
      deleteButton.appendChild(deleteButtonText);
      const likedBy = post.likedBy || [];
      const userHasLiked = likedBy.includes(currentUserId);
      const likeButtonClass = userHasLiked ? "like-btn active" : "like-btn";
      const likeButtonText = userHasLiked ? "👍 ألغِ الإعجاب" : "👍 أعجبني";
      const postEl = document.createElement("div");
      postEl.className = "post-card";
      const timeStr = new Date(post.createdAt).toLocaleString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      });

      postEl.innerHTML += `
        <div class="post-header">
        <div class="avatar">${
          post.author && post.author[0] ? escapeHtml(post.author[0]) : "م"
        }</div>
        <div style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div>
        <div style="font-weight:700">${escapeHtml(post.author || "مجهول")}</div>
        <div class="post-meta">${timeStr}</div>
        </div>
        <div style="text-align:left" class="muted">${
          post.title ? escapeHtml(post.title) : ""
        }</div>
        </div>
        </div>
        <button class="btn ghost btn-d" data-action="delete-post" data-id="${
          post.id
        }">🗑️ حذف</button>
        </div>
        <div style="margin-top:10px;font-size:15px;color:var(--text);">${escapeHtml(
          post.content
        )}</div>
        ${post.image ? `<img src="${post.image}" class="post-image">` : ""}
        <div class="post-actions">
          <div>
            <button class="${likeButtonClass}" data-id="${
        post.id
      }">${likeButtonText}</button>
            <span class="counts" id="like-count-${post.id}">${
        post.likes || 0
      }</span>
          </div>
          <div>
            <button class="comment-btn" data-id="${post.id}">💬 تعليق</button>
            <span class="counts" id="comment-count-${post.id}">${
        post.comments.length
      }</span>
          </div>
        </div>
        <div class="comments" id="comments-${post.id}">
          ${
            post.comments.length
              ? post.comments
                  .map((c) => `<div class="comment">${escapeHtml(c)}</div>`)
                  .join("")
              : ""
          }
        </div>
        <div class="comment-box" id="comment-box-${
          post.id
        }" style="display:none">
          <input placeholder="اكتب تعليق..." id="comment-input-${post.id}">
          <button class="btn" data-action="send-comment" data-id="${
            post.id
          }">نشر</button>
        </div>
      `;
      container.appendChild(postEl);
    });
    container.querySelectorAll(".btn-d").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = Number(btn.dataset.id);
        const postIndex = posts.findIndex((p) => p.id === id);
        if (postIndex !== -1) {
          posts.splice(postIndex, 1); // remove post
          savePosts();
          renderPosts(); // re-render
        }
      });
    });
    container.querySelectorAll(".like-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        toggleLike(id);
      });
    });
    container.querySelectorAll(".comment-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        toggleCommentBox(id);
      });
    });
    container
      .querySelectorAll('[data-action="send-comment"]')
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          const input = document.getElementById(`comment-input-${id}`);
          if (input && input.value.trim()) {
            addComment(id, input.value.trim());
            input.value = "";
          }
        });
      });
  }
  function toggleLike(id) {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    const userId = "user1";
    const likedIndex = post.likedBy.indexOf(userId);
    if (likedIndex > -1) {
      post.likes--;
      post.likedBy.splice(likedIndex, 1);
    } else {
      post.likes++;
      post.likedBy.push(userId);
    }
    savePosts();
    renderPosts();
  }
  function toggleCommentBox(id) {
    const box = document.getElementById(`comment-box-${id}`);
    if (box) box.style.display = box.style.display === "flex" ? "none" : "flex";
  }
  function addComment(id, comment) {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    post.comments.push(comment);
    savePosts();
    renderPosts();
  }
  loadPosts();
  renderPosts();

  // --- Daily Todo List ---
  const TODO_KEY = "mysite_todos_v1";
  const todoListContainer = document.getElementById("todoListContainer");
  const addTodoBtn = document.getElementById("addTodoBtn");
  const imAndUr = document.getElementById("imAndUr");
  const imAndNUr = document.getElementById("imAndNUr");
  const nImAndUr = document.getElementById("nImAndUr");
  const nImAndNUr = document.getElementById("nImAndNUr");
  function saveTodos(todos) {
    try {
      localStorage.setItem(TODO_KEY, JSON.stringify(todos));
    } catch (e) {
      console.error("Failed to save todos", e);
    }
  }

  function loadTodos() {
    try {
      const raw = localStorage.getItem(TODO_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load todos", e);
      return [];
    }
  }

  function renderTodos() {
    const todos = loadTodos();
    todoListContainer.innerHTML = "";
    imAndUr.innerHTML = "";
    imAndNUr.innerHTML = "";
    nImAndUr.innerHTML = "";
    nImAndNUr.innerHTML = "";

    if (todos.length === 0) {
      todoListContainer.innerHTML = `<p class="muted">لا توجد مهام مضافة بعد.</p>`;
      return;
    }

    todos.forEach((todo, idx) => {
      // عنصر القائمة الرئيسية
      const item = document.createElement("div");
      item.className = "todo-item";
      item.setAttribute("index", idx);
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.gap = "8px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `todo-${idx}`;
      checkbox.className = "todo-checkbox";
      checkbox.checked = !!todo.done;

      const text = document.createElement("label");
      text.textContent = todo.text;
      text.setAttribute("for", `todo-${idx}`);
      text.className = "todo-text";
      const span = document.createElement("span");
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.className = "btn btn-d";
      delBtn.title = "حذف المهمة";

      if (todo.done) {
        text.style.textDecoration = "line-through";
        text.style.opacity = "0.6";
      }

      span.appendChild(checkbox);
      span.appendChild(text);
      item.appendChild(span);
      item.appendChild(delBtn);

      // عنصر الأولويات (نسخة من نفس المهمة)
      const itemP = document.createElement("div");
      itemP.className = "todo-itemp";
      itemP.setAttribute("index", idx);
      itemP.style.display = "flex";
      itemP.style.alignItems = "center";
      itemP.style.gap = "8px";

      const checkboxP = document.createElement("input");
      checkboxP.type = "checkbox";
      checkboxP.className = "todop-checkbox";
      checkboxP.checked = !!todo.done;

      const textP = document.createElement("label");
      textP.textContent = todo.text;
      textP.className = "todo-text";
      const spanP = document.createElement("span");
      const delBtnP = document.createElement("button");
      delBtnP.textContent = "🗑️";
      delBtnP.className = "btn btn-d";
      delBtnP.title = "حذف المهمة";

      if (todo.done) {
        textP.style.textDecoration = "line-through";
        textP.style.opacity = "0.6";
      }

      spanP.appendChild(checkboxP);
      spanP.appendChild(textP);
      itemP.appendChild(spanP);
      itemP.appendChild(delBtnP);

      // تزامن checkbox
      checkbox.addEventListener("change", () => {
        todos[idx].done = checkbox.checked;
        saveTodos(todos);
        renderTodos();
      });
      checkboxP.addEventListener("change", () => {
        todos[idx].done = checkboxP.checked;
        saveTodos(todos);
        renderTodos();
      });

      // تزامن الحذف
      delBtn.addEventListener("click", () => {
        todos.splice(idx, 1);
        saveTodos(todos);
        renderTodos();
      });
      delBtnP.addEventListener("click", () => {
        todos.splice(idx, 1);
        saveTodos(todos);
        renderTodos();
      });

      // توزيع في الأولويات
      if (todo.important) {
        if (todo.urgent) {
          imAndUr.appendChild(itemP);
        } else {
          imAndNUr.appendChild(itemP);
        }
      } else {
        if (todo.urgent) {
          nImAndUr.appendChild(itemP);
        } else {
          nImAndNUr.appendChild(itemP);
        }
      }

      // إضافة العنصر للقائمة الرئيسية
      todoListContainer.appendChild(item);
    });
  }

  addTodoBtn.addEventListener("click", () => {
    // Prevent multiple cards
    if (document.querySelector(".todo-add-card")) return;
    const card = document.createElement("div");
    card.className = "todo-add-card card";

    const title = document.createElement("h4");
    title.textContent = "إضافة مهمة جديدة";
    card.appendChild(title);
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "اكتب مهمة جديدة...";
    input.className = "todo-input";
    input.style.margin = "8px 0";
    input.style.width = "100%";
    card.appendChild(input);
    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.gap = "8px";
    btns.style.marginTop = "8px";
    const checkboxIm = document.createElement("input");
    checkboxIm.type = "checkbox";
    checkboxIm.id = "important";
    const textIm = document.createElement("label");
    textIm.setAttribute("for", "important");
    textIm.textContent = "مهم";
    const checkboxUr = document.createElement("input");
    checkboxUr.type = "checkbox";
    checkboxUr.id = "urgent";
    const textUr = document.createElement("label");
    textUr.setAttribute("for", "urgent");
    textUr.textContent = "عاجل";
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "إضافة";
    saveBtn.className = "btn";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "إلغاء";
    cancelBtn.className = "btn ghost";

    card.appendChild(checkboxIm);
    card.appendChild(textIm);
    card.appendChild(checkboxUr);
    card.appendChild(textUr);
    btns.appendChild(saveBtn);
    btns.appendChild(cancelBtn);
    card.appendChild(btns);
    todoListContainer.prepend(card);
    input.focus();
    saveBtn.addEventListener("click", () => {
      const val = input.value.trim();
      if (val) {
        const todos = loadTodos();
        const isImportant = checkboxIm.checked;
        const isUrgent = checkboxUr.checked;
        todos.push({
          text: val,
          done: false,
          important: isImportant,
          urgent: isUrgent,
        });
        if (
          input.nextElementSibling ||
          input.nextElementSibling.className === "error"
        ) {
          input.nextElementSibling.remove();
        }

        saveTodos(todos);
        renderTodos();
        card.remove();
      } else {
        if (
          !input.nextElementSibling ||
          input.nextElementSibling.className !== "error"
        ) {
          const errorEl = document.createElement("div");
          errorEl.className = "error";
          errorEl.textContent = "يرجى ملء هذا الحقل.";

          errorEl.style.color = "red";
          errorEl.style.fontWeight = "700";
          input.style.borderColor = "red";
          input.style.borderWidth = "2px";
          input.style.borderStyle = "solid";

          input.after(errorEl);
        }
      }
    });
    cancelBtn.addEventListener("click", () => {
      card.remove();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveBtn.click();
      if (e.key === "Escape") cancelBtn.click();
    });
  });

  document.addEventListener("DOMContentLoaded", renderTodos);
  // --- Mood Tracker
  const moodDisplay = document.getElementById("moodDisplay");
  const moodBtns = document.querySelectorAll(".mood-btn");
  const moodTimestamp = document.getElementById("moodTimestamp");
  const moodChartCanvas = document.getElementById("moodChart");
  const noMoodDataEl = document.getElementById("noMoodData");
  const MOOD_KEY = "mysite_mood_v1";
  const MOOD_HISTORY_KEY = "mysite_mood_history_v1";
  let moodChart = null;
  const moodMap = { "😊": 5, "😌": 4, "😐": 3, "😔": 2, "😠": 1 };
  const moodLabels = ["😠", "😔", "😐", "😌", "😊"];

  function saveMood(mood) {
    const moodData = { mood, timestamp: new Date().toISOString() };
    localStorage.setItem(MOOD_KEY, JSON.stringify(moodData));
    saveMoodToHistory(moodData);
    moodTimestamp.textContent = `تم التحديث في ${new Date(
      moodData.timestamp
    ).toLocaleTimeString("ar-EG")}`;
  }
  function saveMoodToHistory(moodData) {
    let history = loadMoodHistory();
    const today = new Date().toDateString();
    const existingIndex = history.findIndex(
      (entry) => new Date(entry.timestamp).toDateString() === today
    );
    if (existingIndex > -1) {
      history[existingIndex] = moodData;
    } else {
      history.push(moodData);
    }
    history = history.slice(-7);
    localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(history));
    renderMoodChart();
  }
  function loadMoodHistory() {
    const raw = localStorage.getItem(MOOD_HISTORY_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load mood history", e);
      return [];
    }
  }
  function loadMood() {
    const raw = localStorage.getItem(MOOD_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      moodDisplay.textContent = data.mood;
      moodTimestamp.textContent = `تم التحديث في ${new Date(
        data.timestamp
      ).toLocaleTimeString("ar-EG")}`;
    }
    renderMoodChart();
  }
  function renderMoodChart() {
    const history = loadMoodHistory();
    if (history.length === 0) {
      if (moodChart) moodChart.destroy();
      moodChartCanvas.style.display = "none";
      noMoodDataEl.style.display = "block";
      noMoodDataEl.textContent =
        "لا توجد بيانات مزاج لعرضها. ابدأ بتسجيل مزاجك اليومي.";
      return;
    }
    moodChartCanvas.style.display = "block";
    noMoodDataEl.style.display = "none";
    if (moodChart) moodChart.destroy();
    const labels = history.map((entry) =>
      new Date(entry.timestamp).toLocaleDateString("ar-EG", {
        weekday: "short",
        day: "numeric",
      })
    );
    const dataPoints = history.map((entry) => moodMap[entry.mood]);
    moodChart = new Chart(moodChartCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "سجل مزاجي",
            data: dataPoints,
            backgroundColor: "rgba(47, 128, 237, 0.2)",
            borderColor: "rgba(47, 128, 237, 1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              callback: (value) => moodLabels[value - 1] || "",
              stepSize: 1,
            },
          },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }
  moodBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedMood = btn.dataset.mood;
      moodDisplay.textContent = selectedMood;
      saveMood(selectedMood);
    });
  });

  // --- Habits Tracker
  const habitTrackerCard = document.getElementById("habitTracker");
  const HABITS_KEY = "mysite_habits_v1";
  const habitsListEl = document.getElementById("habits-list");
  const addHabitBtn = document.getElementById("addHabitBtn");

  function saveHabits(habits) {
    try {
      localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    } catch (e) {
      console.error("Failed to save habits", e);
    }
  }
  function loadHabits() {
    try {
      const raw = localStorage.getItem(HABITS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load habits", e);
      return [];
    }
  }
  function renderHabits() {
    const habits = loadHabits();
    habitsListEl.innerHTML = "";
    if (habits.length === 0) {
      habitsListEl.innerHTML = `<p class="muted" style="text-align:center;">لا توجد عادات مسجلة. اضغط على الزر لإضافة واحدة.</p>`;
      return;
    }
    habits.forEach((habit, index) => {
      const habitItem = document.createElement("div");
      habitItem.className = "habit-item";
      habitItem.innerHTML = `
      <span>
        <input type="checkbox" id="habit-${index}" class="habit-checkbox" ${
        habit.done ? "checked" : ""
      }>
        <label for="habit-${index}" class="habit-text">${habit.name}</label>
        </span>
        <button class="delete-habit-btn btn " data-index="${index}">🗑️</button>
      `;
      const deleteBtn = habitItem.querySelector(".delete-habit-btn");
      deleteBtn.addEventListener("click", () => {
        const habits = loadHabits();
        habits.splice(index, 1);
        saveHabits(habits);
        renderHabits();
      });
      habitsListEl.appendChild(habitItem);
    });
  }
  addHabitBtn.addEventListener("click", () => {
    const card = document.createElement("div");
    card.className = "habit-add-card";
    const title = document.createElement("h4");
    title.textContent = "إضافة عادة جديدة";
    card.appendChild(title);
    const description = document.createElement("p");
    description.textContent = "اكتب اسم العادة التي تريد إضافتها:";
    card.appendChild(description);
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "مثال: شرب الماء يوميًا";
    input.className = "habit-input";
    card.appendChild(input);
    const btnsContainer = document.createElement("div");
    btnsContainer.className = "habit-btns";

    const addButton = document.createElement("button");
    addButton.textContent = "إضافة";
    addButton.className = "btn";
    addButton.addEventListener("click", () => {
      const newHabitName = input.value.trim();
      const error = document.createElement("div");
      error.className = "error";
      error.textContent = "الرجاء إدخال اسم العادة.";
      error.style.color = "red";
      error.style.fontWeight = "700";

      if (newHabitName && newHabitName.trim() !== "") {
        const habits = loadHabits();
        habits.push({ name: newHabitName.trim(), done: false });
        saveHabits(habits);
        renderHabits();
        card.remove();
      }
      if (!newHabitName) {
        if (
          input.nextElementSibling &&
          input.nextElementSibling.className === "error"
        ) {
          input.nextElementSibling.remove(); // Remove existing error
        }
        input.style.borderColor = "red";
        input.style.borderWidth = "2px";
        input.style.borderStyle = "solid";
        input.style.backgroundColor = "#ffe6e6";
        input.after(error);
      }
    });
    btnsContainer.appendChild(addButton);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "إلغاء";
    cancelButton.className = "btn";
    cancelButton.addEventListener("click", () => {
      card.remove();
    });
    btnsContainer.appendChild(cancelButton);
    card.appendChild(btnsContainer);
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addButton.click();
      }
    });
    if (habitTrackerCard.querySelector(".habit-add-card")) {
      addHabitBtn.onclick = null; // Disable the button if already open
      return;
    }
    habitTrackerCard.appendChild(card);
  });
  window.addEventListener("DOMContentLoaded", () => {
    loadHabits();
    renderHabits();
  });

  habitsListEl.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      const index = e.target.id.split("-")[1];
      const habits = loadHabits();
      if (habits[index]) {
        habits[index].done = e.target.checked;
        saveHabits(habits);
      }
    }
  });

  // --- Gratitude Journal
  // مفتاح التخزين المحلي
  const GRATITUDE_KEY = "mysite_gratitude_journal_v1";

  // عناصر الـ DOM
  const gratitudeInput = document.getElementById("gratitudeInput");
  const saveGratitudeBtn = document.getElementById("saveGratitudeBtn");
  const gratitudeListContainer = document.getElementById(
    "gratitude-list-container"
  );

  // تحميل الإدخالات من LocalStorage
  function loadGratitude() {
    try {
      const raw = localStorage.getItem(GRATITUDE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("خطأ أثناء تحميل البيانات:", e);
      return [];
    }
  }

  // حفظ إدخال جديد
  function saveGratitude(entry) {
    try {
      const entries = loadGratitude();
      entries.push(entry);
      localStorage.setItem(GRATITUDE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error("خطأ أثناء حفظ البيانات:", e);
    }
  }

  // حذف إدخال واحد بناءً على الفهرس
  function deleteGratitude(index) {
    try {
      const entries = loadGratitude();
      entries.splice(index, 1); // حذف عنصر واحد فقط
      localStorage.setItem(GRATITUDE_KEY, JSON.stringify(entries));
      renderGratitude();
    } catch (e) {
      console.error("خطأ أثناء حذف البيانات:", e);
    }
  }

  // عرض الإدخالات على الصفحة
  function renderGratitude() {
    const entries = loadGratitude();
    gratitudeListContainer.innerHTML = "";

    if (entries.length === 0) {
      gratitudeListContainer.innerHTML = `<p class="muted" style="text-align:center;">لا توجد يوميات حتى الآن.</p>`;
      return;
    }

    entries.forEach((entry, index) => {
      const item = document.createElement("div");
      entry = entry || {};
      item.className = "gratitude-item";
      // التحقق من صحة التاريخ
      let dateText = "تاريخ غير متوفر";
      if (entry.timestamp && !isNaN(new Date(entry.timestamp))) {
        dateText = new Date(entry.timestamp).toLocaleDateString("ar-EG", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      // محتوى الإدخال مع زر الحذف
      item.innerHTML = `<span>

      <strong>${dateText}:</strong> ${entry.text || "بدون نص"}</span>
      <button class="btn btn-d delete-btn" data-index="${index}">
        🗑️ 
      </button>
    `;

      gratitudeListContainer.appendChild(item);
    });

    // إضافة حدث الحذف لكل زر
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        deleteGratitude(index);
      });
    });

    // التمرير لآخر إدخال
    gratitudeListContainer.scrollTop = gratitudeListContainer.scrollHeight;
  }

  // عند الضغط على زر الحفظ
  saveGratitudeBtn.addEventListener("click", () => {
    const text = gratitudeInput.value.trim();
    if (text) {
      const entry = {
        text,
        timestamp: new Date().toISOString(),
      };
      saveGratitude(entry);
      renderGratitude();
      gratitudeInput.value = "";
      gratitudeInput.style.borderColor = "";
      gratitudeInput.style.borderWidth = "";
      gratitudeInput.style.borderStyle = "";
      const errorEl = gratitudeInput.nextElementSibling;
      if (errorEl && errorEl.className === "error") {
        errorEl.remove(); // Remove existing error
      }
    } else {
      if (
        !gratitudeInput.nextElementSibling ||
        gratitudeInput.nextElementSibling.className !== "error"
      ) {
        const errorEl = document.createElement("div");
        errorEl.className = "error";
        errorEl.textContent = "الرجاء إدخال نص قبل الحفظ.";
        errorEl.style.color = "red";
        errorEl.style.fontWeight = "700";
        gratitudeInput.style.borderColor = "red";
        gratitudeInput.style.borderWidth = "2px";
        gratitudeInput.style.borderStyle = "solid";
        gratitudeInput.after(errorEl);
      }
    }
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Enter" && gratitudeInput.value.trim()) {
      saveGratitudeBtn.click();
    }
  });

  // عرض البيانات عند تحميل الصفحة
  document.addEventListener("DOMContentLoaded", renderGratitude);

  // --- Goals and Achievements Tracker
  const goalsSection = document.getElementById("goalsAndAchievements");
  const GOALS_KEY = "mysite_goals_v1";
  const goalsListContainer = document.getElementById("goals-list-container");
  const completedGoalsList = document.getElementById("completed-goals-list");
  const addGoalBtn = document.getElementById("addGoalBtn");
  function saveGoals(goals) {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch (e) {
      console.error("Failed to save goals", e);
    }
  }
  function loadGoals() {
    try {
      const raw = localStorage.getItem(GOALS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load goals", e);
      return [];
    }
  }
  function renderGoals() {
    const goals = loadGoals();
    const activeGoals = goals.filter((g) => !g.completed);
    const completedGoals = goals.filter((g) => g.completed);
    goalsListContainer.innerHTML = "";
    if (activeGoals.length === 0) {
      goalsListContainer.innerHTML = `<p class="muted" style="text-align:center;">لا توجد أهداف نشطة. ابدأ بإضافة هدف جديد!</p>`;
    } else {
      activeGoals.forEach((goal, index) => {
        const progress = (goal.current / goal.target) * 100;
        const goalEl = document.createElement("div");
        goalEl.className = "goal-item";
        goalEl.innerHTML = `
            <div class="title">
                <span>${goal.name}</span>
                <span style="font-size:14px; color:var(--primary);">${
                  goal.current
                } / ${goal.target}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width:${
                  progress > 100 ? 100 : progress
                }%;"></div>
            </div>
            <div class="goal-actions">
                <button class="goal-action-btn" data-action="increment" data-index="${index}">+ زيادة</button>
                <button class="goal-action-btn" data-action="decrement" data-index="${index}">- نقص</button>
                <button class="goal-action-btn" data-action="complete" data-index="${index}" style="margin-right:auto;">أكملت الهدف!</button>
            </div>
        `;
        goalsListContainer.appendChild(goalEl);
      });
    }
    completedGoalsList.innerHTML = "";
    if (completedGoals.length === 0) {
      completedGoalsList.innerHTML = `<p class="muted" style="text-align:center;">لا توجد إنجازات مكتملة بعد.</p>`;
    } else {
      completedGoals.forEach((goal) => {
        const completedDate = new Date(goal.completionDate).toLocaleDateString(
          "ar-EG",
          { day: "2-digit", month: "short", year: "numeric" }
        );
        completedGoalsList.innerHTML += `
            <div class="completed-goal-item">
                <span class="title">${goal.name}</span>
                <span class="date">أنجز في: ${completedDate}</span>
            </div>
        `;
      });
    }
  }
  addGoalBtn.addEventListener("click", () => {
    const card = document.createElement("div");
    card.className = "goal-add-card";
    const title = document.createElement("h4");
    title.textContent = "إضافة هدف جديد";
    card.appendChild(title);
    const description = document.createElement("p");
    description.textContent = "اكتب اسم الهدف والهدف المطلوب تحقيقه:";
    card.appendChild(description);
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "اسم الهدف (مثال: قراءة كتاب)";
    nameInput.className = "goal-input";
    card.appendChild(nameInput);
    const targetInput = document.createElement("input");
    targetInput.type = "number";
    targetInput.placeholder = "الهدف المطلوب (مثال: 10 صفحات)";
    targetInput.className = "goal-input";
    card.appendChild(targetInput);
    const btnsContainer = document.createElement("div");
    btnsContainer.className = "goal-btns";
    const addButton = document.createElement("button");
    addButton.textContent = "إضافة";
    addButton.className = "btn";
    addButton.addEventListener("click", () => {
      const name = nameInput.value.trim();
      const target = parseInt(targetInput.value.trim(), 10);
      if (name && target > 0) {
        const goals = loadGoals();
        const newGoal = {
          name,
          target,
          current: 0,
          completed: false,
          creationDate: new Date().toISOString(),
          completionDate: null,
        };
        goals.push(newGoal);
        saveGoals(goals);
        renderGoals();
        card.remove();
        const msg = document.createElement("div");
        msg.className = "success";
        msg.textContent = `تم إضافة الهدف "${name}" بنجاح!`;
        goalsSection.prepend(msg);
        setTimeout(() => {
          msg.remove();
        }, 3000); // Remove message after 3 seconds
      } else {
        document.querySelectorAll(".goal-input").forEach((input) => {
          if (!input.value.trim()) {
            const errorEl = document.createElement("div");
            errorEl.className = "error";
            errorEl.textContent = "يرجى ملء هذا الحقل.";
            errorEl.style.color = "red";
            errorEl.style.fontWeight = "700";

            // Light red background
            if (
              !input.nextElementSibling ||
              input.nextElementSibling.className !== "error"
            ) {
              input.style.borderColor = "red";
              input.style.backgroundColor = "#ffe6e6";
              input.after(errorEl);
            }
          } else {
            const errorEl = input.nextElementSibling;
            if (errorEl && errorEl.className === "error") {
              errorEl.remove();

              input.style.borderColor = "";
              input.style.backgroundColor = "";
            }
          }
        });
      }
    });
    btnsContainer.appendChild(addButton);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "إلغاء";
    cancelButton.className = "btn";
    cancelButton.addEventListener("click", () => {
      card.remove();
    });
    btnsContainer.appendChild(cancelButton);
    card.appendChild(btnsContainer);
    nameInput.focus();
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addButton.click();
      }
    });
    if (goalsSection.querySelector(".goal-add-card")) {
      addGoalBtn.onclick = null; // Disable the button if already open
      return;
    }
    addGoalBtn.after(card);
  });
  window.addEventListener("DOMContentLoaded", () => {
    loadGoals();
    renderGoals();
  });
  // Handle goal actions
  // This event listener handles incrementing, decrementing, and completing goals
  // It updates the goal's current progress and marks it as completed if necessary

  goalsListContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".goal-action-btn");
    if (!btn) return;
    const action = btn.dataset.action;
    const index = parseInt(btn.dataset.index);
    const goals = loadGoals();
    const activeGoals = goals.filter((g) => !g.completed);
    const goal = activeGoals[index];
    if (!goal) return;
    const originalIndex = goals.findIndex(
      (g) => g.creationDate === goal.creationDate
    );

    if (action === "increment") {
      goal.current += 1;
      if (goal.current >= goal.target) {
        goal.current = goal.target; // Set current to target
        goal.completionDate = new Date().toISOString();
        goal.completed = true; // Mark as completed
        const successMsg = document.createElement("div");
        successMsg.className = "success";
        successMsg.textContent = `تهانينا! لقد أكملت هدف "${goal.name}".`;
        goalsSection.prepend(successMsg);
        setTimeout(() => {
          successMsg.remove();
        }, 3000); // Remove message after 3 seconds
      }
    } else if (action === "decrement") {
      if (goal.current > 0) {
        goal.current -= 1;
      }
    } else if (action === "complete") {
      goal.completed = true;
      goal.completionDate = new Date().toISOString();
      const msg = document.createElement("div");
      msg.className = "success";
      msg.textContent = `تهانينا! لقد أكملت هدف "${goal.name}".`;
      goalsSection.prepend(msg);
      setTimeout(() => {
        msg.remove();
      }, 3000); // Remove message after 3 seconds
      goal.current = goal.target; // Set current to target
      goal.completionDate = new Date().toISOString();
      goal.completed = true; // Mark as completed
      const successMsg = document.createElement("div");
      successMsg.className = "success";
      successMsg.textContent = `تهانينا! لقد أكملت هدف "${goal.name}".`;
      goalsSection.prepend(successMsg);
      setTimeout(() => {
        successMsg.remove();
      }, 3000); // Remove message after 3 seconds
    }
    goals[originalIndex] = goal;
    saveGoals(goals);
    renderGoals();
  });

  // --- User Authentication and State Management
  const AUTH_KEY = "mysite_auth_user";
  const loginContainer = document.getElementById("login-container");
  const signupContainer = document.getElementById("signup-container");
  const profileContent = document.getElementById("profile-content");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const showSignupBtn = document.getElementById("showSignup");
  const showLoginBtn = document.getElementById("showLogin");
  let currentUser = null;
  function saveUser(user) {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      currentUser = user;
    } catch (e) {
      console.error("Failed to save user data", e);
    }
  }
  function loadUser() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        currentUser = JSON.parse(raw);
        return currentUser;
      }
      return null;
    } catch (e) {
      console.error("Failed to load user data", e);
      return null;
    }
  }
  function logout() {
    localStorage.removeItem(AUTH_KEY);
    currentUser = null;
    checkAuthState();
    alert("تم تسجيل الخروج بنجاح.");
  }
  function checkAuthState() {
    const user = loadUser();
    if (user) {
      loginContainer.classList.add("hidden");
      signupContainer.classList.add("hidden");
      profileContent.classList.remove("hidden");
      updateProfileUI(user);
    } else {
      loginContainer.classList.remove("hidden");
      signupContainer.classList.add("hidden");
      profileContent.classList.add("hidden");
    }
  }
  function updateProfileUI(user) {
    document.getElementById("profileName").textContent =
      user.name || "الملف الشخصي";
    document.getElementById("profileEmail").textContent =
      user.email || "غير متوفر";
  }
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    const password = loginPassword.value;
    const storedUser = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (
      storedUser &&
      storedUser.email === email &&
      storedUser.password === password
    ) {
      saveUser(storedUser);
      checkAuthState();
      alert("تم تسجيل الدخول بنجاح!");
    } else {
      alert("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    }
  });
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();
    if (name === "" || email === "" || password === "") {
      alert("يرجى ملء جميع الحقول.");
      return;
    }
    const newUser = { name, email, password };
    saveUser(newUser);
    checkAuthState();
    alert("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
    showLoginBtn.click();
  });
  logoutBtn.addEventListener("click", logout);
  showSignupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginContainer.classList.add("hidden");
    signupContainer.classList.remove("hidden");
  });
  showLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    signupContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
  });
  document
    .querySelector('nav#bottomNav button[data-section="profile"]')
    .addEventListener("click", (e) => {
      e.preventDefault();
      showSection("profile", e.currentTarget);
      checkAuthState();
    });
  // --- Initial calls on page load
  document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    loadMood();
    renderHabits();
    renderGratitude();
    renderGoals();
    checkAuthState();
  });
})();
