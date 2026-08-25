const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const icon = (name) => `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
const escapeHTML = (text = "") => text.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

const state = {
  space: "home",
  view: "landing",
  selectedChannel: null,
  selectedDM: null,
  serverMenu: false,
  infoOpen: false,
  infoTab: "media",
  favoriteInfoTab: "media",
  friendsTab: "all",
  notificationMenu: false,
  notificationMuteMenu: false,
  notificationMode: "mentions",
  auditMenu: false,
  auditFilter: "all",
  userSettingsTab: "profile",
  serverSettingsTab: "profile",
  channelSettingsTab: "info",
  roleTab: "general",
  selectedRole: "everyone",
  roleNames: { everyone: "@everyone", "new-role": "Новая роль" },
  roleMemberAdded: false,
  roleMemberPicker: false,
  selectedPermissionSubject: "everyone",
  applicationFilter: "all",
  permissionStates: {},
  roleCreated: false,
  memberActionMenu: false,
  permissionAddMenu: false,
  customPermissionRole: false,
  mobileSettingsView: false,
  selectedMessage: null,
  replyingTo: null,
  modal: null,
  modalParent: null,
};

const directMessages = [];

const messages = {
  favorite: [
    { name: "ArCode", initials: "A", tone: "", time: "Сегодня, 12:14", text: "Сохранить референсы для нового интерфейса СИМТИ." },
    { name: "ArCode", initials: "A", tone: "", time: "Сегодня, 12:16", text: "Проверить состояния кнопок, форм и модальных окон." },
  ],
  channel: [
    { name: "ArCode", initials: "A", tone: "", time: "15:21", text: "Добро пожаловать в основной канал сервера." },
    { name: "Мария", initials: "М", tone: "pink", time: "15:24", text: "Здесь можно обсуждать общие вопросы и делиться файлами." },
    { name: "Илья", initials: "И", tone: "green", time: "15:27", text: "Новая тёмная тема выглядит заметно спокойнее и современнее." },
  ],
  dm: [],
};

function showToast(text) {
  const toast = $("#toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function closeMobile() {
  $("#app").classList.remove("mobile-open");
}

function renderSidebar() {
  const head = $("#sidebarHead");
  const body = $("#sidebarBody");

  if (state.space === "home") {
    head.innerHTML = `<button class="sidebar-main-action" data-modal="new-chat"><span>Начать беседу</span>${icon("plus")}</button>`;
    body.innerHTML = `
      <div class="nav-list">
        <button class="nav-row ${state.view === "friends" ? "active" : ""}" data-view="friends">${icon("users")}<span>Друзья</span></button>
        <button class="nav-row ${state.view === "favorite" ? "active" : ""}" data-view="favorite">${icon("bookmark")}<span>Избранное</span></button>
      </div>
      <div class="section-title"><span>Личные сообщения</span></div>
      ${directMessages.length ? `<div class="dm-list">${directMessages.map((dm) => `
        <button class="dm-row ${state.view === "dm" && state.selectedDM === dm.id ? "active" : ""}" data-dm="${dm.id}">
          <span class="avatar blue">${dm.initials}<span class="online"></span></span>
          <span class="dm-copy"><strong>${dm.name}</strong><small>Новая беседа</small></span>
        </button>`).join("")}</div>` : `<div class="empty-list-note">Пока нет бесед</div>`}
    `;
  } else {
    head.innerHTML = `
      <button class="server-title-button ${state.serverMenu ? "open" : ""}" data-action="server-menu"><span>Simty Upgrade</span>${icon("chevron")}</button>
      <div class="server-menu ${state.serverMenu ? "open" : ""}">
        <button data-modal="invite">${icon("user-check")}<span>Пригласить на сервер</span></button>
        <button data-modal="server-settings">${icon("settings")}<span>Настройки сервера</span></button>
        <button data-modal="create-channel">${icon("plus")}<span>Создать канал</span></button>
        <button data-modal="create-category">${icon("folder")}<span>Создать категорию</span></button>
      </div>`;
    body.innerHTML = `
      <div class="section-title"><span>Текстовые каналы</span></div>
      <div class="channel-list">
        <div class="channel-wrap ${state.view === "channel" && state.selectedChannel === "main" ? "active" : ""}">
          <button class="channel-row" data-channel="main">${icon("hash")}<span>Основной</span></button>
          <button class="channel-settings" aria-label="Настройки канала" data-modal="channel-settings">${icon("settings")}</button>
        </div>
      </div>`;
  }
}

function renderHeader() {
  const head = $("#mainHead");
  const mobile = `<button class="icon-button mobile-back-button" data-action="mobile-back" aria-label="Назад">${icon("arrow-left")}</button>`;

  if (state.view === "friends") {
    head.innerHTML = `<div class="head-start">${mobile}${icon("users")}<strong>Друзья</strong></div><div class="head-end"></div>`;
    return;
  }

  if (state.view === "favorite") {
    head.innerHTML = `
      <div class="head-start">${mobile}<button class="favorite-head-trigger" data-modal="favorite-info" aria-label="Открыть сведения об Избранном">${icon("bookmark")}<strong>Избранное</strong></button></div>`;
    return;
  }

  if (state.view === "channel") {
    head.innerHTML = `
      <div class="head-start">${mobile}${icon("hash")}<strong>Основной</strong></div>
      <div class="head-end"><div class="notification-control"><button class="icon-button ${state.notificationMenu ? "active" : ""}" data-action="notifications" aria-label="Уведомления канала" aria-expanded="${state.notificationMenu}">${icon("at")}</button>${renderNotificationMenu()}</div><button class="icon-button" data-modal="channel-settings" aria-label="Настройки канала">${icon("settings")}</button></div>`;
    return;
  }

  if (state.view === "dm") {
    const dm = directMessages.find((item) => item.id === state.selectedDM);
    head.innerHTML = `<div class="head-start">${mobile}${icon("chat")}<strong>${dm?.name || "Беседа"}</strong></div><div class="head-end"><button class="icon-button" data-action="info" aria-label="Информация">${icon("at")}</button><button class="icon-button" data-toast="Настройки беседы">${icon("settings")}</button></div>`;
    return;
  }

  head.innerHTML = `<div class="head-start">${mobile}${state.space === "server" ? "" : "<strong>СИМТИ — Мессенджер для команд</strong>"}</div><div class="head-end"></div>`;
}

function renderNotificationMenu() {
  if (!state.notificationMenu) return "";
  const option = (mode, iconName, label) => `<button class="notification-option ${state.notificationMode === mode ? "selected" : ""}" data-notification-mode="${mode}">${icon(iconName)}<span>${label}</span>${state.notificationMode === mode ? icon("check") : ""}</button>`;
  return `<div class="notification-menu" role="menu" aria-label="Настройки уведомлений">
    ${option("all", "bell", "Все сообщения")}
    ${option("mentions", "at", "Только упоминания")}
    <div class="notification-temporary-wrap"><button class="notification-option ${state.notificationMuteMenu ? "open" : ""}" data-action="notification-temporary">${icon("clock")}<span>Отключить на время</span>${icon("chevron")}</button>${state.notificationMuteMenu ? `<div class="notification-submenu"><button data-notification-duration="1 час">На 1 час</button><button data-notification-duration="8 часов">На 8 часов</button><button data-notification-duration="24 часа">На 24 часа</button></div>` : ""}</div>
    ${option("off", "bell-off", "Отключить")}
  </div>`;
}

function renderLanding() {
  const server = state.space === "server";
  return `<div class="landing"><div class="landing-card"><div class="landing-symbol ${server ? "channel-landing-symbol" : "home-landing-symbol"}">${icon(server ? "hash" : "chat")}</div><h1>${server ? "Выберите канал" : "Выберите беседу"}</h1><p>${server ? "Откройте канал слева, чтобы начать общение." : "Откройте «Друзья», «Избранное» или начните новую беседу."}</p></div></div>`;
}

function renderFriends() {
  const emptyStates = {
    all: { icon: "users", title: "Пока нет друзей", text: "Добавляйте пользователей, чтобы начать общаться и создавать личные беседы." },
    incoming: { icon: "user-check", title: "Нет входящих запросов", text: "Новые запросы дружбы появятся здесь — их можно будет принять или отклонить." },
    outgoing: { icon: "clock", title: "Нет исходящих запросов", text: "Отправленные вами запросы дружбы и их статус будут отображаться здесь." },
  };
  const empty = emptyStates[state.friendsTab] || emptyStates.all;
  return `
    <div class="page">
      <div class="page-title"><h1>Добавить друга</h1><p>Введите точное имя пользователя, чтобы отправить запрос.</p></div>
      <form class="friend-add" id="friendForm"><input class="input" id="friendName" placeholder="Введите имя пользователя" aria-label="Введите имя пользователя" /><button class="primary" type="submit">Добавить</button></form>
      <div class="tabs"><button class="tab ${state.friendsTab === "all" ? "active" : ""}" data-friends-tab="all">Все <span class="pill">0</span></button><button class="tab ${state.friendsTab === "incoming" ? "active" : ""}" data-friends-tab="incoming">Входящие <span class="pill">0</span></button><button class="tab ${state.friendsTab === "outgoing" ? "active" : ""}" data-friends-tab="outgoing">Исходящие <span class="pill">0</span></button></div>
      <div class="empty-state"><div class="empty-state-inner"><div class="empty-symbol friend-symbol ${state.friendsTab}">${icon(empty.icon)}</div><h2>${empty.title}</h2><p>${empty.text}</p></div></div>
    </div>`;
}

function messageKeyForView() {
  return state.view === "channel" ? "channel" : state.view === "favorite" ? "favorite" : "dm";
}

function clearMessageInteraction() {
  state.selectedMessage = null;
  state.replyingTo = null;
}

function renderMessages(list, key) {
  return list.map((message, index) => {
    const selected = state.selectedMessage?.key === key && state.selectedMessage.index === index;
    return `
    <article class="message ${selected ? "selected" : ""} ${message.pinned ? "pinned" : ""}" data-message-index="${index}" data-message-key="${key}" tabindex="0" role="button" aria-label="Выбрать сообщение от ${escapeHTML(message.name)}" aria-pressed="${selected}">
      <span class="avatar ${message.tone}">${message.initials}</span>
      <div class="message-content">
        ${message.reply ? `<div class="message-reply-reference">${icon("reply")}<span>Ответ для <strong>${message.reply.name}</strong></span><q>${message.reply.text}</q></div>` : ""}
        <div class="message-meta"><strong>${message.name}</strong><time>${message.time}</time>${message.pinned ? `<span class="message-pin" title="Закреплено">${icon("pin")}</span>` : ""}</div>
        <p>${message.text}</p>
      </div>
      ${selected ? `<div class="message-actions" role="toolbar" aria-label="Действия с сообщением">
        <button type="button" data-message-action="reply" aria-label="Ответить" title="Ответить">${icon("reply")}</button>
        <button type="button" data-message-action="edit" aria-label="Редактировать" title="Редактировать">${icon("edit")}</button>
        <button type="button" data-message-action="pin" aria-label="${message.pinned ? "Открепить" : "Закрепить"}" title="${message.pinned ? "Открепить" : "Закрепить"}">${icon("pin")}</button>
        <button class="danger" type="button" data-message-action="delete" aria-label="Удалить" title="Удалить">${icon("trash")}</button>
      </div>` : ""}
    </article>`;
  }).join("");
}

function renderChat(type) {
  const isChannel = type === "channel";
  const name = type === "favorite" ? "Избранное" : isChannel ? "Основной" : directMessages.find((item) => item.id === state.selectedDM)?.name || "Беседа";
  const list = messages[type] || [];
  return `
    <div class="chat">
      <div class="channel-intro"><div class="empty-symbol">${icon(isChannel ? "hash" : type === "favorite" ? "bookmark" : "chat")}</div><h2>${isChannel ? "# Основной" : name}</h2><p>${type === "favorite" ? "Ваше личное пространство для сообщений и файлов." : isChannel ? "Здесь начинается история этого канала." : `Начало беседы с пользователем ${name}.`}</p></div>
      <div class="date-line"><span>Сегодня</span></div>
      <div class="messages" id="messages">${renderMessages(list, type)}</div>
    </div>`;
}

function renderMain() {
  const view = $("#mainView");
  if (state.view === "friends") view.innerHTML = renderFriends();
  else if (["favorite", "channel", "dm"].includes(state.view)) view.innerHTML = renderChat(state.view);
  else view.innerHTML = renderLanding();
}

function renderComposer() {
  const composer = $("#composer");
  const show = ["favorite", "channel", "dm"].includes(state.view);
  composer.classList.toggle("hidden", !show);
  if (!show) return;
  const input = $("#messageInput");
  const replyPreview = $("#replyPreview");
  const compact = window.matchMedia("(max-width: 900px)").matches;
  const reply = state.replyingTo;
  composer.classList.toggle("replying", Boolean(reply));
  replyPreview.classList.toggle("active", Boolean(reply));
  replyPreview.innerHTML = reply ? `
    <span class="reply-preview-icon">${icon("reply")}</span>
    <span class="reply-preview-avatar avatar ${reply.tone}">${reply.initials}</span>
    <span class="reply-preview-copy"><span>Ответ для <strong>${reply.name}</strong></span><small>${reply.text}</small></span>
    <button class="reply-preview-close" type="button" data-message-action="cancel-reply" aria-label="Отменить ответ" title="Отменить ответ">${icon("close")}</button>
  ` : "";
  input.placeholder = reply ? `Ответ для ${reply.name}` : state.view === "channel" && !compact ? "Написать сообщение в #Основной" : "Написать сообщение...";
}

function renderDrawer() {
  const app = $("#app");
  const drawer = $("#infoDrawer");
  app.classList.toggle("has-drawer", state.infoOpen);
  if (!state.infoOpen) { drawer.innerHTML = ""; return; }
  const tabs = { media: ["Медиа", "image"], records: ["Записи", "play"], files: ["Файлы", "file"] };
  const [label, iconName] = tabs[state.infoTab];
  drawer.innerHTML = `<div class="drawer-head"><span>Информация</span><button class="icon-button" data-action="info-close" aria-label="Закрыть">${icon("close")}</button></div><div class="drawer-tabs"><button class="${state.infoTab === "media" ? "active" : ""}" data-info-tab="media">Медиа</button><button class="${state.infoTab === "records" ? "active" : ""}" data-info-tab="records">Записи</button><button class="${state.infoTab === "files" ? "active" : ""}" data-info-tab="files">Файлы</button></div><div class="drawer-empty"><div>${icon(iconName)}<p>В разделе «${label}» пока ничего нет.</p></div></div>`;
}

function renderApp() {
  $("#app").classList.toggle("mobile-content", state.view !== "landing");
  $$("[data-space]").forEach((button) => button.classList.toggle("active", button.dataset.space === state.space));
  renderSidebar();
  renderHeader();
  renderMain();
  renderComposer();
  renderDrawer();
  closeMobile();
}

function modalShell(title, subtitle, content, footer = "", wide = false) {
  const mobileBack = wide && state.mobileSettingsView ? `<button class="icon-button mobile-settings-header-back" data-action="mobile-settings-back" aria-label="Назад к разделам">${icon("arrow-left")}</button>` : "";
  return `<section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${title}"><header class="modal-head">${mobileBack}<div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div><button class="icon-button" data-modal-close aria-label="Закрыть">${icon("close")}</button></header>${content}${footer}</section>`;
}

