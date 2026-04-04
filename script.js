// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentYear = 2026;
let currentMonthIndex = 3;
let monthsData = [];
let isFirstLoad = true;
let splashTimeout = null;
let isAppLoaded = false;
let selectedDate = null;
let currentPage = 'calendar';
let workouts = [];
let editingWorkoutIndex = null;
let dragStartIndex = null;
let currentWorkoutIndex = null;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener("DOMContentLoaded", () => {
    loadWorkouts();
    initCalendar();
    setupSplashScreen();
    setupNavigation();
    setupBottomNav();
    setupModal();
    setupWorkoutMenu();
});

// ==================== РАБОТА С ТРЕНИРОВКАМИ ====================

function loadWorkouts() {
    const savedWorkouts = localStorage.getItem('gym_workouts_list');
    if (savedWorkouts) {
        workouts = JSON.parse(savedWorkouts);
    } else {
        workouts = [];
    }
    renderWorkoutsList();
}

function saveWorkouts() {
    localStorage.setItem('gym_workouts_list', JSON.stringify(workouts));
    renderWorkoutsList();
}

function renderWorkoutsList() {
    const workoutsList = document.getElementById('workouts-list');
    const emptyPlaceholder = document.getElementById('empty-workouts');
    
    if (!workoutsList || !emptyPlaceholder) return;
    
    if (workouts.length === 0) {
        workoutsList.style.display = 'none';
        emptyPlaceholder.style.display = 'block';
        return;
    }
    
    workoutsList.style.display = 'flex';
    emptyPlaceholder.style.display = 'none';
    
    const dayNames = {
        'monday': 'Понедельник',
        'tuesday': 'Вторник',
        'wednesday': 'Среда',
        'thursday': 'Четверг',
        'friday': 'Пятница',
        'saturday': 'Суббота',
        'sunday': 'Воскресенье',
        'any': 'Любой день'
    };
    
    workoutsList.innerHTML = workouts.map((workout, index) => `
        <div class="workout-card" data-index="${index}" draggable="true">
            <div class="drag-handle">
                <div class="drag-dots-row">
                    <div class="drag-dot"></div>
                    <div class="drag-dot"></div>
                </div>
                <div class="drag-dots-row">
                    <div class="drag-dot"></div>
                    <div class="drag-dot"></div>
                </div>
                <div class="drag-dots-row">
                    <div class="drag-dot"></div>
                    <div class="drag-dot"></div>
                </div>
            </div>
            <div class="workout-card-content">
                <div class="workout-day-badge ${workout.day === 'any' ? 'any-day' : ''}">
                    ${dayNames[workout.day]}
                </div>
                <div class="workout-name">${escapeHtml(workout.name)}</div>
            </div>
            <button class="workout-menu-btn" data-index="${index}">
                <div class="menu-dot"></div>
                <div class="menu-dot"></div>
                <div class="menu-dot"></div>
            </button>
        </div>
    `).join('');
    
    setupDragAndDrop();
    setupWorkoutCardMenus();
    
    document.querySelectorAll('.workout-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.workout-menu-btn') && !e.target.closest('.drag-handle')) {
                const index = parseInt(card.dataset.index);
                openWorkoutDetail(index);
            }
        });
    });
}

function openWorkoutDetail(index) {
    currentWorkoutIndex = index;
    const workout = workouts[index];
    if (!workout) return;
    
    const dayBadge = document.getElementById('detail-day-badge');
    const workoutName = document.getElementById('detail-workout-name');
    
    const shortDayNames = {
        'monday': 'Пн',
        'tuesday': 'Вт',
        'wednesday': 'Ср',
        'thursday': 'Чт',
        'friday': 'Пт',
        'saturday': 'Сб',
        'sunday': 'Вс',
        'any': 'Любой'
    };
    
    if (dayBadge) {
        dayBadge.textContent = shortDayNames[workout.day] || 'Любой';
        if (workout.day === 'any') {
            dayBadge.classList.add('any-day');
        } else {
            dayBadge.classList.remove('any-day');
        }
    }
    
    if (workoutName) {
        workoutName.textContent = workout.name;
    }
    
    showPage('workout-detail');
}

function setupDragAndDrop() {
    const cards = document.querySelectorAll('.workout-card');
    let dragOverIndex = null;
    
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        
        card.addEventListener('dragstart', (e) => {
            dragStartIndex = parseInt(card.dataset.index);
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            if (dragOverIndex !== null && dragStartIndex !== null && dragStartIndex !== dragOverIndex) {
                const [movedItem] = workouts.splice(dragStartIndex, 1);
                workouts.splice(dragOverIndex, 0, movedItem);
                saveWorkouts();
            }
            dragStartIndex = null;
            dragOverIndex = null;
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const targetIndex = parseInt(card.dataset.index);
            if (targetIndex !== dragOverIndex) {
                dragOverIndex = targetIndex;
            }
        });
    });
}

