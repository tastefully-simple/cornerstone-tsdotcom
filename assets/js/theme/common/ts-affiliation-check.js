import TSApi from './ts-api';
import TSCookie from './ts-cookie';

export default class TSAffiliationCheck {
    constructor() {
        this.api = new TSApi();

        this.init();
    }

    init() {
        this.getCartData()
            .then(cart => {
                if (cart.length > 0) {
                    var affiliateReference = TSCookie.getAffiliateRef();
                    var experienceReference = TSCookie.getExperienceRef();
                    const affiliations = {
                        cartID: cart[0].id,
                        email: cart[0].email ? cart[0].email : "",
                        reference: affiliateReference ? affiliateReference : "",
                        experience: experienceReference ? experienceReference : ""
                    };

                    this.api.affiliationCheck(affiliations);
                }
            })
            .catch(err => console.warn('StorefrontAPI::getCart()', err));
    }

    getCartData() {
        return fetch('/api/storefront/cart', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json());
    }
}
