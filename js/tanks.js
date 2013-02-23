var stats = new Stats();

var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight - 40, // Bottom banner height
	MAX_MOVE_ANGLE = 2,
	MOVE_PROB = 0.01,
	ANIMATION_ID = null,
	FPS_TOO_LOW = 45;

// Canvas Related
var STAGE = null,
	LAYER = null,
	ANIM = null,
	IsAnimating = false,
	EXPLOSIONLAYER = null,
	SMOKELAYER = null,
	BULLETLAYER = null,
	MISCLAYER = null;

var IS_IPAD = navigator.platform === 'iPad',
	IS_IPHONE = navigator.platform === 'iPhone',
	IS_ANDROID = navigator.userAgent.toLowerCase().indexOf("android") != -1,
	IS_IOS = IS_IPAD || IS_IPHONE || navigator.userAgent.indexOf("iPod") != -1,
	IS_MOBILE = IS_IOS || IS_ANDROID;

// Sigh, vars... vars everywhere
var ROUND = 0, // func RESET() increases this on new rounds.
	NUM_TEAMS = IS_MOBILE ? 2 : IS_IPAD ? 3 : 4, // This is the max amount on the playing field.
	MAX_UNITS_ON_SCREEN = IS_MOBILE ? 10 : 50, // down from 80... that was killing the browser
	MAX_UNITS_PER_FACTION_ON_MAP = 0,
	MAX_BASE_UNITS = 0,
	MAX_BASE_DEFENSES = 0,
	MAX_SPECIAL_UNITS = 0,
	RANDOM_COLORS = true,
	RANDOM_TERRAIN = true,
	GOD_MODE = false, // While enabled, click methods will fire
	DRAW_GOD_MODE_HELP = false,
	MAP_MIN_LOC = 20,
	SCORE_TO_WIN = IS_MOBILE ? 2000 : 30000,
	WINNING_TEAMS = [],
	DAMAGE_MULTIPLIER = 1, // 1 is normal, 0 will screw up the unit! increase/decrease for desired output
	WORLD_WRAP = true, // AWESOME, when this is off the tanks will bounce on the edges... LEAVE IT ON!
	BASE_HEAL_RADIUS	= (IS_MOBILE ? 45 : 60),
	HEALTH_COOLDOWN		= 100,
	MOVE_RANGE = 100,
	MOVE_PROB = 0.01,
	RESTARTING = false,
	MAX_MOVE_ANGLE = 2,
	EVADE_SWITCH_COOLDOWN_SECS = 3,
	MIN_SEPERATION_OF_STARTING_BASES = (BASE_HEAL_RADIUS * 2) + 30,
	SHELL_DAMAGE_RADIUS = 30,
	BOMB_DAMAGE_RADIUS = 20,
	MISSLE_ACCELERATION = 0.3,
	MISSLE_ROTATION = 2,
	MAX_MISSLE_ROTATION = 0.4,
	MIN_BASE_DISTANCE_SQUARE =  MIN_SEPERATION_OF_STARTING_BASES + (WIDTH / 5),
	TOTAL_PROB = 0;

// Debug
var DRAW_FOV = false,
	DRAW_TARGET_LINE = false,
	DRAW_HPBAR = true,
	DRAW_HPBAR_TEXT = false, // Enable to display the hp values above the hp bars.
	DRAW_EXPLOSIONS = true;

// Pools and Lists (mainly lists)
var TeamPool = new gamecore.LinkedList(); // List of Teams

window.onload = function() {

	// Stats
	stats.setMode(0);
	stats.domElement.style.position = "absolute";
	stats.domElement.style.left = "0px";
	stats.domElement.style.top = HEIGHT - 30 + "px";
	document.body.appendChild(stats.domElement);

	STAGE = new Kinetic.Stage({ container: "container", width: WIDTH, height: HEIGHT});
	document.getElementById("container").style.height = HEIGHT + "px"; // So the bottom banner can freaking appear

	/*
	 * setting the listening property to false will improve
	 * drawing performance because the rectangles won't have to be
	 * drawn onto the buffer context
	 */
	LAYER = new Kinetic.Layer({
		listening: false,
	});

	MISCLAYER = new Kinetic.Layer({listening:true});
	BULLETLAYER = new Kinetic.Layer();
	EXPLOSIONLAYER = new Kinetic.Layer();
	SMOKELAYER = new Kinetic.Layer();

	STAGE.add(MISCLAYER);
	STAGE.add(LAYER);
	STAGE.add(BULLETLAYER);
	STAGE.add(SMOKELAYER);
	STAGE.add(EXPLOSIONLAYER);

	ANIM = new Kinetic.Animation(function(frame){
		draw();
	},LAYER);

	SetupGame();
	RestartGame();
	ANIM.start();
	IsAnimating = true;
};

window.onresize = function(event) {
	ANIM.stop();
	IsAnimating = false;

	WIDTHPREV = WIDTH;
	HEIGHTPREV = HEIGHT;
	WIDTH = window.innerWidth; /* big bag of WTF on iOS with orientation changes */
	HEIGHT = window.innerHeight - 40; /* stable on iOS */
	document.getElementById("container").style.height = HEIGHT + "px";
	if(stats !== null)
		stats.domElement.style.top = HEIGHT - 30 + "px";

	STAGE.setSize(WIDTH,HEIGHT); // w x h

	// Move Items
	var xRatio = WIDTH / WIDTHPREV, yRatio = HEIGHT / HEIGHTPREV; //shapes = LAYER.getChildren();
	var n = TeamPool.first;
	while(n) {
		var u = n.obj.units.first;
		while(u) {
			u.obj.X = u.obj.X * xRatio;
			u.obj.Y = u.obj.Y * yRatio;

			var unit = u.obj.Shape;
			unit.setX(unit.getX() * xRatio);
			unit.setY(unit.getY() * yRatio);
			u = u.nextLinked;
		}
		n = n.nextLinked;
	}

	ANIM.start();
	IsAnimating = true;
};


// Color Class
function Color (r, g, b){
	this.R = r; this.G = g; this.B = b;
	var This = this;
	this.getString = function() { return "rgb(" + This.R + "," + This.G + "," + This.B + ")"; };
	this.getStringAlpha = function(alpha) { return "rgba(" + This.R + "," + This.G + "," + This.B + ", " + alpha + ")"; };
	this.getStringAlphaPreferred = function(alpha) { return (IS_MOBILE) ? this.getString() : this.getStringAlpha(alpha); };
}

// Enums and Special Vars for Tanks/Teams

var TankStateEnum = {
	IDLE: 0,
	MOVE: 1,
	TARGET_AQUIRED: 2,
	TARGET_IN_RANGE: 3,
	CRASH_AND_BURN: 4,
	EVADE: 5,
	STOP_AND_GUARD: 6
};

var ShotTypeEnum = {
	NONE   : 0,
	BULLET : 1,
	SHELL  : 2,
	MISSLE : 3,
	BOMB   : 4
};

var TeamColors = [
	new Color(255, 0, 0),
	new Color(0, 255, 0),
	new Color(0, 255, 255),
	new Color(255, 0, 255),
	new Color(255, 255, 0),
	new Color(0, 0, 255),
	new Color(255, 255, 255)
];

var tcIndex,
	TerrainColors = [
		//[148, 92, 18], // Mud
		[39,40,34], //darkness
		//[57,118,40], // Tundra
		//[216, 213, 201], // Desert
		//[177,173,165], // Snow
		//[175, 128, 74], //mars
		[112, 128, 144],  // Moon
		//[0,0,0] // space!
		//[98,146,134], //rain
		//[198, 191, 165], //slate
		//[117, 113, 75], //field
		//[181, 144, 92], //wood
		//[145, 158, 88], //greenish
		//[32, 22, 12], //darkish brown
		//[83, 64, 60], //chocolate
		//[77, 52, 21], //poop
		//[47, 1, 73], //galaxy purple
		//[13, 44, 75], //blue ocean
		//[46, 68, 94] //ocean 2
];

