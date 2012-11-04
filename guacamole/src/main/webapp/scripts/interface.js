
// UI Definition
var GuacamoleUI = {

    /* UI Elements */

    "viewport"    : document.getElementById("viewportClone"),
    "display"     : document.getElementById("display"),
    "logo"        : document.getElementById("status-logo"),
    "eventTarget" : document.getElementById("eventTarget"),

    "buttons": {
        "reconnect"    : document.getElementById("reconnect")
    },

    "containers": {
        "state"         : document.getElementById("statusDialog")
    },
    
    "state"          : document.getElementById("statusText"),
    "client"         : null

};

/**
 * Array of all supported audio mimetypes, populated when this script is
 * loaded.
 */
GuacamoleUI.supportedAudio = [];

/**
 * Array of all supported video mimetypes, populated when this script is
 * loaded.
 */
GuacamoleUI.supportedVideo = [];

// Constant UI initialization and behavior
(function() {

    // Cache error image (might not be available when error occurs)
    var guacErrorImage = new Image();
    guacErrorImage.src = "images/noguacamole-logo-24.png";

    // Function for adding a class to an element
    var addClass;

    // Function for removing a class from an element
    var removeClass;

    // If Node.classList is supported, implement addClass/removeClass using that
    if (Node.classList) {

        addClass = function(element, classname) {
            element.classList.add(classname);
        };
        
        removeClass = function(element, classname) {
            element.classList.remove(classname);
        };
        
    }

    // Otherwise, implement own
    else {

        addClass = function(element, classname) {

            // Simply add new class
            element.className += " " + classname;

        };
        
        removeClass = function(element, classname) {

            // Filter out classes with given name
            element.className = element.className.replace(/([^ ]+)[ ]*/g,
                function(match, testClassname, spaces, offset, string) {

                    // If same class, remove
                    if (testClassname == classname)
                        return "";

                    // Otherwise, allow
                    return match;
                    
                }
            );

        };
        
    }


    GuacamoleUI.hideStatus = function() {
        removeClass(document.body, "guac-error");
        GuacamoleUI.containers.state.style.visibility = "hidden";
        GuacamoleUI.display.style.opacity = "1";
    };
    
    GuacamoleUI.showStatus = function(text) {
        removeClass(document.body, "guac-error");
        GuacamoleUI.containers.state.style.visibility = "visible";
        GuacamoleUI.state.textContent = text;
        GuacamoleUI.display.style.opacity = "1";
    };
    
    GuacamoleUI.showError = function(error) {
        addClass(document.body, "guac-error");
        GuacamoleUI.state.textContent = error;
        GuacamoleUI.display.style.opacity = "0.1";
    };

    function positionCentered(element) {
        element.style.left =
            ((GuacamoleUI.viewport.offsetWidth - element.offsetWidth) / 2
            + window.pageXOffset)
            + "px";

        element.style.top =
            ((GuacamoleUI.viewport.offsetHeight - element.offsetHeight) / 2
            + window.pageYOffset)
            + "px";
    }

    // Reconnect button
    GuacamoleUI.buttons.reconnect.onclick = function() {
        window.location.reload();
    };

    // Turn off autocorrect and autocapitalization on eventTarget
    GuacamoleUI.eventTarget.setAttribute("autocorrect", "off");
    GuacamoleUI.eventTarget.setAttribute("autocapitalize", "off");

    // Automatically reposition event target on scroll
    window.addEventListener("scroll", function() {
        GuacamoleUI.eventTarget.style.left = window.pageXOffset + "px";
        GuacamoleUI.eventTarget.style.top = window.pageYOffset + "px";
    });

    // Query audio support
    (function () {
        var probably_supported = [];
        var maybe_supported = [];

        // Build array of supported audio formats
        [
            'audio/ogg; codecs="vorbis"',
            'audio/mp4; codecs="mp4a.40.5"',
            'audio/mpeg; codecs="mp3"',
            'audio/webm; codecs="vorbis"',
            'audio/wav; codecs=1'
        ].forEach(function(mimetype) {

            var audio = new Audio();
            var support_level = audio.canPlayType(mimetype);

            // Trim semicolon and trailer
            var semicolon = mimetype.indexOf(";");
            if (semicolon != -1)
                mimetype = mimetype.substring(0, semicolon);

            // Partition by probably/maybe
            if (support_level == "probably")
                probably_supported.push(mimetype);
            else if (support_level == "maybe")
                maybe_supported.push(mimetype);

        });

        Array.prototype.push.apply(GuacamoleUI.supportedAudio, probably_supported);
        Array.prototype.push.apply(GuacamoleUI.supportedAudio, maybe_supported);
    })();

    // Query video support
    (function () {
        var probably_supported = [];
        var maybe_supported = [];

        // Build array of supported video formats
        [
            'video/ogg; codecs="theora, vorbis"',
            'video/mp4; codecs="avc1.4D401E, mp4a.40.5"',
            'video/webm; codecs="vp8.0, vorbis"'
        ].forEach(function(mimetype) {

            var video = document.createElement("video");
            var support_level = video.canPlayType(mimetype);

            // Trim semicolon and trailer
            var semicolon = mimetype.indexOf(";");
            if (semicolon != -1)
                mimetype = mimetype.substring(0, semicolon);

            // Partition by probably/maybe
            if (support_level == "probably")
                probably_supported.push(mimetype);
            else if (support_level == "maybe")
                maybe_supported.push(mimetype);

        });

        Array.prototype.push.apply(GuacamoleUI.supportedVideo, probably_supported);
        Array.prototype.push.apply(GuacamoleUI.supportedVideo, maybe_supported);
    })();

})();

