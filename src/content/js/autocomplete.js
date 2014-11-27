/*
 * Generic methods for autocompletion
 */

var KEY_TAB = 9,
    KEY_UP = 38,
    KEY_DOWN = 40,
    KEY_ENTER = 13;

App.autocomplete.quicktexts = [];
App.autocomplete.cursorPosition = null;

App.autocomplete.getSelectedWord = function (cursorPosition) {
    var word = {
        start: 0,
        end: 0,
        text: ''
    };
    var string;

    if (App.data.contentEditable) {
        var selection = window.getSelection();
        string = selection.focusNode.textContent.substr(0, selection.focusOffset);
    } else {
        string = $(cursorPosition.element).val().substr(0, cursorPosition.end);
    }

    // Replace all nbsp with normal spaces
    string = string.replace('\xa0', ' ').trim();

    word.start = Math.max(string.lastIndexOf(" "), string.lastIndexOf("\n"), string.lastIndexOf("<br>")) + 1;
    word.text = string.substr(word.start);
    word.end = word.start + word.text.length;

    return word;
};

App.autocomplete.getCursorPosition = function (e) {

    var position = {
            element: e && e.target ? e.target : null,
            offset: 0,
            absolute: {
                left: 0,
                top: 0
            },
            word: null
        };

    var $caret;

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

    var contenteditable = false;
    if(position.element.getAttribute('contenteditable') && position.element.getAttribute('contenteditable') === 'true') {
        contenteditable = true;
    }

    if(App.data.contentEditable) {
        // Working with editable div
        // Insert a virtual cursor, find its position
        // http://stackoverflow.com/questions/16580841/insert-text-at-caret-in-contenteditable-div

        var selection = window.getSelection();
        // get the element that we are focused + plus the offset
        // Read more about this here: https://developer.mozilla.org/en-US/docs/Web/API/Selection.focusNode
        position.element = selection.focusNode;
        position.offset = selection.focusOffset;

        // First we get all ranges (most likely just 1 range)
        var ranges = getRanges(selection);
        var focusNode = selection.focusNode;
        var focusOffset = selection.focusOffset;

        if (!ranges.length) {
            Raven.captureMessage("A selection without any ranges!");
            return;
        }
        // remove any previous ranges
        selection.removeAllRanges();

        // Added a new range to place the caret at the focus point of the cursor
        var range = new Range();
        var caretText = '<span id="qt-caret"></span>';
        range.setStart(focusNode, focusOffset);
        range.setEnd(focusNode, focusOffset);
        range.insertNode(range.createContextualFragment(caretText));
        selection.addRange(range);
        selection.removeAllRanges();

        // finally we restore all the ranges that we had before
        restoreRanges(selection, ranges);

        // Virtual caret
        $caret = $('#qt-caret');

        if ($caret.length) {
            position.absolute = $caret.offset();
            position.absolute.width = $caret.width();
            position.absolute.height = $caret.height();

            // Remove virtual caret
            $caret.remove();
        }

    } else {

        // Working with textarea
        // Create a mirror element, copy textarea styles
        // Insert text until selectionEnd
        // Insert a virtual cursor and find its position

        //position.element = e.target;
        position.start = position.element.selectionStart;
        position.end = position.element.selectionEnd;

        var $mirror = $('<div id="qt-mirror" class="qt-mirror"></div>').addClass(position.element.className),
            $source = $(position.element),
            $sourcePosition = $source.position();

        // copy all styles
        for (var i in App.autocomplete.mirrorStyles) {
            var style = App.autocomplete.mirrorStyles[i];
            $mirror.css(style, $source.css(style));
        }

        // set absolute position
        $mirror.css({top: $sourcePosition.top + 'px', left: $sourcePosition.left + 'px'});

        // copy content
        $mirror.html($source.val().substr(0, position.end).split("\n").join('<br>'));
        $mirror.append('<span id="qt-caret" class="qt-caret"></span>');

        // insert mirror
        $mirror.insertAfter($source);

        $caret = $('#qt-caret');
        position.absolute = $caret.offset();
        position.absolute.width = $caret.width();
        position.absolute.height = $caret.height();

        $mirror.remove();

    }

    return position;
};


App.autocomplete.replaceWith = function (quicktext, event) {


    var cursorPosition = App.autocomplete.cursorPosition,
        word = cursorPosition.word,
        replacement = "";

    App.autocomplete.justCompleted = true; // the idea is that we don't want any completion to popup after we just completed

    // we need the callback because the editor
    // doesn't get the focus right-away.
    // so window.getSelection() returns the search field
    // in the dialog otherwise, instead of the editor
    App.autocomplete.dialog.close(function() {

        App.plugin.getData({
            element: cursorPosition.element
        }, function(err, response) {

            var parsedTemplate = Handlebars.compile(quicktext.body)(response);

            if(App.data.contentEditable) {

                var selection = window.getSelection();
                var range = selection.getRangeAt(0);

                replacement = parsedTemplate.replace(/\n/g, '<br>');

                range.setStart(cursorPosition.element, word.start);
                range.setEnd(cursorPosition.element, word.end);
                range.deleteContents();
                range.insertNode(range.createContextualFragment(replacement + '<span id="qt-caret"></span>'));

                // Virtual caret
                // Used to set cursor position in right place
                // TODO find a better method to do that
                var $caret = $('#qt-caret');

                if ($caret.length) {
                    // Set caret back at old position
                    range = range.cloneRange();
                    range.setStartAfter($caret[0]);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);

                    // Remove virtual caret
                    $caret.remove();
                }

            } else {

                var $textarea = $(cursorPosition.element),
                    value = $textarea.val();

                var valueNew = value.substr(0, word.start) + parsedTemplate + value.substr(word.end),
                    cursorOffset = word.start + quicktext.body.length;

                $textarea.val(valueNew);

                // Set focus at the end of patch
                $textarea.focus();
                $textarea[0].setSelectionRange(cursorOffset, cursorOffset);

            }

        });

    });

    // set subject field
    if (quicktext.subject) {
        App.plugin.setTitle(quicktext);
    }

    // updates stats
    App.settings.stats('words', quicktext.body.split(" ").length, function () {
    });


};
