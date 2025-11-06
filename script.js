// Данные приложения
let wallets = [];
let currentSort = 'amount';
let sortDirection = 'desc';
let selectedCurrency = 'RUB';
let isDragging = false;
let draggedWalletId = null;

// Константы
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

// Цвета кошельков
const walletColors = [
    '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6',
    '#FF2D55', '#AF52DE', '#1D1D1F', '#8E8E93'
];

// DOM элементы
let walletsContainer, addWalletBtn, addWalletModal, cancelBtn, walletForm;
let sortButtons, totalBalanceElement, balanceChangeElement, colorOptions;
let resetChangeBtn, shareBtn, installBtn, clearAllBtn, confirmModal;
let confirmCancelBtn, confirmDeleteBtn, selectedCurrencyElement;

// Начальные данные
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

// Балансы
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
    console.log('DOM loaded - initializing app');
    try {
        initDOMElements();
        initColorOptions();
        loadWallets();
        setupEventListeners();
        
        // В Capacitor отключаем PWA функции
        if (window.isCapacitor) {
            console.log('Capacitor detected - disabling PWA features');
            if (installBtn) installBtn.style.display = 'none';
        } else {
            initPWA();
        }
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error during app initialization:', error);
        // Fallback на начальные данные
        wallets = [...initialWallets];
        renderWallets();
        updateTotalBalance();
    }
});

