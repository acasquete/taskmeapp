const Taskboard = (function () {
    "use strict";
    let currentDashboardId;
    let dashboard;
    let observers = []; 
    var maxnotes = 30;
    var z = -maxnotes - 1;

    function init() {
        window.addEventListener("resize", onViewStateChanged);
        window.addEventListener('orientationchange', onViewStateChanged);
        document.addEventListener('keydown', onKeyPress);


        $(".new-normal").on("mousedown touchstart", onnew);
        $(".new-small").on("mousedown touchstart", onnew);
        $(".new-dot").on("mousedown touchstart", onnewdot);

        currentDashboardId = Config.getActiveDashboard();
        initDashboard(currentDashboardId, true);
    }

    function initDashboard(id, initial) {

        if (!initial) { 
            $("#dashboard-alert").stop(); 
            $("#dashboard-alert").text(id); 
            $("#dashboard-alert").fadeIn(100).delay(600).fadeOut(100);
        }

        if (currentDashboardId==id && !initial) return;

        $('.note').remove();
        $('.dot').remove();

        currentDashboardId = id;
        dashboard = Config.getDashboard(currentDashboardId);

        if (dashboard.notes.length < 1 && id==1) {
            showHelpNote();
        }

        initNotes(dashboard.notes);
        initDots(dashboard.dots);

        if (dashboard.screenwidth) {
            if (dashboard.screenwidth != window.innerWidth) {
                recalcposition();
            }
        } else {
            dashboard.screenwidth = window.innerWidth;
        }

        starthandlers(".note");
        starthandlersdot(".dot");
        checkminNotes();
        updateNoteCounters(); 

        Sketch.init(currentDashboardId);
        Config.saveActiveDashboard(currentDashboardId);
        notifyAllObservers();
    }

    function onKeyPress (e) {

        if ((e.ctrlKey || e.metaKey) && !isNaN(e.key)) {
            let num = parseInt(e.key);
            if (num >= 0 && num <= 9) {
                initDashboard(num);
                e.preventDefault();
            }
        }
    };

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
        $('.note,.dot').each(function() {
            if ($(this).css('display') === 'none') {
                $(this).fadeIn();
            } else {
                $(this).fadeOut();
            }
        });
    }

    function isAnyNoteSelected() {
        return $('.note p:focus').length > 0;
    }

    function removeAllNotes () {
        $(".note").css({ transition: 'all 0.8s', opacity: 0.25, transform: 'translateY(-1000px)' }).promise().then(function () {
            setTimeout(function () {
                $(".note").remove();
                $(".dot").remove();
                checkminNotes();
                asyncSaveTaskboard();
            }, 800);

        });
    }

    function clearCanvas () {
        Sketch.clearCanvas();
        asyncSaveTaskboard();
    }

    function updateNoteCounters() {
        let columnCounters = [0, 0, 0]; 
    
        let totalWidth = $('#taskboard').width();
        let columnWidths = [(3 / 8) * totalWidth, (3 / 8) * totalWidth, (2 / 8) * totalWidth];
    
        $('.note').each(function() {
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
    
        updateColumnTitle (1, 'To Do', columnCounters[0], 1000);
        updateColumnTitle (2, 'In Progress', columnCounters[1], 3);
        updateColumnTitle (3, 'Done', columnCounters[2], 1000);
    }

    function updateColumnTitle (num, title, total, max) {
        var numberSpan = $('<span>').text(total);
        if (total > max) {
            numberSpan.addClass('red-indicator');
        }

        $('#column' + num).text(title);
        if (total > 0) {
            $('#column' + num).append(' - ').append(numberSpan);
        }
    }

    function showHelpNote() {
        
        const content = `
        You're the best! Thanks for trying <b>TaskMe</b>, <em>The Sim Kanban Board!</em>
        <ul>
        <li><u>Create</u> a note by selecting a color on the left of the screen.</li>
        <li><u>Edit</u> a note by clicking on it.</li>
        <li><u>Remove</u> a note by dragging it to the top of the screen.</li></ul>
            (c)hange color (e)raser clear (a)ll (h)ide notes (f)ull screen<br/><br/>
            If you have any questions, ideas or suggestions, please feel free to contact me at <a target='_blank' href='http://www.x.com/acasquetenotes'>X@acasquetenotes</a>
            or open an issue on GitHub at <a target='_blank' href='http://www.github.com/acasquete/taskmeapp/issues'>www.github.com/acasquete/taskmeapp</a>
        `;

        $(".note-help").remove();
        $(".note").fadeIn();
        
        createNote("20%", "25%", 500, "note tomato note-help", content, 0, false);
        starthandlers(".note-help");
        Controls.hideappbar();
    }

    function asyncSaveTaskboard() {
        window.setTimeout(function () {
            saveTaskboard();
        }, 500);
    }

    function createNote(left, top, index, style, content, dots, editable) {

        try {

            if (!style.includes('note-normal') && !style.includes('note-small') && !style.includes('note-help')) {
                style += ' note-normal ';
            }

            $('<div><span class=dots></span><p></p></div>')
            .css({
                'left': left,
                'top': top,
                'z-index': index,
                'position': 'absolute', 
                'transform': 'rotate(' + getRandomAngle() + 'deg)'
            })
            .addClass(style)
            .each(function() {
                var dotsElement = $(this).find('.dots');
                for (var i = 0; i < dots; i++) {
                    $('<div></div>').addClass('dot-internal').appendTo(dotsElement);
                }
                var pElement = $(this).find('p');
                pElement.html(content);

                if (editable) {
                    pElement.attr('contenteditable', 'true');
                }
            })
            .appendTo('#container');
                
        } catch (ex) {
            console.error('Error creating note:', ex);
        }
    }

    function createDot(left, top, index, style) {

        try {

            $('<div draggable="true"></div>')
                .addClass(style)
                .css({
                    'left': left,
                    'top': top,
                    'z-index': index,
                    'position': 'absolute'
                })
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
            createNote(notes[i].l, notes[i].t, notes[i].i, notes[i].cl, notes[i].c, notes[i].d, true);
            if (z < notes[i].i) z = notes[i].i;
        }
        z++;
        $('.dot-internal').on('dblclick', function () { 
            $(this).fadeOut(500, function() {
                 $(this).remove();
                 asyncSaveTaskboard();
             });
        });
    }

    function initDots(dots) {
        if (dots === undefined) return;

        for (var i = 0; i < dots.length; i++) {
            createDot(dots[i].l, dots[i].t, dots[i].i, dots[i].cl);
        }
    }

    function extractSizeFromClass(className) {
        var parts = className.split('-');
        return parts.length > 1 ? parts[1] : null;
    }

    function onnewdot (ev) {
        normalizeZIndexes();

        var e = $("<div></div>").addClass('dot')
            .appendTo('#container')
            .css({
                'z-index': 500
            })
            .hide()
            .fadeIn(300);

        var t = e.get(0);
        e.css({ left: ev.pageX - 15, top: ev.pageY - 15 });
        starthandlersdot(e);
        e.trigger(ev);

        $('.note').fadeIn();
        $('.dot').fadeIn();
    }
    function onnew(event) {

        var noteSize = extractSizeFromClass($(this).attr("class"));
        var noteColor = $(this).attr("class").replace("new-" + noteSize, "");
        
        normalizeZIndexes();

        var e = $("<div><div class=dots></div><p contenteditable></p></div>").addClass('note').addClass('note-' + noteSize).addClass(noteColor)
            .appendTo('#container')
            .css({
                'z-index': 500
            })
            .hide()
            .fadeIn(300);
    
        var t = e.get(0);

        var heightNote = noteSize === 'normal' ? 100 : 46;
        
        e.css({ left: event.pageX - 20, top: event.pageY - heightNote });
        starthandlers(t);
        
        e.trigger(event);
        
        $('.note').fadeIn();
        $('.dot').fadeIn();
    
        if ($('.note').length > maxnotes - 1) {
            $("#newbuttons").fadeOut(300);
        }
    }

    function applyRandomRotate(element) {
        var angle = getRandomAngle();
        element.style.transform = 'rotate(' + angle + 'deg)';
    }

    function starthandlersdot(element) {
        $(element).on("dragstart touchstart", ondragstartdot);
        $(element).on("drag touchmove", ondrag);
        $(element).on("dragend touchend", ondragend);
        $(element).on("dblclick", function () { $(this).remove() });
        $(element).draggable();
    }

    function starthandlers(element) {
        $(element).on("dragstart touchstart", ondragstart);
        $(element).on("drag touchmove", ondrag);
        $(element).on("dragend touchend", ondragend);
        
        if (!$(element).hasClass('note-help')) {
            $(element).find('p:first').on('keyup', function (e) { checkCharcount(this, 140, e); });
            $(element).find('p:first').on('keydown', function (e) { checkCharcount(this, 140, e); });
            $(element).find('p:first').on('click', onclickNote);
            
            $(element).droppable({
                drop: function( event, ui ) {
                    $("<div></div>").addClass('dot-internal').appendTo($(this).find('.dots'))
                    .on('dblclick', function() {
                        $(this).fadeOut(500, function() { 
                            $(this).remove(); 
                            asyncSaveTaskboard();
                        });
                    });
                    ui.draggable.remove();
                }
              });
        }
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
    let dragged = null;

    function ondragstart(ev, dd) {

        deselectAllNotes();
        applyRandomRotate($(this).get(0));
    }

    function ondragstartdot(ev, dd) {
        dragged = ev.target;
        $(dragged).css('z-index', 1000);

        deselectAllNotes();
    }

    function ondrag(ev, dd) {
        $(this).css('z-index', 1000);
        

        if (ev.type === "touchmove") {
            if (event.targetTouches.length == 1) {
                var touch = event.targetTouches[0];
                this.style.left = touch.pageX + 'px';
                this.style.top = touch.pageY + 'px';
            }
        } else if (ev.type === "drag") {
            $(this).css({
                top: dd.offsetY,
                left: dd.offsetX,
            });
        }
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
    
        var random = Math.floor(Math.random() * 3);
        if ($(this).hasClass("note-corner-right")) {
            $(this).removeClass("note-corner-right");
        }
        if ($(this).hasClass("note-corner-left")) {
            $(this).removeClass("note-corner-left");
        }

        if (random === 0) {
            $(this).addClass("note-corner-right");
        } else if (random === 1) {
            $(this).addClass("note-corner-left");
        }
        
        applyRandomRotate($(this).get(0));
        normalizeZIndexes();
        updateNoteCounters();
        asyncSaveTaskboard();
        return false;
    }

    function normalizeZIndexes() {
        
        var zIndex = 1; 
        
        $('.dot').sort(function(a, b) { 
            return parseInt($(a).css('z-index')) - parseInt($(b).css('z-index'));
        }).each(function() {
            $(this).css('z-index', zIndex++); 
        });
        
        $('.note').sort(function(a, b) { 
            return parseInt($(a).css('z-index')) - parseInt($(b).css('z-index'));
        }).each(function() {
            $(this).css('z-index', zIndex++); 
        });
    }

    function saveTaskboard() {
        let notesArray = [];
        let dotsArray = [];

        $('.note').each(function () {
            var el = $(this).get(0);
            var content = $(el).find('p').html();
            var dotsCount = $(el).find('.dots').children().length;
            notesArray.push({ c: content, i: el.style.zIndex, l: el.style.left, t: el.style.top, cl: el.className, d:dotsCount });
        });

        $('.dot').each(function () {
            var el = $(this).get(0);
            dotsArray.push({ i: el.style.zIndex, l: el.style.left, t: el.style.top, cl: el.className });
        });

        dashboard.notes = notesArray;
        dashboard.dots = dotsArray;
        
        Config.saveDashboard(currentDashboardId, dashboard);
    }

    function recalcposition() {
        $(".note, .dot").each(function () {
            var el = $(this);

            var originalVisibility = el.css('visibility');
            var originalDisplay = el.css('display');
            el.css({ 'visibility': 'hidden', 'display': 'block' });
            
            var posNote = el.position().left;
            var posRel = posNote * 100 / dashboard.screenWidth;
            
            var newPos = jQuery(window).width() * posRel / 100;
    
            el.css({ 'left': newPos, 'visibility': originalVisibility, 'display': originalDisplay });
            el.get(0).style.transform = 'rotate(0deg)';
        });
    
        dashboard.screenWidth = jQuery(window).width();
        saveTaskboard();
    }

    function onViewStateChanged(eventArgs) {
        recalcposition();
    }

    function deselectAllNotes() {
        $('.note').each(function () {
            $(this).removeClass('selected');
            if (this === document.activeElement) {
                this.blur(); 
            }
            
        });

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

    function addObserver (observer) {
        observers.push(observer);
    }

    function notifyAllObservers (observer) {
        observers.forEach(function(observer) {
            observer.update(currentDashboardId);
        });
    }

    return {
        init: init,
        isAnyNoteSelected: isAnyNoteSelected,
        deselectAllNotes: deselectAllNotes,
        toggleNotes: toggleNotes,
        toggleFullscreen: toggleFullscreen,
        removeAllNotes: removeAllNotes,
        showHelpNote: showHelpNote,
        clearCanvas: clearCanvas,
        switch: initDashboard,
        addObserver: addObserver,
        notifyAllObservers: notifyAllObservers
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

