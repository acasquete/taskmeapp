(function () {
    "use strict";

    function stripTags(text) {
        var div = document.createElement("div");
        div.innerHTML = text;
        return div.textContent || div.innerText || "";
    }

    function timeDifference(laterdate, earlierdate) {
        var difference = laterdate.getTime() - earlierdate.getTime();
 
        var daysDifference = Math.floor(difference/1000/60/60/24);
        difference -= daysDifference * 1000 * 60 * 60 * 24;
 
        var hoursDifference = Math.floor(difference/1000/60/60);
        difference -= hoursDifference * 1000 * 60 * 60;
 
        var minutesDifference = Math.floor(difference/1000/60);
        difference -= minutesDifference * 1000 * 60;
 
        var secondsDifference = Math.floor(difference/1000);
 
        return pad(minutesDifference, 2) + ':' + pad(secondsDifference, 2);
    }
    
    function pad(a, b) { return (1e15 + a + "").slice(-b); }

    window.Utils = {
        stripTags: stripTags,
        timeDifference: timeDifference,
        pad: pad
    };

})();
