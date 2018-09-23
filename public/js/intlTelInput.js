/*
 * International Telephone Input v13.0.0
 * https://github.com/jackocnr/intl-tel-input.git
 * Licensed under the MIT license
 */

// wrap in UMD - see https://github.com/umdjs/umd/blob/master/jqueryPluginCommonjs.js
(function(factory) {
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], function($) {
            factory($, window, document);
        });
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"), window, document);
    } else {
        factory(jQuery, window, document);
    }
})(function($, window, document, undefined) {
    "use strict";
    // these vars persist through all instances of the plugin
    var pluginName = "intlTelInput", id = 1, // give each instance it's own id for namespaced event handling
        defaults = {
            // whether or not to allow the dropdown
            allowDropdown: true,
            // if there is just a dial code in the input: remove it on blur, and re-add it on focus
            autoHideDialCode: true,
            // add a placeholder in the input with an example number for the selected country
            autoPlaceholder: "polite",
            // modify the auto placeholder
            customPlaceholder: null,
            // append menu to a specific element
            dropdownContainer: "",
            // don't display these countries
            excludeCountries: [],
            // format the input value during initialisation and on setNumber
            formatOnDisplay: true,
            // geoIp lookup function
            geoIpLookup: null,
            // inject a hidden input with this name, and on submit, populate it with the result of getNumber
            hiddenInput: "",
            // initial country
            initialCountry: "",
            // localized country names e.g. { 'de': 'Deutschland' }
            localizedCountries: null,
            // don't insert international dial codes
            nationalMode: true,
            // display only these countries
            onlyCountries: [],
            // number type to use for placeholders
            placeholderNumberType: "MOBILE",
            // the countries at the top of the list. defaults to united states and united kingdom
            preferredCountries: [ "us", "gb" ],
            // display the country dial code next to the selected flag so it's not part of the typed number
            separateDialCode: false,
            // specify the path to the libphonenumber script to enable validation/formatting
            utilsScript: ""
        }, keys = {
            UP: 38,
            DOWN: 40,
            ENTER: 13,
            ESC: 27,
            PLUS: 43,
            A: 65,
            Z: 90,
            SPACE: 32,
            TAB: 9
        }, // https://en.wikipedia.org/wiki/List_of_North_American_Numbering_Plan_area_codes#Non-geographic_area_codes
        regionlessNanpNumbers = [ "800", "822", "833", "844", "855", "866", "877", "880", "881", "882", "883", "884", "885", "886", "887", "888", "889" ];
    // keep track of if the window.load event has fired as impossible to check after the fact
    $(window).on("load", function() {
        // UPDATE: use a public static field so we can fudge it in the tests
        $.fn[pluginName].windowLoaded = true;
    });
    function Plugin(element, options) {
        this.telInput = $(element);
        this.options = $.extend({}, defaults, options);
        // event namespace
        this.ns = "." + pluginName + id++;
        // Chrome, FF, Safari, IE9+
        this.isGoodBrowser = Boolean(element.setSelectionRange);
        this.hadInitialPlaceholder = Boolean($(element).attr("placeholder"));
    }
    Plugin.prototype = {
        _init: function() {
            // if in nationalMode, disable options relating to dial codes
            if (this.options.nationalMode) {
                this.options.autoHideDialCode = false;
            }
            // if separateDialCode then doesn't make sense to A) insert dial code into input (autoHideDialCode), and B) display national numbers (because we're displaying the country dial code next to them)
            if (this.options.separateDialCode) {
                this.options.autoHideDialCode = this.options.nationalMode = false;
            }
            // we cannot just test screen size as some smartphones/website meta tags will report desktop resolutions
            // Note: for some reason jasmine breaks if you put this in the main Plugin function with the rest of these declarations
            // Note: to target Android Mobiles (and not Tablets), we must find "Android" and "Mobile"
            this.isMobile = /Android.+Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (this.isMobile) {
                // trigger the mobile dropdown css
                $("body").addClass("iti-mobile");
                // on mobile, we want a full screen dropdown, so we must append it to the body
                if (!this.options.dropdownContainer) {
                    this.options.dropdownContainer = "body";
                }
            }
            // we return these deferred objects from the _init() call so they can be watched, and then we resolve them when each specific request returns
            // Note: again, jasmine breaks when I put these in the Plugin function
            this.autoCountryDeferred = new $.Deferred();
            this.utilsScriptDeferred = new $.Deferred();
            // in various situations there could be no country selected initially, but we need to be able to assume this variable exists
            this.selectedCountryData = {};
            // process all the data: onlyCountries, excludeCountries, preferredCountries etc
            this._processCountryData();
            // generate the markup
            this._generateMarkup();
            // set the initial state of the input value and the selected flag
            this._setInitialState();
            // start all of the event listeners: autoHideDialCode, input keydown, selectedFlag click
            this._initListeners();
            // utils script, and auto country
            this._initRequests();
            // return the deferreds
            return [ this.autoCountryDeferred, this.utilsScriptDeferred ];
        },
        /********************
         *  PRIVATE METHODS
         ********************/
        // prepare all of the country data, including onlyCountries, excludeCountries and preferredCountries options
        _processCountryData: function() {
            // process onlyCountries or excludeCountries array if present
            this._processAllCountries();
            // process the countryCodes map
            this._processCountryCodes();
            // process the preferredCountries
            this._processPreferredCountries();
            // translate countries according to localizedCountries option
            if (this.options.localizedCountries) {
                this._translateCountriesByLocale();
            }
            // sort countries by name
            if (this.options.onlyCountries.length || this.options.localizedCountries) {
                this.countries.sort(this._countryNameSort);
            }
        },
        // add a country code to this.countryCodes
        _addCountryCode: function(iso2, dialCode, priority) {
            if (!(dialCode in this.countryCodes)) {
                this.countryCodes[dialCode] = [];
            }
            var index = priority || 0;
            this.countryCodes[dialCode][index] = iso2;
        },
        // process onlyCountries or excludeCountries array if present
        _processAllCountries: function() {
            if (this.options.onlyCountries.length) {
                var lowerCaseOnlyCountries = this.options.onlyCountries.map(function(country) {
                    return country.toLowerCase();
                });
                this.countries = allCountries.filter(function(country) {
                    return lowerCaseOnlyCountries.indexOf(country.iso2) > -1;
                });
            } else if (this.options.excludeCountries.length) {
                var lowerCaseExcludeCountries = this.options.excludeCountries.map(function(country) {
                    return country.toLowerCase();
                });
                this.countries = allCountries.filter(function(country) {
                    return lowerCaseExcludeCountries.indexOf(country.iso2) === -1;
                });
            } else {
                this.countries = allCountries;
            }
        },
        // Translate Countries by object literal provided on config
        _translateCountriesByLocale: function() {
            for (var i = 0; i < this.countries.length; i++) {
                var iso = this.countries[i].iso2.toLowerCase();
                if (iso in this.options.localizedCountries) {
                    this.countries[i].name = this.options.localizedCountries[iso];
                }
            }
        },
        // sort by country name
        _countryNameSort: function(a, b) {
            return a.name.localeCompare(b.name);
        },
        // process the countryCodes map
        _processCountryCodes: function() {
            this.countryCodes = {};
            for (var i = 0; i < this.countries.length; i++) {
                var c = this.countries[i];
                this._addCountryCode(c.iso2, c.dialCode, c.priority);
                // area codes
                if (c.areaCodes) {
                    for (var j = 0; j < c.areaCodes.length; j++) {
                        // full dial code is country code + dial code
                        this._addCountryCode(c.iso2, c.dialCode + c.areaCodes[j]);
                    }
                }
            }
        },
        // process preferred countries - iterate through the preferences, fetching the country data for each one
        _processPreferredCountries: function() {
            this.preferredCountries = [];
            for (var i = 0; i < this.options.preferredCountries.length; i++) {
                var countryCode = this.options.preferredCountries[i].toLowerCase(), countryData = this._getCountryData(countryCode, false, true);
                if (countryData) {
                    this.preferredCountries.push(countryData);
                }
            }
        },
        // generate all of the markup for the plugin: the selected flag overlay, and the dropdown
        _generateMarkup: function() {
            // prevent autocomplete as there's no safe, cross-browser event we can react to, so it can easily put the plugin in an inconsistent state e.g. the wrong flag selected for the autocompleted number, which on submit could mean the wrong number is saved (esp in nationalMode)
            this.telInput.attr("autocomplete", "off");
            // containers (mostly for positioning)
            var parentClass = "intl-tel-input";
            if (this.options.allowDropdown) {
                parentClass += " allow-dropdown";
            }
            if (this.options.separateDialCode) {
                parentClass += " separate-dial-code";
            }
            this.telInput.wrap($("<div>", {
                "class": parentClass
            }));
            this.flagsContainer = $("<div>", {
                "class": "flag-container"
            }).insertBefore(this.telInput);
            // currently selected flag (displayed to left of input)
            var selectedFlag = $("<div>", {
                "class": "selected-flag",
                role: "combobox",
                "aria-owns": "country-listbox"
            });
            selectedFlag.appendTo(this.flagsContainer);
            this.selectedFlagInner = $("<div>", {
                "class": "iti-flag"
            }).appendTo(selectedFlag);
            if (this.options.separateDialCode) {
                this.selectedDialCode = $("<div>", {
                    "class": "selected-dial-code"
                }).appendTo(selectedFlag);
            }
            if (this.options.allowDropdown) {
                // make element focusable and tab naviagable
                selectedFlag.attr("tabindex", "0");
                // CSS triangle
                $("<div>", {
                    "class": "iti-arrow"
                }).appendTo(selectedFlag);
                // country dropdown: preferred countries, then divider, then all countries
                this.countryList = $("<ul>", {
                    "class": "country-list hide",
                    id: "country-listbox",
                    "aria-expanded": "false",
                    role: "listbox"
                });
                if (this.preferredCountries.length) {
                    this._appendListItems(this.preferredCountries, "preferred");
                    $("<li>", {
                        "class": "divider",
                        role: "separator",
                        "aria-disabled": "true"
                    }).appendTo(this.countryList);
                }
                this._appendListItems(this.countries, "");
                // this is useful in lots of places
                this.countryListItems = this.countryList.children(".country");
                // create dropdownContainer markup
                if (this.options.dropdownContainer) {
                    this.dropdown = $("<div>", {
                        "class": "intl-tel-input iti-container"
                    }).append(this.countryList);
                } else {
                    this.countryList.appendTo(this.flagsContainer);
                }
            } else {
                // a little hack so we don't break anything
                this.countryListItems = $();
            }
            if (this.options.hiddenInput) {
                var hiddenInputName = this.options.hiddenInput;
                var name = this.telInput.attr("name");
                if (name) {
                    var i = name.lastIndexOf("[");
                    // if input name contains square brackets, then give the hidden input the same name,
                    // replacing the contents of the last set of brackets with the given hiddenInput name
                    if (i !== -1) hiddenInputName = name.substr(0, i) + "[" + hiddenInputName + "]";
                }
                this.hiddenInput = $("<input>", {
                    type: "hidden",
                    name: hiddenInputName
                }).insertAfter(this.telInput);
            }
        },
        // add a country <li> to the countryList <ul> container
        _appendListItems: function(countries, className) {
            // we create so many DOM elements, it is faster to build a temp string
            // and then add everything to the DOM in one go at the end
            var tmp = "";
            // for each country
            for (var i = 0; i < countries.length; i++) {
                var c = countries[i];
                // open the list item
                tmp += "<li class='country " + className + "' id='iti-item-" + c.iso2 + "' role='option' data-dial-code='" + c.dialCode + "' data-country-code='" + c.iso2 + "'>";
                // add the flag
                tmp += "<div class='flag-box'><div class='iti-flag " + c.iso2 + "'></div></div>";
                // and the country name and dial code
                tmp += "<span class='country-name'>" + c.name + "</span>";
                tmp += "<span class='dial-code'>+" + c.dialCode + "</span>";
                // close the list item
                tmp += "</li>";
            }
            this.countryList.append(tmp);
        },
        // set the initial state of the input value and the selected flag by:
        // 1. extracting a dial code from the given number
        // 2. using explicit initialCountry
        // 3. picking the first preferred country
        // 4. picking the first country
        _setInitialState: function() {
            var val = this.telInput.val();
            var dialCode = this._getDialCode(val);
            var isRegionlessNanp = this._isRegionlessNanp(val);
            // if we already have a dial code, and it's not a regionlessNanp, we can go ahead and set the flag, else fall back to the default country
            if (dialCode && !isRegionlessNanp) {
                this._updateFlagFromNumber(val);
            } else if (this.options.initialCountry !== "auto") {
                // see if we should select a flag
                if (this.options.initialCountry) {
                    this._setFlag(this.options.initialCountry.toLowerCase());
                } else {
                    if (dialCode && isRegionlessNanp) {
                        // has intl dial code, is regionless nanp, and no initialCountry, so default to US
                        this._setFlag("us");
                    } else {
                        // no dial code and no initialCountry, so default to first in list
                        this.defaultCountry = this.preferredCountries.length ? this.preferredCountries[0].iso2 : this.countries[0].iso2;
                        if (!val) {
                            this._setFlag(this.defaultCountry);
                        }
                    }
                }
                // if empty and no nationalMode and no autoHideDialCode then insert the default dial code
                if (!val && !this.options.nationalMode && !this.options.autoHideDialCode && !this.options.separateDialCode) {
                    this.telInput.val("+" + this.selectedCountryData.dialCode);
                }
            }
            // NOTE: if initialCountry is set to auto, that will be handled separately
            // format
            if (val) {
                // this wont be run after _updateDialCode as that's only called if no val
                this._updateValFromNumber(val);
            }
        },
        // initialise the main event listeners: input keyup, and click selected flag
        _initListeners: function() {
            this._initKeyListeners();
            if (this.options.autoHideDialCode) {
                this._initFocusListeners();
            }
            if (this.options.allowDropdown) {
                this._initDropdownListeners();
            }
            if (this.hiddenInput) {
                this._initHiddenInputListener();
            }
        },
        // update hidden input on form submit
        _initHiddenInputListener: function() {
            var that = this;
            var form = this.telInput.closest("form");
            if (form.length) {
                form.submit(function() {
                    that.hiddenInput.val(that.getNumber());
                });
            }
        },
        // initialise the dropdown listeners
        _initDropdownListeners: function() {
            var that = this;
            // hack for input nested inside label: clicking the selected-flag to open the dropdown would then automatically trigger a 2nd click on the input which would close it again
            var label = this.telInput.closest("label");
            if (label.length) {
                label.on("click" + this.ns, function(e) {
                    // if the dropdown is closed, then focus the input, else ignore the click
                    if (that.countryList.hasClass("hide")) {
                        that.telInput.focus();
                    } else {
                        e.preventDefault();
                    }
                });
            }
            // toggle country dropdown on click
            var selectedFlag = this.selectedFlagInner.parent();
            selectedFlag.on("click" + this.ns, function(e) {
                // only intercept this event if we're opening the dropdown
                // else let it bubble up to the top ("click-off-to-close" listener)
                // we cannot just stopPropagation as it may be needed to close another instance
                if (that.countryList.hasClass("hide") && !that.telInput.prop("disabled") && !that.telInput.prop("readonly")) {
                    that._showDropdown();
                }
            });
            // open dropdown list if currently focused
            this.flagsContainer.on("keydown" + that.ns, function(e) {
                var isDropdownHidden = that.countryList.hasClass("hide");
                if (isDropdownHidden && (e.which == keys.UP || e.which == keys.DOWN || e.which == keys.SPACE || e.which == keys.ENTER)) {
                    // prevent form from being submitted if "ENTER" was pressed
                    e.preventDefault();
                    // prevent event from being handled again by document
                    e.stopPropagation();
                    that._showDropdown();
                }
                // allow navigation from dropdown to input on TAB
                if (e.which == keys.TAB) {
                    that._closeDropdown();
                }
            });
        },
        // init many requests: utils script / geo ip lookup
        _initRequests: function() {
            var that = this;
            // if the user has specified the path to the utils script, fetch it on window.load, else resolve
            if (this.options.utilsScript && !window.intlTelInputUtils) {
                // if the plugin is being initialised after the window.load event has already been fired
                if ($.fn[pluginName].windowLoaded) {
                    $.fn[pluginName].loadUtils(this.options.utilsScript);
                } else {
                    // wait until the load event so we don't block any other requests e.g. the flags image
                    $(window).on("load", function() {
                        $.fn[pluginName].loadUtils(that.options.utilsScript);
                    });
                }
            } else {
                this.utilsScriptDeferred.resolve();
            }
            if (this.options.initialCountry === "auto") {
                this._loadAutoCountry();
            } else {
                this.autoCountryDeferred.resolve();
            }
        },
        // perform the geo ip lookup
        _loadAutoCountry: function() {
            var that = this;
            // 3 options:
            // 1) already loaded (we're done)
            // 2) not already started loading (start)
            // 3) already started loading (do nothing - just wait for loading callback to fire)
            if ($.fn[pluginName].autoCountry) {
                this.handleAutoCountry();
            } else if (!$.fn[pluginName].startedLoadingAutoCountry) {
                // don't do this twice!
                $.fn[pluginName].startedLoadingAutoCountry = true;
                if (typeof this.options.geoIpLookup === "function") {
                    this.options.geoIpLookup(function(countryCode) {
                        $.fn[pluginName].autoCountry = countryCode.toLowerCase();
                        // tell all instances the auto country is ready
                        // TODO: this should just be the current instances
                        // UPDATE: use setTimeout in case their geoIpLookup function calls this callback straight away (e.g. if they have already done the geo ip lookup somewhere else). Using setTimeout means that the current thread of execution will finish before executing this, which allows the plugin to finish initialising.
                        setTimeout(function() {
                            $(".intl-tel-input input").intlTelInput("handleAutoCountry");
                        });
                    });
                }
            }
        },
        // initialize any key listeners
        _initKeyListeners: function() {
            var that = this;
            // update flag on keyup
            // (keep this listener separate otherwise the setTimeout breaks all the tests)
            this.telInput.on("keyup" + this.ns, function() {
                if (that._updateFlagFromNumber(that.telInput.val())) {
                    that._triggerCountryChange();
                }
            });
            // update flag on cut/paste events (now supported in all major browsers)
            this.telInput.on("cut" + this.ns + " paste" + this.ns, function() {
                // hack because "paste" event is fired before input is updated
                setTimeout(function() {
                    if (that._updateFlagFromNumber(that.telInput.val())) {
                        that._triggerCountryChange();
                    }
                });
            });
        },
        // adhere to the input's maxlength attr
        _cap: function(number) {
            var max = this.telInput.attr("maxlength");
            return max && number.length > max ? number.substr(0, max) : number;
        },
        // listen for mousedown, focus and blur
        _initFocusListeners: function() {
            var that = this;
            // mousedown decides where the cursor goes, so if we're focusing we must preventDefault as we'll be inserting the dial code, and we want the cursor to be at the end no matter where they click
            this.telInput.on("mousedown" + this.ns, function(e) {
                if (!that.telInput.is(":focus") && !that.telInput.val()) {
                    e.preventDefault();
                    // but this also cancels the focus, so we must trigger that manually
                    that.telInput.focus();
                }
            });
            // on focus: if empty, insert the dial code for the currently selected flag
            this.telInput.on("focus" + this.ns, function(e) {
                if (!that.telInput.val() && !that.telInput.prop("readonly") && that.selectedCountryData.dialCode) {
                    // insert the dial code
                    that.telInput.val("+" + that.selectedCountryData.dialCode);
                    // after auto-inserting a dial code, if the first key they hit is '+' then assume they are entering a new number, so remove the dial code. use keypress instead of keydown because keydown gets triggered for the shift key (required to hit the + key), and instead of keyup because that shows the new '+' before removing the old one
                    that.telInput.one("keypress.plus" + that.ns, function(e) {
                        if (e.which == keys.PLUS) {
                            that.telInput.val("");
                        }
                    });
                    // after tabbing in, make sure the cursor is at the end we must use setTimeout to get outside of the focus handler as it seems the selection happens after that
                    setTimeout(function() {
                        var input = that.telInput[0];
                        if (that.isGoodBrowser) {
                            var len = that.telInput.val().length;
                            input.setSelectionRange(len, len);
                        }
                    });
                }
            });
            // on blur or form submit: if just a dial code then remove it
            var form = this.telInput.prop("form");
            if (form) {
                $(form).on("submit" + this.ns, function() {
                    that._removeEmptyDialCode();
                });
            }
            this.telInput.on("blur" + this.ns, function() {
                that._removeEmptyDialCode();
            });
        },
        _removeEmptyDialCode: function() {
            var value = this.telInput.val(), startsPlus = value.charAt(0) == "+";
            if (startsPlus) {
                var numeric = this._getNumeric(value);
                // if just a plus, or if just a dial code
                if (!numeric || this.selectedCountryData.dialCode == numeric) {
                    this.telInput.val("");
                }
            }
            // remove the keypress listener we added on focus
            this.telInput.off("keypress.plus" + this.ns);
        },
        // extract the numeric digits from the given string
        _getNumeric: function(s) {
            return s.replace(/\D/g, "");
        },
        // show the dropdown
        _showDropdown: function() {
            this._setDropdownPosition();
            // update highlighting and scroll to active list item
            var activeListItem = this.countryList.children(".active");
            if (activeListItem.length) {
                this._highlightListItem(activeListItem);
                this._scrollTo(activeListItem);
            }
            // bind all the dropdown-related listeners: mouseover, click, click-off, keydown
            this._bindDropdownListeners();
            // update the arrow
            this.selectedFlagInner.children(".iti-arrow").addClass("up");
            this.telInput.trigger("open:countrydropdown");
        },
        // decide where to position dropdown (depends on position within viewport, and scroll)
        _setDropdownPosition: function() {
            var that = this;
            if (this.options.dropdownContainer) {
                this.dropdown.appendTo(this.options.dropdownContainer);
            }
            // show the menu and grab the dropdown height
            this.dropdownHeight = this.countryList.removeClass("hide").attr("aria-expanded", "true").outerHeight();
            if (!this.isMobile) {
                var pos = this.telInput.offset(), inputTop = pos.top, windowTop = $(window).scrollTop(), // dropdownFitsBelow = (dropdownBottom < windowBottom)
                    dropdownFitsBelow = inputTop + this.telInput.outerHeight() + this.dropdownHeight < windowTop + $(window).height(), dropdownFitsAbove = inputTop - this.dropdownHeight > windowTop;
                // by default, the dropdown will be below the input. If we want to position it above the input, we add the dropup class.
                this.countryList.toggleClass("dropup", !dropdownFitsBelow && dropdownFitsAbove);
                // if dropdownContainer is enabled, calculate postion
                if (this.options.dropdownContainer) {
                    // by default the dropdown will be directly over the input because it's not in the flow. If we want to position it below, we need to add some extra top value.
                    var extraTop = !dropdownFitsBelow && dropdownFitsAbove ? 0 : this.telInput.innerHeight();
                    // calculate placement
                    this.dropdown.css({
                        top: inputTop + extraTop,
                        left: pos.left
                    });
                    // close menu on window scroll
                    $(window).on("scroll" + this.ns, function() {
                        that._closeDropdown();
                    });
                }
            }
        },
        // we only bind dropdown listeners when the dropdown is open
        _bindDropdownListeners: function() {
            var that = this;
            // when mouse over a list item, just highlight that one
            // we add the class "highlight", so if they hit "enter" we know which one to select
            this.countryList.on("mouseover" + this.ns, ".country", function(e) {
                that._highlightListItem($(this));
            });
            // listen for country selection
            this.countryList.on("click" + this.ns, ".country", function(e) {
                that._selectListItem($(this));
            });
            // click off to close
            // (except when this initial opening click is bubbling up)
            // we cannot just stopPropagation as it may be needed to close another instance
            var isOpening = true;
            $("html").on("click" + this.ns, function(e) {
                if (!isOpening) {
                    that._closeDropdown();
                }
                isOpening = false;
            });
            // listen for up/down scrolling, enter to select, or letters to jump to country name.
            // use keydown as keypress doesn't fire for non-char keys and we want to catch if they
            // just hit down and hold it to scroll down (no keyup event).
            // listen on the document because that's where key events are triggered if no input has focus
            var query = "", queryTimer = null;
            $(document).on("keydown" + this.ns, function(e) {
                // prevent down key from scrolling the whole page,
                // and enter key from submitting a form etc
                e.preventDefault();
                if (e.which == keys.UP || e.which == keys.DOWN) {
                    // up and down to navigate
                    that._handleUpDownKey(e.which);
                } else if (e.which == keys.ENTER) {
                    // enter to select
                    that._handleEnterKey();
                } else if (e.which == keys.ESC) {
                    // esc to close
                    that._closeDropdown();
                } else if (e.which >= keys.A && e.which <= keys.Z || e.which == keys.SPACE) {
                    // upper case letters (note: keyup/keydown only return upper case letters)
                    // jump to countries that start with the query string
                    if (queryTimer) {
                        clearTimeout(queryTimer);
                    }
                    query += String.fromCharCode(e.which);
                    that._searchForCountry(query);
                    // if the timer hits 1 second, reset the query
                    queryTimer = setTimeout(function() {
                        query = "";
                    }, 1e3);
                }
            });
        },
        // highlight the next/prev item in the list (and ensure it is visible)
        _handleUpDownKey: function(key) {
            var current = this.countryList.children(".highlight").first();
            var next = key == keys.UP ? current.prev() : current.next();
            if (next.length) {
                // skip the divider
                if (next.hasClass("divider")) {
                    next = key == keys.UP ? next.prev() : next.next();
                }
                this._highlightListItem(next);
                this._scrollTo(next);
            }
        },
        // select the currently highlighted item
        _handleEnterKey: function() {
            var currentCountry = this.countryList.children(".highlight").first();
            if (currentCountry.length) {
                this._selectListItem(currentCountry);
            }
        },
        // find the first list item whose name starts with the query string
        _searchForCountry: function(query) {
            for (var i = 0; i < this.countries.length; i++) {
                if (this._startsWith(this.countries[i].name, query)) {
                    var listItem = this.countryList.children("[data-country-code=" + this.countries[i].iso2 + "]").not(".preferred");
                    // update highlighting and scroll
                    this._highlightListItem(listItem);
                    this._scrollTo(listItem, true);
                    break;
                }
            }
        },
        // check if (uppercase) string a starts with string b
        _startsWith: function(a, b) {
            return a.substr(0, b.length).toUpperCase() == b;
        },
        // update the input's value to the given val (format first if possible)
        // NOTE: this is called from _setInitialState, handleUtils and setNumber
        _updateValFromNumber: function(number) {
            if (this.options.formatOnDisplay && window.intlTelInputUtils && this.selectedCountryData) {
                var format = !this.options.separateDialCode && (this.options.nationalMode || number.charAt(0) != "+") ? intlTelInputUtils.numberFormat.NATIONAL : intlTelInputUtils.numberFormat.INTERNATIONAL;
                number = intlTelInputUtils.formatNumber(number, this.selectedCountryData.iso2, format);
            }
            number = this._beforeSetNumber(number);
            this.telInput.val(number);
        },
        // check if need to select a new flag based on the given number
        // Note: called from _setInitialState, keyup handler, setNumber
        _updateFlagFromNumber: function(number) {
            // if we're in nationalMode and we already have US/Canada selected, make sure the number starts with a +1 so _getDialCode will be able to extract the area code
            // update: if we dont yet have selectedCountryData, but we're here (trying to update the flag from the number), that means we're initialising the plugin with a number that already has a dial code, so fine to ignore this bit
            if (number && this.options.nationalMode && this.selectedCountryData.dialCode == "1" && number.charAt(0) != "+") {
                if (number.charAt(0) != "1") {
                    number = "1" + number;
                }
                number = "+" + number;
            }
            // try and extract valid dial code from input
            var dialCode = this._getDialCode(number), countryCode = null, numeric = this._getNumeric(number);
            if (dialCode) {
                // check if one of the matching countries is already selected
                var countryCodes = this.countryCodes[this._getNumeric(dialCode)], alreadySelected = $.inArray(this.selectedCountryData.iso2, countryCodes) > -1, // check if the given number contains a NANP area code i.e. the only dialCode that could be extracted was +1 (instead of say +1204) and the actual number's length is >=4
                    isNanpAreaCode = dialCode == "+1" && numeric.length >= 4, nanpSelected = this.selectedCountryData.dialCode == "1";
                // only update the flag if:
                // A) NOT (we currently have a NANP flag selected, and the number is a regionlessNanp)
                // AND
                // B) either a matching country is not already selected OR the number contains a NANP area code (ensure the flag is set to the first matching country)
                if (!(nanpSelected && this._isRegionlessNanp(numeric)) && (!alreadySelected || isNanpAreaCode)) {
                    // if using onlyCountries option, countryCodes[0] may be empty, so we must find the first non-empty index
                    for (var j = 0; j < countryCodes.length; j++) {
                        if (countryCodes[j]) {
                            countryCode = countryCodes[j];
                            break;
                        }
                    }
                }
            } else if (number.charAt(0) == "+" && numeric.length) {
                // invalid dial code, so empty
                // Note: use getNumeric here because the number has not been formatted yet, so could contain bad chars
                countryCode = "";
            } else if (!number || number == "+") {
                // empty, or just a plus, so default
                countryCode = this.defaultCountry;
            }
            if (countryCode !== null) {
                return this._setFlag(countryCode);
            }
            return false;
        },
        // check if the given number is a regionless NANP number (expects the number to contain an international dial code)
        _isRegionlessNanp: function(number) {
            var numeric = this._getNumeric(number);
            if (numeric.charAt(0) == "1") {
                var areaCode = numeric.substr(1, 3);
                return $.inArray(areaCode, regionlessNanpNumbers) > -1;
            }
            return false;
        },
        // remove highlighting from other list items and highlight the given item
        _highlightListItem: function(listItem) {
            this.countryListItems.removeClass("highlight");
            listItem.addClass("highlight");
        },
        // find the country data for the given country code
        // the ignoreOnlyCountriesOption is only used during init() while parsing the onlyCountries array
        _getCountryData: function(countryCode, ignoreOnlyCountriesOption, allowFail) {
            var countryList = ignoreOnlyCountriesOption ? allCountries : this.countries;
            for (var i = 0; i < countryList.length; i++) {
                if (countryList[i].iso2 == countryCode) {
                    return countryList[i];
                }
            }
            if (allowFail) {
                return null;
            } else {
                throw new Error("No country data for '" + countryCode + "'");
            }
        },
        // select the given flag, update the placeholder and the active list item
        // Note: called from _setInitialState, _updateFlagFromNumber, _selectListItem, setCountry
        _setFlag: function(countryCode) {
            var prevCountry = this.selectedCountryData.iso2 ? this.selectedCountryData : {};
            // do this first as it will throw an error and stop if countryCode is invalid
            this.selectedCountryData = countryCode ? this._getCountryData(countryCode, false, false) : {};
            // update the defaultCountry - we only need the iso2 from now on, so just store that
            if (this.selectedCountryData.iso2) {
                this.defaultCountry = this.selectedCountryData.iso2;
            }
            this.selectedFlagInner.attr("class", "iti-flag " + countryCode);
            // update the selected country's title attribute
            var title = countryCode ? this.selectedCountryData.name + ": +" + this.selectedCountryData.dialCode : "Unknown";
            this.selectedFlagInner.parent().attr("title", title);
            if (this.options.separateDialCode) {
                var dialCode = this.selectedCountryData.dialCode ? "+" + this.selectedCountryData.dialCode : "", parent = this.telInput.parent();
                if (prevCountry.dialCode) {
                    parent.removeClass("iti-sdc-" + (prevCountry.dialCode.length + 1));
                }
                if (dialCode) {
                    parent.addClass("iti-sdc-" + dialCode.length);
                }
                this.selectedDialCode.text(dialCode);
            }
            // and the input's placeholder
            this._updatePlaceholder();
            // update the active list item
            if (this.options.allowDropdown) {
                this.countryListItems.removeClass("active").attr("aria-selected", "false");
                if (countryCode) {
                    var listItem = this.countryListItems.find(".iti-flag." + countryCode).first().closest(".country");
                    listItem.addClass("active").attr("aria-selected", "true");
                    this.countryList.attr("aria-activedescendant", listItem.attr("id"));
                }
            }
            // return if the flag has changed or not
            return prevCountry.iso2 !== countryCode;
        },
        // update the input placeholder to an example number from the currently selected country
        _updatePlaceholder: function() {
            var shouldSetPlaceholder = this.options.autoPlaceholder === "aggressive" || !this.hadInitialPlaceholder && (this.options.autoPlaceholder === true || this.options.autoPlaceholder === "polite");
            if (window.intlTelInputUtils && shouldSetPlaceholder) {
                var numberType = intlTelInputUtils.numberType[this.options.placeholderNumberType], placeholder = this.selectedCountryData.iso2 ? intlTelInputUtils.getExampleNumber(this.selectedCountryData.iso2, this.options.nationalMode, numberType) : "";
                placeholder = this._beforeSetNumber(placeholder);
                if (typeof this.options.customPlaceholder === "function") {
                    placeholder = this.options.customPlaceholder(placeholder, this.selectedCountryData);
                }
                this.telInput.attr("placeholder", placeholder);
            }
        },
        // called when the user selects a list item from the dropdown
        _selectListItem: function(listItem) {
            // update selected flag and active list item
            var flagChanged = this._setFlag(listItem.attr("data-country-code"));
            this._closeDropdown();
            this._updateDialCode(listItem.attr("data-dial-code"), true);
            // focus the input
            this.telInput.focus();
            // put cursor at end - this fix is required for FF and IE11 (with nationalMode=false i.e. auto inserting dial code), who try to put the cursor at the beginning the first time
            if (this.isGoodBrowser) {
                var len = this.telInput.val().length;
                this.telInput[0].setSelectionRange(len, len);
            }
            if (flagChanged) {
                this._triggerCountryChange();
            }
        },
        // close the dropdown and unbind any listeners
        _closeDropdown: function() {
            this.countryList.addClass("hide");
            this.countryList.attr("aria-expanded", "false");
            // update the arrow
            this.selectedFlagInner.children(".iti-arrow").removeClass("up");
            // unbind key events
            $(document).off(this.ns);
            // unbind click-off-to-close
            $("html").off(this.ns);
            // unbind hover and click listeners
            this.countryList.off(this.ns);
            // remove menu from container
            if (this.options.dropdownContainer) {
                if (!this.isMobile) {
                    $(window).off("scroll" + this.ns);
                }
                this.dropdown.detach();
            }
            this.telInput.trigger("close:countrydropdown");
        },
        // check if an element is visible within it's container, else scroll until it is
        _scrollTo: function(element, middle) {
            var container = this.countryList, containerHeight = container.height(), containerTop = container.offset().top, containerBottom = containerTop + containerHeight, elementHeight = element.outerHeight(), elementTop = element.offset().top, elementBottom = elementTop + elementHeight, newScrollTop = elementTop - containerTop + container.scrollTop(), middleOffset = containerHeight / 2 - elementHeight / 2;
            if (elementTop < containerTop) {
                // scroll up
                if (middle) {
                    newScrollTop -= middleOffset;
                }
                container.scrollTop(newScrollTop);
            } else if (elementBottom > containerBottom) {
                // scroll down
                if (middle) {
                    newScrollTop += middleOffset;
                }
                var heightDifference = containerHeight - elementHeight;
                container.scrollTop(newScrollTop - heightDifference);
            }
        },
        // replace any existing dial code with the new one
        // Note: called from _selectListItem and setCountry
        _updateDialCode: function(newDialCode, hasSelectedListItem) {
            var inputVal = this.telInput.val(), newNumber;
            // save having to pass this every time
            newDialCode = "+" + newDialCode;
            if (inputVal.charAt(0) == "+") {
                // there's a plus so we're dealing with a replacement (doesn't matter if nationalMode or not)
                var prevDialCode = this._getDialCode(inputVal);
                if (prevDialCode) {
                    // current number contains a valid dial code, so replace it
                    newNumber = inputVal.replace(prevDialCode, newDialCode);
                } else {
                    // current number contains an invalid dial code, so ditch it
                    // (no way to determine where the invalid dial code ends and the rest of the number begins)
                    newNumber = newDialCode;
                }
            } else if (this.options.nationalMode || this.options.separateDialCode) {
                // don't do anything
                return;
            } else {
                // nationalMode is disabled
                if (inputVal) {
                    // there is an existing value with no dial code: prefix the new dial code
                    newNumber = newDialCode + inputVal;
                } else if (hasSelectedListItem || !this.options.autoHideDialCode) {
                    // no existing value and either they've just selected a list item, or autoHideDialCode is disabled: insert new dial code
                    newNumber = newDialCode;
                } else {
                    return;
                }
            }
            this.telInput.val(newNumber);
        },
        // try and extract a valid international dial code from a full telephone number
        // Note: returns the raw string inc plus character and any whitespace/dots etc
        _getDialCode: function(number) {
            var dialCode = "";
            // only interested in international numbers (starting with a plus)
            if (number.charAt(0) == "+") {
                var numericChars = "";
                // iterate over chars
                for (var i = 0; i < number.length; i++) {
                    var c = number.charAt(i);
                    // if char is number
                    if ($.isNumeric(c)) {
                        numericChars += c;
                        // if current numericChars make a valid dial code
                        if (this.countryCodes[numericChars]) {
                            // store the actual raw string (useful for matching later)
                            dialCode = number.substr(0, i + 1);
                        }
                        // longest dial code is 4 chars
                        if (numericChars.length == 4) {
                            break;
                        }
                    }
                }
            }
            return dialCode;
        },
        // get the input val, adding the dial code if separateDialCode is enabled
        _getFullNumber: function() {
            var val = $.trim(this.telInput.val()), dialCode = this.selectedCountryData.dialCode, prefix, numericVal = this._getNumeric(val), // normalized means ensure starts with a 1, so we can match against the full dial code
                normalizedVal = numericVal.charAt(0) == "1" ? numericVal : "1" + numericVal;
            if (this.options.separateDialCode) {
                // when using separateDialCode, it is visible so is effectively part of the typed number
                prefix = "+" + dialCode;
            } else if (val && val.charAt(0) != "+" && val.charAt(0) != "1" && dialCode && dialCode.charAt(0) == "1" && dialCode.length == 4 && dialCode != normalizedVal.substr(0, 4)) {
                // ensure national NANP numbers contain the area code
                prefix = dialCode.substr(1);
            } else {
                prefix = "";
            }
            return prefix + val;
        },
        // remove the dial code if separateDialCode is enabled
        _beforeSetNumber: function(number) {
            if (this.options.separateDialCode) {
                var dialCode = this._getDialCode(number);
                if (dialCode) {
                    // US dialCode is "+1", which is what we want
                    // CA dialCode is "+1 123", which is wrong - should be "+1" (as it has multiple area codes)
                    // AS dialCode is "+1 684", which is what we want
                    // Solution: if the country has area codes, then revert to just the dial code
                    if (this.selectedCountryData.areaCodes !== null) {
                        dialCode = "+" + this.selectedCountryData.dialCode;
                    }
                    // a lot of numbers will have a space separating the dial code and the main number, and some NANP numbers will have a hyphen e.g. +1 684-733-1234 - in both cases we want to get rid of it
                    // NOTE: don't just trim all non-numerics as may want to preserve an open parenthesis etc
                    var start = number[dialCode.length] === " " || number[dialCode.length] === "-" ? dialCode.length + 1 : dialCode.length;
                    number = number.substr(start);
                }
            }
            return this._cap(number);
        },
        // trigger the 'countrychange' event
        _triggerCountryChange: function() {
            this.telInput.trigger("countrychange", this.selectedCountryData);
        },
        /**************************
         *  SECRET PUBLIC METHODS
         **************************/
        // this is called when the geoip call returns
        handleAutoCountry: function() {
            if (this.options.initialCountry === "auto") {
                // we must set this even if there is an initial val in the input: in case the initial val is invalid and they delete it - they should see their auto country
                this.defaultCountry = $.fn[pluginName].autoCountry;
                // if there's no initial value in the input, then update the flag
                if (!this.telInput.val()) {
                    this.setCountry(this.defaultCountry);
                }
                this.autoCountryDeferred.resolve();
            }
        },
        // this is called when the utils request completes
        handleUtils: function() {
            // if the request was successful
            if (window.intlTelInputUtils) {
                // if there's an initial value in the input, then format it
                if (this.telInput.val()) {
                    this._updateValFromNumber(this.telInput.val());
                }
                this._updatePlaceholder();
            }
            this.utilsScriptDeferred.resolve();
        },
        /********************
         *  PUBLIC METHODS
         ********************/
        // remove plugin
        destroy: function() {
            if (this.options.allowDropdown) {
                // make sure the dropdown is closed (and unbind listeners)
                this._closeDropdown();
                // click event to open dropdown
                this.selectedFlagInner.parent().off(this.ns);
                // label click hack
                this.telInput.closest("label").off(this.ns);
            }
            // unbind submit event handler on form
            if (this.options.autoHideDialCode) {
                var form = this.telInput.prop("form");
                if (form) {
                    $(form).off(this.ns);
                }
            }
            // unbind all events: key events, and focus/blur events if autoHideDialCode=true
            this.telInput.off(this.ns);
            // remove markup (but leave the original input)
            var container = this.telInput.parent();
            container.before(this.telInput).remove();
        },
        // get the extension from the current number
        getExtension: function() {
            if (window.intlTelInputUtils) {
                return intlTelInputUtils.getExtension(this._getFullNumber(), this.selectedCountryData.iso2);
            }
            return "";
        },
        // format the number to the given format
        getNumber: function(format) {
            if (window.intlTelInputUtils) {
                return intlTelInputUtils.formatNumber(this._getFullNumber(), this.selectedCountryData.iso2, format);
            }
            return "";
        },
        // get the type of the entered number e.g. landline/mobile
        getNumberType: function() {
            if (window.intlTelInputUtils) {
                return intlTelInputUtils.getNumberType(this._getFullNumber(), this.selectedCountryData.iso2);
            }
            return -99;
        },
        // get the country data for the currently selected flag
        getSelectedCountryData: function() {
            return this.selectedCountryData;
        },
        // get the validation error
        getValidationError: function() {
            if (window.intlTelInputUtils) {
                return intlTelInputUtils.getValidationError(this._getFullNumber(), this.selectedCountryData.iso2);
            }
            return -99;
        },
        // validate the input val - assumes the global function isValidNumber (from utilsScript)
        isValidNumber: function() {
            var val = $.trim(this._getFullNumber()), countryCode = this.options.nationalMode ? this.selectedCountryData.iso2 : "";
            return window.intlTelInputUtils ? intlTelInputUtils.isValidNumber(val, countryCode) : null;
        },
        // update the selected flag, and update the input val accordingly
        setCountry: function(countryCode) {
            countryCode = countryCode.toLowerCase();
            // check if already selected
            if (!this.selectedFlagInner.hasClass(countryCode)) {
                this._setFlag(countryCode);
                this._updateDialCode(this.selectedCountryData.dialCode, false);
                this._triggerCountryChange();
            }
        },
        // set the input value and update the flag
        setNumber: function(number) {
            // we must update the flag first, which updates this.selectedCountryData, which is used for formatting the number before displaying it
            var flagChanged = this._updateFlagFromNumber(number);
            this._updateValFromNumber(number);
            if (flagChanged) {
                this._triggerCountryChange();
            }
        },
        // set the placeholder number typ
        setPlaceholderNumberType: function(type) {
            this.options.placeholderNumberType = type;
            this._updatePlaceholder();
        }
    };
    // using https://github.com/jquery-boilerplate/jquery-boilerplate/wiki/Extending-jQuery-Boilerplate
    // (adapted to allow public functions)
    $.fn[pluginName] = function(options) {
        var args = arguments;
        // Is the first parameter an object (options), or was omitted,
        // instantiate a new instance of the plugin.
        if (options === undefined || typeof options === "object") {
            // collect all of the deferred objects for all instances created with this selector
            var deferreds = [];
            this.each(function() {
                if (!$.data(this, "plugin_" + pluginName)) {
                    var instance = new Plugin(this, options);
                    var instanceDeferreds = instance._init();
                    // we now have 2 deffereds: 1 for auto country, 1 for utils script
                    deferreds.push(instanceDeferreds[0]);
                    deferreds.push(instanceDeferreds[1]);
                    $.data(this, "plugin_" + pluginName, instance);
                }
            });
            // return the promise from the "master" deferred object that tracks all the others
            return $.when.apply(null, deferreds);
        } else if (typeof options === "string" && options[0] !== "_") {
            // If the first parameter is a string and it doesn't start
            // with an underscore or "contains" the `init`-function,
            // treat this as a call to a public method.
            // Cache the method call to make it possible to return a value
            var returns;
            this.each(function() {
                var instance = $.data(this, "plugin_" + pluginName);
                // Tests that there's already a plugin-instance
                // and checks that the requested public method exists
                if (instance instanceof Plugin && typeof instance[options] === "function") {
                    // Call the method of our plugin instance,
                    // and pass it the supplied arguments.
                    returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }
                // Allow instances to be destroyed via the 'destroy' method
                if (options === "destroy") {
                    $.data(this, "plugin_" + pluginName, null);
                }
            });
            // If the earlier cached method gives a value back return the value,
            // otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    };
    /********************
     *  STATIC METHODS
     ********************/
    // get the country data object
    $.fn[pluginName].getCountryData = function() {
        return allCountries;
    };
    // load the utils script
    // (assumes it has not already loaded - we check this before calling this internally)
    // (also assumes that if it is called manually, it will only be once per page)
    $.fn[pluginName].loadUtils = function(path) {
        // 2 options:
        // 1) not already started loading (start)
        // 2) already started loading (do nothing - just wait for loading callback to fire, which will trigger handleUtils on all instances, resolving each of their utilsScriptDeferred objects)
        if (!$.fn[pluginName].startedLoadingUtilsScript) {
            // don't do this twice!
            $.fn[pluginName].startedLoadingUtilsScript = true;
            // dont use $.getScript as it prevents caching
            // return the ajax Deferred object, so manual calls can be chained with .then(callback)
            return $.ajax({
                type: "GET",
                url: path,
                complete: function() {
                    // tell all instances that the utils request is complete
                    $(".intl-tel-input input").intlTelInput("handleUtils");
                },
                dataType: "script",
                cache: true
            });
        }
        return null;
    };
    // default options
    $.fn[pluginName].defaults = defaults;
    // version
    $.fn[pluginName].version = "13.0.0";
    // Array of country objects for the flag dropdown.
    // Here is the criteria for the plugin to support a given country/territory
    // - It has an iso2 code: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
    // - It has it's own country calling code (it is not a sub-region of another country): https://en.wikipedia.org/wiki/List_of_country_calling_codes
    // - It has a flag in the region-flags project: https://github.com/behdad/region-flags/tree/gh-pages/png
    // - It is supported by libphonenumber (it must be listed on this page): https://github.com/googlei18n/libphonenumber/blob/master/resources/ShortNumberMetadata.xml
    // Each country array has the following information:
    // [
    //    Country name,
    //    iso2 code,
    //    International dial code,
    //    Order (if >1 country with same dial code),
    //    Area codes
    // ]
    var allCountries = [ [ "Afghanistan (‫افغانستان‬‎)", "af", "93" ], [ "Albania (Shqipëri)", "al", "355" ], [ "Algeria (‫الجزائر‬‎)", "dz", "213" ], [ "American Samoa", "as", "1684" ], [ "Andorra", "ad", "376" ], [ "Angola", "ao", "244" ], [ "Anguilla", "ai", "1264" ], [ "Antigua and Barbuda", "ag", "1268" ], [ "Argentina", "ar", "54" ], [ "Armenia (Հայաստան)", "am", "374" ], [ "Aruba", "aw", "297" ], [ "Australia", "au", "61", 0 ], [ "Austria (Österreich)", "at", "43" ], [ "Azerbaijan (Azərbaycan)", "az", "994" ], [ "Bahamas", "bs", "1242" ], [ "Bahrain (‫البحرين‬‎)", "bh", "973" ], [ "Bangladesh (বাংলাদেশ)", "bd", "880" ], [ "Barbados", "bb", "1246" ], [ "Belarus (Беларусь)", "by", "375" ], [ "Belgium (België)", "be", "32" ], [ "Belize", "bz", "501" ], [ "Benin (Bénin)", "bj", "229" ], [ "Bermuda", "bm", "1441" ], [ "Bhutan (འབྲུག)", "bt", "975" ], [ "Bolivia", "bo", "591" ], [ "Bosnia and Herzegovina (Босна и Херцеговина)", "ba", "387" ], [ "Botswana", "bw", "267" ], [ "Brazil (Brasil)", "br", "55" ], [ "British Indian Ocean Territory", "io", "246" ], [ "British Virgin Islands", "vg", "1284" ], [ "Brunei", "bn", "673" ], [ "Bulgaria (България)", "bg", "359" ], [ "Burkina Faso", "bf", "226" ], [ "Burundi (Uburundi)", "bi", "257" ], [ "Cambodia (កម្ពុជា)", "kh", "855" ], [ "Cameroon (Cameroun)", "cm", "237" ], [ "Canada", "ca", "1", 1, [ "204", "226", "236", "249", "250", "289", "306", "343", "365", "387", "403", "416", "418", "431", "437", "438", "450", "506", "514", "519", "548", "579", "581", "587", "604", "613", "639", "647", "672", "705", "709", "742", "778", "780", "782", "807", "819", "825", "867", "873", "902", "905" ] ], [ "Cape Verde (Kabu Verdi)", "cv", "238" ], [ "Caribbean Netherlands", "bq", "599", 1 ], [ "Cayman Islands", "ky", "1345" ], [ "Central African Republic (République centrafricaine)", "cf", "236" ], [ "Chad (Tchad)", "td", "235" ], [ "Chile", "cl", "56" ], [ "China (中国)", "cn", "86" ], [ "Christmas Island", "cx", "61", 2 ], [ "Cocos (Keeling) Islands", "cc", "61", 1 ], [ "Colombia", "co", "57" ], [ "Comoros (‫جزر القمر‬‎)", "km", "269" ], [ "Congo (DRC) (Jamhuri ya Kidemokrasia ya Kongo)", "cd", "243" ], [ "Congo (Republic) (Congo-Brazzaville)", "cg", "242" ], [ "Cook Islands", "ck", "682" ], [ "Costa Rica", "cr", "506" ], [ "Côte d’Ivoire", "ci", "225" ], [ "Croatia (Hrvatska)", "hr", "385" ], [ "Cuba", "cu", "53" ], [ "Curaçao", "cw", "599", 0 ], [ "Cyprus (Κύπρος)", "cy", "357" ], [ "Czech Republic (Česká republika)", "cz", "420" ], [ "Denmark (Danmark)", "dk", "45" ], [ "Djibouti", "dj", "253" ], [ "Dominica", "dm", "1767" ], [ "Dominican Republic (República Dominicana)", "do", "1", 2, [ "809", "829", "849" ] ], [ "Ecuador", "ec", "593" ], [ "Egypt (‫مصر‬‎)", "eg", "20" ], [ "El Salvador", "sv", "503" ], [ "Equatorial Guinea (Guinea Ecuatorial)", "gq", "240" ], [ "Eritrea", "er", "291" ], [ "Estonia (Eesti)", "ee", "372" ], [ "Ethiopia", "et", "251" ], [ "Falkland Islands (Islas Malvinas)", "fk", "500" ], [ "Faroe Islands (Føroyar)", "fo", "298" ], [ "Fiji", "fj", "679" ], [ "Finland (Suomi)", "fi", "358", 0 ], [ "France", "fr", "33" ], [ "French Guiana (Guyane française)", "gf", "594" ], [ "French Polynesia (Polynésie française)", "pf", "689" ], [ "Gabon", "ga", "241" ], [ "Gambia", "gm", "220" ], [ "Georgia (საქართველო)", "ge", "995" ], [ "Germany (Deutschland)", "de", "49" ], [ "Ghana (Gaana)", "gh", "233" ], [ "Gibraltar", "gi", "350" ], [ "Greece (Ελλάδα)", "gr", "30" ], [ "Greenland (Kalaallit Nunaat)", "gl", "299" ], [ "Grenada", "gd", "1473" ], [ "Guadeloupe", "gp", "590", 0 ], [ "Guam", "gu", "1671" ], [ "Guatemala", "gt", "502" ], [ "Guernsey", "gg", "44", 1 ], [ "Guinea (Guinée)", "gn", "224" ], [ "Guinea-Bissau (Guiné Bissau)", "gw", "245" ], [ "Guyana", "gy", "592" ], [ "Haiti", "ht", "509" ], [ "Honduras", "hn", "504" ], [ "Hong Kong (香港)", "hk", "852" ], [ "Hungary (Magyarország)", "hu", "36" ], [ "Iceland (Ísland)", "is", "354" ], [ "India (भारत)", "in", "91" ], [ "Indonesia", "id", "62" ], [ "Iran (‫ایران‬‎)", "ir", "98" ], [ "Iraq (‫العراق‬‎)", "iq", "964" ], [ "Ireland", "ie", "353" ], [ "Isle of Man", "im", "44", 2 ], [ "Israel (‫ישראל‬‎)", "il", "972" ], [ "Italy (Italia)", "it", "39", 0 ], [ "Jamaica", "jm", "1", 4, [ "876", "658" ] ], [ "Japan (日本)", "jp", "81" ], [ "Jersey", "je", "44", 3 ], [ "Jordan (‫الأردن‬‎)", "jo", "962" ], [ "Kazakhstan (Казахстан)", "kz", "7", 1 ], [ "Kenya", "ke", "254" ], [ "Kiribati", "ki", "686" ], [ "Kosovo", "xk", "383" ], [ "Kuwait (‫الكويت‬‎)", "kw", "965" ], [ "Kyrgyzstan (Кыргызстан)", "kg", "996" ], [ "Laos (ລາວ)", "la", "856" ], [ "Latvia (Latvija)", "lv", "371" ], [ "Lebanon (‫لبنان‬‎)", "lb", "961" ], [ "Lesotho", "ls", "266" ], [ "Liberia", "lr", "231" ], [ "Libya (‫ليبيا‬‎)", "ly", "218" ], [ "Liechtenstein", "li", "423" ], [ "Lithuania (Lietuva)", "lt", "370" ], [ "Luxembourg", "lu", "352" ], [ "Macau (澳門)", "mo", "853" ], [ "Macedonia (FYROM) (Македонија)", "mk", "389" ], [ "Madagascar (Madagasikara)", "mg", "261" ], [ "Malawi", "mw", "265" ], [ "Malaysia", "my", "60" ], [ "Maldives", "mv", "960" ], [ "Mali", "ml", "223" ], [ "Malta", "mt", "356" ], [ "Marshall Islands", "mh", "692" ], [ "Martinique", "mq", "596" ], [ "Mauritania (‫موريتانيا‬‎)", "mr", "222" ], [ "Mauritius (Moris)", "mu", "230" ], [ "Mayotte", "yt", "262", 1 ], [ "Mexico (México)", "mx", "52" ], [ "Micronesia", "fm", "691" ], [ "Moldova (Republica Moldova)", "md", "373" ], [ "Monaco", "mc", "377" ], [ "Mongolia (Монгол)", "mn", "976" ], [ "Montenegro (Crna Gora)", "me", "382" ], [ "Montserrat", "ms", "1664" ], [ "Morocco (‫المغرب‬‎)", "ma", "212", 0 ], [ "Mozambique (Moçambique)", "mz", "258" ], [ "Myanmar (Burma) (မြန်မာ)", "mm", "95" ], [ "Namibia (Namibië)", "na", "264" ], [ "Nauru", "nr", "674" ], [ "Nepal (नेपाल)", "np", "977" ], [ "Netherlands (Nederland)", "nl", "31" ], [ "New Caledonia (Nouvelle-Calédonie)", "nc", "687" ], [ "New Zealand", "nz", "64" ], [ "Nicaragua", "ni", "505" ], [ "Niger (Nijar)", "ne", "227" ], [ "Nigeria", "ng", "234" ], [ "Niue", "nu", "683" ], [ "Norfolk Island", "nf", "672" ], [ "North Korea (조선 민주주의 인민 공화국)", "kp", "850" ], [ "Northern Mariana Islands", "mp", "1670" ], [ "Norway (Norge)", "no", "47", 0 ], [ "Oman (‫عُمان‬‎)", "om", "968" ], [ "Pakistan (‫پاکستان‬‎)", "pk", "92" ], [ "Palau", "pw", "680" ], [ "Palestine (‫فلسطين‬‎)", "ps", "970" ], [ "Panama (Panamá)", "pa", "507" ], [ "Papua New Guinea", "pg", "675" ], [ "Paraguay", "py", "595" ], [ "Peru (Perú)", "pe", "51" ], [ "Philippines", "ph", "63" ], [ "Poland (Polska)", "pl", "48" ], [ "Portugal", "pt", "351" ], [ "Puerto Rico", "pr", "1", 3, [ "787", "939" ] ], [ "Qatar (‫قطر‬‎)", "qa", "974" ], [ "Réunion (La Réunion)", "re", "262", 0 ], [ "Romania (România)", "ro", "40" ], [ "Russia (Россия)", "ru", "7", 0 ], [ "Rwanda", "rw", "250" ], [ "Saint Barthélemy", "bl", "590", 1 ], [ "Saint Helena", "sh", "290" ], [ "Saint Kitts and Nevis", "kn", "1869" ], [ "Saint Lucia", "lc", "1758" ], [ "Saint Martin (Saint-Martin (partie française))", "mf", "590", 2 ], [ "Saint Pierre and Miquelon (Saint-Pierre-et-Miquelon)", "pm", "508" ], [ "Saint Vincent and the Grenadines", "vc", "1784" ], [ "Samoa", "ws", "685" ], [ "San Marino", "sm", "378" ], [ "São Tomé and Príncipe (São Tomé e Príncipe)", "st", "239" ], [ "Saudi Arabia (‫المملكة العربية السعودية‬‎)", "sa", "966" ], [ "Senegal (Sénégal)", "sn", "221" ], [ "Serbia (Србија)", "rs", "381" ], [ "Seychelles", "sc", "248" ], [ "Sierra Leone", "sl", "232" ], [ "Singapore", "sg", "65" ], [ "Sint Maarten", "sx", "1721" ], [ "Slovakia (Slovensko)", "sk", "421" ], [ "Slovenia (Slovenija)", "si", "386" ], [ "Solomon Islands", "sb", "677" ], [ "Somalia (Soomaaliya)", "so", "252" ], [ "South Africa", "za", "27" ], [ "South Korea (대한민국)", "kr", "82" ], [ "South Sudan (‫جنوب السودان‬‎)", "ss", "211" ], [ "Spain (España)", "es", "34" ], [ "Sri Lanka (ශ්‍රී ලංකාව)", "lk", "94" ], [ "Sudan (‫السودان‬‎)", "sd", "249" ], [ "Suriname", "sr", "597" ], [ "Svalbard and Jan Mayen", "sj", "47", 1 ], [ "Swaziland", "sz", "268" ], [ "Sweden (Sverige)", "se", "46" ], [ "Switzerland (Schweiz)", "ch", "41" ], [ "Syria (‫سوريا‬‎)", "sy", "963" ], [ "Taiwan (台灣)", "tw", "886" ], [ "Tajikistan", "tj", "992" ], [ "Tanzania", "tz", "255" ], [ "Thailand (ไทย)", "th", "66" ], [ "Timor-Leste", "tl", "670" ], [ "Togo", "tg", "228" ], [ "Tokelau", "tk", "690" ], [ "Tonga", "to", "676" ], [ "Trinidad and Tobago", "tt", "1868" ], [ "Tunisia (‫تونس‬‎)", "tn", "216" ], [ "Turkey (Türkiye)", "tr", "90" ], [ "Turkmenistan", "tm", "993" ], [ "Turks and Caicos Islands", "tc", "1649" ], [ "Tuvalu", "tv", "688" ], [ "U.S. Virgin Islands", "vi", "1340" ], [ "Uganda", "ug", "256" ], [ "Ukraine (Україна)", "ua", "380" ], [ "United Arab Emirates (‫الإمارات العربية المتحدة‬‎)", "ae", "971" ], [ "United Kingdom", "gb", "44", 0 ], [ "United States", "us", "1", 0 ], [ "Uruguay", "uy", "598" ], [ "Uzbekistan (Oʻzbekiston)", "uz", "998" ], [ "Vanuatu", "vu", "678" ], [ "Vatican City (Città del Vaticano)", "va", "39", 1 ], [ "Venezuela", "ve", "58" ], [ "Vietnam (Việt Nam)", "vn", "84" ], [ "Wallis and Futuna (Wallis-et-Futuna)", "wf", "681" ], [ "Western Sahara (‫الصحراء الغربية‬‎)", "eh", "212", 1 ], [ "Yemen (‫اليمن‬‎)", "ye", "967" ], [ "Zambia", "zm", "260" ], [ "Zimbabwe", "zw", "263" ], [ "Åland Islands", "ax", "358", 1 ] ];
    // loop over all of the countries above
    for (var i = 0; i < allCountries.length; i++) {
        var c = allCountries[i];
        allCountries[i] = {
            name: c[0],
            iso2: c[1],
            dialCode: c[2],
            priority: c[3] || 0,
            areaCodes: c[4] || null
        };
    }
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJpbnRsVGVsSW5wdXQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEludGVybmF0aW9uYWwgVGVsZXBob25lIElucHV0IHYxMy4wLjBcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9qYWNrb2Nuci9pbnRsLXRlbC1pbnB1dC5naXRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG5cbi8vIHdyYXAgaW4gVU1EIC0gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvanF1ZXJ5UGx1Z2luQ29tbW9uanMuanNcbihmdW5jdGlvbihmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbIFwianF1ZXJ5XCIgXSwgZnVuY3Rpb24oJCkge1xuICAgICAgICAgICAgZmFjdG9yeSgkLCB3aW5kb3csIGRvY3VtZW50KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKFwianF1ZXJ5XCIpLCB3aW5kb3csIGRvY3VtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KGpRdWVyeSwgd2luZG93LCBkb2N1bWVudCk7XG4gICAgfVxufSkoZnVuY3Rpb24oJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgLy8gdGhlc2UgdmFycyBwZXJzaXN0IHRocm91Z2ggYWxsIGluc3RhbmNlcyBvZiB0aGUgcGx1Z2luXG4gICAgdmFyIHBsdWdpbk5hbWUgPSBcImludGxUZWxJbnB1dFwiLCBpZCA9IDEsIC8vIGdpdmUgZWFjaCBpbnN0YW5jZSBpdCdzIG93biBpZCBmb3IgbmFtZXNwYWNlZCBldmVudCBoYW5kbGluZ1xuICAgICAgICBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIC8vIHdoZXRoZXIgb3Igbm90IHRvIGFsbG93IHRoZSBkcm9wZG93blxuICAgICAgICAgICAgYWxsb3dEcm9wZG93bjogdHJ1ZSxcbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIGp1c3QgYSBkaWFsIGNvZGUgaW4gdGhlIGlucHV0OiByZW1vdmUgaXQgb24gYmx1ciwgYW5kIHJlLWFkZCBpdCBvbiBmb2N1c1xuICAgICAgICAgICAgYXV0b0hpZGVEaWFsQ29kZTogdHJ1ZSxcbiAgICAgICAgICAgIC8vIGFkZCBhIHBsYWNlaG9sZGVyIGluIHRoZSBpbnB1dCB3aXRoIGFuIGV4YW1wbGUgbnVtYmVyIGZvciB0aGUgc2VsZWN0ZWQgY291bnRyeVxuICAgICAgICAgICAgYXV0b1BsYWNlaG9sZGVyOiBcInBvbGl0ZVwiLFxuICAgICAgICAgICAgLy8gbW9kaWZ5IHRoZSBhdXRvIHBsYWNlaG9sZGVyXG4gICAgICAgICAgICBjdXN0b21QbGFjZWhvbGRlcjogbnVsbCxcbiAgICAgICAgICAgIC8vIGFwcGVuZCBtZW51IHRvIGEgc3BlY2lmaWMgZWxlbWVudFxuICAgICAgICAgICAgZHJvcGRvd25Db250YWluZXI6IFwiXCIsXG4gICAgICAgICAgICAvLyBkb24ndCBkaXNwbGF5IHRoZXNlIGNvdW50cmllc1xuICAgICAgICAgICAgZXhjbHVkZUNvdW50cmllczogW10sXG4gICAgICAgICAgICAvLyBmb3JtYXQgdGhlIGlucHV0IHZhbHVlIGR1cmluZyBpbml0aWFsaXNhdGlvbiBhbmQgb24gc2V0TnVtYmVyXG4gICAgICAgICAgICBmb3JtYXRPbkRpc3BsYXk6IHRydWUsXG4gICAgICAgICAgICAvLyBnZW9JcCBsb29rdXAgZnVuY3Rpb25cbiAgICAgICAgICAgIGdlb0lwTG9va3VwOiBudWxsLFxuICAgICAgICAgICAgLy8gaW5qZWN0IGEgaGlkZGVuIGlucHV0IHdpdGggdGhpcyBuYW1lLCBhbmQgb24gc3VibWl0LCBwb3B1bGF0ZSBpdCB3aXRoIHRoZSByZXN1bHQgb2YgZ2V0TnVtYmVyXG4gICAgICAgICAgICBoaWRkZW5JbnB1dDogXCJcIixcbiAgICAgICAgICAgIC8vIGluaXRpYWwgY291bnRyeVxuICAgICAgICAgICAgaW5pdGlhbENvdW50cnk6IFwiXCIsXG4gICAgICAgICAgICAvLyBsb2NhbGl6ZWQgY291bnRyeSBuYW1lcyBlLmcuIHsgJ2RlJzogJ0RldXRzY2hsYW5kJyB9XG4gICAgICAgICAgICBsb2NhbGl6ZWRDb3VudHJpZXM6IG51bGwsXG4gICAgICAgICAgICAvLyBkb24ndCBpbnNlcnQgaW50ZXJuYXRpb25hbCBkaWFsIGNvZGVzXG4gICAgICAgICAgICBuYXRpb25hbE1vZGU6IHRydWUsXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9ubHkgdGhlc2UgY291bnRyaWVzXG4gICAgICAgICAgICBvbmx5Q291bnRyaWVzOiBbXSxcbiAgICAgICAgICAgIC8vIG51bWJlciB0eXBlIHRvIHVzZSBmb3IgcGxhY2Vob2xkZXJzXG4gICAgICAgICAgICBwbGFjZWhvbGRlck51bWJlclR5cGU6IFwiTU9CSUxFXCIsXG4gICAgICAgICAgICAvLyB0aGUgY291bnRyaWVzIGF0IHRoZSB0b3Agb2YgdGhlIGxpc3QuIGRlZmF1bHRzIHRvIHVuaXRlZCBzdGF0ZXMgYW5kIHVuaXRlZCBraW5nZG9tXG4gICAgICAgICAgICBwcmVmZXJyZWRDb3VudHJpZXM6IFsgXCJ1c1wiLCBcImdiXCIgXSxcbiAgICAgICAgICAgIC8vIGRpc3BsYXkgdGhlIGNvdW50cnkgZGlhbCBjb2RlIG5leHQgdG8gdGhlIHNlbGVjdGVkIGZsYWcgc28gaXQncyBub3QgcGFydCBvZiB0aGUgdHlwZWQgbnVtYmVyXG4gICAgICAgICAgICBzZXBhcmF0ZURpYWxDb2RlOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIHNwZWNpZnkgdGhlIHBhdGggdG8gdGhlIGxpYnBob25lbnVtYmVyIHNjcmlwdCB0byBlbmFibGUgdmFsaWRhdGlvbi9mb3JtYXR0aW5nXG4gICAgICAgICAgICB1dGlsc1NjcmlwdDogXCJcIlxuICAgICAgICB9LCBrZXlzID0ge1xuICAgICAgICAgICAgVVA6IDM4LFxuICAgICAgICAgICAgRE9XTjogNDAsXG4gICAgICAgICAgICBFTlRFUjogMTMsXG4gICAgICAgICAgICBFU0M6IDI3LFxuICAgICAgICAgICAgUExVUzogNDMsXG4gICAgICAgICAgICBBOiA2NSxcbiAgICAgICAgICAgIFo6IDkwLFxuICAgICAgICAgICAgU1BBQ0U6IDMyLFxuICAgICAgICAgICAgVEFCOiA5XG4gICAgICAgIH0sIC8vIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xpc3Rfb2ZfTm9ydGhfQW1lcmljYW5fTnVtYmVyaW5nX1BsYW5fYXJlYV9jb2RlcyNOb24tZ2VvZ3JhcGhpY19hcmVhX2NvZGVzXG4gICAgICAgIHJlZ2lvbmxlc3NOYW5wTnVtYmVycyA9IFsgXCI4MDBcIiwgXCI4MjJcIiwgXCI4MzNcIiwgXCI4NDRcIiwgXCI4NTVcIiwgXCI4NjZcIiwgXCI4NzdcIiwgXCI4ODBcIiwgXCI4ODFcIiwgXCI4ODJcIiwgXCI4ODNcIiwgXCI4ODRcIiwgXCI4ODVcIiwgXCI4ODZcIiwgXCI4ODdcIiwgXCI4ODhcIiwgXCI4ODlcIiBdO1xuICAgIC8vIGtlZXAgdHJhY2sgb2YgaWYgdGhlIHdpbmRvdy5sb2FkIGV2ZW50IGhhcyBmaXJlZCBhcyBpbXBvc3NpYmxlIHRvIGNoZWNrIGFmdGVyIHRoZSBmYWN0XG4gICAgJCh3aW5kb3cpLm9uKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVVBEQVRFOiB1c2UgYSBwdWJsaWMgc3RhdGljIGZpZWxkIHNvIHdlIGNhbiBmdWRnZSBpdCBpbiB0aGUgdGVzdHNcbiAgICAgICAgJC5mbltwbHVnaW5OYW1lXS53aW5kb3dMb2FkZWQgPSB0cnVlO1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIFBsdWdpbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMudGVsSW5wdXQgPSAkKGVsZW1lbnQpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgICAgICAvLyBldmVudCBuYW1lc3BhY2VcbiAgICAgICAgdGhpcy5ucyA9IFwiLlwiICsgcGx1Z2luTmFtZSArIGlkKys7XG4gICAgICAgIC8vIENocm9tZSwgRkYsIFNhZmFyaSwgSUU5K1xuICAgICAgICB0aGlzLmlzR29vZEJyb3dzZXIgPSBCb29sZWFuKGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UpO1xuICAgICAgICB0aGlzLmhhZEluaXRpYWxQbGFjZWhvbGRlciA9IEJvb2xlYW4oJChlbGVtZW50KS5hdHRyKFwicGxhY2Vob2xkZXJcIikpO1xuICAgIH1cbiAgICBQbHVnaW4ucHJvdG90eXBlID0ge1xuICAgICAgICBfaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBpZiBpbiBuYXRpb25hbE1vZGUsIGRpc2FibGUgb3B0aW9ucyByZWxhdGluZyB0byBkaWFsIGNvZGVzXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLm5hdGlvbmFsTW9kZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hdXRvSGlkZURpYWxDb2RlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiBzZXBhcmF0ZURpYWxDb2RlIHRoZW4gZG9lc24ndCBtYWtlIHNlbnNlIHRvIEEpIGluc2VydCBkaWFsIGNvZGUgaW50byBpbnB1dCAoYXV0b0hpZGVEaWFsQ29kZSksIGFuZCBCKSBkaXNwbGF5IG5hdGlvbmFsIG51bWJlcnMgKGJlY2F1c2Ugd2UncmUgZGlzcGxheWluZyB0aGUgY291bnRyeSBkaWFsIGNvZGUgbmV4dCB0byB0aGVtKVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmF1dG9IaWRlRGlhbENvZGUgPSB0aGlzLm9wdGlvbnMubmF0aW9uYWxNb2RlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB3ZSBjYW5ub3QganVzdCB0ZXN0IHNjcmVlbiBzaXplIGFzIHNvbWUgc21hcnRwaG9uZXMvd2Vic2l0ZSBtZXRhIHRhZ3Mgd2lsbCByZXBvcnQgZGVza3RvcCByZXNvbHV0aW9uc1xuICAgICAgICAgICAgLy8gTm90ZTogZm9yIHNvbWUgcmVhc29uIGphc21pbmUgYnJlYWtzIGlmIHlvdSBwdXQgdGhpcyBpbiB0aGUgbWFpbiBQbHVnaW4gZnVuY3Rpb24gd2l0aCB0aGUgcmVzdCBvZiB0aGVzZSBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgIC8vIE5vdGU6IHRvIHRhcmdldCBBbmRyb2lkIE1vYmlsZXMgKGFuZCBub3QgVGFibGV0cyksIHdlIG11c3QgZmluZCBcIkFuZHJvaWRcIiBhbmQgXCJNb2JpbGVcIlxuICAgICAgICAgICAgdGhpcy5pc01vYmlsZSA9IC9BbmRyb2lkLitNb2JpbGV8d2ViT1N8aVBob25lfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTW9iaWxlKSB7XG4gICAgICAgICAgICAgICAgLy8gdHJpZ2dlciB0aGUgbW9iaWxlIGRyb3Bkb3duIGNzc1xuICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLmFkZENsYXNzKFwiaXRpLW1vYmlsZVwiKTtcbiAgICAgICAgICAgICAgICAvLyBvbiBtb2JpbGUsIHdlIHdhbnQgYSBmdWxsIHNjcmVlbiBkcm9wZG93biwgc28gd2UgbXVzdCBhcHBlbmQgaXQgdG8gdGhlIGJvZHlcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5kcm9wZG93bkNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcGRvd25Db250YWluZXIgPSBcImJvZHlcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB3ZSByZXR1cm4gdGhlc2UgZGVmZXJyZWQgb2JqZWN0cyBmcm9tIHRoZSBfaW5pdCgpIGNhbGwgc28gdGhleSBjYW4gYmUgd2F0Y2hlZCwgYW5kIHRoZW4gd2UgcmVzb2x2ZSB0aGVtIHdoZW4gZWFjaCBzcGVjaWZpYyByZXF1ZXN0IHJldHVybnNcbiAgICAgICAgICAgIC8vIE5vdGU6IGFnYWluLCBqYXNtaW5lIGJyZWFrcyB3aGVuIEkgcHV0IHRoZXNlIGluIHRoZSBQbHVnaW4gZnVuY3Rpb25cbiAgICAgICAgICAgIHRoaXMuYXV0b0NvdW50cnlEZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB0aGlzLnV0aWxzU2NyaXB0RGVmZXJyZWQgPSBuZXcgJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgLy8gaW4gdmFyaW91cyBzaXR1YXRpb25zIHRoZXJlIGNvdWxkIGJlIG5vIGNvdW50cnkgc2VsZWN0ZWQgaW5pdGlhbGx5LCBidXQgd2UgbmVlZCB0byBiZSBhYmxlIHRvIGFzc3VtZSB0aGlzIHZhcmlhYmxlIGV4aXN0c1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhID0ge307XG4gICAgICAgICAgICAvLyBwcm9jZXNzIGFsbCB0aGUgZGF0YTogb25seUNvdW50cmllcywgZXhjbHVkZUNvdW50cmllcywgcHJlZmVycmVkQ291bnRyaWVzIGV0Y1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc0NvdW50cnlEYXRhKCk7XG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSB0aGUgbWFya3VwXG4gICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZU1hcmt1cCgpO1xuICAgICAgICAgICAgLy8gc2V0IHRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSBpbnB1dCB2YWx1ZSBhbmQgdGhlIHNlbGVjdGVkIGZsYWdcbiAgICAgICAgICAgIHRoaXMuX3NldEluaXRpYWxTdGF0ZSgpO1xuICAgICAgICAgICAgLy8gc3RhcnQgYWxsIG9mIHRoZSBldmVudCBsaXN0ZW5lcnM6IGF1dG9IaWRlRGlhbENvZGUsIGlucHV0IGtleWRvd24sIHNlbGVjdGVkRmxhZyBjbGlja1xuICAgICAgICAgICAgdGhpcy5faW5pdExpc3RlbmVycygpO1xuICAgICAgICAgICAgLy8gdXRpbHMgc2NyaXB0LCBhbmQgYXV0byBjb3VudHJ5XG4gICAgICAgICAgICB0aGlzLl9pbml0UmVxdWVzdHMoKTtcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgZGVmZXJyZWRzXG4gICAgICAgICAgICByZXR1cm4gWyB0aGlzLmF1dG9Db3VudHJ5RGVmZXJyZWQsIHRoaXMudXRpbHNTY3JpcHREZWZlcnJlZCBdO1xuICAgICAgICB9LFxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICogIFBSSVZBVEUgTUVUSE9EU1xuICAgICAgICAgKioqKioqKioqKioqKioqKioqKiovXG4gICAgICAgIC8vIHByZXBhcmUgYWxsIG9mIHRoZSBjb3VudHJ5IGRhdGEsIGluY2x1ZGluZyBvbmx5Q291bnRyaWVzLCBleGNsdWRlQ291bnRyaWVzIGFuZCBwcmVmZXJyZWRDb3VudHJpZXMgb3B0aW9uc1xuICAgICAgICBfcHJvY2Vzc0NvdW50cnlEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIHByb2Nlc3Mgb25seUNvdW50cmllcyBvciBleGNsdWRlQ291bnRyaWVzIGFycmF5IGlmIHByZXNlbnRcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NBbGxDb3VudHJpZXMoKTtcbiAgICAgICAgICAgIC8vIHByb2Nlc3MgdGhlIGNvdW50cnlDb2RlcyBtYXBcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NDb3VudHJ5Q29kZXMoKTtcbiAgICAgICAgICAgIC8vIHByb2Nlc3MgdGhlIHByZWZlcnJlZENvdW50cmllc1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1ByZWZlcnJlZENvdW50cmllcygpO1xuICAgICAgICAgICAgLy8gdHJhbnNsYXRlIGNvdW50cmllcyBhY2NvcmRpbmcgdG8gbG9jYWxpemVkQ291bnRyaWVzIG9wdGlvblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhbGl6ZWRDb3VudHJpZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90cmFuc2xhdGVDb3VudHJpZXNCeUxvY2FsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc29ydCBjb3VudHJpZXMgYnkgbmFtZVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5vbmx5Q291bnRyaWVzLmxlbmd0aCB8fCB0aGlzLm9wdGlvbnMubG9jYWxpemVkQ291bnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudHJpZXMuc29ydCh0aGlzLl9jb3VudHJ5TmFtZVNvcnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBhZGQgYSBjb3VudHJ5IGNvZGUgdG8gdGhpcy5jb3VudHJ5Q29kZXNcbiAgICAgICAgX2FkZENvdW50cnlDb2RlOiBmdW5jdGlvbihpc28yLCBkaWFsQ29kZSwgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIGlmICghKGRpYWxDb2RlIGluIHRoaXMuY291bnRyeUNvZGVzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnRyeUNvZGVzW2RpYWxDb2RlXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGluZGV4ID0gcHJpb3JpdHkgfHwgMDtcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUNvZGVzW2RpYWxDb2RlXVtpbmRleF0gPSBpc28yO1xuICAgICAgICB9LFxuICAgICAgICAvLyBwcm9jZXNzIG9ubHlDb3VudHJpZXMgb3IgZXhjbHVkZUNvdW50cmllcyBhcnJheSBpZiBwcmVzZW50XG4gICAgICAgIF9wcm9jZXNzQWxsQ291bnRyaWVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMub25seUNvdW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG93ZXJDYXNlT25seUNvdW50cmllcyA9IHRoaXMub3B0aW9ucy5vbmx5Q291bnRyaWVzLm1hcChmdW5jdGlvbihjb3VudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb3VudHJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudHJpZXMgPSBhbGxDb3VudHJpZXMuZmlsdGVyKGZ1bmN0aW9uKGNvdW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvd2VyQ2FzZU9ubHlDb3VudHJpZXMuaW5kZXhPZihjb3VudHJ5LmlzbzIpID4gLTE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5leGNsdWRlQ291bnRyaWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBsb3dlckNhc2VFeGNsdWRlQ291bnRyaWVzID0gdGhpcy5vcHRpb25zLmV4Y2x1ZGVDb3VudHJpZXMubWFwKGZ1bmN0aW9uKGNvdW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvdW50cnkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50cmllcyA9IGFsbENvdW50cmllcy5maWx0ZXIoZnVuY3Rpb24oY291bnRyeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbG93ZXJDYXNlRXhjbHVkZUNvdW50cmllcy5pbmRleE9mKGNvdW50cnkuaXNvMikgPT09IC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50cmllcyA9IGFsbENvdW50cmllcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gVHJhbnNsYXRlIENvdW50cmllcyBieSBvYmplY3QgbGl0ZXJhbCBwcm92aWRlZCBvbiBjb25maWdcbiAgICAgICAgX3RyYW5zbGF0ZUNvdW50cmllc0J5TG9jYWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNvID0gdGhpcy5jb3VudHJpZXNbaV0uaXNvMi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmIChpc28gaW4gdGhpcy5vcHRpb25zLmxvY2FsaXplZENvdW50cmllcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvdW50cmllc1tpXS5uYW1lID0gdGhpcy5vcHRpb25zLmxvY2FsaXplZENvdW50cmllc1tpc29dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gc29ydCBieSBjb3VudHJ5IG5hbWVcbiAgICAgICAgX2NvdW50cnlOYW1lU29ydDogZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHByb2Nlc3MgdGhlIGNvdW50cnlDb2RlcyBtYXBcbiAgICAgICAgX3Byb2Nlc3NDb3VudHJ5Q29kZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudHJ5Q29kZXMgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYyA9IHRoaXMuY291bnRyaWVzW2ldO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZENvdW50cnlDb2RlKGMuaXNvMiwgYy5kaWFsQ29kZSwgYy5wcmlvcml0eSk7XG4gICAgICAgICAgICAgICAgLy8gYXJlYSBjb2Rlc1xuICAgICAgICAgICAgICAgIGlmIChjLmFyZWFDb2Rlcykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGMuYXJlYUNvZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmdWxsIGRpYWwgY29kZSBpcyBjb3VudHJ5IGNvZGUgKyBkaWFsIGNvZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FkZENvdW50cnlDb2RlKGMuaXNvMiwgYy5kaWFsQ29kZSArIGMuYXJlYUNvZGVzW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gcHJvY2VzcyBwcmVmZXJyZWQgY291bnRyaWVzIC0gaXRlcmF0ZSB0aHJvdWdoIHRoZSBwcmVmZXJlbmNlcywgZmV0Y2hpbmcgdGhlIGNvdW50cnkgZGF0YSBmb3IgZWFjaCBvbmVcbiAgICAgICAgX3Byb2Nlc3NQcmVmZXJyZWRDb3VudHJpZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5wcmVmZXJyZWRDb3VudHJpZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLnByZWZlcnJlZENvdW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb3VudHJ5Q29kZSA9IHRoaXMub3B0aW9ucy5wcmVmZXJyZWRDb3VudHJpZXNbaV0udG9Mb3dlckNhc2UoKSwgY291bnRyeURhdGEgPSB0aGlzLl9nZXRDb3VudHJ5RGF0YShjb3VudHJ5Q29kZSwgZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgIGlmIChjb3VudHJ5RGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZWZlcnJlZENvdW50cmllcy5wdXNoKGNvdW50cnlEYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGdlbmVyYXRlIGFsbCBvZiB0aGUgbWFya3VwIGZvciB0aGUgcGx1Z2luOiB0aGUgc2VsZWN0ZWQgZmxhZyBvdmVybGF5LCBhbmQgdGhlIGRyb3Bkb3duXG4gICAgICAgIF9nZW5lcmF0ZU1hcmt1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBwcmV2ZW50IGF1dG9jb21wbGV0ZSBhcyB0aGVyZSdzIG5vIHNhZmUsIGNyb3NzLWJyb3dzZXIgZXZlbnQgd2UgY2FuIHJlYWN0IHRvLCBzbyBpdCBjYW4gZWFzaWx5IHB1dCB0aGUgcGx1Z2luIGluIGFuIGluY29uc2lzdGVudCBzdGF0ZSBlLmcuIHRoZSB3cm9uZyBmbGFnIHNlbGVjdGVkIGZvciB0aGUgYXV0b2NvbXBsZXRlZCBudW1iZXIsIHdoaWNoIG9uIHN1Ym1pdCBjb3VsZCBtZWFuIHRoZSB3cm9uZyBudW1iZXIgaXMgc2F2ZWQgKGVzcCBpbiBuYXRpb25hbE1vZGUpXG4gICAgICAgICAgICB0aGlzLnRlbElucHV0LmF0dHIoXCJhdXRvY29tcGxldGVcIiwgXCJvZmZcIik7XG4gICAgICAgICAgICAvLyBjb250YWluZXJzIChtb3N0bHkgZm9yIHBvc2l0aW9uaW5nKVxuICAgICAgICAgICAgdmFyIHBhcmVudENsYXNzID0gXCJpbnRsLXRlbC1pbnB1dFwiO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGxvd0Ryb3Bkb3duKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50Q2xhc3MgKz0gXCIgYWxsb3ctZHJvcGRvd25cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2VwYXJhdGVEaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgIHBhcmVudENsYXNzICs9IFwiIHNlcGFyYXRlLWRpYWwtY29kZVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC53cmFwKCQoXCI8ZGl2PlwiLCB7XG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBwYXJlbnRDbGFzc1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5mbGFnc0NvbnRhaW5lciA9ICQoXCI8ZGl2PlwiLCB7XG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImZsYWctY29udGFpbmVyXCJcbiAgICAgICAgICAgIH0pLmluc2VydEJlZm9yZSh0aGlzLnRlbElucHV0KTtcbiAgICAgICAgICAgIC8vIGN1cnJlbnRseSBzZWxlY3RlZCBmbGFnIChkaXNwbGF5ZWQgdG8gbGVmdCBvZiBpbnB1dClcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZEZsYWcgPSAkKFwiPGRpdj5cIiwge1xuICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJzZWxlY3RlZC1mbGFnXCIsXG4gICAgICAgICAgICAgICAgcm9sZTogXCJjb21ib2JveFwiLFxuICAgICAgICAgICAgICAgIFwiYXJpYS1vd25zXCI6IFwiY291bnRyeS1saXN0Ym94XCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2VsZWN0ZWRGbGFnLmFwcGVuZFRvKHRoaXMuZmxhZ3NDb250YWluZXIpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEZsYWdJbm5lciA9ICQoXCI8ZGl2PlwiLCB7XG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcIml0aS1mbGFnXCJcbiAgICAgICAgICAgIH0pLmFwcGVuZFRvKHNlbGVjdGVkRmxhZyk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNlcGFyYXRlRGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkRGlhbENvZGUgPSAkKFwiPGRpdj5cIiwge1xuICAgICAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwic2VsZWN0ZWQtZGlhbC1jb2RlXCJcbiAgICAgICAgICAgICAgICB9KS5hcHBlbmRUbyhzZWxlY3RlZEZsYWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGxvd0Ryb3Bkb3duKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSBlbGVtZW50IGZvY3VzYWJsZSBhbmQgdGFiIG5hdmlhZ2FibGVcbiAgICAgICAgICAgICAgICBzZWxlY3RlZEZsYWcuYXR0cihcInRhYmluZGV4XCIsIFwiMFwiKTtcbiAgICAgICAgICAgICAgICAvLyBDU1MgdHJpYW5nbGVcbiAgICAgICAgICAgICAgICAkKFwiPGRpdj5cIiwge1xuICAgICAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiaXRpLWFycm93XCJcbiAgICAgICAgICAgICAgICB9KS5hcHBlbmRUbyhzZWxlY3RlZEZsYWcpO1xuICAgICAgICAgICAgICAgIC8vIGNvdW50cnkgZHJvcGRvd246IHByZWZlcnJlZCBjb3VudHJpZXMsIHRoZW4gZGl2aWRlciwgdGhlbiBhbGwgY291bnRyaWVzXG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdCA9ICQoXCI8dWw+XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImNvdW50cnktbGlzdCBoaWRlXCIsXG4gICAgICAgICAgICAgICAgICAgIGlkOiBcImNvdW50cnktbGlzdGJveFwiLFxuICAgICAgICAgICAgICAgICAgICBcImFyaWEtZXhwYW5kZWRcIjogXCJmYWxzZVwiLFxuICAgICAgICAgICAgICAgICAgICByb2xlOiBcImxpc3Rib3hcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByZWZlcnJlZENvdW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kTGlzdEl0ZW1zKHRoaXMucHJlZmVycmVkQ291bnRyaWVzLCBcInByZWZlcnJlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgJChcIjxsaT5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImRpdmlkZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvbGU6IFwic2VwYXJhdG9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFyaWEtZGlzYWJsZWRcIjogXCJ0cnVlXCJcbiAgICAgICAgICAgICAgICAgICAgfSkuYXBwZW5kVG8odGhpcy5jb3VudHJ5TGlzdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZExpc3RJdGVtcyh0aGlzLmNvdW50cmllcywgXCJcIik7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB1c2VmdWwgaW4gbG90cyBvZiBwbGFjZXNcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50cnlMaXN0SXRlbXMgPSB0aGlzLmNvdW50cnlMaXN0LmNoaWxkcmVuKFwiLmNvdW50cnlcIik7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGRyb3Bkb3duQ29udGFpbmVyIG1hcmt1cFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJvcGRvd25Db250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93biA9ICQoXCI8ZGl2PlwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiaW50bC10ZWwtaW5wdXQgaXRpLWNvbnRhaW5lclwiXG4gICAgICAgICAgICAgICAgICAgIH0pLmFwcGVuZCh0aGlzLmNvdW50cnlMaXN0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvdW50cnlMaXN0LmFwcGVuZFRvKHRoaXMuZmxhZ3NDb250YWluZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYSBsaXR0bGUgaGFjayBzbyB3ZSBkb24ndCBicmVhayBhbnl0aGluZ1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3RJdGVtcyA9ICQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGlkZGVuSW5wdXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaGlkZGVuSW5wdXROYW1lID0gdGhpcy5vcHRpb25zLmhpZGRlbklucHV0O1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy50ZWxJbnB1dC5hdHRyKFwibmFtZVwiKTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IG5hbWUubGFzdEluZGV4T2YoXCJbXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBpbnB1dCBuYW1lIGNvbnRhaW5zIHNxdWFyZSBicmFja2V0cywgdGhlbiBnaXZlIHRoZSBoaWRkZW4gaW5wdXQgdGhlIHNhbWUgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjaW5nIHRoZSBjb250ZW50cyBvZiB0aGUgbGFzdCBzZXQgb2YgYnJhY2tldHMgd2l0aCB0aGUgZ2l2ZW4gaGlkZGVuSW5wdXQgbmFtZVxuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gLTEpIGhpZGRlbklucHV0TmFtZSA9IG5hbWUuc3Vic3RyKDAsIGkpICsgXCJbXCIgKyBoaWRkZW5JbnB1dE5hbWUgKyBcIl1cIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRkZW5JbnB1dCA9ICQoXCI8aW5wdXQ+XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJoaWRkZW5cIixcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogaGlkZGVuSW5wdXROYW1lXG4gICAgICAgICAgICAgICAgfSkuaW5zZXJ0QWZ0ZXIodGhpcy50ZWxJbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGFkZCBhIGNvdW50cnkgPGxpPiB0byB0aGUgY291bnRyeUxpc3QgPHVsPiBjb250YWluZXJcbiAgICAgICAgX2FwcGVuZExpc3RJdGVtczogZnVuY3Rpb24oY291bnRyaWVzLCBjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIC8vIHdlIGNyZWF0ZSBzbyBtYW55IERPTSBlbGVtZW50cywgaXQgaXMgZmFzdGVyIHRvIGJ1aWxkIGEgdGVtcCBzdHJpbmdcbiAgICAgICAgICAgIC8vIGFuZCB0aGVuIGFkZCBldmVyeXRoaW5nIHRvIHRoZSBET00gaW4gb25lIGdvIGF0IHRoZSBlbmRcbiAgICAgICAgICAgIHZhciB0bXAgPSBcIlwiO1xuICAgICAgICAgICAgLy8gZm9yIGVhY2ggY291bnRyeVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYyA9IGNvdW50cmllc1tpXTtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBsaXN0IGl0ZW1cbiAgICAgICAgICAgICAgICB0bXAgKz0gXCI8bGkgY2xhc3M9J2NvdW50cnkgXCIgKyBjbGFzc05hbWUgKyBcIicgaWQ9J2l0aS1pdGVtLVwiICsgYy5pc28yICsgXCInIHJvbGU9J29wdGlvbicgZGF0YS1kaWFsLWNvZGU9J1wiICsgYy5kaWFsQ29kZSArIFwiJyBkYXRhLWNvdW50cnktY29kZT0nXCIgKyBjLmlzbzIgKyBcIic+XCI7XG4gICAgICAgICAgICAgICAgLy8gYWRkIHRoZSBmbGFnXG4gICAgICAgICAgICAgICAgdG1wICs9IFwiPGRpdiBjbGFzcz0nZmxhZy1ib3gnPjxkaXYgY2xhc3M9J2l0aS1mbGFnIFwiICsgYy5pc28yICsgXCInPjwvZGl2PjwvZGl2PlwiO1xuICAgICAgICAgICAgICAgIC8vIGFuZCB0aGUgY291bnRyeSBuYW1lIGFuZCBkaWFsIGNvZGVcbiAgICAgICAgICAgICAgICB0bXAgKz0gXCI8c3BhbiBjbGFzcz0nY291bnRyeS1uYW1lJz5cIiArIGMubmFtZSArIFwiPC9zcGFuPlwiO1xuICAgICAgICAgICAgICAgIHRtcCArPSBcIjxzcGFuIGNsYXNzPSdkaWFsLWNvZGUnPitcIiArIGMuZGlhbENvZGUgKyBcIjwvc3Bhbj5cIjtcbiAgICAgICAgICAgICAgICAvLyBjbG9zZSB0aGUgbGlzdCBpdGVtXG4gICAgICAgICAgICAgICAgdG1wICs9IFwiPC9saT5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3QuYXBwZW5kKHRtcCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHNldCB0aGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgaW5wdXQgdmFsdWUgYW5kIHRoZSBzZWxlY3RlZCBmbGFnIGJ5OlxuICAgICAgICAvLyAxLiBleHRyYWN0aW5nIGEgZGlhbCBjb2RlIGZyb20gdGhlIGdpdmVuIG51bWJlclxuICAgICAgICAvLyAyLiB1c2luZyBleHBsaWNpdCBpbml0aWFsQ291bnRyeVxuICAgICAgICAvLyAzLiBwaWNraW5nIHRoZSBmaXJzdCBwcmVmZXJyZWQgY291bnRyeVxuICAgICAgICAvLyA0LiBwaWNraW5nIHRoZSBmaXJzdCBjb3VudHJ5XG4gICAgICAgIF9zZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbCA9IHRoaXMudGVsSW5wdXQudmFsKCk7XG4gICAgICAgICAgICB2YXIgZGlhbENvZGUgPSB0aGlzLl9nZXREaWFsQ29kZSh2YWwpO1xuICAgICAgICAgICAgdmFyIGlzUmVnaW9ubGVzc05hbnAgPSB0aGlzLl9pc1JlZ2lvbmxlc3NOYW5wKHZhbCk7XG4gICAgICAgICAgICAvLyBpZiB3ZSBhbHJlYWR5IGhhdmUgYSBkaWFsIGNvZGUsIGFuZCBpdCdzIG5vdCBhIHJlZ2lvbmxlc3NOYW5wLCB3ZSBjYW4gZ28gYWhlYWQgYW5kIHNldCB0aGUgZmxhZywgZWxzZSBmYWxsIGJhY2sgdG8gdGhlIGRlZmF1bHQgY291bnRyeVxuICAgICAgICAgICAgaWYgKGRpYWxDb2RlICYmICFpc1JlZ2lvbmxlc3NOYW5wKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlRmxhZ0Zyb21OdW1iZXIodmFsKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmluaXRpYWxDb3VudHJ5ICE9PSBcImF1dG9cIikge1xuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBzaG91bGQgc2VsZWN0IGEgZmxhZ1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW5pdGlhbENvdW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RmxhZyh0aGlzLm9wdGlvbnMuaW5pdGlhbENvdW50cnkudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpYWxDb2RlICYmIGlzUmVnaW9ubGVzc05hbnApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhcyBpbnRsIGRpYWwgY29kZSwgaXMgcmVnaW9ubGVzcyBuYW5wLCBhbmQgbm8gaW5pdGlhbENvdW50cnksIHNvIGRlZmF1bHQgdG8gVVNcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldEZsYWcoXCJ1c1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIGRpYWwgY29kZSBhbmQgbm8gaW5pdGlhbENvdW50cnksIHNvIGRlZmF1bHQgdG8gZmlyc3QgaW4gbGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0Q291bnRyeSA9IHRoaXMucHJlZmVycmVkQ291bnRyaWVzLmxlbmd0aCA/IHRoaXMucHJlZmVycmVkQ291bnRyaWVzWzBdLmlzbzIgOiB0aGlzLmNvdW50cmllc1swXS5pc28yO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRGbGFnKHRoaXMuZGVmYXVsdENvdW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGlmIGVtcHR5IGFuZCBubyBuYXRpb25hbE1vZGUgYW5kIG5vIGF1dG9IaWRlRGlhbENvZGUgdGhlbiBpbnNlcnQgdGhlIGRlZmF1bHQgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgaWYgKCF2YWwgJiYgIXRoaXMub3B0aW9ucy5uYXRpb25hbE1vZGUgJiYgIXRoaXMub3B0aW9ucy5hdXRvSGlkZURpYWxDb2RlICYmICF0aGlzLm9wdGlvbnMuc2VwYXJhdGVEaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRlbElucHV0LnZhbChcIitcIiArIHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5kaWFsQ29kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTk9URTogaWYgaW5pdGlhbENvdW50cnkgaXMgc2V0IHRvIGF1dG8sIHRoYXQgd2lsbCBiZSBoYW5kbGVkIHNlcGFyYXRlbHlcbiAgICAgICAgICAgIC8vIGZvcm1hdFxuICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgd29udCBiZSBydW4gYWZ0ZXIgX3VwZGF0ZURpYWxDb2RlIGFzIHRoYXQncyBvbmx5IGNhbGxlZCBpZiBubyB2YWxcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVWYWxGcm9tTnVtYmVyKHZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIG1haW4gZXZlbnQgbGlzdGVuZXJzOiBpbnB1dCBrZXl1cCwgYW5kIGNsaWNrIHNlbGVjdGVkIGZsYWdcbiAgICAgICAgX2luaXRMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faW5pdEtleUxpc3RlbmVycygpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvSGlkZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5pdEZvY3VzTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsbG93RHJvcGRvd24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbml0RHJvcGRvd25MaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmhpZGRlbklucHV0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5pdEhpZGRlbklucHV0TGlzdGVuZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gdXBkYXRlIGhpZGRlbiBpbnB1dCBvbiBmb3JtIHN1Ym1pdFxuICAgICAgICBfaW5pdEhpZGRlbklucHV0TGlzdGVuZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGZvcm0gPSB0aGlzLnRlbElucHV0LmNsb3Nlc3QoXCJmb3JtXCIpO1xuICAgICAgICAgICAgaWYgKGZvcm0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZm9ybS5zdWJtaXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuaGlkZGVuSW5wdXQudmFsKHRoYXQuZ2V0TnVtYmVyKCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBpbml0aWFsaXNlIHRoZSBkcm9wZG93biBsaXN0ZW5lcnNcbiAgICAgICAgX2luaXREcm9wZG93bkxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAvLyBoYWNrIGZvciBpbnB1dCBuZXN0ZWQgaW5zaWRlIGxhYmVsOiBjbGlja2luZyB0aGUgc2VsZWN0ZWQtZmxhZyB0byBvcGVuIHRoZSBkcm9wZG93biB3b3VsZCB0aGVuIGF1dG9tYXRpY2FsbHkgdHJpZ2dlciBhIDJuZCBjbGljayBvbiB0aGUgaW5wdXQgd2hpY2ggd291bGQgY2xvc2UgaXQgYWdhaW5cbiAgICAgICAgICAgIHZhciBsYWJlbCA9IHRoaXMudGVsSW5wdXQuY2xvc2VzdChcImxhYmVsXCIpO1xuICAgICAgICAgICAgaWYgKGxhYmVsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGxhYmVsLm9uKFwiY2xpY2tcIiArIHRoaXMubnMsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIGRyb3Bkb3duIGlzIGNsb3NlZCwgdGhlbiBmb2N1cyB0aGUgaW5wdXQsIGVsc2UgaWdub3JlIHRoZSBjbGlja1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5jb3VudHJ5TGlzdC5oYXNDbGFzcyhcImhpZGVcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudGVsSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdG9nZ2xlIGNvdW50cnkgZHJvcGRvd24gb24gY2xpY2tcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZEZsYWcgPSB0aGlzLnNlbGVjdGVkRmxhZ0lubmVyLnBhcmVudCgpO1xuICAgICAgICAgICAgc2VsZWN0ZWRGbGFnLm9uKFwiY2xpY2tcIiArIHRoaXMubnMsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGludGVyY2VwdCB0aGlzIGV2ZW50IGlmIHdlJ3JlIG9wZW5pbmcgdGhlIGRyb3Bkb3duXG4gICAgICAgICAgICAgICAgLy8gZWxzZSBsZXQgaXQgYnViYmxlIHVwIHRvIHRoZSB0b3AgKFwiY2xpY2stb2ZmLXRvLWNsb3NlXCIgbGlzdGVuZXIpXG4gICAgICAgICAgICAgICAgLy8gd2UgY2Fubm90IGp1c3Qgc3RvcFByb3BhZ2F0aW9uIGFzIGl0IG1heSBiZSBuZWVkZWQgdG8gY2xvc2UgYW5vdGhlciBpbnN0YW5jZVxuICAgICAgICAgICAgICAgIGlmICh0aGF0LmNvdW50cnlMaXN0Lmhhc0NsYXNzKFwiaGlkZVwiKSAmJiAhdGhhdC50ZWxJbnB1dC5wcm9wKFwiZGlzYWJsZWRcIikgJiYgIXRoYXQudGVsSW5wdXQucHJvcChcInJlYWRvbmx5XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3Nob3dEcm9wZG93bigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gb3BlbiBkcm9wZG93biBsaXN0IGlmIGN1cnJlbnRseSBmb2N1c2VkXG4gICAgICAgICAgICB0aGlzLmZsYWdzQ29udGFpbmVyLm9uKFwia2V5ZG93blwiICsgdGhhdC5ucywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHZhciBpc0Ryb3Bkb3duSGlkZGVuID0gdGhhdC5jb3VudHJ5TGlzdC5oYXNDbGFzcyhcImhpZGVcIik7XG4gICAgICAgICAgICAgICAgaWYgKGlzRHJvcGRvd25IaWRkZW4gJiYgKGUud2hpY2ggPT0ga2V5cy5VUCB8fCBlLndoaWNoID09IGtleXMuRE9XTiB8fCBlLndoaWNoID09IGtleXMuU1BBQ0UgfHwgZS53aGljaCA9PSBrZXlzLkVOVEVSKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBwcmV2ZW50IGZvcm0gZnJvbSBiZWluZyBzdWJtaXR0ZWQgaWYgXCJFTlRFUlwiIHdhcyBwcmVzc2VkXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJldmVudCBldmVudCBmcm9tIGJlaW5nIGhhbmRsZWQgYWdhaW4gYnkgZG9jdW1lbnRcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc2hvd0Ryb3Bkb3duKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGFsbG93IG5hdmlnYXRpb24gZnJvbSBkcm9wZG93biB0byBpbnB1dCBvbiBUQUJcbiAgICAgICAgICAgICAgICBpZiAoZS53aGljaCA9PSBrZXlzLlRBQikge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9jbG9zZURyb3Bkb3duKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGluaXQgbWFueSByZXF1ZXN0czogdXRpbHMgc2NyaXB0IC8gZ2VvIGlwIGxvb2t1cFxuICAgICAgICBfaW5pdFJlcXVlc3RzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIC8vIGlmIHRoZSB1c2VyIGhhcyBzcGVjaWZpZWQgdGhlIHBhdGggdG8gdGhlIHV0aWxzIHNjcmlwdCwgZmV0Y2ggaXQgb24gd2luZG93LmxvYWQsIGVsc2UgcmVzb2x2ZVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy51dGlsc1NjcmlwdCAmJiAhd2luZG93LmludGxUZWxJbnB1dFV0aWxzKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlIHBsdWdpbiBpcyBiZWluZyBpbml0aWFsaXNlZCBhZnRlciB0aGUgd2luZG93LmxvYWQgZXZlbnQgaGFzIGFscmVhZHkgYmVlbiBmaXJlZFxuICAgICAgICAgICAgICAgIGlmICgkLmZuW3BsdWdpbk5hbWVdLndpbmRvd0xvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAkLmZuW3BsdWdpbk5hbWVdLmxvYWRVdGlscyh0aGlzLm9wdGlvbnMudXRpbHNTY3JpcHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdhaXQgdW50aWwgdGhlIGxvYWQgZXZlbnQgc28gd2UgZG9uJ3QgYmxvY2sgYW55IG90aGVyIHJlcXVlc3RzIGUuZy4gdGhlIGZsYWdzIGltYWdlXG4gICAgICAgICAgICAgICAgICAgICQod2luZG93KS5vbihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmZuW3BsdWdpbk5hbWVdLmxvYWRVdGlscyh0aGF0Lm9wdGlvbnMudXRpbHNTY3JpcHQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXRpbHNTY3JpcHREZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmluaXRpYWxDb3VudHJ5ID09PSBcImF1dG9cIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRBdXRvQ291bnRyeSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF1dG9Db3VudHJ5RGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBwZXJmb3JtIHRoZSBnZW8gaXAgbG9va3VwXG4gICAgICAgIF9sb2FkQXV0b0NvdW50cnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgLy8gMyBvcHRpb25zOlxuICAgICAgICAgICAgLy8gMSkgYWxyZWFkeSBsb2FkZWQgKHdlJ3JlIGRvbmUpXG4gICAgICAgICAgICAvLyAyKSBub3QgYWxyZWFkeSBzdGFydGVkIGxvYWRpbmcgKHN0YXJ0KVxuICAgICAgICAgICAgLy8gMykgYWxyZWFkeSBzdGFydGVkIGxvYWRpbmcgKGRvIG5vdGhpbmcgLSBqdXN0IHdhaXQgZm9yIGxvYWRpbmcgY2FsbGJhY2sgdG8gZmlyZSlcbiAgICAgICAgICAgIGlmICgkLmZuW3BsdWdpbk5hbWVdLmF1dG9Db3VudHJ5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVBdXRvQ291bnRyeSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghJC5mbltwbHVnaW5OYW1lXS5zdGFydGVkTG9hZGluZ0F1dG9Db3VudHJ5KSB7XG4gICAgICAgICAgICAgICAgLy8gZG9uJ3QgZG8gdGhpcyB0d2ljZSFcbiAgICAgICAgICAgICAgICAkLmZuW3BsdWdpbk5hbWVdLnN0YXJ0ZWRMb2FkaW5nQXV0b0NvdW50cnkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmdlb0lwTG9va3VwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdlb0lwTG9va3VwKGZ1bmN0aW9uKGNvdW50cnlDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmZuW3BsdWdpbk5hbWVdLmF1dG9Db3VudHJ5ID0gY291bnRyeUNvZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRlbGwgYWxsIGluc3RhbmNlcyB0aGUgYXV0byBjb3VudHJ5IGlzIHJlYWR5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB0aGlzIHNob3VsZCBqdXN0IGJlIHRoZSBjdXJyZW50IGluc3RhbmNlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVVBEQVRFOiB1c2Ugc2V0VGltZW91dCBpbiBjYXNlIHRoZWlyIGdlb0lwTG9va3VwIGZ1bmN0aW9uIGNhbGxzIHRoaXMgY2FsbGJhY2sgc3RyYWlnaHQgYXdheSAoZS5nLiBpZiB0aGV5IGhhdmUgYWxyZWFkeSBkb25lIHRoZSBnZW8gaXAgbG9va3VwIHNvbWV3aGVyZSBlbHNlKS4gVXNpbmcgc2V0VGltZW91dCBtZWFucyB0aGF0IHRoZSBjdXJyZW50IHRocmVhZCBvZiBleGVjdXRpb24gd2lsbCBmaW5pc2ggYmVmb3JlIGV4ZWN1dGluZyB0aGlzLCB3aGljaCBhbGxvd3MgdGhlIHBsdWdpbiB0byBmaW5pc2ggaW5pdGlhbGlzaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKFwiLmludGwtdGVsLWlucHV0IGlucHV0XCIpLmludGxUZWxJbnB1dChcImhhbmRsZUF1dG9Db3VudHJ5XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBhbnkga2V5IGxpc3RlbmVyc1xuICAgICAgICBfaW5pdEtleUxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAvLyB1cGRhdGUgZmxhZyBvbiBrZXl1cFxuICAgICAgICAgICAgLy8gKGtlZXAgdGhpcyBsaXN0ZW5lciBzZXBhcmF0ZSBvdGhlcndpc2UgdGhlIHNldFRpbWVvdXQgYnJlYWtzIGFsbCB0aGUgdGVzdHMpXG4gICAgICAgICAgICB0aGlzLnRlbElucHV0Lm9uKFwia2V5dXBcIiArIHRoaXMubnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGF0Ll91cGRhdGVGbGFnRnJvbU51bWJlcih0aGF0LnRlbElucHV0LnZhbCgpKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll90cmlnZ2VyQ291bnRyeUNoYW5nZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gdXBkYXRlIGZsYWcgb24gY3V0L3Bhc3RlIGV2ZW50cyAobm93IHN1cHBvcnRlZCBpbiBhbGwgbWFqb3IgYnJvd3NlcnMpXG4gICAgICAgICAgICB0aGlzLnRlbElucHV0Lm9uKFwiY3V0XCIgKyB0aGlzLm5zICsgXCIgcGFzdGVcIiArIHRoaXMubnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIGhhY2sgYmVjYXVzZSBcInBhc3RlXCIgZXZlbnQgaXMgZmlyZWQgYmVmb3JlIGlucHV0IGlzIHVwZGF0ZWRcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fdXBkYXRlRmxhZ0Zyb21OdW1iZXIodGhhdC50ZWxJbnB1dC52YWwoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3RyaWdnZXJDb3VudHJ5Q2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBhZGhlcmUgdG8gdGhlIGlucHV0J3MgbWF4bGVuZ3RoIGF0dHJcbiAgICAgICAgX2NhcDogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgbWF4ID0gdGhpcy50ZWxJbnB1dC5hdHRyKFwibWF4bGVuZ3RoXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG1heCAmJiBudW1iZXIubGVuZ3RoID4gbWF4ID8gbnVtYmVyLnN1YnN0cigwLCBtYXgpIDogbnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICAvLyBsaXN0ZW4gZm9yIG1vdXNlZG93biwgZm9jdXMgYW5kIGJsdXJcbiAgICAgICAgX2luaXRGb2N1c0xpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAvLyBtb3VzZWRvd24gZGVjaWRlcyB3aGVyZSB0aGUgY3Vyc29yIGdvZXMsIHNvIGlmIHdlJ3JlIGZvY3VzaW5nIHdlIG11c3QgcHJldmVudERlZmF1bHQgYXMgd2UnbGwgYmUgaW5zZXJ0aW5nIHRoZSBkaWFsIGNvZGUsIGFuZCB3ZSB3YW50IHRoZSBjdXJzb3IgdG8gYmUgYXQgdGhlIGVuZCBubyBtYXR0ZXIgd2hlcmUgdGhleSBjbGlja1xuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5vbihcIm1vdXNlZG93blwiICsgdGhpcy5ucywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhhdC50ZWxJbnB1dC5pcyhcIjpmb2N1c1wiKSAmJiAhdGhhdC50ZWxJbnB1dC52YWwoKSkge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCB0aGlzIGFsc28gY2FuY2VscyB0aGUgZm9jdXMsIHNvIHdlIG11c3QgdHJpZ2dlciB0aGF0IG1hbnVhbGx5XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudGVsSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIG9uIGZvY3VzOiBpZiBlbXB0eSwgaW5zZXJ0IHRoZSBkaWFsIGNvZGUgZm9yIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZmxhZ1xuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5vbihcImZvY3VzXCIgKyB0aGlzLm5zLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGF0LnRlbElucHV0LnZhbCgpICYmICF0aGF0LnRlbElucHV0LnByb3AoXCJyZWFkb25seVwiKSAmJiB0aGF0LnNlbGVjdGVkQ291bnRyeURhdGEuZGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5zZXJ0IHRoZSBkaWFsIGNvZGVcbiAgICAgICAgICAgICAgICAgICAgdGhhdC50ZWxJbnB1dC52YWwoXCIrXCIgKyB0aGF0LnNlbGVjdGVkQ291bnRyeURhdGEuZGlhbENvZGUpO1xuICAgICAgICAgICAgICAgICAgICAvLyBhZnRlciBhdXRvLWluc2VydGluZyBhIGRpYWwgY29kZSwgaWYgdGhlIGZpcnN0IGtleSB0aGV5IGhpdCBpcyAnKycgdGhlbiBhc3N1bWUgdGhleSBhcmUgZW50ZXJpbmcgYSBuZXcgbnVtYmVyLCBzbyByZW1vdmUgdGhlIGRpYWwgY29kZS4gdXNlIGtleXByZXNzIGluc3RlYWQgb2Yga2V5ZG93biBiZWNhdXNlIGtleWRvd24gZ2V0cyB0cmlnZ2VyZWQgZm9yIHRoZSBzaGlmdCBrZXkgKHJlcXVpcmVkIHRvIGhpdCB0aGUgKyBrZXkpLCBhbmQgaW5zdGVhZCBvZiBrZXl1cCBiZWNhdXNlIHRoYXQgc2hvd3MgdGhlIG5ldyAnKycgYmVmb3JlIHJlbW92aW5nIHRoZSBvbGQgb25lXG4gICAgICAgICAgICAgICAgICAgIHRoYXQudGVsSW5wdXQub25lKFwia2V5cHJlc3MucGx1c1wiICsgdGhhdC5ucywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUud2hpY2ggPT0ga2V5cy5QTFVTKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC50ZWxJbnB1dC52YWwoXCJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBhZnRlciB0YWJiaW5nIGluLCBtYWtlIHN1cmUgdGhlIGN1cnNvciBpcyBhdCB0aGUgZW5kIHdlIG11c3QgdXNlIHNldFRpbWVvdXQgdG8gZ2V0IG91dHNpZGUgb2YgdGhlIGZvY3VzIGhhbmRsZXIgYXMgaXQgc2VlbXMgdGhlIHNlbGVjdGlvbiBoYXBwZW5zIGFmdGVyIHRoYXRcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoYXQudGVsSW5wdXRbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5pc0dvb2RCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxlbiA9IHRoYXQudGVsSW5wdXQudmFsKCkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LnNldFNlbGVjdGlvblJhbmdlKGxlbiwgbGVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBvbiBibHVyIG9yIGZvcm0gc3VibWl0OiBpZiBqdXN0IGEgZGlhbCBjb2RlIHRoZW4gcmVtb3ZlIGl0XG4gICAgICAgICAgICB2YXIgZm9ybSA9IHRoaXMudGVsSW5wdXQucHJvcChcImZvcm1cIik7XG4gICAgICAgICAgICBpZiAoZm9ybSkge1xuICAgICAgICAgICAgICAgICQoZm9ybSkub24oXCJzdWJtaXRcIiArIHRoaXMubnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9yZW1vdmVFbXB0eURpYWxDb2RlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRlbElucHV0Lm9uKFwiYmx1clwiICsgdGhpcy5ucywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5fcmVtb3ZlRW1wdHlEaWFsQ29kZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIF9yZW1vdmVFbXB0eURpYWxDb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMudGVsSW5wdXQudmFsKCksIHN0YXJ0c1BsdXMgPSB2YWx1ZS5jaGFyQXQoMCkgPT0gXCIrXCI7XG4gICAgICAgICAgICBpZiAoc3RhcnRzUGx1cykge1xuICAgICAgICAgICAgICAgIHZhciBudW1lcmljID0gdGhpcy5fZ2V0TnVtZXJpYyh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgLy8gaWYganVzdCBhIHBsdXMsIG9yIGlmIGp1c3QgYSBkaWFsIGNvZGVcbiAgICAgICAgICAgICAgICBpZiAoIW51bWVyaWMgfHwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlID09IG51bWVyaWMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC52YWwoXCJcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBrZXlwcmVzcyBsaXN0ZW5lciB3ZSBhZGRlZCBvbiBmb2N1c1xuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5vZmYoXCJrZXlwcmVzcy5wbHVzXCIgKyB0aGlzLm5zKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgbnVtZXJpYyBkaWdpdHMgZnJvbSB0aGUgZ2l2ZW4gc3RyaW5nXG4gICAgICAgIF9nZXROdW1lcmljOiBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9cXEQvZywgXCJcIik7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHNob3cgdGhlIGRyb3Bkb3duXG4gICAgICAgIF9zaG93RHJvcGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fc2V0RHJvcGRvd25Qb3NpdGlvbigpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIGhpZ2hsaWdodGluZyBhbmQgc2Nyb2xsIHRvIGFjdGl2ZSBsaXN0IGl0ZW1cbiAgICAgICAgICAgIHZhciBhY3RpdmVMaXN0SXRlbSA9IHRoaXMuY291bnRyeUxpc3QuY2hpbGRyZW4oXCIuYWN0aXZlXCIpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZUxpc3RJdGVtLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hpZ2hsaWdodExpc3RJdGVtKGFjdGl2ZUxpc3RJdGVtKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGxUbyhhY3RpdmVMaXN0SXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBiaW5kIGFsbCB0aGUgZHJvcGRvd24tcmVsYXRlZCBsaXN0ZW5lcnM6IG1vdXNlb3ZlciwgY2xpY2ssIGNsaWNrLW9mZiwga2V5ZG93blxuICAgICAgICAgICAgdGhpcy5fYmluZERyb3Bkb3duTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGFycm93XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkRmxhZ0lubmVyLmNoaWxkcmVuKFwiLml0aS1hcnJvd1wiKS5hZGRDbGFzcyhcInVwXCIpO1xuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC50cmlnZ2VyKFwib3Blbjpjb3VudHJ5ZHJvcGRvd25cIik7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGRlY2lkZSB3aGVyZSB0byBwb3NpdGlvbiBkcm9wZG93biAoZGVwZW5kcyBvbiBwb3NpdGlvbiB3aXRoaW4gdmlld3BvcnQsIGFuZCBzY3JvbGwpXG4gICAgICAgIF9zZXREcm9wZG93blBvc2l0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJvcGRvd25Db250YWluZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duLmFwcGVuZFRvKHRoaXMub3B0aW9ucy5kcm9wZG93bkNvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzaG93IHRoZSBtZW51IGFuZCBncmFiIHRoZSBkcm9wZG93biBoZWlnaHRcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25IZWlnaHQgPSB0aGlzLmNvdW50cnlMaXN0LnJlbW92ZUNsYXNzKFwiaGlkZVwiKS5hdHRyKFwiYXJpYS1leHBhbmRlZFwiLCBcInRydWVcIikub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc01vYmlsZSkge1xuICAgICAgICAgICAgICAgIHZhciBwb3MgPSB0aGlzLnRlbElucHV0Lm9mZnNldCgpLCBpbnB1dFRvcCA9IHBvcy50b3AsIHdpbmRvd1RvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKSwgLy8gZHJvcGRvd25GaXRzQmVsb3cgPSAoZHJvcGRvd25Cb3R0b20gPCB3aW5kb3dCb3R0b20pXG4gICAgICAgICAgICAgICAgICAgIGRyb3Bkb3duRml0c0JlbG93ID0gaW5wdXRUb3AgKyB0aGlzLnRlbElucHV0Lm91dGVySGVpZ2h0KCkgKyB0aGlzLmRyb3Bkb3duSGVpZ2h0IDwgd2luZG93VG9wICsgJCh3aW5kb3cpLmhlaWdodCgpLCBkcm9wZG93bkZpdHNBYm92ZSA9IGlucHV0VG9wIC0gdGhpcy5kcm9wZG93bkhlaWdodCA+IHdpbmRvd1RvcDtcbiAgICAgICAgICAgICAgICAvLyBieSBkZWZhdWx0LCB0aGUgZHJvcGRvd24gd2lsbCBiZSBiZWxvdyB0aGUgaW5wdXQuIElmIHdlIHdhbnQgdG8gcG9zaXRpb24gaXQgYWJvdmUgdGhlIGlucHV0LCB3ZSBhZGQgdGhlIGRyb3B1cCBjbGFzcy5cbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50cnlMaXN0LnRvZ2dsZUNsYXNzKFwiZHJvcHVwXCIsICFkcm9wZG93bkZpdHNCZWxvdyAmJiBkcm9wZG93bkZpdHNBYm92ZSk7XG4gICAgICAgICAgICAgICAgLy8gaWYgZHJvcGRvd25Db250YWluZXIgaXMgZW5hYmxlZCwgY2FsY3VsYXRlIHBvc3Rpb25cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyb3Bkb3duQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJ5IGRlZmF1bHQgdGhlIGRyb3Bkb3duIHdpbGwgYmUgZGlyZWN0bHkgb3ZlciB0aGUgaW5wdXQgYmVjYXVzZSBpdCdzIG5vdCBpbiB0aGUgZmxvdy4gSWYgd2Ugd2FudCB0byBwb3NpdGlvbiBpdCBiZWxvdywgd2UgbmVlZCB0byBhZGQgc29tZSBleHRyYSB0b3AgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHRyYVRvcCA9ICFkcm9wZG93bkZpdHNCZWxvdyAmJiBkcm9wZG93bkZpdHNBYm92ZSA/IDAgOiB0aGlzLnRlbElucHV0LmlubmVySGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSBwbGFjZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bi5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBpbnB1dFRvcCArIGV4dHJhVG9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogcG9zLmxlZnRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNsb3NlIG1lbnUgb24gd2luZG93IHNjcm9sbFxuICAgICAgICAgICAgICAgICAgICAkKHdpbmRvdykub24oXCJzY3JvbGxcIiArIHRoaXMubnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fY2xvc2VEcm9wZG93bigpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHdlIG9ubHkgYmluZCBkcm9wZG93biBsaXN0ZW5lcnMgd2hlbiB0aGUgZHJvcGRvd24gaXMgb3BlblxuICAgICAgICBfYmluZERyb3Bkb3duTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIC8vIHdoZW4gbW91c2Ugb3ZlciBhIGxpc3QgaXRlbSwganVzdCBoaWdobGlnaHQgdGhhdCBvbmVcbiAgICAgICAgICAgIC8vIHdlIGFkZCB0aGUgY2xhc3MgXCJoaWdobGlnaHRcIiwgc28gaWYgdGhleSBoaXQgXCJlbnRlclwiIHdlIGtub3cgd2hpY2ggb25lIHRvIHNlbGVjdFxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdC5vbihcIm1vdXNlb3ZlclwiICsgdGhpcy5ucywgXCIuY291bnRyeVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5faGlnaGxpZ2h0TGlzdEl0ZW0oJCh0aGlzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGxpc3RlbiBmb3IgY291bnRyeSBzZWxlY3Rpb25cbiAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3Qub24oXCJjbGlja1wiICsgdGhpcy5ucywgXCIuY291bnRyeVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5fc2VsZWN0TGlzdEl0ZW0oJCh0aGlzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGNsaWNrIG9mZiB0byBjbG9zZVxuICAgICAgICAgICAgLy8gKGV4Y2VwdCB3aGVuIHRoaXMgaW5pdGlhbCBvcGVuaW5nIGNsaWNrIGlzIGJ1YmJsaW5nIHVwKVxuICAgICAgICAgICAgLy8gd2UgY2Fubm90IGp1c3Qgc3RvcFByb3BhZ2F0aW9uIGFzIGl0IG1heSBiZSBuZWVkZWQgdG8gY2xvc2UgYW5vdGhlciBpbnN0YW5jZVxuICAgICAgICAgICAgdmFyIGlzT3BlbmluZyA9IHRydWU7XG4gICAgICAgICAgICAkKFwiaHRtbFwiKS5vbihcImNsaWNrXCIgKyB0aGlzLm5zLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc09wZW5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fY2xvc2VEcm9wZG93bigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpc09wZW5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gbGlzdGVuIGZvciB1cC9kb3duIHNjcm9sbGluZywgZW50ZXIgdG8gc2VsZWN0LCBvciBsZXR0ZXJzIHRvIGp1bXAgdG8gY291bnRyeSBuYW1lLlxuICAgICAgICAgICAgLy8gdXNlIGtleWRvd24gYXMga2V5cHJlc3MgZG9lc24ndCBmaXJlIGZvciBub24tY2hhciBrZXlzIGFuZCB3ZSB3YW50IHRvIGNhdGNoIGlmIHRoZXlcbiAgICAgICAgICAgIC8vIGp1c3QgaGl0IGRvd24gYW5kIGhvbGQgaXQgdG8gc2Nyb2xsIGRvd24gKG5vIGtleXVwIGV2ZW50KS5cbiAgICAgICAgICAgIC8vIGxpc3RlbiBvbiB0aGUgZG9jdW1lbnQgYmVjYXVzZSB0aGF0J3Mgd2hlcmUga2V5IGV2ZW50cyBhcmUgdHJpZ2dlcmVkIGlmIG5vIGlucHV0IGhhcyBmb2N1c1xuICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gXCJcIiwgcXVlcnlUaW1lciA9IG51bGw7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vbihcImtleWRvd25cIiArIHRoaXMubnMsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBwcmV2ZW50IGRvd24ga2V5IGZyb20gc2Nyb2xsaW5nIHRoZSB3aG9sZSBwYWdlLFxuICAgICAgICAgICAgICAgIC8vIGFuZCBlbnRlciBrZXkgZnJvbSBzdWJtaXR0aW5nIGEgZm9ybSBldGNcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgaWYgKGUud2hpY2ggPT0ga2V5cy5VUCB8fCBlLndoaWNoID09IGtleXMuRE9XTikge1xuICAgICAgICAgICAgICAgICAgICAvLyB1cCBhbmQgZG93biB0byBuYXZpZ2F0ZVxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9oYW5kbGVVcERvd25LZXkoZS53aGljaCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLndoaWNoID09IGtleXMuRU5URVIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZW50ZXIgdG8gc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2hhbmRsZUVudGVyS2V5KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLndoaWNoID09IGtleXMuRVNDKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzYyB0byBjbG9zZVxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9jbG9zZURyb3Bkb3duKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLndoaWNoID49IGtleXMuQSAmJiBlLndoaWNoIDw9IGtleXMuWiB8fCBlLndoaWNoID09IGtleXMuU1BBQ0UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBwZXIgY2FzZSBsZXR0ZXJzIChub3RlOiBrZXl1cC9rZXlkb3duIG9ubHkgcmV0dXJuIHVwcGVyIGNhc2UgbGV0dGVycylcbiAgICAgICAgICAgICAgICAgICAgLy8ganVtcCB0byBjb3VudHJpZXMgdGhhdCBzdGFydCB3aXRoIHRoZSBxdWVyeSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5VGltZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChxdWVyeVRpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBxdWVyeSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGUud2hpY2gpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zZWFyY2hGb3JDb3VudHJ5KHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIHRpbWVyIGhpdHMgMSBzZWNvbmQsIHJlc2V0IHRoZSBxdWVyeVxuICAgICAgICAgICAgICAgICAgICBxdWVyeVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfSwgMWUzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gaGlnaGxpZ2h0IHRoZSBuZXh0L3ByZXYgaXRlbSBpbiB0aGUgbGlzdCAoYW5kIGVuc3VyZSBpdCBpcyB2aXNpYmxlKVxuICAgICAgICBfaGFuZGxlVXBEb3duS2V5OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5jb3VudHJ5TGlzdC5jaGlsZHJlbihcIi5oaWdobGlnaHRcIikuZmlyc3QoKTtcbiAgICAgICAgICAgIHZhciBuZXh0ID0ga2V5ID09IGtleXMuVVAgPyBjdXJyZW50LnByZXYoKSA6IGN1cnJlbnQubmV4dCgpO1xuICAgICAgICAgICAgaWYgKG5leHQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gc2tpcCB0aGUgZGl2aWRlclxuICAgICAgICAgICAgICAgIGlmIChuZXh0Lmhhc0NsYXNzKFwiZGl2aWRlclwiKSkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0ID0ga2V5ID09IGtleXMuVVAgPyBuZXh0LnByZXYoKSA6IG5leHQubmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9oaWdobGlnaHRMaXN0SXRlbShuZXh0KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGxUbyhuZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gc2VsZWN0IHRoZSBjdXJyZW50bHkgaGlnaGxpZ2h0ZWQgaXRlbVxuICAgICAgICBfaGFuZGxlRW50ZXJLZXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRDb3VudHJ5ID0gdGhpcy5jb3VudHJ5TGlzdC5jaGlsZHJlbihcIi5oaWdobGlnaHRcIikuZmlyc3QoKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q291bnRyeS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RMaXN0SXRlbShjdXJyZW50Q291bnRyeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGZpbmQgdGhlIGZpcnN0IGxpc3QgaXRlbSB3aG9zZSBuYW1lIHN0YXJ0cyB3aXRoIHRoZSBxdWVyeSBzdHJpbmdcbiAgICAgICAgX3NlYXJjaEZvckNvdW50cnk6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY291bnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXJ0c1dpdGgodGhpcy5jb3VudHJpZXNbaV0ubmFtZSwgcXVlcnkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0SXRlbSA9IHRoaXMuY291bnRyeUxpc3QuY2hpbGRyZW4oXCJbZGF0YS1jb3VudHJ5LWNvZGU9XCIgKyB0aGlzLmNvdW50cmllc1tpXS5pc28yICsgXCJdXCIpLm5vdChcIi5wcmVmZXJyZWRcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBoaWdobGlnaHRpbmcgYW5kIHNjcm9sbFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oaWdobGlnaHRMaXN0SXRlbShsaXN0SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbFRvKGxpc3RJdGVtLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBjaGVjayBpZiAodXBwZXJjYXNlKSBzdHJpbmcgYSBzdGFydHMgd2l0aCBzdHJpbmcgYlxuICAgICAgICBfc3RhcnRzV2l0aDogZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEuc3Vic3RyKDAsIGIubGVuZ3RoKS50b1VwcGVyQ2FzZSgpID09IGI7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5wdXQncyB2YWx1ZSB0byB0aGUgZ2l2ZW4gdmFsIChmb3JtYXQgZmlyc3QgaWYgcG9zc2libGUpXG4gICAgICAgIC8vIE5PVEU6IHRoaXMgaXMgY2FsbGVkIGZyb20gX3NldEluaXRpYWxTdGF0ZSwgaGFuZGxlVXRpbHMgYW5kIHNldE51bWJlclxuICAgICAgICBfdXBkYXRlVmFsRnJvbU51bWJlcjogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZvcm1hdE9uRGlzcGxheSAmJiB3aW5kb3cuaW50bFRlbElucHV0VXRpbHMgJiYgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZvcm1hdCA9ICF0aGlzLm9wdGlvbnMuc2VwYXJhdGVEaWFsQ29kZSAmJiAodGhpcy5vcHRpb25zLm5hdGlvbmFsTW9kZSB8fCBudW1iZXIuY2hhckF0KDApICE9IFwiK1wiKSA/IGludGxUZWxJbnB1dFV0aWxzLm51bWJlckZvcm1hdC5OQVRJT05BTCA6IGludGxUZWxJbnB1dFV0aWxzLm51bWJlckZvcm1hdC5JTlRFUk5BVElPTkFMO1xuICAgICAgICAgICAgICAgIG51bWJlciA9IGludGxUZWxJbnB1dFV0aWxzLmZvcm1hdE51bWJlcihudW1iZXIsIHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5pc28yLCBmb3JtYXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbnVtYmVyID0gdGhpcy5fYmVmb3JlU2V0TnVtYmVyKG51bWJlcik7XG4gICAgICAgICAgICB0aGlzLnRlbElucHV0LnZhbChudW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBjaGVjayBpZiBuZWVkIHRvIHNlbGVjdCBhIG5ldyBmbGFnIGJhc2VkIG9uIHRoZSBnaXZlbiBudW1iZXJcbiAgICAgICAgLy8gTm90ZTogY2FsbGVkIGZyb20gX3NldEluaXRpYWxTdGF0ZSwga2V5dXAgaGFuZGxlciwgc2V0TnVtYmVyXG4gICAgICAgIF91cGRhdGVGbGFnRnJvbU51bWJlcjogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICAvLyBpZiB3ZSdyZSBpbiBuYXRpb25hbE1vZGUgYW5kIHdlIGFscmVhZHkgaGF2ZSBVUy9DYW5hZGEgc2VsZWN0ZWQsIG1ha2Ugc3VyZSB0aGUgbnVtYmVyIHN0YXJ0cyB3aXRoIGEgKzEgc28gX2dldERpYWxDb2RlIHdpbGwgYmUgYWJsZSB0byBleHRyYWN0IHRoZSBhcmVhIGNvZGVcbiAgICAgICAgICAgIC8vIHVwZGF0ZTogaWYgd2UgZG9udCB5ZXQgaGF2ZSBzZWxlY3RlZENvdW50cnlEYXRhLCBidXQgd2UncmUgaGVyZSAodHJ5aW5nIHRvIHVwZGF0ZSB0aGUgZmxhZyBmcm9tIHRoZSBudW1iZXIpLCB0aGF0IG1lYW5zIHdlJ3JlIGluaXRpYWxpc2luZyB0aGUgcGx1Z2luIHdpdGggYSBudW1iZXIgdGhhdCBhbHJlYWR5IGhhcyBhIGRpYWwgY29kZSwgc28gZmluZSB0byBpZ25vcmUgdGhpcyBiaXRcbiAgICAgICAgICAgIGlmIChudW1iZXIgJiYgdGhpcy5vcHRpb25zLm5hdGlvbmFsTW9kZSAmJiB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuZGlhbENvZGUgPT0gXCIxXCIgJiYgbnVtYmVyLmNoYXJBdCgwKSAhPSBcIitcIikge1xuICAgICAgICAgICAgICAgIGlmIChudW1iZXIuY2hhckF0KDApICE9IFwiMVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG51bWJlciA9IFwiMVwiICsgbnVtYmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBudW1iZXIgPSBcIitcIiArIG51bWJlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRyeSBhbmQgZXh0cmFjdCB2YWxpZCBkaWFsIGNvZGUgZnJvbSBpbnB1dFxuICAgICAgICAgICAgdmFyIGRpYWxDb2RlID0gdGhpcy5fZ2V0RGlhbENvZGUobnVtYmVyKSwgY291bnRyeUNvZGUgPSBudWxsLCBudW1lcmljID0gdGhpcy5fZ2V0TnVtZXJpYyhudW1iZXIpO1xuICAgICAgICAgICAgaWYgKGRpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgb25lIG9mIHRoZSBtYXRjaGluZyBjb3VudHJpZXMgaXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgICAgICAgICAgICAgIHZhciBjb3VudHJ5Q29kZXMgPSB0aGlzLmNvdW50cnlDb2Rlc1t0aGlzLl9nZXROdW1lcmljKGRpYWxDb2RlKV0sIGFscmVhZHlTZWxlY3RlZCA9ICQuaW5BcnJheSh0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMiwgY291bnRyeUNvZGVzKSA+IC0xLCAvLyBjaGVjayBpZiB0aGUgZ2l2ZW4gbnVtYmVyIGNvbnRhaW5zIGEgTkFOUCBhcmVhIGNvZGUgaS5lLiB0aGUgb25seSBkaWFsQ29kZSB0aGF0IGNvdWxkIGJlIGV4dHJhY3RlZCB3YXMgKzEgKGluc3RlYWQgb2Ygc2F5ICsxMjA0KSBhbmQgdGhlIGFjdHVhbCBudW1iZXIncyBsZW5ndGggaXMgPj00XG4gICAgICAgICAgICAgICAgICAgIGlzTmFucEFyZWFDb2RlID0gZGlhbENvZGUgPT0gXCIrMVwiICYmIG51bWVyaWMubGVuZ3RoID49IDQsIG5hbnBTZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5kaWFsQ29kZSA9PSBcIjFcIjtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IHVwZGF0ZSB0aGUgZmxhZyBpZjpcbiAgICAgICAgICAgICAgICAvLyBBKSBOT1QgKHdlIGN1cnJlbnRseSBoYXZlIGEgTkFOUCBmbGFnIHNlbGVjdGVkLCBhbmQgdGhlIG51bWJlciBpcyBhIHJlZ2lvbmxlc3NOYW5wKVxuICAgICAgICAgICAgICAgIC8vIEFORFxuICAgICAgICAgICAgICAgIC8vIEIpIGVpdGhlciBhIG1hdGNoaW5nIGNvdW50cnkgaXMgbm90IGFscmVhZHkgc2VsZWN0ZWQgT1IgdGhlIG51bWJlciBjb250YWlucyBhIE5BTlAgYXJlYSBjb2RlIChlbnN1cmUgdGhlIGZsYWcgaXMgc2V0IHRvIHRoZSBmaXJzdCBtYXRjaGluZyBjb3VudHJ5KVxuICAgICAgICAgICAgICAgIGlmICghKG5hbnBTZWxlY3RlZCAmJiB0aGlzLl9pc1JlZ2lvbmxlc3NOYW5wKG51bWVyaWMpKSAmJiAoIWFscmVhZHlTZWxlY3RlZCB8fCBpc05hbnBBcmVhQ29kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdXNpbmcgb25seUNvdW50cmllcyBvcHRpb24sIGNvdW50cnlDb2Rlc1swXSBtYXkgYmUgZW1wdHksIHNvIHdlIG11c3QgZmluZCB0aGUgZmlyc3Qgbm9uLWVtcHR5IGluZGV4XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY291bnRyeUNvZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY291bnRyeUNvZGVzW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnRyeUNvZGUgPSBjb3VudHJ5Q29kZXNbal07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG51bWJlci5jaGFyQXQoMCkgPT0gXCIrXCIgJiYgbnVtZXJpYy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBpbnZhbGlkIGRpYWwgY29kZSwgc28gZW1wdHlcbiAgICAgICAgICAgICAgICAvLyBOb3RlOiB1c2UgZ2V0TnVtZXJpYyBoZXJlIGJlY2F1c2UgdGhlIG51bWJlciBoYXMgbm90IGJlZW4gZm9ybWF0dGVkIHlldCwgc28gY291bGQgY29udGFpbiBiYWQgY2hhcnNcbiAgICAgICAgICAgICAgICBjb3VudHJ5Q29kZSA9IFwiXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFudW1iZXIgfHwgbnVtYmVyID09IFwiK1wiKSB7XG4gICAgICAgICAgICAgICAgLy8gZW1wdHksIG9yIGp1c3QgYSBwbHVzLCBzbyBkZWZhdWx0XG4gICAgICAgICAgICAgICAgY291bnRyeUNvZGUgPSB0aGlzLmRlZmF1bHRDb3VudHJ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvdW50cnlDb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NldEZsYWcoY291bnRyeUNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICAvLyBjaGVjayBpZiB0aGUgZ2l2ZW4gbnVtYmVyIGlzIGEgcmVnaW9ubGVzcyBOQU5QIG51bWJlciAoZXhwZWN0cyB0aGUgbnVtYmVyIHRvIGNvbnRhaW4gYW4gaW50ZXJuYXRpb25hbCBkaWFsIGNvZGUpXG4gICAgICAgIF9pc1JlZ2lvbmxlc3NOYW5wOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBudW1lcmljID0gdGhpcy5fZ2V0TnVtZXJpYyhudW1iZXIpO1xuICAgICAgICAgICAgaWYgKG51bWVyaWMuY2hhckF0KDApID09IFwiMVwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZWFDb2RlID0gbnVtZXJpYy5zdWJzdHIoMSwgMyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuaW5BcnJheShhcmVhQ29kZSwgcmVnaW9ubGVzc05hbnBOdW1iZXJzKSA+IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICAvLyByZW1vdmUgaGlnaGxpZ2h0aW5nIGZyb20gb3RoZXIgbGlzdCBpdGVtcyBhbmQgaGlnaGxpZ2h0IHRoZSBnaXZlbiBpdGVtXG4gICAgICAgIF9oaWdobGlnaHRMaXN0SXRlbTogZnVuY3Rpb24obGlzdEl0ZW0pIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3RJdGVtcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodFwiKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLmFkZENsYXNzKFwiaGlnaGxpZ2h0XCIpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBmaW5kIHRoZSBjb3VudHJ5IGRhdGEgZm9yIHRoZSBnaXZlbiBjb3VudHJ5IGNvZGVcbiAgICAgICAgLy8gdGhlIGlnbm9yZU9ubHlDb3VudHJpZXNPcHRpb24gaXMgb25seSB1c2VkIGR1cmluZyBpbml0KCkgd2hpbGUgcGFyc2luZyB0aGUgb25seUNvdW50cmllcyBhcnJheVxuICAgICAgICBfZ2V0Q291bnRyeURhdGE6IGZ1bmN0aW9uKGNvdW50cnlDb2RlLCBpZ25vcmVPbmx5Q291bnRyaWVzT3B0aW9uLCBhbGxvd0ZhaWwpIHtcbiAgICAgICAgICAgIHZhciBjb3VudHJ5TGlzdCA9IGlnbm9yZU9ubHlDb3VudHJpZXNPcHRpb24gPyBhbGxDb3VudHJpZXMgOiB0aGlzLmNvdW50cmllcztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnRyeUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoY291bnRyeUxpc3RbaV0uaXNvMiA9PSBjb3VudHJ5Q29kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY291bnRyeUxpc3RbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFsbG93RmFpbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjb3VudHJ5IGRhdGEgZm9yICdcIiArIGNvdW50cnlDb2RlICsgXCInXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBzZWxlY3QgdGhlIGdpdmVuIGZsYWcsIHVwZGF0ZSB0aGUgcGxhY2Vob2xkZXIgYW5kIHRoZSBhY3RpdmUgbGlzdCBpdGVtXG4gICAgICAgIC8vIE5vdGU6IGNhbGxlZCBmcm9tIF9zZXRJbml0aWFsU3RhdGUsIF91cGRhdGVGbGFnRnJvbU51bWJlciwgX3NlbGVjdExpc3RJdGVtLCBzZXRDb3VudHJ5XG4gICAgICAgIF9zZXRGbGFnOiBmdW5jdGlvbihjb3VudHJ5Q29kZSkge1xuICAgICAgICAgICAgdmFyIHByZXZDb3VudHJ5ID0gdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIgPyB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEgOiB7fTtcbiAgICAgICAgICAgIC8vIGRvIHRoaXMgZmlyc3QgYXMgaXQgd2lsbCB0aHJvdyBhbiBlcnJvciBhbmQgc3RvcCBpZiBjb3VudHJ5Q29kZSBpcyBpbnZhbGlkXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEgPSBjb3VudHJ5Q29kZSA/IHRoaXMuX2dldENvdW50cnlEYXRhKGNvdW50cnlDb2RlLCBmYWxzZSwgZmFsc2UpIDoge307XG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGRlZmF1bHRDb3VudHJ5IC0gd2Ugb25seSBuZWVkIHRoZSBpc28yIGZyb20gbm93IG9uLCBzbyBqdXN0IHN0b3JlIHRoYXRcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMikge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVmYXVsdENvdW50cnkgPSB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRGbGFnSW5uZXIuYXR0cihcImNsYXNzXCIsIFwiaXRpLWZsYWcgXCIgKyBjb3VudHJ5Q29kZSk7XG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHNlbGVjdGVkIGNvdW50cnkncyB0aXRsZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIHZhciB0aXRsZSA9IGNvdW50cnlDb2RlID8gdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLm5hbWUgKyBcIjogK1wiICsgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlIDogXCJVbmtub3duXCI7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkRmxhZ0lubmVyLnBhcmVudCgpLmF0dHIoXCJ0aXRsZVwiLCB0aXRsZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNlcGFyYXRlRGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlhbENvZGUgPSB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuZGlhbENvZGUgPyBcIitcIiArIHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5kaWFsQ29kZSA6IFwiXCIsIHBhcmVudCA9IHRoaXMudGVsSW5wdXQucGFyZW50KCk7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZDb3VudHJ5LmRpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyhcIml0aS1zZGMtXCIgKyAocHJldkNvdW50cnkuZGlhbENvZGUubGVuZ3RoICsgMSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmFkZENsYXNzKFwiaXRpLXNkYy1cIiArIGRpYWxDb2RlLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREaWFsQ29kZS50ZXh0KGRpYWxDb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGFuZCB0aGUgaW5wdXQncyBwbGFjZWhvbGRlclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGxhY2Vob2xkZXIoKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgYWN0aXZlIGxpc3QgaXRlbVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGxvd0Ryb3Bkb3duKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdEl0ZW1zLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpLmF0dHIoXCJhcmlhLXNlbGVjdGVkXCIsIFwiZmFsc2VcIik7XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50cnlDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0SXRlbSA9IHRoaXMuY291bnRyeUxpc3RJdGVtcy5maW5kKFwiLml0aS1mbGFnLlwiICsgY291bnRyeUNvZGUpLmZpcnN0KCkuY2xvc2VzdChcIi5jb3VudHJ5XCIpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0SXRlbS5hZGRDbGFzcyhcImFjdGl2ZVwiKS5hdHRyKFwiYXJpYS1zZWxlY3RlZFwiLCBcInRydWVcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3QuYXR0cihcImFyaWEtYWN0aXZlZGVzY2VuZGFudFwiLCBsaXN0SXRlbS5hdHRyKFwiaWRcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHJldHVybiBpZiB0aGUgZmxhZyBoYXMgY2hhbmdlZCBvciBub3RcbiAgICAgICAgICAgIHJldHVybiBwcmV2Q291bnRyeS5pc28yICE9PSBjb3VudHJ5Q29kZTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBpbnB1dCBwbGFjZWhvbGRlciB0byBhbiBleGFtcGxlIG51bWJlciBmcm9tIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgY291bnRyeVxuICAgICAgICBfdXBkYXRlUGxhY2Vob2xkZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNob3VsZFNldFBsYWNlaG9sZGVyID0gdGhpcy5vcHRpb25zLmF1dG9QbGFjZWhvbGRlciA9PT0gXCJhZ2dyZXNzaXZlXCIgfHwgIXRoaXMuaGFkSW5pdGlhbFBsYWNlaG9sZGVyICYmICh0aGlzLm9wdGlvbnMuYXV0b1BsYWNlaG9sZGVyID09PSB0cnVlIHx8IHRoaXMub3B0aW9ucy5hdXRvUGxhY2Vob2xkZXIgPT09IFwicG9saXRlXCIpO1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5pbnRsVGVsSW5wdXRVdGlscyAmJiBzaG91bGRTZXRQbGFjZWhvbGRlcikge1xuICAgICAgICAgICAgICAgIHZhciBudW1iZXJUeXBlID0gaW50bFRlbElucHV0VXRpbHMubnVtYmVyVHlwZVt0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXJOdW1iZXJUeXBlXSwgcGxhY2Vob2xkZXIgPSB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMiA/IGludGxUZWxJbnB1dFV0aWxzLmdldEV4YW1wbGVOdW1iZXIodGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIsIHRoaXMub3B0aW9ucy5uYXRpb25hbE1vZGUsIG51bWJlclR5cGUpIDogXCJcIjtcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9IHRoaXMuX2JlZm9yZVNldE51bWJlcihwbGFjZWhvbGRlcik7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuY3VzdG9tUGxhY2Vob2xkZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9IHRoaXMub3B0aW9ucy5jdXN0b21QbGFjZWhvbGRlcihwbGFjZWhvbGRlciwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5hdHRyKFwicGxhY2Vob2xkZXJcIiwgcGxhY2Vob2xkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBjYWxsZWQgd2hlbiB0aGUgdXNlciBzZWxlY3RzIGEgbGlzdCBpdGVtIGZyb20gdGhlIGRyb3Bkb3duXG4gICAgICAgIF9zZWxlY3RMaXN0SXRlbTogZnVuY3Rpb24obGlzdEl0ZW0pIHtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBzZWxlY3RlZCBmbGFnIGFuZCBhY3RpdmUgbGlzdCBpdGVtXG4gICAgICAgICAgICB2YXIgZmxhZ0NoYW5nZWQgPSB0aGlzLl9zZXRGbGFnKGxpc3RJdGVtLmF0dHIoXCJkYXRhLWNvdW50cnktY29kZVwiKSk7XG4gICAgICAgICAgICB0aGlzLl9jbG9zZURyb3Bkb3duKCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVEaWFsQ29kZShsaXN0SXRlbS5hdHRyKFwiZGF0YS1kaWFsLWNvZGVcIiksIHRydWUpO1xuICAgICAgICAgICAgLy8gZm9jdXMgdGhlIGlucHV0XG4gICAgICAgICAgICB0aGlzLnRlbElucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAvLyBwdXQgY3Vyc29yIGF0IGVuZCAtIHRoaXMgZml4IGlzIHJlcXVpcmVkIGZvciBGRiBhbmQgSUUxMSAod2l0aCBuYXRpb25hbE1vZGU9ZmFsc2UgaS5lLiBhdXRvIGluc2VydGluZyBkaWFsIGNvZGUpLCB3aG8gdHJ5IHRvIHB1dCB0aGUgY3Vyc29yIGF0IHRoZSBiZWdpbm5pbmcgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgICAgIGlmICh0aGlzLmlzR29vZEJyb3dzZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gdGhpcy50ZWxJbnB1dC52YWwoKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGhpcy50ZWxJbnB1dFswXS5zZXRTZWxlY3Rpb25SYW5nZShsZW4sIGxlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmxhZ0NoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90cmlnZ2VyQ291bnRyeUNoYW5nZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBjbG9zZSB0aGUgZHJvcGRvd24gYW5kIHVuYmluZCBhbnkgbGlzdGVuZXJzXG4gICAgICAgIF9jbG9zZURyb3Bkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3QuYWRkQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdC5hdHRyKFwiYXJpYS1leHBhbmRlZFwiLCBcImZhbHNlXCIpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBhcnJvd1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEZsYWdJbm5lci5jaGlsZHJlbihcIi5pdGktYXJyb3dcIikucmVtb3ZlQ2xhc3MoXCJ1cFwiKTtcbiAgICAgICAgICAgIC8vIHVuYmluZCBrZXkgZXZlbnRzXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYodGhpcy5ucyk7XG4gICAgICAgICAgICAvLyB1bmJpbmQgY2xpY2stb2ZmLXRvLWNsb3NlXG4gICAgICAgICAgICAkKFwiaHRtbFwiKS5vZmYodGhpcy5ucyk7XG4gICAgICAgICAgICAvLyB1bmJpbmQgaG92ZXIgYW5kIGNsaWNrIGxpc3RlbmVyc1xuICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdC5vZmYodGhpcy5ucyk7XG4gICAgICAgICAgICAvLyByZW1vdmUgbWVudSBmcm9tIGNvbnRhaW5lclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcm9wZG93bkNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc01vYmlsZSkge1xuICAgICAgICAgICAgICAgICAgICAkKHdpbmRvdykub2ZmKFwic2Nyb2xsXCIgKyB0aGlzLm5zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bi5kZXRhY2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQudHJpZ2dlcihcImNsb3NlOmNvdW50cnlkcm9wZG93blwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gY2hlY2sgaWYgYW4gZWxlbWVudCBpcyB2aXNpYmxlIHdpdGhpbiBpdCdzIGNvbnRhaW5lciwgZWxzZSBzY3JvbGwgdW50aWwgaXQgaXNcbiAgICAgICAgX3Njcm9sbFRvOiBmdW5jdGlvbihlbGVtZW50LCBtaWRkbGUpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvdW50cnlMaXN0LCBjb250YWluZXJIZWlnaHQgPSBjb250YWluZXIuaGVpZ2h0KCksIGNvbnRhaW5lclRvcCA9IGNvbnRhaW5lci5vZmZzZXQoKS50b3AsIGNvbnRhaW5lckJvdHRvbSA9IGNvbnRhaW5lclRvcCArIGNvbnRhaW5lckhlaWdodCwgZWxlbWVudEhlaWdodCA9IGVsZW1lbnQub3V0ZXJIZWlnaHQoKSwgZWxlbWVudFRvcCA9IGVsZW1lbnQub2Zmc2V0KCkudG9wLCBlbGVtZW50Qm90dG9tID0gZWxlbWVudFRvcCArIGVsZW1lbnRIZWlnaHQsIG5ld1Njcm9sbFRvcCA9IGVsZW1lbnRUb3AgLSBjb250YWluZXJUb3AgKyBjb250YWluZXIuc2Nyb2xsVG9wKCksIG1pZGRsZU9mZnNldCA9IGNvbnRhaW5lckhlaWdodCAvIDIgLSBlbGVtZW50SGVpZ2h0IC8gMjtcbiAgICAgICAgICAgIGlmIChlbGVtZW50VG9wIDwgY29udGFpbmVyVG9wKSB7XG4gICAgICAgICAgICAgICAgLy8gc2Nyb2xsIHVwXG4gICAgICAgICAgICAgICAgaWYgKG1pZGRsZSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdTY3JvbGxUb3AgLT0gbWlkZGxlT2Zmc2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250YWluZXIuc2Nyb2xsVG9wKG5ld1Njcm9sbFRvcCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnRCb3R0b20gPiBjb250YWluZXJCb3R0b20pIHtcbiAgICAgICAgICAgICAgICAvLyBzY3JvbGwgZG93blxuICAgICAgICAgICAgICAgIGlmIChtaWRkbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3U2Nyb2xsVG9wICs9IG1pZGRsZU9mZnNldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodERpZmZlcmVuY2UgPSBjb250YWluZXJIZWlnaHQgLSBlbGVtZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5zY3JvbGxUb3AobmV3U2Nyb2xsVG9wIC0gaGVpZ2h0RGlmZmVyZW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHJlcGxhY2UgYW55IGV4aXN0aW5nIGRpYWwgY29kZSB3aXRoIHRoZSBuZXcgb25lXG4gICAgICAgIC8vIE5vdGU6IGNhbGxlZCBmcm9tIF9zZWxlY3RMaXN0SXRlbSBhbmQgc2V0Q291bnRyeVxuICAgICAgICBfdXBkYXRlRGlhbENvZGU6IGZ1bmN0aW9uKG5ld0RpYWxDb2RlLCBoYXNTZWxlY3RlZExpc3RJdGVtKSB7XG4gICAgICAgICAgICB2YXIgaW5wdXRWYWwgPSB0aGlzLnRlbElucHV0LnZhbCgpLCBuZXdOdW1iZXI7XG4gICAgICAgICAgICAvLyBzYXZlIGhhdmluZyB0byBwYXNzIHRoaXMgZXZlcnkgdGltZVxuICAgICAgICAgICAgbmV3RGlhbENvZGUgPSBcIitcIiArIG5ld0RpYWxDb2RlO1xuICAgICAgICAgICAgaWYgKGlucHV0VmFsLmNoYXJBdCgwKSA9PSBcIitcIikge1xuICAgICAgICAgICAgICAgIC8vIHRoZXJlJ3MgYSBwbHVzIHNvIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIHJlcGxhY2VtZW50IChkb2Vzbid0IG1hdHRlciBpZiBuYXRpb25hbE1vZGUgb3Igbm90KVxuICAgICAgICAgICAgICAgIHZhciBwcmV2RGlhbENvZGUgPSB0aGlzLl9nZXREaWFsQ29kZShpbnB1dFZhbCk7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZEaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjdXJyZW50IG51bWJlciBjb250YWlucyBhIHZhbGlkIGRpYWwgY29kZSwgc28gcmVwbGFjZSBpdFxuICAgICAgICAgICAgICAgICAgICBuZXdOdW1iZXIgPSBpbnB1dFZhbC5yZXBsYWNlKHByZXZEaWFsQ29kZSwgbmV3RGlhbENvZGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGN1cnJlbnQgbnVtYmVyIGNvbnRhaW5zIGFuIGludmFsaWQgZGlhbCBjb2RlLCBzbyBkaXRjaCBpdFxuICAgICAgICAgICAgICAgICAgICAvLyAobm8gd2F5IHRvIGRldGVybWluZSB3aGVyZSB0aGUgaW52YWxpZCBkaWFsIGNvZGUgZW5kcyBhbmQgdGhlIHJlc3Qgb2YgdGhlIG51bWJlciBiZWdpbnMpXG4gICAgICAgICAgICAgICAgICAgIG5ld051bWJlciA9IG5ld0RpYWxDb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLm5hdGlvbmFsTW9kZSB8fCB0aGlzLm9wdGlvbnMuc2VwYXJhdGVEaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgIC8vIGRvbid0IGRvIGFueXRoaW5nXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBuYXRpb25hbE1vZGUgaXMgZGlzYWJsZWRcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXRWYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlcmUgaXMgYW4gZXhpc3RpbmcgdmFsdWUgd2l0aCBubyBkaWFsIGNvZGU6IHByZWZpeCB0aGUgbmV3IGRpYWwgY29kZVxuICAgICAgICAgICAgICAgICAgICBuZXdOdW1iZXIgPSBuZXdEaWFsQ29kZSArIGlucHV0VmFsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFzU2VsZWN0ZWRMaXN0SXRlbSB8fCAhdGhpcy5vcHRpb25zLmF1dG9IaWRlRGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbm8gZXhpc3RpbmcgdmFsdWUgYW5kIGVpdGhlciB0aGV5J3ZlIGp1c3Qgc2VsZWN0ZWQgYSBsaXN0IGl0ZW0sIG9yIGF1dG9IaWRlRGlhbENvZGUgaXMgZGlzYWJsZWQ6IGluc2VydCBuZXcgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgICAgIG5ld051bWJlciA9IG5ld0RpYWxDb2RlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRlbElucHV0LnZhbChuZXdOdW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICAvLyB0cnkgYW5kIGV4dHJhY3QgYSB2YWxpZCBpbnRlcm5hdGlvbmFsIGRpYWwgY29kZSBmcm9tIGEgZnVsbCB0ZWxlcGhvbmUgbnVtYmVyXG4gICAgICAgIC8vIE5vdGU6IHJldHVybnMgdGhlIHJhdyBzdHJpbmcgaW5jIHBsdXMgY2hhcmFjdGVyIGFuZCBhbnkgd2hpdGVzcGFjZS9kb3RzIGV0Y1xuICAgICAgICBfZ2V0RGlhbENvZGU6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGRpYWxDb2RlID0gXCJcIjtcbiAgICAgICAgICAgIC8vIG9ubHkgaW50ZXJlc3RlZCBpbiBpbnRlcm5hdGlvbmFsIG51bWJlcnMgKHN0YXJ0aW5nIHdpdGggYSBwbHVzKVxuICAgICAgICAgICAgaWYgKG51bWJlci5jaGFyQXQoMCkgPT0gXCIrXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbnVtZXJpY0NoYXJzID0gXCJcIjtcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRlIG92ZXIgY2hhcnNcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IG51bWJlci5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGNoYXIgaXMgbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkLmlzTnVtZXJpYyhjKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJpY0NoYXJzICs9IGM7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBjdXJyZW50IG51bWVyaWNDaGFycyBtYWtlIGEgdmFsaWQgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jb3VudHJ5Q29kZXNbbnVtZXJpY0NoYXJzXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0b3JlIHRoZSBhY3R1YWwgcmF3IHN0cmluZyAodXNlZnVsIGZvciBtYXRjaGluZyBsYXRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWFsQ29kZSA9IG51bWJlci5zdWJzdHIoMCwgaSArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9uZ2VzdCBkaWFsIGNvZGUgaXMgNCBjaGFyc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG51bWVyaWNDaGFycy5sZW5ndGggPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRpYWxDb2RlO1xuICAgICAgICB9LFxuICAgICAgICAvLyBnZXQgdGhlIGlucHV0IHZhbCwgYWRkaW5nIHRoZSBkaWFsIGNvZGUgaWYgc2VwYXJhdGVEaWFsQ29kZSBpcyBlbmFibGVkXG4gICAgICAgIF9nZXRGdWxsTnVtYmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSAkLnRyaW0odGhpcy50ZWxJbnB1dC52YWwoKSksIGRpYWxDb2RlID0gdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlLCBwcmVmaXgsIG51bWVyaWNWYWwgPSB0aGlzLl9nZXROdW1lcmljKHZhbCksIC8vIG5vcm1hbGl6ZWQgbWVhbnMgZW5zdXJlIHN0YXJ0cyB3aXRoIGEgMSwgc28gd2UgY2FuIG1hdGNoIGFnYWluc3QgdGhlIGZ1bGwgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgbm9ybWFsaXplZFZhbCA9IG51bWVyaWNWYWwuY2hhckF0KDApID09IFwiMVwiID8gbnVtZXJpY1ZhbCA6IFwiMVwiICsgbnVtZXJpY1ZhbDtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2VwYXJhdGVEaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgIC8vIHdoZW4gdXNpbmcgc2VwYXJhdGVEaWFsQ29kZSwgaXQgaXMgdmlzaWJsZSBzbyBpcyBlZmZlY3RpdmVseSBwYXJ0IG9mIHRoZSB0eXBlZCBudW1iZXJcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBcIitcIiArIGRpYWxDb2RlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWwgJiYgdmFsLmNoYXJBdCgwKSAhPSBcIitcIiAmJiB2YWwuY2hhckF0KDApICE9IFwiMVwiICYmIGRpYWxDb2RlICYmIGRpYWxDb2RlLmNoYXJBdCgwKSA9PSBcIjFcIiAmJiBkaWFsQ29kZS5sZW5ndGggPT0gNCAmJiBkaWFsQ29kZSAhPSBub3JtYWxpemVkVmFsLnN1YnN0cigwLCA0KSkge1xuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSBuYXRpb25hbCBOQU5QIG51bWJlcnMgY29udGFpbiB0aGUgYXJlYSBjb2RlXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gZGlhbENvZGUuc3Vic3RyKDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIHZhbDtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gcmVtb3ZlIHRoZSBkaWFsIGNvZGUgaWYgc2VwYXJhdGVEaWFsQ29kZSBpcyBlbmFibGVkXG4gICAgICAgIF9iZWZvcmVTZXROdW1iZXI6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpYWxDb2RlID0gdGhpcy5fZ2V0RGlhbENvZGUobnVtYmVyKTtcbiAgICAgICAgICAgICAgICBpZiAoZGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVVMgZGlhbENvZGUgaXMgXCIrMVwiLCB3aGljaCBpcyB3aGF0IHdlIHdhbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gQ0EgZGlhbENvZGUgaXMgXCIrMSAxMjNcIiwgd2hpY2ggaXMgd3JvbmcgLSBzaG91bGQgYmUgXCIrMVwiIChhcyBpdCBoYXMgbXVsdGlwbGUgYXJlYSBjb2RlcylcbiAgICAgICAgICAgICAgICAgICAgLy8gQVMgZGlhbENvZGUgaXMgXCIrMSA2ODRcIiwgd2hpY2ggaXMgd2hhdCB3ZSB3YW50XG4gICAgICAgICAgICAgICAgICAgIC8vIFNvbHV0aW9uOiBpZiB0aGUgY291bnRyeSBoYXMgYXJlYSBjb2RlcywgdGhlbiByZXZlcnQgdG8ganVzdCB0aGUgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuYXJlYUNvZGVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWFsQ29kZSA9IFwiK1wiICsgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGEgbG90IG9mIG51bWJlcnMgd2lsbCBoYXZlIGEgc3BhY2Ugc2VwYXJhdGluZyB0aGUgZGlhbCBjb2RlIGFuZCB0aGUgbWFpbiBudW1iZXIsIGFuZCBzb21lIE5BTlAgbnVtYmVycyB3aWxsIGhhdmUgYSBoeXBoZW4gZS5nLiArMSA2ODQtNzMzLTEyMzQgLSBpbiBib3RoIGNhc2VzIHdlIHdhbnQgdG8gZ2V0IHJpZCBvZiBpdFxuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiBkb24ndCBqdXN0IHRyaW0gYWxsIG5vbi1udW1lcmljcyBhcyBtYXkgd2FudCB0byBwcmVzZXJ2ZSBhbiBvcGVuIHBhcmVudGhlc2lzIGV0Y1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSBudW1iZXJbZGlhbENvZGUubGVuZ3RoXSA9PT0gXCIgXCIgfHwgbnVtYmVyW2RpYWxDb2RlLmxlbmd0aF0gPT09IFwiLVwiID8gZGlhbENvZGUubGVuZ3RoICsgMSA6IGRpYWxDb2RlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnN1YnN0cihzdGFydCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhcChudW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICAvLyB0cmlnZ2VyIHRoZSAnY291bnRyeWNoYW5nZScgZXZlbnRcbiAgICAgICAgX3RyaWdnZXJDb3VudHJ5Q2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQudHJpZ2dlcihcImNvdW50cnljaGFuZ2VcIiwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAqICBTRUNSRVQgUFVCTElDIE1FVEhPRFNcbiAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuICAgICAgICAvLyB0aGlzIGlzIGNhbGxlZCB3aGVuIHRoZSBnZW9pcCBjYWxsIHJldHVybnNcbiAgICAgICAgaGFuZGxlQXV0b0NvdW50cnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbml0aWFsQ291bnRyeSA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBtdXN0IHNldCB0aGlzIGV2ZW4gaWYgdGhlcmUgaXMgYW4gaW5pdGlhbCB2YWwgaW4gdGhlIGlucHV0OiBpbiBjYXNlIHRoZSBpbml0aWFsIHZhbCBpcyBpbnZhbGlkIGFuZCB0aGV5IGRlbGV0ZSBpdCAtIHRoZXkgc2hvdWxkIHNlZSB0aGVpciBhdXRvIGNvdW50cnlcbiAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRDb3VudHJ5ID0gJC5mbltwbHVnaW5OYW1lXS5hdXRvQ291bnRyeTtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSdzIG5vIGluaXRpYWwgdmFsdWUgaW4gdGhlIGlucHV0LCB0aGVuIHVwZGF0ZSB0aGUgZmxhZ1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy50ZWxJbnB1dC52YWwoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldENvdW50cnkodGhpcy5kZWZhdWx0Q291bnRyeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvdW50cnlEZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHRoaXMgaXMgY2FsbGVkIHdoZW4gdGhlIHV0aWxzIHJlcXVlc3QgY29tcGxldGVzXG4gICAgICAgIGhhbmRsZVV0aWxzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoZSByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsXG4gICAgICAgICAgICBpZiAod2luZG93LmludGxUZWxJbnB1dFV0aWxzKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUncyBhbiBpbml0aWFsIHZhbHVlIGluIHRoZSBpbnB1dCwgdGhlbiBmb3JtYXQgaXRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50ZWxJbnB1dC52YWwoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVWYWxGcm9tTnVtYmVyKHRoaXMudGVsSW5wdXQudmFsKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVQbGFjZWhvbGRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy51dGlsc1NjcmlwdERlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAqICBQVUJMSUMgTUVUSE9EU1xuICAgICAgICAgKioqKioqKioqKioqKioqKioqKiovXG4gICAgICAgIC8vIHJlbW92ZSBwbHVnaW5cbiAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsbG93RHJvcGRvd24pIHtcbiAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIGRyb3Bkb3duIGlzIGNsb3NlZCAoYW5kIHVuYmluZCBsaXN0ZW5lcnMpXG4gICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VEcm9wZG93bigpO1xuICAgICAgICAgICAgICAgIC8vIGNsaWNrIGV2ZW50IHRvIG9wZW4gZHJvcGRvd25cbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkRmxhZ0lubmVyLnBhcmVudCgpLm9mZih0aGlzLm5zKTtcbiAgICAgICAgICAgICAgICAvLyBsYWJlbCBjbGljayBoYWNrXG4gICAgICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5jbG9zZXN0KFwibGFiZWxcIikub2ZmKHRoaXMubnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdW5iaW5kIHN1Ym1pdCBldmVudCBoYW5kbGVyIG9uIGZvcm1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b0hpZGVEaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgIHZhciBmb3JtID0gdGhpcy50ZWxJbnB1dC5wcm9wKFwiZm9ybVwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICAkKGZvcm0pLm9mZih0aGlzLm5zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB1bmJpbmQgYWxsIGV2ZW50czoga2V5IGV2ZW50cywgYW5kIGZvY3VzL2JsdXIgZXZlbnRzIGlmIGF1dG9IaWRlRGlhbENvZGU9dHJ1ZVxuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5vZmYodGhpcy5ucyk7XG4gICAgICAgICAgICAvLyByZW1vdmUgbWFya3VwIChidXQgbGVhdmUgdGhlIG9yaWdpbmFsIGlucHV0KVxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMudGVsSW5wdXQucGFyZW50KCk7XG4gICAgICAgICAgICBjb250YWluZXIuYmVmb3JlKHRoaXMudGVsSW5wdXQpLnJlbW92ZSgpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBnZXQgdGhlIGV4dGVuc2lvbiBmcm9tIHRoZSBjdXJyZW50IG51bWJlclxuICAgICAgICBnZXRFeHRlbnNpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5pbnRsVGVsSW5wdXRVdGlscykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnRsVGVsSW5wdXRVdGlscy5nZXRFeHRlbnNpb24odGhpcy5fZ2V0RnVsbE51bWJlcigpLCB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gZm9ybWF0IHRoZSBudW1iZXIgdG8gdGhlIGdpdmVuIGZvcm1hdFxuICAgICAgICBnZXROdW1iZXI6IGZ1bmN0aW9uKGZvcm1hdCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5pbnRsVGVsSW5wdXRVdGlscykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnRsVGVsSW5wdXRVdGlscy5mb3JtYXROdW1iZXIodGhpcy5fZ2V0RnVsbE51bWJlcigpLCB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMiwgZm9ybWF0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9LFxuICAgICAgICAvLyBnZXQgdGhlIHR5cGUgb2YgdGhlIGVudGVyZWQgbnVtYmVyIGUuZy4gbGFuZGxpbmUvbW9iaWxlXG4gICAgICAgIGdldE51bWJlclR5cGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5pbnRsVGVsSW5wdXRVdGlscykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnRsVGVsSW5wdXRVdGlscy5nZXROdW1iZXJUeXBlKHRoaXMuX2dldEZ1bGxOdW1iZXIoKSwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC05OTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gZ2V0IHRoZSBjb3VudHJ5IGRhdGEgZm9yIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZmxhZ1xuICAgICAgICBnZXRTZWxlY3RlZENvdW50cnlEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGE7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGdldCB0aGUgdmFsaWRhdGlvbiBlcnJvclxuICAgICAgICBnZXRWYWxpZGF0aW9uRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5pbnRsVGVsSW5wdXRVdGlscykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnRsVGVsSW5wdXRVdGlscy5nZXRWYWxpZGF0aW9uRXJyb3IodGhpcy5fZ2V0RnVsbE51bWJlcigpLCB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gLTk5O1xuICAgICAgICB9LFxuICAgICAgICAvLyB2YWxpZGF0ZSB0aGUgaW5wdXQgdmFsIC0gYXNzdW1lcyB0aGUgZ2xvYmFsIGZ1bmN0aW9uIGlzVmFsaWROdW1iZXIgKGZyb20gdXRpbHNTY3JpcHQpXG4gICAgICAgIGlzVmFsaWROdW1iZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbCA9ICQudHJpbSh0aGlzLl9nZXRGdWxsTnVtYmVyKCkpLCBjb3VudHJ5Q29kZSA9IHRoaXMub3B0aW9ucy5uYXRpb25hbE1vZGUgPyB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMiA6IFwiXCI7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmludGxUZWxJbnB1dFV0aWxzID8gaW50bFRlbElucHV0VXRpbHMuaXNWYWxpZE51bWJlcih2YWwsIGNvdW50cnlDb2RlKSA6IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgc2VsZWN0ZWQgZmxhZywgYW5kIHVwZGF0ZSB0aGUgaW5wdXQgdmFsIGFjY29yZGluZ2x5XG4gICAgICAgIHNldENvdW50cnk6IGZ1bmN0aW9uKGNvdW50cnlDb2RlKSB7XG4gICAgICAgICAgICBjb3VudHJ5Q29kZSA9IGNvdW50cnlDb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbHJlYWR5IHNlbGVjdGVkXG4gICAgICAgICAgICBpZiAoIXRoaXMuc2VsZWN0ZWRGbGFnSW5uZXIuaGFzQ2xhc3MoY291bnRyeUNvZGUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0RmxhZyhjb3VudHJ5Q29kZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlRGlhbENvZGUodGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdHJpZ2dlckNvdW50cnlDaGFuZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gc2V0IHRoZSBpbnB1dCB2YWx1ZSBhbmQgdXBkYXRlIHRoZSBmbGFnXG4gICAgICAgIHNldE51bWJlcjogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICAvLyB3ZSBtdXN0IHVwZGF0ZSB0aGUgZmxhZyBmaXJzdCwgd2hpY2ggdXBkYXRlcyB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEsIHdoaWNoIGlzIHVzZWQgZm9yIGZvcm1hdHRpbmcgdGhlIG51bWJlciBiZWZvcmUgZGlzcGxheWluZyBpdFxuICAgICAgICAgICAgdmFyIGZsYWdDaGFuZ2VkID0gdGhpcy5fdXBkYXRlRmxhZ0Zyb21OdW1iZXIobnVtYmVyKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZhbEZyb21OdW1iZXIobnVtYmVyKTtcbiAgICAgICAgICAgIGlmIChmbGFnQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RyaWdnZXJDb3VudHJ5Q2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHNldCB0aGUgcGxhY2Vob2xkZXIgbnVtYmVyIHR5cFxuICAgICAgICBzZXRQbGFjZWhvbGRlck51bWJlclR5cGU6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlck51bWJlclR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGxhY2Vob2xkZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gdXNpbmcgaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS1ib2lsZXJwbGF0ZS9qcXVlcnktYm9pbGVycGxhdGUvd2lraS9FeHRlbmRpbmctalF1ZXJ5LUJvaWxlcnBsYXRlXG4gICAgLy8gKGFkYXB0ZWQgdG8gYWxsb3cgcHVibGljIGZ1bmN0aW9ucylcbiAgICAkLmZuW3BsdWdpbk5hbWVdID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgLy8gSXMgdGhlIGZpcnN0IHBhcmFtZXRlciBhbiBvYmplY3QgKG9wdGlvbnMpLCBvciB3YXMgb21pdHRlZCxcbiAgICAgICAgLy8gaW5zdGFudGlhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIHBsdWdpbi5cbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2Ygb3B0aW9ucyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgLy8gY29sbGVjdCBhbGwgb2YgdGhlIGRlZmVycmVkIG9iamVjdHMgZm9yIGFsbCBpbnN0YW5jZXMgY3JlYXRlZCB3aXRoIHRoaXMgc2VsZWN0b3JcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoISQuZGF0YSh0aGlzLCBcInBsdWdpbl9cIiArIHBsdWdpbk5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBQbHVnaW4odGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnN0YW5jZURlZmVycmVkcyA9IGluc3RhbmNlLl9pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIG5vdyBoYXZlIDIgZGVmZmVyZWRzOiAxIGZvciBhdXRvIGNvdW50cnksIDEgZm9yIHV0aWxzIHNjcmlwdFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZHMucHVzaChpbnN0YW5jZURlZmVycmVkc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkcy5wdXNoKGluc3RhbmNlRGVmZXJyZWRzWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgJC5kYXRhKHRoaXMsIFwicGx1Z2luX1wiICsgcGx1Z2luTmFtZSwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSBwcm9taXNlIGZyb20gdGhlIFwibWFzdGVyXCIgZGVmZXJyZWQgb2JqZWN0IHRoYXQgdHJhY2tzIGFsbCB0aGUgb3RoZXJzXG4gICAgICAgICAgICByZXR1cm4gJC53aGVuLmFwcGx5KG51bGwsIGRlZmVycmVkcyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIgJiYgb3B0aW9uc1swXSAhPT0gXCJfXCIpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBmaXJzdCBwYXJhbWV0ZXIgaXMgYSBzdHJpbmcgYW5kIGl0IGRvZXNuJ3Qgc3RhcnRcbiAgICAgICAgICAgIC8vIHdpdGggYW4gdW5kZXJzY29yZSBvciBcImNvbnRhaW5zXCIgdGhlIGBpbml0YC1mdW5jdGlvbixcbiAgICAgICAgICAgIC8vIHRyZWF0IHRoaXMgYXMgYSBjYWxsIHRvIGEgcHVibGljIG1ldGhvZC5cbiAgICAgICAgICAgIC8vIENhY2hlIHRoZSBtZXRob2QgY2FsbCB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHJldHVybiBhIHZhbHVlXG4gICAgICAgICAgICB2YXIgcmV0dXJucztcbiAgICAgICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSAkLmRhdGEodGhpcywgXCJwbHVnaW5fXCIgKyBwbHVnaW5OYW1lKTtcbiAgICAgICAgICAgICAgICAvLyBUZXN0cyB0aGF0IHRoZXJlJ3MgYWxyZWFkeSBhIHBsdWdpbi1pbnN0YW5jZVxuICAgICAgICAgICAgICAgIC8vIGFuZCBjaGVja3MgdGhhdCB0aGUgcmVxdWVzdGVkIHB1YmxpYyBtZXRob2QgZXhpc3RzXG4gICAgICAgICAgICAgICAgaWYgKGluc3RhbmNlIGluc3RhbmNlb2YgUGx1Z2luICYmIHR5cGVvZiBpbnN0YW5jZVtvcHRpb25zXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENhbGwgdGhlIG1ldGhvZCBvZiBvdXIgcGx1Z2luIGluc3RhbmNlLFxuICAgICAgICAgICAgICAgICAgICAvLyBhbmQgcGFzcyBpdCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm5zID0gaW5zdGFuY2Vbb3B0aW9uc10uYXBwbHkoaW5zdGFuY2UsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MsIDEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQWxsb3cgaW5zdGFuY2VzIHRvIGJlIGRlc3Ryb3llZCB2aWEgdGhlICdkZXN0cm95JyBtZXRob2RcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucyA9PT0gXCJkZXN0cm95XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5kYXRhKHRoaXMsIFwicGx1Z2luX1wiICsgcGx1Z2luTmFtZSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZWFybGllciBjYWNoZWQgbWV0aG9kIGdpdmVzIGEgdmFsdWUgYmFjayByZXR1cm4gdGhlIHZhbHVlLFxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIHJldHVybiB0aGlzIHRvIHByZXNlcnZlIGNoYWluYWJpbGl0eS5cbiAgICAgICAgICAgIHJldHVybiByZXR1cm5zICE9PSB1bmRlZmluZWQgPyByZXR1cm5zIDogdGhpcztcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqKioqKioqKioqKioqKioqKioqXG4gICAgICogIFNUQVRJQyBNRVRIT0RTXG4gICAgICoqKioqKioqKioqKioqKioqKioqL1xuICAgIC8vIGdldCB0aGUgY291bnRyeSBkYXRhIG9iamVjdFxuICAgICQuZm5bcGx1Z2luTmFtZV0uZ2V0Q291bnRyeURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGFsbENvdW50cmllcztcbiAgICB9O1xuICAgIC8vIGxvYWQgdGhlIHV0aWxzIHNjcmlwdFxuICAgIC8vIChhc3N1bWVzIGl0IGhhcyBub3QgYWxyZWFkeSBsb2FkZWQgLSB3ZSBjaGVjayB0aGlzIGJlZm9yZSBjYWxsaW5nIHRoaXMgaW50ZXJuYWxseSlcbiAgICAvLyAoYWxzbyBhc3N1bWVzIHRoYXQgaWYgaXQgaXMgY2FsbGVkIG1hbnVhbGx5LCBpdCB3aWxsIG9ubHkgYmUgb25jZSBwZXIgcGFnZSlcbiAgICAkLmZuW3BsdWdpbk5hbWVdLmxvYWRVdGlscyA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgICAgLy8gMiBvcHRpb25zOlxuICAgICAgICAvLyAxKSBub3QgYWxyZWFkeSBzdGFydGVkIGxvYWRpbmcgKHN0YXJ0KVxuICAgICAgICAvLyAyKSBhbHJlYWR5IHN0YXJ0ZWQgbG9hZGluZyAoZG8gbm90aGluZyAtIGp1c3Qgd2FpdCBmb3IgbG9hZGluZyBjYWxsYmFjayB0byBmaXJlLCB3aGljaCB3aWxsIHRyaWdnZXIgaGFuZGxlVXRpbHMgb24gYWxsIGluc3RhbmNlcywgcmVzb2x2aW5nIGVhY2ggb2YgdGhlaXIgdXRpbHNTY3JpcHREZWZlcnJlZCBvYmplY3RzKVxuICAgICAgICBpZiAoISQuZm5bcGx1Z2luTmFtZV0uc3RhcnRlZExvYWRpbmdVdGlsc1NjcmlwdCkge1xuICAgICAgICAgICAgLy8gZG9uJ3QgZG8gdGhpcyB0d2ljZSFcbiAgICAgICAgICAgICQuZm5bcGx1Z2luTmFtZV0uc3RhcnRlZExvYWRpbmdVdGlsc1NjcmlwdCA9IHRydWU7XG4gICAgICAgICAgICAvLyBkb250IHVzZSAkLmdldFNjcmlwdCBhcyBpdCBwcmV2ZW50cyBjYWNoaW5nXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIGFqYXggRGVmZXJyZWQgb2JqZWN0LCBzbyBtYW51YWwgY2FsbHMgY2FuIGJlIGNoYWluZWQgd2l0aCAudGhlbihjYWxsYmFjaylcbiAgICAgICAgICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgdXJsOiBwYXRoLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGVsbCBhbGwgaW5zdGFuY2VzIHRoYXQgdGhlIHV0aWxzIHJlcXVlc3QgaXMgY29tcGxldGVcbiAgICAgICAgICAgICAgICAgICAgJChcIi5pbnRsLXRlbC1pbnB1dCBpbnB1dFwiKS5pbnRsVGVsSW5wdXQoXCJoYW5kbGVVdGlsc1wiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcInNjcmlwdFwiLFxuICAgICAgICAgICAgICAgIGNhY2hlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIC8vIGRlZmF1bHQgb3B0aW9uc1xuICAgICQuZm5bcGx1Z2luTmFtZV0uZGVmYXVsdHMgPSBkZWZhdWx0cztcbiAgICAvLyB2ZXJzaW9uXG4gICAgJC5mbltwbHVnaW5OYW1lXS52ZXJzaW9uID0gXCIxMy4wLjBcIjtcbiAgICAvLyBBcnJheSBvZiBjb3VudHJ5IG9iamVjdHMgZm9yIHRoZSBmbGFnIGRyb3Bkb3duLlxuICAgIC8vIEhlcmUgaXMgdGhlIGNyaXRlcmlhIGZvciB0aGUgcGx1Z2luIHRvIHN1cHBvcnQgYSBnaXZlbiBjb3VudHJ5L3RlcnJpdG9yeVxuICAgIC8vIC0gSXQgaGFzIGFuIGlzbzIgY29kZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPXzMxNjYtMV9hbHBoYS0yXG4gICAgLy8gLSBJdCBoYXMgaXQncyBvd24gY291bnRyeSBjYWxsaW5nIGNvZGUgKGl0IGlzIG5vdCBhIHN1Yi1yZWdpb24gb2YgYW5vdGhlciBjb3VudHJ5KTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGlzdF9vZl9jb3VudHJ5X2NhbGxpbmdfY29kZXNcbiAgICAvLyAtIEl0IGhhcyBhIGZsYWcgaW4gdGhlIHJlZ2lvbi1mbGFncyBwcm9qZWN0OiBodHRwczovL2dpdGh1Yi5jb20vYmVoZGFkL3JlZ2lvbi1mbGFncy90cmVlL2doLXBhZ2VzL3BuZ1xuICAgIC8vIC0gSXQgaXMgc3VwcG9ydGVkIGJ5IGxpYnBob25lbnVtYmVyIChpdCBtdXN0IGJlIGxpc3RlZCBvbiB0aGlzIHBhZ2UpOiBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlaTE4bi9saWJwaG9uZW51bWJlci9ibG9iL21hc3Rlci9yZXNvdXJjZXMvU2hvcnROdW1iZXJNZXRhZGF0YS54bWxcbiAgICAvLyBFYWNoIGNvdW50cnkgYXJyYXkgaGFzIHRoZSBmb2xsb3dpbmcgaW5mb3JtYXRpb246XG4gICAgLy8gW1xuICAgIC8vICAgIENvdW50cnkgbmFtZSxcbiAgICAvLyAgICBpc28yIGNvZGUsXG4gICAgLy8gICAgSW50ZXJuYXRpb25hbCBkaWFsIGNvZGUsXG4gICAgLy8gICAgT3JkZXIgKGlmID4xIGNvdW50cnkgd2l0aCBzYW1lIGRpYWwgY29kZSksXG4gICAgLy8gICAgQXJlYSBjb2Rlc1xuICAgIC8vIF1cbiAgICB2YXIgYWxsQ291bnRyaWVzID0gWyBbIFwiQWZnaGFuaXN0YW4gKOKAq9in2YHYutin2YbYs9iq2KfZhuKArOKAjilcIiwgXCJhZlwiLCBcIjkzXCIgXSwgWyBcIkFsYmFuaWEgKFNocWlww6tyaSlcIiwgXCJhbFwiLCBcIjM1NVwiIF0sIFsgXCJBbGdlcmlhICjigKvYp9mE2KzYstin2KbYseKArOKAjilcIiwgXCJkelwiLCBcIjIxM1wiIF0sIFsgXCJBbWVyaWNhbiBTYW1vYVwiLCBcImFzXCIsIFwiMTY4NFwiIF0sIFsgXCJBbmRvcnJhXCIsIFwiYWRcIiwgXCIzNzZcIiBdLCBbIFwiQW5nb2xhXCIsIFwiYW9cIiwgXCIyNDRcIiBdLCBbIFwiQW5ndWlsbGFcIiwgXCJhaVwiLCBcIjEyNjRcIiBdLCBbIFwiQW50aWd1YSBhbmQgQmFyYnVkYVwiLCBcImFnXCIsIFwiMTI2OFwiIF0sIFsgXCJBcmdlbnRpbmFcIiwgXCJhclwiLCBcIjU0XCIgXSwgWyBcIkFybWVuaWEgKNWA1aHVtdWh1b3Vv9Wh1bYpXCIsIFwiYW1cIiwgXCIzNzRcIiBdLCBbIFwiQXJ1YmFcIiwgXCJhd1wiLCBcIjI5N1wiIF0sIFsgXCJBdXN0cmFsaWFcIiwgXCJhdVwiLCBcIjYxXCIsIDAgXSwgWyBcIkF1c3RyaWEgKMOWc3RlcnJlaWNoKVwiLCBcImF0XCIsIFwiNDNcIiBdLCBbIFwiQXplcmJhaWphbiAoQXrJmXJiYXljYW4pXCIsIFwiYXpcIiwgXCI5OTRcIiBdLCBbIFwiQmFoYW1hc1wiLCBcImJzXCIsIFwiMTI0MlwiIF0sIFsgXCJCYWhyYWluICjigKvYp9mE2KjYrdix2YrZhuKArOKAjilcIiwgXCJiaFwiLCBcIjk3M1wiIF0sIFsgXCJCYW5nbGFkZXNoICjgpqzgpr7gpoLgprLgpr7gpqbgp4fgprYpXCIsIFwiYmRcIiwgXCI4ODBcIiBdLCBbIFwiQmFyYmFkb3NcIiwgXCJiYlwiLCBcIjEyNDZcIiBdLCBbIFwiQmVsYXJ1cyAo0JHQtdC70LDRgNGD0YHRjClcIiwgXCJieVwiLCBcIjM3NVwiIF0sIFsgXCJCZWxnaXVtIChCZWxnacOrKVwiLCBcImJlXCIsIFwiMzJcIiBdLCBbIFwiQmVsaXplXCIsIFwiYnpcIiwgXCI1MDFcIiBdLCBbIFwiQmVuaW4gKELDqW5pbilcIiwgXCJialwiLCBcIjIyOVwiIF0sIFsgXCJCZXJtdWRhXCIsIFwiYm1cIiwgXCIxNDQxXCIgXSwgWyBcIkJodXRhbiAo4L2g4L2W4L6y4L204L2CKVwiLCBcImJ0XCIsIFwiOTc1XCIgXSwgWyBcIkJvbGl2aWFcIiwgXCJib1wiLCBcIjU5MVwiIF0sIFsgXCJCb3NuaWEgYW5kIEhlcnplZ292aW5hICjQkdC+0YHQvdCwINC4INCl0LXRgNGG0LXQs9C+0LLQuNC90LApXCIsIFwiYmFcIiwgXCIzODdcIiBdLCBbIFwiQm90c3dhbmFcIiwgXCJid1wiLCBcIjI2N1wiIF0sIFsgXCJCcmF6aWwgKEJyYXNpbClcIiwgXCJiclwiLCBcIjU1XCIgXSwgWyBcIkJyaXRpc2ggSW5kaWFuIE9jZWFuIFRlcnJpdG9yeVwiLCBcImlvXCIsIFwiMjQ2XCIgXSwgWyBcIkJyaXRpc2ggVmlyZ2luIElzbGFuZHNcIiwgXCJ2Z1wiLCBcIjEyODRcIiBdLCBbIFwiQnJ1bmVpXCIsIFwiYm5cIiwgXCI2NzNcIiBdLCBbIFwiQnVsZ2FyaWEgKNCR0YrQu9Cz0LDRgNC40Y8pXCIsIFwiYmdcIiwgXCIzNTlcIiBdLCBbIFwiQnVya2luYSBGYXNvXCIsIFwiYmZcIiwgXCIyMjZcIiBdLCBbIFwiQnVydW5kaSAoVWJ1cnVuZGkpXCIsIFwiYmlcIiwgXCIyNTdcIiBdLCBbIFwiQ2FtYm9kaWEgKOGegOGemOGfkuGeluGeu+Geh+GetilcIiwgXCJraFwiLCBcIjg1NVwiIF0sIFsgXCJDYW1lcm9vbiAoQ2FtZXJvdW4pXCIsIFwiY21cIiwgXCIyMzdcIiBdLCBbIFwiQ2FuYWRhXCIsIFwiY2FcIiwgXCIxXCIsIDEsIFsgXCIyMDRcIiwgXCIyMjZcIiwgXCIyMzZcIiwgXCIyNDlcIiwgXCIyNTBcIiwgXCIyODlcIiwgXCIzMDZcIiwgXCIzNDNcIiwgXCIzNjVcIiwgXCIzODdcIiwgXCI0MDNcIiwgXCI0MTZcIiwgXCI0MThcIiwgXCI0MzFcIiwgXCI0MzdcIiwgXCI0MzhcIiwgXCI0NTBcIiwgXCI1MDZcIiwgXCI1MTRcIiwgXCI1MTlcIiwgXCI1NDhcIiwgXCI1NzlcIiwgXCI1ODFcIiwgXCI1ODdcIiwgXCI2MDRcIiwgXCI2MTNcIiwgXCI2MzlcIiwgXCI2NDdcIiwgXCI2NzJcIiwgXCI3MDVcIiwgXCI3MDlcIiwgXCI3NDJcIiwgXCI3NzhcIiwgXCI3ODBcIiwgXCI3ODJcIiwgXCI4MDdcIiwgXCI4MTlcIiwgXCI4MjVcIiwgXCI4NjdcIiwgXCI4NzNcIiwgXCI5MDJcIiwgXCI5MDVcIiBdIF0sIFsgXCJDYXBlIFZlcmRlIChLYWJ1IFZlcmRpKVwiLCBcImN2XCIsIFwiMjM4XCIgXSwgWyBcIkNhcmliYmVhbiBOZXRoZXJsYW5kc1wiLCBcImJxXCIsIFwiNTk5XCIsIDEgXSwgWyBcIkNheW1hbiBJc2xhbmRzXCIsIFwia3lcIiwgXCIxMzQ1XCIgXSwgWyBcIkNlbnRyYWwgQWZyaWNhbiBSZXB1YmxpYyAoUsOpcHVibGlxdWUgY2VudHJhZnJpY2FpbmUpXCIsIFwiY2ZcIiwgXCIyMzZcIiBdLCBbIFwiQ2hhZCAoVGNoYWQpXCIsIFwidGRcIiwgXCIyMzVcIiBdLCBbIFwiQ2hpbGVcIiwgXCJjbFwiLCBcIjU2XCIgXSwgWyBcIkNoaW5hICjkuK3lm70pXCIsIFwiY25cIiwgXCI4NlwiIF0sIFsgXCJDaHJpc3RtYXMgSXNsYW5kXCIsIFwiY3hcIiwgXCI2MVwiLCAyIF0sIFsgXCJDb2NvcyAoS2VlbGluZykgSXNsYW5kc1wiLCBcImNjXCIsIFwiNjFcIiwgMSBdLCBbIFwiQ29sb21iaWFcIiwgXCJjb1wiLCBcIjU3XCIgXSwgWyBcIkNvbW9yb3MgKOKAq9is2LLYsSDYp9mE2YLZhdix4oCs4oCOKVwiLCBcImttXCIsIFwiMjY5XCIgXSwgWyBcIkNvbmdvIChEUkMpIChKYW1odXJpIHlhIEtpZGVtb2tyYXNpYSB5YSBLb25nbylcIiwgXCJjZFwiLCBcIjI0M1wiIF0sIFsgXCJDb25nbyAoUmVwdWJsaWMpIChDb25nby1CcmF6emF2aWxsZSlcIiwgXCJjZ1wiLCBcIjI0MlwiIF0sIFsgXCJDb29rIElzbGFuZHNcIiwgXCJja1wiLCBcIjY4MlwiIF0sIFsgXCJDb3N0YSBSaWNhXCIsIFwiY3JcIiwgXCI1MDZcIiBdLCBbIFwiQ8O0dGUgZOKAmUl2b2lyZVwiLCBcImNpXCIsIFwiMjI1XCIgXSwgWyBcIkNyb2F0aWEgKEhydmF0c2thKVwiLCBcImhyXCIsIFwiMzg1XCIgXSwgWyBcIkN1YmFcIiwgXCJjdVwiLCBcIjUzXCIgXSwgWyBcIkN1cmHDp2FvXCIsIFwiY3dcIiwgXCI1OTlcIiwgMCBdLCBbIFwiQ3lwcnVzICjOms+Nz4DPgc6/z4IpXCIsIFwiY3lcIiwgXCIzNTdcIiBdLCBbIFwiQ3plY2ggUmVwdWJsaWMgKMSMZXNrw6EgcmVwdWJsaWthKVwiLCBcImN6XCIsIFwiNDIwXCIgXSwgWyBcIkRlbm1hcmsgKERhbm1hcmspXCIsIFwiZGtcIiwgXCI0NVwiIF0sIFsgXCJEamlib3V0aVwiLCBcImRqXCIsIFwiMjUzXCIgXSwgWyBcIkRvbWluaWNhXCIsIFwiZG1cIiwgXCIxNzY3XCIgXSwgWyBcIkRvbWluaWNhbiBSZXB1YmxpYyAoUmVww7pibGljYSBEb21pbmljYW5hKVwiLCBcImRvXCIsIFwiMVwiLCAyLCBbIFwiODA5XCIsIFwiODI5XCIsIFwiODQ5XCIgXSBdLCBbIFwiRWN1YWRvclwiLCBcImVjXCIsIFwiNTkzXCIgXSwgWyBcIkVneXB0ICjigKvZhdi12LHigKzigI4pXCIsIFwiZWdcIiwgXCIyMFwiIF0sIFsgXCJFbCBTYWx2YWRvclwiLCBcInN2XCIsIFwiNTAzXCIgXSwgWyBcIkVxdWF0b3JpYWwgR3VpbmVhIChHdWluZWEgRWN1YXRvcmlhbClcIiwgXCJncVwiLCBcIjI0MFwiIF0sIFsgXCJFcml0cmVhXCIsIFwiZXJcIiwgXCIyOTFcIiBdLCBbIFwiRXN0b25pYSAoRWVzdGkpXCIsIFwiZWVcIiwgXCIzNzJcIiBdLCBbIFwiRXRoaW9waWFcIiwgXCJldFwiLCBcIjI1MVwiIF0sIFsgXCJGYWxrbGFuZCBJc2xhbmRzIChJc2xhcyBNYWx2aW5hcylcIiwgXCJma1wiLCBcIjUwMFwiIF0sIFsgXCJGYXJvZSBJc2xhbmRzIChGw7hyb3lhcilcIiwgXCJmb1wiLCBcIjI5OFwiIF0sIFsgXCJGaWppXCIsIFwiZmpcIiwgXCI2NzlcIiBdLCBbIFwiRmlubGFuZCAoU3VvbWkpXCIsIFwiZmlcIiwgXCIzNThcIiwgMCBdLCBbIFwiRnJhbmNlXCIsIFwiZnJcIiwgXCIzM1wiIF0sIFsgXCJGcmVuY2ggR3VpYW5hIChHdXlhbmUgZnJhbsOnYWlzZSlcIiwgXCJnZlwiLCBcIjU5NFwiIF0sIFsgXCJGcmVuY2ggUG9seW5lc2lhIChQb2x5bsOpc2llIGZyYW7Dp2Fpc2UpXCIsIFwicGZcIiwgXCI2ODlcIiBdLCBbIFwiR2Fib25cIiwgXCJnYVwiLCBcIjI0MVwiIF0sIFsgXCJHYW1iaWFcIiwgXCJnbVwiLCBcIjIyMFwiIF0sIFsgXCJHZW9yZ2lhICjhg6Hhg5Dhg6Xhg5Dhg6Dhg5fhg5Xhg5Thg5rhg50pXCIsIFwiZ2VcIiwgXCI5OTVcIiBdLCBbIFwiR2VybWFueSAoRGV1dHNjaGxhbmQpXCIsIFwiZGVcIiwgXCI0OVwiIF0sIFsgXCJHaGFuYSAoR2FhbmEpXCIsIFwiZ2hcIiwgXCIyMzNcIiBdLCBbIFwiR2licmFsdGFyXCIsIFwiZ2lcIiwgXCIzNTBcIiBdLCBbIFwiR3JlZWNlICjOlc67zrvOrM60zrEpXCIsIFwiZ3JcIiwgXCIzMFwiIF0sIFsgXCJHcmVlbmxhbmQgKEthbGFhbGxpdCBOdW5hYXQpXCIsIFwiZ2xcIiwgXCIyOTlcIiBdLCBbIFwiR3JlbmFkYVwiLCBcImdkXCIsIFwiMTQ3M1wiIF0sIFsgXCJHdWFkZWxvdXBlXCIsIFwiZ3BcIiwgXCI1OTBcIiwgMCBdLCBbIFwiR3VhbVwiLCBcImd1XCIsIFwiMTY3MVwiIF0sIFsgXCJHdWF0ZW1hbGFcIiwgXCJndFwiLCBcIjUwMlwiIF0sIFsgXCJHdWVybnNleVwiLCBcImdnXCIsIFwiNDRcIiwgMSBdLCBbIFwiR3VpbmVhIChHdWluw6llKVwiLCBcImduXCIsIFwiMjI0XCIgXSwgWyBcIkd1aW5lYS1CaXNzYXUgKEd1aW7DqSBCaXNzYXUpXCIsIFwiZ3dcIiwgXCIyNDVcIiBdLCBbIFwiR3V5YW5hXCIsIFwiZ3lcIiwgXCI1OTJcIiBdLCBbIFwiSGFpdGlcIiwgXCJodFwiLCBcIjUwOVwiIF0sIFsgXCJIb25kdXJhc1wiLCBcImhuXCIsIFwiNTA0XCIgXSwgWyBcIkhvbmcgS29uZyAo6aaZ5rivKVwiLCBcImhrXCIsIFwiODUyXCIgXSwgWyBcIkh1bmdhcnkgKE1hZ3lhcm9yc3rDoWcpXCIsIFwiaHVcIiwgXCIzNlwiIF0sIFsgXCJJY2VsYW5kICjDjXNsYW5kKVwiLCBcImlzXCIsIFwiMzU0XCIgXSwgWyBcIkluZGlhICjgpK3gpL7gpLDgpKQpXCIsIFwiaW5cIiwgXCI5MVwiIF0sIFsgXCJJbmRvbmVzaWFcIiwgXCJpZFwiLCBcIjYyXCIgXSwgWyBcIklyYW4gKOKAq9in24zYsdin2YbigKzigI4pXCIsIFwiaXJcIiwgXCI5OFwiIF0sIFsgXCJJcmFxICjigKvYp9mE2LnYsdin2YLigKzigI4pXCIsIFwiaXFcIiwgXCI5NjRcIiBdLCBbIFwiSXJlbGFuZFwiLCBcImllXCIsIFwiMzUzXCIgXSwgWyBcIklzbGUgb2YgTWFuXCIsIFwiaW1cIiwgXCI0NFwiLCAyIF0sIFsgXCJJc3JhZWwgKOKAq9eZ16nXqNeQ15zigKzigI4pXCIsIFwiaWxcIiwgXCI5NzJcIiBdLCBbIFwiSXRhbHkgKEl0YWxpYSlcIiwgXCJpdFwiLCBcIjM5XCIsIDAgXSwgWyBcIkphbWFpY2FcIiwgXCJqbVwiLCBcIjFcIiwgNCwgWyBcIjg3NlwiLCBcIjY1OFwiIF0gXSwgWyBcIkphcGFuICjml6XmnKwpXCIsIFwianBcIiwgXCI4MVwiIF0sIFsgXCJKZXJzZXlcIiwgXCJqZVwiLCBcIjQ0XCIsIDMgXSwgWyBcIkpvcmRhbiAo4oCr2KfZhNij2LHYr9mG4oCs4oCOKVwiLCBcImpvXCIsIFwiOTYyXCIgXSwgWyBcIkthemFraHN0YW4gKNCa0LDQt9Cw0YXRgdGC0LDQvSlcIiwgXCJrelwiLCBcIjdcIiwgMSBdLCBbIFwiS2VueWFcIiwgXCJrZVwiLCBcIjI1NFwiIF0sIFsgXCJLaXJpYmF0aVwiLCBcImtpXCIsIFwiNjg2XCIgXSwgWyBcIktvc292b1wiLCBcInhrXCIsIFwiMzgzXCIgXSwgWyBcIkt1d2FpdCAo4oCr2KfZhNmD2YjZitiq4oCs4oCOKVwiLCBcImt3XCIsIFwiOTY1XCIgXSwgWyBcIkt5cmd5enN0YW4gKNCa0YvRgNCz0YvQt9GB0YLQsNC9KVwiLCBcImtnXCIsIFwiOTk2XCIgXSwgWyBcIkxhb3MgKOC6peC6suC6pylcIiwgXCJsYVwiLCBcIjg1NlwiIF0sIFsgXCJMYXR2aWEgKExhdHZpamEpXCIsIFwibHZcIiwgXCIzNzFcIiBdLCBbIFwiTGViYW5vbiAo4oCr2YTYqNmG2KfZhuKArOKAjilcIiwgXCJsYlwiLCBcIjk2MVwiIF0sIFsgXCJMZXNvdGhvXCIsIFwibHNcIiwgXCIyNjZcIiBdLCBbIFwiTGliZXJpYVwiLCBcImxyXCIsIFwiMjMxXCIgXSwgWyBcIkxpYnlhICjigKvZhNmK2KjZitin4oCs4oCOKVwiLCBcImx5XCIsIFwiMjE4XCIgXSwgWyBcIkxpZWNodGVuc3RlaW5cIiwgXCJsaVwiLCBcIjQyM1wiIF0sIFsgXCJMaXRodWFuaWEgKExpZXR1dmEpXCIsIFwibHRcIiwgXCIzNzBcIiBdLCBbIFwiTHV4ZW1ib3VyZ1wiLCBcImx1XCIsIFwiMzUyXCIgXSwgWyBcIk1hY2F1ICjmvrPploApXCIsIFwibW9cIiwgXCI4NTNcIiBdLCBbIFwiTWFjZWRvbmlhIChGWVJPTSkgKNCc0LDQutC10LTQvtC90LjRmNCwKVwiLCBcIm1rXCIsIFwiMzg5XCIgXSwgWyBcIk1hZGFnYXNjYXIgKE1hZGFnYXNpa2FyYSlcIiwgXCJtZ1wiLCBcIjI2MVwiIF0sIFsgXCJNYWxhd2lcIiwgXCJtd1wiLCBcIjI2NVwiIF0sIFsgXCJNYWxheXNpYVwiLCBcIm15XCIsIFwiNjBcIiBdLCBbIFwiTWFsZGl2ZXNcIiwgXCJtdlwiLCBcIjk2MFwiIF0sIFsgXCJNYWxpXCIsIFwibWxcIiwgXCIyMjNcIiBdLCBbIFwiTWFsdGFcIiwgXCJtdFwiLCBcIjM1NlwiIF0sIFsgXCJNYXJzaGFsbCBJc2xhbmRzXCIsIFwibWhcIiwgXCI2OTJcIiBdLCBbIFwiTWFydGluaXF1ZVwiLCBcIm1xXCIsIFwiNTk2XCIgXSwgWyBcIk1hdXJpdGFuaWEgKOKAq9mF2YjYsdmK2KrYp9mG2YrYp+KArOKAjilcIiwgXCJtclwiLCBcIjIyMlwiIF0sIFsgXCJNYXVyaXRpdXMgKE1vcmlzKVwiLCBcIm11XCIsIFwiMjMwXCIgXSwgWyBcIk1heW90dGVcIiwgXCJ5dFwiLCBcIjI2MlwiLCAxIF0sIFsgXCJNZXhpY28gKE3DqXhpY28pXCIsIFwibXhcIiwgXCI1MlwiIF0sIFsgXCJNaWNyb25lc2lhXCIsIFwiZm1cIiwgXCI2OTFcIiBdLCBbIFwiTW9sZG92YSAoUmVwdWJsaWNhIE1vbGRvdmEpXCIsIFwibWRcIiwgXCIzNzNcIiBdLCBbIFwiTW9uYWNvXCIsIFwibWNcIiwgXCIzNzdcIiBdLCBbIFwiTW9uZ29saWEgKNCc0L7QvdCz0L7QuylcIiwgXCJtblwiLCBcIjk3NlwiIF0sIFsgXCJNb250ZW5lZ3JvIChDcm5hIEdvcmEpXCIsIFwibWVcIiwgXCIzODJcIiBdLCBbIFwiTW9udHNlcnJhdFwiLCBcIm1zXCIsIFwiMTY2NFwiIF0sIFsgXCJNb3JvY2NvICjigKvYp9mE2YXYutix2KjigKzigI4pXCIsIFwibWFcIiwgXCIyMTJcIiwgMCBdLCBbIFwiTW96YW1iaXF1ZSAoTW/Dp2FtYmlxdWUpXCIsIFwibXpcIiwgXCIyNThcIiBdLCBbIFwiTXlhbm1hciAoQnVybWEpICjhgJnhgLzhgJThgLrhgJnhgKwpXCIsIFwibW1cIiwgXCI5NVwiIF0sIFsgXCJOYW1pYmlhIChOYW1pYmnDqylcIiwgXCJuYVwiLCBcIjI2NFwiIF0sIFsgXCJOYXVydVwiLCBcIm5yXCIsIFwiNjc0XCIgXSwgWyBcIk5lcGFsICjgpKjgpYfgpKrgpL7gpLIpXCIsIFwibnBcIiwgXCI5NzdcIiBdLCBbIFwiTmV0aGVybGFuZHMgKE5lZGVybGFuZClcIiwgXCJubFwiLCBcIjMxXCIgXSwgWyBcIk5ldyBDYWxlZG9uaWEgKE5vdXZlbGxlLUNhbMOpZG9uaWUpXCIsIFwibmNcIiwgXCI2ODdcIiBdLCBbIFwiTmV3IFplYWxhbmRcIiwgXCJuelwiLCBcIjY0XCIgXSwgWyBcIk5pY2FyYWd1YVwiLCBcIm5pXCIsIFwiNTA1XCIgXSwgWyBcIk5pZ2VyIChOaWphcilcIiwgXCJuZVwiLCBcIjIyN1wiIF0sIFsgXCJOaWdlcmlhXCIsIFwibmdcIiwgXCIyMzRcIiBdLCBbIFwiTml1ZVwiLCBcIm51XCIsIFwiNjgzXCIgXSwgWyBcIk5vcmZvbGsgSXNsYW5kXCIsIFwibmZcIiwgXCI2NzJcIiBdLCBbIFwiTm9ydGggS29yZWEgKOyhsOyEoCDrr7zso7zso7zsnZgg7J2466+8IOqzte2ZlOq1rSlcIiwgXCJrcFwiLCBcIjg1MFwiIF0sIFsgXCJOb3J0aGVybiBNYXJpYW5hIElzbGFuZHNcIiwgXCJtcFwiLCBcIjE2NzBcIiBdLCBbIFwiTm9yd2F5IChOb3JnZSlcIiwgXCJub1wiLCBcIjQ3XCIsIDAgXSwgWyBcIk9tYW4gKOKAq9i52Y/Zhdin2YbigKzigI4pXCIsIFwib21cIiwgXCI5NjhcIiBdLCBbIFwiUGFraXN0YW4gKOKAq9m+2Kfaqdiz2KrYp9mG4oCs4oCOKVwiLCBcInBrXCIsIFwiOTJcIiBdLCBbIFwiUGFsYXVcIiwgXCJwd1wiLCBcIjY4MFwiIF0sIFsgXCJQYWxlc3RpbmUgKOKAq9mB2YTYs9i32YrZhuKArOKAjilcIiwgXCJwc1wiLCBcIjk3MFwiIF0sIFsgXCJQYW5hbWEgKFBhbmFtw6EpXCIsIFwicGFcIiwgXCI1MDdcIiBdLCBbIFwiUGFwdWEgTmV3IEd1aW5lYVwiLCBcInBnXCIsIFwiNjc1XCIgXSwgWyBcIlBhcmFndWF5XCIsIFwicHlcIiwgXCI1OTVcIiBdLCBbIFwiUGVydSAoUGVyw7opXCIsIFwicGVcIiwgXCI1MVwiIF0sIFsgXCJQaGlsaXBwaW5lc1wiLCBcInBoXCIsIFwiNjNcIiBdLCBbIFwiUG9sYW5kIChQb2xza2EpXCIsIFwicGxcIiwgXCI0OFwiIF0sIFsgXCJQb3J0dWdhbFwiLCBcInB0XCIsIFwiMzUxXCIgXSwgWyBcIlB1ZXJ0byBSaWNvXCIsIFwicHJcIiwgXCIxXCIsIDMsIFsgXCI3ODdcIiwgXCI5MzlcIiBdIF0sIFsgXCJRYXRhciAo4oCr2YLYt9ix4oCs4oCOKVwiLCBcInFhXCIsIFwiOTc0XCIgXSwgWyBcIlLDqXVuaW9uIChMYSBSw6l1bmlvbilcIiwgXCJyZVwiLCBcIjI2MlwiLCAwIF0sIFsgXCJSb21hbmlhIChSb23Dom5pYSlcIiwgXCJyb1wiLCBcIjQwXCIgXSwgWyBcIlJ1c3NpYSAo0KDQvtGB0YHQuNGPKVwiLCBcInJ1XCIsIFwiN1wiLCAwIF0sIFsgXCJSd2FuZGFcIiwgXCJyd1wiLCBcIjI1MFwiIF0sIFsgXCJTYWludCBCYXJ0aMOpbGVteVwiLCBcImJsXCIsIFwiNTkwXCIsIDEgXSwgWyBcIlNhaW50IEhlbGVuYVwiLCBcInNoXCIsIFwiMjkwXCIgXSwgWyBcIlNhaW50IEtpdHRzIGFuZCBOZXZpc1wiLCBcImtuXCIsIFwiMTg2OVwiIF0sIFsgXCJTYWludCBMdWNpYVwiLCBcImxjXCIsIFwiMTc1OFwiIF0sIFsgXCJTYWludCBNYXJ0aW4gKFNhaW50LU1hcnRpbiAocGFydGllIGZyYW7Dp2Fpc2UpKVwiLCBcIm1mXCIsIFwiNTkwXCIsIDIgXSwgWyBcIlNhaW50IFBpZXJyZSBhbmQgTWlxdWVsb24gKFNhaW50LVBpZXJyZS1ldC1NaXF1ZWxvbilcIiwgXCJwbVwiLCBcIjUwOFwiIF0sIFsgXCJTYWludCBWaW5jZW50IGFuZCB0aGUgR3JlbmFkaW5lc1wiLCBcInZjXCIsIFwiMTc4NFwiIF0sIFsgXCJTYW1vYVwiLCBcIndzXCIsIFwiNjg1XCIgXSwgWyBcIlNhbiBNYXJpbm9cIiwgXCJzbVwiLCBcIjM3OFwiIF0sIFsgXCJTw6NvIFRvbcOpIGFuZCBQcsOtbmNpcGUgKFPDo28gVG9tw6kgZSBQcsOtbmNpcGUpXCIsIFwic3RcIiwgXCIyMzlcIiBdLCBbIFwiU2F1ZGkgQXJhYmlhICjigKvYp9mE2YXZhdmE2YPYqSDYp9mE2LnYsdio2YrYqSDYp9mE2LPYudmI2K/Zitip4oCs4oCOKVwiLCBcInNhXCIsIFwiOTY2XCIgXSwgWyBcIlNlbmVnYWwgKFPDqW7DqWdhbClcIiwgXCJzblwiLCBcIjIyMVwiIF0sIFsgXCJTZXJiaWEgKNCh0YDQsdC40ZjQsClcIiwgXCJyc1wiLCBcIjM4MVwiIF0sIFsgXCJTZXljaGVsbGVzXCIsIFwic2NcIiwgXCIyNDhcIiBdLCBbIFwiU2llcnJhIExlb25lXCIsIFwic2xcIiwgXCIyMzJcIiBdLCBbIFwiU2luZ2Fwb3JlXCIsIFwic2dcIiwgXCI2NVwiIF0sIFsgXCJTaW50IE1hYXJ0ZW5cIiwgXCJzeFwiLCBcIjE3MjFcIiBdLCBbIFwiU2xvdmFraWEgKFNsb3ZlbnNrbylcIiwgXCJza1wiLCBcIjQyMVwiIF0sIFsgXCJTbG92ZW5pYSAoU2xvdmVuaWphKVwiLCBcInNpXCIsIFwiMzg2XCIgXSwgWyBcIlNvbG9tb24gSXNsYW5kc1wiLCBcInNiXCIsIFwiNjc3XCIgXSwgWyBcIlNvbWFsaWEgKFNvb21hYWxpeWEpXCIsIFwic29cIiwgXCIyNTJcIiBdLCBbIFwiU291dGggQWZyaWNhXCIsIFwiemFcIiwgXCIyN1wiIF0sIFsgXCJTb3V0aCBLb3JlYSAo64yA7ZWc66+86rWtKVwiLCBcImtyXCIsIFwiODJcIiBdLCBbIFwiU291dGggU3VkYW4gKOKAq9is2YbZiNioINin2YTYs9mI2K/Yp9mG4oCs4oCOKVwiLCBcInNzXCIsIFwiMjExXCIgXSwgWyBcIlNwYWluIChFc3Bhw7FhKVwiLCBcImVzXCIsIFwiMzRcIiBdLCBbIFwiU3JpIExhbmthICjgt4Hgt4rigI3gtrvgt5Mg4La94LaC4Laa4LeP4LeAKVwiLCBcImxrXCIsIFwiOTRcIiBdLCBbIFwiU3VkYW4gKOKAq9in2YTYs9mI2K/Yp9mG4oCs4oCOKVwiLCBcInNkXCIsIFwiMjQ5XCIgXSwgWyBcIlN1cmluYW1lXCIsIFwic3JcIiwgXCI1OTdcIiBdLCBbIFwiU3ZhbGJhcmQgYW5kIEphbiBNYXllblwiLCBcInNqXCIsIFwiNDdcIiwgMSBdLCBbIFwiU3dhemlsYW5kXCIsIFwic3pcIiwgXCIyNjhcIiBdLCBbIFwiU3dlZGVuIChTdmVyaWdlKVwiLCBcInNlXCIsIFwiNDZcIiBdLCBbIFwiU3dpdHplcmxhbmQgKFNjaHdlaXopXCIsIFwiY2hcIiwgXCI0MVwiIF0sIFsgXCJTeXJpYSAo4oCr2LPZiNix2YrYp+KArOKAjilcIiwgXCJzeVwiLCBcIjk2M1wiIF0sIFsgXCJUYWl3YW4gKOWPsOeBoylcIiwgXCJ0d1wiLCBcIjg4NlwiIF0sIFsgXCJUYWppa2lzdGFuXCIsIFwidGpcIiwgXCI5OTJcIiBdLCBbIFwiVGFuemFuaWFcIiwgXCJ0elwiLCBcIjI1NVwiIF0sIFsgXCJUaGFpbGFuZCAo4LmE4LiX4LiiKVwiLCBcInRoXCIsIFwiNjZcIiBdLCBbIFwiVGltb3ItTGVzdGVcIiwgXCJ0bFwiLCBcIjY3MFwiIF0sIFsgXCJUb2dvXCIsIFwidGdcIiwgXCIyMjhcIiBdLCBbIFwiVG9rZWxhdVwiLCBcInRrXCIsIFwiNjkwXCIgXSwgWyBcIlRvbmdhXCIsIFwidG9cIiwgXCI2NzZcIiBdLCBbIFwiVHJpbmlkYWQgYW5kIFRvYmFnb1wiLCBcInR0XCIsIFwiMTg2OFwiIF0sIFsgXCJUdW5pc2lhICjigKvYqtmI2YbYs+KArOKAjilcIiwgXCJ0blwiLCBcIjIxNlwiIF0sIFsgXCJUdXJrZXkgKFTDvHJraXllKVwiLCBcInRyXCIsIFwiOTBcIiBdLCBbIFwiVHVya21lbmlzdGFuXCIsIFwidG1cIiwgXCI5OTNcIiBdLCBbIFwiVHVya3MgYW5kIENhaWNvcyBJc2xhbmRzXCIsIFwidGNcIiwgXCIxNjQ5XCIgXSwgWyBcIlR1dmFsdVwiLCBcInR2XCIsIFwiNjg4XCIgXSwgWyBcIlUuUy4gVmlyZ2luIElzbGFuZHNcIiwgXCJ2aVwiLCBcIjEzNDBcIiBdLCBbIFwiVWdhbmRhXCIsIFwidWdcIiwgXCIyNTZcIiBdLCBbIFwiVWtyYWluZSAo0KPQutGA0LDRl9C90LApXCIsIFwidWFcIiwgXCIzODBcIiBdLCBbIFwiVW5pdGVkIEFyYWIgRW1pcmF0ZXMgKOKAq9in2YTYpdmF2KfYsdin2Kog2KfZhNi52LHYqNmK2Kkg2KfZhNmF2KrYrdiv2KnigKzigI4pXCIsIFwiYWVcIiwgXCI5NzFcIiBdLCBbIFwiVW5pdGVkIEtpbmdkb21cIiwgXCJnYlwiLCBcIjQ0XCIsIDAgXSwgWyBcIlVuaXRlZCBTdGF0ZXNcIiwgXCJ1c1wiLCBcIjFcIiwgMCBdLCBbIFwiVXJ1Z3VheVwiLCBcInV5XCIsIFwiNTk4XCIgXSwgWyBcIlV6YmVraXN0YW4gKE/Ku3piZWtpc3RvbilcIiwgXCJ1elwiLCBcIjk5OFwiIF0sIFsgXCJWYW51YXR1XCIsIFwidnVcIiwgXCI2NzhcIiBdLCBbIFwiVmF0aWNhbiBDaXR5IChDaXR0w6AgZGVsIFZhdGljYW5vKVwiLCBcInZhXCIsIFwiMzlcIiwgMSBdLCBbIFwiVmVuZXp1ZWxhXCIsIFwidmVcIiwgXCI1OFwiIF0sIFsgXCJWaWV0bmFtIChWaeG7h3QgTmFtKVwiLCBcInZuXCIsIFwiODRcIiBdLCBbIFwiV2FsbGlzIGFuZCBGdXR1bmEgKFdhbGxpcy1ldC1GdXR1bmEpXCIsIFwid2ZcIiwgXCI2ODFcIiBdLCBbIFwiV2VzdGVybiBTYWhhcmEgKOKAq9in2YTYtdit2LHYp9ihINin2YTYutix2KjZitip4oCs4oCOKVwiLCBcImVoXCIsIFwiMjEyXCIsIDEgXSwgWyBcIlllbWVuICjigKvYp9mE2YrZhdmG4oCs4oCOKVwiLCBcInllXCIsIFwiOTY3XCIgXSwgWyBcIlphbWJpYVwiLCBcInptXCIsIFwiMjYwXCIgXSwgWyBcIlppbWJhYndlXCIsIFwiendcIiwgXCIyNjNcIiBdLCBbIFwiw4VsYW5kIElzbGFuZHNcIiwgXCJheFwiLCBcIjM1OFwiLCAxIF0gXTtcbiAgICAvLyBsb29wIG92ZXIgYWxsIG9mIHRoZSBjb3VudHJpZXMgYWJvdmVcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbENvdW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYyA9IGFsbENvdW50cmllc1tpXTtcbiAgICAgICAgYWxsQ291bnRyaWVzW2ldID0ge1xuICAgICAgICAgICAgbmFtZTogY1swXSxcbiAgICAgICAgICAgIGlzbzI6IGNbMV0sXG4gICAgICAgICAgICBkaWFsQ29kZTogY1syXSxcbiAgICAgICAgICAgIHByaW9yaXR5OiBjWzNdIHx8IDAsXG4gICAgICAgICAgICBhcmVhQ29kZXM6IGNbNF0gfHwgbnVsbFxuICAgICAgICB9O1xuICAgIH1cbn0pOyJdLCJmaWxlIjoiaW50bFRlbElucHV0LmpzIn0=
