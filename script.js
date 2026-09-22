// =======================================================
// CONFIGURACIÓN Y ESTADO
// =======================================================
// Puedes cambiar la clave del supervisor modificando este valor:
const SUPERVISOR_PIN = "ENGIE2026"; // Cambiar a tu PIN deseado
let isAdmin = false;

let tasks = JSON.parse(localStorage.getItem('maintenanceTasks')) || [];

function saveTasks() {
  localStorage.setItem('maintenanceTasks', JSON.stringify(tasks));
}

// Sanitización para prevenir fallos al renderizar textos especiales
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Fecha local YYYY-MM-DD
function getLocalTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// =======================================================
// CONTROL DE ACCESO (OPERARIO / SUPERVISOR)
// =======================================================
function toggleAdminMode() {
  const btn = document.getElementById('btnAdminAuth');

  if (isAdmin) {
    isAdmin = false;
    document.body.classList.remove('is-admin');
    if (btn) {
      btn.textContent = '🔒 Operario';
      btn.classList.remove('active');
    }
    renderTasks();
  } else {
    const enteredPin = prompt('Introduce el PIN de Supervisor para gestionar tareas:');
    if (enteredPin === SUPERVISOR_PIN) {
      isAdmin = true;
      document.body.classList.add('is-admin');
      if (btn) {
        btn.textContent = '🔓 Supervisor';
        btn.classList.add('active');
      }
      renderTasks();
    } else if (enteredPin !== null) {
      alert('PIN incorrecto.');
    }
  }
}

// =======================================================
// TAREAS (CREAR, MARCAR, EDITAR, BORRAR)
// =======================================================
function addTask() {
  if (!isAdmin) {
    alert('Acción restringida: Se requiere modo Supervisor.');
    return;
  }

  const taskInput = document.getElementById('taskInput');
  const taskPriority = document.getElementById('taskPriority');
  const taskGroup = document.getElementById('taskGroup');
  const taskDate = document.getElementById('taskDate');

  const text = taskInput ? taskInput.value.trim() : '';

  if (!text) {
    alert('Por favor, ingresa el título de la tarea.');
    if (taskInput) taskInput.focus();
    return;
  }

  const newTask = {
    id: Date.now(),
    text: text,
    priority: taskPriority ? taskPriority.value : 'Media',
    group: taskGroup ? taskGroup.value : 'ENGIE',
    date: taskDate ? taskDate.value : '',
    completed: false,
    subtasks: []
  };

  tasks.push(newTask);
  saveTasks();

  if (taskInput) taskInput.value = '';
  if (taskDate) taskDate.value = '';

  renderTasks();
}

// Los operarios pueden tildar/destildar sin clave
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(sub => sub.completed = task.completed);
    }
    saveTasks();
    renderTasks();
  }
}

function editTask(id) {
  if (!isAdmin) {
    alert('Acción restringida: Se requiere modo Supervisor.');
    return;
  }

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newText = prompt('Modificar título de la tarea:', task.text);
  if (newText !== null && newText.trim() !== '') {
    task.text = newText.trim();
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  if (!isAdmin) {
    alert('Acción restringida: Se requiere modo Supervisor.');
    return;
  }

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const subCount = task.subtasks ? task.subtasks.length : 0;
  let mensaje = `¿Deseas eliminar la tarea "${task.text}"?`;
  if (subCount > 0) {
    mensaje += `\n⚠️ Advertencia: Contiene ${subCount} subtarea(s) asociada(s).`;
  }

  if (confirm(mensaje)) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
}

function deleteAllTasks() {
  if (!isAdmin) {
    alert('Acción restringida: Se requiere modo Supervisor.');
    return;
  }

  if (tasks.length === 0) return;
  if (confirm('¿Estás seguro de que deseas eliminar todas las tareas registradas?')) {
    tasks = [];
    saveTasks();
    renderTasks();
  }
}

// =======================================================
// SUBTAREAS
// =======================================================
function addSubtask(taskId) {
  if (!isAdmin) {
    alert('Acción restringida: Se requiere modo Supervisor.');
    return;
  }

  const textInput = document.getElementById(`subtask-input-${taskId}`);
  const assigneeInput = document.getElementById(`subtask-assignee-${taskId}`);
  
  const text = textInput ? textInput.value.trim() : '';
  const assignee = assigneeInput ? assigneeInput.value.trim() : '';

  if (!text) return;

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      id: Date.now(),
      text: text,
      assignee: assignee || 'Sin asignar',
      completed: false
    });

    if (task.completed) {
      task.completed = false;
    }

    saveTasks();
    renderTasks();
  }
}

