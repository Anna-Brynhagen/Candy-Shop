import "bootstrap/dist/css/bootstrap.css";
import "./style.css";

import { fetchStoreItems } from "./api";
import { Item } from "./types";
import { ItemsCart } from "./types";
import { BASE_URL } from "./api";
import { checkout } from "./kassa";

export const storeItemsListEl =
  document.querySelector<HTMLUListElement>("#store-items-list")!;
const kassaBtn = document.querySelector("#kassaBtn");

if (kassaBtn) {
  kassaBtn.addEventListener("click", () => {
    body.classList.toggle("showCart");
    checkout();
  });
}
const modalEl = document.querySelector<HTMLDialogElement>("#modal")!;

let items: Item[] = [];
let localItems: Item[] = [];
let defaultStock: Item[] = [];
export let cartItems: ItemsCart[] = [];

const loadCart = () => {
  const itemsInCart = localStorage.getItem("localItems");
  if (itemsInCart !== null) {
    localItems = JSON.parse(itemsInCart);
    console.log(localItems);
  }
  return;
};

loadCart();

const saveCart = () => {
  localStorage.setItem("localItems", JSON.stringify(localItems));
};

const getStoreItems = async () => {
  try {
    items = await fetchStoreItems();
    defaultStock = await fetchStoreItems();
    renderStoreItems();
  } catch (err) {
    alert(`Hitta inget godis: ${err}`);
  }
};

const sortItems = () => {
  items.sort((a, b) => {
    return a.name.localeCompare(b.name, "sv");
  });
};

const getItemsInStock = () => {
  const itemsInStock: number[] = items.map((item: Item) => {
    if (item.stock_quantity !== 0) {
      return item.stock_status === "instock" ? 1 : 0;
    }
    return 0;
  });
  const totalItemsInStock: number = itemsInStock.reduce(
    (accumulator, currentValue) => {
      return accumulator + currentValue;
    },
    0
  );

  return totalItemsInStock;
};
const renderItemsInStock = () => {
  const numberOfItems = items.length;
  const itemCountElement = document.querySelector("#itemCount");
  const total = getItemsInStock();
  if (itemCountElement) {
    itemCountElement.textContent = `Antal produkter: ${total} av ${numberOfItems}`;
  }
};

const renderStoreItems = () => {
  renderItemsInStock();
  sortItems();
  storeItemsListEl.innerHTML = items
    .map((item) => {
      const isDisabled = item.stock_quantity <= 0;
      const buttonText = isDisabled ? "Ej i lager" : "Köp";
      return `
			<div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4 d-flex align-items-center justify-content-center flex-column">
				<div class="card">
					<div class="list-group-item"><img class="card-img-top" src=${BASE_URL}${
        item.images.thumbnail
      } alt="image of candy"></div>
					<div class="card-body">
						<p class="card-title">${item.name}</p>
						<p class="card-text">${item.price}kr</p>
					</div>
					<a href="#" class="infoButton mb-3" data-item-id=${item.id}>Läs mer</a>
					<div>
					<button class="placeInCartButton btn btn-light mb-3" data-item-id=${item.id} ${
        isDisabled ? "disabled" : ""
      }> ${buttonText}</button>
					</div>
				</div>
			</div>
		`;
    })
    .join("");
};

getStoreItems();

storeItemsListEl.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const clickedItemId = Number(target.dataset.itemId);
  items.find((item) => {
    if (item.id === clickedItemId && target.classList.contains("infoButton")) {
      modalEl.innerHTML = `
				<div class="text-center container" id="infoContainer">
					<div class="row row-cols-sm-1 row-cols-md-1">
					<button type="button" class="btn-close border mb-3 p-3 col align-self-start" aria-label="Close" id="closeInfoModal"></button>
						<img class="img-fluid col" src=${BASE_URL}${item.images.large} alt="large image of candy">
						<div class="col text-start border align-self-center">
							<div>
								<p class="fs-5">${item.name}</p> 
								<p>${item.price} kr</p>
								<p>Antal i lager: ${item.stock_quantity}</p> 
								${item.description}
							</div>
						</div>
					</div>
				</div>
			`;
      modalEl.showModal();
    }
    if (
      item.id === clickedItemId &&
      target.classList.contains("placeInCartButton")
    ) {
      localItems.push(item);
      saveCart();
      //console.log(item.stock_quantity)
      addToCart(item);
    }
  });
});

modalEl.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "BUTTON") {
    modalEl.close();
  }
});

const findExistingCartItem = (itemId: number): HTMLElement | null => {
  return document.querySelector(`.listCart .item[data-item-id="${itemId}"]`);
};

const updateExistingCartItem = (
  existingCartItem: HTMLElement,
  productPrice: number,
  currentQuantity: number,
  item: Item
): void => {
  if (existingCartItem) {
    const quantityElement = existingCartItem.querySelector(
      ".antal span:nth-child(1)"
    );
    if (quantityElement) {
      currentQuantity += 1;
      quantityElement.textContent = currentQuantity.toString();
    }

    const totalPriceElement = existingCartItem.querySelector(".totaltPris");
    if (totalPriceElement) {
      const totalPrice = productPrice * currentQuantity;
      totalPriceElement.textContent = `${totalPrice} kr`;
    }

    const existingCartItemIndex = cartItems.findIndex(
      (cartItem) => cartItem.product_id === item.id
    );

    if (existingCartItemIndex !== -1) {
      cartItems[existingCartItemIndex].qty = currentQuantity;
      cartItems[existingCartItemIndex].item_total =
        productPrice * currentQuantity;
    }

    orderTotal();
  }
};

