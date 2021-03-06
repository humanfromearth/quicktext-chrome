/**
 * Keyboard completion code.
 */

import autocomplete from './autocomplete';

export default {
    completion: function (e) {

        var element = e.target;
        var doc = element.ownerDocument;
        var selection = doc.getSelection();
        var focusNode = selection.focusNode;
        // if it's not an editable element
        // don't trigger anything
        if(!autocomplete.isEditable(element)) {
            return true;
        }

        // First get the cursor position
        autocomplete.cursorPosition = autocomplete.getCursorPosition(element);
        // Then get the word at the positon
        var word = autocomplete.getSelectedWord({
            element: element
        });
        autocomplete.cursorPosition.word = word;

        if (word.text) {

            // Find a matching Quicktext shortcut in the bg script
            window.App.settings.getQuicktextsShortcut(word.text, function (quicktexts) {

                if (quicktexts.length) {
                    // replace with the first quicktext found
                    autocomplete.replaceWith({
                        element: element,
                        quicktext: quicktexts[0],
                        focusNode: focusNode
                    });
                }

            });

        }

    }
};
