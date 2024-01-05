
(function () {
    "use strict";

    function writeBlobToFile(blob, filename) {
       
        var knownFolders = Windows.Storage.KnownFolders;
        knownFolders.picturesLibrary.createFileAsync(filename, Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (file) {
            // Abre el archivo devuelto para copiar la info
            file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (output) {

                // Obtiene IInputStream del objeto blob
                var input = blob.msDetachStream();

                // Copia el stream del blob a un stream de File
                Windows.Storage.Streams.RandomAccessStream.copyAsync(input, output).then(function () {
                    output.flushAsync().done(function () {
                        input.close();
                        output.close();
                        new Windows.UI.Popups.MessageDialog("Fichero '" + file.name +
                            "' guardado correctamente en Pictures Library!").showAsync();

                    });
                });
            });
        });
    }


    function stripTags(text) {
        var div = document.createElement("div");
        div.innerHTML = text;
        return div.textContent || div.innerText || "";
    }

    function timeDifference(laterdate,earlierdate) {
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

    WinJS.Namespace.define("Utils", {
        stripTags: stripTags,
        timeDifference: timeDifference,
        pad: pad
    });



})();
