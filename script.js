// script.js
let items = JSON.parse(localStorage.getItem("inventoryItems")) || [];
let sales = JSON.parse(localStorage.getItem("salesRecords")) || [];

const inventoryList = document.getElementById("inventory-list");
const searchInput = document.getElementById("searchInput");
let currentEditIndex = null;

function saveToStorage() {
  localStorage.setItem("inventoryItems", JSON.stringify(items));
  localStorage.setItem("salesRecords", JSON.stringify(sales));
}

function updateInventoryUI(filter = "") {
  inventoryList.innerHTML = "";
  items
    .filter(
      (item) =>
        item.name.toLowerCase().includes(filter.toLowerCase()) ||
        item.category.toLowerCase().includes(filter.toLowerCase())
    )
    .forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "item-card";
      div.setAttribute("data-name", item.name);
      div.innerHTML = `
        <img src="${item.image}" />
        <div><strong>${item.name}</strong></div>
        <div>₦${item.price} • ${item.category}</div>
        <div>Stock: ${item.stock}</div>
        <div class="item-total">Total Sold: ₦0</div>
        <button class="sell-button" onclick="sellItem(${index})" ${
        item.stock <= 0 ? "disabled" : ""
      }>Sell</button>
        <button class="add-button" onclick="addStock(${index})">Add</button>
        <button class="edit-button" onclick="openEdit(${index})">Edit</button>
      `;
      inventoryList.appendChild(div);
    });
  calculateStats();
}

function sellItem(index) {
  const item = items[index];
  if (item.stock > 0) {
    item.stock--;
    const today = new Date().toISOString().split("T")[0];
    sales.push({
      name: item.name,
      date: today,
      quantity: 1,
      price: Number(item.price) || 0,
      cost: Number(item.cost) || 0,
    });
    saveToStorage();
    updateInventoryUI(searchInput.value);
  }
}

function addStock(index) {
  items[index].stock++;
  saveToStorage();
  updateInventoryUI(searchInput.value);
}

function filterItems() {
  updateInventoryUI(searchInput.value);
}

function addNewItem(e) {
  e.preventDefault();
  const name = document.getElementById("newItemName").value;
  const stock = parseInt(document.getElementById("newItemStock").value);
  const price = parseFloat(document.getElementById("newItemPrice").value) || 0;
  const cost = parseFloat(document.getElementById("newItemCost").value) || 0;
  const category = document.getElementById("newItemCategory").value;
  const imageFile = document.getElementById("newItemImage").files[0];

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function () {
      items.push({ name, stock, price, cost, category, image: reader.result });
      saveToStorage();
      document.getElementById("addItemForm").reset();
      updateInventoryUI();
    };
    reader.readAsDataURL(imageFile);
  } else {
    items.push({
      name,
      stock,
      price,
      cost,
      category,
      image: "https://via.placeholder.com/250x150?text=No+Image",
    });
    saveToStorage();
    document.getElementById("addItemForm").reset();
    updateInventoryUI();
  }
}

function openEdit(index) {
  currentEditIndex = index;
  const item = items[index];
  document.getElementById("editName").value = item.name;
  document.getElementById("editPrice").value = item.price;
  document.getElementById("editCost").value = item.cost;
  document.getElementById("editCategory").value = item.category;
  document.getElementById("editPreview").src = item.image;
  document.getElementById("editModal").style.display = "flex";
}

function saveEdit() {
  const item = items[currentEditIndex];
  item.name = document.getElementById("editName").value;
  item.price = parseFloat(document.getElementById("editPrice").value) || 0;
  item.cost = parseFloat(document.getElementById("editCost").value) || 0;
  item.category = document.getElementById("editCategory").value;

  const imageFile = document.getElementById("editImage").files[0];
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function () {
      item.image = reader.result;
      finishEdit();
    };
    reader.readAsDataURL(imageFile);
  } else {
    finishEdit();
  }
}

function finishEdit() {
  saveToStorage();
  closeModal();
  updateInventoryUI(searchInput.value);
}

function closeModal() {
  document.getElementById("editModal").style.display = "none";
}

function calculateStats() {
  let totalSales = 0;
  let totalProfit = 0;
  let totalRemaining = 0;
  let perItemSales = {};

  sales.forEach((sale) => {
    const price = Number(sale.price) || 0;
    const cost = Number(sale.cost) || 0;
    const qty = Number(sale.quantity) || 0;

    const saleTotal = price * qty;
    const profit = (price - cost) * qty;

    totalSales += saleTotal;
    totalProfit += profit;

    if (!perItemSales[sale.name]) perItemSales[sale.name] = 0;
    perItemSales[sale.name] += saleTotal;
  });

  items.forEach((item) => {
    const stock = Number(item.stock) || 0;
    const price = Number(item.price) || 0;
    totalRemaining += stock * price;
  });

  document.getElementById(
    "totalSales"
  ).innerText = `Total Sales: ₦${totalSales.toLocaleString()}`;
  document.getElementById(
    "totalProfit"
  ).innerText = `Total Profit: ₦${totalProfit.toLocaleString()}`;
  document.getElementById(
    "totalRemaining"
  ).innerText = `Remaining Stock Value: ₦${totalRemaining.toLocaleString()}`;

  document.querySelectorAll(".item-card").forEach((card) => {
    const name = card.getAttribute("data-name");
    const salesAmount = perItemSales[name] || 0;
    const display = card.querySelector(".item-total");
    if (display)
      display.innerText = `Total Sold: ₦${salesAmount.toLocaleString()}`;
  });
}

// Init
updateInventoryUI();
