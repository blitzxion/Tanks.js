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

        return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    }
})();

function Boid(x, y) {
    var state = new PhysicsState();

    state.position[0] = x;
    state.position[1] = y;
    state.momentum[0] = 50.0 * Math.random() - 25.0;
    state.momentum[1] = -30.0 * Math.random() - 120.0;
    state.recalculate();

    this.color = getNextColor();
    this.state = state;
}

Boid.prototype = {
    radius: 5,

    render: function(ctx) {
        ctx.beginPath();
        ctx.arc(this.state.position[0], this.state.position[1], this.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    },

    forces: function(state, t) {
        return { force: GRAVITY, torque: [0.0, 0.0] };
    },

    update: function(t, dt) {
        var box = this;

        this.state.integrate(t, dt, function(state, t) {
            return box.forces(state, t);
            });

        if (canvas.width < this.state.position[0] + this.radius) {
            this.state.position[0] = canvas.width - this.radius;
            this.state.momentum[0] = -0.2 * Math.abs(this.state.momentum[0]);
            this.state.recalculate();

        } else if (0 > this.state.position[0] - this.radius) {
            this.state.position[0] = this.radius;
            this.state.momentum[0] = 0.2 * Math.abs(this.state.momentum[0]);
            this.state.recalculate();
        }

        if (canvas.height < this.state.position[1] + this.radius) {
            this.state.position[1] = canvas.height - this.radius;
            this.state.momentum[1] = -0.2 * Math.abs(this.state.momentum[1]);
            this.state.recalculate();

        } else if (0 > this.state.position[1] - this.radius) {
            this.state.position[1] = this.radius;
            this.state.momentum[1] = 0.2 * Math.abs(this.state.momentum[1]);
            this.state.recalculate();
        }
    },
};

function collide(a, b) {
    // separation vector
    var n = V2.sub(b.state.position, a.state.position);

    // distance between circle centres, squared
    var d2 = V2.lengthSquared(n);

    // combined radius squared
    var r = b.radius + a.radius;
    var r2 = r * r;

    // circles too far apart
    if(d2 > r2)
        return false;

    // distance between circle centres
    var d = Math.sqrt(d2);

    // normal of collision
    V2.scale(n, 1 / d, n);

    // penetration distance
    var p = (r - d);

    // separation vector
    var s = V2.scale(n, p / (a.state.inverseMass + b.state.inverseMass));

    // separate the circles
    V2.sub(a.state.position, V2.scale(s, a.state.inverseMass), a.state.position);
    V2.add(b.state.position, V2.scale(s, b.state.inverseMass), b.state.position);

    // combines momentum
    var v = V2.sub(b.state.momentum, a.state.momentum);

    // impact momentum
    var vn = V2.dot(v, n);

    // obejcts are moving away. dont reflect momentum
    if (vn > 0.0)
        return true; // we did collide

    // coefficient of restitution in range [0, 1].
    var cor = 0.95;

    // collision impulse
    var j = -(1.0 + cor) * (vn) / (a.state.inverseMass + b.state.inverseMass);

    // collision impusle vector
    var impulse = V2.scale(n, j);

    // change momentum of the circles
    V2.sub(a.state.momentum, impulse, a.state.momentum);
    V2.add(b.state.momentum, impulse, b.state.momentum);
    a.state.recalculate();
    b.state.recalculate();

    // collision reported
    return true;
}

window.onload = function() {
    var next = (new Date).getTime(),
        dt = TIMESTEP / 1000, max = 10,
        canvas = document.getElementById("canvas"),
        ctx = canvas.getContext("2d"),
        boids = [],
        timer = 0.0;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function update() {
        timer += dt;
        if (0.33 < timer) {
            boids.push(new Boid(canvas.width * 0.5, canvas.height - 10.0));
            timer = 0.0;
        }

        for (var i = 0; i < boids.length; ++i) {
            boids[i].update((new Date).getTime() / 1000.0, dt)

            for (var j = i + 1; j < boids.length; ++j) {
                collide(boids[i], boids[j]);
            }
        }
    }

    function render() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < boids.length; ++i) {
            boids[i].render(ctx)
        }
    }

    function step() {
        var i = 0;

        window.requestAnimationFrame(step);

        while ((new Date).getTime() > next && i < max) {
            update();
            next += TIMESTEP;
            i++;
        }

        if (0 < i)
            render();
    }

    step();
};