function setupWorkoutCardMenus() {
    const menuBtns = document.querySelectorAll('.workout-menu-btn');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            showWorkoutMenu(btn, index);
        });
    });
}

function setupWorkoutMenu() {
    const menu = document.getElementById('workout-menu');
    const editBtn = document.getElementById('menu-edit');
    const copyBtn = document.getElementById('menu-copy');
    const deleteBtn = document.getElementById('menu-delete');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (editingWorkoutIndex !== null) {
                closeWorkoutMenu();
                openEditModal(editingWorkoutIndex);
            }
        });
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (editingWorkoutIndex !== null) {
                copyWorkout(editingWorkoutIndex);
                closeWorkoutMenu();
            }
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (editingWorkoutIndex !== null && confirm('Удалить тренировку?')) {
                workouts.splice(editingWorkoutIndex, 1);
                saveWorkouts();
                closeWorkoutMenu();
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.workout-menu-btn') && !e.target.closest('#workout-menu')) {
            closeWorkoutMenu();
        }
    });
}

function showWorkoutMenu(button, index) {
    const menu = document.getElementById('workout-menu');
    if (!menu) return;
    
    editingWorkoutIndex = index;
    const rect = button.getBoundingClientRect();
    
    menu.style.display = 'block';
    menu.style.position = 'fixed';
    menu.style.top = rect.bottom + 5 + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
}

function closeWorkoutMenu() {
    const menu = document.getElementById('workout-menu');
    if (menu) {
        menu.style.display = 'none';
    }
    editingWorkoutIndex = null;
}

function copyWorkout(index) {
    const original = workouts[index];
    const copy = {
        ...original,
        id: Date.now(),
        name: original.name + ' (копия)'
    };
    workouts.splice(index + 1, 0, copy);
    saveWorkouts();
}

function openEditModal(index) {
    const workout = workouts[index];
    if (!workout) return;
    
    const modal = document.getElementById('workout-modal');
    const modalTitle = document.getElementById('modal-title');
    const nameInput = document.getElementById('workout-name');
    const daySelect = document.getElementById('workout-day');
    const confirmBtn = document.getElementById('confirm-workout-btn');
    
    if (modalTitle) modalTitle.textContent = 'Редактировать тренировку';
    if (nameInput) nameInput.value = workout.name;
    if (daySelect) daySelect.value = workout.day;
    
    const oldConfirmHandler = confirmBtn.onclick;
    
    confirmBtn.onclick = () => {
        const newName = nameInput ? nameInput.value.trim() : '';
        const newDay = daySelect ? daySelect.value : 'any';
        
        if (newName) {
            workouts[index].name = newName;
            workouts[index].day = newDay;
            saveWorkouts();
            if (modal) modal.style.display = 'none';
            confirmBtn.onclick = oldConfirmHandler;
        } else {
            alert('Введите название тренировки');
        }
    };
    
    if (modal) modal.style.display = 'flex';
}

function addWorkout(name, day) {
    if (!name || name.trim() === '') {
        alert('Введите название тренировки');
        return false;
    }
    
    workouts.push({
        id: Date.now(),
        name: name.trim(),
        day: day,
        createdAt: new Date().toISOString(),
        exercises: []
    });
    
    saveWorkouts();
    return true;
}

// ==================== ФУНКЦИИ ЗАСТАВКИ ====================

function setupSplashScreen() {
    const splash = document.getElementById("splash-screen");
    const pageCalendar = document.getElementById("page-calendar");
    
    if (!splash || !pageCalendar) return;
    
    splashTimeout = setTimeout(() => {
        hideSplashScreen();
    }, 5000);
    
    splash.addEventListener('click', () => {
        hideSplashScreen();
    });
}

function hideSplashScreen() {
    if (isAppLoaded) return;
    isAppLoaded = true;
    
    if (splashTimeout) {
        clearTimeout(splashTimeout);
        splashTimeout = null;
    }
    
    const splash = document.getElementById("splash-screen");
    const pageCalendar = document.getElementById("page-calendar");
    
    if (splash && pageCalendar) {
        splash.style.opacity = "0";
        setTimeout(() => {
            splash.style.display = "none";
            pageCalendar.style.display = "block";
            
            setTimeout(() => {
                setInitialPositionToCurrentMonth();
                isFirstLoad = false;
            }, 50);
        }, 300);
    }
}

