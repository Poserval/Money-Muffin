// PWA Functionality
let deferredPrompt;

// Регистрация сервис-воркера
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Обработчик события установки PWA
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('Before install prompt fired');
    
    // Предотвращаем автоматическое отображение подсказки
    e.preventDefault();
    
    // Сохраняем событие для использования позже
    deferredPrompt = e;
    
    // Активируем кнопку установки
    installBtn.disabled = false;
    installBtn.title = "Установить приложение";
    
    console.log('Install button activated');
});

// Обработчик клика по кнопке установки
installBtn.addEventListener('click', async () => {
    console.log('Install button clicked');
    
    if (deferredPrompt) {
        // Показываем подсказку установки
        deferredPrompt.prompt();
        
        // Ждем ответа пользователя
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // Очищаем сохраненное событие
        deferredPrompt = null;
        
        // Скрываем кнопку установки
        installBtn.disabled = true;
        installBtn.style.display = 'none';
    }
});

// Отслеживание успешной установки
window.addEventListener('appinstalled', (evt) => {
    console.log('PWA was installed successfully');
    installBtn.style.display = 'none';
});

// Данные приложения
let wallets = [];
let currentSort = 'amount';
let sortDirection = 'desc';
let selectedCurrency = 'RUB';
let isDragging = false;
let draggedWalletId = null;

// Константы для анимаций и таймаутов
const ANIMATION_DURATION = 150;
const TOUCH_DELAY = 200;
const TOUCH_THRESHOLD = 10;

// Символы валют
const currencySymbols = {
    'RUB': '₽',
    'USD': '$',
    'EUR': '€',
    'CNY': '¥',
    'JPY': '¥'
};

// Названия валют
const currencyNames = {
    'RUB': 'Рубль',
    'USD': 'Доллар', 
    'EUR': 'Евро',
    'CNY': 'Юань',
    'JPY': 'Йена'
};

// Цвета радуги + черный и серый
const walletColors = [
    '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6',
    '#FF2D55', '#AF52DE', '#1D1D1F', '#8E8E93'
];

// DOM элементы
const walletsContainer = document.getElementById('walletsContainer');
const addWalletBtn = document.getElementById('addWalletBtn');
const addWalletModal = document.getElementById('addWalletModal');
const cancelBtn = document.getElementById('cancelBtn');
const walletForm = document.getElementById('walletForm');
const sortButtons = document.querySelectorAll('.sort-btn');
const totalBalanceElement = document.getElementById('totalBalance');
const balanceChangeElement = document.getElementById('balanceChange');
const colorOptions = document.getElementById('colorOptions');
const resetChangeBtn = document.getElementById('resetChangeBtn');
const shareBtn = document.getElementById('shareBtn');
const installBtn = document.getElementById('installBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const selectedCurrencyElement = document.getElementById('selectedCurrency');

// Начальные данные с порядком
const initialWallets = [
    {
        id: 1,
        name: "ДомРФ (вклад)",
        amount: 1000000,
        currency: "RUB",
        type: "deposit",
        lastUpdate: "2025-10-25",
        color: '#007AFF',
        pinned: false,
        order: 1
    },
    {
        id: 2, 
        name: "Сбер (Вклад)",
        amount: 100000.25,
        currency: "RUB",
        type: "deposit",
        lastUpdate: "2025-10-25",
        color: '#4CD964',
        pinned: false,
        order: 2
    },
    {
        id: 3,
        name: "Наличка",
        amount: 240.75,
        currency: "RUB", 
        type: "cash",
        lastUpdate: "2025-10-31",
        color: '#FFCC00',
        pinned: false,
        order: 3
    },
    {
        id: 4,
        name: "ВТБ (кредитка)",
        amount: -25000,
        currency: "RUB",
        type: "credit",
        lastUpdate: "2025-10-25",
        color: '#FF3B30',
        pinned: false,
        order: 4
    },
    {
        id: 5,
        name: "Альфа банк (кредитка)",
        amount: -50000.15,
        currency: "RUB",
        type: "credit", 
        lastUpdate: "2025-10-25",
        color: '#FF9500',
        pinned: false,
        order: 5
    },
    {
        id: 6,
        name: "Долларовый счет",
        amount: 1500.99,
        currency: "USD",
        type: "account",
        lastUpdate: "2025-10-25",
        color: '#5AC8FA',
        pinned: false,
        order: 6
    }
];

// Переменные для баланса - теперь для каждой валюты отдельно
let previousBalances = {
    'RUB': 1025240.85,
    'USD': 0,
    'EUR': 0,
    'CNY': 0,
    'JPY': 0
};

let balanceChanges = {
    'RUB': -13767.45,
    'USD': 0,
    'EUR': 0,
    'CNY': 0,
    'JPY': 0
};

let showBalanceChanges = {
    'RUB': true,
    'USD': false,
    'EUR': false,
    'CNY': false,
    'JPY': false
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initColorOptions();
    loadWallets();
    setupEventListeners();
});