// Team
	var Team = gamecore.Base.extend('Team',{},
	{
		// Instance
		invincible:false,
		name:null,color:null,
		score:0,totalScore:0,
		taken:0,given:0,usedTickets:0,
		lastTargetFound: null, hasLost: false, thisTeam: null,
		unitCooldown: Math.random()*180|80,
		units: null, // Should be a list of units (Doubly Linked List!)
		numBases: 0, numTurrets:0, // It less taxing this way

		init: function(color, name){
			this.color = color;
			this.name = name;
			this.lastTargetFound = new Date();
			this.thisTeam = this;
			this.units = new gamecore.LinkedList();
		},
		createUnit : function(x,y){
			// Logic here to randomly select which until will be added here!
			// The builder will be calling this to make the team build a unit...
			// No need to continue if we're maxed out on units
			this.score = this.units.length();
			if(this.score >= MAX_UNITS_PER_FACTION_ON_MAP) return;

			if(this.unitCooldown > 0){ this.unitCooldown--; return; }

			var rand = Math.floor(Math.random() * TOTAL_PROB);
			var unitToMake = null;

			for(var i=0;i<UnitObjectReference.length;i++) {
				if(rand < UnitObjectReference[i].probability){ unitToMake = UnitObjectReference[i]; break; }
				else rand -= UnitObjectReference[i].probability;
			}

			if(unitToMake == null) return;

			// Too many builders/bases?
			if(unitToMake.isA("Builder")) {
				if(this.numBases > MAX_BASE_UNITS) return;
				this.numBases++;
			}

			// Too many defenses?
			if(unitToMake.isA("Turret")) {
				if(this.numTurrets > MAX_BASE_DEFENSES) return;
				this.numTurrets++;
			}

			this.units.add(new unitToMake(x,y,this.color,this.thisTeam)); // Build the unit!
			this.unitCooldown = Math.random()*300|50; // Random cooldown before next build
			this.totalScore++; // Increase our score!
		},
		createBase : function(x,y){
			// Creates a base at the location. This is useful for Builder Tanks wanting to deploy or when the game is starting...
			this.units.add(new BaseUnit(x,y,this.color,this.thisTeam));
			this.numBases++;
		},
		placeFlag: function(x,y,color) {
			var avatar = this.name.substring(0,1); // First char (also, the letter "N" in Wingdings is a skull & cross bones)
			var g = new Kinetic.Group();
			var t = new Kinetic.Text({x:7,y:3,text:avatar,fontFamily:"Wingdings",fontSize:12,textFill:"black"});
			var f = new Kinetic.Rect({x:0,y:1,width:25,height:15,fill:this.color.getString(),stroke:"gray",strokeWidth:1});
			var l = new Kinetic.Line({points:[0,0,0,30],stroke:"silver",lineCap:"round",strokeWidth:2});
			var c = new Kinetic.Ellipse({x:0,y:30,radius:{x:10,y:5},fill:color.getString()});
			g.add(c);g.add(f);g.add(l);g.add(t);
			g.move(x,y);
			g.rotate(-0.2);
			g.setScale(1.5);
			MISCLAYER.add(g);
		},
		work: function(){
			// If there are units abound, make them do stuff...
			var u = this.units.first;
			while(u) { // This should get the units moving around
				u.obj.work();
				u = u.nextLinked;
			}

			u = this.units.first;
			while(u){
				if(u.obj.isDead) {
					if(this.invincible) {
						// hehehehehehehehe
						u.obj.isDead = false;
						u.obj.hp = u.obj.maxHp = 10000;
					} else {
						// I need to remove any possible shape...
						if(u.obj.hpbar != null) u.obj.hpbar.remove(); //LAYER.remove(u.obj.hpbar);
						if(u.obj.debug.targetLine != null) u.obj.debug.targetLine.remove(); //LAYER.remove(u.obj.debug.targetLine);
						if(u.obj.debug.fov != null) u.obj.debug.fov.remove(); //LAYER.remove(u.obj.debug.fov);
						if(u.obj.Shape != null) u.obj.Shape.remove(); //LAYER.remove(u.obj.Shape);

						// Need to decrease some counters
						if(u.obj.Class.isA("BaseUnit")) this.numBases--;
						if(u.obj.Class.isA("Turret")) this.numTurrets--;

						// Finally...
						this.units.remove(u.obj);
					}
				}
				u = u.nextLinked;
			}

			// Update the team's visual score
			$('#' + this.name).text("{0} : {1}".format(this.name,this.taken));
		},
		reset: function(){
			this.score = this.totalScore = this.taken = this.given = this.usedTickets = this.numBases = this.numTurrets = 0;
			this.lastTargetFound = new Date();
			this.unitCooldown = Math.random()*180|80;

			var wasIInvincible = this.invincible;
			if(this.invincible) this.invincible = false; // Need to really clear the old units

			if(this.units != null) {
				var n = this.units.first;
				while(n){ n.obj.die(); this.units.remove(n); n = n.nextLinked; }
			}

			this.invincible = wasIInvincible; // They are still awesome
		},

		// Globl Unit related methods
		callFriendlies: function(caller, target) {
			var n = this.units.first;
			while(n){
				if( n.obj == caller
					|| !n.obj.attackingUnit
					|| n.obj.Class.isA("Turret")
					|| (n.obj.target != null && n.obj.target.getDistanceSquaredFromPoint(n.obj.X,n.obj.Y) > target.getDistanceSquaredFromPoint(n.obj.X,n.obj.Y)) ){
					n = n.nextLinked;
					continue;
				}
				if(!n.obj.antiAircraft && target.Class.isA("BasePlane")) return; // For Planes
				//if(n.obj.Class.isA("DefenseUnit")) return; // For Defeneses
				if(n.obj.state == TankStateEnum.IDLE || n.obj.state == TankStateEnum.MOVE)
				{
					if(n.obj.isDead) { n = n.nextLinked; continue; }
					n.obj.target = target;
					n.obj.state = TankStateEnum.TARGET_AQUIRED;
				}
				n = n.nextLinked;
			}
		}
	});

