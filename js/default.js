document.addEventListener('DOMContentLoaded', function() {
    var config = Config.getAll();

    Sketch.initialize();
    Taskboard.init(config.notes);
   //Pomodoro.initialize(config.pomodoro);
});