// Operarios pueden tildar subtareas libremente
function toggleSubtask(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.subtasks) {
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      const allSubtasksDone = task.subtasks.length > 0 && task.subtasks.every(s => s.completed);
      task.completed = allSubtasksDone;

      saveTasks();
      renderTasks();
    }
  }
}

function deleteSubtask(taskId, subtaskId) {
  if (!isAdmin) {
    alert('Acción restringida: Se requiere modo Supervisor.');
    return;
  }

  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;

  const subtask = task.subtasks.find(s => s.id === subtaskId);
  if (!subtask) return;

  if (confirm(`¿Eliminar la subtarea "${subtask.text}"?`)) {
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    if (task.subtasks.length > 0) {
      task.completed = task.subtasks.every(s => s.completed);
    }
    saveTasks();
    renderTasks();
  }
}

// =======================================================
// PROGRESO Y CONTADORES DE PENDIENTES
// =======================================================
function updateProgress() {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  if (!progressBar || !progressText) return;

  let totalUnits = 0;
  let completedUnits = 0;

  tasks.forEach(task => {
    if (task.subtasks && task.subtasks.length > 0) {
      totalUnits += task.subtasks.length;
      completedUnits += task.subtasks.filter(s => s.completed).length;
    } else {
      totalUnits += 1;
      if (task.completed) completedUnits += 1;
    }
  });

  if (totalUnits === 0) {
    progressBar.style.width = '0%';
    progressText.textContent = '0% (0/0)';
    return;
  }

  const percentage = Math.round((completedUnits / totalUnits) * 100);
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}% (${completedUnits}/${totalUnits})`;
}

// Cuenta solo las tareas que quedan pendientes (por hacer)
function updateGroupCounters() {
  const countersContainer = document.getElementById('groupCounters');
  const groupFilter = document.getElementById('groupFilter');
  if (!countersContainer || !groupFilter) return;

  const groups = ['ENGIE', 'MORELBA', 'VYNCKE'];
  const currentGroup = groupFilter.value;

  const pendingTasks = tasks.filter(t => !t.completed);

  const pendingCounts = {
    all: pendingTasks.length,
    ENGIE: pendingTasks.filter(t => t.group === 'ENGIE').length,
    MORELBA: pendingTasks.filter(t => t.group === 'MORELBA').length,
    VYNCKE: pendingTasks.filter(t => t.group === 'VYNCKE').length
  };

  countersContainer.innerHTML = `
    <span class="group-badge ${currentGroup === 'all' ? 'active' : ''}" onclick="setGroupFilter('all')">
      Todos (${pendingCounts.all})
    </span>
    ${groups.map(g => `
      <span class="group-badge ${currentGroup === g ? 'active' : ''}" onclick="setGroupFilter('${g}')">
        ${g} (${pendingCounts[g]})
      </span>
    `).join('')}
  `;

  const options = groupFilter.options;
  for (let i = 0; i < options.length; i++) {
    const val = options[i].value;
    if (val === 'all') {
      options[i].text = `Todos los grupos (${pendingCounts.all} pendientes)`;
    } else if (pendingCounts[val] !== undefined) {
      options[i].text = `${val} (${pendingCounts[val]} pendientes)`;
    }
  }
}

function setGroupFilter(groupName) {
  const groupFilter = document.getElementById('groupFilter');
  if (groupFilter) {
    groupFilter.value = groupName;
    renderTasks();
  }
}

// =======================================================
// COPIAS DE SEGURIDAD
// =======================================================
function exportTasks() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `mantenimiento_backup_${getLocalTodayString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importTasks(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        tasks = imported;
        saveTasks();
        renderTasks();
        alert('Tareas importadas correctamente.');
      } else {
        alert('El archivo no contiene un formato de tareas válido.');
      }
    } catch {
      alert('Error al leer el archivo JSON.');
    }
  };
  reader.readAsText(file);
}