// ==================== ФУНКЦИИ НАВИГАЦИИ ====================

function setupNavigation() {
    // Назад из списка тренировок в календарь
    const backBtn = document.getElementById('back-to-calendar-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showPage('calendar');
        });
    }
    
    // Назад из деталей тренировки в список тренировок
    const backToWorkoutListBtn = document.getElementById('back-to-workout-list-btn');
    if (backToWorkoutListBtn) {
        backToWorkoutListBtn.addEventListener('click', () => {
            showPage('workout');
        });
    }
    
    // Кнопка "Выбери упражнение" (пока без функционала)
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', () => {
            alert('Функционал добавления упражнений в разработке');
        });
    }
    
    // Назад со страницы упражнений на главный экран
    const backToMainFromExercises = document.getElementById('back-to-main-from-exercises');
    if (backToMainFromExercises) {
        backToMainFromExercises.addEventListener('click', () => {
            showPage('calendar');
        });
    }
    
    // Назад со страницы Трицепс на страницу упражнений
    const backToExercisesFromTriceps = document.getElementById('back-to-exercises-from-triceps');
    if (backToExercisesFromTriceps) {
        backToExercisesFromTriceps.addEventListener('click', () => {
            showPage('exercises');
        });
    }
    
    // Обработка нажатий на категории упражнений
    const exerciseCategories = document.querySelectorAll('.exercise-category');
    exerciseCategories.forEach(category => {
        category.addEventListener('click', () => {
            const categoryName = category.querySelector('.category-name')?.textContent || '';
            const categoryData = category.getAttribute('data-category');
            
            if (categoryData === 'triceps') {
                showPage('triceps');
            } else {
                alert(`Упражнения для ${categoryName} в разработке`);
            }
        });
    });
    
    // Кнопки Трицепс (пока без функционала)
    const addTricepsBtn = document.getElementById('add-triceps-exercise-btn');
    if (addTricepsBtn) {
        addTricepsBtn.addEventListener('click', () => {
            alert('Функционал добавления упражнений для трицепса в разработке');
        });
    }
    
    const sortTricepsBtn = document.getElementById('sort-triceps-btn');
    if (sortTricepsBtn) {
        sortTricepsBtn.addEventListener('click', () => {
            alert('Функционал сортировки в разработке');
        });
    }
    
    // Обработка кнопки "Назад" на телефоне (Android)
    document.addEventListener('backbutton', (e) => {
        if (currentPage === 'workout-detail') {
            e.preventDefault();
            showPage('workout');
        } else if (currentPage === 'workout') {
            e.preventDefault();
            showPage('calendar');
        } else if (currentPage === 'exercises') {
            e.preventDefault();
            showPage('calendar');
        } else if (currentPage === 'triceps') {
            e.preventDefault();
            showPage('exercises');
        }
    }, false);
}

function setupBottomNav() {
    const navTraining = document.getElementById('nav-training');
    const navExercises = document.getElementById('nav-exercises');
    const navProgress = document.getElementById('nav-progress');
    
    if (navTraining) {
        navTraining.addEventListener('click', () => {
            showPage('workout');
            updateActiveNav('nav-training');
        });
    }
    
    if (navExercises) {
        navExercises.addEventListener('click', () => {
            showPage('exercises');
            updateActiveNav('nav-exercises');
        });
    }
    
    if (navProgress) {
        navProgress.addEventListener('click', () => {
            alert('Страница прогресса в разработке');
            updateActiveNav('nav-progress');
        });
    }
    
    updateActiveNav('nav-training');
}