function renderFavoriteInfo() {
  const tabs = {
    media: { label: "Медиа", icon: "image", text: "Фото и видео пока не отправляли" },
    records: { label: "Записи", icon: "play", text: "Голосовых сообщений пока нет" },
    files: { label: "Файлы", icon: "file", text: "Файлы пока не отправляли" },
  };
  const active = tabs[state.favoriteInfoTab] || tabs.media;
  return `<section class="modal favorite-info-modal" role="dialog" aria-modal="true" aria-labelledby="favoriteInfoTitle">
    <button class="icon-button favorite-info-close" data-modal-close aria-label="Закрыть">${icon("close")}</button>
    <div class="favorite-info-profile">
      <div class="favorite-info-symbol">${icon("bookmark")}</div>
      <h2 id="favoriteInfoTitle">Избранное</h2>
    </div>
    <div class="favorite-info-tabs" role="tablist" aria-label="Содержимое Избранного">
      ${Object.entries(tabs).map(([id, tab]) => `<button class="${state.favoriteInfoTab === id ? "active" : ""}" data-favorite-info-tab="${id}" role="tab" aria-selected="${state.favoriteInfoTab === id}">${tab.label}</button>`).join("")}
    </div>
    <div class="favorite-info-empty">
      <div class="favorite-empty-icon ${state.favoriteInfoTab === "media" ? "media" : ""}">${icon(active.icon)}</div>
      <p>${active.text}</p>
    </div>
  </section>`;
}

