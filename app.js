// Personal Finance Management App

// State
let transactions = [];
let chart = null;

// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const netBalanceEl = document.getElementById('net-balance');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    setDefaultDate();
    renderTransactions();
    updateSummary();
    renderChart();
    setupEventListeners();
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('trans-date').value = today;
}

// Setup event listeners
function setupEventListeners() {
    transactionForm.addEventListener('submit', handleAddTransaction);
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    document.getElementById('file-import').addEventListener('change', importData);
    document.getElementById('btn-history').addEventListener('click', showAllHistory);
}

// Load transactions from localStorage
function loadTransactions() {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        transactions = JSON.parse(saved);
    } else {
        // Add sample data for demonstration
        transactions = [
            { id: 1, date: '2026-01-28', type: 'expense', category: '餐饮', amount: 500.00, description: '夜宵' },
            { id: 2, date: '2026-01-27', type: 'expense', category: '住房', amount: 379.58, description: '-' },
            { id: 3, date: '2026-01-26', type: 'expense', category: '餐饮', amount: 20.69, description: '外出就餐' },
            { id: 4, date: '2026-01-25', type: 'expense', category: '娱乐', amount: 80.87, description: '计划外支出' },
            { id: 5, date: '2026-01-01', type: 'income', category: '工资', amount: 35740.23, description: '月薪' },
            { id: 6, date: '2025-12-01', type: 'income', category: '工资', amount: 2500.00, description: '奖金' }
        ];
        saveTransactions();
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Handle add transaction
function handleAddTransaction(e) {
    e.preventDefault();

    const date = document.getElementById('trans-date').value;
    const type = document.getElementById('trans-type').value;
    const category = document.getElementById('trans-category').value;
    const amount = parseFloat(document.getElementById('trans-amount').value);
    const description = document.getElementById('trans-desc').value || '-';

    const transaction = {
        id: Date.now(),
        date,
        type,
        category,
        amount,
        description
    };

    transactions.unshift(transaction);
    saveTransactions();
    renderTransactions();
    updateSummary();
    renderChart();

    // Reset form
    transactionForm.reset();
    setDefaultDate();
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderTransactions();
    updateSummary();
    renderChart();
}

// Render transactions table
function renderTransactions() {
    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">暂无交易记录</td>
            </tr>
        `;
        return;
    }

    // Sort by date descending
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    transactionList.innerHTML = sorted.map(t => `
        <tr>
            <td>${t.date}</td>
            <td>${t.category}</td>
            <td><span class="type-badge ${t.type}">${t.type === 'income' ? '收入' : '支出'}</span></td>
            <td class="amount-cell ${t.type}">${t.amount.toFixed(2)} ¥</td>
            <td>${t.description}</td>
            <td><button class="btn-delete" onclick="deleteTransaction(${t.id})">删除</button></td>
        </tr>
    `).join('');
}

// Update summary cards
function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    totalIncomeEl.textContent = `${totalIncome.toFixed(2)} ¥`;
    totalExpenseEl.textContent = `${totalExpense.toFixed(2)} ¥`;
    netBalanceEl.textContent = `${netBalance.toFixed(2)} ¥`;
}

// Render chart
function renderChart() {
    const ctx = document.getElementById('stats-chart').getContext('2d');

    // Group by month
    const monthlyData = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            monthlyData[month].income += t.amount;
        } else {
            monthlyData[month].expense += t.amount;
        }
    });

    // Sort months
    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(m => monthlyData[m].income);
    const expenseData = months.map(m => monthlyData[m].expense);

    // Destroy existing chart
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: '收入',
                    data: incomeData,
                    backgroundColor: 'rgba(102, 205, 170, 0.8)',
                    borderColor: 'rgba(102, 205, 170, 1)',
                    borderWidth: 1
                },
                {
                    label: '支出',
                    data: expenseData,
                    backgroundColor: 'rgba(240, 128, 128, 0.8)',
                    borderColor: 'rgba(240, 128, 128, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Export data as JSON
function exportData() {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import data from JSON
function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                if (confirm(`确定要导入 ${imported.length} 条记录吗？这将覆盖现有数据。`)) {
                    transactions = imported;
                    saveTransactions();
                    renderTransactions();
                    updateSummary();
                    renderChart();
                    alert('导入成功！');
                }
            } else {
                alert('无效的数据格式');
            }
        } catch (err) {
            alert('解析文件失败：' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
}

// Show all history (placeholder - could open a modal with full history)
function showAllHistory() {
    alert(`共有 ${transactions.length} 条交易记录\n\n收入记录: ${transactions.filter(t => t.type === 'income').length} 条\n支出记录: ${transactions.filter(t => t.type === 'expense').length} 条`);
}

// Make deleteTransaction available globally
window.deleteTransaction = deleteTransaction;