function updateActiveNav(activeId) {
    const navBtns = ['nav-training', 'nav-exercises', 'nav-progress'];
    
    navBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            if (id === activeId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

function showPage(pageName) {
    const pageCalendar = document.getElementById('page-calendar');
    const pageWorkout = document.getElementById('page-workout');
    const pageWorkoutDetail = document.getElementById('page-workout-detail');
    const pageExercises = document.getElementById('page-exercises');
    const pageTriceps = document.getElementById('page-triceps');
    
    if (pageName === 'calendar') {
        if (pageCalendar) pageCalendar.style.display = 'block';
        if (pageWorkout) pageWorkout.style.display = 'none';
        if (pageWorkoutDetail) pageWorkoutDetail.style.display = 'none';
        if (pageExercises) pageExercises.style.display = 'none';
        if (pageTriceps) pageTriceps.style.display = 'none';
        currentPage = 'calendar';
        updateActiveNav('nav-training');
    } else if (pageName === 'workout') {
        if (pageCalendar) pageCalendar.style.display = 'none';
        if (pageWorkout) pageWorkout.style.display = 'block';
        if (pageWorkoutDetail) pageWorkoutDetail.style.display = 'none';
        if (pageExercises) pageExercises.style.display = 'none';
        if (pageTriceps) pageTriceps.style.display = 'none';
        currentPage = 'workout';
        updateActiveNav('nav-training');
        renderWorkoutsList();
    } else if (pageName === 'workout-detail') {
        if (pageCalendar) pageCalendar.style.display = 'none';
        if (pageWorkout) pageWorkout.style.display = 'none';
        if (pageWorkoutDetail) pageWorkoutDetail.style.display = 'block';
        if (pageExercises) pageExercises.style.display = 'none';
        if (pageTriceps) pageTriceps.style.display = 'none';
        currentPage = 'workout-detail';
    } else if (pageName === 'exercises') {
        if (pageCalendar) pageCalendar.style.display = 'none';
        if (pageWorkout) pageWorkout.style.display = 'none';
        if (pageWorkoutDetail) pageWorkoutDetail.style.display = 'none';
        if (pageExercises) pageExercises.style.display = 'block';
        if (pageTriceps) pageTriceps.style.display = 'none';
        currentPage = 'exercises';
        updateActiveNav('nav-exercises');
    } else if (pageName === 'triceps') {
        if (pageCalendar) pageCalendar.style.display = 'none';
        if (pageWorkout) pageWorkout.style.display = 'none';
        if (pageWorkoutDetail) pageWorkoutDetail.style.display = 'none';
        if (pageExercises) pageExercises.style.display = 'none';
        if (pageTriceps) pageTriceps.style.display = 'block';
        currentPage = 'triceps';
    }
}

function openWorkoutPage(date) {
    selectedDate = date;
    showPage('workout');
}

// ==================== МОДАЛЬНОЕ ОКНО ====================

function setupModal() {
    const addBtn = document.getElementById('add-workout-btn');
    const modal = document.getElementById('workout-modal');
    const cancelBtn = document.getElementById('cancel-workout-btn');
    const confirmBtn = document.getElementById('confirm-workout-btn');
    const workoutName = document.getElementById('workout-name');
    const modalTitle = document.getElementById('modal-title');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (modal) {
                if (modalTitle) modalTitle.textContent = 'Создать тренировку';
                if (workoutName) workoutName.value = '';
                const daySelect = document.getElementById('workout-day');
                if (daySelect) daySelect.value = 'any';
                
                confirmBtn.onclick = () => {
                    const name = workoutName ? workoutName.value.trim() : '';
                    const daySelect = document.getElementById('workout-day');
                    const day = daySelect ? daySelect.value : 'any';
                    
                    if (addWorkout(name, day)) {
                        if (modal) modal.style.display = 'none';
                        renderWorkoutsList();
                    }
                };
                
                modal.style.display = 'flex';
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// ==================== ФУНКЦИИ КАЛЕНДАРЯ ====================

function initCalendar() {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonthIndex = today.getMonth();
    
    generateYearMonths(currentYear);
    
    const resetBtn = document.getElementById('reset-calendar-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            scrollToCurrentMonth();
        });
    }
}

function setInitialPositionToCurrentMonth() {
    const scrollContainer = document.getElementById('calendar-scroll');
    if (!scrollContainer) return;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const monthElement = document.getElementById(`month-${currentYear}-${currentMonth}`);
    if (monthElement) {
        const monthElementTop = monthElement.offsetTop;
        const scrollContainerHeight = scrollContainer.clientHeight;
        const monthElementHeight = monthElement.offsetHeight;
        
        const scrollTo = monthElementTop - (scrollContainerHeight / 2) + (monthElementHeight / 2);
        
        scrollContainer.scrollTop = Math.max(0, scrollTo);
        
        updateMonthHeader();
    }
}

function getWeeksInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    const daysInMonth = lastDay.getDate();
    const totalDays = startDay + daysInMonth;
    const weeks = Math.ceil(totalDays / 7);
    
    return weeks;
}

function calculateWindowHeightForMonth(year, month) {
    const weeks = getWeeksInMonth(year, month);
    
    const weekdaysHeight = 45;
    const dayCellHeight = 48;
    const padding = 16;
    
    const height = weekdaysHeight + (weeks * dayCellHeight) + padding;
    
    return height;
}

function adjustWindowHeight() {
    const scrollContainer = document.getElementById('calendar-scroll');
    const calendarWindow = document.getElementById('calendar-window');
    
    if (!scrollContainer || !calendarWindow) return;
    
    const scrollTop = scrollContainer.scrollTop;
    let centerMonth = null;
    
    for (let i = 0; i < monthsData.length; i++) {
        const monthElement = monthsData[i].element;
        const offsetTop = monthElement.offsetTop;
        const offsetBottom = offsetTop + monthElement.offsetHeight;
        const viewportCenter = scrollTop + (scrollContainer.clientHeight / 2);
        
        if (viewportCenter >= offsetTop && viewportCenter <= offsetBottom) {
            centerMonth = monthsData[i];
            break;
        }
    }
    
    if (centerMonth) {
        const height = calculateWindowHeightForMonth(centerMonth.year, centerMonth.month);
        calendarWindow.style.height = height + 'px';
    }
}

function generateYearMonths(year) {
    const monthsContainer = document.getElementById('calendar-months');
    if (!monthsContainer) return;
    
    monthsContainer.innerHTML = '';
    monthsData = [];
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        monthContainer.id = `month-${year}-${month}`;
        
        const calendarDiv = document.createElement('div');
        calendarDiv.className = 'calendar';
        
        const weekdaysDiv = document.createElement('div');
        weekdaysDiv.className = 'calendar-weekdays';
        const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
        weekdays.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            weekdaysDiv.appendChild(dayDiv);
        });
        
        const daysDiv = document.createElement('div');
        daysDiv.className = 'calendar-days';
        
        generateMonthDays(year, month, daysDiv);
        
        calendarDiv.appendChild(weekdaysDiv);
        calendarDiv.appendChild(daysDiv);
        monthContainer.appendChild(calendarDiv);
        monthsContainer.appendChild(monthContainer);
        
        monthsData.push({
            year: year,
            month: month,
            element: monthContainer,
            weeksCount: getWeeksInMonth(year, month)
        });
    }
    
    updateMonthHeader();
    
    setTimeout(() => {
        adjustWindowHeight();
    }, 50);
}

