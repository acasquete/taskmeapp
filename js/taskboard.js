var Taskboard = (function () {
    "use strict";
    var maxnotes = 30;
    var z = -maxnotes - 1;
    var screenwidth;

    function init(notes) {
        if (notes.length < 1) {
            showHelp();
        }

        initNotes(notes);

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
                    asyncSaveTaskboard();
                }, 800);

            });

            Controls.hideappbar();
        });

        $("#cmdClearCanvas").click(function () {
            Sketch.clearCanvas();
            asyncSaveTaskboard();
            Controls.hideappbar();
        });

        $("#cmdHelp").click(function () {
            showHelp();
        });

        $('#toggleNotes').click(function() {
            $('.note').each(function() {
                if ($(this).css('display') === 'none') {
                    $(this).fadeIn();
                } else {
                    $(this).fadeOut();
                }
            });
        });

        $('#cmdFullscreenButton').click( function() {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        });

        starthandlers(".note");

        checkminNotes();
        
        $(".new").on("mousedown touchstart", onnew);
    }

    function showHelp() {
        
        const htmlContent = `
            <div style="text-align: center;">
                You're the best!<br/>
                Thanks for trying <b>TaskMe</b>,<br/>
                the <em>easiest</em> way to create notes!
            </div>
            <br/>
            - <b>Create</b> a note by selecting a color on the left of the screen.<br/>
            - <b>Edit</b> a note by double-clicking on it.<br/>
            - <b>Remove</b> a note by dragging it to the top of the screen.<br/><br/>
            If you have any questions, ideas or suggestions, please feel free to contact me at <a href='http://www.twitter.com/acasquetenotes'>X@acasquetenotes</a>
            or open an issue on GitHub at <a href='http://www.github.com/acasquete/taskmeapp/issues'>www.github.com/acasquete/taskmeapp</a>
        `;

        $(".tomato").remove();
        $('.note').fadeIn();
        createNote("300px", "170px", "note tomato", htmlContent);
        starthandlers(".tomato");
        Controls.hideappbar();
    }

    function asyncSaveTaskboard() {
        window.setTimeout(function () {
            saveTaskboard();
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

    function initNotes(notes) {
        for (var i = 0; i < notes.length; i++) {
            console.log(notes[i].l);
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
        $('.note').fadeIn();

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
        var angle = (Math.floor((Math.random() * 6) + 1)) - 3;
        element.style.transform = 'rotate(' + angle + 'deg)';
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
            asyncSaveTaskboard();
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
        asyncSaveTaskboard();
        return false;
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
        $(".note").each(function () {
            var el = $(this).get(0);
            el.style.transform = 'rotate(' + 0 + 'deg)';

            var posNote = $(this).position().left;
            var posRel = posNote * 100 / screenwidth;
    
            var newPos = window.innerWidth * posRel / 100;
            $(this).css('left', newPos);
            
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