// Инициализация выбора цвета
function initColorOptions() {
    colorOptions.innerHTML = '';
    
    walletColors.forEach((color, index) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;
        
        if (color === '#FFCC00' || color === '#4CD964' || color === '#5AC8FA') {
            colorOption.style.border = '1px solid #e5e5e7';
        }
        
        if (index === 0) {
            colorOption.classList.add('selected');
        }
        
        colorOption.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
        
        colorOptions.appendChild(colorOption);
    });
}

// Получение выбранного цвета
function getSelectedColor() {
    const selected = document.querySelector('.color-option.selected');
    return selected ? selected.dataset.color : walletColors[0];
}

// Получение списка валют, в которых есть кошельки
function getAvailableCurrencies() {
    const currencies = new Set();
    wallets.forEach(wallet => {
        currencies.add(wallet.currency);
    });
    return Array.from(currencies);
}

// Загрузка данных
function loadWallets() {
    try {
        const savedWallets = localStorage.getItem('moneyMuffinWallets');
        const savedPreviousBalances = localStorage.getItem('moneyMuffinPreviousBalances');
        const savedBalanceChanges = localStorage.getItem('moneyMuffinBalanceChanges');
        const savedShowChanges = localStorage.getItem('moneyMuffinShowChanges');
        const savedSort = localStorage.getItem('moneyMuffinSort');
        const savedSortDirection = localStorage.getItem('moneyMuffinSortDirection');
        const savedCurrency = localStorage.getItem('moneyMuffinSelectedCurrency');
        
        if (savedPreviousBalances) previousBalances = JSON.parse(savedPreviousBalances);
        if (savedBalanceChanges) balanceChanges = JSON.parse(savedBalanceChanges);
        if (savedShowChanges) showBalanceChanges = JSON.parse(savedShowChanges);
        if (savedSort) currentSort = savedSort;
        if (savedSortDirection) sortDirection = savedSortDirection;
        if (savedCurrency) selectedCurrency = savedCurrency;
        
        if (savedWallets && JSON.parse(savedWallets).length > 0) {
            wallets = JSON.parse(savedWallets);
        } else {
            wallets = [...initialWallets];
            // Инициализируем предыдущие балансы на основе начальных данных
            initializePreviousBalances();
            saveWallets();
        }
        
        // Проверяем, что выбранная валюта существует в кошельках
        const availableCurrencies = getAvailableCurrencies();
        if (!availableCurrencies.includes(selectedCurrency)) {
            selectedCurrency = availableCurrencies[0] || 'RUB';
        }
        
        updateCurrencyDisplay();
        updateSortButtons();
        renderWallets();
        updateTotalBalance();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        wallets = [...initialWallets];
        initializePreviousBalances();
        updateCurrencyDisplay();
        renderWallets();
        updateTotalBalance();
    }
}

// Инициализация предыдущих балансов
function initializePreviousBalances() {
    const availableCurrencies = getAvailableCurrencies();
    availableCurrencies.forEach(currency => {
        const currentBalance = getTotalBalanceInCurrency(currency);
        previousBalances[currency] = currentBalance;
        balanceChanges[currency] = 0;
        showBalanceChanges[currency] = false;
    });
    // Для рубля устанавливаем начальное изменение
    balanceChanges['RUB'] = -13767.45;
    showBalanceChanges['RUB'] = true;
}

