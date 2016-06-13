//wordlist
var wordsBad = ["insert", "here"];
var wordsGood = ["insert", "here"];

function addKarmaCheck() { //adds karma checkbox and initializes localStorage & custom chatline bind
    if (!localStorage.karmaGood) {
        localStorage.karmaGood = 0;
    }

    if (!localStorage.karmaBad) {
        localStorage.karmaBad = 0;
    }

    if (!localStorage.wordsTotal) {
        localStorage.wordsTotal = 0;
    }

    if (!localStorage.karmaColor) {
        localStorage.karmaColor = "808080";
    }

    localStorage.karmaLock = false;
    var karmaCheck = $("<input/>", { type: "checkbox", id: "karmaCheck", value: "karma" });
    var karmaLabel = $("<label/>", { for: "karmaCheck", text: "Karma Color" });
    $("#leftcontrols").append([karmaCheck, karmaLabel]);
    $("#karmaCheck").prop("checked", true);
    $("#chatline").unbind("keydown");
    bindChatline();
}

function blockKarma() { localStorage.karmaLock = true; }
function unlockKarma() { localStorage.karmaLock = false; }
function karmaLock() { return eval("(" + localStorage.karmaLock + ")"); }

var containsNumber = function (str, re) {
    return (str.match(new RegExp(re, 'g')) || []).length;
}

function constructColor(red, green, blue) {
    var rgb = blue | (green << 8) | (red << 16);
    return (0x1000000 + rgb).toString(16).slice(1);
}

function analMsg(msg) {
    /* anal karma */
    var msgBad = 0, msgGood = 0, msgTotal;

    msgTotal = msg.split(" ").length;

    wordsBad.forEach(function (el) {
        msgBad += containsNumber(msg, el);
    });

    wordsGood.forEach(function (el) {
        msgGood += containsNumber(msg, el);
    });

    /* update local storage */
    localStorage.karmaBad = parseInt(localStorage.karmaBad) + msgBad;
    localStorage.karmaGood = parseInt(localStorage.karmaGood) + msgGood;
    localStorage.wordsTotal = parseInt(localStorage.wordsTotal) + msgTotal;
}

function computeAndUpdateKarmaColor() {

    var effectiveCarma = parseInt(localStorage.karmaGood) - parseInt(localStorage.karmaBad);
    if (Math.abs(effectiveCarma) > 255) {
        effectiveCarma = sign(effectiveCarma) * 255;
    };

    // update
    if (effectiveCarma >= 0) {
        localStorage.karmaColor = constructColor(255 - effectiveCarma, 255 - effectiveCarma, 255);
    }
    else {
        localStorage.karmaColor = constructColor(255, 255 + effectiveCarma, 255 + effectiveCarma);
    }

}

function processOwnCommands(msg) {

    if (msg == "/karma") {
        var bcarma = (localStorage.karmaBad) + "/" + (localStorage.wordsTotal);
        var gcarma = (localStorage.karmaGood) + "/" + (localStorage.wordsTotal);
        blockKarma();
        socket.emit("chatMsg", { msg: "Your good karma is " + gcarma + " |11ff00|" });
        socket.emit("chatMsg", { msg: "Your bad karma is " + bcarma + " |11ff00|" });
        unlockKarma();
        return true;
    }
    if (msg == "/resetcolor") { TEXTCOLOR = null; return true; }
    return false;
}

function handleChatMsg(data) {
    // analize if me
    if (data.username == CLIENT.name) {
        if (!karmaLock()) {
            analMsg(data.msg);
            computeAndUpdateKarmaColor();
            $("label[for=karmaCheck]").css("color", "#" + localStorage.karmaColor);
        }
    }
}

function addColor(msg, color) {
    //check for greentext
    if (color == null || msg.startsWith('>')) {
        console.log(msg);
        return msg;
    }
    var coloredmsg = $("<span/>", { html: msg, style: "color: #" + color + ";" }).prop('outerHTML');
    console.log(coloredmsg);
    return coloredmsg;
}

function formatMessage(msg) {
    if ($("#karmaCheck").prop("checked") && msg.startsWith('$') == false && msg.startsWith('>') == false) {
        msg += " |" + localStorage.karmaColor + "|";
    }
    else if (TEXTCOLOR != null && msg.startsWith('$') == false && msg.startsWith('>') == false) {
        msg += " |" + TEXTCOLOR + "|";
    }
    return msg;
}

