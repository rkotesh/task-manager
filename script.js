const API_URL = 'http://localhost:3000/tasks';

const form = document.querySelector('form');
const taskList = document.querySelector('.task-list');
const statusButtons = document.querySelectorAll('.status-filter');
const sortSelect = document.querySelector('#sort');

let currentFilter = 'all';
let currentSort = 'none';
let editMode = false;
let editingTaskId = null;

// FETCH AND DISPLAY TASKS
async function fetchTasks() {
  let url = `${API_URL}?`;
  if (currentFilter !== 'all') url += `status=${currentFilter}&`;
  if (currentSort !== 'none') url += `sortBy=${currentSort}`;

  const res = await fetch(url);
  const tasks = await res.json();
  displayTasks(tasks);
}

// DISPLAY TASK CARDS
function displayTasks(tasks) {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = `task ${task.priority}`;

    div.innerHTML = `
      <div class="task-content">
        <h3>${task.title}</h3>
        <p class="priority">Priority: ${task.priority}</p>
        <p>${task.description}</p>
        <p>Due: ${task.dueDate}</p>
        <p>Status: ${task.status}</p>
      </div>
      <div class="task-buttons">
        <button class="edit">Edit</button>
        <button class="toggle">${task.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}</button>
        <button class="delete">Delete</button>
      </div>
    `;

    div.querySelector('.delete').onclick = () => deleteTask(task.id);
    div.querySelector('.toggle').onclick = () => toggleStatus(task);
    div.querySelector('.edit').onclick = () => fillEditForm(task);

    taskList.appendChild(div);
  });
}

// ADD / UPDATE TASK
form.onsubmit = async (e) => {
  e.preventDefault();

  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const dueDate = form.dueDate.value;
  const priority = form.priority.value;

  if (!title || !dueDate || !priority) {
    alert("Please fill all fields");
    return;
  }

  const task = {
    title,
    description,
    dueDate,
    priority,
    status: 'pending'
  };

  if (editMode) {
    await fetch(`${API_URL}/${editingTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    editMode = false;
    editingTaskId = null;
    form.querySelector('button').textContent = 'Add Task';
  } else {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
  }

  form.reset();
  fetchTasks();
}

// DELETE TASK
async function deleteTask(id) {
  if (confirm("Are you sure to delete this task?")) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchTasks();
  }
}

// TOGGLE STATUS
async function toggleStatus(task) {
  const updated = {
    ...task,
    status: task.status === 'completed' ? 'pending' : 'completed',
  };
  await fetch(`${API_URL}/${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });
  fetchTasks();
}

// FILL EDIT FORM
function fillEditForm(task) {
  form.title.value = task.title;
  form.description.value = task.description;
  form.dueDate.value = task.dueDate;
  form.priority.value = task.priority;

  editMode = true;
  editingTaskId = task.id;
  form.querySelector('button').textContent = 'Update Task';
}

// FILTER BUTTONS
statusButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    statusButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.status;
    fetchTasks();
  });
});

// SORT SELECT
sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  fetchTasks();
});

// INITIAL FETCH
window.onload = fetchTasks;