// Tanks (the base one, create extended copies for newer ones, don't use the base one)
	var Tank = gamecore.Base.extend('Tank',{ /* Static (this is inherited as well) */ probability: 120 },
	{
		// Vars
			// Basics
			myTeam: null,
			hp: 0,
			maxHp : 0,
			moveSpeed: 1.5,
			turnSpeed: 0.18,
			attackingUnit: true,
			isDead: false, // if(isDead) shape.visible = false
			isHealing: false,
			cooldown: 0,
			maxCooldown:25, // TODO: each unit has something different....
			special:false,

			// Turret\Barrel Basics
			hasTurret: true,
			turretSize: 5,
			turretTurnSpeed: 0.19,
			barrelLength: 10,
			doubleBarrel : false,
			barrelSeparation: 0,

			// State
			state: TankStateEnum.IDLE,
			time:60,

			// Attack Related
			attackRange: 125,
			attackDistance: 100,
			turretAttackAngle: 45,
			antiAircraft: false,
			target: null,
			targetEvasive: null,
			targetEvasiveLocation: {X:0,Y:0,XOffset:0,YOffset:0},

			// Angles
			targetBaseAngle: 0,
			targetTurretAngle: 0,
			turretAngle: 0,
			prevTurretAngle: 0,
			prevBaseAngle: 0,
			baseAngle: 0,
			radius: 10,
			minRange: 10,
			sightDistance: 200,

			// inherited color class // to be done by Team...
			color: null,

			// Weapon (single for now)
			bulletType: ShotTypeEnum.BULLET,
			bulletTime: 30,
			bulletSpeed: 6,
			bulletDamage: 3,

			// Positioning and Shapes
			X: 0,
			Y: 0,
			prevX: 0,
			prevY: 0,
			Shape: null,
			TankTurretShape: null, // Helps with the bazillion .GetChildren() calls...
			debug: null,
			This: null,

		// Instance
		init: function (x,y,color,team) {  // This creates the unit upon call
			this.myTeam = team;
			this.X = this.prevX = x;
			this.Y = this.prevY = y;
			this.maxHp = this.hp;
			this.color = color;
			this.buildShape(); // This must be called!
			this.debug = {};
			this.This = this;
		},
		work: function () {
			// This would need to mimic the "doStuff" but
			// now specifically for this type of unit (minus all the ifPlane crap)
			switch (this.state) {
				case TankStateEnum.IDLE: // 0
					if(this.target != null && this.target.isDead) this.target = null;

					if (Math.random() < MOVE_PROB) {
						this.targetBaseAngle = 2 * Math.PI * Math.random();
						this.state = TankStateEnum.MOVE;
					}

					//if (Math.random() < MOVE_PROB) this.targetTurretAngle = 2 * Math.PI * Math.random();
					this.targetTurretAngle = this.targetBaseAngle;
					this.turnTurret();
					break;
				case TankStateEnum.MOVE: // 1

					if(this.target != null && this.target.isDead) this.target = null;

					this.move();
					if (Math.random() < MOVE_PROB) this.state = TankStateEnum.IDLE;
					if (Math.random() < MOVE_PROB) this.targetBaseAngle = 2 * Math.PI * Math.random();

					this.targetTurretAngle = this.targetBaseAngle;
					this.turnTurret();
					this.findTarget();
					break;
				case TankStateEnum.TARGET_AQUIRED: // 2

					if(this.target != null && this.target.isDead) this.target = null;

					this.findTarget(); // We're always looking for a better target? Costly operation...

					if(this.target != null) {
						var tds = this.target.getDistanceSquaredFromPoint(this.X,this.Y);
						if(tds <= this.minRange * this.minRange) {
							this.targetBaseAngle = this.getAngleFromPoint(this.target.X,this.target.Y) + Math.PI;
							this.move();
							this.moveTurretAndAttack();
						} else if (tds <= this.attackDistance * this.attackDistance) {
							this.state = TankStateEnum.TARGET_IN_RANGE;
						} else {
							this.targetBaseAngle = this.getAngleFromPoint(this.target.X, this.target.Y);
							this.move();
							this.moveTurretAndAttack();
						}
					} else { this.state = TankStateEnum.IDLE; this.target = null; }
					break;
				case TankStateEnum.TARGET_IN_RANGE: // 3

					if(this.target != null && this.target.isDead)
						this.target = null;

					if(this.target != null) {
						if(this.target.getDistanceSquaredFromPoint(this.X,this.Y) > this.attackDistance * this.attackDistance)
							this.state = TankStateEnum.TARGET_AQUIRED;
						else
							this.moveTurretAndAttack();
					} else {
						this.state = TankStateEnum.IDLE;
						this.target = null;
					}
					break;
				case TankStateEnum.EVADE: // 4
					var dist = null, prevTargetEvasive = this.targetEvasive;
					this.targetEvasive = null; // Reset

					// Find closest base/healing unit...
					var n = this.myTeam.units.first;
					while(n) {
						if(n.obj.Class.isA("BaseUnit")) {
							var currDist = n.obj.getDistanceSquaredFromPoint(this.X,this.Y);
							if(dist == null || currDist < dist){
								this.targetEvasive = n.obj;
								dist = currDist;
								break;
							}
						}
						n = n.nextLinked;
					}

					this.findTarget(); // I hate calling this method...

					// If there is an enemy in range of me while i'm retreating, get lazy asses on them!
					if(this.target != null) {
						this.myTeam.callFriendlies(this.This,this.target);
						this.moveTurretAndAttack();
					}

					// No base or we stopped evading, setup to begin fighting again...
					if(this.targetEvasive == null || this.stopEvading()) {
						this.state = TankStateEnum.IDLE;
						return;
					}

					if(prevTargetEvasive != this.targetEvasive || this.targetEvasive.Class.isA("HealingUnit"))
					{
						var xRand,ylim,yRand;
						if(this.targetEvasive.Class.isA("BaseUnit"))
						{
							this.targetEvasiveLocation.XOffset = this.targetEvasiveLocation.YOffset = 0;
							xRand = (Math.random() * 2 * BASE_HEAL_RADIUS - BASE_HEAL_RADIUS - 4);
							ylim = Math.sqrt((BASE_HEAL_RADIUS - 2) * (BASE_HEAL_RADIUS - 2) - xRand * xRand);
							yRand = (Math.random() * 2 * ylim - ylim);
							this.targetEvasiveLocation.X = this.targetEvasive.X + xRand;
							this.targetEvasiveLocation.Y = this.targetEvasive.Y + yRand;
						}
						else
						{
							if(this.targetEvasiveLocation.XOffset == 0 && this.targetEvasiveLocation.YOffset == 0)
							{
								xRand = (Math.random() * 2 * this.targetEvasive.attackRange - this.targetEvasive.attackRange - 4);
								ylim = Math.sqrt((this.targetEvasive.attackRange - 2) * (this.targetEvasive.attackRange - 2) - xRand * xRand);
							}
							this.targetEvasiveLocation.X = this.targetEvasive.X + this.targetEvasiveLocation.XOffset;
							this.targetEvasiveLocation.Y = this.targetEvasive.Y + this.targetEvasiveLocation.YOffset; // Not sure why...
						}
					}

					if(Math.floor(this.X) != Math.floor(this.targetEvasiveLocation.X) || Math.floor(this.Y) != Math.floor(this.targetEvasiveLocation.Y)) {
						this.targetBaseAngle = this.getAngleFromPoint(this.targetEvasiveLocation.X, this.targetEvasiveLocation.Y);
						this.move();
					}
					else
						this.state = TankStateEnum.STOP_AND_GUARD;

					break;
				case TankStateEnum.CRASH_AND_BURN:
					break;
				case TankStateEnum.STOP_AND_GUARD:
					if(this.targetEvasive != null && this.targetEvasive.isDead) this.state = TankStateEnum.EVADE;

					if(this.stopEvading()) {
						this.state = TankStateEnum.IDLE;
					} else {
						if(Math.floor(this.X) != Math.floor(this.targetEvasiveLocation.X) || Math.floor(this.Y) != Math.floor(this.targetEvasiveLocation.Y)) {
							this.targetBaseAngle = this.getAngleFromPoint(this.targetEvasiveLocation.X, this.targetEvasiveLocation.Y);
							this.move();
						}

						this.findTarget();
						if(this.target != null && !this.target.Class.isA("BaseUnit"))
							this.moveTurretAndAttack();
					}
					break;
				default:
					if(this.target != null && this.target.isDead)
						this.target = null;

					this.state = TankStateEnum.IDLE;
					break;
			}

			// Finally
			this.draw();
		},
		buildShape : function(){
			var group = new Kinetic.Group({ x: this.X, y: this.Y });
			var tGroup = new Kinetic.Group();
			group.add(new Kinetic.Rect({
				x: 0, y: 0, width: 28, height: 16,
				//fill: this.color.getStringAlpha(.3),
				stroke: this.color.getString(),
				strokeWidth: 1, rotation: 0, offset: [14, 8]
			}));

			if(this.hasTurret)
			{
				tGroup.add(new Kinetic.Line({ points: [0,this.barrelSeparation,this.barrelLength,this.barrelSeparation],stroke:this.color.getString(),strokeWidth:1}));
				if(this.doubleBarrel)
					tGroup.add(new Kinetic.Line({ points: [0,-this.barrelSeparation,this.barrelLength,-this.barrelSeparation],stroke:this.color.getString(),strokeWidth:1}));

				tGroup.add(new Kinetic.Circle({ radius: this.turretSize, fill: this.color.getString(), strokeWidth: 0 }));
				group.add(tGroup);
			}

			this.Shape = group;
			this.Shape.setPosition(this.X, this.Y);
			this.Shape.rotate(2 * Math.PI * Math.random());
			this.TankTurretShape = this.Shape.getChildren()[1]; // Will always be this...



			LAYER.add(this.Shape); // Important!
		},
		drawHPBar: function(){

			var text;

			if(this.isDead || this.hpbar == null && !DRAW_HPBAR) return; // If the bar is null and we're not wanting them...

			if(this.hpbar == null && DRAW_HPBAR) // Only create new ones if DRAW_HPBAR is enabled
			{
				this.hpbar = new Kinetic.Group({x:this.X-22, y:this.Y-22});
				var Shell = new Kinetic.Rect({width:42,height:4,fill:"rgb(0,0,0)",stroke:"black",strokeWidth:1});
				var Bar = new Kinetic.Rect({x:0.5,y:0.5,width:41,height:3,fill:"green"});
				if(DRAW_HPBAR_TEXT) text = new Kinetic.Text({x:0,y:-15,text:"{0}/{1}".format(this.hp,this.maxHp),fontSize:8,fontFamily:"Calibri",textFill:"red"});

				this.hpbar.add(Shell);
				this.hpbar.add(Bar);
				if(DRAW_HPBAR_TEXT) this.hpbar.add(text); // index 2

				LAYER.add(this.hpbar);

				this.hpbar.hide();
				this.hpbarVis = false;
			}
			else
			{
				if(!DRAW_HPBAR)
				{
					this.hpbar.hide();
					this.hpbarVis = false;
					return;
				}

				this.hpbar.setPosition(this.X-22,this.Y-22);

				if(this.hp < this.maxHp && this.hp != 0)
				{
					if(!this.hpbarVis) {this.hpbar.show(); this.hpbarVis = true;}

					var c = this.hpbar.getChildren();

					c[1].setWidth(41*(this.hp/this.maxHp));

					if((this.hp/this.maxHp) <= 0.50 && (this.hp/this.maxHp) >= 0.26) c[1].setFill("yellow");
					else if((this.hp/this.maxHp) <= 0.25) c[1].setFill("red");
					else c[1].setFill("green");

					if(DRAW_HPBAR_TEXT) c[2].setText("{0}/{1}".format(this.hp,this.maxHp));
				}
				else if(this.hpbarVis) {
					this.hpbar.hide();
					this.hpbarVis = false;
				}
			}
		},
		draw: function () {  // Will create/update the position of the unit

			if (this.isDead) return;

			// Prevents the drawing method from constantly needing to be updated (not sure if really needed)
			//if (this.X != this.prevX && this.Y != this.prevY) {
				this.Shape.setPosition(this.X, this.Y);
				this.Shape.setRotation(this.baseAngle);
				this.prevX = this.X;
				this.prevY = this.Y;
			//}

			if (this.hasTurret)
				this.TankTurretShape.setRotation(this.getAngleDiff(this.baseAngle, this.turretAngle));

			this.drawDebug();
			this.drawHPBar();
		},
		move: function () {
			while (this.targetBaseAngle > Math.PI) this.targetBaseAngle -= 2 * Math.PI;
			while (this.targetBaseAngle < -Math.PI) this.targetBaseAngle += 2 * Math.PI;
			var angleDiff = this.targetBaseAngle - this.baseAngle;

			if (Math.abs(angleDiff) > Math.PI) {
				if (angleDiff > 0) this.baseAngle -= this.turnSpeed;
				else this.baseAngle += this.turnSpeed;
			} else {
				if (Math.abs(angleDiff) > this.turnSpeed) {
					if (angleDiff > 0) this.baseAngle += this.turnSpeed;
					else this.baseAngle -= this.turnSpeed;
				} else this.baseAngle = this.targetBaseAngle;
			}
			if (this.baseAngle > Math.PI) this.baseAngle -= 2 * Math.PI;
			if (this.baseAngle < -Math.PI) this.baseAngle += 2 * Math.PI;

			if (Math.abs(this.targetBaseAngle - this.baseAngle) < MAX_MOVE_ANGLE){
				this.X += this.moveSpeed * Math.cos(this.baseAngle);
				this.Y += this.moveSpeed * Math.sin(this.baseAngle);
				if (this.X > WIDTH) this.X -= WIDTH;
				else if (this.X < 0) this.X += WIDTH;
				if (this.Y > HEIGHT) this.Y = Math.abs(this.Y - HEIGHT);
				else if (this.Y < 0) this.Y = Math.abs(this.Y + HEIGHT);
			}
		},
		turnTurret: function () {
			var angleDiff = this.targetTurretAngle - this.turretAngle;
			if (Math.abs(angleDiff) > Math.PI) {
				if (angleDiff > 0) this.turretAngle -= this.turretTurnSpeed;
				else this.turretAngle += this.turretTurnSpeed;
			} else {
				if (Math.abs(angleDiff) > this.turretTurnSpeed) {
					if (angleDiff > 0) this.turretAngle += this.turretTurnSpeed;
					else this.turretAngle -= this.turretTurnSpeed;
				} else
					this.turretAngle = this.targetTurretAngle;
			}
			if (this.turretAngle > Math.PI) this.turretAngle -= 2 * Math.PI;
			if (this.turretAngle < -Math.PI) this.turretAngle += 2 * Math.PI;
		},
		startEvading: function(){
			if(this.state == TankStateEnum.EVADE) return true;
			var hpPercent = (this.hp / this.maxHp);
			if(hpPercent > 0.15 && hpPercent <= Math.random()*0.45|0.15) {
				this.state = TankStateEnum.EVADE;
				return true;
			}
			return false;
		},
		stopEvading: function () {
			if(this.state == TankStateEnum.EVADE) return true;
			if((this.hp / this.maxHp) > Math.random()*1|0.37)
			{
				this.targetEvasive = null;
				this.state = TankStateEnum.IDLE;
				return true;
			}
			return false;
		},
		findTarget: function () {
			// This is likely one of the most taxing calls... it loops for every unit
			// It should be a quadrant loop or something...
			var n = TeamPool.first;
			while(n) { // Loop thru all the teams
				if(n.obj != this.myTeam) { // Don't target my team!
					var u = n.obj.units.first;
					while(u) { // Loop thru the teams units
						if(u.obj.getDistanceSquaredFromPoint(this.X,this.Y) < this.sightDistance * this.sightDistance) {
							if(this.target == null ||
							   (this.target.Class.isA("BaseUnit") && !u.obj.Class.isA("BaseUnit")) || // If I'm already targetting a base, attack a unit instead (if nearby)
							   u.obj.hp < this.target.hp || // Attack units more damaged than my target
							   u.obj.Class.isA("HealerTank") || // Kill their healer!
							   u.obj.getDistanceSquaredFromPoint(this.X,this.Y) < this.target.getDistanceSquaredFromPoint(this.X,this.Y) || // Attack something that is closer (if only all the above fails)

							   u.obj.special) // Attack any unit that fails all of the above, but is a special unit!
							{
								if(u.obj.Class.isA("BasePlane") && !this.AntiAircraft) { // If i can't fight planes, chose a different target
									u = u.nextLinked;
									continue;
								}

								this.target = u.obj;

								if(this.state != TankStateEnum.CRASH_AND_BURN)
									this.state = TankStateEnum.TARGET_AQUIRED;

								if(u.obj.special) break;
							}
						}
						u = u.nextLinked;
					}
				}

				if(this.target !== null && this.target.special) // Continue targetting that special unit
					break;

				n = n.nextLinked;
			}
			if(this.target !== null) this.myTeam.callFriendlies(this.This, this.target);
		},
		attack: function () {
			if(this.cooldown <= 0) {
				if(this.turretAngle == this.targetTurretAngle
					//|| (this.turretAngle > (this.targetTurretAngle - (Math.PI/180) * this.turretAttackAngle)
					//&& this.turretAngle < (this.targetTurretAngle + (Math.PI/180) * this.turretAttackAngle))
					){
					var speed = this.bulletSpeed;
					if(this.bulletType == ShotTypeEnum.SHELL)
						speed = (0.95 + Math.random()*0.1) * (Math.sqrt(this.target.getDistanceSquaredFromPoint(this.X,this.Y)) - this.barrelLength) / this.bulletTime;

					// x,y,dx,dy,time,team,damage,shooter,type,target,airAttack
					if(this.doubleBarrel) {
						Bullet.create(
							this.X + Math.cos(this.turretAngle) * this.barrelLength + Math.cos(this.turretAngle + Math.PI / 4) * this.barrelSeparation,
							this.Y + Math.sin(this.turretAngle) * this.barrelLength + Math.sin(this.turretAngle + Math.PI / 4) * this.barrelSeparation,
							speed * Math.cos(this.turretAngle),
							speed * Math.sin(this.turretAngle),
							this.bulletTime,
							this.myTeam,
							this.bulletDamage,
							this.This,
							this.bulletType,
							this.target,
							this.antiAircraft);
						Bullet.create(
							this.X + Math.cos(this.turretAngle) * this.barrelLength + Math.cos(this.turretAngle - Math.PI / 4) * this.barrelSeparation,
							this.Y + Math.sin(this.turretAngle) * this.barrelLength + Math.sin(this.turretAngle - Math.PI / 4) * this.barrelSeparation,
							speed * Math.cos(this.turretAngle),
							speed * Math.sin(this.turretAngle),
							this.bulletTime,
							this.myTeam,
							this.bulletDamage,
							this.This,
							this.bulletType,
							this.target,
							this.antiAircraft);
					}
					else
						Bullet.create(
							this.X + Math.cos(this.turretAngle) * this.barrelLength,
							this.Y + Math.sin(this.turretAngle) * this.barrelLength,
							speed * Math.cos(this.turretAngle),
							speed * Math.sin(this.turretAngle),
							this.bulletTime,
							this.myTeam,
							this.bulletDamage,
							this.This,
							this.bulletType,
							this.target,
							this.antiAircraft);

					this.cooldown = this.maxCooldown;

				}
			}
			else
				this.cooldown--;
		},
		moveTurretAndAttack: function(){
			if(this.target != null && !this.target.isDead)
			{
				this.setTargetTurretAngle();
				this.turnTurret();
				var tds = this.target.getDistanceSquaredFromPoint(this.X,this.Y);
				if(tds <= this.attackDistance * this.attackDistance){
					// this.startEvading(); // This isn't working...
					this.attack();
				}
			}
		},
		die: function () {
			this.isDead = true; // This is so this tank can be removed from the list of "used" objects...
			var exps = (IS_MOBILE) ? 2 : Math.floor(Math.random() * 4 + 4);
			for(var i = 0; i <= exps; i++)
				Explosion.create(this.X + Math.random() * 14 - 7, this.Y + Math.random() * 14 - 7, i * 2, 12 + Math.random() * 10);
		},
		takeDamage: function(damage,shooter) {
			this.hp -= damage;
			this.myTeam.taken += damage; // increase our failure!
			if(this.hp <= 0) {
				// Planes = CRASH_AND_BURN else...
				this.die();

				if(this.myTeam.units.length() <= 1) // I'm the last one left
					shooter.myTeam.placeFlag(this.X,this.Y,this.color);

			} else {
				if(shooter !== null && shooter.myTeam != this.myTeam)
					shooter.myTeam.given += damage; // Increase their points

				this.myTeam.callFriendlies(this.This, shooter);
			}
		},
		recoverHitPoints: function(health){
			if(health == null) health = Math.floor(this.hp * 0.1); // 10%
			if(this.hp == this.maxHp) return; // we're at full health
			if(!this.isHealing) {
				this.isHealing = true;
				this.hp += health;
				this.isHealing = false;
			}
			if(this.hp > this.maxHp) this.hp = this.maxHp; // Just in case they go over the max ammount
		},
		setTargetTurretAngle: function() {
			//if(this.target != null && !this.target.isDead){
				var Tx = this.target.X,
					Ty = this.target.Y,
					shotTime = Math.sqrt(this.target.getDistanceSquaredFromPoint(this.X,this.Y)) / this.bulletSpeed;
				Tx += this.target.getDx() * shotTime;
				Ty += this.target.getDy() * shotTime;
				this.targetTurretAngle = this.getAngleFromPoint(Tx,Ty);
			//}
		},
		getDx: function(){
			if(this.state == TankStateEnum.MOVE || this.state == TankStateEnum.TARGET_AQUIRED || this.state == TankStateEnum.CRASH_AND_BURN){
				if(Math.abs(this.targetBaseAngle - this.baseAngle) < MAX_MOVE_ANGLE) return this.moveSpeed * Math.cos(this.baseAngle);
				else return 0;
			}
			else return 0;
		},
		getDy: function(){
			if(this.state == TankStateEnum.MOVE || this.state == TankStateEnum.TARGET_AQUIRED || this.state == TankStateEnum.CRASH_AND_BURN){
				if(Math.abs(this.targetBaseAngle - this.baseAngle) < MAX_MOVE_ANGLE) return this.moveSpeed * Math.sin(this.baseAngle);
				else return 0;
			}
			else return 0;
		},
		// Used to be global methods, now related to object... Maybe need to move out...
		getAngleDiff: function (a1, a2) {
			var diff = a2 - a1;
			while (diff < -180) diff += 360;
			while (diff > 180) diff -= 360;
			return diff;
		},
		getDistanceSquaredFromPoint : function(x,y) {
			var dx = x - this.X,
				dy = y - this.Y,
				w2 = WIDTH * 0.5,
				h2 = HEIGHT * 0.5;
				if (dx < -w2) x += WIDTH;
				if (dx > w2) x -= WIDTH;
				if (dy < -h2) y += HEIGHT;
				if (dy > h2) y -= HEIGHT;
				return (this.X - x) * (this.X - x) + (this.Y - y) * (this.Y - y);
		},
		getAngleFromPoint: function(x1,y1) {
			var dx = x1 - this.X,
				dy = y1 - this.Y,
				w2 = WIDTH * 0.5,
				h2 = HEIGHT * 0.5;

			if (dx < -w2) x1 += WIDTH;
			if (dx > w2) x1 -= WIDTH;
			if (dy < -h2) y1 += HEIGHT;
			if (dy > h2) y1 -= HEIGHT;

			return Math.atan2(y1 - this.Y, x1 - this.X);
		},
		isAngleBetween: function(n,a,b){
			n = (360 + (n % 360)) % 360;
			a = (3600000 + a) % 360;
			b = (3600000 + b) % 360;
			if(a < b) return a <= n && n <= b;
			return a <= n || n <= b;
		},
		drawDebug: function(){
			//var DRAW_TARGET_LINE = false; // for now...

			// if(!this.debug.centerLine)
			// {
			//	var l = new Kinetic.Star({x:this.X,y:this.Y,numPoints:4,innerRadius:1,outerRadius:70,fill:"black",stroke:"black",strokeWidth:1});
			//	LAYER.add(l);
			//	this.debug.centerLine = l;
			// }
			// else
			// {
			//	this.debug.centerLine.setPosition(this.X,this.Y);
			//	//this.debug.centerLine.setRotation(this.turretAngle);
			// }

			if(DRAW_TARGET_LINE)
			{
				if(this.debug.targetLine != null && this.target == null){
					this.debug.targetLine.hide();
					//LAYER.remove(this.debug.targetLine);
					this.debug.targetLine = null;
					return;
				}
				else if(this.target == null)
					return;

				var mX = this.X, mY = this.Y,
					x = this.target.X, y = this.target.Y,
					dx = x - this.X,
					dy = y - this.Y,
					w2 = WIDTH * 0.5,
					h2 = HEIGHT * 0.5,
					x2 = x, y2 = y;

				if (dx < -w2) x2 = x + WIDTH;
				if (dx > w2)  x2 = x - WIDTH;
				if (dy < -h2) y2 = y + HEIGHT;
				if (dy > h2)  y2 = y - HEIGHT;

				// Line's basics:
				if(this.debug.targetLine == null || this.debug.targetLine == undefined){
					this.debug.targetLine = new Kinetic.Line({
						stroke : this.color.getString(),
						strokeWidth : 1
					});

					LAYER.add(this.debug.targetLine);
				}
				else if(this.target.isDead)
				{
					this.debug.targetLine.hide();
					return;
				}

				// I know this is breaking the two line thing, just haven't gotten to it yet...
				/* if line cuts through edge of world we need to draw two lines on each side of screen to simulate
				*  target wrapping.  law of sines to figure out what the lines will be (creating triangles) */
				var iX = (x == x2) ? x : x2;
				var iY = (y == y2) ? y : y2;
				var iPoints = [mX,mY,iX,iY];

				//if(!this.debug.targetLine.getPoints().compare(iPoints)) // Prevents the line from constantly being repositioned if the two are the same!
					this.debug.targetLine.setPoints(iPoints);
			}
			else if(!DRAW_TARGET_LINE && this.debug.targetLine != null && !this.isDead){
				this.debug.targetLine.remove(); //LAYER.remove(this.debug.targetLine);
				this.debug.targetLine = null;
			}

			// Draw FOV
			//var DRAW_FOV = false;
			if(DRAW_FOV)
			{
				if(this.Class.isA("BaseUnit") || this.Class.isA("BasePlane")) return;
				var useThisAngle = this.turretAngle;
				var useAttackAngle = this.turretAttackAngle;

				// if(!this.attackingUnit){
				//	useThisAngle = this.baseAngle;
				//	useAttackAngle = 45;
				// }

				if(this.debug.fov == null || this.debug.fov == undefined){
					var bObj = this;
					this.debug.fov = new Kinetic.RegularPolygon({
						x: this.X, y: this.Y, sides: 3, radius: 70, stroke: this.color.getString(), strokeWidth: 1,
						offset:[0,-70]
					});
					LAYER.add(this.debug.fov);
				} else {
					this.debug.fov.setPosition(this.X,this.Y);
					this.debug.fov.setRotation(this.turretAngle);
				}
			}
			else if(!DRAW_FOV && this.debug.fov != null && !this.isDead){
				this.debug.fov.remove(); //LAYER.remove(this.debug.fov);
				this.debug.fov = null;
			}
		}
	});

	var SmallTank = Tank.extend("SmallTank",{},{
		moveSpeed:1.4, turnSpeed:0.18, turretTurnSpeed:0.19, hp: 30, minRange:10, attackRange: 125, attackDistance:100, turretSize:5, barrelLength:10,
		bulletTime: 32, bulletDamage: 3,maxCooldown:30
	});
	var MediumTank = Tank.extend("MediumTank",{},{
		moveSpeed:1.0, turnSpeed:0.13, turretTurnSpeed:0.16, hp: 50, minRange:25, attackRange: 140, attackDistance:115, turretSize:6, barrelLength:12,
		bulletTime: 34, bulletDamage: 4,maxCooldown:35
	});
	var LargeTank = Tank.extend("LargeTank",{},{
		moveSpeed:0.8, turnSpeed:0.09, turretTurnSpeed:0.14, hp: 75, minRange:25, attackRange: 155, attackDistance:130, turretSize:7, barrelLength:14,
		bulletTime: 38, bulletDamage: 6,maxCooldown:50
	});
	var ArtilleryTank = Tank.extend("ArtilleryTank",{probability:60},{
		moveSpeed:0.9, turnSpeed:0.07, turretTurnSpeed:0.12, hp: 25, minRange:50, attackRange: 180, attackDistance:175, turretSize:0, barrelLength:16,
		bulletType: ShotTypeEnum.SHELL, bulletTime: 41, bulletSpeed: 4, bulletDamage: 15,maxCooldown:75
	});
	var DoubleTank = Tank.extend("DoubleTank",{probability:80},{
		moveSpeed:0.7, turnSpeed:0.07, turretTurnSpeed:0.12, hp: 85, minRange:25, attackRange: 155, attackDistance:130, turretSize:7, barrelLength:14,
		doubleBarrel: true, barrelSeparation:1.5, bulletTime: 43, bulletDamage: 5,maxCooldown:70
	});
	var MissileTank = Tank.extend("MissileTank",{probability:90},{
		moveSpeed:1.0, turnSpeed:0.07, turretTurnSpeed:0.13, hp: 35, minRange:25, attackRange: 155, attackDistance:130, turretSize:0, barrelLength:5,
		doubleBarrel: true, barrelSeparation:2.5, bulletType: ShotTypeEnum.MISSLE, bulletTime: 40, bulletDamage: 8, maxCooldown:70
	});
	var MammothTank = Tank.extend("MammothTank",{probability:20},{
		special:true, moveSpeed:1.29,turnSpeed:0.09,turretTurnSpeed:0.19,hp:350,maxCooldown:70,minRange:15,attackDistance:130,attackRange:135,sightDistance:300,
		turretSize:9,barrelLength:20,doubleBarrel:true,barrelSeparation:3.5, antiAircraft:true, bulletTime: 43, bulletDamage: 10,
		buildShape : function(){
			var group = new Kinetic.Group({ x: this.X, y: this.Y });
			var tGroup = new Kinetic.Group();
			group.add(new Kinetic.Polygon({
				points : [0,0, 23,0, 23,5, 28,5, 28,0, 38,0, 38,10, 33,10, 33,15, 38,15, 38,25, 28,25, 28,20, 23,20, 23,25, 0,25, 0,17, 12,17, 12,8, 0,8],
				stroke: this.color.getString(),
				strokeWidth: 1, offset: [19,12.5] // /sigh, Y: 12.5
			}));

			tGroup.add(new Kinetic.Line({ points: [0,this.barrelSeparation,this.barrelLength,this.barrelSeparation],stroke:this.color.getString(),strokeWidth:1}));
			if(this.doubleBarrel)
				tGroup.add(new Kinetic.Line({ points: [0,-this.barrelSeparation,this.barrelLength,-this.barrelSeparation],stroke:this.color.getString(),strokeWidth:1}));

			tGroup.add(new Kinetic.Circle({ radius: this.turretSize, fill: this.color.getString(), strokeWidth: 0 }));
			group.add(tGroup);
			this.Shape = group;
			this.Shape.setPosition(this.X, this.Y);
			this.Shape.rotate(2 * Math.PI * Math.random());
			this.TankTurretShape = this.Shape.getChildren()[1]; // Will always be this...



			LAYER.add(this.Shape); // Important!
		}
	});
	var HealerTank = Tank.extend("HealerTank",{probability:30},{
		special: true, attackingUnit:false, moveSpeed:1.05, turnSpeed:0.13, turretTurnSpeed:0, hp:100, maxCooldown:250, minRange:40, attackDistance:50,
		attackRange:50, sightDistance:200, bulletType:ShotTypeEnum.NONE, hasTurret:false,
		work:function()
		{
			if(this.healCooldown > 0)
				this.healCooldown--;
			else {
				this.areaHeal(this.attackRange * this.attackRange);
				this.healCooldown = (Math.floor(Math.random()*2)+ 1) * HEALTH_COOLDOWN;
			}
			this._super(); // Awesome, pickup the inherited work...
		},
		areaHeal: function(healRadius){
			// Just loop thru myTeam
			var u = this.myTeam.units.first;
			while(u) {
				if(!u.obj.Class.isA("BaseUnit") && !u.obj.Class.isA("HealerTank")) // Skip bases and healing tanks (this includes myself!)
					if(u.obj.getDistanceSquaredFromPoint(this.X,this.Y) < healRadius)
						u.obj.recoverHitPoints(null);

				u = u.nextLinked;
			}
		},
		buildShape : function(){
			var group = new Kinetic.Group({ x: this.X, y: this.Y, offset:[8,8] });

			group.add(new Kinetic.Circle({x:0,y:0,radius:this.attackRange,fill:this.color.getStringAlpha(0.1),offset:[-8,-8]})); // Healing Circle
			group.add(new Kinetic.Rect({x:0,y:0,width:28,height:16,stroke:this.color.getString(),strokeWidth:1,rotation:0})); // Body
			group.add(new Kinetic.Rect({x:0,y:0,width:16,height:16,stroke:this.color.getString(),strokeWidth:1})); // Roof
			group.add(new Kinetic.Line({points:[16,5,28,4,28,12,16,11],stroke:this.color.getString(),strokeWidth:1})); // Hood
			group.add(new Kinetic.Star({x:8,y:8,numPoints:4,innerRadius:0,outerRadius:8,fill:"white",stroke:"white",strokeWidth:4})); // lol +

			this.Shape = group;
			this.Shape.setPosition(this.X, this.Y);
			this.Shape.rotate(2 * Math.PI * Math.random());



			LAYER.add(this.Shape); // Important!
		},
		findTarget: function(){
			// just awesome...
			// The healer tank should only look for his buddies and track them down
			var n = this.myTeam.units.first;
			while(n) {
				if(n.obj != this.This && // Don't worry about me
				   n.obj.getDistanceSquaredFromPoint(this.X,this.Y) < this.sightDistance * this.sightDistance && // Can I even reach them?
				   !n.obj.Class.isA("HealerTank") &&  // Don't heal other healer tanks
				   !n.obj.Class.isA("BasePlane") &&  // Don't heal planes
				   !n.obj.Class.isA("BaseUnit") &&  // Don't heal bases
				   !n.obj.Class.isA("Turret") // Don't heal turrets
				){
					// If i don't have a target, but no one around me, pick someone (typically the first found) and stick with them...
					if(this.target === null || n.obj.hp < this.target.hp) {
						this.target = n.obj;
						this.state = (this.state != TankStateEnum.CRASH_AND_BURN) ? TankStateEnum.TARGET_AQUIRED : this.state;
					}
				}
				n = n.nextLinked;
			}
		}
	});
	var Builder = Tank.extend("Builder",{probability:15},{
		turretSize:0, barrelLength:0,bulletType: ShotTypeEnum.NONE,special:true, cooldown:250,
		moveSpeed:1.05, turnSpeed: 0.13, hp: 100, hasTurret: false,
		work: function()
		{
			switch(this.state)
			{
				case TankStateEnum.IDLE:
					//if(Math.random() < MOVE_PROB) {
						this.targetBaseAngle = 2 * Math.PI * Math.random();
						this.state = TankStateEnum.MOVE;
					//}
					break;
				case TankStateEnum.MOVE:
					if(Math.random() < MOVE_PROB && Math.random() < MOVE_PROB) this.state = TankStateEnum.IDLE;
					if(Math.random() < MOVE_PROB) this.targetBaseAngle = 2 * Math.PI * Math.random();
					this.move();
					break;
				default:
					this.state = TankStateEnum.IDLE;
					this.target = null;
					break;
			}

			if(this.cooldown > 0)
				this.cooldown--;
			else
			{
				var dontBuild = false;

				if(this.myTeam.units.length() >= 1) // if i'm all thats left, build anyways...
				{
					var t = TeamPool.first;
					while(t) {
						//if(t.obj != this.myTeam) {
						var n = t.obj.units.first;
						while(n) {
							if(t.obj != this.myTeam && n.obj.getDistanceSquaredFromPoint(this.X, this.Y) < MIN_BASE_DISTANCE_SQUARE * 60){
								dontBuild = true;
								break;
							}

							if(t.obj == this.myTeam && n.obj.Class.isA("BaseUnit") && n.obj.getDistanceSquaredFromPoint(this.X, this.Y) < MIN_BASE_DISTANCE_SQUARE * 60){
								dontBuild = true;
								break;
							}

							n = n.nextLinked;
						}
						//}
						if(dontBuild) break;
						t = t.nextLinked;
					}
				}

				if(dontBuild)
					this.cooldown += 5;
				else
				{
					if(this.X > WIDTH - BASE_HEAL_RADIUS  || this.X < BASE_HEAL_RADIUS || this.Y > HEIGHT - BASE_HEAL_RADIUS || this.Y < BASE_HEAL_RADIUS)
						this.cooldown += 5;
					else {
						this.myTeam.createBase(this.X,this.Y);
						this.die();
					}
				}
			}

			this.draw(); // lol, don't forget!
		}
	});

	// Defenses
	var BaseTurret = Tank.extend("Turret",{},{
		hp:100, cooldown:25, turretTurnSpeed: 0.16, turretAttackAngle:45, antiAircraft:false,
		attackDistance:150,attackRange:150, minRange:10, sightDistance:150, doubleBarrel:false, turretSize:6, barrelLength:12,
		moveSpeed:0,turnSpeed:0,radius:7,
		work: function(){
			switch(this.state)
			{
				case TankStateEnum.IDLE:
					if(Math.random() < MOVE_PROB)
						this.targetTurretAngle = 2 * Math.PI * Math.random() - Math.PI;
					this.turnTurret();
					this.findTarget();
					break;
				case TankStateEnum.TARGET_AQUIRED:
					this.findTarget();
					this.moveTurretAndAttack();
					if(this.target == null || this.target.isDead || this.target.getDistanceSquaredFromPoint(this.X, this.Y) > this.attackRange * this.attackRange) {
						this.state = TankStateEnum.IDLE;
						this.target = null;
					}
					break;
				default:
					break;
			}
			if(this.cooldown > 0)
				this.cooldown--;

			this.draw();
		},
		buildShape: function(){
			var group = new Kinetic.Group({ x: this.X, y: this.Y }),
				tGroup = new Kinetic.Group();

			tGroup.add(new Kinetic.Line({ points: [0,this.barrelSeparation,this.barrelLength,this.barrelSeparation],stroke:this.color.getString(),strokeWidth:1,offset:[0,0]}));
			if(this.doubleBarrel)
				tGroup.add(new Kinetic.Line({ points: [0,-this.barrelSeparation,this.barrelLength,-this.barrelSeparation],stroke:this.color.getString(),strokeWidth:1}));

			tGroup.add(new Kinetic.Circle({ radius: this.turretSize, fill: this.color.getString(), strokeWidth: 0 }));
			group.add(tGroup);

			this.Shape = group;
			this.Shape.setPosition(this.X, this.Y);
			this.Shape.rotate(2 * Math.PI * Math.random());
			this.TankTurretShape = this.Shape.getChildren()[0]; // Will always be this...



			LAYER.add(this.Shape); // Important!
		}
	});
	var DefenseTurret = BaseTurret.extend("DefenseTurret",{probability:40},{ hp:200 });
	var AATurret = BaseTurret.extend("AATurret",{probability:70},{ hp:45, cooldown:7, turretTurnSpeed: 0.14, turretAttackAngle:65,
		doubleBarrel:true, turretSize:4, barrelLength:6, barrelSeparation:4, antiAircraft:true
	});

	// Planes
	var BasePlane = Tank.extend("BasePlane",{},{
		attackingUnit:true,hasTurret:false,
		findTarget:function(){return;},// don't want this doing anything for the plane at the moment
		work : function(){
			switch(this.state)
			{
				case TankStateEnum.MOVE:
					this.move();
					if(Math.random() < MOVE_PROB) this.targetBaseAngle = 2 * Math.PI * Math.random();
					this.turnTurret();
					this.findTarget();
					break;
				case TankStateEnum.TARGET_AQUIRED:
					this.move();
					this.turretAngle = this.baseAngle;
					this.setTargetTurretAngle(this.target);

					if(Math.abs(this.targetTurretAngle - this.turretAngle) < this.turretTurnSpeed)
						this.targetTurretAngle = this.turretAngle;

					if(this.target === null || this.target.isDead) {
						this.state = TankStateEnum.MOVE;
						this.target = null;
					} else {
						var tds = this.target.getDistanceSquaredFromPoint(this.X,this.Y);
						if(tds > this.minRange * this.minRange && tds <= this.attackDistance * this.attackDistance){
							var angle = Math.atan2(this.target.Y - this.Y, this.target.X - this.X);
							if(Math.cos(this.baseAngle - angle) > 0)
								this.targetBaseAngle = angle;

							this.attack();
						} else {
							// Looking for a better target, again, costly operation!
							var TQF = function(tgt){
								var angle = Math.atan2(tgt.Y - this.Y,tgt.X - this.X);
								var distance = Math.sqrt(tgt.getDistanceSquaredFromPoint(this.X,this.Y));
								return Math.cos(this.baseAngle - angle) * (this.sightDistance-Math.abs((this.attackDistance+this.minRange) / 2 - distance));
							};
							var targetQuality = TQF(this.target);
							var t = TeamPool.first;
							while(t) {
								if(t.obj != this.myTeam){ // Skip my team
									var n = t.obj.units.first;
									while(n) { // Loop thru their units
										if(n.obj.getDistanceSquaredFromPoint(this.X,this.Y) < this.sightDistance * this.sightDistance && (this.antiAircraft || !n.obj.Class.isA("BasePlane"))) {
											var quality = TQF(n.obj);
											if(quality > targetQuality) {
												targetQuality = quality;
												this.target = n.obj;
											}
										}
										n = n.nextLinked;
									}
								}
								t = t.nextLinked;
							}

							if(tds > this.minRange * this.minRange)
								this.targetBaseAngle = Math.atan2(this.target.Y - this.Y, this.target.X - this.X);
						}
					}

					break;
				case TankStateEnum.CRASH_AND_BURN:
					if(this.Time-- > 0) {
						if(this.target !== null && !this.target.isDead) this.targetBaseAngle = Math.atan2(this.target.Y - this.Y, this.target.X - this.X);
						this.move();
					} else {
						AreaDamage(this.X,this.Y,100,400,null);
						this.die();
					}
					break;
				default:
					this.state = TankStateEnum.MOVE;
					break;
			}
			this.draw();
		},
		buildShape : function(){
			var plane = new Kinetic.Polygon({
				points : [0,16, 3,14, 3,8, 6,8, 8,14, 13,14, 13,0, 16,2, 16,14, 23,14, 26,16, 28,16, 26,16, 23,18, 16,18, 16,30, 13,32, 13,18, 8,18, 6,24, 3,24, 3,18 ],
				stroke: this.color.getString(),
				strokeWidth: 1,
				offset: [13,16],
				scale: 0.5 // I'm lazy, this helps reduce the size of the plane so it makes sense!
			});

			this.Shape = plane;
			this.Shape.setPosition(this.X, this.Y);
			this.Shape.rotate(2 * Math.PI * Math.random());

			LAYER.add(this.Shape); // Important!
		}
	});
	var FighterJet = BasePlane.extend("FighterJet",{probability:15},{
		moveSpeed:3.5,turnSpeed:0.14,turretTurnSpeed:0.15,turretAttackAngle:67,hp:160,maxCooldown:50,minRange:10,attackDistance:350,attackRange:350,sightDistance:500,
		bulletType: ShotTypeEnum.MISSLE, bulletTime:60, bulletSpeed:10, bulletDamage:8, doubleBarrel:true, barrelSeparation:4,antiAircraft:true,radius:12,
		buildShape : function(){
			var plane = new Kinetic.Polygon({
				points : [0,16, 3,14, 3,8, 6,8, 8,14, 13,14, 13,0, 16,2, 16,14, 23,14, 26,16, 28,16, 26,16, 23,18, 16,18, 16,30, 13,32, 13,18, 8,18, 6,24, 3,24, 3,18 ],
				stroke: this.color.getString(),
				strokeWidth: 1,
				offset: [13,16]
			});

			this.Shape = plane;
			this.Shape.setPosition(this.X, this.Y);
			this.Shape.rotate(2 * Math.PI * Math.random());

			LAYER.add(this.Shape); // Important!
		}
	});

	// var BomberPlane = BasePlane.extend("BomberPlane",{probability:15},{
	//	buildShape : function(){
	//		var plane = new Kinetic.Polygon({
	//			points : [0,16, 3,14, 3,8, 6,8, 8,14, 13,14, 13,0, 16,2, 16,14, 23,14, 26,16, 28,16, 26,16, 23,18, 16,18, 16,30, 13,32, 13,18, 8,18, 6,24, 3,24, 3,18 ],
	//			stroke: this.color.getString(),
	//			strokeWidth: 1,
	//			offset: [13,16]
	//		}));

	//		this.Shape = plane;
	//		this.Shape.setPosition(this.X, this.Y);
	//		this.Shape.rotate(2 * Math.PI * Math.random());
	//
	//		LAYER.add(this.Shape); // Important!
	//	}
	// });
	//var UAVScout = BasePlane.extend("UAVScout",{probability:5 },{ /* Override in here! */ });

	// Base
	var BaseUnit = Tank.extend("BaseUnit",{probability:20},{
		attackingUnit: false, hp:1000, hasTurret:false, healCooldown:30, cooldown:30,
		work: function(){
			// Healing
			if(this.healCooldown > 0)
				this.healCooldown--;
			else {
				this.areaHeal(BASE_HEAL_RADIUS * BASE_HEAL_RADIUS);
				this.healCooldown = (Math.floor(Math.random()*2)+1) * HEALTH_COOLDOWN;
			}

			// Total cooldown from any action...
			//if(this.cooldown > 0) {this.cooldown--; return; }

			var angle = Math.random() * 2 * Math.PI,
				outX = this.X + 25 * Math.cos(angle),
				outY = this.Y + 25 * Math.sin(angle);

			this.myTeam.createUnit(outX,outY); // This will do the rest!
			this.draw();
		},
		buildShape: function(){
			var group = new Kinetic.Group({x:this.X,y:this.Y});
			var base = new Kinetic.Rect({ x: 0, y: 0, width: 20, height: 20, strokeWidth: 1, offset : [10,10] });
			base.setFill(this.color.getString());
			group.add(base);
			group.add(new Kinetic.Circle({x:0,y:0,radius:BASE_HEAL_RADIUS,fill:this.color.getStringAlpha(0.2)}));

			if(this.myTeam.invincible){
				var l = new Kinetic.Star({x:0,y:0,numPoints:5,innerRadius:5,outerRadius:15,fill:"black"});
				l.setScale(0.6);
				group.add(l);
			}

			this.Shape = group;

			LAYER.add(this.Shape);
			group.moveToBottom();
		},
		areaHeal: function(healRadius){
			// Just loop thru myTeam
			var u = this.myTeam.units.first;
			while(u) {
				if(!u.obj.Class.isA("BaseUnit")) // Skip myself and other bases
					if(u.obj.getDistanceSquaredFromPoint(this.X,this.Y) < healRadius)
						u.obj.recoverHitPoints(null);

				u = u.nextLinked;
			}
		}
	});

	// This is to help determine probability ratings... does not create new instances, etc
	var UnitObjectReference = [SmallTank,MediumTank,LargeTank,ArtilleryTank,DoubleTank,MissileTank,Builder,DefenseTurret,AATurret,HealerTank,MammothTank];
	//UnitObjectReference = [AATurret]; // Use this to build just one kind of tank... for debugging really...

