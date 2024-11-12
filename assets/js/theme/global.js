import 'focus-within-polyfill';

import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from './page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import quickView from './global/quick-view';
import cartPreview from './global/cart-preview';
import privacyCookieNotification from './global/cookieNotification';
import adminBar from './global/adminBar';
import carousel from './common/carousel';
import loadingProgressBar from './global/loading-progress-bar';
import svgInjector from './global/svg-injector';
import shippingModalInteraction from './global/shippingModalInteraction';
import accordian from './global/accordian';
import newsletterAlert from './global/newsletter-alert';
import stickyHeader from './global/sticky-header';
import tooltip from './global/tooltip';
import tsCheckUserLogin from './global/ts-check-user-login';
import tsAddToCart from './global/ts-add-to-cart';
import tsJoinProcess from './global/ts-join-process';
import tsCookieConfig from './global/ts-cookie-config';
import tsSeoProcess from './global/ts-seo-process';


export default class Global extends PageManager {
    onReady() {
        const {
            channelId, cartId, productId, categoryId, secureBaseUrl, maintenanceModeSettings, adminBarLanguage, showAdminBar, themeSettings,
        } = this.context;
        cartPreview(secureBaseUrl, cartId);
        quickSearch();
        currencySelector(cartId);
        foundation($(document));
        quickView(this.context);
        carousel(this.context);
        menu();
        mobileMenuToggle();
        privacyCookieNotification();
        if (showAdminBar) {
            adminBar(secureBaseUrl, channelId, maintenanceModeSettings, JSON.parse(adminBarLanguage), productId, categoryId);
        }
        loadingProgressBar();
        svgInjector();
        shippingModalInteraction(themeSettings);
        accordian();
        newsletterAlert();
        stickyHeader();
        tsCookieConfig(themeSettings);
        //findConsultant(themeSettings);
        tooltip();
        tsCheckUserLogin();
        tsAddToCart();
        tsJoinProcess(themeSettings);
        //tsConsultant();
        tsSeoProcess();

        // Open mobile account menu by default
        const accountMenu = document.getElementById('navPages-account-main');
        if (accountMenu) {
            accountMenu.classList.add('is-open');
        }

    }
}