function generateMonthDays(year, month, container) {
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    let startDay = firstDayOfMonth.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    container.innerHTML = '';
    
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        emptyDay.textContent = '';
        container.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        
        if (day === today.getDate() && 
            month === today.getMonth() && 
            year === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            openWorkoutPage(dateStr);
        });
        
        container.appendChild(dayElement);
    }
}

function updateMonthHeader() {
    const scrollContainer = document.getElementById('calendar-scroll');
    if (!scrollContainer) return;
    
    const monthHeader = document.getElementById('current-month');
    if (!monthHeader) return;
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    const scrollTop = scrollContainer.scrollTop;
    let currentMonth = null;
    let closestDistance = Infinity;
    
    for (let i = 0; i < monthsData.length; i++) {
        const monthElement = monthsData[i].element;
        const offsetTop = monthElement.offsetTop;
        const offsetBottom = offsetTop + monthElement.offsetHeight;
        const viewportCenter = scrollTop + (scrollContainer.clientHeight / 2);
        
        if (viewportCenter >= offsetTop && viewportCenter <= offsetBottom) {
            currentMonth = monthsData[i];
            break;
        }
        
        const distanceToTop = Math.abs(viewportCenter - offsetTop);
        const distanceToBottom = Math.abs(viewportCenter - offsetBottom);
        const minDistance = Math.min(distanceToTop, distanceToBottom);
        
        if (minDistance < closestDistance) {
            closestDistance = minDistance;
            currentMonth = monthsData[i];
        }
    }
    
    if (currentMonth) {
        monthHeader.textContent = `${monthNames[currentMonth.month]} ${currentMonth.year}`;
        adjustWindowHeight();
    }
}

function scrollToCurrentMonth() {
    const scrollContainer = document.getElementById('calendar-scroll');
    if (!scrollContainer) return;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const monthElement = document.getElementById(`month-${currentYear}-${currentMonth}`);
    if (monthElement) {
        const monthElementTop = monthElement.offsetTop;
        const scrollContainerHeight = scrollContainer.clientHeight;
        const monthElementHeight = monthElement.offsetHeight;
        
        const scrollTo = monthElementTop - (scrollContainerHeight / 2) + (monthElementHeight / 2);
        
        scrollContainer.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            updateMonthHeader();
        }, 300);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Добавляем обработчик скролла
setTimeout(() => {
    const scrollContainer = document.getElementById('calendar-scroll');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', () => {
            updateMonthHeader();
        });
    }
}, 200);
