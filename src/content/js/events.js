/*
 PubSub events
 */

PubSub.subscribe('focus', function (action, element) {
    if ($(element).hasClass('qt-dropdown-search')) {
        return; // ignore search input
    }

    if (action === 'on') {
        App.data.inCompose = true;

        // check if element is contenteditable
        if(element && element.getAttribute('contenteditable')) {
            App.data.contentEditable = true;
        } else {
            App.data.contentEditable = false;
        }

    } else if (action === 'off') {
        App.data.inCompose = false;
    }

});

/*
 Events handling
 */

App.onFocus = function (e) {
    var target = e.target;

    // Disable any focus as there may be only one focus on a page
    // PubSub.publish('focus', 'off', target);

    PubSub.publish('focus', 'on', target);
};

App.onBlur = function (e) {
    PubSub.publish('focus', 'off', e.relatedTarget);
};

App.onScroll = function (e) {
    var target = e.target;

    // if scrolling the autocomplet list, don't close it
    if(target !== App.autocomplete.dialog.$content.get(0)) {
        App.autocomplete.dialog.close();
    }
};