// =======================================================
// RENDERIZADO PRINCIPAL
// =======================================================
function renderTasks() {
  const taskList = document.getElementById('taskList');
  const groupFilter = document.getElementById('groupFilter');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');

  if (!taskList) return;

  const groupVal = groupFilter ? groupFilter.value : 'all';
  const statusVal = statusFilter ? statusFilter.value : 'all';
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

  taskList.innerHTML = '';
  const todayStr = getLocalTodayString();

  const filteredTasks = tasks.filter(task => {
    const matchesGroup = (groupVal === 'all' || task.group === groupVal);
    const matchesStatus = (statusVal === 'all') ||
      (statusVal === 'completed' && task.completed) ||
      (statusVal === 'pending' && !task.completed);
    const matchesSearch = (task.text || '').toLowerCase().includes(searchVal);

    return matchesGroup && matchesStatus && matchesSearch;
  });

  filteredTasks.forEach(task => {
    if (!task.subtasks) task.subtasks = [];

    const totalSubs = task.subtasks.length;
    const completedSubs = task.subtasks.filter(s => s.completed).length;

    let dateBadge = 'Sin fecha';
    if (task.date) {
      if (!task.completed && task.date < todayStr) {
        dateBadge = `<span style="color: #a4262c; font-weight: 600;">⚠️ Vencida (${escapeHtml(task.date)})</span>`;
      } else if (!task.completed && task.date === todayStr) {
        dateBadge = `<span style="color: #d83b01; font-weight: 600;">⏰ Vence hoy (${escapeHtml(task.date)})</span>`;
      } else {
        dateBadge = escapeHtml(task.date);
      }
    }

    const subtasksHtml = task.subtasks.map(sub => `
      <li class="subtask-item">
        <div class="subtask-left">
          <input 
            type="checkbox" 
            class="subtask-checkbox" 
            ${sub.completed ? 'checked' : ''} 
            onchange="toggleSubtask(${task.id}, ${sub.id})"
          >
          <span class="subtask-text ${sub.completed ? 'completed' : ''}">${escapeHtml(sub.text)}</span>
          <span class="subtask-assignee">👤 ${escapeHtml(sub.assignee || 'Sin asignar')}</span>
        </div>
        <button type="button" class="subtask-delete-btn admin-only" onclick="deleteSubtask(${task.id}, ${sub.id})" title="Eliminar subtarea">✕</button>
      </li>
    `).join('');

    const li = document.createElement('li');
    li.className = 'task-item';

    li.innerHTML = `
      <div class="task-header">
        <div class="task-left">
          <input 
            type="checkbox" 
            class="main-checkbox" 
            id="task-${task.id}" 
            ${task.completed ? 'checked' : ''} 
            onchange="toggleTask(${task.id})"
          >
          <div class="task-content">
            <label for="task-${task.id}" class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</label>
            <span class="task-details">Prioridad: <strong>${escapeHtml(task.priority)}</strong> | Grupo: <strong>${escapeHtml(task.group)}</strong> | Fecha: ${dateBadge}</span>
          </div>
        </div>
        <div class="task-actions admin-only">
          <button type="button" class="edit-btn" onclick="editTask(${task.id})" title="Editar título">✏️</button>
          <button type="button" class="delete-btn" onclick="deleteTask(${task.id})" title="Eliminar tarea">✕</button>
        </div>
      </div>

      <div class="subtasks-container">
        <div class="subtask-counter">Subtareas: ${completedSubs}/${totalSubs}</div>
        <ul class="subtask-list">
          ${subtasksHtml}
        </ul>
        <div class="add-subtask-form admin-only">
          <input 
            type="text" 
            id="subtask-input-${task.id}" 
            class="subtask-text-input"
            placeholder="Nueva subtarea..." 
            onkeypress="if(event.key === 'Enter') addSubtask(${task.id})"
          >
          <input 
            type="text" 
            id="subtask-assignee-${task.id}" 
            class="subtask-assignee-input"
            placeholder="Responsable" 
            onkeypress="if(event.key === 'Enter') addSubtask(${task.id})"
          >
          <button type="button" onclick="addSubtask(${task.id})">+</button>
        </div>
      </div>
    `;

    taskList.appendChild(li);
  });

  updateProgress();
  updateGroupCounters();
}

// =======================================================
// INICIALIZACIÓN
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
  renderTasks();

  const taskInput = document.getElementById('taskInput');
  if (taskInput) {
    taskInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addTask();
      }
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderTasks);
  }
});