// Сохранение данных
function saveWallets() {
    localStorage.setItem('moneyMuffinWallets', JSON.stringify(wallets));
    localStorage.setItem('moneyMuffinPreviousBalances', JSON.stringify(previousBalances));
    localStorage.setItem('moneyMuffinBalanceChanges', JSON.stringify(balanceChanges));
    localStorage.setItem('moneyMuffinShowChanges', JSON.stringify(showBalanceChanges));
    localStorage.setItem('moneyMuffinSort', currentSort);
    localStorage.setItem('moneyMuffinSortDirection', sortDirection);
    localStorage.setItem('moneyMuffinSelectedCurrency', selectedCurrency);
}

// Настройка обработчиков событий
function setupEventListeners() {
    addWalletBtn.addEventListener('click', () => {
        addWalletModal.classList.add('active');
        // Сбрасываем форму при открытии
        walletForm.reset();
        // Устанавливаем обработчик для добавления кошелька
        walletForm.onsubmit = handleAddWallet;
    });

    cancelBtn.addEventListener('click', () => {
        addWalletModal.classList.remove('active');
        walletForm.reset();
        // Сбрасываем обработчик
        walletForm.onsubmit = null;
    });

    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortType = btn.dataset.sort;
            handleSortClick(sortType);
        });
    });

    addWalletModal.addEventListener('click', (e) => {
        if (e.target === addWalletModal) {
            addWalletModal.classList.remove('active');
            walletForm.reset();
            // Сбрасываем обработчик
            walletForm.onsubmit = null;
        }
    });

    resetChangeBtn.addEventListener('click', resetBalanceChange);
    shareBtn.addEventListener('click', shareApp);
    clearAllBtn.addEventListener('click', showClearAllConfirmation);
    confirmCancelBtn.addEventListener('click', hideClearAllConfirmation);
    confirmDeleteBtn.addEventListener('click', clearAllData);
    
    // Обработчик для переключения валюты - простой клик
    selectedCurrencyElement.addEventListener('click', toggleCurrency);
    
    // Закрытие модальных окон при клике вне их
    document.addEventListener('click', (e) => {
        if (!addWalletModal.contains(e.target) && e.target !== addWalletBtn) {
            addWalletModal.classList.remove('active');
            walletForm.reset();
            // Сбрасываем обработчик
            walletForm.onsubmit = null;
        }
        if (!confirmModal.contains(e.target) && e.target !== clearAllBtn) {
            confirmModal.classList.remove('active');
        }
    });

    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            hideClearAllConfirmation();
        }
    });
}

// Переключение валюты по клику
function toggleCurrency() {
    const availableCurrencies = getAvailableCurrencies();
    if (availableCurrencies.length <= 1) {
        return; // Не переключаем если только одна валюта
    }
    
    // Находим текущий индекс валюты
    const currentIndex = availableCurrencies.indexOf(selectedCurrency);
    
    // Переключаем на следующую валюту по кругу
    const nextIndex = (currentIndex + 1) % availableCurrencies.length;
    const nextCurrency = availableCurrencies[nextIndex];
    
    // Анимация смены иконки
    selectedCurrencyElement.classList.add('changing');
    
    setTimeout(() => {
        selectedCurrency = nextCurrency;
        updateCurrencyDisplay();
        updateTotalBalance();
        saveWallets();
        
        // Завершаем анимацию
        setTimeout(() => {
            selectedCurrencyElement.classList.remove('changing');
        }, 100);
    }, ANIMATION_DURATION);
}

function updateCurrencyDisplay() {
    selectedCurrencyElement.textContent = currencySymbols[selectedCurrency];
    selectedCurrencyElement.title = currencyNames[selectedCurrency];
}

// Обработка сортировки
function handleSortClick(sortType) {
    if (currentSort === sortType) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort = sortType;
        sortDirection = sortType === 'name' ? 'asc' : 'desc';
    }
    
    setSort(currentSort, sortDirection);
}

