const TAX_RATE = 0.1;
const FREE_SHIPPING_THRESHOLD = 10000;
const SHIPPING_RATE = 500;


const cartSubTotal = (cart) => {
    const subTotal = cart.reduce((counter, product) => {
        return counter + product.price * product.qty
    }, 0)

    return subTotal;
};

const shouldPayShipping = (cart) => {
    const subTotal = cartSubTotal(cart)

    return subTotal < FREE_SHIPPING_THRESHOLD
};

const cartTaxes = (cart) => {
    const subTotal = cartSubTotal(cart);

    return subTotal * TAX_RATE;
};

const cartTotal = (cart) => {
    const subTotal = cartSubTotal(cart);

    const shipping = shouldPayShipping(cart) ? SHIPPING_RATE : 0;

    const total = subTotal + subTotal * TAX_RATE + shipping;

    return Math.round(total);
};

module.exports = {
    cartSubTotal,
    shouldPayShipping,
    cartTotal,
    cartTaxes,
}