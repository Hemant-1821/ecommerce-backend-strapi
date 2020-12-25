'use strict';
const stripe = require('stripe')('sk_test_51H7dPFAaw3y0X9xcLPSCpDjO3bqN6c7xBhIkPfwQQDqSO5aomI7xQwRfY5JJJWt6JOFXAv18HbZH4KIzi4Flevfo00T072IgSf');
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
// const { cartTotal, cartSubTotal, cartTaxes } = require('../../../config/functions/cart');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    setUpStripe: async (ctx) => {
        let total = 0;
        let validatedCart = [];
        let receiptCart = [];

        const {cart} = ctx.request.body;

        await Promise.all(cart.map(async product => {
            const validatedProduct = await strapi.services.product.findOne({
                id: product.id
            })

            console.log("validated product",validatedProduct);
            if(validatedProduct){
                validatedProduct.qty = product.qty;

                validatedCart.push(validatedProduct);

                receiptCart.push({
                    id: product.id,
                    qty: product.qty,
                })
            }
            return validatedProduct;
        }));

        console.log("validatedCart",validatedCart);

        total = strapi.config.functions.cart.cartTotal(validatedCart);

        console.log("total", total);

        try{
            const paymentIntent = await stripe.paymentIntents.create({
                amount: total,
                currency: 'usd',
                payment_method_types: ['card'],
                payment_method:{
                    number : '4000002500003155',
                    cvc : '123',
                    expMonth : 11,
                    expYear : 2020
                },
                // confirm: true,
                metadata: {cart: JSON.stringify(cart)},
            });
    
            return paymentIntent;
        } catch(err) {
            return{ error: err.raw.message }
        }
    },

    create: async (ctx) => {
        const {
            paymentIntent,

            shipping_name,
            shipping_address,
            shipping_state,
            shipping_country,
            shipping_zip,

            cart,
        } = ctx.request.body;

        const status = await stripe.paymentIntents.retrieve(
            paymentIntent.id
        );

        console.log('order.create status',status);

        return {status};

        let product_qty = [];
        let products = [];
        let sanitizedCart = [];

        await Promise.all(cart.map(async product => {
            const foundProduct = await strapi.services.product.findOne({ id: product.id });

            if(foundProduct){
                product_qty.push({
                    id: product.id,
                    qty: product.qty,
                });

                products.push(foundProduct);

                sanitizedCart.push(
                    {...foundProduct, ...{qty: product.qty}}
                )
            }

            return foundProduct;
        }));

        let total_in_cents = strapi.config.functions.cart.cartTaxes(sanitizedCart);
        let subtotal_in_cents = strapi.config.functions.cart.cartSubTotal(sanitizedCart);
        let taxes_in_cents = strapi.config.functions.cart.cartTotal(sanitizedCart);

        const entry = {
            shipping_name,
            shipping_address,
            shipping_state,
            shipping_country,
            shipping_zip,

            product_qty,
            products,

            total_in_cents,
            subtotal_in_cents,
            taxes_in_cents,
        }

        const entity = await strapi.services.orders.create(entry);
        return sanitizeEntity(entity, { model: strapi.models.orders });
    },
};