const permissionGroups = [
  ["Основные", [
    ["view-channel", "Просматривать каналы"],
    ["manage-channel", "Управлять каналом"],
    ["manage-permissions", "Управлять разрешениями"],
    ["manage-webhooks", "Управлять вебхуками"],
  ]],
  ["Текстовые каналы", [
    ["send-messages", "Отправлять сообщения"],
    ["send-threads", "Отправлять сообщения в ветках"],
    ["public-threads", "Создавать публичные ветки"],
    ["private-threads", "Создавать приватные ветки"],
    ["embed-links", "Встраивать ссылки"],
    ["attach-files", "Прикреплять файлы"],
    ["add-reactions", "Добавлять реакции"],
    ["external-emoji", "Использовать внешние эмодзи"],
    ["mention-everyone", "Упоминать @everyone"],
  ]],
  ["Голосовые каналы", [
    ["connect", "Подключаться"],
    ["speak", "Говорить"],
    ["video", "Включать видео"],
  ]],
];

function renderPermissionMatrix(scope = "channel") {
  const subject = scope === "role" ? state.selectedRole : state.selectedPermissionSubject;
  return `<div class="permission-matrix" data-permission-scope="${scope}">
    ${permissionGroups.map(([group, permissions]) => `<section class="permission-group"><h3>${group}</h3>${permissions.map(([id, label]) => {
      const key = `${scope}:${subject}:${id}`;
      const value = state.permissionStates[key] || "neutral";
      return `<div class="permission-row"><span>${label}</span><div class="tri-state" role="group" aria-label="${label}">
        <button class="${value === "allow" ? "selected allow" : ""}" data-permission-key="${key}" data-permission-value="allow" aria-label="Разрешить">${icon("plus")}</button>
        <button class="${value === "neutral" ? "selected neutral" : ""}" data-permission-key="${key}" data-permission-value="neutral" aria-label="По умолчанию">${icon("slash")}</button>
        <button class="${value === "deny" ? "selected deny" : ""}" data-permission-key="${key}" data-permission-value="deny" aria-label="Запретить">${icon("minus")}</button>
      </div></div>`;
    }).join("")}</section>`).join("")}
  </div>`;
}

function renderUserSettings() {
  const tabs = [
    ["profile", "users", "Профиль"],
    ["voice", "mic", "Голос и видео"],
    ["devices", "monitor", "Устройства"],
  ];
  const activeTitle = tabs.find(([id]) => id === state.userSettingsTab)?.[2] || "Профиль";
  const nav = `<nav class="settings-nav">${tabs.map(([id, iconName, label]) => `<button class="${state.userSettingsTab === id ? "active" : ""}" data-user-settings-tab="${id}">${icon(iconName)}${label}</button>`).join("")}<button class="delete" data-confirm="logout">${icon("log-out")}Выйти</button></nav>`;
  return modalShell(state.mobileSettingsView ? activeTitle : "Настройки пользователя", state.mobileSettingsView ? "" : "Профиль, голос и активные устройства.", `<div class="settings-shell ${state.mobileSettingsView ? "mobile-detail" : "mobile-menu"}">${nav}<section class="settings-view" id="settingsView">${renderUserSettingsView()}</section></div>`, "", true);
}

function renderUserSettingsView() {
  if (state.userSettingsTab === "voice") {
    return `<h1>Голос и видео</h1><div class="settings-card"><h2>Устройства</h2><div class="field"><label>Устройство ввода (микрофон)</label><select class="select"><option>Устройство audioinput</option></select></div><div class="range-row"><label>Громкость микрофона</label><input type="range" min="0" max="200" value="100" data-output="micRange" /><output id="micRange">100%</output></div><div class="field"><label>Устройство вывода</label><select class="select"><option>Устройство audiooutput</option></select></div><div class="range-row"><label>Громкость вывода</label><input type="range" min="0" max="200" value="100" data-output="soundRange" /><output id="soundRange">100%</output></div></div><div class="settings-card"><h2>Режим голосовой активации</h2><div class="type-switch"><button class="active" type="button" data-type-button>Голосовая активация</button><button type="button" data-type-button>Режим рации</button></div><div class="range-row"><label>Чувствительность</label><input type="range" min="-60" max="0" value="-30" data-output="sensitivity" /><output id="sensitivity">-30 dB</output></div></div><div class="settings-card"><h2>Тестирование</h2><button class="secondary" data-toast="Тест микрофона запущен">Тест микрофона</button> <button class="secondary" data-toast="Воспроизводим тестовый звук">Воспроизвести</button></div>`;
  }

  if (state.userSettingsTab === "devices") {
    return `<h1>Устройства</h1><div class="page-title"><p>Устройства, на которых выполнен вход в аккаунт.</p></div><div class="settings-card"><div class="device-row"><span class="row-icon">${icon("monitor")}</span><span class="row-copy"><strong>Chrome · Windows</strong><small>Активность: сейчас</small></span><span class="current">Текущий</span></div><div class="device-row"><span class="row-icon">${icon("monitor")}</span><span class="row-copy"><strong>Safari · iOS</strong><small>Последняя активность сегодня</small></span><button class="secondary session-end" data-toast="Завершение сеанса требует подтверждения">Завершить</button></div><div class="device-row"><span class="row-icon">${icon("monitor")}</span><span class="row-copy"><strong>Safari · macOS</strong><small>Последняя активность вчера</small></span><button class="secondary session-end" data-toast="Завершение сеанса требует подтверждения">Завершить</button></div></div><div class="settings-actions"><button class="danger" data-toast="Завершение остальных сеансов требует подтверждения">Завершить остальные</button></div>`;
  }

  return `<h1>Профиль</h1><div class="settings-card avatar-upload-card"><button class="avatar-upload-preview" data-toast="Выберите JPG или PNG" aria-label="Загрузить изображение профиля">${icon("camera")}<span class="avatar-camera-badge">${icon("camera")}</span></button><div class="avatar-upload-copy"><h2>Аватар</h2><button class="avatar-upload-link" data-toast="Выберите JPG или PNG">Загрузить изображение</button><p class="hint">JPG или PNG. Максимум 5MB.</p></div></div><form id="userProfileForm"><div class="settings-card"><h2>Информация профиля</h2><div class="field"><label>Имя пользователя</label><input class="input" value="ArCode" /></div><div class="field"><label>Отображаемое имя</label><input class="input" value="ArCode" /></div><div class="settings-actions"><button type="reset" class="secondary">Сбросить</button><button class="primary" type="submit">Сохранить изменения</button></div></div></form>`;
}