// Обновление кнопок сортировки
function updateSortButtons() {
    sortButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.sort === currentSort) {
            btn.classList.add('active');
        }
        
        if (btn.dataset.sort === 'name') {
            btn.textContent = currentSort === 'name' ? 
                (sortDirection === 'asc' ? 'Имя ▲' : 'Имя ▼') : 'Имя';
        } else if (btn.dataset.sort === 'amount') {
            btn.textContent = currentSort === 'amount' ? 
                (sortDirection === 'asc' ? 'Сумма ▲' : 'Сумма ▼') : 'Сумма';
        }
    });
}

// Сброс изменения баланса для текущей валюты
function resetBalanceChange() {
    balanceChanges[selectedCurrency] = 0;
    showBalanceChanges[selectedCurrency] = false;
    updateTotalBalance();
}

// Добавление кошелька
function handleAddWallet(e) {
    e.preventDefault();
    
    const name = document.getElementById('walletName').value;
    const amountInput = document.getElementById('walletAmount').value;
    const currency = document.getElementById('walletCurrency').value;
    const type = document.getElementById('walletType').value;
    const color = getSelectedColor();

    if (amountInput.trim() === '') {
        alert('Пожалуйста, введите сумму');
        return false;
    }

    const amount = parseFloat(amountInput);
    if (isNaN(amount)) {
        alert('Пожалуйста, введите корректную сумму');
        return false;
    }

    // Сохраняем предыдущий баланс для валюты нового кошелька
    const oldBalance = getTotalBalanceInCurrency(currency);

    // Находим максимальный order для новой валюты
    const maxOrder = wallets
        .filter(w => w.currency === currency)
        .reduce((max, w) => Math.max(max, w.order), 0);

    const newWallet = {
        id: Date.now(),
        name: name,
        amount: amount,
        currency: currency,
        type: type,
        color: color,
        lastUpdate: new Date().toISOString().split('T')[0],
        pinned: false,
        order: maxOrder + 1
    };

    wallets.push(newWallet);
    
    // Рассчитываем изменение для валюты нового кошелька
    const newBalance = getTotalBalanceInCurrency(currency);
    const change = newBalance - oldBalance;
    
    // Обновляем данные изменения для этой валюты
    balanceChanges[currency] = change;
    showBalanceChanges[currency] = change !== 0;
    
    saveWallets();
    renderWallets();
    updateTotalBalance();
    
    addWalletModal.classList.remove('active');
    walletForm.reset();
    // Сбрасываем обработчик после успешного сохранения
    walletForm.onsubmit = null;
    alert('Кошелек создан');
    
    return false;
}

// Получение общего баланса в конкретной валюте
function getTotalBalanceInCurrency(currency) {
    return wallets
        .filter(wallet => wallet.currency === currency)
        .reduce((sum, wallet) => sum + wallet.amount, 0);
}

// Получение общего баланса в выбранной валюте
function getTotalBalanceInSelectedCurrency() {
    return getTotalBalanceInCurrency(selectedCurrency);
}

// Установка сортировки
function setSort(sortType, direction) {
    currentSort = sortType;
    sortDirection = direction;
    updateSortButtons();
    renderWallets();
}

// Отображение кошельков
function renderWallets() {
    const sortedWallets = getSortedWallets();
    const groupedWallets = groupWalletsByCurrency(sortedWallets);
    
    walletsContainer.innerHTML = '';

    const currencyOrder = ['RUB', 'USD', 'EUR', 'CNY', 'JPY'];
    
    for (const currency of currencyOrder) {
        const currencyWallets = groupedWallets[currency];
        if (currencyWallets.length > 0) {
            const currencySection = createCurrencySection(currency, currencyWallets);
            walletsContainer.appendChild(currencySection);
        }
    }
}

// Получение отсортированных кошельков
function getSortedWallets() {
    return [...wallets].sort((a, b) => {
        // Сначала закрепленные кошельки
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        // Кошельки разной валюты - группируем по валюте
        if (a.currency !== b.currency) {
            return a.currency.localeCompare(b.currency);
        }
        
        // Если включена пользовательская сортировка (по order)
        if (currentSort === 'custom') {
            return a.order - b.order;
        }
        
        // Если сортировка по имени или сумме
        let result = 0;
        if (currentSort === 'name') {
            result = a.name.localeCompare(b.name);
        } else if (currentSort === 'amount') {
            result = a.amount - b.amount;
        }
        
        return sortDirection === 'asc' ? result : -result;
    });
}

