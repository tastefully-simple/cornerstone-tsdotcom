import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import StatesSelect from '../common/directory/states';
import pagination from '../common/pagination';
import ConsultantCard from '../common/consultant-card';
import ConsultantParties from '../common/consultant-parties';
import TSRemoveAffiliation from '../common/ts-remove-affiliation';
import $ from 'jquery';
import swal from './sweet-alert';

// Search mode
const NO_SEARCH = 0;
const SEARCH_BY_ZIP = 1;
const SEARCH_BY_NAME = 2;
const SEARCH_BY_ID = 3;

// Pagination
const DISPLAY_NUM_PAGES = 6;

// Redirect
const CONSULTANT_PAGE = '/web';
const PARTY_DETAILS_PAGE = '/party-details';
const CART_PAGE = '/cart.php';

// API error message
const API_ERROR_MESSAGE = {
    errorMessage: 'An error has occurred.',
};

window.isAutoshipModal = false;

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
            console.log(error);
            swal.fire({
                text: 'An error has happened. Please, try again later. (002)',
                icon: 'error',
            });
            return -1;
        });
}

/**
 * Find a Consultant Autoship Modal — Confirm Button Action
 * Send API request to save the consultant and close the modal
 */
async function autoshipConfirmConsultant(obj) {
    await renewToken();
    // Disable "Confirm" button
    $('#autoship-consultant-confirm').attr('disabled', true);
    const consultantId = `${obj.selectedId}`;

    // window.subscriptionManager is set on subscription-manager.js
    const setAffiliationUrl = `${window.subscriptionManager.apiUrl}/Customers/${window.subscriptionManager.customerId}/affiliation/`;

    $.ajax({
        url: setAffiliationUrl,
        type: 'POST',
        dataType: 'JSON',
        headers: {
            'Content-Type': 'application/json',
            'jwt-token': window.currentCustomer.token,
        },
        data: JSON.stringify({
            consultantId,
            overridePending: 1,
        }),
    }).always((response) => {
        if (response.responseText === 'Success') {
            $('#current-consultant-name').html($('.selected .consultant-name').text());
            obj.closeModal();
        } else {
            swal.fire({
                text: 'An error has happened. Please, try again later.',
                icon: 'error',
            });
        }
    });
}

/**
 * Creates a Cornerstone popup modal for Find A Consultant.
 * A second view is available once the user hits search. The modal is then
 * populated with data from the user's search parameters
 */
/*
export default function (themeSettings) {
    const tsConsultantId = themeSettings.ts_consultant_id;

    $(document).ready(() => {
        const consultant = new FindAConsultant(
            document.querySelector('.headertoplinks-consult'),
            'common/find-consultant',
            tsConsultantId,
        );

        if (window.location.pathname === '/manage-subscriptions/') {
            new FindAConsultant(
                document.querySelector('.consultant-finder'),
                'common/find-consultant',
                tsConsultantId,
            );
        }

        return consultant;
    });
}
*/
