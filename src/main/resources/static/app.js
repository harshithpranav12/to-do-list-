const API = '/api/tasks';
let tasks = [];
let editingId = null;
let activeView = 'all';
let activePriority = '';

const $ = (selector) => document.querySelector(selector);
const list = $('#task-list');
const dialog = $('#task-dialog');
const form = $('#task-form');
const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

$('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

async function request(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fieldMessages = body.details ? Object.values(body.details).join(' · ') : '';
    throw new Error(fieldMessages || body.message || `Request failed (${response.status})`);
  }
  return body;
}

function showMessage(text, isError = false) {
  const message = $('#message');
  message.textContent = text;
  message.classList.toggle('error', isError);
  if (text) window.setTimeout(() => { if (message.textContent === text) message.textContent = ''; }, 4000);
}

async function loadTasks() {
  list.innerHTML = '<div class="loading-state"><span class="spinner"></span>Loading your tasks…</div>';
  try {
    tasks = await request(API);
    render();
  } catch (error) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">!</span><strong>Could not load tasks</strong><span>${escapeHtml(error.message)}. Is the application running?</span></div>`;
    showMessage('Unable to connect to the task service.', true);
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function visibleTasks() {
  let result = [...tasks];
  if (activeView === 'completed') result = result.filter((task) => task.completed);
  if (activeView === 'today') result = result.filter((task) => task.dueDate === localToday());
  const status = $('#status-filter').value;
  if (status !== '') result = result.filter((task) => task.completed === (status === 'true'));
  const priority = activePriority || $('#priority-select').value;
  if (priority) result = result.filter((task) => task.priority === priority);
  return result.sort((a, b) => Number(a.completed) - Number(b.completed) || ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority]) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
}

function render() {
  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;
  $('#all-count').textContent = tasks.length;
  $('#total-count').textContent = tasks.length;
  $('#completed-count').textContent = completed;
  $('#pending-count').textContent = pending;
  $('#progress-label').textContent = `${tasks.length ? Math.round(completed / tasks.length * 100) : 0}% done`;
  $('#progress-bar').style.width = `${tasks.length ? completed / tasks.length * 100 : 0}%`;

  const titles = { all: ['All tasks', 'A clear mind starts with a clear list.', 'Your tasks'], today: ['Due today', 'A little focus goes a long way.', 'Due today'], completed: ['Completed', 'Look at everything you have done.', 'Completed tasks'] };
  const [heading, subtitle, listTitle] = titles[activeView];
  $('#page-title').innerHTML = `${heading}<span class="heading-period">.</span>`;
  $('#page-subtitle').textContent = subtitle;
  $('#list-title').textContent = listTitle;
  const shown = visibleTasks();
  $('#visible-count').textContent = shown.length;
  $('#empty-add').hidden = shown.length > 0 || activeView !== 'all';
  if (!shown.length) {
    const text = tasks.length ? 'Nothing to see here' : 'Your list is looking fresh';
    const detail = tasks.length ? 'Try adjusting your filters or enjoy the breathing room.' : 'Add a task and give your day a little direction.';
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">✳</span><strong>${text}</strong><span>${detail}</span></div>`;
    return;
  }
  list.innerHTML = shown.map((task) => taskCard(task)).join('');
}

function taskCard(task) {
  const due = task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  const overdue = task.dueDate && task.dueDate < localToday() && !task.completed;
  const description = task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : '';
  const dueMarkup = due ? `<span class="due-date ${overdue ? 'overdue' : ''}">◷ ${overdue ? 'Overdue · ' : ''}${due}</span>` : '';
  return `<article class="task-card ${task.completed ? 'is-complete' : ''}" data-id="${task.id}">
    <input class="task-check" type="checkbox" aria-label="Mark ${escapeHtml(task.title)} ${task.completed ? 'pending' : 'complete'}" ${task.completed ? 'checked' : ''} data-action="toggle">
    <div class="task-main"><div class="task-title-row"><h3 class="task-title">${escapeHtml(task.title)}</h3></div>${description}<div class="task-meta"><span class="priority-badge badge-${task.priority}">${task.priority[0] + task.priority.slice(1).toLowerCase()}</span>${dueMarkup}</div></div>
    <div class="task-actions"><button class="icon-button" data-action="edit" aria-label="Edit task" title="Edit">✎</button><button class="icon-button delete" data-action="delete" aria-label="Delete task" title="Delete">⌫</button></div>
  </article>`;
}

function openDialog(task = null) {
  editingId = task?.id ?? null;
  form.reset();
  $('#form-error').textContent = '';
  $('#dialog-title').textContent = task ? 'Edit task' : 'Create a task';
  $('#save-task').innerHTML = task ? 'Save changes <span>→</span>' : 'Create task <span>→</span>';
  $('#title').value = task?.title ?? '';
  $('#description').value = task?.description ?? '';
  $('#priority').value = task?.priority ?? 'MEDIUM';
  $('#dueDate').value = task?.dueDate ?? '';
  dialog.showModal();
  $('#title').focus();
}

$('#add-task-top').addEventListener('click', () => openDialog());
$('#empty-add').addEventListener('click', () => openDialog());
$('#close-dialog').addEventListener('click', () => dialog.close());
$('#cancel-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = $('#title').value.trim();
  if (!title) { $('#form-error').textContent = 'A title is required.'; $('#title').focus(); return; }
  const payload = { title, description: $('#description').value.trim() || null, priority: $('#priority').value, dueDate: $('#dueDate').value || null };
  const button = $('#save-task');
  button.disabled = true;
  button.textContent = 'Saving…';
  try {
    await request(editingId ? `${API}/${editingId}` : API, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    dialog.close();
    showMessage(editingId ? 'Task updated.' : 'Task created.');
    await loadTasks();
  } catch (error) {
    $('#form-error').textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = editingId ? 'Save changes <span>→</span>' : 'Create task <span>→</span>';
  }
});

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const card = button.closest('.task-card');
  const id = card.dataset.id;
  const task = tasks.find((item) => String(item.id) === id);
  try {
    if (button.dataset.action === 'edit') openDialog(task);
    if (button.dataset.action === 'delete') {
      if (!window.confirm(`Delete “${task.title}”?`)) return;
      await request(`${API}/${id}`, { method: 'DELETE' });
      showMessage('Task deleted.');
      await loadTasks();
    }
  } catch (error) { showMessage(error.message, true); }
});

list.addEventListener('change', async (event) => {
  if (event.target.dataset.action !== 'toggle') return;
  const card = event.target.closest('.task-card');
  try {
    await request(`${API}/${card.dataset.id}/status`, { method: 'PATCH', body: JSON.stringify({ completed: event.target.checked }) });
    showMessage(event.target.checked ? 'Task completed. Nice work.' : 'Task marked pending.');
    await loadTasks();
  } catch (error) { event.target.checked = !event.target.checked; showMessage(error.message, true); }
});

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => {
  activeView = button.dataset.view;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
  activePriority = '';
  document.querySelectorAll('.priority-filter').forEach((item) => item.classList.remove('active'));
  render();
}));

document.querySelectorAll('.priority-filter').forEach((button) => button.addEventListener('click', () => {
  activePriority = activePriority === button.dataset.priority ? '' : button.dataset.priority;
  $('#priority-select').value = '';
  document.querySelectorAll('.priority-filter').forEach((item) => item.classList.toggle('active', item === button && activePriority));
  render();
}));

$('#status-filter').addEventListener('change', render);
$('#priority-select').addEventListener('change', () => { activePriority = ''; document.querySelectorAll('.priority-filter').forEach((item) => item.classList.remove('active')); render(); });
loadTasks();
