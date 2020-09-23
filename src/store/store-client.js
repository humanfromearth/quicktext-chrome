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

    'getTemplate',
    'clearLocalTemplates',
    'updateTemplateStats',

    'signin',
    'logout',

    'getSession',
    'createSession'
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

// extension pages (popup)
if (backgroundPage) {
    window.IMPERSONATE = (params) => {
        backgroundPage.IMPERSONATE.call(backgroundPage, params);
    };
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