// Группировка кошельков по валюте
function groupWalletsByCurrency(walletsArray) {
    const grouped = {
        'RUB': [],
        'USD': [],
        'EUR': [],
        'CNY': [],
        'JPY': []
    };
    
    walletsArray.forEach(wallet => {
        if (grouped[wallet.currency]) {
            grouped[wallet.currency].push(wallet);
        }
    });
    
    return grouped;
}

// Создание секции валюты
function createCurrencySection(currency, wallets) {
    const section = document.createElement('div');
    section.className = 'currency-section';

    const title = document.createElement('h3');
    title.className = 'currency-title';
    title.textContent = getCurrencyName(currency);
    
    section.appendChild(title);

    const walletsGrid = document.createElement('div');
    walletsGrid.className = 'wallets-grid';
    walletsGrid.dataset.currency = currency;
    
    wallets.forEach((wallet, index) => {
        const walletElement = createWalletElement(wallet, index);
        walletsGrid.appendChild(walletElement);
    });

    section.appendChild(walletsGrid);
    return section;
}

// Создание элемента кошелька
function createWalletElement(wallet, index) {
    const walletDiv = document.createElement('div');
    walletDiv.className = `wallet-item ${wallet.pinned ? 'pinned' : ''}`;
    walletDiv.style.setProperty('--wallet-color', wallet.color);
    walletDiv.dataset.walletId = wallet.id;
    walletDiv.dataset.currency = wallet.currency;
    walletDiv.dataset.index = index;
    
    // Добавляем атрибут для перетаскивания
    if (!wallet.pinned) {
        walletDiv.setAttribute('draggable', 'true');
    }

    const amountClass = wallet.amount >= 0 ? 'positive' : 'negative';
    const amountFormatted = formatAmount(wallet.amount, wallet.currency);
    const dateFormatted = formatDate(wallet.lastUpdate);

    walletDiv.innerHTML = `
        <div class="wallet-content">
            <div class="wallet-name">${wallet.name} ${wallet.pinned ? '📌' : ''}</div>
            <div class="wallet-amount ${amountClass}">${amountFormatted}</div>
            <div class="wallet-date">Изм: ${dateFormatted}</div>
        </div>
        <div class="wallet-actions">
            <button class="wallet-action-btn" title="Редактировать">✏️</button>
            <button class="wallet-action-btn" title="Копировать">📋</button>
            <button class="wallet-action-btn" title="${wallet.pinned ? 'Открепить' : 'Закрепить'}">${wallet.pinned ? '📌' : '📍'}</button>
            <button class="wallet-action-btn" title="Удалить">🗑️</button>
        </div>
    `;

    const deleteBtn = walletDiv.querySelector('.wallet-actions button:nth-child(4)');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteWallet(wallet.id);
    });

    const editBtn = walletDiv.querySelector('.wallet-actions button:nth-child(1)');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editWallet(wallet.id);
    });

    const copyBtn = walletDiv.querySelector('.wallet-actions button:nth-child(2)');
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyWallet(wallet.id);
    });

    const pinBtn = walletDiv.querySelector('.wallet-actions button:nth-child(3)');
    pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePinWallet(wallet.id);
    });

    // Добавляем обработчики для перетаскивания (только для незакрепленных кошельков)
    if (!wallet.pinned) {
        setupDragAndDrop(walletDiv, wallet.id);
    }

    return walletDiv;
}

