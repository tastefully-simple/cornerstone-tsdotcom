import modalFactory from '../../global/modal';
import $ from 'jquery';
import 'foundation-sites/js/foundation/foundation';
import swal from '../../global/sweet-alert';
import utils from '@bigcommerce/stencil-utils';
import TSCookie from '../../common/ts-cookie';
import TSAffiliationCheck from '../../common/ts-affiliation-check';

// This is set as TRUE when all conditions to proceed to the checkout are cleared
window.allowSubscriptionCheckout = false;

// This is set as TRUE after BOLD submits to their checkout. It prevents the modals from being displayed again
window.boldCheckoutSubmitted = false;

/**
 * Renew the Current Customer API JWT token
 * @TODO Unify this with the one on subscription-manager.js
 * @returns {Promise<void>}
 */
async function renewToken() {
    const resource = `/customer/current.jwt?app_client_id=${window.currentCustomer.bigcommerce_app_client_id}`;
    window.currentCustomer.token = await fetch(resource)
        .then(response => {
            if (response.status === 200) {
                return response.text();
            }
            swal.fire({
                text: 'An error has happened. Please, try again later. (001)',
                icon: 'error',
            });
            return response.status;
        })
        .catch(error => {
            swal.fire({
                text: 'An error has happened. Please, try again later. (002)',
                icon: 'error',
            });
            return -1;
        });
}

class SubscriptionCart {
    constructor() {
        this.initListeners();
    }

    /**
     * Replaces all occurrences of the string "mapArray key" with the "mapArray value" in the "template" string
     * @param template
     * @param mapArray
     * @returns {*}
     */
    formatTemplate(template, mapArray) {
        let finalObj = template;
        // Replace all static data
        // eslint-disable-next-line guard-for-in
        for (const key in mapArray) {
            finalObj = finalObj.replaceAll(key, mapArray[key]);
        }
        return finalObj;
    }

    /**
     * Send a request to the BigCommerce login endpoint
     *
     * @param data
     * @returns {*}
     */
    sendLoginRequest(data) {
        const url = '/login.php?action=check_login';

        return $.ajax({
            type: 'POST',
            referrer: '/login.php',
            referrerPolicy: 'strict-origin-when-cross-origin',
            mode: 'cors',
            credentials: 'include',
            url,
            data,
        });
    }

    /**
     * Initialize event listeners
     */
    initListeners() {
        // Bind To checkout Button
        $('#page-wrapper').on('click', '.cart-actions .button--primary', (event) => {
            event.preventDefault();
            if (window.boldCheckoutSubmitted === true || window.allowSubscriptionCheckout === true) {
                return;
            }
            this.init(event);
        });

        // Sign-in form action
        $('body').on('submit', '#modal-autoship-sign-in form', (event) => {
            event.preventDefault();
            this.login(event);
        });

    }


    /**
     * Redirect customer to the checkout page
     */
    goToCheckout() {
        window.allowSubscriptionCheckout = true;
        document.querySelector('.cart-actions .button--primary').click();
    }

    /**
     * Initialize Subscription Cart
     * @param e
     */
    init(e) {
        const self = this;
        e.preventDefault();
        const cartBoldCheckout = document.querySelectorAll('.cart-item-title .definitionList .bold-subscriptions-interval-info');

        utils.api.cart.getCart({ includeOptions: true }, (err, response) => {
            if (self.hasAutoshipProducts(response)) {
                self.isCustomerLogged();
            } else {
                window.location = '/checkout';
            }
        });
    }


    /**
     * Verify if the cart has autoship-enabled products
     * @param cart
     * @returns {boolean}
     */
    hasAutoshipProducts(cart) {
        const autoshipData = window.localStorage.getItem('boldSubscriptionsSuccessfulAddToCarts') ?
            JSON.parse(window.localStorage.getItem('boldSubscriptionsSuccessfulAddToCarts')) : [];

        if (autoshipData.length > 0) {
            for (let i = 0; i < cart.lineItems.physicalItems.length; i++) {
                for (let j = 0; j < autoshipData.length; j++) {
                    if (autoshipData[j].line_item_id === cart.lineItems.physicalItems[i].id) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Verifies if customer is logged.
     * If the customer is NOT logged, display login modal.
     */
    isCustomerLogged() {
        // If not logged, show login modal
        if (!window.subscriptionManager.customerId) {
            this.showModal('sign-in');
            return false;
        }
    }

    /**
     * Show a modal window containing the template data from "type".
     * New types can be added by editing the constructor variable this.templates
     *
     * @param type
     */
    showModal(type, template) {
        const modal = this.createModal();
        const options = {
            template: `autoship/modals/${type}`,
        };
        this.loadModalContent(options, modal, template);
    }

    /**
     * Performs a get request to retrieve the template contents and load them into a modal
     * @param options
     * @param modal
     */
    loadModalContent(options, modal, template) {
        const self = this;
        utils.api.getPage('/', options, (err, tempResponse) => {
            let response = tempResponse;
            if (typeof template !== 'undefined') {
                response = self.formatTemplate(tempResponse, template);
            }

            if (err) {
                console.error(`Failed to get ${options.template}. Error:`, err);
                swal.fire({
                    text: 'An error has happened. Please, try again later. (002)',
                    icon: 'error',
                });
                return false;
            } else if (response) {
                modal.updateContent(response);
                $('.close-subscription-modal').click(() => {
                    modal.close();
                });
            }
        });
    }

    /**
     * Uses the modal factory to create a new modal
     * @returns {*}
     */
    createModal() {
        const modal = modalFactory('#subscriptions-modal-container')[0];
        modal.open({ clearContent: true, pending: true });

        return modal;
    }

    /**
     * Log-in customer
     * @param e
     * @returns {Promise<void>}
     */
    async login(e) {
        const $loginForm = $(e.currentTarget);
        try {
            await this.fetchLogin(`${$loginForm.serialize()}&authenticity_token=${window.BCData.csrf_token}`);
        } catch (x) {
            swal.fire({
                text: 'An error has happened. Please, try again later. (005)',
                icon: 'error',
            });
        }
    }

    /**
     * Send login request and verify if it is successful
     *
     * @param data
     * @returns {*}
     */
    fetchLogin(data) {
        const self = this;
        return this.sendLoginRequest(data)
            .done(async (res) => {
                const $resHtml = $(res);
                if ($($resHtml).find('#alertBox-message-text').length > 0) {
                    swal.fire({
                        text: $($resHtml).find('#alertBox-message-text').text(),
                        icon: 'error',
                    });
                } else {
                    // Get customer data from shopping cart
                    await utils.api.cart.getCart({ includeOptions: true }, (err, response) => {
                        if (err) {
                            console.error(`Failed to get cart. Error: ${err}`);
                        } else {
                            window.subscriptionManager.customerId = response.customerId;
                            window.subscriptionManager.customerEmail = response.email;

                            if (self.hasAutoshipProducts(response)) {
                                self.isCustomerLogged();
                            } else {
                                window.location = '/checkout';
                            }
                        }
                    });
                }
            });
    }
}

export default function (themeSettings) {
    if (window.location.href.indexOf('/cart.php') > -1) {
        return new SubscriptionCart();
    }
}
