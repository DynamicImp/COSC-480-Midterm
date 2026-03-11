const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const depositAmt = document.getElementById('deposit');
const withdrawAmt = document.getElementById('withdraw');
const savingsLabel = document.getElementById('savingsLabel');

const getSessionURL = '/getSession';
const updateSessionURL = '/updateSession';

let currentAmount = 0; 

document.addEventListener('DOMContentLoaded', async () => {
    await initSession();

    depositBtn.addEventListener('click', deposit);
    withdrawBtn.addEventListener('click', withdraw);
});

async function initSession() {
    try {
        const res = await fetch(getSessionURL);
        const sessionData = await res.json();
        
        currentAmount = parseFloat(sessionData.savings) || 0;
        
        console.log('Session Loaded. Current Amount:', currentAmount);
        updateUI();
    } catch (err) {
        console.error('Failed to load session:', err);
    }
}

function updateUI() {
    savingsLabel.innerHTML = `Savings: $ ${currentAmount.toFixed(2)}`;
}

async function deposit(e) {
    e.preventDefault();
    const amount = parseFloat(depositAmt.value);

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive number.');
        return;
    }

    if (amount > 10000) {
        alert('Transaction limit: $10,000');
        return;
    }

    currentAmount += amount;
    updateUI();
    depositAmt.value = '';
    await syncWithServer();
}

async function withdraw(e) {
    e.preventDefault();
    const amount = parseFloat(withdrawAmt.value);

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive number.');
        return;
    }

    if (amount > currentAmount) {
        alert('Insufficient funds!');
        return;
    }

    currentAmount -= amount;
    updateUI();
    withdrawAmt.value = '';
    await syncWithServer();
}

async function syncWithServer() {
    await fetch(updateSessionURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAmount: currentAmount })
    });
}