// Инициализация DOM элементов
function initDOMElements() {
    console.log('Initializing DOM elements');
    
    const elements = {
        walletsContainer: 'walletsContainer',
        addWalletBtn: 'addWalletBtn',
        addWalletModal: 'addWalletModal',
        cancelBtn: 'cancelBtn',
        walletForm: 'walletForm',
        totalBalance: 'totalBalance',
        balanceChange: 'balanceChange',
        colorOptions: 'colorOptions',
        resetChangeBtn: 'resetChangeBtn',
        shareBtn: 'shareBtn',
        installBtn: 'installBtn',
        clearAllBtn: 'clearAllBtn',
        confirmModal: 'confirmModal',
        confirmCancelBtn: 'confirmCancelBtn',
        confirmDeleteBtn: 'confirmDeleteBtn',
        selectedCurrency: 'selectedCurrency'
    };

    // Безопасное получение элементов
    for (const [key, id] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Элемент с id "${id}" не найден`);
            continue;
        }
        
        switch(key) {
            case 'walletsContainer': walletsContainer = element; break;
            case 'addWalletBtn': addWalletBtn = element; break;
            case 'addWalletModal': addWalletModal = element; break;
            case 'cancelBtn': cancelBtn = element; break;
            case 'walletForm': walletForm = element; break;
            case 'totalBalance': totalBalanceElement = element; break;
            case 'balanceChange': balanceChangeElement = element; break;
            case 'colorOptions': colorOptions = element; break;
            case 'resetChangeBtn': resetChangeBtn = element; break;
            case 'shareBtn': shareBtn = element; break;
            case 'installBtn': installBtn = element; break;
            case 'clearAllBtn': clearAllBtn = element; break;
            case 'confirmModal': confirmModal = element; break;
            case 'confirmCancelBtn': confirmCancelBtn = element; break;
            case 'confirmDeleteBtn': confirmDeleteBtn = element; break;
            case 'selectedCurrency': selectedCurrencyElement = element; break;
        }
    }

    sortButtons = document.querySelectorAll('.sort-btn');
    console.log(`Found ${sortButtons.length} sort buttons`);
}

// PWA Functionality
function initPWA() {
    console.log('Initializing PWA functionality');
    
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('Before install prompt fired');
        e.preventDefault();
        deferredPrompt = e;
        
        if (installBtn) {
            installBtn.disabled = false;
            installBtn.title = "Установить приложение";
        }
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            console.log('Install button clicked');
            
            if (deferredPrompt) {
                try {
                    deferredPrompt.prompt();
                    const choiceResult = await deferredPrompt.userChoice;
                    
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install');
                        installBtn.style.display = 'none';
                        showInstallSuccess();
                    } else {
                        showInstallInstructions();
                    }
                } catch (error) {
                    console.log('Native prompt failed:', error);
                    showInstallInstructions();
                }
                
                deferredPrompt = null;
            } else {
                showInstallInstructions();
            }
        });
    }

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed successfully');
        if (installBtn) installBtn.style.display = 'none';
    });
}

// Функция показа инструкции по установке
function showInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
        instructions = `📱 Установка на iPhone/iPad:

1. Нажмите кнопку "Поделиться" ⎊ 
2. Прокрутите вниз и выберите "На экран «Домой»"
3. Нажмите "Добавить" в правом верхнем углу
4. Готово! Приложение появится на рабочем столе`;
    } else if (isAndroid) {
        instructions = `📱 Установка на Android:

Автоматическая установка не сработала 😔

Сделайте вручную:
1. Нажмите меню браузера (⋮ или ⋯)
2. Выберите "Установить приложение" 
3. Подтвердите установку
4. Готово! Приложение появится в списке приложений`;
    } else {
        instructions = `📱 Установка приложения:

1. В меню браузера найдите "Установить приложение"
2. Или используйте опцию "Добавить на рабочий стол"
3. Подтвердите установку
4. Готово! Приложение будет доступно оффлайн`;
    }
    
    alert(instructions);
}

// Функция показа успешной установки
function showInstallSuccess() {
    alert('🎉 Приложение успешно установлено!\n\nТеперь оно доступно на вашем рабочем столе и работает оффлайн.');
}

// Инициализация выбора цвета
function initColorOptions() {
    if (!colorOptions) return;
    
    colorOptions.innerHTML = '';
    
    walletColors.forEach((color, index) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;
        
        // Добавляем границу для светлых цветов
        if (['#FFCC00', '#4CD964', '#5AC8FA'].includes(color)) {
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

// Получение списка валют
function getAvailableCurrencies() {
    const currencies = new Set(wallets.map(wallet => wallet.currency));
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
        
        if (savedWallets) {
            const parsedWallets = JSON.parse(savedWallets);
            if (parsedWallets.length > 0) {
                wallets = parsedWallets;
            } else {
                wallets = [...initialWallets];
                initializePreviousBalances();
            }
        } else {
            wallets = [...initialWallets];
            initializePreviousBalances();
        }
        
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
    balanceChanges['RUB'] = -13767.45;
    showBalanceChanges['RUB'] = true;
}

// Сохранение данных
function saveWallets() {
    try {
        localStorage.setItem('moneyMuffinWallets', JSON.stringify(wallets));
        localStorage.setItem('moneyMuffinPreviousBalances', JSON.stringify(previousBalances));
        localStorage.setItem('moneyMuffinBalanceChanges', JSON.stringify(balanceChanges));
        localStorage.setItem('moneyMuffinShowChanges', JSON.stringify(showBalanceChanges));
        localStorage.setItem('moneyMuffinSort', currentSort);
        localStorage.setItem('moneyMuffinSortDirection', sortDirection);
        localStorage.setItem('moneyMuffinSelectedCurrency', selectedCurrency);
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Основные обработчики модальных окон
    if (addWalletBtn && addWalletModal) {
        addWalletBtn.addEventListener('click', () => {
            addWalletModal.classList.add('active');
            if (walletForm) {
                walletForm.reset();
                walletForm.onsubmit = handleAddWallet;
            }
        });
    }

    if (cancelBtn && addWalletModal) {
        cancelBtn.addEventListener('click', () => {
            addWalletModal.classList.remove('active');
            if (walletForm) walletForm.reset();
        });
    }

    // Обработчики сортировки
    if (sortButtons) {
        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const sortType = btn.dataset.sort;
                if (sortType) handleSortClick(sortType);
            });
        });
    }

    // Обработчики модальных окон
    if (addWalletModal) {
        addWalletModal.addEventListener('click', (e) => {
            if (e.target === addWalletModal) {
                addWalletModal.classList.remove('active');
                if (walletForm) walletForm.reset();
            }
        });
    }

    // Обработчики кнопок
    if (resetChangeBtn) resetChangeBtn.addEventListener('click', resetBalanceChange);
    if (shareBtn) shareBtn.addEventListener('click', shareApp);
    if (clearAllBtn) clearAllBtn.addEventListener('click', showClearAllConfirmation);
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', hideClearAllConfirmation);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', clearAllData);
    if (selectedCurrencyElement) selectedCurrencyElement.addEventListener('click', toggleCurrency);

    // Глобальные обработчики
    document.addEventListener('click', (e) => {
        if (addWalletModal && !addWalletModal.contains(e.target) && e.target !== addWalletBtn) {
            addWalletModal.classList.remove('active');
            if (walletForm) walletForm.reset();
        }
        if (confirmModal && !confirmModal.contains(e.target) && e.target !== clearAllBtn) {
            confirmModal.classList.remove('active');
        }
    });

    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) hideClearAllConfirmation();
        });
    }

    // Обработчик ошибок
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
    });
}

// Переключение валюты
function toggleCurrency() {
    const availableCurrencies = getAvailableCurrencies();
    if (availableCurrencies.length <= 1) return;
    
    const currentIndex = availableCurrencies.indexOf(selectedCurrency);
    const nextIndex = (currentIndex + 1) % availableCurrencies.length;
    selectedCurrency = availableCurrencies[nextIndex];
    
    if (selectedCurrencyElement) {
        selectedCurrencyElement.classList.add('changing');
        setTimeout(() => {
            updateCurrencyDisplay();
            updateTotalBalance();
            saveWallets();
            selectedCurrencyElement.classList.remove('changing');
        }, ANIMATION_DURATION);
    } else {
        updateCurrencyDisplay();
        updateTotalBalance();
        saveWallets();
    }
}

function updateCurrencyDisplay() {
    if (selectedCurrencyElement) {
        selectedCurrencyElement.textContent = currencySymbols[selectedCurrency];
        selectedCurrencyElement.title = currencyNames[selectedCurrency];
    }
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
    if (!sortButtons) return;
    
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

// Сброс изменения баланса
function resetBalanceChange() {
    balanceChanges[selectedCurrency] = 0;
    showBalanceChanges[selectedCurrency] = false;
    updateTotalBalance();
}

// Добавление кошелька
function handleAddWallet(e) {
    e.preventDefault();
    if (!walletForm) return false;
    
    const name = document.getElementById('walletName').value.trim();
    const amountInput = document.getElementById('walletAmount').value.trim();
    const currency = document.getElementById('walletCurrency').value;
    const type = document.getElementById('walletType').value;
    const color = getSelectedColor();

    if (!name) {
        alert('Пожалуйста, введите название кошелька');
        return false;
    }

    if (!amountInput) {
        alert('Пожалуйста, введите сумму');
        return false;
    }

    const amount = parseFloat(amountInput);
    if (isNaN(amount)) {
        alert('Пожалуйста, введите корректную сумму');
        return false;
    }

    const oldBalance = getTotalBalanceInCurrency(currency);
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
    
    const newBalance = getTotalBalanceInCurrency(currency);
    const change = newBalance - oldBalance;
    
    balanceChanges[currency] = change;
    showBalanceChanges[currency] = change !== 0;
    
    saveWallets();
    renderWallets();
    updateTotalBalance();
    
    if (addWalletModal) addWalletModal.classList.remove('active');
    if (walletForm) walletForm.reset();
    
    alert('Кошелек создан');
    return false;
}

// Получение общего баланса в валюте
function getTotalBalanceInCurrency(currency) {
    return wallets
        .filter(wallet => wallet.currency === currency)
        .reduce((sum, wallet) => sum + wallet.amount, 0);
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
    if (!walletsContainer) return;
    
    const sortedWallets = getSortedWallets();
    const groupedWallets = groupWalletsByCurrency(sortedWallets);
    
    walletsContainer.innerHTML = '';

    // Если нет кошельков - показываем пустое состояние
    if (sortedWallets.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>💰 Кошельков пока нет</p>
            <p>Нажмите "+ Добавить" чтобы создать первый кошелек</p>
        `;
        walletsContainer.appendChild(emptyState);
        return;
    }

    const currencyOrder = ['RUB', 'USD', 'EUR', 'CNY', 'JPY'];
    
    for (const currency of currencyOrder) {
        const currencyWallets = groupedWallets[currency];
        if (currencyWallets && currencyWallets.length > 0) {
            const currencySection = createCurrencySection(currency, currencyWallets);
            walletsContainer.appendChild(currencySection);
        }
    }
}

