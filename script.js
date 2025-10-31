// Данные приложения
let wallets = [];
let currentSort = 'amount';

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

// Начальные данные как на картинке
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

// Переменная для хранения предыдущего баланса
let previousTotalBalance = 1025240; // Начальное значение как на картинке

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

// Загрузка данных
function loadWallets() {
    try {
        const savedWallets = localStorage.getItem('moneyMuffinWallets');
        const savedPreviousBalance = localStorage.getItem('moneyMuffinPreviousBalance');
        
        if (savedPreviousBalance) {
            previousTotalBalance = parseFloat(savedPreviousBalance);
        }
        
        if (savedWallets && JSON.parse(savedWallets).length > 0) {
            wallets = JSON.parse(savedWallets);
        } else {
            wallets = [...initialWallets];
            saveWallets();
        }
        
        renderWallets();
        updateTotalBalance();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        wallets = [...initialWallets];
        renderWallets();
        updateTotalBalance();
    }
}

// Сохранение данных в LocalStorage
function saveWallets() {
    localStorage.setItem('moneyMuffinWallets', JSON.stringify(wallets));
    localStorage.setItem('moneyMuffinPreviousBalance', previousTotalBalance.toString());
}

// Настройка обработчиков событий
function setupEventListeners() {
    addWalletBtn.addEventListener('click', () => {
        addWalletModal.classList.add('active');
        // Возвращаем стандартный обработчик для добавления
        walletForm.onsubmit = handleAddWallet;
    });

    cancelBtn.addEventListener('click', () => {
        addWalletModal.classList.remove('active');
        walletForm.reset();
    });

    walletForm.addEventListener('submit', handleAddWallet);

    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortType = btn.dataset.sort;
            setSort(sortType);
        });
    });

    addWalletModal.addEventListener('click', (e) => {
        if (e.target === addWalletModal) {
            addWalletModal.classList.remove('active');
            walletForm.reset();
        }
    });
}

// Обработка добавления кошелька
function handleAddWallet(e) {
    e.preventDefault();
    
    const name = document.getElementById('walletName').value;
    const amount = parseFloat(document.getElementById('walletAmount').value);
    const currency = document.getElementById('walletCurrency').value;
    const type = document.getElementById('walletType').value;
    const color = getSelectedColor();

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
    saveWallets();
    renderWallets();
    updateTotalBalance();
    
    addWalletModal.classList.remove('active');
    walletForm.reset();
}

// Установка сортировки
function setSort(sortType) {
    currentSort = sortType;
    
    sortButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortType);
        if (btn.dataset.sort === 'amount') {
            btn.textContent = sortType === 'amount' ? 'Сумма ▼' : 'Сумма';
        }
    });

    renderWallets();
}

// Отображение кошельков
function renderWallets() {
    const sortedWallets = [...wallets].sort((a, b) => {
        // Сначала закрепленные кошельки
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        if (currentSort === 'name') {
            return a.name.localeCompare(b.name);
        } else {
            return b.amount - a.amount;
        }
    });

    const groupedWallets = {
        'RUB': sortedWallets.filter(wallet => wallet.currency === 'RUB'),
        'USD': sortedWallets.filter(wallet => wallet.currency === 'USD')
    };
    
    walletsContainer.innerHTML = '';

    for (const currency of ['RUB', 'USD']) {
        const currencyWallets = groupedWallets[currency];
        if (currencyWallets.length > 0) {
            const currencySection = createCurrencySection(currency, currencyWallets);
            walletsContainer.appendChild(currencySection);
        }
    }
}

// Создание секции для валюты
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

    // Добавляем обработчики для кнопок
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

// Функции для действий с кошельками
function deleteWallet(walletId) {
    if (confirm('Удалить этот кошелек?')) {
        wallets = wallets.filter(wallet => wallet.id !== walletId);
        saveWallets();
        renderWallets();
        updateTotalBalance();
    }
}

function editWallet(walletId) {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    // Заполняем форму данными кошелька
    document.getElementById('walletName').value = wallet.name;
    document.getElementById('walletAmount').value = wallet.amount;
    document.getElementById('walletCurrency').value = wallet.currency;
    document.getElementById('walletType').value = wallet.type;

    // Устанавливаем выбранный цвет
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === wallet.color) {
            opt.classList.add('selected');
        }
    });

    // Показываем модальное окно
    addWalletModal.classList.add('active');

    // Удаляем старый обработчик и добавляем новый для редактирования
    walletForm.onsubmit = function(e) {
        e.preventDefault();
        
        // Обновляем данные кошелька
        wallet.name = document.getElementById('walletName').value;
        wallet.amount = parseFloat(document.getElementById('walletAmount').value);
        wallet.currency = document.getElementById('walletCurrency').value;
        wallet.type = document.getElementById('walletType').value;
        wallet.color = getSelectedColor();
        wallet.lastUpdate = new Date().toISOString().split('T')[0];

        saveWallets();
        renderWallets();
        updateTotalBalance();
        
        addWalletModal.classList.remove('active');
        walletForm.reset();
        
        // Возвращаем стандартный обработчик
        walletForm.onsubmit = handleAddWallet;
    };
}

function copyWallet(walletId) {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
        const copiedWallet = {
            ...wallet,
            id: Date.now(),
            name: `${wallet.name} (копия)`,
            pinned: false
        };
        wallets.push(copiedWallet);
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
    const totalRub = wallets
        .filter(wallet => wallet.currency === 'RUB')
        .reduce((sum, wallet) => sum + wallet.amount, 0);

    // Вычисляем разницу
    const balanceChange = totalRub - previousTotalBalance;
    
    // Обновляем отображение
    totalBalanceElement.textContent = formatAmount(totalRub, 'RUB');
    
    // Форматируем изменение баланса
    let changeText = '';
    if (balanceChange > 0) {
        changeText = `+${formatAmount(balanceChange, 'RUB')}`;
        balanceChangeElement.className = 'balance-change positive';
    } else if (balanceChange < 0) {
        changeText = `${formatAmount(balanceChange, 'RUB')}`;
        balanceChangeElement.className = 'balance-change negative';
    } else {
        changeText = `${formatAmount(0, 'RUB')}`;
        balanceChangeElement.className = 'balance-change neutral';
    }
    
    balanceChangeElement.textContent = changeText;
    
    // Сохраняем текущий баланс как предыдущий для следующего расчета
    previousTotalBalance = totalRub;
    saveWallets();
}

// Вспомогательные функции
function getCurrencyName(currency) {
    const currencies = {
        'RUB': 'Рубль',
        'USD': 'Доллар'
    };
    return currencies[currency] || currency;
}

function formatAmount(amount, currency) {
    const formatter = new Intl.NumberFormat('ru-RU');
    const formatted = formatter.format(Math.abs(amount));
    const symbol = currency === 'USD' ? '$' : '₽';
    
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