// Bullets
	var Bullet = gamecore.DualPooled.extend('Bullet',
	{ // Statics
		INITIAL_POOL_SIZE : 50,
		create : function(x,y,dx,dy,time,team,damage,shooter,type,target,airAttack){
			var nb = this._super();
			nb.X = x; nb.Y = y; nb.LastX = x; nb.LastY = y;
			nb.Dx = dx; nb.Dy = dy;
			nb.Time = time;
			nb.Team = team;
			nb.Damage = damage;
			nb.Shooter = shooter;
			nb.ShotType = type;
			nb.Target = target;
			nb.AirAttack = airAttack;
			nb.Exploded = false;
			nb.vis = false;

			if(nb.Target != null && nb.ShotType == ShotTypeEnum.MISSLE)
				nb.LastAngle = nb.getAngleFromPoint(nb.Target.X,nb.Target.Y);

			return nb;
		}
	}, { // Instance
		X:0,Y:0,Dx:0,Dy:0,Time:0,Exploded:false,Shape:null,
		Target:null,ShotType:null,Team:null,Damage:0,Shooter:null,AirAttack:false,LastAngle:0,LastX:0,LastY:0,
		vis:false,
		init: function(){
			this.vis = false;
			this.Shape = new Kinetic.Rect({ x:0,y:0,width:1.5,height:1.5,fill:"yellow",visible:false });
			BULLETLAYER.add(this.Shape);
		},
		use : function(){
			if(this.Exploded) return false;
			this.move();
			this.draw();
			return true;
		},
		move : function(){
			if(this.Exploded) return;
			this.X += this.Dx;
			this.Y += this.Dy;
			this.Time--;

			if(this.X > WIDTH) this.X -= WIDTH;
			else if(this.X < 0) this.X += WIDTH;

			if(this.Y > HEIGHT) this.Y = Math.abs(this.Y - HEIGHT);
			else if(this.Y < 0) this.Y = Math.abs(this.Y + HEIGHT);

			if(this.ShotType == ShotTypeEnum.MISSLE)
			{
				//Smoke.create(this.X,this.Y,2,3,10,200);
				//Smoke.create((this.X + this.LastX) / 2,(this.Y + this.LastY) / 2,2,3,10,200);

				this.LastX = this.X;
				this.LastY = this.Y;

				// If the missle lost its target, it will home in on another... (or just zoom around)
				if(this.Target == null){
					var BestDotProduct = -1;
					var b = TeamPool.first;
					while(b){
						if(b.obj != this.Team){
							var u = b.obj.units.first;
							while(u){
								var DistanceMagSquared = u.obj.getDistanceSquaredFromPoint(this.X, this.Y);
								if(DistanceMagSquared < 200 * 200){
									var SpeedMag = Math.sqrt(this.DX * this.Dx + this.Dy * this.Dy);
									var DistanceMag = Math.sqrt(DistanceMagSquared);
									var DotProduct = (this.Dx *(u.obj.X - this.X) + this.Dy * (u.obj.Y - this.Y)) / (SpeedMag * DistanceMag);
									if(DotProduct > BestDotProduct){
										this.Target = n.obj;
										this.LastAngle = this.getAngleFromPoint(n.obj.X,n.obj.Y);
										BestDotProduct = DotProduct;
									}
								}
								u = u.nextLinked;
							}
						}
						b = b.nextLinked;
					}
				}

				if(this.Target != null){
					var speed = MISSLE_ACCELERATION + Math.sqrt(this.Dx * this.Dx + this.Dy * this.Dy);
					var angle = Math.atan2(this.Dy, this.Dx);
					var angleToTarget = this.getAngleFromPoint(this.Target.X, this.Target.Y);
					var RotateAngle = MISSLE_ROTATION * (angleToTarget - this.LastAngle);
					angle += RotateAngle > 0 ? Math.min(RotateAngle, MAX_MISSLE_ROTATION)
											 : Math.max(RotateAngle, -MAX_MISSLE_ROTATION);
					this.LastAngle = angleToTarget;

					this.Dx = speed * Math.cos(angle);
					this.Dy = speed * Math.sin(angle);
				}
			}

			if(this.Time <= 0)
				this.explode();

			if(this.ShotType != ShotTypeEnum.SHELL || this.ShotType != ShotTypeEnum.BOMB)
			{
				var b = TeamPool.first;
				while(b){
					if(b.obj != this.Team){
						var u = b.obj.units.first;
						while(u){
							if(u.obj.getDistanceSquaredFromPoint(this.X,this.Y) < Math.max(this.Dx * this.Dx + this.Dy * this.Dy, (u.obj.radius * u.obj.radius))){
								u.obj.takeDamage(this.Damage, this.Shooter);
								this.explode();
							}
							u = u.nextLinked;
						}
					}
					b = b.nextLinked;
				}
			}
		},
		draw : function(){
			if(this.Exploded) return;
			if(!this.vis) this.Shape.show();
			this.Shape.setPosition(this.X,this.Y);
		},
		explode : function(explosionRadius){
			if(!this.Exploded){
				this.Exploded = true;
				this.Shape.hide();
				explosionRadius = (!explosionRadius) ? 6 + Math.random() * 3 : explosionRadius;

				if(this.ShotType == ShotTypeEnum.SHELL){
					AreaDamage(this.X, this.Y, this.Damage, SHELL_DAMAGE_RADIUS * SHELL_DAMAGE_RADIUS, this.Shooter);
					explosionRadius = SHELL_DAMAGE_RADIUS;
				} else if(this.ShotType == ShotTypeEnum.BOMB) {
					AreaDamage(this.X, this.Y, this.Damage, BOMB_DAMAGE_RADIUS * BOMB_DAMAGE_RADIUS, this.Shooter);
					explosionRadius = BOMB_DAMAGE_RADIUS;
				}

				Explosion.create(this.X + Math.random() * 2 - 1,this.Y + Math.random() * 2 - 1, 0, explosionRadius);
			}
		},
		getAngleFromPoint: function(x1,y1) {
			var dx = x1 - this.X,
				dy = y1 - this.Y,
				w2 = WIDTH * 0.5,
				h2 = HEIGHT * 0.5;

			if (dx < -w2) x1 += WIDTH;
			if (dx > w2) x1 -= WIDTH;
			if (dy < -h2) y1 += HEIGHT;
			if (dy > h2) y1 -= HEIGHT;

			return Math.atan2(y1 - this.Y, x1 - this.X);
		}
	});

