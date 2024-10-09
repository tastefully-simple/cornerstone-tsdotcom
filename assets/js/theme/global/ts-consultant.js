import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
// For await
import 'core-js/stable';
import 'regenerator-runtime/runtime';

class Consultant {
    constructor() {
        // Modes to what data from API to render
        this.basicInfoData = 0;
        this.storyData = 1;
        this.partiesData = 2;

        // Modes to what data from API to render
        this.attendTab = 0;
        this.pastTab = 1;

        // ConnectTypes for social media urls
        this.facebook = 1;
        this.twitter = 2;
        this.pinterest = 3;
        this.youtube = 4;

        // Length of story text limit
        this.storyLimit = 50;

        this.api = new TSApi();
        this.cid = TSCookie.getConsultantId();
        this.consultantInfo = {
            AfId: null, ConsultantId: '', EmailAddress: '', HasOpenParty: false, Headline: '', Image: '', Location: '', Name: '', OnlineShopEnabled: false, PhoneNumber: '', SocialMediaURLs: [], Title: '', WebUrl: '',
        };
        this.consultantStory = { Story: '' };
        this.consultantParties = { Attend: [], Past: [] };
        this.init();
    }

    async init() {
        try {
            await this.fetchConsultantInfo();
        } catch (xhr) {
            const readableError = $(xhr.responseText).filter('p').html();
            console.warn('getConsultantInfo:', readableError);
        }

        try {
            await this.fetchConsultantStory();
        } catch (xhr) {
            const readableError = $(xhr.responseText).filter('p').html();
            console.warn('getConsultantStory:', readableError);
        }

        try {
            await this.fetchConsultantParties();
        } catch (xhr) {
            const readableError = $(xhr.responseText).filter('p').html();
            console.warn('getConsultantParties:', readableError);
        }
    }

    removeSpaceInHeader() {
        const $bodyContainer = document.querySelector('.body');
        $bodyContainer.classList.add('consultant-page');
    }

    fetchConsultantInfo() {
        if (typeof this.cid !== 'undefined') {
            return this.api.getConsultantInfo(this.cid)
                .done((data) => {
                    const urlSlug = data.WebUrl.match(/\/web\/[a-z0-9\W]+/ig)[0];
                    this.consultantInfo = data;
                    window.history.pushState(null, null, urlSlug);
                    this.renderResults(this.basicInfoData);
                });
        }
    }

    fetchConsultantStory() {
        if (typeof this.cid !== 'undefined') {
            return this.api.getConsultantStory(this.cid)
                .done((data) => {
                    this.consultantStory = data;
                    this.renderResults(this.storyData);
                });
        }
    }

    fetchConsultantParties() {
        if (typeof this.cid !== 'undefined') {
            return this.api.getConsultantParties(this.cid)
                .done((data) => {
                    this.consultantParties = data;
                    this.renderResults(this.partiesData);
                });
        }
    }

    renderResults(mode) {
        switch (mode) {
            case this.basicInfoData:
                this.renderConsultantInfo();
                break;
            case this.storyData:
                this.renderConsultantStory();
                break;
            case this.partiesData:
                this.renderConsultantParties();
                break;
            default:
                console.error('Fetch Data Mode:', mode);
                break;
        }
    }

    renderConsultantInfo() {
        this.getInfoHtmlBlock();
        this.getMoreInfoHtmlBlock();
    }

    renderConsultantStory() {
        this.getStoryHtmlBlock();
    }

    renderConsultantParties() {
        this.getPartiesHtmlBlock();
    }

    /* Basic Info - Column 1
     * - Image
     * - Name
     * - Title
     * - Location
     */
    getInfoHtmlBlock() {
        const $img = document.querySelector('.cdetails-img');
        const $name = document.querySelector('.cdetails-name');
        const $title = document.querySelector('.cdetails-title');
        const $location = document.querySelector('.cdetails-location');
        const $url = document.querySelector('.cdetails-url');

        if (this.consultantInfo.Image) {
            $img.setAttribute('src', this.consultantInfo.Image);
            TSCookie.setConsultantImage(this.consultantInfo.Image);
        } else {
            TSCookie.setConsultantImage($img.src);
        }
        $name.innerHTML = this.consultantInfo.Name || 'Tastefully Simple';
        $title.innerHTML = this.consultantInfo.Title || 'Consultant';
        $location.innerHTML = this.consultantInfo.Location || 'Alexandria, MN';
        $url.innerHTML = `<a class="global-link" href="${this.consultantInfo.WebUrl}">${this.consultantInfo.WebUrl}</a>`;
    }

