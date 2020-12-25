'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    create: async (ctx) => {
        const {cart, userId} = ctx.request.body;

        const newCart = [];

        const result = await strapi.query('cart').model.query(qb => {
            qb.where('user', userId);
        }).fetch();

        if(!result) {
            await Promise.all(cart.map(async product => {
                const validatedProduct = await strapi.services.product.findOne({
                    id: product.id
                })

                if(validatedProduct){
                    newCart.push({
                        id:product.id,
                        qty:product.qty,
                    });
                }
                return validatedProduct;
            }));

            const data = {
                product_qty: [...newCart],
                user: userId,
            };
            const Cart = await strapi.query('cart').create(data);
            return Cart;
        } else {
            console.log('Cart already present Please use update method!!')
        }
    },

    update: async (ctx) => {
        const {cart, userId} = ctx.request.body;

        const newCart = [];

        const result = await strapi.query('cart').model.query(qb => {
            qb.where('user', userId);
        }).fetch();

        console.log('result',result.toJSON());

        if(result){
            const fetchedCart = result.toJSON().product_qty;
            const cartId = result.toJSON().id;

            await Promise.all(cart.map(async product => {
                const validatedProduct = await strapi.services.product.findOne({
                    id: product.id
                })
                let productAlreadyPresent = false;
                if(validatedProduct){
                    fetchedCart.forEach(p => {
                        if(p.id === validatedProduct.id){
                            p.qty = product.qty;
                            productAlreadyPresent = true;
                            newCart.push({
                                id:p.id,
                                qty:p.qty,
                            });
                        }
                    });

                    if(!productAlreadyPresent){
                        newCart.push({
                            id:product.id,
                            qty:product.qty,
                        });
                    }
                }
                return validatedProduct;
            }));

            console.log(newCart);
            const data = {
                product_qty: [...newCart],
                User: userId,
            }; 
            const updatedCart = await strapi.query('cart').update({id: cartId}, data);

            return {updatedCart};
        } else {
            console.log('cart not present Please use create method!!');
        }   
    },

    findOne: async(ctx) => {
        const userId = ctx.params.id;
        // console.log('userId',userId);

        const result = await strapi.query('cart').model.query(qb => {
            qb.where('user', userId);
        }).fetch();

        // console.log('result',result.toJSON());
        const cart = []

        if(result){
            const fetchedCart = result.toJSON().product_qty;
            const ids = [];
            fetchedCart.forEach(product => {
                ids.push(product.id);
            })
            console.log('ids',ids);
            const products = await strapi.query('product').find({ id: ids });
            products.forEach((product, i) => {
                cart.push(
                    {...product, qty: fetchedCart[i].qty}
                )
            });
        }
        return{ cart };
    },
};
