
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

import { orderTotal, storeItemsListEl } from './main';
import { Order } from './types';
import { placeOrder } from './api';
import { cartItems } from './main';
import { OrderRes } from './types';

export const checkout = () => {
    const sum = orderTotal();
    document.querySelector<HTMLElement>("#hero")!.innerHTML = `
        <div class="container" id="navbar-top">
            <div class="row align-items-center">
                <div class="col-12 col-md-12 col-sm-12">
                    <a class="navbar-brand center" href="index.html">
                        <img
                        src="/images/bortakvall-s.png"
                        alt="Bortakväll"
                        class="mx-auto d-block img-fluid"
                        />
                    </a>
                </div>
            </div>    
        </div>    
        `;
    storeItemsListEl.innerHTML = `
        <div class="container mt-5 mb-5 rounded p-5 border" id="formContainer">
            <h1 class="text-center mb-4" id="kassa"><span id="kassaK">K</span><span id="kassaA">a</span>s<span id="kassaS">s</span><span id="kassaAA">a</span></h1>
            <form action="#" method="post" id="form">
                <div class="form-group row">
                    <div class="col-sm-6">
                        <label for="firstName">First Name:</label>
                        <input type="text" class="form-control mb-2" id="firstName" name="firstName" required>
                    </div>
                    <div class="col-sm-6">
                        <label for="lastName">Last Name:</label>
                        <input type="text" class="form-control mb-2" id="lastName" name="lastName" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="adress">Adress:</label>
                    <input type="text" class="form-control mb-2" id="adress" name="adress" required>
                </div>
                <div class="form-group row">
                    <div class="col-sm-6">
                        <label for="postnummer">Postnummer (max 6 tecken):</label>
                        <input type="text" class="form-control mb-2" id="postnummer" name="postnummer" maxlength="6"
                            required>
                    </div>
                    <div class="col-sm-6">
                        <label for="ort">Ort:</label>
                        <input type="text" class="form-control mb-2" id="ort" name="ort" required>
                    </div>
                </div>
                <div class="form-group row">
                    <div class="col-12 col-md-6 mb-2">
                        <label for="telefon">Telefonnummer:</label>
                        <input type="tel" class="form-control" id="telefon" name="telefon">
                    </div>
                    <div class="col-12 col-md-6 mb-2">
                        <label for="epost">E-post:</label>
                        <input type="email" class="form-control" id="epost" name="epost" required>
                    </div>
                </div>
                <div class="mt-4 p-3 border rounded mb-2 text-center" id="estiContainer">
                    <div id="cartItemsContainer"></div>
                    <strong>Totalt belopp: ${sum}</strong>
                </div>        
                <div class="form-group row mt-3">
                    <div class="col-sm-6 text-center">
                    <a href="index.html">
                        <button type="button" class="btn btn-secondary mb-3" id="varukorgBtn">Tillbaka</button>
                    </a>    
                    </div>
                    <div class="col-sm-6 text-center">
                        <button type="submit" class="btn btn-primary mb-2" id="orderBtn">Lägg Order</button>
                    </div>
                    <div id="orderAlert" class="alert alert-success mt-3" role="alert" style="display: none;">
                    </div>
                </div>
            </form>
        </div>
        `;

    sendOrder(sum);

     const cartItemsContainer = document.querySelector("#cartItemsContainer");
     if (cartItemsContainer) {
         let cartContent = '<h2>Beställnings detaljer:</h2>';
         cartItems.forEach(item => {
             cartContent += `
                 <div class="cart-item">
                    <p><span id="kassaVara">${item.qty}st  ${item.name}</span> <br> Pris per vara: ${item.item_price} kr <br> Total pris för antal: ${item.item_total} kr</p>
                 </div>`;
         });
         cartItemsContainer.innerHTML = cartContent;
     }
}

const sendOrder = (sum: number) => {
    const formEl = document.querySelector<HTMLFormElement>("#form")!;
    const firstNameEl = document.querySelector<HTMLInputElement>("#firstName")!;
    const lastNameEl = document.querySelector<HTMLInputElement>("#lastName")!;
    const adressEl = document.querySelector<HTMLInputElement>("#adress")!;
    const postcodeEl = document.querySelector<HTMLInputElement>("#postnummer")!;
    const cityEl = document.querySelector<HTMLInputElement>("#ort")!;
    const phoneNumEl = document.querySelector<HTMLInputElement>("#telefon")!;
    const emailEl = document.querySelector<HTMLInputElement>("#epost")!;
    const orderButton = document.querySelector<HTMLButtonElement>("#orderBtn");
    const orderAlert = document.querySelector<HTMLInputElement>("#orderAlert")!;

    formEl?.addEventListener("submit", async e => {
        e.preventDefault();
          if (cartItems.length === 0) {
            orderAlert.className = "alert alert-warning mt-3"; 
            orderAlert.textContent = "Varukorgen är tom. Lägg till produkter innan du fortsätter med beställningen.";
            orderAlert.style.display = "block";
            return;
        }
        const order: Order =
        {
            customer_first_name: firstNameEl.value,
            customer_last_name: lastNameEl.value,
            customer_address: adressEl.value,
            customer_city: cityEl.value,
            customer_postcode: postcodeEl.value,
            customer_email: emailEl.value,
            customer_phone: phoneNumEl.value,
            order_total: sum,
            order_items: cartItems
        }
        try {
            const orderRes: OrderRes = await placeOrder(order)

            orderAlert.textContent = `Din order har lagts med ordernummer: ${orderRes.id}`;
            orderAlert.style.display = "block";
            localStorage.removeItem('localItems');
            if (orderButton) {
                orderButton.disabled = true;
            }
        }
        catch (err) {
            orderAlert.className = "alert alert-danger"; 
            orderAlert.textContent = `Kunde inte slutföra order: ${err}`;
            orderAlert.style.display = "block";
        }
    })
}

