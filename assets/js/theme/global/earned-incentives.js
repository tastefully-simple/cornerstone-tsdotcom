import utils from '@bigcommerce/stencil-utils';
import 'foundation-sites/js/foundation/foundation';
import 'regenerator-runtime/runtime';
import swal from './sweet-alert.js';
import $ from 'jquery';

export default class EarnedIncentives {
    constructor(context) {
        this.context = context;

        if (this.isLoggedIn()) {
            const that = this;
            $(document).ready(() => {
                that.setupGlobalIncentives();
                that.grabCartItemIds().then((cartItemIds) => {
                    that.setupIncentives(cartItemIds);
                });
            });
        } //else if (window.location.href.indexOf("earned-incentives") > -1) {
           // window.location.href = '/login.php';
        //}

        return this;
    }

    isLoggedIn() {
        return this.context.customerId ? true : false;
    }

    bindIncentiveOnclick() {
        const that = this;
        document.querySelector('.incentive-list').addEventListener('click', function (e) {
            if(e.target.parentNode.classList.contains('incentive-item-add') && e.target.disabled == false) {

                e.target.disabled = true;
                e.target.innerText = 'Adding...';

                let formData = new FormData();
                formData.set('action', 'add');
                formData.set('product_id', e.target.dataset.productId);
                formData.set('qty[]', e.target.dataset.qty);

                utils.api.cart.itemAdd(formData, (err, response) => {
                    if (err == null) {
                        e.target.innerText = 'Added!';
                        let qty = 0;

                        // Get existing quantity from localStorage if found
                        if (utils.tools.storage.localStorageAvailable()) {
                            if (localStorage.getItem('cart-quantity')) {
                                qty = Number(localStorage.getItem('cart-quantity'));
                            }
                        }

                        if (response.data.hasOwnProperty('line_items')) {
                            response.data.line_items.forEach(function(item) {
                                qty += item.quantity;
                            });

                            that.updateMiniCart(qty);
                        } else {
                            utils.api.cart.getCartQuantity({}, (err, qty) => {
                                if (typeof qty === 'number') {
                                    that.updateMiniCart(qty);
                                }
                            });
                        }
                    }
                    if (err) {
                        console.warn('Unable to place incentive item in cart');
                        console.warn('err', err);
                        console.warn('err response', response);
                    }
                });
            }
        });
    }

