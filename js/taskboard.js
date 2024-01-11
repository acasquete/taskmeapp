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
            toggleNotes();
        });

        $('#cmdFullscreenButton').click( function() {
            toggleFullscreen();
        });

        starthandlers(".note");

        checkminNotes();
        updateNoteCounters(); 

        $(".new-normal").on("mousedown touchstart", onnew);
        $(".new-small").on("mousedown touchstart", onnew);
    }

    function toggleFullscreen ()
    {
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
    }

    function toggleNotes () {
        $('.note').each(function() {
            if ($(this).css('display') === 'none') {
                $(this).fadeIn();
            } else {
                $(this).fadeOut();
            }
        });

        if ($("#taskboard").css('display') === 'none') { 
            $("#taskboard").fadeIn();
        } else {
            $("#taskboard").fadeOut();
        }
    }
    function isAnyNoteSelected() {
        return $('.note.selected').length > 0;
    }

    function updateNoteCounters() {
        let columnCounters = [0, 0, 0]; // For 3 columns
    
        let totalWidth = $('#taskboard').width();
        let columnWidths = [(3 / 8) * totalWidth, (3 / 8) * totalWidth, (2 / 8) * totalWidth];
    
        $('.note').each(function() {
            // Verificar si la nota tiene contenido
            if ($(this).text().trim() !== '') {
                let notePosition = $(this).position().left;
                let cumulativeWidth = 0;
    
                for (let i = 0; i < columnWidths.length; i++) {
                    cumulativeWidth += columnWidths[i];
                    if (notePosition < cumulativeWidth) {
                        columnCounters[i]++;
                        break;
                    }
                }
            }
        });
    
        $('#column1').text('To Do' + (columnCounters[0] > 0 ? ' - ' + columnCounters[0] : ''));
        $('#column2').text('In Progress' + (columnCounters[1] > 0 ? ' - ' + columnCounters[1] : ''));
        $('#column3').text('Done' + (columnCounters[2] > 0 ? ' - ' + columnCounters[2] : ''));
    }
    

    function showHelp() {
        
        const htmlContent = `
        <p>You're the best! Thanks for trying <b>TaskMe</b>, <em>The Sim Kanban Board!</em></p>
        <p><ul>
        <li><u>Create</u> a note by selecting a color on the left of the screen.</li>
        <li><u>Edit</u> a note by double-clicking on it.</li>
        <li><u>Remove</u> a note by dragging it to the top of the screen.</li></ul>
            <p>(c)hange color (e)raser clear (a)ll (h)ide notes (f)ull screen</p>
            <p>If you have any questions, ideas or suggestions, please feel free to contact me at <a target='_blank' href='http://www.x.com/acasquetenotes'>X@acasquetenotes</a>
            or open an issue on GitHub at <a target='_blank' href='http://www.github.com/acasquete/taskmeapp/issues'>www.github.com/acasquete/taskmeapp</a></p>
        `;

        $(".note-help").remove();
        createNote("300px", "170px", 50, "note tomato note-help", htmlContent, false);
        starthandlers(".note-help");
        Controls.hideappbar();
    }

    function asyncSaveTaskboard() {
        window.setTimeout(function () {
            saveTaskboard();
        }, 500);
    }

    function createNote(left, top, index, style, content, editable) {
        try {

            if (!style.includes('note-normal') && !style.includes('note-small') && !style.includes('note-help')) {
                style += ' note-normal ';
            }

            $('<div></div>')
                .addClass(style)
                .html(content) 
                .css({
                    'left': left,
                    'top': top,
                    'z-index': index,
                    'position': 'absolute', 
                    'transform': 'rotate(' + getRandomAngle() + 'deg)'
                })
                .prop('contentEditable', editable)
                .appendTo('#container');
        } catch (ex) {
            console.error('Error creating note:', ex);
        }
    }
    
    function getRandomAngle() {
        return Math.floor((Math.random() * 6) + 1) - 3; 
    }

    function initNotes(notes) {
        for (var i = 0; i < notes.length; i++) {
            createNote(notes[i].l, notes[i].t, notes[i].i, notes[i].cl, notes[i].c, true);
            if (z < notes[i].i) z = notes[i].i;
        }
        z++;
    }

    function extractSizeFromClass(className) {
        var parts = className.split('-');
        return parts.length > 1 ? parts[1] : null;
    }

    function onnew(event) {
        
        var noteSize = extractSizeFromClass($(this).attr("class"));
        var noteColor = $(this).attr("class").replace("new-" + noteSize, "");

        var e = $("<div></div>").addClass('note').addClass('note-' + noteSize).addClass(noteColor)
            .appendTo('#container')
            .hide()
            .fadeIn(300);
    
        var t = e.get(0);

        t.contentEditable = true;

        var heightNote = noteSize === 'normal' ? 100 : 46;
        
        e.css({ top: event.pageY - heightNote });
        starthandlers(t);
        e.trigger(event);
        $('.note').fadeIn();
    
        if ($('.note').length > maxnotes - 1) {
            $("#newbuttons").fadeOut(300);
        }
    }

    function applyRandomRotate(element) {
        var angle = getRandomAngle();
        element.style.transform = 'rotate(' + angle + 'deg)';
    }

    function starthandlers(element) {
        $(element).on("dragstart", ondragstart);
        $(element).on("drag", ondrag);
        $(element).on("dragend", ondragend);
        $(element).on('keyup', function (e) { checkCharcount(this, 140, e); });
        $(element).on('keydown', function (e) { checkCharcount(this, 140, e); });
        if (!$(element).hasClass('help')) {
            $(element).on('dblclick', onclickNote);
        }
        $(element).on('focus', function () { 
            $(this).addClass("selected"); 
           
        });
        $(element).on('blur', function () {
            $(this).removeClass("selected");
            updateNoteCounters();
            asyncSaveTaskboard();
        });
    }

    function onclickNote(event) {
        var el = $(this);
        event.stopPropagation();
        event.preventDefault();
        if (event.handled !== true) {
            deselectAllNotes();
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

    function ondragstart(ev, dd) {
        deselectAllNotes();
        applyRandomRotate($(this).get(0));
    }

    function ondrag(ev, dd) {
        $(this).css('z-index', 1000);

        normalizeZIndexes();
        $(this).css({
            top: dd.offsetY,
            left: dd.offsetX,
        });
        updateNoteCounters();
    }

    function checkminNotes() {
        if ($('.note').size() < maxnotes) {
            $("#newbuttons").fadeIn(300);
        }
        updateNoteCounters();
    }

    function ondragend() {
        if ($(this).position().top < -5) {
            $(this).animate({ opacity: 0.25, top: -200 }, 100, 'linear', function () {
                $(this).remove();
                checkminNotes();
            });
        }

        applyRandomRotate($(this).get(0));
        updateNoteCounters();
        asyncSaveTaskboard();
        return false;
    }

    function normalizeZIndexes() {
        var zIndex = 1; 
        $('.note').sort(function(a, b) { 
            return parseInt($(a).css('z-index')) - parseInt($(b).css('z-index'));
        }).each(function() {
            $(this).css('z-index', zIndex++); 
        });
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
            var el = $(this);
            var originalVisibility = el.css('visibility');
            var originalDisplay = el.css('display');
            el.css({ 'visibility': 'hidden', 'display': 'block' });
            var posNote = el.position().left;
            var posRel = posNote * 100 / screenwidth;
            var newPos = window.innerWidth * posRel / 100;
    
            el.css({ 'left': newPos, 'visibility': originalVisibility, 'display': originalDisplay });
            el.get(0).style.transform = 'rotate(0deg)';
        });
    
        screenwidth = window.innerWidth;
        saveTaskboard();
    }

    function onViewStateChanged(eventArgs) {
        recalcposition();
    }

    function deselectAllNotes() {
        $('.note').each(function () {
            $(this).removeClass('selected');
            if (this === document.activeElement) {
                this.blur(); // Quita el foco del elemento si está enfocado
            }
            
        });

        // Deseleccionar cualquier texto seleccionado en el documento
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox y otros
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }
    }

    return {
        init: init,
        isAnyNoteSelected: isAnyNoteSelected,
        deselectAllNotes: deselectAllNotes,
        toggleNotes: toggleNotes,
        toggleFullscreen: toggleFullscreen
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