function renderServerSettings() {
  const tabs = [
    ["profile", "users", "Профиль сервера"], ["privacy", "shield", "Приватность"], ["roles", "role", "Роли"], ["members", "users", "Участники"], ["invites", "link", "Приглашения"], ["applications", "user-check", "Заявки"], ["audit", "list", "Журнал аудита"],
  ];
  const activeTitle = tabs.find(([id]) => id === state.serverSettingsTab)?.[2] || "Профиль сервера";
  const nav = `<nav class="settings-nav">${tabs.map(([id, iconName, label]) => `<button class="${state.serverSettingsTab === id ? "active" : ""}" data-server-settings-tab="${id}">${icon(iconName)}${label}</button>`).join("")}<button class="delete" data-confirm="delete-server">${icon("trash")}Удалить сервер</button></nav>`;
  return modalShell(state.mobileSettingsView ? activeTitle : "Настройки сервера", state.mobileSettingsView ? "" : "Управление сервером «Simty Upgrade».", `<div class="settings-shell ${state.mobileSettingsView ? "mobile-detail" : "mobile-menu"}">${nav}<section class="settings-view ${state.serverSettingsTab === "roles" ? "roles-settings-view" : ""}">${renderServerSettingsView()}</section></div>`, "", true);
}

function renderRoleManager() {
  const roles = [
    ["everyone", state.roleNames.everyone || "@everyone", 0],
    ...(state.roleCreated ? [["new-role", state.roleNames["new-role"] || "Новая роль", state.roleMemberAdded ? 1 : 0]] : []),
  ];
  if (!roles.some(([id]) => id === state.selectedRole)) state.selectedRole = "everyone";
  const roleName = state.roleNames[state.selectedRole] || (state.selectedRole === "everyone" ? "@everyone" : "Новая роль");
  const tabs = [["general", "Основное"], ["permissions", "Права"], ...(state.selectedRole === "everyone" ? [] : [["members", "Участники"]])];

  let content = "";
  if (state.roleTab === "permissions") {
    content = `<div class="role-pane role-permission-pane"><div class="role-pane-title"><h3>Права роли</h3><p>Настройте возможности участников с ролью ${escapeHTML(roleName)}.</p></div>${renderPermissionMatrix("role")}</div>`;
  } else if (state.roleTab === "members") {
    content = `<div class="role-pane role-members-pane"><div class="role-members-title"><h3>Участники (${state.roleMemberAdded ? 1 : 0})</h3></div>${state.roleMemberPicker ? `<div class="role-member-picker"><input class="input" placeholder="Поиск участников..." autofocus /><button class="role-member-candidate" data-action="assign-role-member"><span class="avatar">A</span><span class="row-copy"><strong>ArCode</strong><small>@ArCode</small></span>${icon("plus")}</button></div>` : `<button class="role-add-member" data-action="role-member-picker">${icon("plus")}Добавить участника</button>`}${state.roleMemberAdded ? `<div class="role-member-assigned"><span class="avatar">A</span><span class="row-copy"><strong>ArCode</strong><small>@ArCode</small></span><button class="icon-button" data-action="remove-role-member" aria-label="Убрать участника из роли">${icon("close")}</button></div>` : `<div class="role-member-empty"><span>${icon("users")}</span><strong>Нет участников</strong><small>Добавьте участника, чтобы назначить ему эту роль.</small></div>`}</div>`;
  } else {
    content = `<div class="role-pane role-general-pane"><div class="field"><label for="roleNameInput">Название</label><input class="input" id="roleNameInput" value="${escapeHTML(roleName)}" /></div>${state.selectedRole !== "everyone" ? `<button class="role-delete-button" data-confirm="delete-role">${icon("trash")}Удалить роль</button>` : ""}</div>`;
  }

  return `<div class="role-manager"><aside class="role-list-pane"><button class="primary create-role-button" data-action="create-role">${icon("plus")}Создать роль</button><div class="role-list">${roles.map(([id, name, count]) => `<button class="role-item ${state.selectedRole === id ? "active" : ""}" data-role-id="${id}"><span>${escapeHTML(name)}</span><small>${count}</small></button>`).join("")}</div></aside><section class="role-editor-pane"><div class="role-editor-tabs">${tabs.map(([id, label]) => `<button class="${state.roleTab === id ? "active" : ""}" data-role-tab="${id}">${label}</button>`).join("")}</div>${content}<div class="sticky-actions role-sticky-actions"><button class="secondary" data-action="reset-role-editor">Сбросить</button><button class="primary" data-action="save-role">${icon("check")}Сохранить</button></div></section></div>`;
}

