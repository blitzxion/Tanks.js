// shapedata.js

// Here are all the difference shapes for tanks,bases,planes,special units, etc. TankType from garage.js will grab one of theses.
// Shape data contains a valid kinectjs shape object. They will get a base setting which can be changed in garage.js (like color)

// Base (the Building)
var KBaseShape = function(){
	return new Kinetic.Rect({
		x: 0,
		y: 0,
		width: 20,
		height: 20,
		strokeWidth: 1,
		//centerOffset : [10,10]
	});
}

// Standard Tank Base (used by most tanks)
var KTankShape = function(color, colorAlpha){
	return new Kinetic.Rect({
		x : 0,
		y : 0,
		width: 28,
		height: 16,
		fill : colorAlpha,
		stroke : color,
		strokeWidth: 1,
		rotation : 0,
		offset: [14,8] // Sets the 0,0 position to the center of the object
	});
}

// Mammoth Tank!
var KMammothTank = function(color, colorAlpha){
	return new Kinetic.Polygon({
		points : [0,0, 23,0, 23,5, 28,5, 28,0, 38,0, 38,10, 33,10, 33,15, 38,15, 38,25, 28,25, 28,20, 23,20, 23,25, 0,25, 0,17, 12,17, 12,8, 0,8],
		fill: colorAlpha,
		stroke: color,
		strokeWidth: 1,
		offset: [19,12.5] // /sigh, Y: 12.5
		//draggable : true
	});
}

// Healer Tank
var KHealerTank = function(color, colorAlpha){
	// Special case since this tank has a few different shapes...
	var group = new Kinetic.Group({
		x: 0,
		y: 0,
		offset: [8, 14]
	});

	// Body
	var bodyShape = new Kinetic.Rect({
		x: 0,
		y: 0,
		width: 28,
		height: 16,
		fill: colorAlpha,
		stroke: color,
		strokeWidth: 1,
	});

	// Roof
	var roofShape = new Kinetic.Rect({
		x:0,
		y:0,
		width: 16,
		height: 16,
		fill: colorAlpha,
		stroke: color,
		strokeWidth: 1
	});

	// Hood
	var hoodShape = new Kinetic.Line({
		points : [16,5,28,4,28,12,16,11],
		stroke: color,
		strokeWidth : "1"
	});

	var plusShape = new Kinetic.Star({ // Lol hack
		x:8,
		y:8,
		numPoints:4,
		innerRadius:0,
		outerRadius:8,
		fill:"white",
		stroke : "white",
		strokeWidth : "4"
	});	

	group.add(bodyShape);
	group.add(roofShape);
	group.add(hoodShape);
	group.add(plusShape);

	return group;
};

// Scout/Predator Drone (UAV)
var KDronePlane = function(color, colorAlpha){
	// Inspired By: http://marcosstyll.webs.com/Predator%20Drone%20(UAV).jpg
	return new Kinetic.Polygon({
		points : [0,16, 3,14, 3,8, 6,8, 8,14, 13,14, 13,0, 16,2, 16,14, 23,14, 26,16, 28,16, 26,16, 23,18, 16,18, 16,30, 13,32, 13,18, 8,18, 6,24, 3,24, 3,18 ],
		fill: colorAlpha,
		stroke: color,
		strokeWidth: 1,
		scale: .75, // I'm lazy, this helps reduce the size of the plane so it makes sense!
		offset: [14,16]
	});
}

var KFighterPlane = function(color, colorAlpha){
	return new Kinetic.Polygon({
		points : [0,16, 3,14, 3,8, 6,8, 8,14, 13,14, 13,0, 16,2, 16,14, 23,14, 26,16, 28,16, 26,16, 23,18, 16,18, 16,30, 13,32, 13,18, 8,18, 6,24, 3,24, 3,18 ],
		fill: colorAlpha,
		stroke: color,
		strokeWidth: 1,
		scale: .75 // I'm lazy, this helps reduce the size of the plane so it makes sense!
		//offset: [19,12.5]
	});
};

var KBomberPlane = function(color, colorAlpha){
	return new Kinetic.Polygon({
		points : [0,16, 3,14, 3,8, 6,8, 8,14, 13,14, 13,0, 16,2, 16,14, 23,14, 26,16, 28,16, 26,16, 23,18, 16,18, 16,30, 13,32, 13,18, 8,18, 6,24, 3,24, 3,18 ],
		fill: colorAlpha,
		stroke: color,
		strokeWidth: 1,
		scale: .75 // I'm lazy, this helps reduce the size of the plane so it makes sense!
		//offset: [19,12.5]
	});
};

// Here are all the possible turret configurations. Turrets are entities own their own, so they have separate shape data.

var KStandardTurret = function(type, color){

	// type.TurretSize : 10,
	// type.BarrelLength : 20,
	// type.DoubleTurret : true,
	// type.TurretSeparation : 3.5,

	var group = new Kinetic.Group();

	if(type.DoubleTurret)
	{
		var barrel1 = new Kinetic.Line({
			points : [0,type.TurretSeparation,type.BarrelLength,type.TurretSeparation],
			stroke: color,
			strokeWidth : 1
		});
		var barrel2 = new Kinetic.Line({
			points : [0,-type.TurretSeparation,type.BarrelLength,-type.TurretSeparation],
			stroke: color,
			strokeWidth : 1
		});

		group.add(barrel1);
		group.add(barrel2);
	}
	else
	{
		var barrel = new Kinetic.Line({
			points : [0,0,type.BarrelLength,0],
			stroke: color,
			strokeWidth : 1
		});
		group.add(barrel);
	}

	var turret = new Kinetic.Ellipse({
		radius: type.TurretSize,
		fill : color,
		strokeWidth : 0
	});

	group.add(turret);
	

	return group;

};
