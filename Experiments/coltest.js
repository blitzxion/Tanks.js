var GRAVITY = [0.0, 9.81],
    TIMESTEP = 33;

var getNextColor = (function() {
    var hue = Math.random() * 360.0,
        saturation = 1.0,
        value = 1.0;

    return function() {
        var rgb = hsv2rgb(hue, saturation, value);

        for (var i = 0; i < 3; ++i) {
            rgb[i] = Math.floor(255 * rgb[i]);
        }

        hue = (hue + 23.0) % 360.0;

        return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    }
})();

function Box(x, y) {
    var state = new PhysicsState();

    state.position[0] = x;
    state.position[1] = y;
    state.momentum[0] = 40.0 * Math.random() - 20.0;
    state.momentum[1] = -90.0 * Math.random() - 45.0;
    state.recalculate();

    this.color = getNextColor();
    this.state = state;
}

Box.prototype = {
    width: 10,
    height: 10,

    render: function(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.state.position[0], this.state.position[1], this.width, this.height);
    },

    forces: function(state, t) {
        return { force: GRAVITY, torque: [0.0, 0.0] };
    },

    update: function(t, dt) {
        var box = this;

        this.state.integrate(t, dt, function(state, t) {
            return box.forces(state, t);
            });

        if (canvas.height - 10 < this.state.position[1]) {
            this.state.position[1] = canvas.height - 11;
            this.state.momentum[1] = -0.2 * Math.abs(this.state.momentum[1]);
            this.state.recalculate();
        }
    },
};

(function() {
    setInterval((function() {
        var next = (new Date).getTime(),
            dt = TIMESTEP / 1000, max = 10,
            canvas = document.getElementById("canvas"),
            ctx = canvas.getContext("2d"),
            boxes = [],
            timer = 0.0;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        function update() {
            timer += dt;
            if (0.5 < timer) {
                boxes.push(new Box(canvas.width * 0.5, canvas.height - 10.0));
                timer = 0.0;
            }

            for (var i = 0; i < boxes.length; ++i) {
                boxes[i].update((new Date).getTime() / 1000.0, dt)
            }
        }

        function render() {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < boxes.length; ++i) {
                boxes[i].render(ctx)
            }
        }

        render();

        return function() {
            var i = 0;

            while ((new Date).getTime() > next && i < max) {
                update();
                next += TIMESTEP;
                i++;
            }

            if (0 < i)
                render();
        }
    })(), 0);
})();