// Настройка перетаскивания для кошелька
function setupDragAndDrop(walletElement, walletId) {
    // Начало перетаскивания
    walletElement.addEventListener('dragstart', (e) => {
        if (e.target.closest('.wallet-actions')) {
            e.preventDefault();
            return;
        }
        
        isDragging = true;
        draggedWalletId = walletId;
        walletElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', walletId);
    });

    // Перетаскивание над другим элементом
    walletElement.addEventListener('dragover', (e) => {
        if (!isDragging || walletElement.dataset.walletId == draggedWalletId) return;
        
        e.preventDefault();
        walletElement.classList.add('drag-over');
    });

    // Выход из элемента при перетаскивании
    walletElement.addEventListener('dragleave', (e) => {
        walletElement.classList.remove('drag-over');
    });

    // Бросание элемента
    walletElement.addEventListener('drop', (e) => {
        e.preventDefault();
        walletElement.classList.remove('drag-over');
        
        if (!isDragging || !draggedWalletId) return;
        
        const targetWalletId = walletElement.dataset.walletId;
        if (targetWalletId == draggedWalletId) return;
        
        // Находим кошельки
        const draggedWallet = wallets.find(w => w.id == draggedWalletId);
        const targetWallet = wallets.find(w => w.id == targetWalletId);
        
        // Проверяем, что кошельки в одной валюте
        if (!draggedWallet || !targetWallet || draggedWallet.currency !== targetWallet.currency) return;
        
        // Перемещаем кошелек
        moveWalletInArray(draggedWalletId, targetWalletId);
    });

    // Конец перетаскивания
    walletElement.addEventListener('dragend', (e) => {
        isDragging = false;
        draggedWalletId = null;
        
        // Убираем классы со всех элементов
        document.querySelectorAll('.wallet-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });
    });

    // Обработка касаний для мобильных устройств
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchDragging = false;
    let touchTimeout = null;

    walletElement.addEventListener('touchstart', (e) => {
        if (e.target.closest('.wallet-actions')) return;
        
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isTouchDragging = true;
        
        touchTimeout = setTimeout(() => {
            if (isTouchDragging) {
                walletElement.classList.add('dragging');
                isDragging = true;
                draggedWalletId = walletId;
            }
        }, TOUCH_DELAY);
    });

    walletElement.addEventListener('touchmove', (e) => {
        if (!isTouchDragging || !isDragging) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Если перемещение достаточно большое, начинаем перетаскивание
        if (Math.abs(deltaX) > TOUCH_THRESHOLD || Math.abs(deltaY) > TOUCH_THRESHOLD) {
            walletElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
    });

    walletElement.addEventListener('touchend', (e) => {
        isTouchDragging = false;
        clearTimeout(touchTimeout);
        
        if (isDragging) {
            walletElement.style.transform = '';
            walletElement.classList.remove('dragging');
            
            // Находим элемент под пальцем
            const touch = e.changedTouches[0];
            const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
            const targetWallet = elements.find(el => el.classList.contains('wallet-item') && el.dataset.walletId != walletId);
            
            if (targetWallet) {
                const targetWalletId = targetWallet.dataset.walletId;
                const draggedWallet = wallets.find(w => w.id == draggedWalletId);
                const targetWalletObj = wallets.find(w => w.id == targetWalletId);
                
                if (draggedWallet && targetWalletObj && draggedWallet.currency === targetWalletObj.currency) {
                    moveWalletInArray(draggedWalletId, targetWalletId);
                }
            }
            
            isDragging = false;
            draggedWalletId = null;
            
            // Убираем классы со всех элементов
            document.querySelectorAll('.wallet-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        }
    });
}

// Перемещение кошелька в массиве с обновлением порядка
function moveWalletInArray(draggedWalletId, targetWalletId) {
    const draggedWallet = wallets.find(w => w.id == draggedWalletId);
    const targetWallet = wallets.find(w => w.id == targetWalletId);
    
    if (!draggedWallet || !targetWallet) return;
    
    // Получаем все кошельки той же валюты
    const sameCurrencyWallets = wallets.filter(w => w.currency === draggedWallet.currency && !w.pinned);
    const targetIndex = sameCurrencyWallets.findIndex(w => w.id == targetWalletId);
    const draggedIndex = sameCurrencyWallets.findIndex(w => w.id == draggedWalletId);
    
    if (targetIndex === -1 || draggedIndex === -1) return;
    
    // Обновляем порядок всех кошельков в валюте
    sameCurrencyWallets.splice(draggedIndex, 1);
    sameCurrencyWallets.splice(targetIndex, 0, draggedWallet);
    
    // Присваиваем новые порядковые номера
    sameCurrencyWallets.forEach((wallet, index) => {
        wallet.order = index + 1;
    });
    
    // Включаем пользовательскую сортировку
    currentSort = 'custom';
    updateSortButtons();
    
    saveWallets();
    renderWallets();
}

// Действия с кошельками
function deleteWallet(walletId) {
    if (confirm('Удалить этот кошелек?')) {
        const wallet = wallets.find(w => w.id === walletId);
        if (!wallet) return;

        const currency = wallet.currency;
        const oldBalance = getTotalBalanceInCurrency(currency);

        wallets = wallets.filter(wallet => wallet.id !== walletId);
        
        const newBalance = getTotalBalanceInCurrency(currency);
        const change = newBalance - oldBalance;
        
        // Обновляем изменение для валюты удаленного кошелька
        balanceChanges[currency] = change;
        showBalanceChanges[currency] = change !== 0;
        
        saveWallets();
        renderWallets();
        updateTotalBalance();
    }
}

function editWallet(walletId) {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    document.getElementById('walletName').value = wallet.name;
    document.getElementById('walletAmount').value = wallet.amount;
    document.getElementById('walletCurrency').value = wallet.currency;
    document.getElementById('walletType').value = wallet.type;

    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === wallet.color) {
            opt.classList.add('selected');
        }
    });

    addWalletModal.classList.add('active');

    // Устанавливаем обработчик для редактирования
    walletForm.onsubmit = function(e) {
        e.preventDefault();
        
        const name = document.getElementById('walletName').value;
        const amountInput = document.getElementById('walletAmount').value;
        const currency = document.getElementById('walletCurrency').value;
        const type = document.getElementById('walletType').value;
        const color = getSelectedColor();

        if (amountInput.trim() === '') {
            alert('Пожалуйста, введите сумму');
            return false;
        }

        const amount = parseFloat(amountInput);
        if (isNaN(amount)) {
            alert('Пожалуйста, введите корректную сумму');
            return false;
        }

        const oldBalance = getTotalBalanceInCurrency(currency);
        
        wallet.name = name;
        wallet.amount = amount;
        wallet.currency = currency;
        wallet.type = type;
        wallet.color = color;
        wallet.lastUpdate = new Date().toISOString().split('T')[0];
        
        const newBalance = getTotalBalanceInCurrency(currency);
        const change = newBalance - oldBalance;
        
        // Обновляем изменение для валюты измененного кошелька
        balanceChanges[currency] = change;
        showBalanceChanges[currency] = change !== 0;
        
        saveWallets();
        renderWallets();
        updateTotalBalance();
        
        addWalletModal.classList.remove('active');
        walletForm.reset();
        // Сбрасываем обработчик после успешного сохранения
        walletForm.onsubmit = null;
        alert('Изменения внесены');
        
        return false;
    };
}

function copyWallet(walletId) {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
        const currency = wallet.currency;
        const oldBalance = getTotalBalanceInCurrency(currency);

        // Находим максимальный order для валюты
        const maxOrder = wallets
            .filter(w => w.currency === currency)
            .reduce((max, w) => Math.max(max, w.order), 0);

        const copiedWallet = {
            ...wallet,
            id: Date.now(),
            name: `${wallet.name} (копия)`,
            pinned: false,
            order: maxOrder + 1
        };
        wallets.push(copiedWallet);
        
        const newBalance = getTotalBalanceInCurrency(currency);
        const change = newBalance - oldBalance;
        
        // Обновляем изменение для валюты скопированного кошелька
        balanceChanges[currency] = change;
        showBalanceChanges[currency] = change !== 0;
        
        saveWallets();
        renderWallets();
        updateTotalBalance();
    }
}