    async setupIncentives(cartItemIds) {
        const incentiveProducts = await this.getIncentives(cartItemIds);

        let incentiveProductIds = [];
        incentiveProducts.forEach((incentiveProduct) => {
            if(incentiveProduct.expirationDate >= new Date()) {
                incentiveProductIds.push(incentiveProduct.productId);
            }
        });

        const removedCartItems = await this.removeExpiredIncentives(incentiveProductIds);
        if (removedCartItems.length > 0) {
            swal.fire({
                title: 'Expired Incentives',
                text: `${removedCartItems.length} product${removedCartItems.length == 1 ? ' has' : 's have'} been removed from the cart`,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            this.updateCart();
        }

        if (window.location.href.indexOf("earned-incentives") > -1) {
            this.bindIncentiveOnclick();
            this.addIncentivesToPage(incentiveProducts);
        } 
    }

    async grabCartItemIds() {
        const that = this;
        const cartItemIds = [];
        if (that.context.cartId) {
            await fetch('/api/storefront/checkouts/' + that.context.cartId, {
                credentials: 'include'
            }).then(
                response => response.json()
            ).then(function (response) {
                if(response) {
                    response.cart.lineItems.physicalItems.forEach((product) => {
                        cartItemIds.push(product.productId);
                    });
                }
            }).catch(function (err) {
                return cartItemIds;
            });
        } else {
            return cartItemIds;
        }
        return cartItemIds;
    }

    async getIncentives(cartItemIds) {
        const that = this;
        //const jwtToken = await window.jwtToken();
        const retryCount = 2;
        let tryCount = 1;
        const incentiveProducts = [];
        let apiUrl = this.context.themeSettings.consultant_management.api_url;
        await $.ajax({
            url: `${apiUrl}/incentives/${that.context.customerId}/list`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'//,
                //'jwt-token': jwtToken
            },
            success(response) {
                if(response && response.rewards && response.rewards.items) {
                    response.rewards.items.forEach((product) => {
                        let productDisabled = false;
                        let expirationDate = new Date(Date.parse(product.expirationDate));
                        let expirationDateString = `${expirationDate.getMonth()+1}/${expirationDate.getDate()}/${expirationDate.getFullYear()}`;

                        if(cartItemIds.includes(product.productId)) {
                            productDisabled = true;
                        }

                        let incentiveProduct = {
                            name: product.productName,
                            expirationDateString: expirationDateString,
                            expirationDate: expirationDate,
                            productId: product.productId,
                            qty: product.quantity,
                            disabled: productDisabled,
                        };
                        incentiveProducts.push(incentiveProduct);
                    });
                    return incentiveProducts;
                }
            },
            // eslint-disable-next-line no-unused-vars
            error(xhr, status, error) {
                const request = this;
                // Retry req with fresh token
                if (xhr.status == 401 && tryCount <= retryCount) {
                    tryCount++;
                    window.jwtToken(true).then((freshToken) => {
                        request.headers['jwt-token'] = freshToken;
                        return $.ajax(request);
                    });
                } else {
                    console.error('Error getting incentive products', xhr, status, error);
                }
                return [];
            },
        })
        return incentiveProducts;
    }

    addIncentivesToPage(inventiveProducts) {
        inventiveProducts.forEach((inventiveProduct) => {
            let title = inventiveProduct.name;
            let date = inventiveProduct.expirationDateString;
            let productId = inventiveProduct.productId;
            let qty = inventiveProduct.qty;
            let disabled = inventiveProduct.disabled;
            let btnMessage = disabled ? "Added!" : "Add to Cart";
            let expirationDate = inventiveProduct.expirationDate;

            if(expirationDate >= new Date()) {
                let incentiveItem = document.createElement('div');
                incentiveItem.classList.add("incentive-item");
                incentiveItem.innerHTML = `
                <p class="incentive-item-image"><img alt="2024 November Host Special Level 4" src="https://cdn11.bigcommerce.com/s-1c522nibiw/products/621/images/1338/incentiverewarditem__73073.1730437448.220.290.png?c=1" class="sc-crozmw FKOmK"></p>
                <p class="incentive-item-title">${title}</p>
                <p class="incentive-item-date">Available Until: ${date}</p>
                <div class="incentive-item-add">
                    <button ${disabled ? 'disabled="true"' : ''} 
                        data-product-id="${productId}" 
                        data-qty="${qty}" 
                        class="button button--primary">${btnMessage}</button>
                </div>
                `;
                document.querySelector('.incentive-list').append(incentiveItem);
            }
        });
        if(inventiveProducts.length < 1){
            console.log('rewards has no items');
            var incentiveItem = document.createElement('div');
            incentiveItem.classList.add("alertBox");
            incentiveItem.innerHTML = '<span>You have no earned incentives.</span>';
            document.querySelector('.incentive-list').append(incentiveItem);
        }
    }

    async removeExpiredIncentives(activeIncentiveItemIds) {

        let cartLineItems = await this.getLineItemIds();
        let cartLineItemIds = [];
        cartLineItems.forEach((item) => {
            cartLineItemIds.push(item.productId);
        });
        let incentiveLineItems = await this.getIncentiveCartItem(cartLineItemIds);
                
        let incentiveCartLineItemsToRemove = [];
        cartLineItems.forEach((cartItem) => {
            if (incentiveLineItems.includes(cartItem.productId) && !activeIncentiveItemIds.includes(cartItem.productId)) { 
                incentiveCartLineItemsToRemove.push(cartItem);
            }
        });
        let cartItemQty = 0;
        incentiveCartLineItemsToRemove.forEach((cartItem) => {
            cartItemQty = this.removeItemFromCart(cartItem.cartItemId);
        });
        if (incentiveCartLineItemsToRemove.length > 0) {
            this.updateMiniCart(cartItemQty);
        }

        return incentiveCartLineItemsToRemove;
    }

    async getLineItemIds() {
        const that = this;
        try {
            const graphqlToken = window.themeGraphql;
            //let hasNextPage = null;
            //let startCursor = '';
            const response = await fetch('/graphql', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${graphqlToken}`
                },
                body: JSON.stringify({
                    query: `
                        query {
                          site {
                            checkout {
                              cart {
                                lineItems {
                                  physicalItems {
                                    productEntityId
                                    entityId
                                  }
                                }
                              }
                            }
                          }
                        }
                    `
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }


            let data = await response.json();
            console.log(data);
            const itemData = that.parseCartItems(data) ?? [];
            return itemData;
        } catch (error) {
            return [];
        }
    }

    async getIncentiveCartItem(productIds) {
        //const that = this;
        //const entityIdString = `[${productIds.join()}]`;
        let incentiveProductIds = [];
        let apiUrl = this.context.themeSettings.consultant_management.api_url;
        //alternate method for checking if cart items are incentive items...
        await $.ajax({
          url: `${apiUrl}/incentives/items/${productIds.join()}`,
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          },
          success(response) {
            if(response && response.incentiveProductIds) {
              response.incentiveProductIds.forEach((id) => {
                  incentiveProductIds.push(id);
              });
            return incentiveProductIds;
            }
          },
          // eslint-disable-next-line no-unused-vars
          error(xhr, status, error) {
              console.error('Error getting incentive products list', xhr, status, error);
              return [];
          },
        })

       return incentiveProductIds;
    }

    parseCartItems(data) {
        let lineItems = [];
        let physicalItems = data.data.site.checkout.cart.lineItems.physicalItems ?? [];
        physicalItems.forEach((product) => {
            let productId = product.productEntityId ?? null;
            let cartItemId = product.entityId ?? null;
            if (productId != null) {
                lineItems.push({
                    'productId': productId,
                    'cartItemId': cartItemId,
                });
            }
        });
        return lineItems;
    }

    parseProducts(data) {
        let productsData = [];
        let products = data.data.site.products.edges ?? [];
        products.forEach((product) => {
            let productId = product.node.entityId ?? null;
            let productCategories = product.node.categories.edges ?? [];
            let categoryNames = [];
            productCategories.forEach((category) => {
                categoryNames.push(category.node.name ?? null);
            });
            if (productId != null) {
                productsData.push({
                    'productId': productId,
                    'categories': categoryNames,
                });
            }
        });
        return productsData;
    }

    async removeItemFromCart(lineId) {
        const that = this;
        if (that.context.cartId) {
            const options = {
                credentials: 'include',
                method: 'DELETE',
                headers: {
                    Accept: 'application/json', 
                    'Content-Type': 'application/json'
                }
            }
            await fetch(`/api/storefront/checkouts/${that.context.cartId}/carts/${that.context.cartId}/items/${lineId}`, options).then(
                response => response.json()
            ).then(function (response) {
                let cartItemCount = 0;
                Object.keys(response.cart.lineItems).forEach((lineType) => {
                    response.cart.lineItems[lineType].forEach((lineItem) => {
                        cartItemCount += lineItem.quantity ?? 1;
                    });
                });
                return cartItemCount;
            }).catch(function (err) {
                console.error('Error removing item from cart', err);
                return false;
            });
        }
    }

    updateMiniCart(qty) {
        const $body = $('body');
        $body.trigger('cart-quantity-update', qty);
    }

    updateCart() {
        const $body = $('body');
        $body.trigger('cart-refresh');
    }

    async setupGlobalIncentives() {
        const customerId = this.context.customerId;

        const apiUrl = this.context.themeSettings.consultant_management.api_url;

        if(!customerId ? true : false) {
            return null;
        }

        //const jwtToken = await window.jwtToken();
        const mobileSelector = '.mobile-nav-name .razoyo-sticker.incentives';
        const desktopSelector = '.navUser-item .razoyo-sticker.incentives';
        const incentivesMenuSelector = '.user-incentives-menu';
        const incentivesAccountSelector = '.earned-incentives-account';
        const retryCount = 2;
        let tryCount = 1;

        $.ajax({
           url: `${apiUrl}/incentives/${customerId}/count`,
           method: 'GET',
           headers: {
               'Content-Type': 'application/json'//,
               //'jwt-token': jwtToken
           },
           success(response) {
            if (response && response.rewards){
                if(response.rewards.isConsultant == true){
                    document.querySelector(incentivesMenuSelector).classList.remove('hidden');
                    if(document.querySelector(incentivesAccountSelector) != null)
                        document.querySelector(incentivesAccountSelector).classList.remove('hidden');
                } 
            }

            if (response && response.rewards && response.rewards.count) {
                // Mobile
                document.querySelector(mobileSelector + ' .sticker-text').innerText = response.rewards.count;

                // Desktop
                document.querySelector(desktopSelector + ' .sticker-text').innerText = response.rewards.count;

                if(response.rewards.count != 0) {
                    document.querySelector(mobileSelector).classList.remove('hidden');
                    document.querySelector(desktopSelector).classList.remove('hidden');
                }
            } else {
                // Mobile
                document.querySelector(mobileSelector + ' .sticker-text').innerText = 0;

                // Desktop
                document.querySelector(desktopSelector + ' .sticker-text').innerText = 0;

                document.querySelector(mobileSelector).classList.add('hidden');
                document.querySelector(desktopSelector).classList.add('hidden');
            }
           },
           error(xhr, status, error) {
               const request = this;
               // Retry req with fresh token
               if (xhr.status == 401 && tryCount <= retryCount) {
                   tryCount++;
                   window.jwtToken(true).then((freshToken) => {
                       request.headers['jwt-token'] = freshToken;
                       return $.ajax(request);
                   });
               } else {
                   // Mobile
                   document.querySelector(mobileSelector + ' .sticker-text').innerText = 0;

                   // Desktop
                   document.querySelector(desktopSelector + ' .sticker-text').innerText = 0;

                   document.querySelector(mobileSelector).classList.add('hidden');
                   document.querySelector(desktopSelector).classList.add('hidden');
               }
           },
       });
    }
}
