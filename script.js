// script.js

const form = document.getElementById("itemForm");
const itemNameInput = document.getElementById("itemName");
const itemQtyInput = document.getElementById("itemQty");
const itemPriceInput = document.getElementById("itemPrice");
const itemImageInput = document.getElementById("itemImage");
const inventoryList = document.getElementById("inventoryList");
const searchBox = document.getElementById("searchBox");
const totalValueSpan = document.getElementById("totalValue");
const totalSalesSpan = document.getElementById("totalSales");
const exportBtn = document.getElementById("exportCSV");
const printBtn = document.getElementById("printReport");
const editForm = document.getElementById("editForm");
const editSection = document.getElementById("editSection");
const editNameInput = document.getElementById("editName");
const editPriceInput = document.getElementById("editPrice");
const editImageInput = document.getElementById("editImage");
const originalNameInput = document.getElementById("originalName");

let inventory = {};
let today = new Date().toISOString().split("T")[0];

function getDefaultImage(itemName) {
  const name = itemName.toLowerCase();
  if (name.includes("bread")) return "images/bread.jpg";
  if (name.includes("rice")) return "images/rice.jpg";
  if (name.includes("milk")) return "images/milk.jpg";
  if (name.includes("sugar")) return "images/sugar.jpg";
  if (name.includes("salt")) return "images/salt.jpg";
  if (name.includes("egg")) return "images/egg.jpg";
  if (name.includes("oil")) return "images/oil.jpg";
  if (name.includes("biscuit")) return "images/biscuit.jpg";
  if (name.includes("indomie")) return "images/indomie.jpg";
  if (name.includes("beans")) return "images/beans.jpg";
  return "images/default.jpg";
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function saveToLocalStorage() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function loadFromLocalStorage() {
  const stored = localStorage.getItem("inventory");
  if (stored) {
    inventory = JSON.parse(stored);
  }
}

function updateDashboard() {
  let totalValue = 0;
  let totalSales = 0;

  for (let item in inventory) {
    const data = inventory[item];
    totalValue += data.remaining * data.price;
    if (data.sales && data.sales[today]) {
      totalSales += data.sales[today] * data.price;
    }
  }

  totalValueSpan.textContent = totalValue.toLocaleString();
  totalSalesSpan.textContent = totalSales.toLocaleString();
}

function displayInventory(filter = "") {
  inventoryList.innerHTML = "";

  for (let item in inventory) {
    if (filter && !item.toLowerCase().includes(filter.toLowerCase())) continue;

    const data = inventory[item];

    const div = document.createElement("div");
    div.className = "item";

    const img = document.createElement("img");
    img.src = data.image;
    div.appendChild(img);

    const info = document.createElement("div");
    info.className = "item-info";
    info.innerHTML = `
      <strong>${item}</strong>
      <span>🧮 Stocked: ${data.stock}</span>
      <span>🛍️ Sold: ${data.sold}</span>
      <span>📦 Remaining: ${data.remaining}</span>
      <span>💵 Price: ₦${data.price}</span>
    `;
    div.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.innerHTML = `
      <button class="sell" onclick="sellItem('${item}')">Sell 1</button>
      <button class="restock" onclick="restockItem('${item}')">Restock +5</button>
      <button onclick="startEditItem('${item}')">✏️ Edit</button>
    `;
    div.appendChild(actions);

    inventoryList.appendChild(div);
  }

  updateDashboard();
}

function sellItem(itemName) {
  const item = inventory[itemName];
  if (item.remaining > 0) {
    item.sold += 1;
    item.remaining -= 1;

    if (!item.sales) item.sales = {};
    if (!item.sales[today]) item.sales[today] = 0;
    item.sales[today] += 1;

    saveToLocalStorage();
    displayInventory(searchBox.value);
  } else {
    alert("❌ No more stock available!");
  }
}

function restockItem(itemName) {
  const item = inventory[itemName];
  item.stock += 5;
  item.remaining += 5;
  saveToLocalStorage();
  displayInventory(searchBox.value);
}

function startEditItem(name) {
  const item = inventory[name];
  if (!item) return;

  editNameInput.value = name;
  editPriceInput.value = item.price;
  originalNameInput.value = name;
  editSection.style.display = "block";
}

editForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const oldName = originalNameInput.value;
  const newName = editNameInput.value.trim();
  const newPrice = parseFloat(editPriceInput.value);
  const imageFile = editImageInput.files[0];

  if (!newName || newPrice < 1) return;

  const oldItem = inventory[oldName];
  let newImage = oldItem.image;

  if (imageFile) {
    newImage = await getBase64(imageFile);
  }

  delete inventory[oldName];
  inventory[newName] = {
    ...oldItem,
    price: newPrice,
    image: newImage,
  };

  saveToLocalStorage();
  displayInventory(searchBox.value);

  editForm.reset();
  editSection.style.display = "none";
});

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = itemNameInput.value.trim();
  const qty = parseInt(itemQtyInput.value);
  const price = parseFloat(itemPriceInput.value);

  if (!name || qty < 1 || price < 1) return;

  let imageData = getDefaultImage(name);
  if (itemImageInput.files.length > 0) {
    const imageFile = itemImageInput.files[0];
    imageData = await getBase64(imageFile);
  }

  if (inventory[name]) {
    inventory[name].stock += qty;
    inventory[name].remaining += qty;
  } else {
    inventory[name] = {
      stock: qty,
      sold: 0,
      remaining: qty,
      price: price,
      image: imageData,
      sales: {},
    };
  }

  itemNameInput.value = "";
  itemQtyInput.value = "";
  itemPriceInput.value = "";
  itemImageInput.value = "";

  saveToLocalStorage();
  displayInventory(searchBox.value);
});

searchBox.addEventListener("input", () => {
  displayInventory(searchBox.value);
});

exportBtn.addEventListener("click", () => {
  const rows = [["Item", "Stock", "Sold", "Remaining", "Price", "Sales Today"]];
  for (let item in inventory) {
    const data = inventory[item];
    rows.push([
      item,
      data.stock,
      data.sold,
      data.remaining,
      data.price,
      (data.sales && data.sales[today]) || 0,
    ]);
  }

  const csvContent = rows.map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory_${today}.csv`;
  a.click();

  URL.revokeObjectURL(url);
});

printBtn.addEventListener("click", () => {
  const tbody = document.querySelector("#reportTable tbody");
  const reportDate = document.getElementById("reportDate");
  const grandTotalElem = document.getElementById("grandTotal");

  tbody.innerHTML = "";
  let grandTotal = 0;
  reportDate.textContent = today;

  for (let item in inventory) {
    const data = inventory[item];
    const soldToday = data.sales?.[today] || 0;

    if (soldToday > 0) {
      const row = document.createElement("tr");
      const total = soldToday * data.price;
      grandTotal += total;

      row.innerHTML = `
        <td>${item}</td>
        <td>${soldToday}</td>
        <td>₦${data.price}</td>
        <td>₦${total}</td>
      `;
      tbody.appendChild(row);
    }
  }

  grandTotalElem.textContent = `₦${grandTotal}`;
  window.print();
});

loadFromLocalStorage();
displayInventory();
// Include your existing JS code from script.js here. For this example, it's left minimal.