function renderServerSettingsView() {
  if (state.serverSettingsTab === "privacy") return `<h1>Приватность сервера</h1><div class="settings-card"><h2>Настройки доступа</h2><div class="privacy-options"><button class="choice selected" data-choice>${icon("lock")}<span><strong>Приватный</strong><small>Доступ только по приглашению</small></span></button><button class="choice" data-choice>${icon("user-check")}<span><strong>По заявке</strong><small>Вход по одобрению заявки</small></span></button><button class="choice" data-choice>${icon("globe")}<span><strong>Публичный</strong><small>Любой может присоединиться</small></span></button></div><div class="settings-actions"><button class="secondary">Сбросить</button><button class="primary">Сохранить изменения</button></div></div>`;
  if (state.serverSettingsTab === "roles") return renderRoleManager();
  if (state.serverSettingsTab === "members") return `<div class="member-heading"><div><h1>Участники</h1><p class="hint">1 участник</p></div><button class="icon-button refresh-button" data-action="refresh-members" aria-label="Обновить участников">${icon("refresh")}</button></div><div class="member-list"><div class="member-entry"><span class="avatar">A</span><span class="row-copy"><strong>ArCode</strong><small>@ArCode</small></span><button class="member-actions-button" data-action="member-actions" aria-label="Действия с участником" aria-expanded="${state.memberActionMenu}">${icon("more")}</button>${state.memberActionMenu ? `<div class="member-actions-menu" role="menu"><button data-confirm="kick-member">${icon("user-minus")}<span>Исключить</span></button><button data-confirm="ban-member">${icon("ban")}<span>Заблокировать</span></button></div>` : ""}</div></div>`;
  if (state.serverSettingsTab === "invites") return `<div class="page-title"><h1>Приглашения</h1><p>Активные ссылки-приглашения сервера.</p></div><button class="primary" data-modal="invite">Создать</button><div class="empty-state"><div class="empty-state-inner"><div class="empty-symbol">${icon("link")}</div><h2>Нет приглашений</h2><p>Создайте первое приглашение, чтобы пригласить друзей на этот сервер.</p></div></div>`;
  if (state.serverSettingsTab === "applications") {
    const filters = [["all", "Все"], ["pending", "Ожидают"], ["approved", "Одобрено"], ["rejected", "Отклонено"]];
    const emptyTitles = { all: "Нет заявок", pending: "Нет заявок в ожидании", approved: "Нет одобренных заявок", rejected: "Нет отклонённых заявок" };
    const emptyIcons = { all: "users", pending: "clock", approved: "user-check", rejected: "user-x" };
    return `<div class="page-title application-head"><div><h1>Заявки</h1><p>Управляйте запросами на вступление в сервер.</p></div><button class="icon-button refresh-button" data-action="refresh-applications" aria-label="Обновить заявки">${icon("refresh")}</button></div><div class="application-toolbar">${filters.map(([id, label]) => `<button class="filter-chip ${state.applicationFilter === id ? "active" : ""}" data-application-filter="${id}">${label}<span>0</span></button>`).join("")}</div><div class="empty-state application-empty"><div class="empty-state-inner"><div class="empty-symbol application-symbol ${state.applicationFilter}">${icon(emptyIcons[state.applicationFilter])}</div><h2>${emptyTitles[state.applicationFilter]}</h2><p>Заявки на вступление появятся здесь.</p></div></div>`;
  }
  if (state.serverSettingsTab === "audit") {
    const auditFilters = [["all", "search", "Все"], ["permissions", "shield", "Разрешения"], ["messages", "chat", "Сообщения"], ["channels", "hash", "Каналы"], ["server", "server", "Сервер"], ["members", "users", "Участники"], ["calls", "phone", "Звонки"], ["files", "file", "Файлы"]];
    const selectedAudit = auditFilters.find(([id]) => id === state.auditFilter) || auditFilters[0];
    return `<div class="audit-heading"><div><h1>Журнал аудита</h1><strong>0 событий</strong></div><div class="audit-filter"><button class="audit-filter-button ${state.auditMenu ? "open" : ""}" data-action="audit-menu" aria-expanded="${state.auditMenu}">${icon(selectedAudit[1])}<span>${selectedAudit[2]}</span>${icon("chevron")}</button>${state.auditMenu ? `<div class="audit-dropdown" role="menu" aria-label="Фильтр журнала">${auditFilters.map(([id, iconName, label]) => `<button class="${state.auditFilter === id ? "selected" : ""}" data-audit-filter="${id}">${icon(iconName)}<span>${label}</span>${state.auditFilter === id ? icon("check") : ""}</button>`).join("")}</div>` : ""}</div></div><div class="audit-error">Не удалось загрузить журнал аудита</div><div class="empty-state audit-empty"><div class="empty-state-inner"><div class="empty-symbol">${icon("shield")}</div><h2>Нет записей в журнале</h2><p>События выбранной категории появятся здесь.</p></div></div>`;
  }
  return `<h1>Профиль сервера</h1><div class="settings-card avatar-upload-card"><button class="avatar-upload-preview" data-toast="Выберите JPG или PNG" aria-label="Загрузить изображение сервера">${icon("camera")}<span class="avatar-camera-badge">${icon("camera")}</span></button><div class="avatar-upload-copy"><h2>Аватар</h2><button class="avatar-upload-link" data-toast="Выберите JPG или PNG">Загрузить изображение</button><p class="hint">JPG или PNG. Максимум 5MB.</p></div></div><form id="serverProfileForm"><div class="settings-card"><h2>Информация о сервере</h2><div class="field"><label>Имя сервера</label><input class="input" value="Simty Upgrade" /></div><div class="field"><label>Описание</label><textarea class="textarea" placeholder="Введите описание сервера"></textarea><p class="hint">Описание сервера, которое видят участники.</p></div><div class="settings-actions"><button class="secondary" type="reset">Сбросить</button><button class="primary" type="submit">Сохранить изменения</button></div></div></form>`;
}

function renderChannelSettings() {
  const tabs = [["info", "hash", "Информация"], ["permissions", "shield", "Разрешения"]];
  const nav = `<nav class="settings-nav">${tabs.map(([id, iconName, label]) => `<button class="${state.channelSettingsTab === id ? "active" : ""}" data-channel-settings-tab="${id}">${icon(iconName)}${label}</button>`).join("")}<button class="delete" data-confirm="delete-channel">${icon("trash")}Удалить канал</button></nav>`;
  const subjects = [
    ["everyone", "role", "@everyone", "Роль сервера"],
  ];
  if (state.customPermissionRole) subjects.push(["new-role", "role", state.roleNames["new-role"] || "Новая роль", "Роль сервера"]);
  const selected = subjects.find(([id]) => id === state.selectedPermissionSubject) || subjects[0];
  const view = state.channelSettingsTab === "permissions" ? `<div class="channel-permissions"><aside class="permission-subjects"><div class="permission-add-wrap"><button class="primary add-subject" data-action="permission-add" aria-expanded="${state.permissionAddMenu}">${icon("plus")}Добавить</button>${state.permissionAddMenu ? `<div class="permission-add-menu" role="menu"><span>Роли</span><button data-action="add-new-role">${icon("role")}<strong>${escapeHTML(state.roleNames["new-role"] || "Новая роль")}</strong></button></div>` : ""}</div><div class="subject-list">${subjects.map(([id, iconName, label, caption]) => `<button class="subject-row ${state.selectedPermissionSubject === id ? "active" : ""}" data-permission-subject="${id}"><span class="row-icon">${icon(iconName)}</span><span><strong>${label}</strong><small>${caption}</small></span></button>`).join("")}</div></aside><section class="permission-detail"><div class="permission-detail-head"><div><span class="eyebrow">Разрешения</span><h1>${selected[2]}</h1><p>${selected[3]} · канал #Основной</p></div><span class="subject-badge">${icon(selected[1])}</span></div>${renderPermissionMatrix("channel")}<div class="sticky-actions"><button class="secondary" data-toast="Изменения разрешений сброшены">Сбросить</button><button class="primary" data-toast="Разрешения канала сохранены">${icon("check")}Сохранить</button></div></section></div>` : `<h1>Информация о канале</h1><form id="channelForm"><div class="settings-card"><div class="field"><label>Имя канала</label><input class="input" value="Основной" /></div><div class="field"><label>Описание</label><textarea class="textarea" placeholder="Введите описание канала"></textarea><p class="hint">Описание канала, которое видят участники.</p></div><div class="settings-actions"><button class="secondary" type="reset">Сбросить</button><button class="primary" type="submit">Сохранить изменения</button></div></div></form>`;
  const activeTitle = tabs.find(([id]) => id === state.channelSettingsTab)?.[2] || "Информация";
  return modalShell(state.mobileSettingsView ? activeTitle : "Настройки канала", state.mobileSettingsView ? "" : "Канал «Основной».", `<div class="settings-shell ${state.mobileSettingsView ? "mobile-detail" : "mobile-menu"}">${nav}<section class="settings-view ${state.channelSettingsTab === "permissions" ? "permission-settings-view" : ""}">${view}</section></div>`, "", true);
}

function renderConfirm(type) {
  const confirms = {
    "delete-channel": {
      title: "Удалить канал?",
      text: "Вы уверены, что хотите удалить канал <strong>#Основной</strong>? Это действие необратимо.",
      button: "Удалить",
    },
    "delete-server": {
      title: "Удалить сервер?",
      text: "Вы уверены, что хотите удалить сервер <strong>«Simty Upgrade»</strong>? Все каналы и сообщения будут потеряны. Это действие необратимо.",
      button: "Удалить сервер",
    },
    logout: {
      title: "Выйти из аккаунта?",
      text: "Вы точно хотите выйти? Для возвращения потребуется снова войти в аккаунт.",
      button: "Выйти",
    },
    "kick-member": {
      title: "Исключить участника?",
      text: "Пользователь <strong>ArCode</strong> будет исключён с сервера «Simty Upgrade». Он сможет вернуться по новому приглашению.",
      button: "Исключить",
    },
    "ban-member": {
      title: "Заблокировать участника?",
      text: "Пользователь <strong>ArCode</strong> будет заблокирован и не сможет повторно присоединиться к серверу.",
      button: "Заблокировать",
    },
    "delete-role": {
      title: "Удалить роль?",
      text: `Роль <strong>${escapeHTML(state.roleNames["new-role"] || "Новая роль")}</strong> будет удалена у всех участников. Это действие необратимо.`,
      button: "Удалить роль",
    },
  };
  const item = confirms[type];
  return `<section class="modal confirm-modal" role="alertdialog" aria-modal="true" aria-label="${item.title}"><button class="confirm-close icon-button" data-modal-close aria-label="Закрыть">${icon("close")}</button><div class="confirm-body"><div class="warning-symbol">${icon("warning")}</div><h2>${item.title}</h2><p>${item.text}</p></div><footer class="confirm-actions"><button class="secondary" data-modal-close>Отмена</button><button class="danger" data-confirm-submit="${type}">${item.button}</button></footer></section>`;
}

