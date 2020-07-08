var backgroundPage = null;
try {
    // getBackgroundPage() throws error in content script
    backgroundPage = chrome.extension.getBackgroundPage();
} catch (err) {}

function createRequest (type) {
    return (params) => {
        return new Promise((resolve, reject) => {
            // get from background
            chrome.runtime.sendMessage({
                type: type,
                data: params
            }, (data) => {
                // handle errors
                if (data && data.storeError) {
                    return reject(data.storeError);
                }

                return resolve(data);
            });
        });
    };
}

var methods = [
    'getSettings',
    'setSettings',

    'getLoginInfo',
    'getAccount',
    'setAccount',

    'getMembers',
    'setMember',

    'getTemplate',
    'updateTemplate',
    'createTemplate',
    'deleteTemplate',
    'clearLocalTemplates',

    'getSharing',
    'updateSharing',

    'getStats',
    'updateTemplateStats',

    'getSubscription',
    'updateSubscription',
    'cancelSubscription',
    'updateCreditCard',
    'createSubscription',

    'addAttachments',
    'removeAttachments',

    'syncNow',

    'signin',
    'logout',
    'forgot',
    'importTemplates',
    'session'
];

var events = [];
var on = function (name, callback) {
    events.push({
        name: name,
        callback: callback
    });
};

var trigger = function (name) {
    events.filter((event) => event.name === name).forEach((event) => {
        if (typeof event.callback === 'function') {
            event.callback();
        }
    });
};

// options page
if (backgroundPage) {
    window.FIRESTORE_ENABLED = backgroundPage.FIRESTORE_ENABLED.bind(backgroundPage);
    window.TOGGLE_FIRESTORE = (enabled) => {
        backgroundPage.TOGGLE_FIRESTORE.call(backgroundPage, enabled);
    };
    window.IMPERSONATE = (params) => {
        backgroundPage.IMPERSONATE.call(backgroundPage, params).then(() => {
            // reload options
            window.location.reload();
        });
    };
    window.SIGNIN_WITH_TOKEN = (token) => {
        backgroundPage.SIGNIN_WITH_TOKEN.call(backgroundPage, token).then(() => {
            // reload options
            window.location.reload();
        });
    };

    // subscribe automatic sign-in
    window.addEventListener('message', function (e) {
        var data = {};
        try {
            data = JSON.parse(e.data);
        } catch (err) {}

        if (data.type === 'templates-subscribe-success') {
            window.TOGGLE_FIRESTORE(true);
            window.SIGNIN_WITH_TOKEN(data.token);
        }
    });
}

// handle trigger from background
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (
        req.type &&
        req.type === 'trigger'
    ) {
        trigger(req.data.name);
        sendResponse();
    }

    return false;
});

var optionsStore = {};
methods.forEach((method) => {
    optionsStore[method] = createRequest(method);
});

optionsStore.on = on;
optionsStore.trigger = trigger;

export default optionsStore;
