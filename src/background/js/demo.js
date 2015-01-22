/* Gorgias
 * demo
 */

var gorgiasDemo = (function() {

    var KEY_TAB = 9;
    var KEY_UP = 38;
    var KEY_DOWN = 40;
    var KEY_ENTER = 13;
    var KEY_SPACE = 32;
    var KEY_ESC = 27;

    var $editor;
    var $container;
    var $focusNode;

    var quicktexts = [
        {
            shortcut: 'h',
            title: 'hello',
            body: 'Hello Malala,'
        },
        {
            shortcut: 'kr',
            title: 'kindregards',
            body: 'Kind Regards, \nGorgias'
        }
    ];

    var getQuicktext = function(shortcut) {

        var q;

        shortcut = shortcut.toLowerCase();

        // find quicktext by shortcut
        quicktexts.some(function(quicktext) {

        if(quicktext.shortcut === shortcut) {
            q = quicktext;
            return true;
        }

        return false;

        });

        return q;

    };

    var filterQuicktexts = function(word) {

        var add;
        var filtered = [];

        quicktexts.forEach(function(qt) {

        add = false;

        if(qt.shortcut.indexOf(word) !== -1) {
            add = true;
        }

        if(!add && qt.title.indexOf(word) !== -1) {
            add = true;
        }

        if(!add && qt.body.indexOf(word) !== -1) {
            add = true;
        }

        if(add === true) {
            filtered.push(qt);
        }

        });

        return filtered;

    };


    var dialogTemplate = '' +
        '<div class="gdemo-dropdown">' +
        '<input type="search" class="gdemo-dropdown-search" value="" placeholder="Search templates...">' +
        '<ul class="gdemo-dropdown-content"></ul>' +
        '</div>' +
        '';

    var dialogLiTemplate = '' +
        '{{#if elements.length}}' +
        '{{#each elements}}' +
        '<li class="gdemo-item" title="{{{originalBody}}}">' +
        '<span class="gdemo-title">{{{title}}}</span>' +
        '<span class="gdemo-shortcut">{{{shortcut}}}</span>' +
        '<span class="gdemo-body">{{{body}}}</span>' +
        '</li>' +
        '{{/each}}' +
        '{{else}}' +
        '<li class="gdemo-blank-state">' +
        'No templates found.' +
        '</li>' +
        '{{/if}}' +
        '';

    var getCursorPosition = function(e, params) {

        params = params || {};

        var position = {
                element: e && e.target ? e.target : null,
                offset: 0,
                absolute: {
                    left: 0,
                    top: 0
                },
                word: null
            };

        var getRanges = function(sel){
            if (sel.rangeCount){
                var ranges = [];
                for (var i= 0; i < sel.rangeCount; i++){
                    ranges.push(sel.getRangeAt(i));
                }
                return ranges;
            }
            return [];
        };

        var restoreRanges = function(sel, ranges){
            for (var i in ranges) {
                sel.addRange(ranges[i]);
            }
        };

        // Working with editable div
        // Insert a virtual cursor, find its position
        // http://stackoverflow.com/questions/16580841/insert-text-at-caret-in-contenteditable-div

        var selection = window.getSelection();
        // get the element that we are focused + plus the offset
        // Read more about this here: https://developer.mozilla.org/en-US/docs/Web/API/Selection.focusNode
        position.element = params.focusNode || selection.focusNode;
        position.offset = selection.focusOffset;

        if(typeof params.focusOffset !== 'undefined') {
            position.offset = params.focusOffset;
        }

        // First we get all ranges (most likely just 1 range)
        var ranges = getRanges(selection);

        if (!ranges.length) {
            Raven.captureMessage('A selection without any ranges!');
            return;
        }
        // remove any previous ranges
        selection.removeAllRanges();

        // Added a new range to place the caret at the focus point of the cursor
        var range = new Range();
        var caretText = '<span id="gdemo-caret"></span>';
        range.setStart(position.element, position.offset);
        range.setEnd(position.element, position.offset);
        range.insertNode(range.createContextualFragment(caretText));
        selection.addRange(range);
        selection.removeAllRanges();

        // finally we restore all the ranges that we had before
        restoreRanges(selection, ranges);

        // Virtual caret
        var $caret = $('#gdemo-caret');

        if ($caret.length) {
            position.absolute = $caret.offset();
            position.absolute.width = $caret.width();
            position.absolute.height = $caret.height();

            // Remove virtual caret
            $caret.remove();
        }

        return position;
    };

    var getSelectedWord = function (params) {
        var word = {
            start: 0,
            end: 0,
            text: ''
        };

        var beforeSelection = "";
        var selection = window.getSelection();

        var focusNode = params.focusNode || selection.focusNode;

        switch (focusNode.nodeType) {
            // In most cases, the focusNode property refers to a Text Node.
            case (document.TEXT_NODE): // for text nodes it's easy. Just take the text and find the closest word
                beforeSelection = focusNode.textContent;
                break;
            // However, in some cases it may refer to an Element Node
            case (document.ELEMENT_NODE):
                // In that case, the focusOffset property returns the index in the childNodes collection of the focus node where the selection ends.
                beforeSelection = focusNode.childNodes[selection.focusOffset].textContent;

                break;
        }

        // Replace all &nbsp; with normal spaces
        beforeSelection = beforeSelection.replace('\xa0', ' ').trim();

        word.start = Math.max(beforeSelection.lastIndexOf(" "), beforeSelection.lastIndexOf("\n"), beforeSelection.lastIndexOf("<br>")) + 1;
        word.text = beforeSelection.substr(word.start);
        word.end = word.start + word.text.length;
        return word;

    };

    var getData = function(params, callback) {

        var data = {
        from: [{
            name: '',
            first_name: '',
            last_name: '',
            email: ''
        }],
        to: [{
            name: '',
            first_name: '',
            last_name: '',
            email: ''
        }],
        cc: [{
            name: '',
            first_name: '',
            last_name: '',
            email: ''
        }],
        bcc: [{
            name: '',
            first_name: '',
            last_name: '',
            email: ''
        }],
        subject: ''
        };

        return callback(null, data);

    };

    var replaceWith = function (params) {

        var replacement = '';

        var word = params.word;

        getData({
            element: params.element
        }, function(err, response) {

            var parsedTemplate = Handlebars.compile(params.quicktext.body)(response);

            var selection = window.getSelection();
            var range = document.createRange();

            replacement = parsedTemplate.replace(/\n/g, '<br>');

            // setStart/setEnd work differently based on
            // the type of node
            // https://developer.mozilla.org/en-US/docs/Web/API/range.setStart
            var focusNode = params.focusNode;

            // we need to have a text node in the end
            while (focusNode.nodeType === document.ELEMENT_NODE) {
                if (focusNode.childNodes.length > 0) {
                    focusNode = focusNode.childNodes[selection.focusOffset]; // select a text node
                } else {
                    // create an empty text node and attach it before the node
                    var tnode = document.createTextNode('');
                    focusNode.parentNode.insertBefore(tnode, focusNode);
                    focusNode = tnode;
                }
            }

            // clear whitespace in the focused textnode
            if(focusNode.nodeValue) {
                focusNode.nodeValue = focusNode.nodeValue.trim();
            }

            // remove the shorcut text
            range.setStart(focusNode, word.start);
            range.setEnd(focusNode, word.end);
            range.deleteContents();

            var qtNode = range.createContextualFragment(replacement);
            var lastQtChild = qtNode.lastChild;

            // TODO this throws error when tab is not focused
            range.insertNode(qtNode);

            var caretRange = document.createRange();
            caretRange.setStartAfter(lastQtChild);
            caretRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(caretRange);

        });

        //App.autocomplete.dialog.close();

    };


    var triggerKey = function(e) {

        if(e.keyCode === KEY_TAB) {

            var element = e.target;

            // prevent errors
            if(!element.innerHTML) {
                return;
            }

            var focusNode = window.getSelection().focusNode;

            var word = getSelectedWord({
                focusNode: focusNode
            });

            var quicktext = getQuicktext(word.text);

            if(quicktext) {
                replaceWith({
                    element: element,
                    quicktext: quicktext,
                    focusNode: focusNode,
                    word: word
                });
            }
        }

        if(e.keyCode === KEY_SPACE && e.ctrlKey) {

            dialogShow(e);

        }

    };

    var dialogSelectItem = function (index) {
        var content = $(contentSelector);
        var $element = content.children().eq(index);

        content.children()
            .removeClass('active')
            .eq(index);

        $element.addClass('active');
    };

    var dialogPopulate = function(params) {

        var quicktexts = filterQuicktexts(params.word.text);

        // clone the elements
        // so we can safely highlight the matched text
        // without breaking the generated handlebars markup
        var clonedElements = jQuery.extend(true, [], quicktexts);

        // highlight found string in element title, body and shortcut
        var searchRe = new RegExp(params.word.text, 'gi');

        var highlightMatch = function (match) {
            return '<span class="gdemo-search-highlight">' + match + '</span>';
        };

        clonedElements.forEach(function (elem) {
            elem.title = elem.title.replace(searchRe, highlightMatch);
            elem.originalBody = elem.body;
            elem.body = elem.body.replace(searchRe, highlightMatch);
            elem.shortcut = elem.shortcut.replace(searchRe, highlightMatch);
        });

        var content = Handlebars.compile(dialogLiTemplate)({
            elements: clonedElements
        });

        $(contentSelector).html(content);

        // Set first element active
        dialogSelectItem(0);

    };

    var dialogSelector = '.gdemo-dropdown';
    var contentSelector = '.gdemo-dropdown-content';
    var searchSelector = '.gdemo-dropdown-search';

    var dialogChangeSelection = function (direction) {
        var index_diff = direction === 'prev' ? -1 : 1,
            content = $(contentSelector),
            elements_count = content.children().length,
            index_active = content.find('.active').index(),
            index_new = Math.max(0, Math.min(elements_count - 1, index_active + index_diff));

        dialogSelectItem(index_new);

        // scroll the active element into view
        var $element = content.children().eq(index_new);
        $element.get(0).scrollIntoView();
    };

    var dialogCreate = function () {

        // Create only once in the root of the document
        var container = $('body');

        // Add loading dropdown
        var dialog = $(dialogTemplate);
        container.append(dialog);

        //HACK: set z-index to auto to a parent, otherwise the autocomplete
        //      dropdown will not be displayed with the correct stacking
        dialog.parents('.qz').css('z-index', 'auto');

        // Handle mouse hover and click
        dialog.on('mouseover mousedown', 'li.gdemo-item', function (e) {
            e.preventDefault();
            e.stopPropagation();

            dialogSelectItem($(this).index());
            if (e.type === 'mousedown') {
                dialogSelectActive();
                dialogHide();
            }
        });

        dialog.on('keyup', searchSelector, function (e) {

            if(e.keyCode === KEY_UP) {
                dialogChangeSelection('prev');
                return;
            }

            if(e.keyCode === KEY_DOWN) {
                dialogChangeSelection('next');
                return;
            }

            if(e.keyCode === KEY_ENTER) {

                dialogSelectActive();
                dialogHide();

                return;
            }

            if(e.keyCode === KEY_ESC) {

                dialogHide();

                return;
            }

            var text = $(this).val();

            dialogPopulate({
                word: {
                    text: text
                }
            });


            // TODO see why page is still scrolling on key-up/down
            e.preventDefault();

        });
    };

    var dialogSelectActive = function () {
        var activeShortcut = $(contentSelector).find('.active .gdemo-shortcut').text();

        var quicktext = getQuicktext(activeShortcut);

        var word = getSelectedWord({
            focusNode: $focusNode
        });

        replaceWith({
            element: $editor,
            quicktext: quicktext,
            focusNode: $focusNode,
            word: word
        });
    };

    var dialogShow = function(e, params) {

        params = params || {};

        e.preventDefault();
        e.stopPropagation();

        // make sure we have at least one space in the editor
        // so we can use it as a textnode.
        // otherwise, if the focusNode is the $editor
        // the quicktext is appended before it in the dom, not in it.
        if(!$editor.innerHTML) {
            $editor.innerHTML = ' ';
        }

        var element = e.target;

        var cursorPosition = getCursorPosition(e, params);

        dialogPopulate({
            word: { text: '' }
        });

        $(dialogSelector).css({
            top: (cursorPosition.absolute.top + 20 + cursorPosition.absolute.height - $(window).scrollTop()) + 'px',
            left: (cursorPosition.absolute.left + 15 + cursorPosition.absolute.width - $(window).scrollLeft()) + 'px'
        });

        $(dialogSelector).addClass('gdemo-dropdown-show');

        $(contentSelector).scrollTop();

        // when manually triggering the dialog shortcut
        // (not in animation frame)
        if(!params.focusNode) {
            $focusNode = window.getSelection().focusNode;

            $(searchSelector).focus();
        }

    };

    var dialogHide = function(e) {

        $(dialogSelector).removeClass('gdemo-dropdown-show');
        $(searchSelector).val('');

    };

    var lastFrameName = '';
    var globalTimer = 0;

    var animationFrame = function(name, time, callback) {

        globalTimer += time;

        setTimeout(function() {

            $($container).removeClass('gorgias-demo-frame--' + lastFrameName);

            $($container).addClass('gorgias-demo-frame--' + name);

            lastFrameName = name;

            callback();

        }, globalTimer * 1000);

    };

    var rmCharByChar = function(callback) {

        var editorText = $editor.innerText;
        editorText = editorText.substr(0, editorText.length - 1);

        $editor.innerHTML = editorText;

        if($editor.innerHTML) {

            $editor.innerHTML = editorText;

            setTimeout(function() {
                rmCharByChar(callback);
            }, 100);

        } else {

            if(callback) {
                callback();
            }

        }

    };

    var startAnimation = function() {

        animationStarted = true;

        animationFrame('empty-state', 1, function() {

            // empty first frame

        });

        // add quicktext shortcut
        animationFrame('type-first-shortcut', 1.1, function() {

            $editor.innerHTML = 'h';

            var shortcutNode = $editor.childNodes[0];

            // focus last char
            var selection = window.getSelection();
            var caretRange = document.createRange();
            caretRange.setStartAfter(shortcutNode);
            caretRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(caretRange);

        });

        // trigger the quicktext
        animationFrame('activate-first-shortcut', 1.1, function() {

            var shortcutNode = $editor.childNodes[0];

            var word = getSelectedWord({
                focusNode: shortcutNode
            });

            replaceWith({
                element: $editor,
                quicktext: getQuicktext('h'),
                focusNode: shortcutNode,
                word: word
            });

        });

        // delete everything in the editor
        animationFrame('rm-qt', 2, function() {

            rmCharByChar();

        });

        // activate the dialog
        animationFrame('dialog-show', 2, function() {

            var e = jQuery.Event('keydown', {
                ctrlKey: true,
                keyCode: KEY_SPACE
            });

            //jQuery($editor).trigger(e);

            $editor.innerHTML = ' ';
            $focusNode = $editor.firstChild;

            dialogShow(e, {
                focusNode: $focusNode,
                focusOffset: 0
            });

        });

        // activate the first quicktext
        animationFrame('dialog-activate', 2, function() {

            var e = jQuery.Event('keyup', {
                keyCode: KEY_ENTER
            });

            $editor.innerHTML = ' ';
            $focusNode = $editor.firstChild;

            jQuery(searchSelector).trigger(e);

        });

        // try it
        animationFrame('try-it', 2, function() {

            // clear out the editor
            rmCharByChar(function() {

                // make the editor really editable
                $editor.setAttribute('contentEditable', true);

                var wasFocused = false;
                $container.addEventListener('click', function() {
                    if(!wasFocused) {
                        $($container).addClass('gdemo-editor-was-focused');
                        $editor.focus();
                        wasFocused = true;
                    }
                });

            });

        });

    };

    var isElementInViewport = function(el) {

        //special bonus for those using jQuery
        if (typeof jQuery === "function" && el instanceof jQuery) {
            el = el[0];
        }

        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
        );
    };

    var animationStarted = false;

    var visibilityChange = function() {
        if(isElementInViewport($container) && !animationStarted) {
            startAnimation();

            $(window).off('DOMContentLoaded load resize scroll', visibilityChange);
        }
    };

    var preventShortcuts = function(e) {

        // always prevent the default key action
        // for a better experience.
        // used just in the homepage demo, not in the extension.
        if(e.keyCode === KEY_SPACE || e.keyCode === KEY_TAB) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

    };

    var init = function() {

        dialogCreate();

        $editor = document.querySelector('.gorgias-demo-editor');
        $container = document.querySelector('.gorgias-demo');

        // only start the demo if we have the editor
        if($editor) {

            $($editor).on('keydown', triggerKey);

            $editor.addEventListener('keyup', preventShortcuts, false);
            $editor.addEventListener('keydown', preventShortcuts, false);
            $editor.addEventListener('keypress', preventShortcuts, false);

            // start the animation only when the container is in viewport
            // so we don't miss it if we're scrolled,
            // or get pushed back to top on focus().
            $(window).on('DOMContentLoaded load resize scroll', visibilityChange);

        }

    };

    return {
        init: init
    };

}());