function bindChatline() { //modified function from Cytu.be's js
    $("#chatline").keydown(function (ev) {
        // Enter/return
        if (ev.keyCode == 13) {
            if (CHATTHROTTLE) {
                return;
            }
            var msg = $("#chatline").val();
            if (msg.trim()) {
                var meta = {};
                if (USEROPTS.adminhat && CLIENT.rank >= 255) {
                    msg = "/a " + msg;
                } else if (USEROPTS.modhat && CLIENT.rank >= Rank.Moderator) {
                    meta.modflair = CLIENT.rank;
                }

                // The /m command no longer exists, so emulate it clientside
                if (CLIENT.rank >= 2 && msg.indexOf("/m ") === 0) {
                    meta.modflair = CLIENT.rank;
                    msg = msg.substring(3);
                }

                //Modification for commands

                if (!processOwnCommands(msg)) {
                    socket.emit("chatMsg", {
                        msg: formatMessage((msg)),
                        meta: meta
                    });
                }

                CHATHIST.push($("#chatline").val());
                CHATHISTIDX = CHATHIST.length;
                $("#chatline").val("");
            }
            return;
        }
        else if (ev.keyCode == 9) { // Tab completion
            chatTabComplete();
            ev.preventDefault();
            return false;
        }
        else if (ev.keyCode == 38) { // Up arrow (input history)
            if (CHATHISTIDX == CHATHIST.length) {
                CHATHIST.push($("#chatline").val());
            }
            if (CHATHISTIDX > 0) {
                CHATHISTIDX--;
                $("#chatline").val(CHATHIST[CHATHISTIDX]);
            }

            ev.preventDefault();
            return false;
        }
        else if (ev.keyCode == 40) { // Down arrow (input history)
            if (CHATHISTIDX < CHATHIST.length - 1) {
                CHATHISTIDX++;
                $("#chatline").val(CHATHIST[CHATHISTIDX]);
            }
            ev.preventDefault();
            return false;
        }
    });
}

function formatChatMessage(data, last) { //modified fuction from Cytu.be's util.js
    // Backwards compat
    if (!data.meta || data.msgclass) {
        data.meta = {
            addClass: data.msgclass,
            // And the award for "variable name most like Java source code" goes to...
            addClassToNameAndTimestamp: data.msgclass
        };
    }
    // Phase 1: Determine whether to show the username or not
    var skip = data.username === last.name;
    if (data.meta.addClass === "server-whisper")
        skip = true;
    // Prevent impersonation by abuse of the bold filter
    if (data.msg.match(/^\s*<strong>\w+\s*:\s*<\/strong>\s*/))
        skip = false;
    if (data.meta.forceShowName)
        skip = false;

    /* modification for colors */
    var colorPattern = /(.+) \|([0-9a-f]+)\|$/gi;
    var matches = colorPattern.exec(data.msg);
    var color = null;
    if (matches) { color = matches[2]; data.msg = matches[1]; }

    data.msg = execEmotes(data.msg);
    data.msg = addColor(data.msg, color);

    last.name = data.username;
    var div = $("<div/>");
    if (data.meta.addClass === "drink") {
        div.addClass("drink");
        data.meta.addClass = "";
    }

    // Add timestamps (unless disabled)
    if (USEROPTS.show_timestamps) {
        var time = $("<span/>").addClass("timestamp").appendTo(div);
        var timestamp = new Date(data.time).toTimeString().split(" ")[0];
        time.text("[" + timestamp + "] ");
        if (data.meta.addClass && data.meta.addClassToNameAndTimestamp) {
            time.addClass(data.meta.addClass);
        }
    }

    // Add username
    var name = $("<span/>");
    if (!skip) {
        name.appendTo(div);
    }
    $("<strong/>").addClass("username").text(data.username + ": ").appendTo(name);
    if (data.meta.modflair) {
        name.addClass(getNameColor(data.meta.modflair));
    }
    if (data.meta.addClass && data.meta.addClassToNameAndTimestamp) {
        name.addClass(data.meta.addClass);
    }
    if (data.meta.superadminflair) {
        name.addClass("label")
            .addClass(data.meta.superadminflair.labelclass);
        $("<span/>").addClass(data.meta.superadminflair.icon)
            .addClass("glyphicon")
            .css("margin-right", "3px")
            .prependTo(name);
    }
    var message = $("<span/>").appendTo(div);
    message[0].innerHTML = data.msg;
    if (data.meta.action) {
        name.remove();
        message[0].innerHTML = data.username + " " + data.msg;
    }
    if (data.meta.addClass) {
        message.addClass(data.meta.addClass);
    }
    if (data.meta.shadow) {
        div.addClass("chat-shadow");
    }
    return div;
}

function initialLoad() { //prevents double initialization at JS update

    console.log($("#checkforinitial").length); //debug
    if ($("#checkforinitial").length) {
        console.log("not initial load");
        return false;
    }
    var mkinit = $("<div/>", { id: "checkforinitial" });
    $(document.body).append(mkinit);

    console.log("initial load");
    return true;
}

if (initialLoad()) {
    socket.on("chatMsg", handleChatMsg);
    var TEXTCOLOR = null;
    addKarmaCheck();
}
