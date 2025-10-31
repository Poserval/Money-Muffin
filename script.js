// Данные приложения
let wallets = [];
let currentSort = 'amount';

// DOM элементы
const walletsContainer = document.getElementById('walletsContainer');
const addWalletBtn = document.getElementById('addWalletBtn');
const addWalletModal = document.getElementById('addWalletModal');
const cancelBtn = document.getElementById('cancelBtn');
const walletForm = document.getElementById('walletForm');
const sortButtons = document.querySelectorAll('.sort-btn');
const totalBalanceElement = document.getElementById('totalBalance');
const balanceChangeElement = document.getElementById('balanceChange');

// Начальные данные как на картинке
const initialWallets = [
    {
        id: 1,
        name: "ДомРФ (вклад)",
        amount: 1000000,
        currency: "RUB",
        type: "deposit",
        lastUpdate: "2025-10-25"
    },
    {
        id: 2, 
        name: "Сбер (Вклад)",
        amount: 100000,
        currency: "RUB",
        type: "deposit",
        lastUpdate: "2025-10-25"
    },
    {
        id: 3,
        name: "Наличка",
        amount: 240,
        currency: "RUB", 
        type: "cash",
        lastUpdate: "2025-10-31"
    },
    {
        id: 4,
        name: "ВТБ (кредитка)",
        amount: -25000,
        currency: "RUB",
        type: "credit",
        lastUpdate: "2025-10-25"
    },
    {
        id: 5,
        name: "Альфа банк (кредитка)",
        amount: -50000,
        currency: "RUB",
        type: "credit", 
        lastUpdate: "2025-10-25"
    },
    {
        id: 6,
        name: "Долларовый счет",
        amount: 1500,
        currency: "USD",
        type: "account",
        lastUpdate: "2025-10-25"
    }
];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadWallets();
    setupEventListeners();
});

// Загрузка данных
function loadWallets() {
    try {
        // Пробуем загрузить из LocalStorage
        const savedWallets = localStorage.getItem('moneyMuffinWallets');
        
        if (savedWallets && JSON.parse(savedWallets).length > 0) {
            wallets = JSON.parse(savedWallets);
        } else {
            // Используем начальные данные
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
}

// Настройка обработчиков событий
function setupEventListeners() {
    addWalletBtn.addEventListener('click', () => {
        addWalletModal.classList.add('active');
    });

    cancelBtn.addEventListener('click', () => {
        addWalletModal.classList.remove('active');
        walletForm.reset();
    });

    walletForm.addEventListener('submit', handleAddWallet);

    // Обработчики сортировки
    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortType = btn.dataset.sort;
            setSort(sortType);
        });
    });

    // Закрытие модального окна по клику вне его
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

    const newWallet = {
        id: Date.now(),
        name: name,
        amount: amount,
        currency: currency,
        type: type,
        lastUpdate: new Date().toISOString().split('T')[0]
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
    
    // Обновляем активную кнопку
    sortButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortType);
        // Обновляем текст кнопки "Сумма"
        if (btn.dataset.sort === 'amount') {
            btn.textContent = sortType === 'amount' ? 'Сумма ▼' : 'Сумма';
        }
    });

    renderWallets();
}

// Отображение кошельков
function renderWallets() {
    // Сортируем кошельки
    const sortedWallets = [...wallets].sort((a, b) => {
        if (currentSort === 'name') {
            return a.name.localeCompare(b.name);
        } else {
            return b.amount - a.amount; // По убыванию суммы
        }
    });

    // Группируем по валюте в правильном порядке
    const groupedWallets = {
        'RUB': sortedWallets.filter(wallet => wallet.currency === 'RUB'),
        'USD': sortedWallets.filter(wallet => wallet.currency === 'USD')
    };
    
    walletsContainer.innerHTML = '';

    // Отображаем кошельки по группам в правильном порядке
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

    const amountClass = wallet.amount >= 0 ? 'positive' : 'negative';
    const amountFormatted = formatAmount(wallet.amount, wallet.currency);
    const dateFormatted = formatDate(wallet.lastUpdate);

    walletDiv.innerHTML = `
        <div class="wallet-name">${wallet.name}</div>
        <div class="wallet-date">Изм: ${dateFormatted}</div>
        <div class="wallet-amount ${amountClass}">${amountFormatted}</div>
    `;

    return walletDiv;
}

// Обновление общего баланса
function updateTotalBalance() {
    const totalRub = wallets
        .filter(wallet => wallet.currency === 'RUB')
        .reduce((sum, wallet) => sum + wallet.amount, 0);

    totalBalanceElement.textContent = formatAmount(totalRub, 'RUB');
    
    // Для демонстрации оставляем статичное изменение
    balanceChangeElement.textContent = '-13 767 ₽';
    balanceChangeElement.className = 'balance-change negative';
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
