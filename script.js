import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD15RW9R8XY4yTmDuOqBl0oTkwds9bWmHA",
  authDomain: "homemade-recipes-eac1b.firebaseapp.com",
  databaseURL: "https://homemade-recipes-eac1b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "homemade-recipes-eac1b",
  storageBucket: "homemade-recipes-eac1b.firebasestorage.app",
  messagingSenderId: "555759218252",
  appId: "1:555759218252:web:206d792f88f6fdc2954ee9",
  measurementId: "G-8J2P80JGSL"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let recipes = [];
let openedRecipeId = null;
let currentPage = 0;

const recipesList = document.getElementById("recipesList");
const searchInput = document.getElementById("searchInput");

const formModal = document.getElementById("formModal");
const viewerModal = document.getElementById("viewerModal");

const addBtn = document.getElementById("addBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const saveBtn = document.getElementById("saveBtn");

const titleInput = document.getElementById("titleInput");
const coverInput = document.getElementById("coverInput");
const pagesInput = document.getElementById("pagesInput");

const closeViewerBtn = document.getElementById("closeViewerBtn");
const viewerTitle = document.getElementById("viewerTitle");
const pageImage = document.getElementById("pageImage");
const pageCounter = document.getElementById("pageCounter");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const deleteRecipeBtn = document.getElementById("deleteRecipeBtn");

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = function (e) {
      img.src = e.target.result;
    };

    reader.onerror = function () {
      reject("Ошибка чтения файла");
    };

    img.onload = function () {
      const canvas = document.createElement("canvas");

      const maxWidth = 1000;

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressedImage = canvas.toDataURL("image/jpeg", 0.7);

      resolve(compressedImage);
    };

    img.onerror = function () {
      reject("Ошибка загрузки картинки");
    };

    reader.readAsDataURL(file);
  });
}

function renderRecipes() {
  const searchText = searchInput.value.toLowerCase();

  const filtered = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchText)
  );

  recipesList.innerHTML = "";

  if (filtered.length === 0) {
    recipesList.innerHTML = `<div class="empty">Пока рецептов нет 🍳</div>`;
    return;
  }

  filtered.forEach((recipe, index) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.style.setProperty("--rotate", index % 2 === 0 ? "-1deg" : "1deg");

    card.innerHTML = `
      <img src="${recipe.cover}" alt="${recipe.title}">
      <h3>${recipe.title}</h3>
    `;

    card.addEventListener("click", () => openRecipe(recipe.id));

    recipesList.appendChild(card);
  });
}

function openForm() {
  formModal.classList.remove("hidden");
}

function closeForm() {
  formModal.classList.add("hidden");

  titleInput.value = "";
  coverInput.value = "";
  pagesInput.value = "";

  saveBtn.disabled = false;
  saveBtn.textContent = "Сохранить рецепт";
}

async function saveRecipe() {
  const title = titleInput.value.trim();
  const coverFile = coverInput.files[0];
  const pageFiles = Array.from(pagesInput.files);

  if (!title) {
    alert("Напиши название рецепта");
    return;
  }

  if (!coverFile) {
    alert("Выбери обложку");
    return;
  }

  if (pageFiles.length === 0) {
    alert("Добавь хотя бы одну страницу рецепта");
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "Сохраняю...";

    const cover = await fileToBase64(coverFile);

    const pages = [];

    for (const file of pageFiles) {
      const page = await fileToBase64(file);
      pages.push(page);
    }

    const recipe = {
      title: title,
      cover: cover,
      pages: pages,
      createdAt: Date.now()
    };

    await push(ref(db, "recipes"), recipe);

    closeForm();
  } catch (error) {
    console.error(error);
    alert("Не получилось сохранить рецепт. Возможно, картинки слишком большие.");
    saveBtn.disabled = false;
    saveBtn.textContent = "Сохранить рецепт";
  }
}

function loadRecipes() {
  const recipesRef = ref(db, "recipes");

  onValue(recipesRef, (snapshot) => {
    recipes = [];

    snapshot.forEach((child) => {
      recipes.push({
        id: child.key,
        ...child.val()
      });
    });

    recipes.sort((a, b) => {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    renderRecipes();
  });
}

function openRecipe(id) {
  openedRecipeId = id;
  currentPage = 0;

  viewerModal.classList.remove("hidden");

  renderViewer();
}

function closeViewer() {
  viewerModal.classList.add("hidden");
}

function getOpenedRecipe() {
  return recipes.find(recipe => recipe.id === openedRecipeId);
}

function renderViewer() {
  const recipe = getOpenedRecipe();

  if (!recipe) return;

  viewerTitle.textContent = recipe.title;

  pageImage.src = recipe.pages[currentPage];

  pageCounter.textContent =
    `Страница ${currentPage + 1} из ${recipe.pages.length}`;

  prevPageBtn.disabled = currentPage === 0;
  nextPageBtn.disabled = currentPage === recipe.pages.length - 1;

  prevPageBtn.style.opacity = currentPage === 0 ? "0.4" : "1";
  nextPageBtn.style.opacity = currentPage === recipe.pages.length - 1 ? "0.4" : "1";
}

function nextPage() {
  const recipe = getOpenedRecipe();

  if (!recipe) return;

  if (currentPage < recipe.pages.length - 1) {
    currentPage++;
    renderViewer();
  }
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    renderViewer();
  }
}

async function deleteRecipe() {
  if (!openedRecipeId) return;

  if (!confirm("Удалить этот рецепт?")) return;

  await remove(ref(db, `recipes/${openedRecipeId}`));

  closeViewer();
}

addBtn.addEventListener("click", openForm);
closeFormBtn.addEventListener("click", closeForm);
saveBtn.addEventListener("click", saveRecipe);

searchInput.addEventListener("input", renderRecipes);

closeViewerBtn.addEventListener("click", closeViewer);
nextPageBtn.addEventListener("click", nextPage);
prevPageBtn.addEventListener("click", prevPage);
deleteRecipeBtn.addEventListener("click", deleteRecipe);

loadRecipes();