function renderModal() {
  const root = $("#modalRoot");
  if (!state.modal) { root.classList.remove("open", "confirm-open"); root.innerHTML = ""; return; }
  root.classList.add("open");
  root.classList.toggle("confirm-open", state.modal.startsWith("confirm:"));

  if (state.modal === "favorite-info") {
    root.innerHTML = renderFavoriteInfo();
  } else if (state.modal === "new-chat") {
    root.innerHTML = modalShell("Начать беседу", "Создайте личную переписку с другом.", `<form id="newChatForm"><div class="modal-body"><div class="field"><label>Имя пользователя</label><input class="input" id="newChatName" placeholder="Введите имя пользователя вашего друга" autofocus /></div></div><footer class="modal-foot"><button class="secondary" type="button" data-modal-close>Отмена</button><button class="primary" type="submit">Создать ЛС</button></footer></form>`);
  } else if (state.modal === "create-server") {
    root.innerHTML = modalShell("Создать сервер", "Выберите тип доступа и название.", `<form id="createServerForm"><div class="modal-body"><span class="eyebrow">Тип доступа</span><div class="choice-grid"><button class="choice selected" type="button" data-choice>${icon("lock")}<span><strong>Приватный</strong><small>Доступ только по приглашению</small></span></button><button class="choice" type="button" data-choice>${icon("user-check")}<span><strong>По заявке</strong><small>Виден всем, вход по одобрению заявки</small></span></button><button class="choice" type="button" data-choice>${icon("globe")}<span><strong>Публичный</strong><small>Любой может присоединиться</small></span></button></div><div class="field"><label>Название</label><input class="input" id="serverName" placeholder="Сообщество ArCode" required /></div></div><footer class="modal-foot"><button class="secondary" type="button" data-modal-close>Отмена</button><button class="primary" type="submit">Создать</button></footer></form>`);
  } else if (state.modal === "invite") {
    root.innerHTML = modalShell("Пригласить друзей", "Приглашение на сервер «Simty Upgrade».", `<div class="modal-body"><div class="invite-search">${icon("search")}<input class="input" placeholder="Поиск среди друзей" /></div><div class="invite-empty">У вас пока нет друзей</div><div class="field"><label>Или поделитесь ссылкой</label><div class="invite-link"><input class="input" value="Ссылка создастся при копировании" readonly /><button class="primary" data-toast="Ссылка приглашения скопирована">${icon("copy")}Копировать</button></div></div></div>`);
  } else if (state.modal === "create-channel") {
    root.innerHTML = modalShell("Создать канал", "Добавьте текстовый или голосовой канал.", `<form id="createChannelForm"><div class="modal-body"><span class="eyebrow">Тип</span><div class="type-switch"><button class="active" type="button" data-type-button>${icon("hash")}Текстовый</button><button type="button" data-type-button>${icon("volume")}Голосовой</button></div><div class="field"><label>Название</label><input class="input" required placeholder="Новый канал" /></div></div><footer class="modal-foot"><button class="secondary" type="button" data-modal-close>Отмена</button><button class="primary" type="submit">Создать</button></footer></form>`);
  } else if (state.modal === "create-category") {
    root.innerHTML = modalShell("Создать категорию", "Категория поможет сгруппировать каналы.", `<form id="createCategoryForm"><div class="modal-body"><div class="field"><label>Название</label><input class="input" required placeholder="Новая категория" /></div></div><footer class="modal-foot"><button class="secondary" type="button" data-modal-close>Отмена</button><button class="primary" type="submit">Создать</button></footer></form>`);
  } else if (state.modal === "user-settings") root.innerHTML = renderUserSettings();
  else if (state.modal === "server-settings") root.innerHTML = renderServerSettings();
  else if (state.modal === "channel-settings") root.innerHTML = renderChannelSettings();
  else if (state.modal.startsWith("confirm:")) root.innerHTML = renderConfirm(state.modal.replace("confirm:", ""));

  requestAnimationFrame(() => $("[autofocus]", root)?.focus());
}

function openModal(name) {
  state.serverMenu = false;
  state.notificationMenu = false;
  state.notificationMuteMenu = false;
  if (["user-settings", "server-settings", "channel-settings"].includes(name)) state.mobileSettingsView = false;
  if (state.modal && state.modal !== name) state.modalParent = state.modal;
  state.modal = name;
  renderSidebar();
  renderHeader();
  renderModal();
}

function openConfirm(type) {
  state.modalParent = state.modal;
  state.modal = `confirm:${type}`;
  renderModal();
}

function closeModal() {
  state.auditMenu = false;
  state.memberActionMenu = false;
  state.permissionAddMenu = false;
  if (state.modalParent) {
    state.modal = state.modalParent;
    state.modalParent = null;
  } else {
    state.modal = null;
    state.mobileSettingsView = false;
  }
  renderModal();
}

