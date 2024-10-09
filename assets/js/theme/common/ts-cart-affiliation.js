import utils from '@bigcommerce/stencil-utils';
import TSCookie from './ts-cookie';

export default class TSCartAffiliation {
    constructor(tsConsultantId) {
        this.TS_CONSULTANT_ID = tsConsultantId;
        this.checkoutButton = '.cart-actions .button--primary';
        this.formWrapper = '#ts-affiliate-cart-form-wrapper';
        this.formTitle = '.ts-cart-affiliation-wrapper > h2';
        this.noSelectionError = '.ts-cart-affiliation-wrapper .alertbox-error';

        this.renderTemplate();
    }

    renderTemplate() {
        
        //const $wrapper = $('#ts-cart-affiliation .ts-cart-affiliation-wrapper');
        //$wrapper.attr('tabindex', '0');

        //if (TSCookie.getConsultantId()) {
        //    this.template('cart/ts-selected-affiliation')
        //        .then(template => {
        //            $wrapper.append(template);
        //            this.renderSelectedAffiliation();
        //        });
        //} else {
        //    this.applyAffiliationOptionsTemplates($wrapper);
        //}
    }

    template(templatePath) {
        const template = new Promise((resolve, _reject) => {
            utils.api.getPage('/', {
                template: templatePath,
            }, (err, res) => {
                if (err) {
                    console.error(`Error getting ${templatePath} template`);
                    throw new Error(err);
                } else {
                    resolve(res);
                }
            });
        });

        return template;
    }

    /*
     * RADIO BUTTON SECTION
     */

    applyAffiliationOptionsTemplates($wrapper) {
        this.template('cart/ts-affiliation-options').then(
            template => {
                $wrapper.append(template);
            },
            this.template('common/alert-error').then(noSelectionErrorHtml => {
                const errorBoxMessage = '.ts-cart-affiliation-wrapper .alert-message span';
                const errorBoxTitle = '.ts-cart-affiliation-wrapper .alert-title';

                $('.ts-cart-affiliation-wrapper').prepend(noSelectionErrorHtml);
                $(errorBoxTitle).text('Selection Required');
                $(errorBoxMessage).text('A selection is required before you proceed');

                this.selectionLogic();
            }),
        );
    }

    selectionLogic() {
        this.bindTsCartFormSelectionEvent();
        this.bindCheckoutButtonClickEvent();
    }

    bindTsCartFormSelectionEvent() {
        $(this.checkoutButton).data('originalText', $(this.checkoutButton).text());

        $('#page-wrapper').on('change', '#ts-affiliate-cart-form input', (e) => {
            $(this.formWrapper).removeClass('error');
            $(this.formTitle).show();
            $(this.noSelectionError).hide();

            if (e.target === document.getElementById('tsacf-shopdirect')) {
                $(this.checkoutButton).html('checkout');
                $(this.checkoutButton).removeAttr('disabled');
                $(this.checkoutButton).removeAttr('onclick');
            } else {
                $(this.checkoutButton).html($(this.checkoutButton).data('originalText'));
                $(this.checkoutButton).attr('disabled', true);
            }
        });
    }

    bindCheckoutButtonClickEvent() {
        $('#page-wrapper').on('click', '.cart-actions .button--primary', () => {
            const that = this;

            if ($(this.checkoutButton).attr('disabled')) {
                $(that.formWrapper).addClass('error');
                $(that.formTitle).hide();
                $(this.noSelectionError).show();
            }
        });
    }

    /*
     * SELECTED AFFILIATION SECTION
     */

    renderSelectedAffiliation() {
        this.selectedConsultant = {
            id: TSCookie.getConsultantId(),
            name: TSCookie.getConsultantName(),
            image: TSCookie.getConsultantImage(),
        };

        // Update Selected Consultant
        this.updateConsultantSelection();
    }

    updateConsultantSelection() {
        const $parent = $('.cart-affiliate-consultant-selected');

        // Update Selected consultant name
        $parent.find('.cart-affiliate-name').text(this.selectedConsultant.name);

        // Update Selected consultant image
        const $consultantImg = $parent.find('.cart-affiliate-img');

        $consultantImg.css('display', 'initial');
        $consultantImg.attr('alt', `Photograph thumbnail of ${this.selectedConsultant.name}`);

        if (this.selectedConsultant.image) {
            $consultantImg.attr('src', this.selectedConsultant.image);
        }
    }





    enableCheckout() {
        $(this.checkoutButton).html('checkout');
        $(this.checkoutButton).removeAttr('onclick');
        $(this.checkoutButton).removeAttr('disabled');
    }
}
