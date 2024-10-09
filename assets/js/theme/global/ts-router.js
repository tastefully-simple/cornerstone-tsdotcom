import querystring from 'querystring';
import TSCookie from '../common/ts-cookie';
import TSApi from '../common/ts-api';

export default class TSRouter {
    constructor(settings) {
        this.settings = settings;
        this.api = new TSApi();

        this.checkUrls();
    }

    checkUrls() {
        // Function returns true to stop routing chain
        return this.checkUrlForBuyNow()
            || this.checkUrlForConsultantId()
            || this.checkUrlForConsultantWebSlug()
            || this.checkUrlForTest();
    }

    //
    // CHECKS
    //

    /**
     * This function is responsible for grabbing the URL parameters before the BigCommerce cart
     * redirect happens. We are then able to use the Tastefully Simple SCID to display the associated
     * affiliate name from Social Bug on the screen.
     */
    checkUrlForBuyNow() {
        const params = this.getQuery();
        if (params.affiliate_action && params.affiliate_action === 'add') {
            this.showLoading();

            fetch(`/cart.php?action=add&sku=${params.sku}&source=buy_button`)
                .then(() => {
                    window.location = this.apiUrl(params.SCID);
                });

            return true;
        }

        return false;
    }

    // SCID
    checkUrlForConsultantId() {
        const szUrl = window.location.search;
        const matches = szUrl.match(/scid=\d+/ig);

        if (matches) {
            const consultantId = matches[0].substring(5);

            this.showLoading();

            this.api.getConsultantInfo(consultantId)
                .done(data => {
                    TSCookie.setConsultantId(data.ConsultantId);
                    TSCookie.setConsultantName(data.Name);
                    TSCookie.setConsultantImage(data.Image);
                    window.location = window.location.pathname;
                })
                .catch(err => console.warn('checkUrlForConsultantId', err));

            return true;
        }
        return false;
    }

    // Consultant Web Slug
    checkUrlForConsultantWebSlug() {
        const szUrl = window.location.pathname;

        if (szUrl.match(/^\/web\/[a-z0-9\W]+/i)) {
            this.showLoading();
            const cUsername = szUrl.substring(5);

            this.api.getConsultantByUsername(cUsername)
                .then(res => res.json())
                .then(data => {
                    if (data.ConsultantId) {
                        const cname = `${data.FirstName} ${data.LastName}`;
                        TSCookie.setConsultantName(cname);
                        TSCookie.setConsultantId(data.ConsultantId);
                        window.location = '/web';
                    } else {
                        TSCookie.deleteConsultant();
                        window.location = '/shop';
                    }
                })
                .catch(err => {
                    console.warn('getConsultantByUsername', err);
                    window.location = '/';
                });

            return true;
        }
        return false;
    }


    checkUrlForTest() {
        /*
        const params = this.getQuery();
        if (params.tstroutetest && params.tstroutetest == "1") {
            window.location = 'https://www.google.com/';
            return true;
        }

        // Check cookie
        TSCookie.SetTest('thisisacookie');
        */
        return false;
    }

    //
    // HELPERS
    //


    apiUrl(uri) {
        return this.settings.ts_api_environment
            ? `https:\/\/${this.settings.ts_api_environment}-${this.settings.ts_tsapi_base_url}${uri}`
            : `https:\/\/${this.settings.ts_tsapi_base_url}${uri}`;
    }

    getQuery() {
        return querystring.parse(window.location.search.substr(1));
    }

    showLoading() {
        $(() => {
            const docHeight = $(document).height();
            $('#page-wrapper').html(`
                <div class="loader-icon">
                    <div class="sk-chase">
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                    </div>
                </div>
                <div id='overlay' class='body-overlay'></div>
            `);
            $('#overlay').height(docHeight);
        });
    }


}
