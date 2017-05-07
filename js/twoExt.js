// Two.js has a built in way to add/overwrite properties with your own
// I'm adding in work that allows me to return objects that are generated, but not added to the scene


if(Two != undefined)
{
	// https://github.com/jonobr1/two.js/issues/19
	var PolygonFuncs = {
		show: function(){ this.visible = true; if(this) return this; },
		hide: function(){ this.visible = false; if(this) return this; },
		toggle: function(){ this.visible = !this.visible; if(this) return this; }
	};
	var GroupFuncs = {
		show: function() { _.each(this.children, function(child) { child.show(); }); return this; },
		hide: function() { _.each(this.children, function(child) { child.hide(); }); return this; },
		toggle: function() { _.each(this.children, function(child) { child.toggle(); }); return this; }
	};

	_.extend(Two.Polygon.prototype, PolygonFuncs);
	_.extend(Two.Group.prototype, GroupFuncs);
}