// Получение отсортированных кошельков
function getSortedWallets() {
    return [...wallets].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        if (a.currency !== b.currency) {
            return a.currency.localeCompare(b.currency);
        }
        
        if (currentSort === 'custom') {
            return a.order - b.order;
        }
        
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
    const grouped = {};
    
    walletsArray.forEach(wallet => {
        if (!grouped[wallet.currency]) {
            grouped[wallet.currency] = [];
        }
        grouped[wallet.currency].push(wallet);
    });
    
    return grouped;
}

// Создание секции валюты
function createCurrencySection(currency, wallets) {
    const section = document.createElement('div');
    section.className = 'currency-section';

    const title = document.createElement('h3');
    title.className = 'currency-title';
    title.textContent = currencyNames[currency] || currency;
    
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
    
    if (!wallet.pinned) {
        walletDiv.setAttribute('draggable', 'true');
    }

    const amountClass = wallet.amount >= 0 ? 'positive' : 'negative';
    const amountFormatted = formatAmount(wallet.amount, wallet.currency);
    const dateFormatted = formatDate(wallet.lastUpdate);

    walletDiv.innerHTML = `
        <div class="wallet-content">
            <div class="wallet-name">${escapeHtml(wallet.name)} ${wallet.pinned ? '📌' : ''}</div>
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

    // Обработчики действий
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

    if (!wallet.pinned) {
        setupDragAndDrop(walletDiv, wallet.id);
    }

    return walletDiv;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Настройка перетаскивания
function setupDragAndDrop(walletElement, walletId) {
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchDragging = false;
    let touchTimeout = null;

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

    walletElement.addEventListener('dragover', (e) => {
        if (!isDragging || walletElement.dataset.walletId == draggedWalletId) return;
        e.preventDefault();
        walletElement.classList.add('drag-over');
    });

    walletElement.addEventListener('dragleave', () => {
        walletElement.classList.remove('drag-over');
    });

    walletElement.addEventListener('drop', (e) => {
        e.preventDefault();
        walletElement.classList.remove('drag-over');
        
        if (!isDragging || !draggedWalletId) return;
        
        const targetWalletId = walletElement.dataset.walletId;
        if (targetWalletId == draggedWalletId) return;
        
        moveWalletInArray(draggedWalletId, targetWalletId);
    });

    walletElement.addEventListener('dragend', () => {
        isDragging = false;
        draggedWalletId = null;
        document.querySelectorAll('.wallet-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });
    });

    // Touch события
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
            
            const touch = e.changedTouches[0];
            const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
            const targetWallet = elements.find(el => el.classList.contains('wallet-item') && el.dataset.walletId != walletId);
            
            if (targetWallet) {
                const targetWalletId = targetWallet.dataset.walletId;
                moveWalletInArray(draggedWalletId, targetWalletId);
            }
            
            isDragging = false;
            draggedWalletId = null;
            document.querySelectorAll('.wallet-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        }
    });
}

// Перемещение кошелька
function moveWalletInArray(draggedWalletId, targetWalletId) {
    const draggedWallet = wallets.find(w => w.id == draggedWalletId);
    const targetWallet = wallets.find(w => w.id == targetWalletId);
    
    if (!draggedWallet || !targetWallet || draggedWallet.currency !== targetWallet.currency) return;
    
    const sameCurrencyWallets = wallets.filter(w => w.currency === draggedWallet.currency && !w.pinned);
    const targetIndex = sameCurrencyWallets.findIndex(w => w.id == targetWalletId);
    const draggedIndex = sameCurrencyWallets.findIndex(w => w.id == draggedWalletId);
    
    if (targetIndex === -1 || draggedIndex === -1) return;
    
    sameCurrencyWallets.splice(draggedIndex, 1);
    sameCurrencyWallets.splice(targetIndex, 0, draggedWallet);
    
    sameCurrencyWallets.forEach((wallet, index) => {
        wallet.order = index + 1;
    });
    
    currentSort = 'custom';
    updateSortButtons();
    saveWallets();
    renderWallets();
}

// Удаление кошелька
function deleteWallet(walletId) {
    if (confirm('Удалить этот кошелек?')) {
        const wallet = wallets.find(w => w.id === walletId);
        if (!wallet) return;

        const currency = wallet.currency;
        const oldBalance = getTotalBalanceInCurrency(currency);

        wallets = wallets.filter(w => w.id !== walletId);
        
        const newBalance = getTotalBalanceInCurrency(currency);
        const change = newBalance - oldBalance;
        
        balanceChanges[currency] = change;
        showBalanceChanges[currency] = change !== 0;
        
        saveWallets();
        renderWallets();
        updateTotalBalance();
    }
}

// Редактирование кошелька
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

    if (addWalletModal) addWalletModal.classList.add('active');

    if (walletForm) {
        walletForm.onsubmit = function(e) {
            e.preventDefault();
            
            const name = document.getElementById('walletName').value.trim();
            const amountInput = document.getElementById('walletAmount').value.trim();
            const currency = document.getElementById('walletCurrency').value;
            const type = document.getElementById('walletType').value;
            const color = getSelectedColor();

            if (!name) {
                alert('Пожалуйста, введите название кошелька');
                return false;
            }

            if (!amountInput) {
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
            
            balanceChanges[currency] = change;
            showBalanceChanges[currency] = change !== 0;
            
            saveWallets();
            renderWallets();
            updateTotalBalance();
            
            if (addWalletModal) addWalletModal.classList.remove('active');
            if (walletForm) walletForm.reset();
            
            alert('Изменения внесены');
            return false;
        };
    }
}

// Копирование кошелька
function copyWallet(walletId) {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
        const currency = wallet.currency;
        const oldBalance = getTotalBalanceInCurrency(currency);

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
        
        balanceChanges[currency] = change;
        showBalanceChanges[currency] = change !== 0;
        
        saveWallets();
        renderWallets();
        updateTotalBalance();
    }
}

// Закрепление кошелька
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
    if (!totalBalanceElement || !balanceChangeElement || !resetChangeBtn) return;
    
    const totalBalance = getTotalBalanceInCurrency(selectedCurrency);
    const formattedBalance = formatTotalBalance(totalBalance);
    
    totalBalanceElement.textContent = formattedBalance;
    
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

// Поделиться приложением
function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'Money Muffin',
            text: 'Учет финансов - просто и удобно!',
            url: window.location.href
        }).catch((error) => {
            console.log('Ошибка шаринга:', error);
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
}

// Резервное копирование ссылки
function fallbackShare() {
    const url = window.location.href;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
            .then(() => alert('Ссылка скопирована в буфер обмена!'))
            .catch(() => prompt('Скопируйте ссылку вручную:', url));
    } else {
        prompt('Скопируйте ссылку вручную:', url);
    }
}

// Подтверждение удаления всех данных
function showClearAllConfirmation() {
    if (confirmModal) confirmModal.classList.add('active');
}

function hideClearAllConfirmation() {
    if (confirmModal) confirmModal.classList.remove('active');
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

// Форматирование суммы общего баланса
function formatTotalBalance(amount) {
    const hasDecimals = amount % 1 !== 0;
    const formatter = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0
    });
    
    const formatted = formatter.format(Math.abs(amount));
    return `${amount < 0 ? '-' : ''}${formatted}`;
}

// Форматирование суммы с валютой
function formatAmount(amount, currency) {
    const hasDecimals = amount % 1 !== 0;
    const decimalPlaces = currency === 'JPY' ? 0 : (hasDecimals ? 2 : 0);
    
    const formatter = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
    });
    
    const formatted = formatter.format(Math.abs(amount));
    const symbol = currencySymbols[currency] || currency;
    
    return `${amount < 0 ? '-' : ''}${formatted} ${symbol}`;
}

// Форматирование даты
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('ru-RU');
    } catch (error) {
        return dateString;
    }
}
