import PageManager from './page-manager';

import utils from '@bigcommerce/stencil-utils';
import $ from 'jquery';
import 'foundation-sites/js/foundation/foundation';
import 'regenerator-runtime/runtime';

export default class EarnedIncentives extends PageManager {
    constructor(context) {
        super(context);
        return this;
    }

    onReady() {
        console.log("EarnedIncentives2");
        if(this.isLoggedIn()) {
            
            this.bindIncentiveOnclick();

            this.setupIncentives();
        }


    }

    isLoggedIn() {
        return this.context.customerId ? true : false;
    }

    bindIncentiveOnclick() {
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
                        const $body = $('body');
                        e.target.innerText = 'Added!';
                        let qty = 0;

                        // Get existing quantity from localStorage if found
                        if (utils.tools.storage.localStorageAvailable()) {
                            if (localStorage.getItem('cart-quantity')) {
                                qty = Number(localStorage.getItem('cart-quantity'));
                            }
                        }

                        response.data.line_items.forEach(function(item) {
                            qty += item.quantity;
                        });

                        $body.trigger('cart-quantity-update', qty);
                    }
                    if (err) {
                        console.warn('err', err);
                        console.warn('err response', response);
                    }
                });
            }
        })
    }

    async setupIncentives() {
        await this.grabIncentives();
        await this.getIncentives(this.cartItemIds);
    }

    async grabIncentives() {
        const that = this;
        const itemIds = [];
        if (that.context.cartId) {
            await fetch('/api/storefront/checkouts/' + that.context.cartId, {
                credentials: 'include'
            }).then(
                response => response.json()
            ).then(function (response) {
                if(response) {
                    response.cart.lineItems.physicalItems.forEach((product) => {
                        itemIds.push(product.productId);
                    });
                }
                that.cartItemIds = itemIds;
            }).catch(function (err) {
                that.cartItemIds = itemIds;
            });
        } else {
            that.cartItemIds = itemIds;
        }
    }

    async getIncentives(disabledItemIds) {
        const that = this;
        const jwtToken = await window.jwtToken();
        const retryCount = 2;
        let tryCount = 1;

        $.ajax({
            url: `${that.context.consultantManagement.api_url}/incentives/${that.context.customerId}/list`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'jwt-token': jwtToken
            },
            success(response) {
                if(response && response.rewards && response.rewards.items) {
                    if(response.rewards.items.length > 0){
                        console.log('rewards has items')
                        response.rewards.items.forEach((product) => {
                            let productDisabled = false;
                            let buttonMessage = "Add to Cart";
                            let expirationDate = new Date(Date.parse(product.expirationDate));
                            let expirationDateString = `${expirationDate.getMonth()+1}/${expirationDate.getDate()}/${expirationDate.getFullYear()}`;
                            if(disabledItemIds.includes(product.productId)) {
                                productDisabled = true;
                                buttonMessage = "Added!";
                            }
    
                            if(expirationDate >= new Date()) {
                                that.addIncentive(
                                    product.productName, 
                                    expirationDateString, 
                                    product.productId, 
                                    product.quantity, 
                                    productDisabled,
                                    buttonMessage
                                );
                            }
                        });
                    }else {
                        console.log('rewards has no items');
                        var incentiveItem = document.createElement('div');
                        incentiveItem.classList.add("alertBox");
                        incentiveItem.innerHTML = '<span>You have no earned incentives.</span>';
                        document.querySelector('.incentive-list').append(incentiveItem);
                    }
                } else {
                    console.log('rewards is empty')
                    var incentiveItem = document.createElement('div');
                    incentiveItem.classList.add("alertBox");
                    incentiveItem.innerHTML = '<span>You have no earned incentives.</span>';
                    document.querySelector('.incentive-list').append(incentiveItem);
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
            },
        });
    }

    addIncentive(title, date, productId, qty, disabled, btnMessage) {
        var incentiveItem = document.createElement('div');
        incentiveItem.classList.add("incentive-item");
        incentiveItem.innerHTML = `
            <p class="incetinve-item-title">${title}</p>
            <p class="incetinve-item-date">Available Until: ${date}</p>
            <div class="incentive-item-add">
                <button ${disabled ? 'disabled="true"' : ''} 
                    data-product-id="${productId}" 
                    data-qty="${qty}" 
                    class="button button--primary">${btnMessage}</button>
            </div>
        `;
        document.querySelector('.incentive-list').append(incentiveItem);
    }

}
