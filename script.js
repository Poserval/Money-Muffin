// Данные приложения
let wallets = [];
let currentSort = 'name';

// DOM элементы
const walletsContainer = document.getElementById('walletsContainer');
const addWalletBtn = document.getElementById('addWalletBtn');
const addWalletModal = document.getElementById('addWalletModal');
const cancelBtn = document.getElementById('cancelBtn');
const walletForm = document.getElementById('walletForm');
const sortButtons = document.querySelectorAll('.sort-btn');
const totalBalanceElement = document.getElementById('totalBalance');
const balanceChangeElement = document.getElementById('balanceChange');

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadWallets();
    setupEventListeners();
});

// Загрузка данных
async function loadWallets() {
    try {
        // Сначала пробуем загрузить из LocalStorage
        const savedWallets = localStorage.getItem('moneyMuffinWallets');
        
        if (savedWallets) {
            // Используем сохраненные данные
            wallets = JSON.parse(savedWallets);
            renderWallets();
            updateTotalBalance();
        } else {
            // Если нет сохраненных данных, загружаем из JSON
            const response = await fetch('data.json');
            const data = await response.json();
            wallets = data.wallets;
            saveWallets(); // Сохраняем в LocalStorage
            renderWallets();
            updateTotalBalance();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Пробуем загрузить из LocalStorage как запасной вариант
        const savedWallets = localStorage.getItem('moneyMuffinWallets');
        if (savedWallets) {
            wallets = JSON.parse(savedWallets);
            renderWallets();
            updateTotalBalance();
        }
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
    saveWallets(); // Сохраняем в LocalStorage
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
            return b.amount - a.amount;
        }
    });

    // Группируем по валюте
    const groupedWallets = groupByCurrency(sortedWallets);
    
    walletsContainer.innerHTML = '';

    // Отображаем кошельки по группам
    for (const [currency, currencyWallets] of Object.entries(groupedWallets)) {
        const currencySection = createCurrencySection(currency, currencyWallets);
        walletsContainer.appendChild(currencySection);
    }
}

// Группировка кошельков по валюте
function groupByCurrency(wallets) {
    return wallets.reduce((groups, wallet) => {
        const currency = wallet.currency;
        if (!groups[currency]) {
            groups[currency] = [];
        }
        groups[currency].push(wallet);
        return groups;
    }, {});
}

// Создание секции для валюты
function createCurrencySection(currency, wallets) {
    const section = document.createElement('div');
    section.className = 'currency-section';

    const title = document.createElement('h3');
    title.className = 'currency-title';
    title.textContent = getCurrencyName(currency);
    
    section.appendChild(title);

    wallets.forEach(wallet => {
        const walletElement = createWalletElement(wallet);
        section.appendChild(walletElement);
    });

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
        <div class="wallet-info">
            <div class="wallet-name">${wallet.name}</div>
            <div class="wallet-date">Изм: ${dateFormatted}</div>
        </div>
        <div class="wallet-amount ${amountClass}">${amountFormatted}</div>
    `;

    return walletDiv;
}

// Обновление общего баланса
function updateTotalBalance() {
    const total = wallets
        .filter(wallet => wallet.currency === 'RUB')
        .reduce((sum, wallet) => sum + wallet.amount, 0);

    totalBalanceElement.textContent = formatAmount(total, 'RUB');
    
    // Для простоты показываем статичное изменение
    // В будущем можно добавить расчет изменений
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
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}
