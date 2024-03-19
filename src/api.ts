import { Order } from "./types";

export const BASE_URL = "https://www.bortakvall.se"

export const placeOrder = async (order: Order) => {
	const res = await fetch(`https://www.bortakvall.se/api/v2/users/28/orders`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(order),
	
	});
	if (!res.ok) {
		throw new Error(`Kunde inte slutföra order: ${res.status}`);
	}
	const jsonRes = await res.json();
	return jsonRes['data'];
}

export const fetchStoreItems = async () => {
	const res = await fetch(`${BASE_URL}/api/v2/products`);
	const data = await res.json();

	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`)
	}
	//console.log(data);
	return data['data'];
};

