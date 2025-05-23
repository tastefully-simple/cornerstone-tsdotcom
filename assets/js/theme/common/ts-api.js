export default class TSApi {
    constructor() {
        this.baseUrl = window.theme_settings.ts_api_environment
            ? `https:\/\/${window.theme_settings.ts_api_environment}-${window.theme_settings.ts_tsapi_base_url}`
            : `https:\/\/${window.theme_settings.ts_tsapi_base_url}`;

    }

    fullUrl(uri) {
        return this.baseUrl + uri;
    }


    welcomeCheck(email) {
        return fetch(this.fullUrl('/users/welcome/check'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
    }

    /*
     * Check Customer last login
     */
    lastLoginCheck(email) {
        return fetch(this.fullUrl('/users/welcome/lastLogin'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
    }

    affiliationCheck(affiliations) {
        console.log("affiliationCheck")
        return fetch(this.fullUrl('/webhook/store/cart/affiliate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(affiliations),
        });
    }

    /*
     * Find a Consultant
     */
    searchConsultantsByZip(zip, radius, page, size) {
        const uri = `/search/shop/zip/${zip}/${radius}/${page}/${size}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    searchConsultantsByName(name, state, page, size) {
        const uri = `/search/shop/name/${name}/${state}/${page}/${size}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    getConsultant(id) {
        const uri = `/search/shop/cid/${id}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }


    /*
     * Consultant Detail Page
     */

    getConsultantInfo(cid) {
        const uri = `/consultant/info?cid=${cid}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl(uri),
        });
    }

    getConsultantStory(cid) {
        const uri = `/consultant/mystory?cid=${cid}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl(uri),
        });
    }

    getConsultantParties(cid) {
        const uri = `/consultant/parties?cid=${cid}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl(uri),
        });
    }

    // Get Consultant by username
    getConsultantByUsername(username) {
        const uri = `/sb/web/${username}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    /*
     * Account Profile Page
     */

    // Communication Preferences
    getCommunicationPreferences(email, cid) {
        const uri = `/users/preferencecenter?email=${email}&customerId=${cid}`;

        return fetch(this.fullUrl(uri))
            .then(response => response.json());
    }

    /*
     * Join Process
     */

    checkJoinSignup(cartId, email) {
        const uri = `/join/check/?cartid=${cartId}&email=${email}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    joinLogin(payload) {
        return $.ajax({
            type: 'POST',
            accepts: 'json',
            url: this.fullUrl('/join/login'),
            data: payload,
        });
    }

    createJoinSession(payload) {
        return $.ajax({
            type: 'POST',
            accepts: 'json',
            url: this.fullUrl('/join/join-session'),
            data: payload,
        });
    }

    updateJoinSession(payload, email) {
        const uri = `/join/join-session?email=${email}`;

        return $.ajax({
            type: 'PATCH',
            accepts: 'json',
            url: this.fullUrl(uri),
            data: payload,
        });
    }

    // Get Sponsor
    getSponsor(params) {
        const uri = `/search/join/${params}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl(uri),
        });
    }

    // Get TS Join Terms and Conditions
    getJoinTermsAndConditions() {
        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl('/join/tc'),
        });
    }


}
