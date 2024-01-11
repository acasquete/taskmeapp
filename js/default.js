document.addEventListener('DOMContentLoaded', function() {
    var config = Config.getAll();

    Sketch.init();
    Taskboard.init(config.notes);
    Controls.init();
    Pomodoro.initialize(config.pomodoro);
});