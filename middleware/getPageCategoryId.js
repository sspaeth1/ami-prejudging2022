let url = new URLSearchParams(window.location.search);
let pageCategoryId = url.get("categoryId");

let getEl = document.querySelector("#setPageCategoryId");
getEl.setAttribute("data", pageCategoryId);

console.log(pageCategoryId);