function togglePinWallet(walletId) {
    const walletIndex = wallets.findIndex(w => w.id === walletId);
    if (walletIndex !== -1) {
        wallets[walletIndex].pinned = !wallets[walletIndex].pinned;
        saveWallets();
        renderWallets();
        updateTotalBalance();
    }
}

// Обновление общего баланса
function updateTotalBalance() {
    const totalBalance = getTotalBalanceInSelectedCurrency();
    
    // Форматируем сумму общего баланса (без знака валюты)
    const formattedBalance = formatTotalBalance(totalBalance);
    
    // Обновляем отображение
    totalBalanceElement.textContent = formattedBalance;
    
    // Обновляем изменение баланса для текущей валюты
    const showChange = showBalanceChanges[selectedCurrency];
    const balanceChange = balanceChanges[selectedCurrency];
    
    if (showChange && balanceChange !== 0) {
        let changeText = '';
        if (balanceChange > 0) {
            changeText = `+${formatAmount(balanceChange, selectedCurrency)}`;
            balanceChangeElement.className = 'balance-change positive';
        } else if (balanceChange < 0) {
            changeText = `${formatAmount(balanceChange, selectedCurrency)}`;
            balanceChangeElement.className = 'balance-change negative';
        }
        
        balanceChangeElement.textContent = changeText;
        balanceChangeElement.style.display = 'block';
        resetChangeBtn.style.display = 'flex';
    } else {
        balanceChangeElement.style.display = 'none';
        resetChangeBtn.style.display = 'none';
    }
    
    saveWallets();
}