// Explosions
	var Explosion = gamecore.DualPooled.extend('Explosion',
	{
		INITIAL_POOL_SIZE : 50,
		create: function(x,y,preDisplayTime,size){

			if(!DRAW_EXPLOSIONS)
			{
				this.finished = true;
				return null;
			}

			var ne = this._super();
			ne.X = x;
			ne.Y = y;
			ne.PreDisplayTime = preDisplayTime;
			ne.TargetSize = size;
			ne.GrowMode = true;
			ne.Size = 0;
			ne.finished = false;
			ne.vis = false;
			ne.Shape.setPosition(x,y);
			return ne;
		}
	},
	{
		X:0,Y:0,PreDisplayTime:0,TargetSize:0,Size:0,GrowMode:false,Shape:null,finished:false,vis:false,
		init: function(){
			this.vis = false;
			this.Shape = new Kinetic.Circle({
				radius:10,
				fillRadialGradientStartPoint: 0, fillRadialGradientStartRadius: 0,
				fillRadialGradientEndPoint: 0, fillRadialGradientEndRadius: 7,
				fillRadialGradientColorStops: [0,'yellow',1,'red'],
				visible:false
			});
			EXPLOSIONLAYER.add(this.Shape);
		},
		use: function(){
			if(this.finished) return;
			this.update();
			this.draw();
		},
		update: function(){
			if(this.Shape == null || this.finished) return;
			if(this.PreDisplayTime > 0) this.PreDisplayTime--;
			else if(this.GrowMode){
				if(this.Size < this.TargetSize) this.Size++;
				else this.GrowMode = false;
			}
			else if(this.Size > 0) this.Size--;
			else this.poof();
		},
		draw: function(){
			if(this.finished) return;
			if(!this.vis) {this.Shape.show(); this.vis = true;}
			if(this.PreDisplayTime <= 0 && this.Size > 0) {
				this.Shape.setScale(this.Size/20);
			}
		},
		poof: function(){
			if(!this.finished){
				this.finished = true;
				if(this.Shape != null && this.vis) { this.Shape.hide(); this.vis = false }
			}
		}
	});