// Tie UI events / behavior to a specific Guacamole client
GuacamoleUI.attach = function(guac) {

    GuacamoleUI.client = guac;

    var title_prefix = null;
    var connection_name = "Guacamole"; 
    
    var guac_display = guac.getDisplay();

    // Set document title appropriately, based on prefix and connection name
    function updateTitle() {

        // Use title prefix if present
        if (title_prefix) {
            
            document.title = title_prefix;

            // Include connection name, if present
            if (connection_name)
                document.title += " " + connection_name;

        }

        // Otherwise, just set to connection name
        else if (connection_name)
            document.title = connection_name;

    }

    guac_display.onclick = function(e) {
        e.preventDefault();
        return false;
    };

    // Mouse
    var mouse = new Guacamole.Mouse(guac_display);
    var touch = new Guacamole.Mouse.Touchpad(guac_display);
    touch.onmousedown = touch.onmouseup = touch.onmousemove =
    mouse.onmousedown = mouse.onmouseup = mouse.onmousemove =
        function(mouseState) {
       
            // Determine mouse position within view
            var mouse_view_x = mouseState.x + guac_display.offsetLeft - window.pageXOffset;
            var mouse_view_y = mouseState.y + guac_display.offsetTop  - window.pageYOffset;

            // Determine viewport dimensioins
            var view_width  = GuacamoleUI.viewport.offsetWidth;
            var view_height = GuacamoleUI.viewport.offsetHeight;

            // Determine scroll amounts based on mouse position relative to document

            var scroll_amount_x;
            if (mouse_view_x > view_width)
                scroll_amount_x = mouse_view_x - view_width;
            else if (mouse_view_x < 0)
                scroll_amount_x = mouse_view_x;
            else
                scroll_amount_x = 0;

            var scroll_amount_y;
            if (mouse_view_y > view_height)
                scroll_amount_y = mouse_view_y - view_height;
            else if (mouse_view_y < 0)
                scroll_amount_y = mouse_view_y;
            else
                scroll_amount_y = 0;

            // Scroll (if necessary) to keep mouse on screen.
            window.scrollBy(scroll_amount_x, scroll_amount_y);

            // Scale event by current scale
            var scaledState = new Guacamole.Mouse.State(
                    mouseState.x / guac.getScale(),
                    mouseState.y / guac.getScale(),
                    mouseState.left,
                    mouseState.middle,
                    mouseState.right,
                    mouseState.up,
                    mouseState.down);

            // Send mouse event
            guac.sendMouseState(scaledState);
            
        };

    // Keyboard
    var keyboard = new Guacamole.Keyboard(document);

    // Monitor whether the event target is focused
    var eventTargetFocused = false;

    // Save length for calculation of changed value
    var currentLength = GuacamoleUI.eventTarget.value.length;

    GuacamoleUI.eventTarget.onfocus = function() {
        eventTargetFocused = true;
        GuacamoleUI.eventTarget.value = "";
        currentLength = 0;
    };

    GuacamoleUI.eventTarget.onblur = function() {
        eventTargetFocused = false;
    };

    // If text is input directly into event target without typing (as with
    // voice input, for example), type automatically.
    GuacamoleUI.eventTarget.oninput = function(e) {

        // Calculate current length and change in length
        var oldLength = currentLength;
        currentLength = GuacamoleUI.eventTarget.value.length;
        
        // If deleted or replaced text, ignore
        if (currentLength <= oldLength)
            return;

        // Get changed text
        var text = GuacamoleUI.eventTarget.value.substring(oldLength);

        // Send each character
        for (var i=0; i<text.length; i++) {

            // Get char code
            var charCode = text.charCodeAt(i);

            // Convert to keysym
            var keysym = 0x003F; // Default to a question mark
            if (charCode >= 0x0000 && charCode <= 0x00FF)
                keysym = charCode;
            else if (charCode >= 0x0100 && charCode <= 0x10FFFF)
                keysym = 0x01000000 | charCode;

            // Send keysym only if not already pressed
            if (!keyboard.pressed[keysym]) {

                // Press and release key
                guac.sendKeyEvent(1, keysym);
                guac.sendKeyEvent(0, keysym);

            }

        }

    }

    function isTypableCharacter(keysym) {
        return (keysym & 0xFFFF00) != 0xFF00;
    }

    function disableKeyboard() {
        keyboard.onkeydown = null;
        keyboard.onkeyup = null;
    }

    function enableKeyboard() {

        keyboard.onkeydown = function (keysym) {
            guac.sendKeyEvent(1, keysym);
            return eventTargetFocused && isTypableCharacter(keysym);
        };

        keyboard.onkeyup = function (keysym) {
            guac.sendKeyEvent(0, keysym);
            return eventTargetFocused && isTypableCharacter(keysym);
        };

    }

    function updateThumbnail() {

        // Get screenshot
        var canvas = guac.flatten();

        // Calculate scale of thumbnail (max 320x240, max zoom 100%)
        var scale = Math.min(
            320 / canvas.width,
            240 / canvas.height,
            1
        );

        // Create thumbnail canvas
        var thumbnail = document.createElement("canvas");
        thumbnail.width  = canvas.width*scale;
        thumbnail.height = canvas.height*scale;

        // Scale screenshot to thumbnail
        var context = thumbnail.getContext("2d");
        context.drawImage(canvas,
            0, 0, canvas.width, canvas.height,
            0, 0, thumbnail.width, thumbnail.height
        );

        // Get thumbnail set from local storage
        var thumbnails = {};
        try {
            var thumbnail_json = localStorage.getItem("GUAC_THUMBNAILS");
            if (thumbnail_json)
                thumbnails = JSON.parse(thumbnail_json);
        }
        catch (e) {}

        // Save thumbnail to local storage
        var id = decodeURIComponent(window.location.search.substring(4));
        thumbnails[id] = thumbnail.toDataURL();
        localStorage.setItem("GUAC_THUMBNAILS", JSON.stringify(thumbnails));

    }

    // Enable keyboard by default
    enableKeyboard();

    // Handle resize
    guac.onresize = function(width, height) {

        // Calculate scale to fit screen
        var fit_scale = Math.min(
            window.innerWidth / width,
            window.innerHeight / height
        );
          
        // Scale client
        guac.scale(fit_scale);

    }

    // Handle client state change
    guac.onstatechange = function(clientState) {

        switch (clientState) {

            // Idle
            case 0:
                GuacamoleUI.showStatus("Idle.");
                title_prefix = "[Idle]";
                break;

            // Connecting
            case 1:
                GuacamoleUI.showStatus("Connecting...");
                title_prefix = "[Connecting...]";
                break;

            // Connected + waiting
            case 2:
                GuacamoleUI.showStatus("Connected, waiting for first update...");
                title_prefix = "[Waiting...]";
                break;

            // Connected
            case 3:

                GuacamoleUI.hideStatus();
                title_prefix = null;

                // Regularly update screenshot if storage available
                if (localStorage)
                    window.setInterval(updateThumbnail, 5000);

                break;

            // Disconnecting
            case 4:
                GuacamoleUI.showStatus("Disconnecting...");
                title_prefix = "[Disconnecting...]";
                break;

            // Disconnected
            case 5:
                GuacamoleUI.showStatus("Disconnected.");
                title_prefix = "[Disconnected]";
                break;

            // Unknown status code
            default:
                GuacamoleUI.showStatus("[UNKNOWN STATUS]");

        }

        updateTitle();
    };

    // Name instruction handler
    guac.onname = function(name) {
        connection_name = name;
        updateTitle();
    };

    // Error handler
    guac.onerror = function(error) {

        // Disconnect, if connected
        guac.disconnect();

        // Display error message
        GuacamoleUI.showError(error);
        
    };

    // Disconnect and update thumbnail on close
    window.onunload = function() {
        
        if (localStorage)
            updateThumbnail();

        guac.disconnect();

    };

    // Send size events on resize
    window.onresize = function() {

        guac.sendSize(window.innerWidth, window.innerHeight);

        // Calculate scale to fit screen
        var fit_scale = Math.min(
            window.innerWidth / guac.getWidth(),
            window.innerHeight / guac.getHeight()
        );
          
        // Scale client
        guac.scale(fit_scale);

    };

    // Server copy handler
    guac.onclipboard = function(data) {
        window.opener.setClipboard(data);
    };

};
