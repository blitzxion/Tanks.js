// Two.js has a built in way to add/overwrite properties with your own
// I'm adding in work that allows me to return objects that are generated, but not added to the scene


if(Two != undefined)
{
	/**
	* Constants
	*/

	var sin = Math.sin,
		cos = Math.cos,
		atan2 = Math.atan2,
		sqrt = Math.sqrt,
		round = Math.round,
		abs = Math.abs,
		PI = Math.PI,
		TWO_PI = PI * 2,
		HALF_PI = PI / 2,
		pow = Math.pow;

	var VisualFuncs = {
		show: function(){ this.visible = true; if(this) return this; },
		hide: function(){ this.visible = false; if(this) return this; },
		toggle: function(){ this.visible = !this.visible; if(this) return this; }
	};

	_.extend(Two.Polygon.prototype, VisualFuncs);
	_.extend(Two.Group.prototype, VisualFuncs);

	_.extend(Two.prototype,{

		createLine: function(x1, y1, x2, y2) {

		  var width = x2 - x1;
		  var height = y2 - y1;

		  var w2 = width / 2;
		  var h2 = height / 2;

		  var points = [
			new Two.Vector(- w2, - h2),
			new Two.Vector(w2, h2)
		  ];

		  // Center line and translate to desired position.
		  var line = new Two.Polygon(points).noFill();
		  line.translation.set(x1 + w2, y1 + h2);

		  return line;
		},

		createRectangle: function(x, y, width, height) {

		  var w2 = width / 2;
		  var h2 = height / 2;

		  var points = [
			new Two.Vector(w2, h2),
			new Two.Vector(-w2, h2),
			new Two.Vector(-w2, -h2),
			new Two.Vector(w2, -h2)
		  ];

		  var rect = new Two.Polygon(points, true);
		  rect.translation.set(x, y);
		  return rect;

		},

		createCircle: function(ox, oy, r) {

		  return this.makeEllipse(ox, oy, r, r);

		},

		createEllipse: function(ox, oy, width, height) {

		  var amount = Two.Resolution;

		  var points = _.map(_.range(amount), function(i) {
			var pct = i / amount;
			var theta = pct * TWO_PI;
			var x = width * cos(theta);
			var y = height * sin(theta);
			return new Two.Vector(x, y);
		  }, this);

		  var ellipse = new Two.Polygon(points, true, true);
		  ellipse.translation.set(ox, oy);

		  return ellipse;

		},

		createCurve: function(p) {

		  var l = arguments.length, points = p;
		  if (!_.isArray(p)) {
			points = [];
			for (var i = 0; i < l; i+=2) {
			  var x = arguments[i];
			  if (!_.isNumber(x)) {
				break;
			  }
			  var y = arguments[i + 1];
			  points.push(new Two.Vector(x, y));
			}
		  }

		  var last = arguments[l - 1];
		  var poly = new Two.Polygon(points, !(_.isBoolean(last) ? last : undefined), true);
		  var rect = poly.getBoundingClientRect();

		  var cx = rect.left + rect.width / 2;
		  var cy = rect.top + rect.height / 2;

		  _.each(poly.vertices, function(v) {
			v.x -= cx;
			v.y -= cy;
		  });

		  poly.translation.set(cx, cy);

		  return poly;

		},

		/**
		 * Convenience method to make and draw a Two.Polygon.
		 */
		createPolygon: function(p) {

		  var l = arguments.length, points = p;
		  if (!_.isArray(p)) {
			points = [];
			for (var i = 0; i < l; i+=2) {
			  var x = arguments[i];
			  if (!_.isNumber(x)) {
				break;
			  }
			  var y = arguments[i + 1];
			  points.push(new Two.Vector(x, y));
			}
		  }

		  var last = arguments[l - 1];
		  var poly = new Two.Polygon(points, !(_.isBoolean(last) ? last : undefined));
		  poly.center();

		  return poly;

		},

		createGroup: function(o) {

		  var objects = o;
		  if (!_.isArray(o)) {
			objects = _.toArray(arguments);
		  }
		  var group = new Two.Group();
		  group.add(objects);

		  return group;

		}

	});
}