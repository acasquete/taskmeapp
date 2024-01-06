var Taskboard = (function () {
    "use strict";
    var maxnotes = 30;
    var z = -maxnotes - 1;
    var screenwidth;

    function init(notes) {
        if (notes.length < 1) {
            showHelp();
        }

        createNotes(notes);

        screenwidth = Config.getScreenWidth();

        if (screenwidth) {
            if (screenwidth != window.innerWidth) {
                recalcposition();
            }
        } else {
            screenwidth = window.innerWidth;
        }

        window.addEventListener("resize", onViewStateChanged);

        $("#cmdRemoveAllNotes").click(function () {
            $(".note").css({ transition: 'all 0.8s', opacity: 0.25, transform: 'translateY(-1000px)' }).promise().then(function () {
                setTimeout(function () {
                    $(".note").remove();
                    checkminNotes();
                    saveTaskboardAndUpdateTile();
                }, 800);

            });

            Controls.hideappbar();
        });

        $("#cmdClearCanvas").click(function () {
            Sketch.clearCanvas();
            saveTaskboardAndUpdateTile();
            Controls.hideappbar();
        });

        $("#cmdHelp").click(function () {
            showHelp();
        });

        $('#cmdFullscreenButton').click( function() {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari y Opera */
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
                    document.documentElement.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) { /* Firefox */
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) { /* Chrome, Safari y Opera */
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { /* IE/Edge */
                    document.msExitFullscreen();
                }
            }
        });

        starthandlers(".note");

        checkminNotes();
        
        $(".new").on("mousedown", onnew);

        updateTile();
    }

    function showHelp() {
        
        const htmlContent = `
                <u>Thanks for using TaskMe!</u><br/>
                Create a note by selecting a <strong>color</strong> from the left side of the screen.<br/>
                Edit a note by <strong>double-clicking</strong> on it.<br/>
                Remove a note by <strong>dragging</strong> it to the top of the screen.<br/>
                <br/>
                If you have any questions, ideas, or suggestions, please don't hesitate to reach out to me at <strong>X @acasquetenotes</strong>.
                <br/>
                Please open a new issue if you want to report any errors or provide feedback. You can do this at <a href="https://www.github.com/acasquete/taskmeapp/issues" target="_blank">www.github.com/acasquete/taskmeapp/issues</a>.
                <br/><br/>Your feedback is greatly appreciated!</p>
            `;

        $(".tomato").remove();
        createNote("300px", "170px", "note tomato", htmlContent);
        starthandlers(".tomato");
        Controls.hideappbar();
    }

    function saveTaskboardAndUpdateTile() {
        window.setTimeout(function () {
            saveTaskboard();
            updateTile();
        }, 500);
    }

    function createNote(left, top, color, content) {
        try {
            var input = toStaticHTML("<div class='" + color + "'></div>");
            var el = $(input);
            var t = el.get(0);
            t.contentEditable = true;
            t.innerHTML = content;
            t.style.left = left;
            t.style.top = top;
            el.appendTo('#container');
            applyRandomRotate(t);
        } catch(ex) {
            
        }
    }

    function createNotes(notes) {
        for (var i = 0; i < notes.length; i++) {
            createNote(notes[i].l, notes[i].t, notes[i].cl, notes[i].c);
            if (z < notes[i].i) z = notes[i].i;
        }
        z++;
    }

    function onnew(event) {
        var classattr = $(this).attr("class").replace("new ", "");
        var input = toStaticHTML("<div class='note " + classattr + "'></div>");
        var e = $(input).appendTo('#container').hide().fadeIn(300);
        var t = e.get(0);
        //t.style.zIndex = z++;
        t.contentEditable = true;
        e.css({ top: event.pageY - 100 });
        starthandlers(t);
        e.trigger(event);

        if ($('.note').size() > maxnotes - 1) {
            $("#newbuttons").fadeOut(300);
        }
    }

    function toStaticHTML(input) {
        var tempDiv = document.createElement('div');
    
        tempDiv.innerHTML = input;
    
        var scripts = tempDiv.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
            scripts[i].parentNode.removeChild(scripts[i]);
        }
    
        var allElements = tempDiv.getElementsByTagName('*');
        for (var i = 0; i < allElements.length; i++) {
            var attributes = allElements[i].attributes;
            for (var j = attributes.length - 1; j >= 0; j--) {
                if (/^on/i.test(attributes[j].name)) {
                    allElements[i].removeAttribute(attributes[j].name);
                }
            }
        }
    
        return tempDiv.innerHTML;
    }

    function applyRandomRotate(element) {
        var angle = getRandomAngle();
        element.style.transform = 'rotate(' + angle + 'deg)';
    }

    function getRandomAngle() {
        return (Math.floor((Math.random() * 6) + 1)) - 3;
    }

    function starthandlers(element) {
        $(element).on("dragstart", ondragstart);
        $(element).on("drag", ondrag);
        $(element).on("dragend", ondragend);
        $(element).on('keyup', function (e) { checkCharcount(this, 140, e); });
        $(element).on('keydown', function (e) { checkCharcount(this, 140, e); });
        $(element).on('dblclick', onclickNote);
        $(element).on('focus', function () { $(this).addClass("selected"); });
        $(element).on('blur', function () {
            $(this).removeClass("selected");
            saveTaskboardAndUpdateTile();
        });
    }

    function onclickNote(event) {
        var el = $(this);
        event.stopPropagation();
        event.preventDefault();
        if (event.handled !== true) {
            resetNotes();
            el.selectText();
            event.handled = true;
        } else {
            return false;
        }
    }

    function checkCharcount(content_id, max, e) {
        if (e.which != 8 && $(content_id).text().length > max) {
            e.preventDefault();
        }
    }

    function resetNotes() {
        $(".note").each(function () {
            $(this).removeClass("selected");
        });
    }

    function removehandlers(element) {
        $(element).off('dragstart');
        $(element).off('drag');
        $(element).off('dragend');

        $(element).off('blur');
        $(element).off('focus');
    }

    function ondragstart(ev, dd) {
        applyRandomRotate($(this).get(0));
    }

    function ondrag(ev, dd) {
        $(this).css({
            top: dd.offsetY,
            left: dd.offsetX,
        });
    }

    function checkminNotes() {
        if ($('.note').size() < maxnotes) {
            $("#newbuttons").fadeIn(300);
        }
    }

    function ondragend() {
        if ($(this).position().top < 0) {
            $(this).animate({ opacity: 0.25, top: -200 }, 100, 'linear', function () {
                $(this).remove();
                checkminNotes();
            });
        }

        applyRandomRotate($(this).get(0));
        saveTaskboardAndUpdateTile();
        return false;
    }

    function getNotesInProgress() {
        var notesinprogress = [];
        var widthcolumn = screenwidth / 3;
        $('.note').each(function () {
            var el = $(this).get(0);
            var position = $(this).position().left;
            notesinprogress.push({ status: position > widthcolumn * 2 ? "done" : position > widthcolumn ? "inprogress" : "todo", text: el.innerHTML });
        });
        return notesinprogress;
    }

    function updateTile() {
        //Notifications.sendUpdate(getNotesInProgress());
    }

    function saveTaskboard() {
        var listnotes = [];
        $('.note').each(function () {
            var el = $(this).get(0);
            listnotes.push({ c: el.innerHTML, i: el.style.zIndex, l: el.style.left, t: el.style.top, cl: el.className });
        });

        Config.saveTaskboard(listnotes, screenwidth);
    }

    function recalcposition() {
        
        $(".note").each(function (el) {
            var posnote = $(this).position().left;
            var newpos = window.innerWidth * posnote / screenwidth;
            //$(this).css('left', newpos);
        });
        screenwidth = window.innerWidth;
        saveTaskboard();
    }

    function onViewStateChanged(eventArgs) {
        recalcposition();
        starthandlers(".note");
    }

    return {
        init: init
    };

})();

jQuery.fn.selectText = function () {
    var range, selection;
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(this[0]);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(this[0]);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};





