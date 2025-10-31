// Данные кошельков
const wallets = [
    {
        id: 1,
        name: "Сбер",
        amount: "2 580 ₽",
        currency: "ruble",
        lastUpdate: "31.10.2025",
        icon: "Сб"
    },
    {
        id: 2,
        name: "Сбер",
        amount: "369 ₽",
        currency: "ruble",
        lastUpdate: "31.10.2025",
        icon: "Сб"
    },
    {
        id: 3,
        name: "ВТБ",
        amount: "123 ₽",
        currency: "ruble",
        lastUpdate: "31.10.2025",
        icon: "ВТ"
    },
    {
        id: 4,
        name: "Сбер",
        amount: "123 ₽",
        currency: "ruble",
        lastUpdate: "31.10.2025",
        icon: "Сб"
    },
    {
        id: 5,
        name: "Клипе",
        amount: "30 $",
        currency: "dollar",
        lastUpdate: "31.10.2025",
        icon: "$"
    }
];

// Функция для рендеринга кошельков
function renderWallets() {
    const rubleSection = document.getElementById('ruble-wallets');
    const dollarSection = document.getElementById('dollar-wallets');
    
    // Очищаем секции
    rubleSection.innerHTML = '';
    dollarSection.innerHTML = '';
    
    // Фильтруем кошельки по валюте
    const rubleWallets = wallets.filter(wallet => wallet.currency === 'ruble');
    const dollarWallets = wallets.filter(wallet => wallet.currency === 'dollar');
    
    // Рендерим рублевые кошельки
    rubleWallets.forEach(wallet => {
        const walletElement = createWalletElement(wallet);
        rubleSection.appendChild(walletElement);
    });
    
    // Рендерим долларовые кошельки
    dollarWallets.forEach(wallet => {
        const walletElement = createWalletElement(wallet);
        dollarSection.appendChild(walletElement);
    });
}

// Функция создания элемента кошелька
function createWalletElement(wallet) {
    const walletDiv = document.createElement('div');
    walletDiv.className = `wallet-card wallet-${wallet.currency}`;
    
    walletDiv.innerHTML = `
        <div class="wallet-header">
            <div class="wallet-icon">${wallet.icon}</div>
            <div class="wallet-name">${wallet.name}</div>
        </div>
        <div class="wallet-amount">${wallet.amount}</div>
        <div class="wallet-date">Изм: ${wallet.lastUpdate}</div>
    `;
    
    return walletDiv;
}

// Функция для сортировки кошельков
function sortWallets(criteria) {
    if (criteria === 'name') {
        wallets.sort((a, b) => a.name.localeCompare(b.name));
    } else if (criteria === 'amount') {
        wallets.sort((a, b) => {
            const amountA = parseFloat(a.amount.replace(/[^\d,]/g, '').replace(',', '.'));
            const amountB = parseFloat(b.amount.replace(/[^\d,]/g, '').replace(',', '.'));
            return amountB - amountA;
        });
    }
    
    renderWallets();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    renderWallets();
    
    // Обработчик для сортировки
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            sortWallets(e.target.value);
        });
    }
    
    // Обработчик для кнопки добавления
    const addButton = document.querySelector('.add-button');
    if (addButton) {
        addButton.addEventListener('click', function() {
            alert('Функция добавления кошелька будет реализована позже');
        });
    }
});