// Новые функции для кнопок действий
function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'Money Muffin',
            text: 'Учет финансов - просто и удобно!',
            url: window.location.href
        })
        .then(() => console.log('Успешный шаринг'))
        .catch((error) => {
            console.log('Ошибка шаринга:', error);
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
}

function fallbackShare() {
    const url = window.location.href;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
            .then(() => {
                alert('Ссылка скопирована в буфер обмена!');
            })
            .catch(() => {
                prompt('Скопируйте ссылку вручную:', url);
            });
    } else {
        prompt('Скопируйте ссылку вручную:', url);
    }
}

function showClearAllConfirmation() {
    confirmModal.classList.add('active');
}

function hideClearAllConfirmation() {
    confirmModal.classList.remove('active');
}

function clearAllData() {
    try {
        localStorage.removeItem('moneyMuffinWallets');
        localStorage.removeItem('moneyMuffinPreviousBalances');
        localStorage.removeItem('moneyMuffinBalanceChanges');
        localStorage.removeItem('moneyMuffinShowChanges');
        localStorage.removeItem('moneyMuffinSort');
        localStorage.removeItem('moneyMuffinSortDirection');
        localStorage.removeItem('moneyMuffinSelectedCurrency');
        
        wallets = [...initialWallets];
        initializePreviousBalances();
        currentSort = 'amount';
        sortDirection = 'desc';
        selectedCurrency = 'RUB';
        
        updateCurrencyDisplay();
        saveWallets();
        renderWallets();
        updateTotalBalance();
        updateSortButtons();
        hideClearAllConfirmation();
        
        alert('Все данные были успешно сброшены к начальному состоянию!');
        
    } catch (error) {
        console.error('Ошибка при удалении данных:', error);
        alert('Произошла ошибка при удалении данных. Попробуйте еще раз.');
    }
}

// Вспомогательные функции
function getCurrencyName(currency) {
    return currencyNames[currency] || currency;
}

// Форматирование суммы общего баланса (без знака валюты)
function formatTotalBalance(amount) {
    // Проверяем, есть ли копейки
    const hasDecimals = amount % 1 !== 0;
    
    // Форматируем число
    const formatter = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0
    });
    
    const formatted = formatter.format(Math.abs(amount));
    return `${amount < 0 ? '-' : ''}${formatted}`;
}

// Форматирование суммы для кошельков и изменения баланса (с знаком валюты)
function formatAmount(amount, currency) {
    // Проверяем, есть ли копейки
    const hasDecimals = amount % 1 !== 0;
    
    // Определяем количество знаков после запятой
    const decimalPlaces = currency === 'JPY' ? 0 : (hasDecimals ? 2 : 0);
    
    // Форматируем число
    const formatter = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
    });
    
    const formatted = formatter.format(Math.abs(amount));
    const symbol = currencySymbols[currency] || currency;
    
    return `${amount < 0 ? '-' : ''}${formatted} ${symbol}`;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }
        return date.toLocaleDateString('ru-RU');
    } catch (error) {
        return dateString;
    }
}