const addNewCartItem = (item: Item, productPrice: number): void => {
  cartItems.push({
    product_id: item.id,
    qty: 1,
    item_price: productPrice,
    item_total: productPrice,
    name: item.name,
  });

  const newItemElement = createCartItemElement(item);
  const cartContainer = document.querySelector(".listCart");
  if (cartContainer) {
    cartContainer.appendChild(newItemElement);
    orderTotal();
  }
};

const createCartItemElement = (item: Item): HTMLElement => {
  const newItemElement = document.createElement("div");
  newItemElement.classList.add("item");
  newItemElement.setAttribute("data-item-id", item.id.toString());
  newItemElement.innerHTML = `
		<div class="containerImgPrice">
			<div class="produktbild">
				<img src="${BASE_URL}${item.images.thumbnail}" alt="${item.name}" class="cart-item-image">
			</div>
			<div class="produktnamn">${item.name}</div>
			<div class="totaltPris">${item.price} kr</div>
		</div>
		<div class="containerQtyTrash">
			<div class="antal">
				<span>1</span>
			</div>
			<div class="trashbin">
				<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="currentColor"
				class="bi bi-trash3-fill"
				viewBox="0 0 16 16"
				>
				<path
				d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"
				/>
				</svg>
			</div>
		</div>
	`;

  const trashbinElement = newItemElement.querySelector(".trashbin");
  if (trashbinElement) {
    trashbinElement.addEventListener("click", () => {
      localItems.map((localItem) => {
        if (item.id === localItem.id) {
          const index = localItems.findIndex((localItem) => {
            return localItem.id === item.id;
          });
          localItems.splice(index, 1);
          console.log(index);
          localStorage.setItem("localItems", JSON.stringify(localItems));
          console.log(localItems);
          saveCart();
        }
      });
      defaultStock.map((stock) => {
        if (item.id === stock.id) {
          item.stock_quantity = stock.stock_quantity;
          renderStoreItems();
        }
      });
      removeCartItem(item.id);
    });
  }
  return newItemElement;
};

const removeCartItem = (itemIdToRemove: number): void => {
  const itemElementToRemove = document.querySelector(
    `.item[data-item-id="${itemIdToRemove}"]`
  );

  if (itemElementToRemove) {
    itemElementToRemove.remove();
    const indexToRemove = cartItems.findIndex(
      (item) => item.product_id === itemIdToRemove
    );

    if (indexToRemove !== -1) {
      cartItems.splice(indexToRemove, 1);
      const updatedLocalItems = localItems.filter(
        (item) => item.id !== itemIdToRemove
      );
      localStorage.setItem("localItems", JSON.stringify(updatedLocalItems));
      localItems = updatedLocalItems;
      orderTotal();
    }
  } else {
    console.log("Elementet hittades inte med det angivna itemId:t.");
  }
};

const addToCart = (item: Item) => {
  const existingCartItem = findExistingCartItem(item.id);
  const productPrice = parseFloat(item.price.toString());

  if (existingCartItem) {
    const currentQuantity = Number(
      existingCartItem.querySelector(".antal span:nth-child(1)")?.textContent ||
        "0"
    );
    updateExistingCartItem(
      existingCartItem,
      productPrice,
      currentQuantity,
      item
    );
  } else {
    addNewCartItem(item, productPrice);
    console.log("cartItems:", JSON.stringify(cartItems));
  }
  item.stock_quantity--;
  saveCart();
  renderStoreItems();
  console.log(cartItems);
};

const iconCart = document.querySelector(".cartBtn") as HTMLButtonElement;
const closeCart = document.querySelector(".closeCart") as HTMLElement;
const body = document.querySelector("body") as HTMLBodyElement;
const totalOrderCostEl = document.querySelector(
  ".totalOrderCost"
) as HTMLElement;
const cartBtnEl = document.querySelector(".cartBtn") as HTMLElement;

iconCart.addEventListener("click", () => {
  body.classList.toggle("showCart");
});

closeCart.addEventListener("click", () => {
  body.classList.toggle("showCart");
});

export function orderTotal() {
  let orderPrice = 0;
  cartItems.forEach((item) => {
    orderPrice += item.item_price * item.qty;
  });
  totalOrderCostEl.innerHTML = `${orderPrice} kr`;
  cartBtnEl.innerHTML = `${orderPrice} kr  
  <svg
  xmlns="http://www.w3.org/2000/svg"
  width="20"
  height="20"
  fill="currentColor"
  class="bi bi-basket3-fill"
  viewBox="0 0 16 16"
>
  <path
    d="M5.757 1.071a.5.5 0 0 1 .172.686L3.383 6h9.234L10.07 1.757a.5.5 0 1 1 .858-.514L13.783 6H15.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-1A.5.5 0 0 1 .5 6h1.717L5.07 1.243a.5.5 0 0 1 .686-.172zM2.468 15.426.943 9h14.114l-1.525 6.426a.75.75 0 0 1-.729.574H3.197a.75.75 0 0 1-.73-.574z"
  />
</svg>`;
  return orderPrice;
}

const renderLocalStorage = () => {
  localItems.map((item) => {
    addToCart(item);
  });
};

renderLocalStorage();
