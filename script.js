<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyA82wlKjcC0cJwA_Ms0DGDQvRcQ8_2NJ50",
    authDomain: "mantenimiento-309c1.firebaseapp.com",
    projectId: "mantenimiento-309c1",
    storageBucket: "mantenimiento-309c1.firebasestorage.app",
    messagingSenderId: "230217690394",
    appId: "1:230217690394:web:ff8e9a21207778909510a3"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>
const db = getFirestore(app);
import { collection, addDoc } from "firebase/firestore";

async function guardarTarea(tarea) {
  try {
    const docRef = await addDoc(collection(db, "tareas"), {
      nombre: tarea,
      fecha: new Date()
    });
    console.log("Documento escrito con ID: ", docRef.id);
  } catch (e) {
    console.error("Error al añadir documento: ", e);
  }
}
import { collection, getDocs } from "firebase/firestore";

async function cargarTareas() {
  const querySnapshot = await getDocs(collection(db, "tareas"));
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} => ${doc.data().nombre}`);
  });
}
document.addEventListener("DOMContentLoaded", cargarTareas);
// =======================================================
// CONFIGURACIÓN DE FIREBASE (PEGA TUS CLAVES AQUÍ)
// =======================================================
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  databaseURL: "https://TU_PROYECTO-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tasksRef = db.ref('maintenanceTasks');

const SUPERVISOR_PIN = "ENGIE2026";
let isAdmin = false;

let tasks = [];

// =======================================================
// SINCRONIZACIÓN EN TIEMPO REAL
// =======================================================
function setSyncStatus(text, color) {
  const el = document.getElementById('syncStatus');
  if (el) {
    el.textContent = text;
    el.style.color = color;
  }
}

function saveTasks() {
  setSyncStatus('🟡 Guardando...', '#d83b01');
  tasksRef.set(tasks)
    .then(() => {
      setSyncStatus('🟢 En línea', '#107c41');
      localStorage.setItem('maintenanceTasks_backup', JSON.stringify(tasks));
    })
    .catch((error) => {
      console.error("Error al guardar en la nube:", error);
      setSyncStatus('🔴 Error red', '#a4262c');
    });
}

tasksRef.on('value', (snapshot) => {
  const data = snapshot.val();
  if (data && Array.isArray(data)) {
    tasks = data;
  } else if (data && typeof data === 'object') {
    tasks = Object.values(data);
  } else {
    tasks = [];
  }
  setSyncStatus('🟢 En línea', '#107c41');
  renderTasks();
});

// =======================================================
// MOTOR DE COMPRESIÓN DE IMÁGENES
// =======================================================
function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      callback(compressedDataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Subir fotos a la TAREA PRINCIPAL
function addPhotosToTask(taskId, event) {
  const files = Array.from(event.target.files);
  if (!files || files.length === 0) return;

  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  if (!task.photos) task.photos = [];

  let processed = 0;
  files.forEach(file => {
    compressImage(file, (dataUrl) => {
      task.photos.push(dataUrl);
      processed++;
      if (processed === files.length) {
        saveTasks();
      }
    });
  });
}

// Eliminar foto de la TAREA PRINCIPAL
function removePhotoFromTask(taskId, photoIndex) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.photos && task.photos[photoIndex]) {
    if (confirm('¿Eliminar esta imagen de la tarea?')) {
      task.photos.splice(photoIndex, 1);
      saveTasks();
    }
  }
}

// Subir fotos a una SUBTAREA
function addPhotosToSubtask(taskId, subtaskId, event) {
  const files = Array.from(event.target.files);
  if (!files || files.length === 0) return;

  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;

  const subtask = task.subtasks.find(s => s.id === subtaskId);
  if (!subtask) return;
  if (!subtask.photos) subtask.photos = [];

  let processed = 0;
  files.forEach(file => {
    compressImage(file, (dataUrl) => {
      subtask.photos.push(dataUrl);
      processed++;
      if (processed === files.length) {
        saveTasks();
      }
    });
  });
}

// Eliminar foto de una SUBTAREA
function removePhotoFromSubtask(taskId, subtaskId, photoIndex) {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;

  const subtask = task.subtasks.find(s => s.id === subtaskId);
  if (subtask && subtask.photos && subtask.photos[photoIndex]) {
    if (confirm('¿Eliminar esta imagen de la subtarea?')) {
      subtask.photos.splice(photoIndex, 1);
      saveTasks();
    }
  }
}

// =======================================================
// VISOR DE FOTOS PANTALLA COMPLETA
// =======================================================
function openPhotoModal(imgSrc, caption) {
  const modal = document.getElementById('photoModal');
  const modalImg = document.getElementById('photoModalImg');
  const modalCaption = document.getElementById('photoModalCaption');
  if (!modal || !modalImg) return;

  modalImg.src = imgSrc;
  if (modalCaption) modalCaption.textContent = caption || 'Fotografía de intervención';
  modal.style.display = 'flex';
}

function closePhotoModal() {
  const modal = document.getElementById('photoModal');
  if (modal) modal.style.display = 'none';
}

// =======================================================
// UTILIDADES
// =======================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function getLocalTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// =======================================================
// MODO SUPERVISOR
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
// OPERACIONES DE TAREAS
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
    photos: [],
    subtasks: []
  };

  tasks.push(newTask);
  saveTasks();

  if (taskInput) taskInput.value = '';
  if (taskDate) taskDate.value = '';
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(sub => sub.completed = task.completed);
    }
    saveTasks();
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
  }
}

function deleteAllTasks() {
  if (!isAdmin) {
    alert('Acción restringida: Se requiere modo Supervisor.');
    return;
  }

  if (tasks.length === 0) return;
  if (confirm('¿Estás seguro de que deseas eliminar todas las tareas registradas en la nube?')) {
    tasks = [];
    saveTasks();
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
      completed: false,
      photos: []
    });

    if (task.completed) {
      task.completed = false;
    }

    saveTasks();
  }
}

function toggleSubtask(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.subtasks) {
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      const allSubtasksDone = task.subtasks.length > 0 && task.subtasks.every(s => s.completed);
      task.completed = allSubtasksDone;

      saveTasks();
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
  }
}

// =======================================================
// PROGRESO Y CONTADORES
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
  if (!isAdmin) {
    alert('Acción restringida: Se requiere modo Supervisor.');
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        tasks = imported;
        saveTasks();
        alert('Tareas importadas y sincronizadas.');
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
// RENDERIZADO
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
    if (!task.photos) task.photos = [];

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

    // Miniaturas de la tarea principal
    const taskPhotosHtml = task.photos.map((photo, index) => `
      <div class="photo-thumb-box">
        <img src="${photo}" class="photo-thumb" onclick="openPhotoModal('${photo}', 'Tarea: ${escapeHtml(task.text)} (Foto ${index + 1})')" title="Ver foto ampliada">
        <button type="button" class="photo-remove-btn" onclick="removePhotoFromTask(${task.id}, ${index})" title="Eliminar foto">✕</button>
      </div>
    `).join('');

    // Subtareas con botón azul [añadir imagen]
    const subtasksHtml = task.subtasks.map(sub => {
      if (!sub.photos) sub.photos = [];

      const subtaskPhotosHtml = sub.photos.map((photo, pIdx) => `
        <div class="photo-thumb-box photo-thumb-box-subtask">
          <img src="${photo}" class="photo-thumb" onclick="openPhotoModal('${photo}', 'Subtarea: ${escapeHtml(sub.text)} (Foto ${pIdx + 1})')" title="Ver foto">
          <button type="button" class="photo-remove-btn" onclick="removePhotoFromSubtask(${task.id}, ${sub.id}, ${pIdx})" title="Eliminar foto">✕</button>
        </div>
      `).join('');

      return `
        <li class="subtask-item">
          <div class="subtask-top-row">
            <div class="subtask-left">
              <input 
                type="checkbox" 
                class="subtask-checkbox" 
                ${sub.completed ? 'checked' : ''} 
                onchange="toggleSubtask(${task.id}, ${sub.id})"
              >
              <span class="subtask-text ${sub.completed ? 'completed' : ''}">${escapeHtml(sub.text)}</span>
              <span class="subtask-assignee">👷 ${escapeHtml(sub.assignee || 'Sin asignar')}</span>
            </div>
            
            <div class="subtask-actions-right">
              <!-- BOTÓN AZUL COMPACTO PARA SUBTAREA -->
              <label class="btn-add-img btn-add-img-subtask" title="Adjuntar fotos a la subtarea">
                📷 [añadir imagen]
                <input type="file" accept="image/*" multiple capture="environment" style="display: none;" onchange="addPhotosToSubtask(${task.id}, ${sub.id}, event)">
              </label>
              <button type="button" class="subtask-delete-btn admin-only" onclick="deleteSubtask(${task.id}, ${sub.id})" title="Eliminar subtarea">✕</button>
            </div>
          </div>

          ${sub.photos.length > 0 ? `<div class="photo-gallery" style="margin-left: 23px;">${subtaskPhotosHtml}</div>` : ''}
        </li>
      `;
    }).join('');

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

      <!-- BOTÓN AZUL PRINCIPAL DE LA TAREA -->
      <div style="margin-left: 30px; display: flex; flex-direction: column; gap: 6px;">
        <label class="btn-add-img" title="Adjuntar fotos a la tarea">
          📷 [añadir imagen]
          <input type="file" accept="image/*" multiple capture="environment" style="display: none;" onchange="addPhotosToTask(${task.id}, event)">
        </label>
        
        ${task.photos.length > 0 ? `<div class="photo-gallery">${taskPhotosHtml}</div>` : ''}
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
            placeholder="Operario" 
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