document.addEventListener('DOMContentLoaded', function() {
    var config = Config.getAll();

    Sketch.initialize();
    Taskboard.init(config.notes);
    Controls.init();
    Pomodoro.initialize(config.pomodoro);
});