document.addEventListener("click", (event) => {
  const space = event.target.closest("[data-space]");
  if (space) {
    clearMessageInteraction();
    state.space = space.dataset.space;
    state.view = "landing";
    state.selectedChannel = null;
    state.infoOpen = false;
    state.serverMenu = false;
    state.notificationMenu = false;
    state.notificationMuteMenu = false;
    renderApp();
    return;
  }

  const view = event.target.closest("[data-view]");
  if (view) {
    clearMessageInteraction();
    state.space = "home";
    state.view = view.dataset.view;
    state.infoOpen = false;
    state.notificationMenu = false;
    state.notificationMuteMenu = false;
    renderApp();
    return;
  }

  const dm = event.target.closest("[data-dm]");
  if (dm) {
    clearMessageInteraction();
    state.space = "home";
    state.view = "dm";
    state.selectedDM = dm.dataset.dm;
    state.notificationMenu = false;
    state.notificationMuteMenu = false;
    renderApp();
    return;
  }

  const channel = event.target.closest("[data-channel]");
  if (channel && !event.target.closest("[data-modal]")) {
    clearMessageInteraction();
    state.space = "server";
    state.view = "channel";
    state.selectedChannel = channel.dataset.channel;
    state.notificationMenu = false;
    state.notificationMuteMenu = false;
    renderApp();
    return;
  }

  const messageActionButton = event.target.closest("[data-message-action]");
  if (messageActionButton) {
    const messageAction = messageActionButton.dataset.messageAction;
    if (messageAction === "cancel-reply") {
      state.replyingTo = null;
      renderComposer();
      $("#messageInput").focus();
      return;
    }

    const messageElement = messageActionButton.closest("[data-message-index]");
    const key = messageElement?.dataset.messageKey || messageKeyForView();
    const index = Number(messageElement?.dataset.messageIndex);
    const message = messages[key]?.[index];
    if (!message) return;

    if (messageAction === "reply") {
      state.replyingTo = { key, index, name: message.name, initials: message.initials, tone: message.tone, text: message.text };
      state.selectedMessage = null;
      renderMain();
      renderComposer();
      requestAnimationFrame(() => $("#messageInput").focus());
      return;
    }
    if (messageAction === "edit") {
      showToast(message.name === "ArCode" ? "Редактирование будет доступно в следующей версии" : "Можно редактировать только свои сообщения");
      return;
    }
    if (messageAction === "pin") {
      message.pinned = !message.pinned;
      renderMain();
      showToast(message.pinned ? "Сообщение закреплено" : "Сообщение откреплено");
      return;
    }
    if (messageAction === "delete") {
      messages[key].splice(index, 1);
      state.selectedMessage = null;
      if (state.replyingTo?.key === key && state.replyingTo.index === index) state.replyingTo = null;
      renderMain();
      renderComposer();
      showToast("Сообщение удалено");
      return;
    }
  }

  const messageElement = event.target.closest("[data-message-index]");
  if (messageElement) {
    const selected = { key: messageElement.dataset.messageKey, index: Number(messageElement.dataset.messageIndex) };
    const alreadySelected = state.selectedMessage?.key === selected.key && state.selectedMessage.index === selected.index;
    state.selectedMessage = alreadySelected ? null : selected;
    renderMain();
    return;
  }

  const modal = event.target.closest("[data-modal]");
  if (modal) { event.stopPropagation(); openModal(modal.dataset.modal); return; }
  if (event.target.closest("[data-modal-close]") || event.target === $("#modalRoot")) { closeModal(); return; }

  const confirm = event.target.closest("[data-confirm]");
  if (confirm) { state.memberActionMenu = false; openConfirm(confirm.dataset.confirm); return; }

  const confirmSubmit = event.target.closest("[data-confirm-submit]");
  if (confirmSubmit) {
    const confirmType = confirmSubmit.dataset.confirmSubmit;
    if (confirmType === "delete-role") {
      state.roleCreated = false;
      state.customPermissionRole = false;
      state.roleMemberAdded = false;
      state.roleMemberPicker = false;
      state.roleNames["new-role"] = "Новая роль";
      state.selectedRole = "everyone";
      state.roleTab = "general";
      state.modal = state.modalParent || "server-settings";
      state.modalParent = null;
      renderModal();
      showToast("Роль удалена в прототипе");
      return;
    }
    const labels = { "delete-channel": "Удаление канала подтверждено в прототипе", "delete-server": "Удаление сервера подтверждено в прототипе", logout: "Выход подтверждён в прототипе", "kick-member": "Участник исключён в прототипе", "ban-member": "Участник заблокирован в прототипе" };
    state.modal = null;
    state.modalParent = null;
    renderModal();
    showToast(labels[confirmSubmit.dataset.confirmSubmit]);
    return;
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "server-menu") { state.serverMenu = !state.serverMenu; renderSidebar(); return; }
  if (action === "notifications") {
    state.notificationMenu = !state.notificationMenu;
    if (!state.notificationMenu) state.notificationMuteMenu = false;
    renderHeader();
    return;
  }
  if (action === "notification-temporary") {
    state.notificationMuteMenu = !state.notificationMuteMenu;
    renderHeader();
    return;
  }
  if (action === "audit-menu") {
    state.auditMenu = !state.auditMenu;
    renderModal();
    return;
  }
  if (action === "member-actions") {
    state.memberActionMenu = !state.memberActionMenu;
    renderModal();
    return;
  }
  if (action === "permission-add") {
    state.permissionAddMenu = !state.permissionAddMenu;
    renderModal();
    return;
  }
  if (action === "add-new-role") {
    state.roleCreated = true;
    state.customPermissionRole = true;
    state.selectedPermissionSubject = "new-role";
    state.permissionAddMenu = false;
    renderModal();
    showToast("Роль «Новая роль» добавлена в разрешения канала");
    return;
  }
  if (action === "info") { state.infoOpen = !state.infoOpen; renderDrawer(); return; }
  if (action === "info-close") { state.infoOpen = false; renderDrawer(); return; }
  if (action === "mobile-menu") { $("#app").classList.add("mobile-open"); return; }
  if (action === "mobile-back") {
    clearMessageInteraction();
    state.view = "landing";
    state.infoOpen = false;
    state.notificationMenu = false;
    state.notificationMuteMenu = false;
    renderApp();
    return;
  }
  if (action === "mobile-settings-back") {
    state.mobileSettingsView = false;
    renderModal();
    return;
  }
  if (action === "stickers") { $("#stickerPopover").classList.toggle("open"); return; }
  if (action === "create-role") {
    state.roleCreated = true;
    state.selectedRole = "new-role";
    state.roleTab = "general";
    state.roleMemberPicker = false;
    renderModal();
    showToast("Роль «Новая роль» создана в прототипе");
    return;
  }
  if (action === "role-member-picker") {
    state.roleMemberPicker = true;
    renderModal();
    return;
  }
  if (action === "assign-role-member") {
    state.roleMemberAdded = true;
    state.roleMemberPicker = false;
    renderModal();
    showToast(`ArCode добавлен в роль «${state.roleNames[state.selectedRole]}»`);
    return;
  }
  if (action === "remove-role-member") {
    state.roleMemberAdded = false;
    renderModal();
    showToast(`ArCode удалён из роли «${state.roleNames[state.selectedRole]}»`);
    return;
  }
  if (action === "save-role") {
    const input = $("#roleNameInput");
    if (input) state.roleNames[state.selectedRole] = input.value.trim() || state.roleNames[state.selectedRole];
    renderModal();
    showToast("Изменения роли сохранены");
    return;
  }
  if (action === "reset-role-editor") {
    if (state.roleTab === "permissions") {
      Object.keys(state.permissionStates).filter((key) => key.startsWith(`role:${state.selectedRole}:`)).forEach((key) => delete state.permissionStates[key]);
      renderModal();
    } else if (state.roleTab === "general") {
      const input = $("#roleNameInput");
      if (input) input.value = state.roleNames[state.selectedRole];
    }
    showToast("Изменения роли сброшены");
    return;
  }
  if (action === "refresh-applications") {
    const button = event.target.closest("[data-action='refresh-applications']");
    button.classList.add("spinning");
    setTimeout(() => button.classList.remove("spinning"), 520);
    showToast("Список заявок обновлён");
    return;
  }
  if (action === "refresh-members") {
    const button = event.target.closest("[data-action='refresh-members']");
    button.classList.add("spinning");
    setTimeout(() => button.classList.remove("spinning"), 520);
    showToast("Список участников обновлён");
    return;
  }
  if (action === "reset-role-permissions") {
    Object.keys(state.permissionStates).filter((key) => key.startsWith("role:")).forEach((key) => delete state.permissionStates[key]);
    renderModal();
    showToast("Права роли сброшены");
    return;
  }
  if (action === "voice") {
    const button = event.target.closest("[data-action='voice']");
    button.classList.toggle("recording");
    showToast(button.classList.contains("recording") ? "Запись голосового сообщения" : "Запись остановлена");
    return;
  }

  const infoTab = event.target.closest("[data-info-tab]");
  if (infoTab) { state.infoTab = infoTab.dataset.infoTab; renderDrawer(); return; }

  const favoriteInfoTab = event.target.closest("[data-favorite-info-tab]");
  if (favoriteInfoTab) { state.favoriteInfoTab = favoriteInfoTab.dataset.favoriteInfoTab; renderModal(); return; }

  const friendTab = event.target.closest("[data-friends-tab]");
  if (friendTab) { state.friendsTab = friendTab.dataset.friendsTab; renderMain(); return; }

  const userTab = event.target.closest("[data-user-settings-tab]");
  if (userTab) { state.userSettingsTab = userTab.dataset.userSettingsTab; state.mobileSettingsView = window.matchMedia("(max-width: 767px)").matches; renderModal(); return; }

  const serverTab = event.target.closest("[data-server-settings-tab]");
  if (serverTab) { state.serverSettingsTab = serverTab.dataset.serverSettingsTab; state.auditMenu = false; state.memberActionMenu = false; state.mobileSettingsView = window.matchMedia("(max-width: 767px)").matches; renderModal(); return; }

  const channelTab = event.target.closest("[data-channel-settings-tab]");
  if (channelTab) { state.channelSettingsTab = channelTab.dataset.channelSettingsTab; state.permissionAddMenu = false; state.mobileSettingsView = window.matchMedia("(max-width: 767px)").matches; renderModal(); return; }

  const roleTab = event.target.closest("[data-role-tab]");
  if (roleTab) { state.roleTab = roleTab.dataset.roleTab; state.roleMemberPicker = false; renderModal(); return; }

  const roleItem = event.target.closest("[data-role-id]");
  if (roleItem) { state.selectedRole = roleItem.dataset.roleId; state.roleTab = "general"; state.roleMemberPicker = false; renderModal(); return; }

  const applicationFilter = event.target.closest("[data-application-filter]");
  if (applicationFilter) { state.applicationFilter = applicationFilter.dataset.applicationFilter; renderModal(); return; }

  const notificationMode = event.target.closest("[data-notification-mode]");
  if (notificationMode) {
    state.notificationMode = notificationMode.dataset.notificationMode;
    state.notificationMenu = false;
    state.notificationMuteMenu = false;
    renderHeader();
    showToast(state.notificationMode === "all" ? "Уведомления: все сообщения" : state.notificationMode === "mentions" ? "Уведомления: только упоминания" : "Уведомления отключены");
    return;
  }

  const notificationDuration = event.target.closest("[data-notification-duration]");
  if (notificationDuration) {
    state.notificationMode = "temporary";
    state.notificationMenu = false;
    state.notificationMuteMenu = false;
    renderHeader();
    showToast(`Уведомления отключены на ${notificationDuration.dataset.notificationDuration}`);
    return;
  }

  const auditFilter = event.target.closest("[data-audit-filter]");
  if (auditFilter) {
    state.auditFilter = auditFilter.dataset.auditFilter;
    state.auditMenu = false;
    renderModal();
    showToast("Фильтр журнала обновлён");
    return;
  }

  const permissionSubject = event.target.closest("[data-permission-subject]");
  if (permissionSubject) { state.selectedPermissionSubject = permissionSubject.dataset.permissionSubject; state.permissionAddMenu = false; renderModal(); return; }

  const permissionButton = event.target.closest("[data-permission-key]");
  if (permissionButton) {
    state.permissionStates[permissionButton.dataset.permissionKey] = permissionButton.dataset.permissionValue;
    renderModal();
    return;
  }

  const choice = event.target.closest("[data-choice]");
  if (choice) { $$('[data-choice]').forEach((item) => item.classList.toggle("selected", item === choice)); return; }

  const typeButton = event.target.closest("[data-type-button]");
  if (typeButton) { $$('[data-type-button]').forEach((item) => item.classList.toggle("active", item === typeButton)); return; }

  const stateButton = event.target.closest("[data-state]");
  if (stateButton) {
    stateButton.classList.toggle("off");
    const off = stateButton.classList.contains("off");
    stateButton.setAttribute("aria-label", `${stateButton.dataset.state === "mic" ? "Микрофон" : "Звук"} ${off ? "выключен" : "включен"}`);
    return;
  }

  const toast = event.target.closest("[data-toast]");
  if (toast) { showToast(toast.dataset.toast); return; }

  if (event.target.closest("#mobileBackdrop")) { closeMobile(); return; }
  if (!event.target.closest("#stickerPopover") && !event.target.closest("[data-action='stickers']")) $("#stickerPopover").classList.remove("open");
  if (state.notificationMenu && !event.target.closest(".notification-control")) {
    state.notificationMenu = false;
    state.notificationMuteMenu = false;
    renderHeader();
  }
  if (state.auditMenu && !event.target.closest(".audit-filter")) {
    state.auditMenu = false;
    renderModal();
  }
  if (state.memberActionMenu && !event.target.closest(".member-entry")) {
    state.memberActionMenu = false;
    renderModal();
  }
  if (state.permissionAddMenu && !event.target.closest(".permission-add-wrap")) {
    state.permissionAddMenu = false;
    renderModal();
  }
  if (state.selectedMessage && !event.target.closest(".message")) {
    state.selectedMessage = null;
    renderMain();
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "friendForm") {
    const value = $("#friendName").value.trim();
    showToast(value ? `Запрос пользователю ${value} отправлен` : "Введите имя пользователя");
    if (value) $("#friendName").value = "";
  } else if (event.target.id === "newChatForm") {
    const value = $("#newChatName").value.trim();
    if (!value) return showToast("Введите имя пользователя");
    const id = `dm-${Date.now()}`;
    directMessages.push({ id, name: value, initials: value.slice(0, 1).toUpperCase() });
    state.selectedDM = id;
    state.view = "dm";
    state.space = "home";
    closeModal();
    renderApp();
  } else if (event.target.id === "createServerForm") {
    closeModal();
    state.space = "server";
    state.view = "landing";
    renderApp();
    showToast("Сервер создан в прототипе");
  } else if (event.target.id === "createChannelForm") {
    closeModal();
    showToast("Канал создан в прототипе");
  } else if (event.target.id === "createCategoryForm") {
    closeModal();
    showToast("Категория создана в прототипе");
  } else if (["userProfileForm", "serverProfileForm", "channelForm"].includes(event.target.id)) {
    showToast("Изменения сохранены в прототипе");
  } else if (event.target.id === "composer") {
    const input = $("#messageInput");
    const text = input.value.trim();
    if (!text) return;
    const key = state.view === "channel" ? "channel" : state.view === "favorite" ? "favorite" : "dm";
    const reply = state.replyingTo ? { name: state.replyingTo.name, text: state.replyingTo.text } : null;
    messages[key].push({ name: "ArCode", initials: "A", tone: "", time: "только что", text: escapeHTML(text), reply });
    state.replyingTo = null;
    state.selectedMessage = null;
    input.value = "";
    input.style.height = "auto";
    renderMain();
    renderComposer();
    $("#mainView").scrollTop = $("#mainView").scrollHeight;
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "messageInput") {
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 125)}px`;
  }
  const output = event.target.dataset.output;
  if (output) {
    const target = $(`#${output}`);
    target.value = output === "sensitivity" ? `${event.target.value} dB` : `${event.target.value}%`;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state.replyingTo) {
      state.replyingTo = null;
      renderComposer();
      $("#messageInput").focus();
    } else if (state.selectedMessage) {
      state.selectedMessage = null;
      renderMain();
    } else if (state.notificationMenu) {
      state.notificationMenu = false;
      state.notificationMuteMenu = false;
      renderHeader();
    } else if (state.auditMenu) {
      state.auditMenu = false;
      renderModal();
    } else if (state.memberActionMenu) {
      state.memberActionMenu = false;
      renderModal();
    } else if (state.permissionAddMenu) {
      state.permissionAddMenu = false;
      renderModal();
    } else if (state.modal) closeModal();
    else closeMobile();
  }
  if (event.key === "Enter" && !event.shiftKey && event.target.id === "messageInput") {
    event.preventDefault();
    $("#composer").requestSubmit();
  }
  if (["Enter", " "].includes(event.key) && event.target.matches("[data-message-index]") && !event.target.closest("button")) {
    event.preventDefault();
    event.target.click();
  }
});

window.addEventListener("resize", renderComposer);

renderApp();