// Smoke
	var Smoke = gamecore.DualPooled.extend('Smoke',
	{
		INITIAL_POOL_SIZE : 250,
		create: function(X, Y, StartSize, EndSize, Time, Redness)
		{
			var sb = this._super();
			sb.X = X; sb.Y = Y;
			sb.StartSize = StartSize;
			sb.EndSize = EndSize;
			sb.TotalTime = Time;
			sb.Shape.setPosition(X,Y);
			sb.finished = false;
			sb.Time = 0;
			sb.vis = false;
			return sb;
		}
	},
	{
		X:0,Y:0,StartSize:0,EndSize:0,TotalTime:0,Redness:0,Time:0,Shape:null,finished:false,vis:false,
		init: function(){
			this.finished = false; this.Time = 0; this.vis = false; // Defaults
			this.Shape = new Kinetic.Circle({
				radius:1,
				visible:false
			});
			SMOKELAYER.add(this.Shape);
		},
		use: function(){
			if(this.finished) return;
			this.update();
			this.draw();
		},
		update: function(){
			if(this.Shape == null || this.finished) return;
			if(this.Time < this.TotalTime) this.Time++;
			else this.poof();
		},
		draw: function(){
			if(this.finished) return;
			if(!this.vis) { this.vis = true; this.Shape.show(); }

			var TimeRatio = this.Time / this.TotalTime,
				Color = Math.floor(25 + 75 * TimeRatio),
				Red = Math.floor(this.Redness * (1 - 4 * TimeRatio));

			if(Red < 0) Red = 0;
			if(Red + Color > 255) Red = 255 - Color;

			this.Shape.setFill("rgb({0},{1},{1})".format((Red+Color),Color));
			this.Shape.setScale(this.StartSize + (this.EndSize - this.StartSize) * this.Time / this.TotalTime);
			//this.Shape.setRadius(this.StartSize + (this.EndSize - this.StartSize) * this.Time / this.TotalTime);

		},
		poof: function(){
			if(!this.finished)
			{
				this.finished = true;
				if(this.Shape != null && this.vis){ this.Shape.hide(); this.vis = false; }
			}
		}
	});