    /* Basic Info - Column 2
     * - Greetings
     * - Headline
     * - Phone Number
     * - Email
     */
    getMoreInfoHtmlBlock() {
        const consultantFName = this.consultantInfo.Name.split(' ')[0];

        const $greetings = document.querySelector('.cdetails-greetings');
        const $headline = document.querySelector('.cdetails-headline');
        const $phoneNumber = document.querySelector('.cdetails-phone-number');
        const $email = document.querySelector('.cdetails-email');

        $greetings.innerHTML = `hello, I'm ${consultantFName}!`;
        $headline.innerHTML = this.consultantInfo.Headline;
        $phoneNumber.innerHTML = this.formatPhoneNumber(this.consultantInfo.PhoneNumber);
        $email.innerHTML = this.consultantInfo.EmailAddress;

        // Social Media Links
        this.getSocialMedias(this.consultantInfo.SocialMediaURLs);
    }

    getSocialMedias(socialMedias) {
        const $socialLinksContainer = document.querySelector('.cdetails-more-info .socialLinks');

        if (socialMedias === null) {
            return;
        }

        socialMedias.forEach((socialMedia) => {
            const $link = this.getSocialMedia(socialMedia);
            $socialLinksContainer.appendChild($link);
        });
    }

    getSocialMedia(social) {
        switch (social.ConnectType) {
            case this.facebook:
                return this.createSocialMedia(social.URL, 'facebook');
            case this.twitter:
                return this.createSocialMedia(social.URL, 'twitter');
            case this.pinterest:
                return this.createSocialMedia(social.URL, 'pinterest');
            case this.youtube:
                return this.createSocialMedia(social.URL, 'youtube');
            default:
                console.error('ConnectType', social.ConnectType);
        }
    }

    getStoryHtmlBlock() {
        if (!this.consultantStory.Story) {
            const $storyTitle = document.querySelector('.consultant-story h2');
            $storyTitle.innerHTML = '';

            return;
        }

        // Returns an object
        // => { short, readMore }
        const storyText = this.splitStoryText(this.consultantStory.Story);

        const $storyContainer = document.querySelector('.consultant-story');
        const $story = document.createElement('p');
        $story.classList.add('consultant-story-text');

        const $dots = document.createElement('span');
        $dots.classList.add('consultant-story-dots');
        $dots.innerHTML = '...';

        const $readMoreText = document.createElement('span');
        $readMoreText.classList.add('read-more-text');
        $readMoreText.style.display = 'none';
        $readMoreText.innerHTML = storyText.readMore;

        const $readMoreBtn = document.createElement('button');
        $readMoreBtn.classList.add('read-more-story', 'framelink-lg', 'teal-text');
        $readMoreBtn.innerHTML = 'read more';

        if (storyText.readMore.length !== 0) {
            $story.innerHTML = storyText.short;
            $story.appendChild($dots);
            $story.appendChild($readMoreText);

            $readMoreBtn.addEventListener('click', () => {
                this.readMoreStory($dots, $readMoreText, $readMoreBtn);
            });

            $storyContainer.appendChild($story);
            $storyContainer.appendChild($readMoreBtn);
        } else {
            $story.innerHTML = this.consultantStory.Story;
            $storyContainer.appendChild($story);
        }
    }


    getTabContentHtmlBlock(parties, tab) {
        let $content;
        switch (tab) {
            case this.attendTab:
                $content = document.querySelector('.cparties-attend');
                break;
            case this.pastTab:
                $content = document.querySelector('.cparties-past');
                break;
            default:
                console.error('Party Tab Mode:', tab);
                break;
        }

        if (parties.length === 0) {
            $content.innerHTML = 'No parties found.';
            return;
        }

    }

    formatPhoneNumber(number) {
        return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }

    createSocialMedia(url, social) {
        const $item = document.createElement('li');
        $item.classList.add('socialLinks-item');

        const $socialLink = document.createElement('a');
        $socialLink.setAttribute('class', `icon-social-${social}`);
        $socialLink.setAttribute('href', url);
        $socialLink.setAttribute('target', '_blank');

        $item.appendChild($socialLink);

        return $item;
    }

    splitStoryText() {
        let shortText = '';
        let readMoreText = '';
        let counter = 0;

        this.consultantStory.Story.split(' ').forEach((word) => {
            let wordFormat = word;

            if (word.includes('\r\n\r\n')) {
                wordFormat = word.replace('\r\n\r\n', '<br><br>');
            }

            if (counter <= this.storyLimit) {
                shortText += `${wordFormat} `;
            } else {
                readMoreText += `${wordFormat} `;
            }

            counter += 1;
        });

        return { short: shortText, readMore: readMoreText };
    }

    readMoreStory($dotsObject, $textObject, $btnObject) {
        const $dots = $dotsObject;
        const $text = $textObject;
        const $btn = $btnObject;
        if ($dots.style.display === 'none') {
            $dots.style.display = 'inline';
            $text.style.display = 'none';
            $btn.innerHTML = 'read more';
        } else {
            $dots.style.display = 'none';
            $text.style.display = 'inline';
            $btn.innerHTML = 'read less';
        }
    }

}

export default function () {
    if (window.location.href.indexOf('web') > -1) {
        return new Consultant();
    }
}
