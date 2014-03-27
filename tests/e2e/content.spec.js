/* Tests for the contentscript
 */

describe('content script', function(){

  var gmail = {
        url: 'https://mail.google.com/',
        user: process.env.QUICKTEXT_GMAIL_USERNAME,
        password: process.env.QUICKTEXT_GMAIL_PASSWORD
      },
      gmailContainerSelector = '.AO',
      messageBodySelector = 'div[aria-label="Message Body"]',
      autocompleteDropdownSelector = '.qt-dropdown',
      quicktext = {
        tab: 'h',
        body: 'Hello ,'
      };

  var deleteAll = protractor.Key.chord(protractor.Key.CONTROL, 'a') + protractor.Key.DELETE;

  it('should log-in into Gmail', function() {

    browser.driver.get(gmail.url);

    browser.driver.findElement(by.css('#Email')).sendKeys(gmail.user);
    browser.driver.findElement(by.css('#Passwd')).sendKeys(gmail.password);

    browser.driver.findElement(by.css('#Passwd')).submit().then(function() {

      browser.driver.wait(function() {
        return browser.driver.isElementPresent(by.css(gmailContainerSelector));
      });

      expect(browser.driver.getCurrentUrl()).toContain('#inbox');

    });

  });

  it('should open the Compose window', function() {

    browser.driver.findElement(by.css('[gh=cm]')).click();

    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.css(messageBodySelector));
    });

    expect(browser.driver.isElementPresent(by.css(messageBodySelector))).toBe(true);

  });

  // TODO add a new quicktext, or at least make sure we have the default ones

  it('should show the Quicktext autocomplete dropdown', function() {

    browser.driver.findElement(by.css(messageBodySelector)).sendKeys(quicktext.tab);

    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.css(autocompleteDropdownSelector));
    });

    expect(browser.driver.isElementPresent(by.css(autocompleteDropdownSelector))).toBe(true);

  });

  it('should contain the quicktext in the autocomplete dropdown', function() {

    expect(
      browser.driver.findElement(by.css(autocompleteDropdownSelector)).getText()
    ).toContain('Say Hello');

  });

  it('should activate the quicktext by clicking on the autocomplete listing', function() {

    browser.driver.findElement(by.css(autocompleteDropdownSelector + ' li:first-child')).click();

    expect(
      browser.driver.findElement(by.css(messageBodySelector)).getText()
    ).toContain(quicktext.body);

    // cleanup everything in the message body
    browser.driver.findElement(by.css(messageBodySelector)).sendKeys(deleteAll);

  });

  it('should activate the quicktext by pressing Enter', function() {

    browser.driver.findElement(by.css(messageBodySelector)).sendKeys(quicktext.tab);

    browser.driver.wait(function() {
      return browser.driver.isElementPresent(by.css(autocompleteDropdownSelector));
    });

    browser.driver.findElement(by.css(messageBodySelector)).sendKeys(protractor.Key.ENTER);

    expect(
      browser.driver.findElement(by.css(messageBodySelector)).getText()
    ).toContain(quicktext.body);

    // cleanup everything in the message body
    browser.driver.findElement(by.css(messageBodySelector)).sendKeys(deleteAll);

  });

  it('should activate the quicktext using Tab', function() {

    browser.driver.findElement(by.css(messageBodySelector)).sendKeys('h' + protractor.Key.TAB);

    expect(
      browser.driver.findElement(by.css(messageBodySelector)).getText()
    ).toContain(quicktext.body);

  });


});