const transactionForm = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const filter = document.getElementById("filter");
const submitButton = transactionForm.querySelector("button");
const formMessage = document.getElementById("form-message");
const monthFilter = document.getElementById("month-filter");
const monthlyExpenses = document.getElementById("monthly-expenses");
const monthlyCount = document.getElementById("monthly-count");
const expenseChart = document.getElementById("expense-chart");
const chartMessage = document.getElementById("chart-message");

const STORAGE_KEY = "expenseTrackerTransactions";

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingTransactionId = null;

const currentDate = new Date();
const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

monthFilter.value = currentMonth;

transactionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const type = document.getElementById("type").value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value.trim();

    formMessage.textContent = "";
    formMessage.className = "";

    if (!amount || amount <= 0) {
        showMessage("Please enter a valid amount.", "error");
        return;
    }

    if (!category) {
        showMessage("Please select a category.", "error");
        return;
    }

    if (!date) {
        showMessage("Please select a date.", "error");
        return;
    }

    if (!description) {
        showMessage("Please enter a description.", "error");
        return;
    }

    if (editingTransactionId !== null) {
        transactions = transactions.map(function(transaction) {
            if (transaction.id === editingTransactionId) {
                return {
                    id: editingTransactionId,
                    type: type,
                    amount: amount,
                    category: category,
                    date: date,
                    description: description
                };
            }

            return transaction;
        });

        editingTransactionId = null;
        submitButton.textContent = "Add Transaction";

        showMessage("Transaction updated successfully.", "success");
    } else {
        const transaction = {
            id: Date.now(),
            type: type,
            amount: amount,
            category: category,
            date: date,
            description: description
        };

        transactions.push(transaction);

        showMessage("Transaction added successfully.", "success");
    }

    saveTransactions();
    displayTransactions();
    updateSummary();
    updateMonthlySummary();
    updateExpenseChart();

    transactionForm.reset();
});

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = type;
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function displayTransactions() {
    transactionList.innerHTML = "";

    const selectedFilter = filter.value;

    const filteredTransactions = transactions.filter(function(transaction) {
        if (selectedFilter === "all") {
            return true;
        }

        if (selectedFilter === "income") {
            return transaction.type === "income";
        }

        if (selectedFilter === "expense") {
            return transaction.type === "expense";
        }

        return transaction.category === selectedFilter;
    });

    if (filteredTransactions.length === 0) {
        transactionList.innerHTML = "<p class='no-transactions'>No transactions found.</p>";
        return;
    }

    filteredTransactions.forEach(function(transaction) {
        const transactionItem = document.createElement("div");

        transactionItem.className = `transaction-item ${transaction.type}`;

        transactionItem.innerHTML = `
            <div class="transaction-info">
                <h3>${transaction.category}</h3>
                <p>${transaction.description}</p>
                <small>${transaction.date}</small>
            </div>

            <div class="transaction-right">
                <strong>${transaction.type === "income" ? "+" : "-"}₹${transaction.amount.toFixed(2)}</strong>

                <div class="transaction-actions">
                    <button onclick="editTransaction(${transaction.id})">Edit</button>
                    <button onclick="deleteTransaction(${transaction.id})">Delete</button>
                </div>
            </div>
        `;

        transactionList.appendChild(transactionItem);
    });
}

function updateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(function(transaction) {
        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    document.getElementById("total-income").textContent = `₹${totalIncome.toFixed(2)}`;
    document.getElementById("total-expenses").textContent = `₹${totalExpenses.toFixed(2)}`;
    document.getElementById("balance").textContent = `₹${balance.toFixed(2)}`;
}

function deleteTransaction(id) {
    transactions = transactions.filter(function(transaction) {
        return transaction.id !== id;
    });

    if (editingTransactionId === id) {
        editingTransactionId = null;
        submitButton.textContent = "Add Transaction";
        transactionForm.reset();
    }

    saveTransactions();
    displayTransactions();
    updateSummary();
    updateMonthlySummary();
    updateExpenseChart();
}

function editTransaction(id) {
    const transaction = transactions.find(function(transaction) {
        return transaction.id === id;
    });

    if (!transaction) {
        return;
    }

    document.getElementById("type").value = transaction.type;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("category").value = transaction.category;
    document.getElementById("date").value = transaction.date;
    document.getElementById("description").value = transaction.description;

    editingTransactionId = id;
    submitButton.textContent = "Update Transaction";

    formMessage.textContent = "";
    formMessage.className = "";

    document.getElementById("amount").focus();
}

function updateMonthlySummary() {
    const selectedMonth = monthFilter.value;

    const monthlyExpenseTransactions = transactions.filter(function(transaction) {
        return transaction.type === "expense" && transaction.date.startsWith(selectedMonth);
    });

    const total = monthlyExpenseTransactions.reduce(function(sum, transaction) {
        return sum + transaction.amount;
    }, 0);

    monthlyExpenses.textContent = `₹${total.toFixed(2)}`;
    monthlyCount.textContent = monthlyExpenseTransactions.length;
}

function updateExpenseChart() {
    expenseChart.innerHTML = "";

    const categoryTotals = {};

    transactions.forEach(function(transaction) {
        if (transaction.type === "expense") {
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }

            categoryTotals[transaction.category] += transaction.amount;
        }
    });

    const categories = Object.keys(categoryTotals);

    if (categories.length === 0) {
        chartMessage.style.display = "block";
        return;
    }

    chartMessage.style.display = "none";

    const maximum = Math.max(...Object.values(categoryTotals));

    categories.forEach(function(category) {
        const amount = categoryTotals[category];
        const percentage = (amount / maximum) * 100;

        const chartItem = document.createElement("div");
        chartItem.className = "chart-item";

        chartItem.innerHTML = `
            <div class="chart-label">
                <span>${category}</span>
                <strong>₹${amount.toFixed(2)}</strong>
            </div>

            <div class="chart-bar-background">
                <div class="chart-bar" style="width: ${percentage}%"></div>
            </div>
        `;

        expenseChart.appendChild(chartItem);
    });
}

filter.addEventListener("change", function() {
    displayTransactions();
});

monthFilter.addEventListener("change", function() {
    updateMonthlySummary();
});

displayTransactions();
updateSummary();
updateMonthlySummary();
updateExpenseChart();