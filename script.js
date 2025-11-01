// Данные приложения
let wallets = [];
let currentSort = 'amount';
let sortDirection = 'desc';
let selectedCurrency = 'RUB';

// Символы валют
const currencySymbols = {
    'RUB': '₽',
    'USD': '$',
    'EUR': '€',
    'CNY': '¥',
    'JPY': '¥'
};

// Цвета радуги + черный и серый
const walletColors = [
    '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6',
    '#FF2D55', '#AF52DE', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA',
    '#007AFF', '#5856D6', '#1D1D1F', '#8E8E93'
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
const currencySelector = document.getElementById('currencySelector');
const selectedCurrencyElement = document.getElementById('selectedCurrency');
const currencyDropdown = document.getElementById('currencyDropdown');

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
        pinned: false
    },
    {
        id: 2, 
        name: "Сбер (Вклад)",
        amount: 100000,
        currency: "RUB",
        type: "deposit",
        lastUpdate: "2025-10-25",
        color: '#4CD964',
        pinned: false
    },
    {
        id: 3,
        name: "Наличка",
        amount: 240,
        currency: "RUB", 
        type: "cash",
        lastUpdate: "2025-10-31",
        color: '#FFCC00',
        pinned: false
    },
    {
        id: 4,
        name: "ВТБ (кредитка)",
        amount: -25000,
        currency: "RUB",
        type: "credit",
        lastUpdate: "2025-10-25",
        color: '#FF3B30',
        pinned: false
    },
    {
        id: 5,
        name: "Альфа банк (кредитка)",
        amount: -50000,
        currency: "RUB",
        type: "credit", 
        lastUpdate: "2025-10-25",
        color: '#FF9500',
        pinned: false
    },
    {
        id: 6,
        name: "Долларовый счет",
        amount: 1500,
        currency: "USD",
        type: "account",
        lastUpdate: "2025-10-25",
        color: '#5AC8FA',
        pinned: false
    }
];

// Переменные для баланса
let previousTotalBalance = 1025240;
let lastBalanceChange = -13767;
let showBalanceChange = true;

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

// Обновление выпадающего списка валют
function updateCurrencyDropdown() {
    const availableCurrencies = getAvailableCurrencies();
    currencyDropdown.innerHTML = '';
    
    // Фильтруем текущую выбранную валюту из списка
    const otherCurrencies = availableCurrencies.filter(currency => currency !== selectedCurrency);
    
    otherCurrencies.forEach(currency => {
        const currencyOption = document.createElement('div');
        currencyOption.className = 'currency-option';
        currencyOption.dataset.currency = currency;
        currencyOption.textContent = currencySymbols[currency];
        currencyOption.title = getCurrencyName(currency);
        
        currencyOption.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCurrency(currency);
        });
        
        currencyDropdown.appendChild(currencyOption);
    });
}

// Загрузка данных
function loadWallets() {
    try {
        const savedWallets = localStorage.getItem('moneyMuffinWallets');
        const savedPreviousBalance = localStorage.getItem('moneyMuffinPreviousBalance');
        const savedLastChange = localStorage.getItem('moneyMuffinLastChange');
        const savedShowChange = localStorage.getItem('moneyMuffinShowChange');
        const savedSort = localStorage.getItem('moneyMuffinSort');
        const savedSortDirection = localStorage.getItem('moneyMuffinSortDirection');
        const savedCurrency = localStorage.getItem('moneyMuffinSelectedCurrency');
        
        if (savedPreviousBalance) previousTotalBalance = parseFloat(savedPreviousBalance);
        if (savedLastChange) lastBalanceChange = parseFloat(savedLastChange);
        if (savedShowChange) showBalanceChange = JSON.parse(savedShowChange);
        if (savedSort) currentSort = savedSort;
        if (savedSortDirection) sortDirection = savedSortDirection;
        if (savedCurrency) selectedCurrency = savedCurrency;
        
        if (savedWallets && JSON.parse(savedWallets).length > 0) {
            wallets = JSON.parse(savedWallets);
        } else {
            wallets = [...initialWallets];
            saveWallets();
        }
        
        // Проверяем, что выбранная валюта существует в кошельках
        const availableCurrencies = getAvailableCurrencies();
        if (!availableCurrencies.includes(selectedCurrency)) {
            selectedCurrency = availableCurrencies[0] || 'RUB';
        }
        
        updateCurrencyDisplay();
        updateCurrencyDropdown();
        updateSortButtons();
        renderWallets();
        updateTotalBalance();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        wallets = [...initialWallets];
        updateCurrencyDisplay();
        updateCurrencyDropdown();
        renderWallets();
        updateTotalBalance();
    }
}