// Typical Work
	function draw() {
		stats.begin();

		var TeamsAlive = NUM_TEAMS;
		if(TeamPool != null){
			var n = TeamPool.first;
			while (n) {
				if(n.obj.units.length() > 0)
					n.obj.work();
				else
					TeamsAlive--;
				n = n.nextLinked;
			}

			if(TeamsAlive <= 1 && !RESTARTING) {
				RESTARTING = true;
				var r = setTimeout(function(){RestartGame();},10000);
			}
		}

		// Draw bullets
		var bp = Bullet.getPool(), b;
		if(bp != null) {
			b = bp.getUsedList().first;
			while(b) { b.obj.use(); b = b.nextLinked; }
			b = bp.getUsedList().first;
			while(b) { if(b.obj.Exploded){ b.obj.release(); } b = b.nextLinked; }
		}

		// Draw Explosions
		var ep = Explosion.getPool(), e;
		if(ep != null) {
			e = ep.getUsedList().first;
			while(e) { e.obj.use(); e = e.nextLinked; }
			e = ep.getUsedList().first;
			while(e) { if(e.obj.finished){ e.obj.release(); } e = e.nextLinked; }
		}

		// Smoke (this seems to be a FPS killer...)
		var sp = Smoke.getPool(), s;
		if(sp != null) {
			s = sp.getUsedList().first;
			while(s) { s.obj.use(); s = s.nextLinked; }
			s = sp.getUsedList().first;
			while(s) { if(s.obj.finished){ s.obj.release(); } s = s.nextLinked; }
		}

		//UpdateScores();

		LAYER.draw();
		BULLETLAYER.draw();
		EXPLOSIONLAYER.draw();
		SMOKELAYER.draw();
		MISCLAYER.draw();
		stats.end();
	}

	function SetupGame()
	{
		// It a lot easier this way...
		MAX_UNITS_PER_FACTION_ON_MAP = Math.floor(MAX_UNITS_ON_SCREEN / NUM_TEAMS);
		MAX_BASE_UNITS = Math.floor((MAX_UNITS_PER_FACTION_ON_MAP * 0.1)),		/* 10% can be bases */
		MAX_BASE_DEFENSES = Math.floor((MAX_UNITS_PER_FACTION_ON_MAP * 0.3));	/* 30% can be defenses */
		var max = Math.floor((MAX_UNITS_PER_FACTION_ON_MAP * 0.1) / 2);
		MAX_SPECIAL_UNITS = (max < 1) ? 1 : max;

		log("Max on screen: "+MAX_UNITS_ON_SCREEN);
		log("Max on per faction: "+MAX_UNITS_PER_FACTION_ON_MAP);
		log("Max bases per faction: "+MAX_BASE_UNITS);
		log("Max base defenses per faction: "+MAX_BASE_DEFENSES);
		log("Max special units per faction: "+MAX_SPECIAL_UNITS);

		var colorIndex = Math.random()*TeamColors.length|0; // Colors + 1 (picks 0 to length)
		var teamMadeInvincible = false;
		for(var i=0;i<=NUM_TEAMS-1;i++, colorIndex = (colorIndex + 1) % TeamColors.length )
		{
			var teamName = getName(4,7,null,null);
			var teamColor = TeamColors[colorIndex];
			var teamDiv = $('<div/>').text('{0} : 0'.format(teamName)).css({color:teamColor.getString()}).addClass('teamDiv').attr("id",teamName);

			var theTeam = new Team(TeamColors[colorIndex],teamName);
			//if(Math.random() < .2 && !teamMadeInvincible) theTeam.invincible = teamMadeInvincible = true;
			TeamPool.add(theTeam);
			$(".bannerContent").first().append(teamDiv);
		}
	}

	function RestartGame()
	{
		RESTARTING = false;
		MISCLAYER.removeChildren(); // Clears anything not tracked...
		ChangeTerrain();
		GetTotalProbability();

		/* put opposite corners in this list so bases start opposite each other */
		var quadrants =
		[
			[0, Math.floor(WIDTH / 2), 0, Math.floor(HEIGHT / 2)], /* left top */
			[Math.floor(WIDTH / 2), WIDTH, Math.floor(HEIGHT / 2), HEIGHT], /* right bottom */
			[Math.floor(WIDTH / 2), WIDTH, 0, Math.floor(HEIGHT / 2)], /* right top */
			[0, Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2), HEIGHT] /* left bottom */
		];

		var t = TeamPool.first, i = 0;
		while(t){

			t.obj.reset(); // This completely blows away the team... (and units)

			var tooClose = true;
			var attempts, x, y;
			attempts = x = y = 0;

			while(tooClose && attempts++ < 100){
				tooClose = false;

				if(WORLD_WRAP){
					x = Math.random()*(WIDTH - BASE_HEAL_RADIUS)|BASE_HEAL_RADIUS;
					y = Math.random()*(HEIGHT - BASE_HEAL_RADIUS)|BASE_HEAL_RADIUS;
				} else
				{
					var quad = quadrants[i % quadrants.length];
					x = Math.random()*quad[0]|quad[1];
					y = Math.random()*quad[2]|quad[3];
				}

				if (x < BASE_HEAL_RADIUS) x += BASE_HEAL_RADIUS;
				else if (x > WIDTH - BASE_HEAL_RADIUS) x -= BASE_HEAL_RADIUS;

				if (y < BASE_HEAL_RADIUS) y += BASE_HEAL_RADIUS;
				else if (y > HEIGHT - BASE_HEAL_RADIUS) y -= BASE_HEAL_RADIUS;

				// Need to loop thru the bases of the team and see if they are too close to each other...
				var b = TeamPool.first;
				while(b) {
					if(t.obj != b.obj && b.obj.units != null && b.obj.units.length() > 0)
						if( b.obj.units.first.obj.getDistanceSquaredFromPoint(x,y) < MIN_SEPERATION_OF_STARTING_BASES * MIN_SEPERATION_OF_STARTING_BASES) {
							tooClose = true;
							break;
						}

					b = b.nextLinked;
				}

				if(tooClose) continue;

				t.obj.createBase(x,y); // Yay!
			}
			i++;
			t = t.nextLinked;
		}
	}

	function AreaDamage(X, Y, Damage, RadiusSquared, Shooter)
	{
		var t = TeamPool.first;
		while(t)
		{
			if(t.obj != Shooter.myTeam) { // Don't damage my team!
				var n = t.obj.units.first;
				while(n) {
					if(n.obj.getDistanceSquaredFromPoint(X, Y) < RadiusSquared && !n.obj.Class.isA("BasePlane"))
						n.obj.takeDamage(Damage,Shooter);
					n = n.nextLinked;
				}
			}
			t = t.nextLinked;
		}
	}

	function ChangeTerrain()
	{
		tcIndex = Math.floor(Math.random()*TerrainColors.length); // Change up the next map terrain
		document.getElementsByTagName('body')[0].style.backgroundColor = "rgb("+TerrainColors[tcIndex].toString()+")";
	}

	function getName(minlength, maxlength, prefix, suffix)
	{
		prefix = prefix || '';
		suffix = suffix || '';
		//these weird character sets are intended to cope with the nature of English (e.g. char 'x' pops up less frequently than char 's')
		//note: 'h' appears as consonants and vocals
		var vocals = 'aeiouyh' + 'aeiou' + 'aeiou';
		var cons = 'bcdfghjklmnpqrstvwxz' + 'bcdfgjklmnprstvw' + 'bcdfgjklmnprst';
		var allchars = vocals + cons;
		var length = (Math.random()*maxlength|minlength) - prefix.length - suffix.length;
		if (length < 1) length = 1;
		var consnum = 0;
		if (prefix.length > 0) {
			for (var i = 0; i < prefix.length; i++){
				if (consnum == 2) consnum = 0;
				if (cons.indexOf(prefix[i]) != -1) consnum++;
			}
		}
		else
			consnum = 1;

		var name = prefix;

		for (var i = 0; i < length; i++) {
			//if we have used 2 consonants, the next char must be vocal.
			if (consnum == 2) {
				touse = vocals;
				consnum = 0;
			}
			else touse = allchars;
			//pick a random character from the set we are goin to use.

			c = touse.charAt(Math.random()*touse.length|0);
			name = name + c;
			if (cons.indexOf(c) != -1) consnum++;
		}
		name = name.charAt(0).toUpperCase() + name.substring(1, name.length) + suffix;
		return name;
	}

	function GetTotalProbability()
	{
		TOTAL_PROB = 0;
		for(n in UnitObjectReference)
			TOTAL_PROB += UnitObjectReference[n].probability;
	}

	function log(str) { console.log(str); }
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/\{(\d+)\}/g, function(match, number) { return typeof args[number] != 'undefined' ? args[number] : match; });
	};

	// DOM related

	window.onerror = function(errorMsg, url, lineNumber)
	{
		log("Unhandled Exception Catched.\nMessage:{0}\nURL:{1}\nLine:{2}".format(errorMsg.toString(), url.toString(), lineNumber.toString()));
		pause();
		return false;
	};

	$('body').keypress(function(e){
		switch(e.which)
		{
			case 116: case 84: // T
				DRAW_TARGET_LINE = !DRAW_TARGET_LINE;
				break;
			case 102: case 70: // F
				DRAW_FOV = !DRAW_FOV;
				break;
			case 112: case 80: case 32: // P / Space : Pause
				pause();
				break;
			case 104: case 72: // H :
				DRAW_HPBAR = !DRAW_HPBAR;
				break;
			case 120: case 88: // X : Reset the entire game (kills all units, etc)
				RestartGame();
				break;
			case 69: case 101: // E : Toggle Explosions
				DRAW_EXPLOSIONS = !DRAW_EXPLOSIONS;
				break;
			case 71: case 103: // G : God Mode
				GOD_MODE = !GOD_MODE;
				break;
			// case 76: case 108: // L : Toggles event listening (FPS killer)
			//	LAYER.setListening(!LAYER.getListening());
			//	break;
		}
	});

	//An outside click event to add random units to the playing field. This uses a different array of allowable units.
	$('#container').click(function(){

		if(!GOD_MODE) return;

		var mousePos = STAGE.getMousePosition();
		var tempObjectReference = [SmallTank,MediumTank,LargeTank,ArtilleryTank,DoubleTank,MissileTank,Builder, DefenseTurret, AATurret];
			//tempObjectReference = [FighterJet]; // Use this to build just one kind of tank... for debugging really...

		// Random Team
		var t = TeamPool.objToNodeMap.entries()[Math.random()*TeamPool.objToNodeMap.size()|0][1]; // Get their class only (not their name)
		var u = tempObjectReference[Math.random()*tempObjectReference.length|0];
		if(u == null) return;

		t.obj.units.add(new u(mousePos.x,mousePos.y,t.obj.color,t.obj.thisTeam));
	});

	// Pause feature! Helpful for unit-for-unit debugging.
	function pause() {$('#togglePlay').trigger('click');}
	$('#togglePlay').click(function(e){
		if(ANIM != null) {
			var pausedDiv = $('<div/>').text('Paused...(P to continue)').addClass('pausedDiv');
			if(IsAnimating) {
				ANIM.stop();
				$('.bannerContent').append(pausedDiv);
			} else {
				ANIM.start(); $('.pausedDiv').remove();
			}
			IsAnimating = !IsAnimating;
		}
	});

	$('#toggleTargetLine').click(function(e){DRAW_TARGET_LINE = !DRAW_TARGET_LINE;});
	$('#toggleFOV').click(function(e){DRAW_FOV = !DRAW_FOV;});
	$('#toggleGODModel').click(function(e){GOD_MODE = !GOD_MODE;});