// Сохранение данных
function saveWallets() {
    localStorage.setItem('moneyMuffinWallets', JSON.stringify(wallets));
    localStorage.setItem('moneyMuffinPreviousBalance', previousTotalBalance.toString());
    localStorage.setItem('moneyMuffinLastChange', lastBalanceChange.toString());
    localStorage.setItem('moneyMuffinShowChange', JSON.stringify(showBalanceChange));
    localStorage.setItem('moneyMuffinSort', currentSort);
    localStorage.setItem('moneyMuffinSortDirection', sortDirection);
    localStorage.setItem('moneyMuffinSelectedCurrency', selectedCurrency);
}

// Настройка обработчиков событий
function setupEventListeners() {
    addWalletBtn.addEventListener('click', () => {
        addWalletModal.classList.add('active');
        walletForm.onsubmit = handleAddWallet;
    });

    cancelBtn.addEventListener('click', () => {
        addWalletModal.classList.remove('active');
        walletForm.reset();
    });

    walletForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (walletForm.onsubmit) {
            walletForm.onsubmit(e);
        }
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
        }
    });

    resetChangeBtn.addEventListener('click', resetBalanceChange);
    shareBtn.addEventListener('click', shareApp);
    clearAllBtn.addEventListener('click', showClearAllConfirmation);
    confirmCancelBtn.addEventListener('click', hideClearAllConfirmation);
    confirmDeleteBtn.addEventListener('click', clearAllData);
    
    // Обработчики для селектора валют
    selectedCurrencyElement.addEventListener('click', toggleCurrencyDropdown);
    
    // Закрытие выпадающих списков при клике вне их
    document.addEventListener('click', (e) => {
        if (!currencySelector.contains(e.target)) {
            closeCurrencyDropdown();
        }
        if (!addWalletModal.contains(e.target) && e.target !== addWalletBtn) {
            addWalletModal.classList.remove('active');
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

// Функции для работы с валютами
function toggleCurrencyDropdown(e) {
    if (e) e.stopPropagation();
    
    const availableCurrencies = getAvailableCurrencies();
    if (availableCurrencies.length <= 1) {
        return; // Не показываем dropdown если только одна валюта
    }
    
    currencySelector.classList.toggle('active');
}

function closeCurrencyDropdown() {
    currencySelector.classList.remove('active');
}

function selectCurrency(currency) {
    // Анимация смены иконки
    selectedCurrencyElement.classList.add('changing');
    
    setTimeout(() => {
        selectedCurrency = currency;
        updateCurrencyDisplay();
        closeCurrencyDropdown();
        updateTotalBalance();
        updateCurrencyDropdown();
        saveWallets();
        
        // Завершаем анимацию
        setTimeout(() => {
            selectedCurrencyElement.classList.remove('changing');
        }, 100);
    }, 150);
}

function updateCurrencyDisplay() {
    selectedCurrencyElement.textContent = currencySymbols[selectedCurrency];
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

// Сброс изменения баланса
function resetBalanceChange() {
    lastBalanceChange = 0;
    showBalanceChange = false;
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

    const oldTotalBalance = getTotalBalanceInSelectedCurrency();

    const newWallet = {
        id: Date.now(),
        name: name,
        amount: amount,
        currency: currency,
        type: type,
        color: color,
        lastUpdate: new Date().toISOString().split('T')[0],
        pinned: false
    };

    wallets.push(newWallet);
    
    const newTotalBalance = getTotalBalanceInSelectedCurrency();
    
    lastBalanceChange = newTotalBalance - oldTotalBalance;
    previousTotalBalance = oldTotalBalance;
    showBalanceChange = lastBalanceChange !== 0;
    
    // Обновляем список доступных валют
    updateCurrencyDropdown();
    
    saveWallets();
    renderWallets();
    updateTotalBalance();
    
    addWalletModal.classList.remove('active');
    walletForm.reset();
    alert('Кошелек создан');
    
    return false;
}

// Получение общего баланса в выбранной валюте
function getTotalBalanceInSelectedCurrency() {
    return wallets
        .filter(wallet => wallet.currency === selectedCurrency)
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
    const sortedWallets = [...wallets].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        let result = 0;
        
        if (currentSort === 'name') {
            result = a.name.localeCompare(b.name);
        } else {
            result = a.amount - b.amount;
        }
        
        return sortDirection === 'asc' ? result : -result;
    });

    const groupedWallets = {
        'RUB': sortedWallets.filter(wallet => wallet.currency === 'RUB'),
        'USD': sortedWallets.filter(wallet => wallet.currency === 'USD'),
        'EUR': sortedWallets.filter(wallet => wallet.currency === 'EUR'),
        'CNY': sortedWallets.filter(wallet => wallet.currency === 'CNY'),
        'JPY': sortedWallets.filter(wallet => wallet.currency === 'JPY')
    };
    
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
    
    wallets.forEach(wallet => {
        const walletElement = createWalletElement(wallet);
        walletsGrid.appendChild(walletElement);
    });

    section.appendChild(walletsGrid);
    return section;
}

// Создание элемента кошелька
function createWalletElement(wallet) {
    const walletDiv = document.createElement('div');
    walletDiv.className = 'wallet-item';
    walletDiv.style.setProperty('--wallet-color', wallet.color);

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

    return walletDiv;
}

// Действия с кошельками
function deleteWallet(walletId) {
    if (confirm('Удалить этот кошелек?')) {
        const oldTotalBalance = getTotalBalanceInSelectedCurrency();

        wallets = wallets.filter(wallet => wallet.id !== walletId);
        
        const newTotalBalance = getTotalBalanceInSelectedCurrency();
        
        lastBalanceChange = newTotalBalance - oldTotalBalance;
        previousTotalBalance = oldTotalBalance;
        showBalanceChange = lastBalanceChange !== 0;
        
        // Обновляем список доступных валют
        updateCurrencyDropdown();
        
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

        const oldTotalBalance = getTotalBalanceInSelectedCurrency();
        
        wallet.name = name;
        wallet.amount = amount;
        wallet.currency = currency;
        wallet.type = type;
        wallet.color = color;
        wallet.lastUpdate = new Date().toISOString().split('T')[0];
        
        const newTotalBalance = getTotalBalanceInSelectedCurrency();
        
        lastBalanceChange = newTotalBalance - oldTotalBalance;
        previousTotalBalance = oldTotalBalance;
        showBalanceChange = lastBalanceChange !== 0;
        
        // Обновляем список доступных валют
        updateCurrencyDropdown();
        
        saveWallets();
        renderWallets();
        updateTotalBalance();
        
        addWalletModal.classList.remove('active');
        walletForm.reset();
        alert('Изменения внесены');
        walletForm.onsubmit = handleAddWallet;
        
        return false;
    };
}

function copyWallet(walletId) {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
        const oldTotalBalance = getTotalBalanceInSelectedCurrency();

        const copiedWallet = {
            ...wallet,
            id: Date.now(),
            name: `${wallet.name} (копия)`,
            pinned: false
        };
        wallets.push(copiedWallet);
        
        const newTotalBalance = getTotalBalanceInSelectedCurrency();
        
        lastBalanceChange = newTotalBalance - oldTotalBalance;
        previousTotalBalance = oldTotalBalance;
        showBalanceChange = lastBalanceChange !== 0;
        
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
    
    // Форматируем сумму
    const formatter = new Intl.NumberFormat('ru-RU');
    const formattedBalance = formatter.format(Math.round(totalBalance));
    
    // Обновляем отображение
    totalBalanceElement.textContent = formattedBalance;
    
    // Обновляем изменение баланса
    if (showBalanceChange && lastBalanceChange !== 0) {
        let changeText = '';
        if (lastBalanceChange > 0) {
            changeText = `+${formatAmount(lastBalanceChange, selectedCurrency)}`;
            balanceChangeElement.className = 'balance-change positive';
        } else if (lastBalanceChange < 0) {
            changeText = `${formatAmount(lastBalanceChange, selectedCurrency)}`;
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
        localStorage.removeItem('moneyMuffinPreviousBalance');
        localStorage.removeItem('moneyMuffinLastChange');
        localStorage.removeItem('moneyMuffinShowChange');
        localStorage.removeItem('moneyMuffinSort');
        localStorage.removeItem('moneyMuffinSortDirection');
        localStorage.removeItem('moneyMuffinSelectedCurrency');
        
        wallets = [...initialWallets];
        previousTotalBalance = 1025240;
        lastBalanceChange = -13767;
        showBalanceChange = true;
        currentSort = 'amount';
        sortDirection = 'desc';
        selectedCurrency = 'RUB';
        
        updateCurrencyDisplay();
        updateCurrencyDropdown();
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
    const currencies = {
        'RUB': 'Рубль',
        'USD': 'Доллар', 
        'EUR': 'Евро',
        'CNY': 'Юань',
        'JPY': 'Йена'
    };
    return currencies[currency] || currency;
}

function formatAmount(amount, currency) {
    const formatter = new Intl.NumberFormat('ru-RU');
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
