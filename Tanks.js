/*
	Original code from http://matt.stumpnet.net/
	Modified by http://quickmind.co.uk/tank.html
	Modified by Richard S.
*/

/* crummy mobile phone detection so we can tweak things for better performance */
var IS_IPAD = navigator.platform === 'iPad',
	IS_IPHONE = navigator.platform === 'iPhone',
	IS_ANDROID = navigator.userAgent.toLowerCase().indexOf("android") != -1,
	IS_IOS = IS_IPAD || IS_IPHONE || navigator.userAgent.indexOf("iPod") != -1,
	IS_MOBILE = IS_IOS || IS_ANDROID;

var FPS_TOO_LOW = 45;

/////////////////
// New Globals //
/////////////////
var ROUND = 0, // func RESET() increases this on new rounds.
	NUM_TEAMS = IS_MOBILE ? 2 : IS_IPAD ? 3 : 5, // This is the max amount on the playing field.
	TEAMS_ALIVE = NUM_TEAMS,
	RANDOM_COLORS = true,
	RANDOM_TERRAIN = true,
	GOD_MODE = false, // While enabled, click methods will fire
	DRAW_GOD_MODE_HELP = false,
	MAP_MIN_LOC = 20;

// Fun stuff!
var SCORE_TO_WIN = IS_MOBILE ? 2000 : 30000,
	WINNING_TEAMS = [],
	DAMAGE_MULTIPLIER = 1, // 1 is normal, 0 will screw up the unit! increase/decrease for desired output
	WORLD_WRAP = true, // AWESOME, when this is off the tanks will bounce on the edges... LEAVE IT ON!
	IN_SPACE = false; // Looks best if RANDOM_TERRAIN is disabled

// Important (can be changed from above)
var MAX_UNITS_ON_SCREEN = IS_MOBILE ? 10 : 80,
	getMAX_UNITS_PER_FACTION_ON_MAP = function() { return Math.floor(MAX_UNITS_ON_SCREEN / TEAMS_ALIVE) },
	getMAX_BASE_UNITS		        = function() { return Math.floor((getMAX_UNITS_PER_FACTION_ON_MAP() * .1)) }, 		/* 10% can be bases */
	getMAX_BASE_DEFENSES			= function() { return Math.floor((getMAX_UNITS_PER_FACTION_ON_MAP() * .3)) }, 		/* 30% can be defenses */
	getMAX_SPECIAL_UNITS			= function() { var max = Math.floor((getMAX_UNITS_PER_FACTION_ON_MAP() * .1) / 2); if (max <1) return 1; return max; },
	BASE_HEAL_RADIUS	= (IS_MOBILE ? 45 : 65),
	HEALTH_COOLDOWN		= 100;

console.log("MAX Units (of all teams): " + getMAX_UNITS_PER_FACTION_ON_MAP());

// DEBUG Stuff
var DRAW_TARGET_LINE = false,
	DRAW_RANGE_CIRCLE = false,
	DRAW_DISTANCE_CIRCLE = false,
	DRAW_FOV = false;

var TankStateEnum = {
	IDLE : 0,
	MOVE : 1,
	TARGET_AQUIRED : 2,
	TARGET_IN_RANGE : 3,
	CRASH_AND_BURN : 4,
	EVADE : 5,
	STOP_AND_GUARD : 6
}

// All these have base values that the unit needs to either decrease or increase (likely increase) from.
var ShotType = {
	NONE   : {
		damage : 0,
		timetolive : 0,
		speed : 0,
		splashDamage : false
	},
	BULLET : {
		damage : 5,
		timetolive : 30,
		speed : 5,
		reloadtime : 1,
		splashDamage : false
	},
	SHELL  : {
		damage : 10,
		timetolive : 30,
		speed : 3,
		splashDamage : true,
		reloadtime : 10,
		splashRadius : 10
	},
	MISSLE : {
		damage : 15,
		timetolive : 60,
		speed : 6,
		reloadtime : 5,
		splashDamage : false
	},
	BOMB   : {
		damage : 20,
		timetolive : 30,
		speed : 1,
		splashDamage : true,
		reloadtime : 10,
		splashRadius : 15
	},
	HEAL   : {
		damage : 0,
		timetolive : 0,
		speed : 0,
		splashDamage : false
	}
};

var TankKindEnum = {
	TANK    : 0,
	BASE    : 1,
	BUILDER : 2,
	TURRET  : 3,
	PLANE   : 4
}

var tcIndex,
	terrainColors = [
	 [148, 92, 18], // Mud
	 [39,40,34], //darkness
	 [57,118,40], // Tundra
	 [216, 213, 201], // Desert
	 [177,173,165], // Snow
	 [175, 128, 74], //mars
	 [112, 128, 144],  // Moon
	 [0,0,0], // space!
	 [98,146,134], //rain
	 [198, 191, 165], //slate
	 [117, 113, 75], //field
	 [181, 144, 92], //wood
	 [145, 158, 88], //greenish
	 [32, 22, 12], //darkish brown
	 [83, 64, 60], //chocolate
	 [77, 52, 21], //poop
	 [47, 1, 73], //galaxy purple
	 [13, 44, 75], //blue ocean
	 [46, 68, 94] //ocean 2
	];

/////////////
// Globals //
/////////////
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight;
	WIDTHPREV = WIDTH,
	HEIGHTPREV = HEIGHT,
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
	MAX_MISSLE_ROTATION = .4,
	MIN_BASE_DISTANCE_SQUARE =  MIN_SEPERATION_OF_STARTING_BASES + (WIDTH / 5),
	ANIMATION_ID = null,
	DRAW_BANNER_HEIGHT = 20;

//////////
// Init //
//////////
var canvas, ctx;

/* shim to allow us to use request animation frame intelligently for max FPS and no painting when tab isn't active...
* http://paulirish.com/2011/requestanimationframe-for-smart-animating/
* https://gist.github.com/1579671
*/
(function() {
    var lastTime = 0,
    	vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

window.onkeydown = function(event) {
  if(event == null) keyCode = window.event.keyCode;
  else keyCode = event.keyCode;

  switch (keyCode)
  {
  	case 115:
  	case 83:
  		DRAW_DISTANCE_CIRCLE = !DRAW_DISTANCE_CIRCLE;
  		break;
  	case 116:
  	case 84: /*T*/
  		DRAW_TARGET_LINE = !DRAW_TARGET_LINE;
  		break;
  	case 114:
	case 82: /*R*/
		DRAW_RANGE_CIRCLE = !DRAW_RANGE_CIRCLE;
		break;
	case 103:
	case 71: /*G*/
		GOD_MODE = !GOD_MODE;
		break;
	case 70:
	case 102: /*F*/
		DRAW_FOV = !DRAW_FOV;
		break;
  	default: break;
  }
};

/* IE Hates that this was in onload() and FireFox/Chrome just don't care. */
canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

window.onload = function() {

	WIDTH = window.innerWidth; /* big bag of WTF on iOS with orientation changes */
	HEIGHT = window.innerHeight; /* stable on iOS */

	/* handle retina display:
	* http://stackoverflow.com/questions/4405710/uiwebview-w-html5-canvas-retina-display
	*/
	if (window.devicePixelRatio && window.devicePixelRatio > 1)
	{
		/* http://tripleodeon.com/2011/12/first-understand-your-screen/ */
		/* Don't USE: *///WIDTH = window.outerWidth; /* bug in iOS/mobile devices not reporting correct portrait width */
		canvas.style.width = WIDTH +"px";
		canvas.style.height = HEIGHT+"px";
		canvas.width =  WIDTH * window.devicePixelRatio;
		canvas.height = HEIGHT * window.devicePixelRatio;
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	}
	else
	{
		canvas.style.width = WIDTH +"px";
		canvas.style.height = HEIGHT+"px";
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
	}

	/* scale X Y points of each unit to the new location based on the resize */
	window.onresize = function(event) {

		pauseAnimation();

		WIDTHPREV = WIDTH;
		HEIGHTPREV = HEIGHT;
		WIDTH = window.innerWidth; /* big bag of WTF on iOS with orientation changes */
		HEIGHT = window.innerHeight; /* stable on iOS */

		if (window.devicePixelRatio && window.devicePixelRatio > 1)
		{
			/* Don't USE: *///WIDTH = window.outerWidth; /* bug in iOS/mobile devices not reporting correct portrait width */
			canvas.width =  WIDTH * window.devicePixelRatio;
			canvas.height = HEIGHT * window.devicePixelRatio;
			canvas.style.width = WIDTH +"px";
			canvas.style.height = HEIGHT+"px";
			ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		}
		else /* non device, scale normally */
		{
			canvas.style.width = WIDTH +"px";
			canvas.style.height = HEIGHT+"px";
			canvas.width = WIDTH;
			canvas.height = HEIGHT;
		}

		var xRatio = WIDTH / WIDTHPREV,
			yRatio = HEIGHT / HEIGHTPREV;

		for(var n in Tanks)
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
			{
				var t = Tanks[n];
				t.setX(t.getX() * xRatio);	/* adjust every object to a given resize ratio */
				t.setY(t.getY() * yRatio);
			}

		animate();
	};

	//Start:
	restart();
	animate();
};

canvas.addEventListener('mousemove',function(evt){
	var mousePos = getMousePos(canvas, evt),
		msX = mousePos.x,
		msY = mousePos.y;

	DRAW_GOD_MODE_HELP = (msX >= (WIDTH-45) && msX <= (WIDTH-5) && msY >= 0 && msY <= DRAW_BANNER_HEIGHT);

},false);

canvas.addEventListener('click', function(evt){

	var mousePos = getMousePos(canvas, evt),
		msX = mousePos.x,
		msY = mousePos.y;

	//console.log(msX + "," + msY);

	// This is where the GOD_MODE button is located.
	if(msX >= (WIDTH-45) && msX <= (WIDTH-5) && msY >= 0 && msY <= DRAW_BANNER_HEIGHT){GOD_MODE = !GOD_MODE;	return;}

	// This is where the Target Line and Radius Circle are located
	if(msX >= (WIDTH-70) && msX <= (WIDTH-50) && msY >= 0 && msY <= DRAW_BANNER_HEIGHT)
	{
		DRAW_TARGET_LINE = !DRAW_TARGET_LINE;
		return;
	}
	if(msX >= (WIDTH-95) && msX <= (WIDTH-75) && msY >= 0 && msY <= DRAW_BANNER_HEIGHT)
	{
		DRAW_RANGE_CIRCLE = !DRAW_RANGE_CIRCLE;
		return;
	}
	if(msX >= (WIDTH-120) && msX <= (WIDTH-100) && msY >= 0 && msY <= DRAW_BANNER_HEIGHT)
	{
		DRAW_DISTANCE_CIRCLE = ! DRAW_DISTANCE_CIRCLE;
		return;
	}
	if(msX >= (WIDTH-145) && msX <= (WIDTH-125) && msY >= 0 && msY <= DRAW_BANNER_HEIGHT)
	{
		DRAW_FOV = ! DRAW_FOV;
		return;
	}

	if(GOD_MODE)
	{
		if(evt.shiftKey)
			ClickExplodeUnit(msX,msY,10);
		else if(evt.ctrlKey)
			ClickCreateUnit(msX,msY,true);
		else if(evt.altKey)
			ClickExplodeUnit(msX,msY,300);
		else
			ClickCreateUnit(msX,msY,false); //ClickCreateUnit(msX+rnd(-i*20,i*20),msY+rnd(-i*20,i*20),false,5);
	}

}, false);


// FPS Related Vars
var filterStrength = 20,
	frameTime = 0, lastLoop = new Date, thisLoop,
	roundStartTime;

var Teams = [],
	TeamColors = [
		new Color(255, 0, 0),
		new Color(0, 255, 0),
		new Color(0, 255, 255),
		new Color(255, 0, 255),
		new Color(255, 255, 0),
		new Color(0, 0, 255),
		new Color(255, 255, 255)
	];

function getAngleFromPoint(x1, y1, x2, y2) {
    var dx = x1 - x2,
        dy = y1 - y2,
        w2 = WIDTH * 0.5,
        h2 = HEIGHT * 0.5;

    if (dx < -w2)
        x1 += WIDTH;
    if (dx > w2)
        x1 -= WIDTH;
    if (dy < -h2)
        y1 += HEIGHT;
    if (dy > h2)
        y1 -= HEIGHT;

    return Math.atan2(y1 - y2, x1 - x2);
}

//create teams
var currcolor = rndInt(0,TeamColors.length-1); /* gotta set here, not after i in for loop... wtf JS ? */
for(var i=0; i<=NUM_TEAMS-1; i++, currcolor= (currcolor +1) % TeamColors.length)
	Teams[i] = new Team(TeamColors[currcolor],getName(4,7,null,null));

var TankTypes = [];
//Small Tank:
TankTypes[0] = {
	Kind : TankKindEnum.TANK,
	Special : false,
	AttackingUnit :  true,
	Prob : 120,
	MoveSpeed : 1.4,
	TurnSpeed : .18,
	TurretTurnSpeed : .19,
	TurretAttackAngle : 45,
	Radius : 10,
	HitPoints : 30,
	CooldownTime :  25,
	MinRange : 10,
	AttackDistance : 100,
	AttackRange : 125,
	SightDistance : 200,
	BulletType : [ShotType.BULLET],
	BulletAdjust : [{damage:-2,speed :1}],
	TurretSize : 5,
	BarrelLength : 10,
	DoubleTurret : false,
	AntiAircraft : false,
	CanGoEvasive : true,
	EvaProb : .25
};

//Medium Tank
TankTypes[1] = {
	Kind : TankKindEnum.TANK,
	Special : false,
	AttackingUnit :  true,
	Prob : 120,
	MoveSpeed : 1.0,
	TurnSpeed : .13,
	TurretTurnSpeed : .16,
	TurretAttackAngle : 45,
	Radius : 10,
	HitPoints : 50,
	CooldownTime : 35,
	MinRange : 25,
	AttackDistance : 115,
	AttackRange : 140,
	SightDistance : 200,
	BulletType : [ShotType.BULLET],
	BulletAdjust : [{damage:-1,speed :1}],
	TurretSize : 6,
	BarrelLength : 12,
	DoubleTurret : false,
	AntiAircraft : false,
	CanGoEvasive : true,
	EvaProb : .25
};

//Large Tank
TankTypes[2] = {
	Kind : TankKindEnum.TANK,
	Special : false,
	AttackingUnit : true,
	Prob : 120,
	MoveSpeed : 0.8,
	TurnSpeed : .09,
	TurretTurnSpeed : .14,
	TurretAttackAngle : 45,
	Radius : 10,
	HitPoints : 75,
	CooldownTime : 50,
	MinRange : 25,
	AttackDistance : 130,
	AttackRange : 155,
	SightDistance : 200,
	BulletType : [ShotType.BULLET],
	BulletAdjust : [{damage:1,speed :1}],
	TurretSize : 7,
	BarrelLength : 14,
	DoubleTurret : false,
	AntiAircraft : false,
	CanGoEvasive : true,
	EvaProb : .25
};

//Artillery
TankTypes[3] = {
	Kind : TankKindEnum.TANK,
	Special : false,
	AttackingUnit : true,
	Prob : 60,
	MoveSpeed : 0.9,
	TurnSpeed : .07,
	TurretTurnSpeed : 0.12,
	TurretAttackAngle : 45,
	Radius : 10,
	HitPoints : 25,
	CooldownTime : 75,
	MinRange : 50,
	AttackDistance : 175,
	AttackRange : 180,
	SightDistance : 180,
	BulletType : [ShotType.SHELL],
	BulletAdjust : [{damage:5,speed :-1}],
	TurretSize : 0,
	BarrelLength :  16,
	DoubleTurret : false,
	AntiAircraft : false,
	CanGoEvasive : true,
	EvaProb : .25
};

//Double Tank
TankTypes[4] = {
	Kind : TankKindEnum.TANK,
	Special : false,
	AttackingUnit : true,
	Prob : 80,
	MoveSpeed : 0.7,
	TurnSpeed : .07,
	TurretTurnSpeed : 0.12,
	TurretAttackAngle : 45,
	Radius : 10,
	HitPoints : 85,
	CooldownTime : 70,
	MinRange : 25,
	AttackDistance : 130,
	AttackRange : 155,
	SightDistance : 200,
	BulletType : [ShotType.BULLET],
	BulletAdjust : [{damage:0,speed :1}],
	TurretSize : 7,
	BarrelLength : 14,
	DoubleTurret : true,
	TurretSeparation : 1.25,
	AntiAircraft : false,
	CanGoEvasive : true,
	EvaProb : .25
};

//Missle Launcher
TankTypes[5] = {
	Kind : TankKindEnum.TANK,
	Special : false,
	AttackingUnit : true,
	Prob : 90,
	MoveSpeed : 1.0,
	TurnSpeed : .07,
	TurretTurnSpeed : 0.13,
	TurretAttackAngle : 45,
	Radius : 10,
	HitPoints : 35,
	CooldownTime : 70,
	MinRange : 25,
	AttackDistance : 130,
	AttackRange : 155,
	SightDistance : 200,
	BulletType : [ShotType.MISSLE],
	BulletAdjust : [{damage:-7,speed :0}],
	TurretSize : 0,
	BarrelLength : 5,
	DoubleTurret : true,
	TurretSeparation : 2.5,
	AntiAircraft : true,
	CanGoEvasive : true,
	EvaProb : .7
};

//Turret
TankTypes[6] = {
	Kind : TankKindEnum.TURRET,
	Special : false,
	AttackingUnit : true,
	Prob : 40,
	MoveSpeed : 0,
	TurnSpeed : 0,
	TurretTurnSpeed : 0.16,
	TurretAttackAngle : 45,
	Radius : 7,
	HitPoints : 200,
	CooldownTime : 25,
	MinRange : 10,
	AttackDistance : 150,
	AttackRange : 150,
	SightDistance : 150,
	BulletType : [ShotType.BULLET],
	BulletAdjust : [{damage:-1,speed :1}],
	TurretSize : 6,
	BarrelLength : 12,
	DoubleTurret : false,
	AntiAircraft : false,
	CanGoEvasive : false,
	EvaProb : 0
};

//AA Turret
TankTypes[7] = {
	Kind : TankKindEnum.TURRET,
	Special : false,
	AttackingUnit : true,
	Prob : 70,
	MoveSpeed : 0,
	TurnSpeed : 0,
	TurretTurnSpeed : 0.14,
	TurretAttackAngle : 65,
	Radius : 7,
	HitPoints : 45,
	CooldownTime : 7,
	MinRange : 10,
	AttackDistance : 130,
	AttackRange : 130,
	SightDistance : 180,
	BulletType : [ShotType.BULLET],
	BulletAdjust : [{damage:-4,speed :5}],
	TurretSize : 4,
	BarrelLength : 6,
	DoubleTurret : true,
	TurretSeparation : 4,
	AntiAircraft : true,
	CanGoEvasive : false,
	EvaProb : 0
};

//Builder
TankTypes[8] = {
	Kind : TankKindEnum.BUILDER,
	Special : false,
	AttackingUnit : false,
	Prob : 15,
	MoveSpeed : 1.05,
	TurnSpeed : .13,
	TurretTurnSpeed : 0,
	Radius : 10,
	HitPoints : 100,
	CooldownTime : 250,
	MinRange : 0,
	AttackDistance : 0,
	AttackRange : 0,
	SightDistance : 200,
	BulletType : [ShotType.NONE],
	TurretSize : 0,
	BarrelLength :  0,
	DoubleTurret : false,
	CanGoEvasive : true,
	EvaProb : .8
};

//Bomber
TankTypes[9] = {
	Kind : TankKindEnum.PLANE,
	Special : false,
	AttackingUnit : true,
	Prob : IS_MOBILE ? 15 : 30,
	MoveSpeed : 2.5,
	TurnSpeed : .045,
	TurretTurnSpeed : .5,
	TurretAttackAngle : 20,
	Radius : 12,
	HitPoints : 80,
	CooldownTime : 6,
	MinRange : 10,
	AttackDistance : 60,
	AttackRange : 60,
	SightDistance : 250,
	BulletType : [ShotType.BOMB],
	BulletAdjust : [{damage:-15,speed :0}],
	BarrelLength :  0,
	DoubleTurret : false,
	AntiAircraft : false,
	CanGoEvasive : false,
	EvaProb : 0
};

//Fighter
TankTypes[10] = {
	Kind : TankKindEnum.PLANE,
	Special : false,
	AttackingUnit : true,
	Prob : IS_MOBILE ? 15 : 30,
	MoveSpeed : 3.5,
	TurnSpeed : .24,
	TurretTurnSpeed : .15,
	TurretAttackAngle : 45,
	Radius : 12,
	HitPoints : 160,
	CooldownTime : 100,
	MinRange : 10,
	AttackDistance : 350,
	AttackRange : 350,
	SightDistance : 500,
	BulletType : [ShotType.MISSLE, ShotType.SHELL],
	BulletAdjust : [{damage:-5,speed :4,attackaironly:true},{damage:0,speed :0,timetolive:1}],
	BarrelLength :  0,
	DoubleTurret : true,
	TurretSeparation : 4,
	AntiAircraft : true,
	CanGoEvasive : false,
	EvaProb : 0
};

// Mammoth Tank
TankTypes[11] = {
	Kind : TankKindEnum.TANK,
	Special : true,
	AttackingUnit : true,
	Prob : 20, // 20
	MoveSpeed : 1.29,
	TurnSpeed : .09,
	TurretTurnSpeed : 0.19,
	TurretAttackAngle : 45,
	Radius : 10,
	HitPoints : 350, //500
	CooldownTime : 80,
	MinRange : 15,
	AttackDistance : 130,
	AttackRange : 135,
	SightDistance : 300,
	BulletType : [ShotType.BULLET, ShotType.MISSLE],
	BulletAdjust : [{damage:3,speed :5},{damage:0,speed :0,attackaironly:true}],
	TurretSize : 10,
	BarrelLength : 20,
	DoubleTurret : true,
	TurretSeparation : 3.5,
	AntiAircraft : true,
	CanGoEvasive : true,
	EvaProb : .3
};

// UAV (Scout)
TankTypes[12] = {
	Kind : TankKindEnum.PLANE,
	Special : false,
	AttackingUnit : false,
	Prob : 5,
	MoveSpeed : 4.5,
	TurnSpeed : .12,
	TurretTurnSpeed : .15,
	Radius : 12,
	HitPoints : 400, // This will automatically drain
	CooldownTime : 100,
	MinRange : 10,
	SightDistance : 600,
	BulletType : [ShotType.NONE],
};

// Heal Tank
TankTypes[13] = {
	Kind : TankKindEnum.TANK,
	Special : false,
	AttackingUnit : false,
	Prob : 30,
	MoveSpeed : 1.05,
	TurnSpeed : .13,
	TurretTurnSpeed : 0,
	Radius : 10,
	HitPoints : 100,
	CooldownTime : 250,
	MinRange : 40, /* make it same as attack distance so he gets just close enough for a heal */
	AttackDistance : 50, /* the attack distance needs to be less than attack range as this will get the healer tank closer to the target */
	AttackRange : 50,
	SightDistance : 200,
	BulletType : [ShotType.HEAL],
	TurretSize : 0,
	BarrelLength :  0,
	DoubleTurret : false,
	CanGoEvasive : false,
	EvaProb : 0
};

//Base
var BaseType = {
	Kind : TankKindEnum.BASE,
	Special : false,
	AttackingUnit : false,
	Prob : 0,
	MoveSpeed : 0,
	TurnSpeed : 0,
	TurretTurnSpeed : 0,
	Radius : 10,
	HitPoints : 1000,
	CooldownTime : IS_MOBILE ? 100 : 200,
	MinRange : 0,
	AttackDistance : 0,
	AttackRange : 0,
	SightDistance : 200,
	BulletType : [ShotType.NONE],
	TurretSize : 0,
	BarrelLength :  0,
	DoubleTurret : false,
	CanGoEvasive : false,
	EvaProb : 0
};


var TotalProb;
var TotalUnits;

var Tanks = new Set("tankIndex");
var Bullets = new Set("bulletIndex");
var Explosions = new Set("explosionIndex");
var Smokes = new Set("smokeIndex");
var DebrisSet = new Set("debrisIndex");

console.log("Welcome to Tanks!");
console.log("Number of Teams Playing: " + NUM_TEAMS);
console.log("Random Map Terrain? " + RANDOM_TERRAIN.toString());
console.log("Max Units per Faction: " + getMAX_UNITS_PER_FACTION_ON_MAP());
console.log("Max Bases per Faction: " + getMAX_BASE_UNITS());
console.log("Max Bases defenses per Faction: " + getMAX_BASE_DEFENSES());
console.log("Max Special units per Faction: " + getMAX_SPECIAL_UNITS());
console.log("Current Healing Radius for Bases: " + BASE_HEAL_RADIUS);
console.log("Healing Cooldown base value : " + HEALTH_COOLDOWN);
console.log("Welcoming todays fighters...");
for(var tn in Teams)
	console.log(Teams[tn].getName() + "!");


/////////////
// Classes //
/////////////

//----- Set class  -----
function Set(indexName)
{
	var IndexName = indexName;
	var Index = 0;

	this.add = function(item) {
		if(this.contains(item))
			return;
		item[IndexName] = Index;
		this[Index] = item;
		Index++;
	};

	this.clear = function() {
		for(var n in this)
		if(this.contains(this[n]))
			this.remove(this[n]);
		Index = 0;
	};

	this.contains = function(item) {
		return item.hasOwnProperty(IndexName) &&
			this.hasOwnProperty(item[IndexName]) &&
			item === this[item[IndexName]];
	};

	this.remove = function(item) {
		if(!this.contains(item))
			return;
		delete this[item[IndexName]];
		delete item[IndexName];
	};

	// http://www.tutorialspoint.com/javascript/array_filter.htm
	this.filter = function(fun /*, thisp*/)
	{
		var len = 0;
		for(var n in this)
			if(this.contains(this[n]))
				len++;

		if (typeof fun != "function")
			throw new TypeError();

		var res = new Array();
		var thisp = arguments[1];
		for (var i = 0; i < len; i++)
			if (i in this)
			{
				var val = this[i]; // in case fun mutates this
				if (fun.call(thisp, val, i, this))
					res.push(val);
			}

		return res;
	}

}

//----- Tank class -----
function Tank(x_init, y_init, team, type, teamnum) {
	var X = x_init,
		Y = y_init,
		DestX = x_init,
		DestY = y_init,
		Team = team,
		Teamnum = teamnum,
		Type = type,
		Time = 60,
		TurnSpeed = rnd(Type.TurnSpeed * .3, Type.TurnSpeed * 1.05), /* 70% - 105% */
		MoveSpeed = rnd(Type.MoveSpeed * .7, Type.MoveSpeed * 1.05), /* 70% - 105% */
		HitPoints = Type.HitPoints,
		Cooldown = Type.Kind === TankKindEnum.BASE ? Math.random() * Type.CooldownTime : Type.CooldownTime,
		Target = null,
		TargetEvasive = null,
		TargetEvasiveLocation = { X: 0, Y:0, XOffset: 0, YOffest: 0},
		LastEvadeSwitchDate = new Date(),
		Specail = false,
		BaseAngle = 0,
		TargetBaseAngle = 0,
		TurretAngle = 0,
		TargetTurretAngle = 0,
		HealCooldown = (Math.floor(Math.random()*2)+ 1) * HEALTH_COOLDOWN, // Random time the health regen will occur
		CanEvade = Type.CanGoEvasive,
		EvadeProb = Type.EvaProb,
		State = TankStateEnum.IDLE,
		Weapons = null,
		This = this;


	//Setup/Adjust Weapon Grades! WOOOOOOOOOOOOOO!
	SetupMyGuns();

	// Special changes for unique units
	switch(Type.Kind)
	{
		case TankKindEnum.PLANE:
		case TankKindEnum.BUILDER:
			State = TankStateEnum.MOVE;
			TargetBaseAngle = 2 * Math.PI * Math.random();
			BaseAngle = 2 * Math.PI * Math.random();
			break;
		default:
			/* Nothing changes */
			break;
	}

	//Privileged:
	switch(Type.Kind)
	{
		case TankKindEnum.BASE:
			this.doStuff = function() {
				State = TankStateEnum.IDLE;

				if(HealCooldown > 0)
					HealCooldown--;
				else
				{
					heal(BASE_HEAL_RADIUS);
					HealCooldown = (Math.floor(Math.random()*2)+ 1) * HEALTH_COOLDOWN;
				}

				if(Cooldown > 0)
				{
					Cooldown--;
					return;
				}

				var TypeToMake;
				var rand = Math.floor(Math.random() * TotalProb);

				for(var i = 0; i < TankTypes.length; i++){
					if(rand < TankTypes[i].Prob){
						TypeToMake = TankTypes[i];
						break;
					}
					else rand -= TankTypes[i].Prob;
				}

				if (!TypeToMake) return;

				//console.log((new Date() - Team.getLastTargetFoundDate()) / 1000);

				/* Divide by 1000 to get seconds */
				if ((new Date().getTime() - Team.getLastTargetFoundDate().getTime()) / 1000 > 10)
				{
					var angle = Math.random() * 2 * Math.PI;
					//Tanks.add(new Tank(X + 25 * Math.cos(angle), Y + 25 * Math.sin(angle), Team, TankTypes[12], Teamnum));
					Team.resetLastTargetFoundDate();
				}

				if(Team.getScore() < getMAX_UNITS_PER_FACTION_ON_MAP())
				{
					if(TypeToMake.Kind == TankKindEnum.BUILDER)
					{
						var _TotalOfUnit = GetNumOfType(TypeToMake,Team);
						var _TotalBasesBuilt = GetNumOfType(BaseType,Team);

						if ((_TotalBasesBuilt + _TotalOfUnit) >= getMAX_BASE_UNITS()) return; // Maxed out Bases!
					}

					if(TypeToMake.Kind == TankKindEnum.TURRET)
						if (GetNumOfType(TankTypes[6]) + GetNumOfType(TankTypes[7],Team) >= getMAX_BASE_DEFENSES()) return; // Maxed out defenses!

					if(TypeToMake.Special && GetNumOfSpecials() >= getMAX_SPECIAL_UNITS()) return;

					/* Checking if there are any other units out there before building a healer tank. */
					if(TypeToMake.Kind == TankKindEnum.TANK && inArray(TypeToMake.BulletType,ShotType.HEAL)
						&& Tanks.filter(function(element,index,array){if(element.getTeam()==team&&element.isAttacker())return element;}) <= 0)
							return;

					var angle = Math.random() * 2 * Math.PI;
					Tanks.add(new Tank(X + 25 * Math.cos(angle), Y + 25 * Math.sin(angle), Team, TypeToMake, teamnum));
					Cooldown = Type.CooldownTime;
				}
				else
					return; // Maxed out units!
			}
			break;
		case TankKindEnum.TANK:
			this.doStuff = function() {

				/* If things need to be done all the time, no matter when, they go here */
				// If the unit is a healer, throttle the healing attempts
				if(This.isHealer())
				{
					if(HealCooldown > 0)
						HealCooldown--;
					else
					{
						heal(Type.AttackRange);
						HealCooldown = (Math.floor(Math.random()*2)+ 1) * HEALTH_COOLDOWN;
					}
				}

				// If the unit is a mammoth tank, check and throttle the healing attempts
				if(This.isSpecial())
				{
					if(HealCooldown > 0)
						HealCooldown--;
					else
					{
						if((HitPoints / Type.HitPoints) < .5)
						{
							this.recoverHitPoints(null,This);
							HealCooldown = (Math.floor(Math.random()*2)+ 1) * HEALTH_COOLDOWN;
						}
					}
				}


				switch (State)
				{
					case TankStateEnum.IDLE:
						if(Math.random() < MOVE_PROB) {
							TargetBaseAngle = 2 * Math.PI * Math.random();
							State = TankStateEnum.MOVE;
						}
						TargetTurretAngle = TargetBaseAngle;
						turnTurret();
						findTargets();
						if(IN_SPACE) moveForward();
						break;
					case TankStateEnum.MOVE:
						moveForward();
						if(Math.random() < MOVE_PROB)
							State = TankStateEnum.IDLE;
						if(Math.random() < MOVE_PROB)
							TargetBaseAngle = 2 * Math.PI * Math.random();
						TargetTurretAngle = TargetBaseAngle;
						turnTurret();
						findTargets();
						break;
					case TankStateEnum.TARGET_AQUIRED:

						if (!This.isHealer())
							Team.resetLastTargetFoundDate();

						findTargets(); /* see if there is a better target to fire on*/

						if(Target != null) {
							var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);

							if(TargetDistanceSquared <= Type.MinRange * Type.MinRange) {
								TargetBaseAngle = this.getAngleFromPoint(Target.getX(), Target.getY()) + Math.PI;
								moveForward();

								this.moveTurretAndAttack();
							} else if(TargetDistanceSquared <= Type.AttackDistance * Type.AttackDistance) {
								State = TankStateEnum.TARGET_IN_RANGE;

								if(IN_SPACE) moveForward();
							} else {
								TargetBaseAngle = this.getAngleFromPoint(Target.getX(), Target.getY());
								moveForward();
								this.moveTurretAndAttack();
							}
						}
						else
						{
							State = TankStateEnum.IDLE;
							DestX = X;
							DestY = Y;
						}

						break;
					case TankStateEnum.TARGET_IN_RANGE:
						if(Target === null || !Tanks.contains(Target)) {
							State = TankStateEnum.IDLE;
							DestX = X;
							DestY = Y;
							Target = null;
						} else {
							if (!This.isHealer())
								Team.resetLastTargetFoundDate();

							if(Target.getDistanceSquaredFromPoint(X, Y) > Type.AttackDistance * Type.AttackDistance) {
								State = TankStateEnum.TARGET_AQUIRED;
							} else {
								this.moveTurretAndAttack();
							}
						}
						if(IN_SPACE) moveForward();
						break;
					case TankStateEnum.EVADE:
						// need to get one of the bases and move to it!

						var dist = null, prevTargetEvasive = TargetEvasive;

						TargetEvasive = null; /* reset the evasive target (where to heal), we will re-evaluate the closest one */

						for(var n in Tanks)
							if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
								if(Tanks[n].getTeam() == Team && (Tanks[n].isBase() || Tanks[n].isHealer()))
								{
									/* find closest base/healer */
									var currDist = Tanks[n].getDistanceSquaredFromPoint(X,Y);
									if (dist == null || currDist < dist) {
										TargetEvasive = Tanks[n];
										dist = currDist;
									}
								}

						findTargets(); /* see if there is a better target to fire on*/
						if (Target != null)
						{
							callFriendlies(Target);
							this.moveTurretAndAttack();
						}

						if (TargetEvasive == null || this.stopEvading())
						{
							State = TankStateEnum.IDLE; /* no base or we stopped evading ... FIGHT! */
							return;
						}

						if (prevTargetEvasive != TargetEvasive || TargetEvasive.isHealer())
						{
							if (TargetEvasive.isBase())
							{
								TargetEvasiveLocation.XOffset = TargetEvasiveLocation.YOffest = 0; /* reset offest used for randomly picking in a healer() */

								//http://stackoverflow.com/questions/4707796/use-x-y-coordinates-to-plot-points-inside-a-circle
								var xRand = (Math.random() * 2 * BASE_HEAL_RADIUS - BASE_HEAL_RADIUS - 4);
								var ylim = Math.sqrt((BASE_HEAL_RADIUS - 2) * (BASE_HEAL_RADIUS - 2) - xRand * xRand);
								var yRand = (Math.random() * 2 * ylim - ylim);

								TargetEvasiveLocation.X = TargetEvasive.getX() + xRand;
								TargetEvasiveLocation.Y = TargetEvasive.getY() + yRand;

								//console.log("EVASIVE: picking point from " + TargetEvasive.getX() + "," + TargetEvasive.getY() + "+(" + BASE_HEAL_RADIUS +"): " + TargetEvasiveLocation.X + "," + TargetEvasiveLocation.Y);
							}
							else
							{
								if (TargetEvasiveLocation.XOffset == 0 && TargetEvasiveLocation.YOffest == 0) /* calculate a random point in the healer */
								{
									//http://stackoverflow.com/questions/4707796/use-x-y-coordinates-to-plot-points-inside-a-circle
									var xRand = (Math.random() * 2 * TargetEvasive.getKind().AttackRange - TargetEvasive.getKind().AttackRange - 4);
									var ylim = Math.sqrt((TargetEvasive.getKind().AttackRange - 2) * (TargetEvasive.getKind().AttackRange - 2) - xRand * xRand);
									var yRand = (Math.random() * 2 * ylim - ylim);
								}

								TargetEvasiveLocation.X = TargetEvasive.getX() + TargetEvasiveLocation.XOffset;
								TargetEvasiveLocation.Y = TargetEvasive.getY() + TargetEvasiveLocation.YOffest;
							}

						}

						/* keep moving towards base, we havent finished healing */
						if (Math.floor(X) != Math.floor(TargetEvasiveLocation.X) || Math.floor(Y) != Math.floor(TargetEvasiveLocation.Y))
						{
                            TargetBaseAngle = this.getAngleFromPoint(TargetEvasiveLocation.X, TargetEvasiveLocation.Y);
							moveForward();
						}
						else
							State = TankStateEnum.STOP_AND_GUARD; /* sit in base heal radius */

						break;
					case TankStateEnum.STOP_AND_GUARD:
						/* did we loose our healer/base?  Go back to evade to pick a new evasive target! */
						if (TargetEvasive != null && !Tanks.contains(TargetEvasive)) State = TankStateEnum.EVADE;

						// Check their HP. If is over 60%, get back out there and fight!
						if(this.stopEvading())
							State = TankStateEnum.IDLE;
						else
						{
							/* ensure we are still at our heal spot */
							if (Math.floor(X) != Math.floor(TargetEvasiveLocation.X) || Math.floor(Y) != Math.floor(TargetEvasiveLocation.Y))
							{
	                            TargetBaseAngle = this.getAngleFromPoint(TargetEvasiveLocation.X, TargetEvasiveLocation.Y);
								moveForward();
							}

							findTargets();
							/* Look for a target to help friendlies shoot at */
							if(Target != null && !Target.isBase())
								this.moveTurretAndAttack();

							/* causes random turret twitching during stop? */
							/*else if(Math.random() < MOVE_PROB)
							{
								TargetBaseAngle = 2 * Math.PI * Math.random();
								TargetTurretAngle = TargetBaseAngle;
								turnTurret();
							}*/
						}

						break;
				}
				if(Cooldown > 0)
					Cooldown--;
			};
			break;
		case TankKindEnum.BUILDER:
			this.doStuff = function() {
				switch (State)
				{
					case TankStateEnum.IDLE:
						if(Math.random() < MOVE_PROB) {
							TargetBaseAngle = 2 * Math.PI * Math.random();
							State = TankStateEnum.MOVE;
						}
						break;
					case TankStateEnum.MOVE:
						if(Math.random() < MOVE_PROB && Math.random() < MOVE_PROB)
							State = TankStateEnum.IDLE;
						if(Math.random() < MOVE_PROB)
							TargetBaseAngle = 2 * Math.PI * Math.random();
						moveForward();
						break;
					case TankStateEnum.TARGET_AQUIRED:
						State = TankStateEnum.IDLE;
						Target = null;
						break;
				}
				if(Cooldown > 0) {
					Cooldown--;
					moveForward();
					return;
				}
				var dontBuild = false;
				for(var n in Tanks) {
					if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
						// Prevents the builder from building too close to enemies
						if(Tanks[n].getTeam() != Team && Tanks[n].getDistanceSquaredFromPoint(X, Y) < MIN_BASE_DISTANCE_SQUARE * 60){
							dontBuild = true;
							break;
						}

						// Prevents the builder from building too close to each other (including other team bases)
						if(Tanks[n].isBase() && Tanks[n].getDistanceSquaredFromPoint(X, Y) < MIN_BASE_DISTANCE_SQUARE * 10) {
							dontBuild = true;
							break;
						}
					}
				}

				/* Um, no bases left and i'm the only one? build wherever! */
				if(GetNumOfType(BaseType,Team) < 1)
					dontBuild = false; // Build anyways

				if(dontBuild) {
					Cooldown += 5;
				} else {

					// Need to prevent bases from building so close to the edges!
					if(X > WIDTH - BASE_HEAL_RADIUS || X < BASE_HEAL_RADIUS ||
						Y > HEIGHT - BASE_HEAL_RADIUS - DRAW_BANNER_HEIGHT || Y < BASE_HEAL_RADIUS + DRAW_BANNER_HEIGHT
						)
						Cooldown += 5; // Keep going until you're away from the wall jerks...
					else
					{
						Tanks.add(new Tank(X, Y, Team, BaseType, teamnum));
						Team.setScore(Team.getScore()-1);
						Tanks.remove(This);
					}
				}
			};
			break;
		case TankKindEnum.TURRET:
			this.doStuff = function() {
				switch (State)
				{
					case TankStateEnum.IDLE:
						if(Math.random() < MOVE_PROB)
							TargetTurretAngle = 2 * Math.PI * Math.random() - Math.PI;
						turnTurret();
						findTargets();
						break;
					case TankStateEnum.TARGET_AQUIRED:
						Team.resetLastTargetFoundDate(); // Update the last found time
						findTargets();
						this.moveTurretAndAttack();

						if(Target === null || !Tanks.contains(Target)
							|| Target.getDistanceSquaredFromPoint(X, Y) > Type.AttackRange * Type.AttackRange) {
							State = TankStateEnum.IDLE;
							Target = null;
						}
						break;
				}
				if(Cooldown > 0)
					Cooldown--;
			};
			break;
		case TankKindEnum.PLANE:
			this.doStuff = function() {
				switch (State)
				{
					case TankStateEnum.IDLE:
					case TankStateEnum.MOVE:
					case TankStateEnum.EVADE:
						moveForward();
						if(Math.random() < MOVE_PROB)
							TargetBaseAngle = 2 * Math.PI * Math.random();

						if(inArray(Type.BulletType,ShotType.NONE))
							This.takeDamage(1,null);

						turnTurret();
						findTargets();
						break;
					case TankStateEnum.TARGET_AQUIRED:
						Team.resetLastTargetFoundDate(); // Update the last found time
						moveForward();

						if(inArray(Type.BulletType,ShotType.NONE))
						{
							State = TankStateEnum.MOVE;
							return;
						}

						TurretAngle = BaseAngle;
						setTargetTurretAngle(Target);
						if(Math.abs(TargetTurretAngle - TurretAngle) < Type.TurretTurnSpeed)
							TargetTurretAngle = TurretAngle;

						if(Target === null || !Tanks.contains(Target)) {
							State = TankStateEnum.MOVE;
							Target = null;
						} else {
							var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);
							if(TargetDistanceSquared > Type.MinRange * Type.MinRange && TargetDistanceSquared <= Type.AttackDistance * Type.AttackDistance) {
                                var angle = this.getAngleFromPoint(Target.getX(), Target.getY());
								if(Math.cos(BaseAngle - angle) > 0)
									TargetBaseAngle = this.getAngleFromPoint(Target.getX(), Target.getY());

								attack();
							} else {
								//Search for a better target:
								var TargetQualityFunction = function(target) {
									var angle = getAngleFromPoint(target.getX(), target.getY(), X, Y);
									var distance = Math.sqrt(target.getDistanceSquaredFromPoint(X, Y));
									return Math.cos(BaseAngle - angle) * (Type.SightDistance-Math.abs((Type.AttackDistance + Type.MinRange) / 2 - distance));
								}
								var TargetQuality = TargetQualityFunction(Target);
								for(var n in Tanks) {
									if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
										if(Tanks[n].getTeam() != Team && Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance
											&& (Type.AntiAircraft || !Tanks[n].isPlane())) {
												if (This.isPlane() && Tanks[n].isPlane()) /* AA planes should attack other planes... */
												{
													if (Type.AntiAircraft)
													{
														/* get that plane, regardless of the quality */
														Target = Tanks[n];
														break;
													}
													continue;
												}

												var quality = TargetQualityFunction(Tanks[n]);
												if(quality > TargetQuality) {
													TargetQuality = quality;
													Target = Tanks[n];
												}
										}
									}
								}

								if(TargetDistanceSquared > Type.MinRange * Type.MinRange)
									TargetBaseAngle = this.getAngleFromPoint(Target.getX(), Target.getY());
							}
						}

						break;
					case TankStateEnum.CRASH_AND_BURN:
						if(Time-- > 0) {
							if(!(Target === null || !Tanks.contains(Target)))
                                TargetBaseAngle = this.getAngleFromPoint(Target.getX(), Target.getY());

							moveForward();
							Smokes.add(new Smoke(X, Y, 1, 6, 25, 200));
						} else {
							AreaDamage(X, Y, 100, 400, null);
							die();
						}

						break;
				}
				if(Cooldown > 0)
					Cooldown--;
			};
			break;
	}

	// Unit Draw methods
	switch(Type.Kind)
	{
		case TankKindEnum.BASE:
			this.draw = function(canvasContext) {

				canvasContext.fillStyle = "rgb(0,0,0)";
				canvasContext.fillRect (X - 11, Y - 11, 22, 22);

				canvasContext.fillStyle = Team.getColor().getColorString();
				canvasContext.fillRect (X - 10, Y - 10, 20, 20);

				// Draw Healing Circle
				this.drawCircle(canvasContext,BASE_HEAL_RADIUS-4,.2);
				this.drawHPBar(canvasContext,X,Y);
			};
			break;
		case TankKindEnum.TANK:
		case TankKindEnum.BUILDER:
		case TankKindEnum.TURRET:
			this.draw = function(canvasContext) {
				//Base:
				if(!(Type.Kind === TankKindEnum.TURRET))
				{
					canvasContext.save();
					canvasContext.translate(X, Y);
					canvasContext.rotate(BaseAngle);
					canvasContext.beginPath();
					canvasContext.fillStyle = Team.getColor().getColorStringWithAlpha(.2);
					canvasContext.strokeStyle = Team.getColor().getColorString();

					if(Type.Special) /* MAMMOTH TANK! */
					{
						canvasContext.moveTo(10,0);
						canvasContext.lineTo(10,5);
						canvasContext.lineTo(15,5);
						canvasContext.lineTo(15,13);
						canvasContext.lineTo(0,13);
						canvasContext.lineTo(0,7);
						canvasContext.lineTo(-5,7);
						canvasContext.lineTo(-5,13);
						canvasContext.lineTo(-30,13);
						canvasContext.lineTo(-30,5);
						canvasContext.lineTo(-17,5);
						canvasContext.lineTo(-17,0);
						canvasContext.lineTo(-17,-5);
						canvasContext.lineTo(-30,-5);
						canvasContext.lineTo(-30,-13);
						canvasContext.lineTo(-5,-13);
						canvasContext.lineTo(-5,-7);
						canvasContext.lineTo(0,-7);
						canvasContext.lineTo(0,-13);
						canvasContext.lineTo(15,-13);
						canvasContext.lineTo(15,-5);
						canvasContext.lineTo(10,-5);
					}
					else if(inArray(Type.BulletType,ShotType.HEAL)) /* The Heal Tank! */
					{
						// Healing Tank
						// Body
						canvasContext.rect(-14, -8, 18, 16); // back
						canvasContext.fill();
						canvasContext.rect(-14, -8, 28, 16); // front/entire body
						canvasContext.stroke();
						canvasContext.fill();

						canvasContext.beginPath();
						canvasContext.moveTo(4, -3); // Hood!
						canvasContext.lineTo(14, -4);
						canvasContext.moveTo(4, 3);
						canvasContext.lineTo(14, 4);
						canvasContext.stroke();

						// The PLUS!
						canvasContext.beginPath();
						canvasContext.strokeStyle = "rgb(255,255,255)";
						canvasContext.lineWidth = 4;
						canvasContext.moveTo(-5,7);
						canvasContext.lineTo(-5,-7);
						canvasContext.moveTo(-12,0);
						canvasContext.lineTo(2,0);
						canvasContext.stroke();
					}
					else if(inArray(Type.BulletType,ShotType.SHELL)) /*Artillery*/
					{
						canvasContext.beginPath();
						canvasContext.rect(-9, -8, 28, 16);
					}
					else
					{
						canvasContext.beginPath();
						canvasContext.rect (-14, -8, 28, 16);
						canvasContext.lineWidth = 1;
					}

					canvasContext.closePath();
					canvasContext.fill();
					canvasContext.stroke();
					canvasContext.restore();
				}

				//Turret:
				canvasContext.save();
				canvasContext.translate(X, Y);
				canvasContext.rotate(TurretAngle);
				canvasContext.strokeStyle = Team.getColor().getColorString();
				canvasContext.fillStyle = Team.getColor().getColorString();

				if(Type.Special)
				{
					// Turret
					canvasContext.beginPath();
					canvasContext.arc(-5, 0, 7,Math.PI / 2,Math.PI / -2,false);
					canvasContext.lineTo(-5,7);
					canvasContext.lineTo(5,4);
					canvasContext.lineTo(5,-4);
					canvasContext.lineTo(-5,-7);
					canvasContext.stroke();
					canvasContext.fill();

					// Cannons
					canvasContext.beginPath();
					canvasContext.moveTo(0,2);
					canvasContext.lineTo(20,2);
					canvasContext.moveTo(0,-2);
					canvasContext.lineTo(20,-2);
					canvasContext.lineWidth = 2;
					canvasContext.stroke();
				}
				else if(inArray(Type.BulletType,ShotType.SHELL)) /*Artillery*/
				{
					canvasContext.beginPath();
					canvasContext.rect(-5, -6, 13, 12);
					canvasContext.fill();
					canvasContext.stroke();

					canvasContext.beginPath();
					canvasContext.lineWidth = 3;
					canvasContext.moveTo(00,0);
					canvasContext.lineTo(25,0);
					canvasContext.stroke();
				}
				else
				{
					canvasContext.beginPath();
					if(Type.DoubleTurret)
					{
						canvasContext.moveTo(0, Type.TurretSeparation);
						canvasContext.lineTo(Type.BarrelLength, Type.TurretSeparation);
						canvasContext.moveTo(0, -Type.TurretSeparation);
						canvasContext.lineTo(Type.BarrelLength, -Type.TurretSeparation);
					}
					else
					{
						canvasContext.moveTo(0, 0);
						canvasContext.lineTo(Type.BarrelLength, 0);
					}
					canvasContext.stroke();
					canvasContext.beginPath();
					canvasContext.arc(0, 0, Type.TurretSize, 0, 2 * Math.PI, false);
				}

				canvasContext.fill();
				canvasContext.restore();
				this.drawDebugExtras(canvasContext);

				if(inArray(Type.BulletType,ShotType.HEAL))
					this.drawCircle(canvasContext,Type.AttackRange,.075);

				this.drawHPBar(canvasContext,X,Y);
			};
			break;
		case TankKindEnum.PLANE:
			this.draw = function(canvasContext)
			{
				canvasContext.save();
				canvasContext.translate(X, Y);
				canvasContext.rotate(BaseAngle);
				canvasContext.strokeStyle = Team.getColor().getColorString();
				canvasContext.lineWidth = 1;
				canvasContext.beginPath();

				//Default Fill Alpha
				canvasContext.fillStyle = Team.getColor().getColorStringWithAlpha(.2);

				switch(Type.BulletType[0]) // Primary weapon takes precedence
				{
					case ShotType.BOMB:
						// B-2 Bomber
						// Inspired by: http://en.wikipedia.org/wiki/File:NORTHROP_B-2.png

						// BODY!
						canvasContext.moveTo(10, 0);
						canvasContext.lineTo(-20, 40);
						canvasContext.lineTo(-27, 30);
						canvasContext.lineTo(-17, 15);
						canvasContext.lineTo(-27, 0);
						canvasContext.lineTo(-17, -15);
						canvasContext.lineTo(-27, -30);
						canvasContext.lineTo(-20, -40);
						break;
					case ShotType.MISSLE:
						// F-16 Fighter
						canvasContext.moveTo(10,0);
						canvasContext.lineTo(-5,2);
						canvasContext.lineTo(-10,10);
						canvasContext.lineTo(-12,10);
						canvasContext.lineTo(-12,2);
						canvasContext.lineTo(-17,2);
						canvasContext.lineTo(-20,5);
						canvasContext.lineTo(-22,5);
						canvasContext.lineTo(-20,0);

						canvasContext.lineTo(-22,-5);
						canvasContext.lineTo(-20,-5);
						canvasContext.lineTo(-17,-2);
						canvasContext.lineTo(-12,-2);
						canvasContext.lineTo(-12,-10);
						canvasContext.lineTo(-10,-10);
						canvasContext.lineTo(-5,-2);
						canvasContext.closePath();

						canvasContext.moveTo(-8,-7);
						canvasContext.lineTo(-3,-7);
						canvasContext.moveTo(-8,7);
						canvasContext.lineTo(-3,7);
						break;

					case ShotType.NONE:
					default:
						canvasContext.moveTo(-12, 0);
						canvasContext.lineTo(12, 0);
						canvasContext.moveTo(0, 0);
						canvasContext.lineTo(-5, -8);
						canvasContext.moveTo(0, 0);
						canvasContext.lineTo(-5, 8);
						break;

				}

				canvasContext.closePath();

				canvasContext.fill();
				canvasContext.stroke();
				canvasContext.restore();
				this.drawDebugExtras(canvasContext);

				this.drawHPBar(canvasContext,X,Y);
			}
			break;
	}

	this.isBase = function(){return Type.Kind == TankKindEnum.BASE;}
	this.isSpecial = function (){ return Type.Special; }
	this.isPlane = function() {return Type.Kind == TankKindEnum.PLANE;};
	this.isTurret = function() { return Type.Kind == TankKindEnum.TURRET; }
	this.isHealer = function(){return inArray(Type.BulletType,ShotType.HEAL);};
	this.isEvading = function() { return State === TankStateEnum.EVADE || State === TankStateEnum.STOP_AND_GUARD; }
	this.isAttacker = function(){return Type.AttackingUnit;}
	this.getKind = function() { return Type.Kind; }
	this.getType = function(){return Type;}
	this.getTeam = function() {return Team;};
	this.getTeamnum = function(){return Teamnum;}
    this.getDistanceSquaredFromPoint = function(x, y) {
        var dx = x - X,
            dy = y - Y,
            w2 = WIDTH * 0.5,
            h2 = HEIGHT * 0.5;

        if (dx < -w2)
            x += WIDTH;
        if (dx > w2)
            x -= WIDTH;
        if (dy < -h2)
            y += HEIGHT;
        if (dy > h2)
            y -= HEIGHT;

        return (X - x) * (X - x) + (Y - y) * (Y - y);
    };
    this.getAngleFromPoint = function(x, y) {
        return getAngleFromPoint(x, y, X, Y);
    }
	this.getRadiusSquared = function() {return Type.Radius * Type.Radius;};
	this.getTurnSpeed = function() { return TurnSpeed; };
	this.getX = function() {return X;}
	this.getY = function() {return Y;}
	this.getMoveSpeed = function() {return Type.MoveSpeed; }
	this.getBaseAngle = function(){return BaseAngle; }
	this.setX = function(x){X = x; return X;};
	this.setY = function(y){Y = y; return Y;};
	this.kill = function(){die();}

	this.getDx = function()
	{
		if(State === TankStateEnum.MOVE || State === TankStateEnum.TARGET_AQUIRED || State === TankStateEnum.CRASH_AND_BURN) {
			if(Math.abs(TargetBaseAngle - BaseAngle) < MAX_MOVE_ANGLE)
				return MoveSpeed * Math.cos(BaseAngle);
			else
				return 0;
		} else {
			return 0;
		}
	}

	this.getDy = function()
	{
		if(State === TankStateEnum.MOVE || State === TankStateEnum.TARGET_AQUIRED || State === TankStateEnum.CRASH_AND_BURN) {
			if(Math.abs(TargetBaseAngle - BaseAngle) < MAX_MOVE_ANGLE)
				return MoveSpeed * Math.sin(BaseAngle);
			else
				return 0;
		} else {
			return 0;
		}
	}

	this.startEvading = function()
	{
		if (!CanEvade) return false;
		if (this.isEvading()) return true;

		if ((new Date().getTime() - LastEvadeSwitchDate.getTime()) / 1000 > EVADE_SWITCH_COOLDOWN_SECS)
		{
			var hitpercent = (HitPoints / Type.HitPoints);
			if (hitpercent > .15 && hitpercent <= rnd(.15,.45))
			{
				LastEvadeSwitchDate = new Date(); /* regardless of decision, this is what will stick for the cooldown */

				if (Math.random() <= EvadeProb)
				{
					State = TankStateEnum.EVADE;
					return true;
				}
			}
		}
		return false;
	}
	this.stopEvading = function()
	{
		/*tanks go into STOP while healing, so check for that as well */
		if (!this.isEvading()) return true;
		if ((new Date().getTime() - LastEvadeSwitchDate.getTime()) / 1000 > EVADE_SWITCH_COOLDOWN_SECS)
		{
			LastEvadeSwitchDate = new Date();

			if ((HitPoints / Type.HitPoints) > rnd(.37,1)) /* less than start evading for random chance of stop evade */
			{
				TargetEvasive = null;
				State = TankStateEnum.IDLE;
				return true;
			}
		}
		return false;
	}

	this.attackingTarget = function(target){return Type.AttackingUnit ? target === Target : false;}

	this.takeDamage = function(damage, shooter)
	{
		HitPoints -= damage;

		Team.addTaken(damage);

		if(HitPoints <= 0)
		{
			if(Type.Kind === TankKindEnum.PLANE)
				State = TankStateEnum.CRASH_AND_BURN;
			else
				die();
		}
		if(shooter !== null && shooter.getTeam() !== Team)
		{
			shooter.getTeam().addGiven(damage);

			if(HitPoints > 0 && Tanks.contains(shooter)) //Make sure the shooter of this bullet isn't already dead!
			{
				if (this.isHealer() || Type.Kind == TankKindEnum.BUILDER)
				{
					/* not really sure how to handle this; should the healer instantly reverse directions? if so, it shouldn't go here... */

					if(Target == null || (State !== TankStateEnum.TARGET_AQUIRED && State !== TankStateEnum.TARGET_IN_RANGE)) /* currently healing someone */
						State = TankStateEnum.MOVE; /* RUN! RANDOMLY! */
				}
				else if(Type.AntiAircraft || !shooter.isPlane())
				{
					if(!this.isEvading())
					{
						if(Target != null && State == TankStateEnum.TARGET_AQUIRED || State == TankStateEnum.TARGET_IN_RANGE) {
							/* Don't change targets if the current target is attacking this tank */

							if(!Target.attackingTarget(This) &&
								shooter.getDistanceSquaredFromPoint(X, Y) < Target.getDistanceSquaredFromPoint(X, Y)) {
								Target = shooter;
								State = TankStateEnum.TARGET_AQUIRED;
							}
						} else {
							Target = shooter;
							State = TankStateEnum.TARGET_AQUIRED;
						}
					}
				}
			}
			callFriendlies(shooter);
		}
	};

	this.moveTurretAndAttack = function()
	{
		if(Target != null)
		{
			setTargetTurretAngle(Target);
			turnTurret();
			var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);
			if (TargetDistanceSquared <= Type.AttackDistance * Type.AttackDistance) {
				/* Fire at the target while running away! */
				this.startEvading();
				attack();
			}
		}
	}

	this.callToAttack = function (target)
	{
		/* we already have a target that is closer, can't help right now */
		if(Target != null && Target.getDistanceSquaredFromPoint(X, Y) < target.getDistanceSquaredFromPoint(X, Y)) return;
		/* we can't attack or we can't attack that plane */
		if(!Type.AttackingUnit) return;
		if(!Type.AntiAircraft && target.isPlane()) return;
		if(this.isTurret()) return; /* wait until Target is in range */
		if (State === TankStateEnum.CRASH_AND_BURN) return; /* plane is kamakaziing */

		if(State !== TankStateEnum.TARGET_AQUIRED && State !== TankStateEnum.TARGET_IN_RANGE) {
			Target = target;

			if(!this.isEvading())
				State = TankStateEnum.TARGET_AQUIRED;
		}
	}

	this.drawHPBar = function (ctx, X,Y)
	{
		if (this.isEvading())
		{
			ctx.save();

			ctx.fillStyle = 'rgb(219, 37, 13)'; /* bright red */
			ctx.font = "15pt Arial";
			ctx.fillText("+",X-10, Y-19 /* above health bar */);

			ctx.restore();
		}
		// Hide the HP bar until units health drops.
		if(HitPoints < Type.HitPoints && HitPoints != 0)
		{
			ctx.save();
			ctx.beginPath();
			ctx.rect(X-10,Y-20,25*(HitPoints/Type.HitPoints),3);
			if (HitPoints < 0)
				ctx.fillStyle = 'rgb(219, 37, 13)'; /* bright red */
			else
				ctx.fillStyle = 'rgb(0, 130, 0)'; /* green */
			ctx.fill();

			if (HitPoints > 0) /* make red stand out! */
			{
				ctx.lineWidth = 1;
				ctx.strokeStyle = 'rgb(0, 0, 0)';
				ctx.stroke();
			}
			ctx.closePath();
			ctx.restore();
		}
	}

	var healing = false;
	this.recoverHitPoints = function(health, healer)
	{
		if(health == null)
			health = Math.floor(Type.HitPoints * .1); // 10% of this unit's HP

		if(healer !== null && healer.getTeam() == Team)
		{
			if(HitPoints == Type.HitPoints) return;
			//console.log(HitPoints+"/"+Type.HitPoints+" +["+health+"] = "+(HitPoints + health));

			if(!healing)
			{
				healing=true;
				HitPoints += health;
				healing = false;
			}

			if(HitPoints > Type.HitPoints)
				HitPoints = Type.HitPoints; // Can't heal over the max HP of the unit.
		}
	};

	this.drawCircle = function(canvasContext, radius, alpha)
	{
		var pointArray = calcPointsCirc(X, Y, radius,1);
		canvasContext.beginPath();
		canvasContext.arc(X, Y, radius, 0, 2 * Math.PI, false)
		canvasContext.fillStyle = Team.getColor().getColorStringWithAlpha(alpha);
		canvasContext.fill();
		canvasContext.closePath();
	}

	this.drawDebugExtras = function(canvasContext)
	{
		// Draw ATTACK RANGE Circle
		if(DRAW_RANGE_CIRCLE)
		{
			var pointArray = calcPointsCirc(X, Y, Type.AttackDistance,1);
			canvasContext.beginPath();
			canvasContext.arc(X, Y, Type.AttackDistance, 0, 2 * Math.PI, false)
			canvasContext.strokeStyle = Team.getColor().getColorStringWithAlpha(.2);
			canvasContext.stroke();
			canvasContext.closePath();
		}

		if(DRAW_DISTANCE_CIRCLE)
		{
			var pointArray = calcPointsCirc(X, Y, Type.SightDistance,1);
			canvasContext.beginPath();
			canvasContext.arc(X, Y, Type.SightDistance, 0, 2 * Math.PI, false)
			canvasContext.strokeStyle = Team.getColor().getColorStringWithAlpha(.2);
			canvasContext.stroke();
			canvasContext.closePath();
		}

		if(DRAW_TARGET_LINE && Target != null && Tanks.contains(Target))
		{
			canvasContext.beginPath();

			canvasContext.moveTo(X, Y);

			if (WORLD_WRAP)
			{
				var x = Target.getX(), y = Target.getY(),
				    dx = x - X,
		            dy = y - Y,
		            w2 = WIDTH * 0.5,
		            h2 = HEIGHT * 0.5,
		            x2 = x, y2 = y, m, b, x3 = x, y3 = y,
                    wrap = false;

		        if (dx < -w2) {
                    wrap = true;
                    x2 = x + WIDTH;
                }
		        if (dx > w2) {
                    wrap = true;
                    x2 = x - WIDTH;
                }
		        if (dy < -h2) {
                    wrap = true;
                    y2 = y + HEIGHT;
                }
		        if (dy > h2) {
                    wrap = true;
                    y2 = y - HEIGHT;
                }

                canvasContext.lineTo(x2, y2);

                if (wrap) {
                    m = (y2 - Y) / (x2 - X);
                    b = Y - m * X;

                    if (x2 > WIDTH) {
                        x2 = WIDTH;
                        x3 = 0;
                        y2 = m * x2 + b;
                        y3 = y2;
                    } else if (x2 < 0) {
                        x2 = 0;
                        x3 = WIDTH;
                        y2 = m * x2 + b;
                        y3 = y2;
                    }
                    if (y2 > HEIGHT) {
                        y2 = HEIGHT;
                        y3 = 0;
                        x2 = (y2 - b) / m;
                        x3 = x2;
                    } else if (y2 < 0) {
                        y2 = 0;
                        y3 = HEIGHT;
                        x2 = (y2 - b) / m;
                        x3 = x2;
                    }

                    /*
                    if (wrap) {
                        alert(WIDTH + " x " + HEIGHT + "\n" +
                              "(" + X + "," + Y + ")" + "\n" +
                              "(" + x + "," + y + ")" + "\n" +
                              "(" + x2 + "," + y2 + ")" + "\n" +
                              "(" + x3 + "," + y3 + ")" + "\n" +
                              m + " x + " + b);
                    }
                    */

                    canvasContext.moveTo(x3, y3);
                    canvasContext.lineTo(x, y);
                }
			}
			else
				canvasContext.lineTo(Target.getX(), Target.getY());

			canvasContext.strokeStyle = Team.getColor().getColorStringWithAlpha(.5);
			canvasContext.stroke();
			canvasContext.closePath();
		}

		// Draw FOV
		if(DRAW_FOV)
		{
			var useThisAngle = TurretAngle;
			var useAttackAngle = Type.TurretAttackAngle;
			if(!Type.AttackingUnit)
			{
				useThisAngle = BaseAngle;
				useAttackAngle = 45;
			}
			else if(this.isPlane() && Target == null)
				useThisAngle = BaseAngle;

			canvasContext.beginPath();
			canvasContext.strokeStyle = Team.getColor().getColorStringWithAlpha(.5);
			canvasContext.moveTo(X,Y);
			canvasContext.arc(X,Y,Type.SightDistance,useThisAngle - (Math.PI / 180) * useAttackAngle,useThisAngle + (Math.PI / 180) * useAttackAngle,false);
			canvasContext.closePath();
			//canvasContext.fillStyle = Team.getColor().getColorStringWithAlpha(.05);
			//canvasContext.fill();
			canvasContext.stroke();

		}

	}

	//Private:
	function heal(radius){ AreaHeal(X,Y, radius * radius, This); };

	function SetupMyGuns()
	{

		var _ShotType = ShotType;

		// Default Setup for Guns and Adjustments
		var dGuns = {
			damage : 0,
			timetolive : 0,
			speed : 0,
			splashDamage : false,
			attackaironly : false,
			attackgroundonly: false,
			instantkill : false,
			reloadtime : 0
		};

		// Current Guns
		var guns = Type.BulletType,
			updatedGuns = [];

		if(inArray(guns, ShotType.NONE) || inArray(guns, ShotType.HEAL))
			return;

		var i = 0;
		for(var g in guns)
		{
			var ammo = guns[g];

			if(ammo == undefined) ammo = [dGuns]; // Sucks to be you!
			ammo = array_merge(dGuns,ammo); // Ensures defaults are set AT THE BASE CLASS!

			// Need to get adjustments and apply their settings
			// Ensures defaults are set AT THE BASE CLASS of Adjustments. Not all units need to have these set, meaning they'll get the defaults.
			var adjGun = array_merge(ammo,Type.BulletAdjust[i++]);

			ammo.damage += adjGun.damage;
			ammo.speed += adjGun.speed;
			ammo.attackaironly = adjGun.attackaironly;
			updatedGuns.push(ammo);

			/* TODO: Update the rest of them, right now, most things use defaults! */

		}

		Type.Gun = updatedGuns; // Commits the updated gun to this tanks new weapon grade
	}

	function die()
	{
		var exps = Math.floor(Math.random() * 4 + 8);
		if (IS_MOBILE || getFPS < FPS_TOO_LOW) expos = 2;

		for(var i = 0; i < exps; i++) {
			Explosions.add(new Explosion(X + Math.random() * 14 - 7, Y + Math.random() * 14 - 7, i * 2, 12 + Math.random() * 10));
		}

		var debris = Math.floor(3 + Math.random() * 4);
		if (IS_MOBILE || getFPS < FPS_TOO_LOW) debris = 2;

		for(i = 0; i < debris; i++) {
			var angle = Math.random() * 2 * Math.PI;
			var speed = Math.random() * 4 + .2;
			DebrisSet.add(new Debris(X, Y, Math.cos(angle) * speed + This.getDx(), Math.sin(angle) * speed + This.getDy(), Math.random() * 10 + 20));
		}
		//console.log(Team.getScore());
		Team.setScore(Team.getScore() - 1);
		Tanks.remove(This);
	}

	function callFriendlies(target)
	{
		for(var n in Tanks) {
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
				if(Tanks[n].getTeam() == Team) {
					Tanks[n].callToAttack(target);

					/* We should ask a friendly healer to head our way, but this violates the healer's validation
					* in findTargets */
					/*if (Tanks[n].isHealer() && Tanks[n].Target == null)
					{
						Tanks[n].Target = This;
						Tanks[n].State = TankStateEnum.TARGET_AQUIRED;
					}*/
				}
			}
		}
	}

	function findTargets()
	{
		if (Target != null && !Tanks.contains(Target)) Target = null;

		if (This.isHealer())
		{
			for(var n in Tanks) {
				if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
				{
					if(Tanks[n].getTeam() === Team &&  							/* can only heal the same team */
						Tanks[n] !== This && 									/* don't heal myself*/
						!Tanks[n].isHealer() && 								/* don't heal another healer *sigh* */
						Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance)
					{
						if (Tanks[n].isPlane()) continue; 						/* can't heal a plane */
						if (Tanks[n].isBase() || Tanks[n].isTurret()) continue; /* can't heal a base/item */

						if(Target == null ||									/* don't have a target yet */
							Tanks[n].HitPoints < Target.HitPoints)	 			/* more damaged than my target */
						{
							Target = Tanks[n];

							/* don't switch state if we are running away or dieing */
							if (!This.isEvading() && State !== TankStateEnum.CRASH_AND_BURN)
								State = TankStateEnum.TARGET_AQUIRED;
						}
					}
				}
			}
			return; /* don't target an enemy with the below code */
		}

		for(var n in Tanks) {
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
			{
				if(Tanks[n].getTeam() != Team &&
					Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance)
				{
					/* choose a better target if we found one closer/more damaged */
					if (Target == null ||
						(This.isPlane() && Type.AntiAircraft && Tanks[n].isPlane()) || 	/* AA planes should attack other planes... */
						(Target.isBase() && !Tanks[n].isBase()) ||  					/* attack something else if we are targetting a base*/
						Tanks[n].HitPoints < Target.HitPoints || 						/* more damaged than my target */
						Tanks[n].isHealer() || 											/* kill their healer! * */
						Tanks[n].getDistanceSquaredFromPoint(X, Y) < Target.getDistanceSquaredFromPoint(X, Y) ||  /* closer*/
						Tanks[n].isSpecial() 											/* kill the mammoth tank! */)
					{
						if (Tanks[n].isPlane() && !Type.AntiAircraft) continue; 		/* non AA can't kill planes */

						Target = Tanks[n];

						/* don't switch state if we are running away or dieing */
						if (!This.isEvading() && State !== TankStateEnum.CRASH_AND_BURN)
							State = TankStateEnum.TARGET_AQUIRED;

						if (Target.isSpecial()) break; //ATTACK THAT SPECIAL TANK!
						else if (Type.AntiAircraft && Target.isPlane()) //AA GO KILL THAT PLANE!
							break;
					}
				}
			}
		}

		if(Target != null)
			callFriendlies(Target);
	};

	function GetNumOfType(type,team)
	{
		//console.log(type);
		var count = 0;
		for(var n in Tanks)
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
				if(Tanks[n].getTeam() == team)
					if(Tanks[n].getKind() == type.Kind)
						count++;

		return count;
	}

	function GetNumOfSpecials()
	{
		var count = 0;
		for(var n in Tanks)
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
				if(Tanks[n].getTeam() == Team)
					if(Tanks[n].getKind() == TankKindEnum.TANK && Tanks[n].isSpecial())
						count++;

		return count;
	}

	function findFriendlies()
	{
		if(Math.random() < .2) {
			for(var n in Tanks) {
				if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
					if(Tanks[n].getTeam() == Team && Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance) {
						Target = Tanks[n];
						State = TankStateEnum.TARGET_AQUIRED;
					}
				}
			}
		}
	};

	function chooseRandomDestination()
	{
		DestX = DestX + Math.random() * (MOVE_RANGE * 2 + 1) - MOVE_RANGE;
		DestY = DestY + Math.random() * (MOVE_RANGE * 2 + 1) - MOVE_RANGE;
		if(DestX > WIDTH - 10)
			DestX = WIDTH - 10;
		else if(DestX < 10)
			DestX = 10;
		if(DestY > HEIGHT - 10)
			DestY = HEIGHT - 10;
		else if(DestY < 10)
			DestY = 10;
	};

	function moveForward()
	{
		var turnspeed = TurnSpeed;

		//Find heading towards destination:

		while(TargetBaseAngle > Math.PI)
			TargetBaseAngle -=  2 * Math.PI;
		while(TargetBaseAngle < -Math.PI)
			TargetBaseAngle += 2 * Math.PI;

		//Turn towards heading:
		angleDiff = TargetBaseAngle - BaseAngle;
		if(Math.abs(angleDiff) > Math.PI) {
			if(angleDiff > 0)
				BaseAngle -= turnspeed;
			else
				BaseAngle += turnspeed;
		} else {
			if(Math.abs(angleDiff) > turnspeed) {
				if(angleDiff > 0)
					BaseAngle += turnspeed;
				else
					BaseAngle -= turnspeed;
			} else {
				BaseAngle = TargetBaseAngle;
			}
		}

		if(BaseAngle > Math.PI)
			BaseAngle -= 2 * Math.PI;
		if(BaseAngle < -Math.PI)
			BaseAngle += 2 * Math.PI;

		//Move along current heading:
		if(Math.abs(TargetBaseAngle - BaseAngle) < MAX_MOVE_ANGLE || Type.Kind == TankKindEnum.PLANE)
		{
			var movespeed = MoveSpeed;

			if(This.isPlane() && Target != null && Target.isPlane() && Target.getMoveSpeed() < movespeed
				&& This.getDistanceSquaredFromPoint(X,Y) < Type.MinRange * Type.MinRange &&
				Type.Kind != Target.getKind())
			{
				/* if the target is within 30* of our angle, slow down so we can attack... otherwise circle around */
				if(BaseAngle > Target.getBaseAngle() - (Math.PI / 15) && BaseAngle < Target.getBaseAngle() + (Math.PI / 15))
				{
					//console.log("going to slow down: " + BaseAngle + " : " + Target.getBaseAngle());
					movespeed = Target.getMoveSpeed();
				}
				//else
				//	console.log(BaseAngle + " : " + Target.getBaseAngle() + ", " + (Target.getBaseAngle() - (Math.PI / 15)) + " : " + (Target.getBaseAngle() + (Math.PI / 15)));
			}

			X += movespeed * Math.cos(BaseAngle);
			Y += movespeed * Math.sin(BaseAngle);

			if (WORLD_WRAP)
			{
				if (X > WIDTH) X -= WIDTH; // if you reach the right side
				else if (X < 0) X += WIDTH; // if you reach the left side

				if (Y > HEIGHT - DRAW_BANNER_HEIGHT) Y = Math.abs(Y - HEIGHT - 20); // If you reach the bottom... set you back at the top
				else if (Y - DRAW_BANNER_HEIGHT < 0) Y = Math.abs(Y + (HEIGHT - DRAW_BANNER_HEIGHT) - 20); // If you reach the top (this works)... set you back at the bottom
			}
			else
			{

				/* reverse direction if we hit the wall */
				if(X > WIDTH - MAP_MIN_LOC || X < MAP_MIN_LOC ||
					Y > HEIGHT - MAP_MIN_LOC - DRAW_BANNER_HEIGHT || Y < MAP_MIN_LOC + DRAW_BANNER_HEIGHT)
				{
					BaseAngle += Math.PI + rnd(0, Math.PI * .5); /* do a reverse with some random added in */

					if(X > WIDTH - MAP_MIN_LOC)
						X = WIDTH - MAP_MIN_LOC;
					else if(X < MAP_MIN_LOC)
						X = MAP_MIN_LOC;
					if(Y > HEIGHT - MAP_MIN_LOC - DRAW_BANNER_HEIGHT)
						Y = HEIGHT - MAP_MIN_LOC - DRAW_BANNER_HEIGHT;
					else if(Y < MAP_MIN_LOC + DRAW_BANNER_HEIGHT)
						Y = MAP_MIN_LOC + DRAW_BANNER_HEIGHT;
				}

			}
		}
	};

	function setTargetTurretAngle(target)
	{
		if(Type.BulletType == undefined) return; // Typically, if there isn't a weapon, there isn't a turret to fire from.

		if(Type.BulletType[0] == undefined) Type.BulletType = [Type.BulletType];

		var Tx = target.getX(), Ty = Target.getY();
		var ShotTime = Math.sqrt(Target.getDistanceSquaredFromPoint(X, Y)) / Type.BulletType[0].speed;
		Tx += Target.getDx() * ShotTime;
		Ty += Target.getDy() * ShotTime;
		TargetTurretAngle = getAngleFromPoint(Tx, Ty, X, Y);
	}

	function turnTurret()
	{
		var angleDiff = TargetTurretAngle - TurretAngle;
		if(Math.abs(angleDiff) > Math.PI) {
			if(angleDiff > 0)
				TurretAngle -= Type.TurretTurnSpeed;
			else
				TurretAngle += Type.TurretTurnSpeed;
		} else {
			if(Math.abs(angleDiff) > Type.TurretTurnSpeed) {
				if(angleDiff > 0)
					TurretAngle += Type.TurretTurnSpeed;
				else
					TurretAngle -= Type.TurretTurnSpeed;
			} else {
				TurretAngle = TargetTurretAngle;
			}
		}
		if(TurretAngle > Math.PI)
			TurretAngle -=  2 * Math.PI;
		if(TurretAngle < -Math.PI)
			TurretAngle += 2 * Math.PI;
	};

	function attack()
	{
		var gun, gunAmmo;
		if(Cooldown <= 0) // This unit is ready to fire!
		{
			for(b=0;b<=Type.BulletType.length;b++) // Loop thru all weapons
			{
				gun = Type.BulletType[b]; // Get this gun type

				if(gun == undefined) continue;

				if(gun == ShotType.HEAL) continue; // Not likely, but if unit can heal and fire, may want to fire other gun

				gunAmmo = Type.Gun[b]; // This lines up the BulletType wih the updated Gun

				// if(gunAmmo.reloadtime > 0)
				// {
				// 	Type.Gun[b].reloadtime--;
				// 	continue;
				// }

				if(Type.Kind == TankKindEnum.TURRET && Type.AntiAircraft)
				{
					// console.log("==================================");
					// console.log("My Turret angle: "+ TurretAngle);
					// console.log("TargetTurretAngle: "+ TargetTurretAngle);
					// console.log("On point? " + (TurretAngle == TargetTurretAngle));
					// console.log("TargetTurretAngle(Calculated)" + (TargetTurretAngle - (Math.PI/180) * Type.TurretAttackAngle));
					// console.log("TargetTurretAngle(Calculated)" + (TargetTurretAngle + (Math.PI/180) * Type.TurretAttackAngle));
					// console.log("==================================");
					console.log(gunAmmo.attackaironly);
					console.log(Target.isPlane());
					console.log(Type.AntiAircraft);
				}


				if(!gunAmmo.attackaironly && Target.isPlane() && !Type.AntiAircraft) continue; // If your weapon ground only, and you are targeting a plane and you're not AA, skip
				if(gunAmmo.attackaironly && !Target.isPlane()) continue; // If your weapon is AA only, and you're targeting a ground unit, skip

				if(TurretAngle == TargetTurretAngle
					|| TurretAngle > (TargetTurretAngle - (Math.PI/180) * Type.TurretAttackAngle)
					&& TurretAngle < (TargetTurretAngle + (Math.PI/180) * Type.TurretAttackAngle))
				{
					var speed = gunAmmo.speed; // Get the gun speed

					// Special occasion for SHELL like gun
					if(gun == ShotType.SHELL)
					 	speed = (0.95 + Math.random() * .1) * (Math.sqrt(Target.getDistanceSquaredFromPoint(X, Y)) - Type.BarrelLength) / gunAmmo.timetolive;

					if(Type.DoubleTurret) {
						//TurretSeparation
						Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength + Math.cos(TurretAngle + Math.PI / 4) * Type.TurretSeparation, Y + Math.sin(TurretAngle) * Type.BarrelLength + Math.sin(TurretAngle + Math.PI / 4) * Type.TurretSeparation, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), gunAmmo.timetolive, Team, gunAmmo.damage, This, gun, Target, Type.AntiAircraft));
						Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength + Math.cos(TurretAngle - Math.PI / 4) * Type.TurretSeparation, Y + Math.sin(TurretAngle) * Type.BarrelLength + Math.sin(TurretAngle - Math.PI / 4) * Type.TurretSeparation, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), gunAmmo.timetolive, Team, gunAmmo.damage, This, gun, Target, Type.AntiAircraft));

					} else {
						Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength, Y + Math.sin(TurretAngle) * Type.BarrelLength, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), gunAmmo.timetolive, Team, gunAmmo.damage, This, gun, Target, Type.AntiAircraft));
					}
					Cooldown = Type.CooldownTime;
					//Type.Gun[b].reloadtime = 100;
				}
			}
		}
	};

	Team.setScore(Team.getScore() + 1);
	Team.addScore(1);
	Team.addTicket();
}

//----- Bullet class -----
	function Bullet (x, y, dx, dy, time, team, damage, shooter, type, target, airAttack)
	{
		var X = x, Y = y, Dx = dx, Dy = dy, Time = time, Team = team, Damage = damage, Shooter = shooter, Type = type, Target = target;

		var AirAttack = airAttack;
		var LastX = x, LastY = y;
		var This = this;
		var LastAngle;

		Damage = Damage * DAMAGE_MULTIPLIER;
		Damage = Math.floor(Damage); // Ensure we are only using whole numbers

		if(Damage <= 0)
			Damage = 1; // So the weak peeps can still attack

		if(Target != null && Tanks.contains(Target) && Type === ShotType.MISSLE)
			LastAngle = getAngleFromPoint(Target.getX(), Target.getY(), X, Y);

		//Privileged:
		this.move = function() {

			X += Dx;
			Y += Dy;
			Time--;

			if (WORLD_WRAP)
			{
				if (X > WIDTH) X -= WIDTH; // if you reach the right side
				else if (X < 0) X += WIDTH; // if you reach the left side

				if (Y > HEIGHT - DRAW_BANNER_HEIGHT) Y = Math.abs(Y - HEIGHT); // If you reach the bottom... set you back at the top
				else if (Y - DRAW_BANNER_HEIGHT < 0) Y = Math.abs(Y + (HEIGHT - DRAW_BANNER_HEIGHT)); // If you reach the top (this works)... set you back at the bottom
			}

			if(Type === ShotType.MISSLE) {
				Smokes.add(new Smoke(X, Y, 2, 3, 20, 150));
				Smokes.add(new Smoke((X + LastX) / 2, (Y + LastY) / 2, 1, 3, 20, 150));

				LastX = X;
				LastY = Y;

				if(Target === null || !Tanks.contains(Target)) {
					var BestDotProduct = -1;
					for(var n in Tanks) {
						if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]) &&
							Tanks[n].getTeam() != Team && (AirAttack || !Tanks[n].isPlane())) {

							var DistanceMagSquared = Tanks[n].getDistanceSquaredFromPoint(X, Y);

							if(DistanceMagSquared < 200 * 200) {
								var SpeedMag = Math.sqrt(Dx * Dx + Dy * Dy);
								var DistanceMag = Math.sqrt(DistanceMagSquared);
								var DotProduct = (Dx * (Tanks[n].getX() - X) + Dy * (Tanks[n].getY() - Y)) / (SpeedMag * DistanceMag);
								if(DotProduct > BestDotProduct) {
									Target = Tanks[n];
                                    LastAngle = this.getAngleFromPoint(Target.getX(), Target.getY());
									BestDotProduct = DotProduct;
								}
							}
						}
					}
				}

				if(Target != null && Tanks.contains(Target)) {
					var speed = MISSLE_ACCELERATION + Math.sqrt(Dx * Dx + Dy * Dy);
					var angle = Math.atan2(Dy, Dx);
					var angleToTarget = getAngleFromPoint(Target.getX(), Target.getY(), X, Y);
					var RotateAngle = MISSLE_ROTATION * (angleToTarget - LastAngle);
					angle += RotateAngle > 0 ? Math.min(RotateAngle, MAX_MISSLE_ROTATION)
											 : Math.max(RotateAngle, -MAX_MISSLE_ROTATION);
					LastAngle = angleToTarget;

					Dx = speed * Math.cos(angle);
					Dy = speed * Math.sin(angle);
				}
			}

			if(Time <= 0)
				explode();

			if(Type != ShotType.SHELL && Type != ShotType.BOMB)
			{
				for(var n in Tanks) {
					if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
						if(Tanks[n].getTeam() != Team && (AirAttack || !Tanks[n].isPlane()) &&
							Tanks[n].getDistanceSquaredFromPoint(X, Y) < Math.max(Dx * Dx + Dy * Dy, Tanks[n].getRadiusSquared())) {
								Tanks[n].takeDamage(Damage, Shooter);
								explode();
						}
					}
				}
			}
		};
		this.getAngleFromPoint = function(x, y) {
	        return getAngleFromPoint(x, y, X, Y);
	    }

		this.draw = function(canvasContext)
		{
			canvasContext.beginPath();
			canvasContext.fillStyle = "rgb(255, 255,0)";
			canvasContext.fillRect (X, Y, 1.5, 1.5);
			canvasContext.fillStyle = "rgb(10, 10,0)";
			canvasContext.fillRect (X + 1, Y +1, 1.5, 1.5);
		};

		//Private:
		function explode()
		{
			if(Type === ShotType.SHELL) {
				AreaDamage(X, Y, Damage, SHELL_DAMAGE_RADIUS * SHELL_DAMAGE_RADIUS, Shooter);
				Explosions.add(new Explosion(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, SHELL_DAMAGE_RADIUS));
			} else if(Type === ShotType.BOMB) {
				AreaDamage(X, Y, Damage, BOMB_DAMAGE_RADIUS * BOMB_DAMAGE_RADIUS, Shooter);
				Explosions.add(new Explosion(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, BOMB_DAMAGE_RADIUS));
			} else {
				Explosions.add(new Explosion(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, 6 + Math.random() * 3));
			}

			Bullets.remove(This);

		};
	}

//----- Explosion Class -----
	function Explosion (x, y, preDisplayTime, size)
	{
		var X = x, Y = y, PreDisplayTime = preDisplayTime, TargetSize = size, Size = 0, GrowMode = true;

		if (IS_MOBILE || getFPS() < FPS_TOO_LOW) { TargetSize = TargetSize / 5; PreDisplayTime  = PreDisplayTime / 5; }

		this.update = function () {
			if(PreDisplayTime > 0) {
				PreDisplayTime--;
			}else if(GrowMode) {
				if(Size < TargetSize)
					Size++;
				else
					GrowMode = false;
			}else if(Size > 0) {
				Size--;
			}else{
				Explosions.remove(this);
			}
		};
		this.draw = function (canvasContext) {
			if(PreDisplayTime <= 0) {

				if(Size > 0)
				{
					var grad = canvasContext.createRadialGradient(X, Y, 0, X, Y, Size / 2);
					grad.addColorStop(0, "rgb(255, 255, 0)");
					grad.addColorStop(1, "rgb(255, 0, 0)");

					canvasContext.beginPath();
					canvasContext.fillStyle = grad;
					canvasContext.arc(X, Y, Size / 2, 0, 2 * Math.PI, false);
					canvasContext.fill();
				}

			}
		};

	}

//----- Smoke class -----
	function Smoke (x, y, startSize, endSize, time, redness)
	{
		var X = x, Y = y, StartSize = startSize, EndSize = endSize, TotalTime = time, Redness = redness;

		if (IS_MOBILE || getFPS() < FPS_TOO_LOW) TotalTime = TotalTime / 5;

		var This = this;
		var Time = 0;
		this.update = function () {
			if(Time < TotalTime)
				Time++;
			else
				Smokes.remove(This);
		}

		this.draw = function (canvasContext) {
			if (IS_MOBILE && getFPS() < FPS_TOO_LOW) return; /* don't show smoke, we are going too slow */

			var TimeRatio = Time / TotalTime;
			var color = Math.floor(25 + 75 * TimeRatio);
			var red = Math.floor(Redness * (1 - 4 * TimeRatio));
			if(red < 0)
				red = 0;
			if(red + color > 255)
				red = 255 - color;
			canvasContext.beginPath();
			if (IS_MOBILE)
				canvasContext.fillStyle = "rgb(" + (red + color) + "," + color + "," + color + ")";
			else
				canvasContext.fillStyle = "rgba(" + (red + color) + "," + color + "," + color + "," + (1 - TimeRatio) + ")";
			canvasContext.arc(X, Y, StartSize + (EndSize - StartSize) * Time / TotalTime, 0, 2 * Math.PI, false);
			canvasContext.fill();
		}
	}

//----- Debris class -----
	function Debris (x, y, dx, dy, time, redness)
	{
		var X = x, Y = y, Dx = dx, Dy = dy, Time = time, TotalTime = time;

		if (IS_MOBILE || getFPS() < FPS_TOO_LOW) TotalTime = TotalTime / 5;

		var This = this;
		this.update = function () {
			if(Time-- > 0) {
				X += Dx;
				Y += Dy;

				if (WORLD_WRAP)
				{
					if (X > WIDTH) X -= WIDTH; // if you reach the right side
					else if (X < 0) X += WIDTH; // if you reach the left side

					if (Y > HEIGHT - DRAW_BANNER_HEIGHT) Y = Math.abs(Y - HEIGHT); // If you reach the bottom... set you back at the top
					else if (Y - DRAW_BANNER_HEIGHT < 0) Y = Math.abs(Y + (HEIGHT - DRAW_BANNER_HEIGHT) - 20); // If you reach the top (this works)... set you back at the bottom
				}

				Smokes.add(new Smoke(X, Y, 1, 7, 15, 150 * (Time / TotalTime)));
			} else {
				DebrisSet.remove(This);
			}
		}
	}

//----- Team class -----
	function Team (color, name)
	{
		var Color = color,
			Name = name,
			Score = 0,
			TotalScore = 0,
			Taken = 0,
			Given = 0,
			UsedTickets = 0, // Used in Hard Mode
			LastTargetFound = new Date();

		this.getColor = function() {return Color;}
		this.setColor = function(c) { Color = c; }
		this.getName = function() {return Name;}
		this.getScore = function() {return Score;}
		this.getTotalScore = function(){return TotalScore;}
		this.setScore = function(score) {Score = score;}
		this.getTaken = function() {return Taken;}
		this.getGiven = function() {return Given;}
		this.getUsedTickets = function(){return UsedTickets;}
		this.getLastTargetFoundDate = function(){return LastTargetFound;}
		this.resetLastTargetFoundDate = function(){LastTargetFound = new Date(); return LastTargetFound;}

		this.addTaken = function(d)
		{
			Taken = Taken + d;
			return Taken;
		}
		this.addGiven = function(d)
		{
			Given = Given + d;
			return Given;
		}
		this.addScore = function(d)
		{
			TotalScore = TotalScore + d;
			return TotalScore;
		}
		this.addTicket = function()
		{
			UsedTickets++;
			return UsedTickets;
		}
		this.reset = function()
		{
			Score = 0;
			TotalScore = 0;
			Taken = 0;
			Given = 0;
			UsedTickets = 0;
			this.resetLastTargetFoundDate();
		}
	}

//----- Color class -----
	function Color (r, g, b)
	{
		this.R = r;
		this.G = g;
		this.B = b;
		var This = this;

		this.getColorString = function()
		{
			return "rgb(" + This.R + "," + This.G + "," + This.B + ")";
		};

		this.getColorStringWithAlpha = function(alpha)
		{
			/*if (IS_MOBILE)
				return "rgb(" + This.R + "," + This.G + "," + This.B + ")";*/

			return "rgba(" + This.R + "," + This.G + "," + This.B + ", " + alpha + ")";
		}

	}

///////////////
// Functions //
///////////////

	function AreaDamage(X, Y, Damage, RadiusSquared, Shooter)
	{
		for(var n in Tanks) {
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
				if(Tanks[n].getDistanceSquaredFromPoint(X, Y) < RadiusSquared &&  !Tanks[n].isPlane()) {
					Tanks[n].takeDamage(Damage, Shooter);
				}
			}
		}
	}

	function AreaHeal(X, Y, RadiusSquared, Healer)
	{
		for(var n in Tanks)
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
				if(Tanks[n] !== Healer && Tanks[n].getDistanceSquaredFromPoint(X, Y) < RadiusSquared)
					Tanks[n].recoverHitPoints(null,Healer);
	}

	var TeamWonByScore = false;
	// This is what makes it all happen
	function animate()
	{
		ANIMATION_ID = requestAnimationFrame(animate);
		draw();
	}

	function pauseAnimation()
	{
		if (ANIMATION_ID) cancelAnimationFrame(ANIMATION_ID);
	}

	function draw()
	{
		var TankTeam = null;
		var AllOneTeam = true;

		clearArea(ctx, new Color(terrainColors[tcIndex][0],terrainColors[tcIndex][1],terrainColors[tcIndex][2]));

		for(var n in Teams)
			if(Teams[n].getGiven() >= SCORE_TO_WIN)
			{
				TeamWonByScore = true;
				break;
			}

		for (var n in Tanks) {
			if (Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
				if(TankTeam == null)
					TankTeam = Tanks[n].getTeam();
				else if(Tanks[n].getTeam() != TankTeam)
					AllOneTeam = false;

				Tanks[n].draw(ctx);
				Tanks[n].doStuff();
			}
		}


		for (var n in Bullets) {
			if (Bullets.hasOwnProperty(n) && Bullets.contains(Bullets[n])) {
				Bullets[n].draw(ctx);
				Bullets[n].move();

			}
		}

		for (var n in Smokes) {
			if (Smokes.hasOwnProperty(n) && Smokes.contains(Smokes[n])) {
				Smokes[n].draw(ctx);
				Smokes[n].update();
			}
		}

		for (var n in Explosions) {
			if (Explosions.hasOwnProperty(n) && Explosions.contains(Explosions[n])) {
				Explosions[n].draw(ctx);
				Explosions[n].update();

			}
		}

		for (var n in DebrisSet) {
			 if (DebrisSet.hasOwnProperty(n) && DebrisSet.contains(DebrisSet[n])) {
				DebrisSet[n].update();
			}
		}

		if(TeamWonByScore && !RESTARTING)
		{
			RESTARTING = true;
			var r = setTimeout(function() {restart();}, 5000);
		}
		else if(AllOneTeam && !RESTARTING) {
			RESTARTING = true;
			var r = setTimeout(function() {restart();}, 5000);
		}

		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillRect (0,0,WIDTH,DRAW_BANNER_HEIGHT);
		ctx.font = "10pt Arial";

		var smallscreen = (IS_MOBILE || WIDTH < 650);
		var padding = 5, paddingY = 14;
		var aliveTeams = 0;
		for ( teamnum in Teams)
		{
			var t = Teams[teamnum];

			ctx.fillStyle = t.getColor().getColorString();

			var text = (smallscreen ? "" : t.getName() + " - ") + t.getScore() + " units, "+ t.getGiven();
			ctx.fillText(text, padding, paddingY);

			var measured = ctx.measureText(text);

			if (t.getScore() == 0) /* dead team, strike through the team's name */
			{
				ctx.save();
				var strokeY = Math.floor(DRAW_BANNER_HEIGHT / 2); /* plus any starting Y for team text*/
				ctx.beginPath();
				ctx.strokeStyle = t.getColor().getColorString();
				ctx.lineWidth = 3;
				ctx.moveTo(padding, strokeY);
				ctx.lineTo(padding + measured.width, strokeY);
				ctx.stroke();
				ctx.closePath();
				ctx.restore();
			}
			else aliveTeams++;

			padding += measured.width + 10; /* even spacing between teams */
		}
		TEAMS_ALIVE = aliveTeams;


		// Display What Round it is
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillRect (0,HEIGHT-DRAW_BANNER_HEIGHT,WIDTH,DRAW_BANNER_HEIGHT);
		ctx.fillStyle = "rgb(255,255,255)";

		var rSecs = (+new Date - roundStartTime) / 1000,
			rMins = Math.floor(rSecs / 60);
		rSecs = Math.floor(rSecs % 60);

		padding = 5;
		var roundText = "Round: " + ROUND + "  -  " + (rMins > 0 ? rMins + " min" + (rMins > 1 ? "s" : "" ) + ", ": "") +
			rSecs + " secs";
		ctx.fillText(roundText,padding,HEIGHT - 5);

		padding += ctx.measureText(roundText).width + 10;
		if (WINNING_TEAMS && WINNING_TEAMS.length)
		{
			ctx.save();

			var lastwinner = WINNING_TEAMS[WINNING_TEAMS.length - 1];

			var winnerText = "";
			if (IS_MOBILE) winnerText = "Won Last Round";
			else winnerText = "Won Last Round (Units: " + lastwinner.totalscore + " Given: " + lastwinner.given + ")";

			if (ctx.measureText(winnerText).width < WIDTH - padding - 65/*fps*/)
			{
				ctx.fillStyle = lastwinner.colorstring;
				ctx.fillText(winnerText, padding, HEIGHT - 5);
			}
			ctx.restore();
		}

		// FPS
		ctx.fillText(getFPS() + " fps",WIDTH-65,HEIGHT - 5);

		/* Show Debug Toggles */

		ctx.fillStyle = (!DRAW_FOV) ? "rgb(255,255,255)" : "rgb(42,225,96)";
		ctx.fillRect(WIDTH-145,0,20,DRAW_BANNER_HEIGHT);
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillText("F",WIDTH-140,14);

		ctx.fillStyle = (!DRAW_DISTANCE_CIRCLE) ? "rgb(255,255,255)" : "rgb(42,225,96)";
		ctx.fillRect(WIDTH-120,0,20,DRAW_BANNER_HEIGHT);
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillText("S",WIDTH-115,14);

		ctx.fillStyle = (!DRAW_RANGE_CIRCLE) ? "rgb(255,255,255)" : "rgb(42,225,96)";
		ctx.fillRect(WIDTH-95,0,20,DRAW_BANNER_HEIGHT);
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillText("R",WIDTH-90,14);

		ctx.fillStyle = (!DRAW_TARGET_LINE) ? "rgb(255,255,255)" : "rgb(42,225,96)";
		ctx.fillRect(WIDTH-70,0,20,DRAW_BANNER_HEIGHT);
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillText("T",WIDTH-65,14);

		// Draw button for GOD MODE
		ctx.fillStyle = (!GOD_MODE) ? "rgb(255,255,255,.8)" : "rgb(42,225,96)";
		ctx.fillRect(WIDTH-45,0,40,DRAW_BANNER_HEIGHT);
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillText("GOD",WIDTH-40,14);

		// Show a little helper for the GOD_MODE button
		if(DRAW_GOD_MODE_HELP)
		{
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillRect(WIDTH-200,DRAW_BANNER_HEIGHT,200,120);
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillText("GOD MODE is " + ((GOD_MODE) ? "Enabled!" : "Disabled..."),WIDTH-195,36)
			ctx.fillStyle = "rgb(255,255,255)";
			ctx.fillText("Ctrl+LClick = Random Base",WIDTH-195,60);
			ctx.fillText("Shift+LClick = Kill unit.",WIDTH-195,80);
			ctx.fillText("Alt+LClick = Kill lots of units",WIDTH-195,100);
			ctx.fillText("LClick = Random Unit",WIDTH-195,120);
		}

		// Setup for the FPS counter
		var thisFrameTime = (thisLoop=new Date) - lastLoop;
		frameTime+= (thisFrameTime - frameTime) / filterStrength;
		lastLoop = thisLoop;

	}

	function restart()
	{
		roundStartTime = new Date;

		tcIndex = (!RANDOM_TERRAIN) ? 5 : Math.floor(Math.random()*terrainColors.length); // Change up the next map terrain
		//console.log("BG Color: " + terrainColors[tcIndex].toString());
		IN_SPACE=false;

		//if(terrainColors[tcIndex].toString() == '0,0,0')
			//IN_SPACE=true; /* Not Ready yet! */

		TallyAndSetResults(Teams);
		countTotalProbability();
		Tanks.clear();
		Bullets.clear();
		Explosions.clear();
		Smokes.clear();

		/* put opposite corners in this list so bases start opposite each other */
		var quadrants =
			[
				[0, Math.floor(WIDTH / 2), DRAW_BANNER_HEIGHT, Math.floor(HEIGHT / 2)], /* left top */
				[Math.floor(WIDTH / 2), WIDTH, Math.floor(HEIGHT / 2), HEIGHT - DRAW_BANNER_HEIGHT], /* right bottom */
				[Math.floor(WIDTH / 2), WIDTH, DRAW_BANNER_HEIGHT, Math.floor(HEIGHT / 2)], /* right top */
				[0, Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2), HEIGHT - DRAW_BANNER_HEIGHT] /* left bottom */
			];

		var currcolor = rndInt(0,TeamColors.length-1); /* gotta set here, not after i in for loop... wtf JS ? */
		for(var i = 0; i < Teams.length; i++, currcolor= (currcolor +1) % TeamColors.length) {
			Teams[i].reset();
			Teams[i].setColor(TeamColors[currcolor]); /* don't use same colors! */

			//MIN_SEPERATION_OF_STARTING_BASES
			var TooClose = true;
			var attempts = 0;
			while(TooClose && attempts++ < 100) {
				TooClose = false;

				if (WORLD_WRAP) /* choose inside the map */
				{
					x = rnd(BASE_HEAL_RADIUS, WIDTH - BASE_HEAL_RADIUS);
					y = rnd(BASE_HEAL_RADIUS, HEIGHT - BASE_HEAL_RADIUS - (DRAW_BANNER_HEIGHT * 2));
				}
				else /* try to get further away */
				{
					var quad = quadrants[i % quadrants.length];
					x = rnd(quad[0], quad[1]);
					y = rnd(quad[2], quad[3]);
				}

				//console.log(x +", " + y);


				if (x < BASE_HEAL_RADIUS) x += BASE_HEAL_RADIUS;
				else if (x > WIDTH - BASE_HEAL_RADIUS) x -= BASE_HEAL_RADIUS;

				if (y < BASE_HEAL_RADIUS + DRAW_BANNER_HEIGHT) y += BASE_HEAL_RADIUS + DRAW_BANNER_HEIGHT;
				else if (y > HEIGHT - BASE_HEAL_RADIUS - DRAW_BANNER_HEIGHT) y -= BASE_HEAL_RADIUS - DRAW_BANNER_HEIGHT;

				for (var n in Tanks) {
					if (Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
						if(Tanks[n].getDistanceSquaredFromPoint(x, y) < MIN_SEPERATION_OF_STARTING_BASES * MIN_SEPERATION_OF_STARTING_BASES)
						{
							TooClose = true;
							break;
						}
					}
				}
			}

			Tanks.add(new Tank(x, y, Teams[i], BaseType, Teams[i].getName()));
		}

		ROUND++; // New Round, increase count
		RESTARTING = false;
		TeamWonByScore = false;
	}

	function calcPointsCirc( cx,cy, rad, dashLength)
	{
		var n = rad/dashLength,
			alpha = Math.PI * 2 / n,
			pointObj = {},
			points = [],
			i = -1;

		while( i < n )
		{
			var theta = alpha * i,
				theta2 = alpha * (i+1);

			points.push({x : (Math.cos(theta) * rad) + cx, y : (Math.sin(theta) * rad) + cy, ex : (Math.cos(theta2) * rad) + cx, ey : (Math.sin(theta2) * rad) + cy});
	   		i+=2;
		}
		return points;
	}
	/**
	* Returns a random number between min and max
 	*/
	function rnd(min, max)
	{
		return Math.random() * (max - min) + min;
	}
	/**
	 * Returns a random integer between min and max
	 * Using Math.round() will give you a non-uniform distribution!
	 */
	function rndInt(minv, maxv)
	{
		if (maxv < minv) return 0;
		return +Math.floor(Math.random()*(maxv-minv+1)) + minv;
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
		var length = rnd(minlength, maxlength) - prefix.length - suffix.length;
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

		for (var i = 0; i < length; i++)
		{
			//if we have used 2 consonants, the next char must be vocal.
			if (consnum == 2)
			{
				touse = vocals;
				consnum = 0;
			}
			else touse = allchars;
			//pick a random character from the set we are goin to use.
			c = touse.charAt(rndInt(0, touse.length - 1));
			name = name + c;
			if (cons.indexOf(c) != -1) consnum++;
		}
		name = name.charAt(0).toUpperCase() + name.substring(1, name.length) + suffix;
		return name;
	}

	function countTotalProbability()
	{
		TotalProb = 0;
		for(var i = 0; i < TankTypes.length; i++)
			TotalProb += TankTypes[i].Prob;
	}

	function clearArea(canvasContext, color)
	{
		canvasContext.fillStyle = color.getColorString();
		canvasContext.fillRect (0, 0, WIDTH, HEIGHT);
	}

	function TallyAndSetResults(teamList)
	{
		var _team = teamList,
			TeamInfo = [],
			TeamScores = [],
			TeamUnits = [];

		for(var i = 0; i < _team.length; i++) {
			TeamInfo.push({
				name: _team[i].getName(),
				given: _team[i].getGiven(),
				score: _team[i].getScore(),
				totalscore: _team[i].getTotalScore(),
				colorstring: _team[i].getColor().getColorString()
			});
			TeamScores.push(_team[i].getGiven()); //Push Scores
			TeamUnits.push(_team[i].getScore()); //Push Units
		}

		var _highGiven = Math.max.apply(Math,TeamScores);
		var _highScore = Math.max.apply(Math,TeamUnits);

		if(_highScore == 0 || _highScore == undefined)
			return;

		for(var i=0;i<TeamInfo.length;i++)
		{
			if(TeamInfo[i].score == 0) continue; // If you have no score left, you lost...

			if(TeamInfo[i].given == _highGiven || TeamInfo[i].score == _highScore)
			{
				WINNING_TEAMS.push(TeamInfo[i]);
				break;
			}
		}

	}

	function getFPS(){ return (1000/frameTime).toFixed(1); }

	function getMousePos(canvas, evt)
	{
		// get canvas position
		var obj = canvas;
		var top = 0;
		var left = 0;
		while (obj && obj.tagName != 'BODY') {
			top += obj.offsetTop;
			left += obj.offsetLeft;
			obj = obj.offsetParent;
		}

		// return relative mouse position
		var mouseX = evt.clientX - left + window.pageXOffset;
		var mouseY = evt.clientY - top + window.pageYOffset;
		return {
			x: mouseX,
			y: mouseY
		};
	}

	function ClickExplodeUnit(X,Y,radius)
	{
		//console.log(X + "," + Y)
		for(var n in Tanks)
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
				if(Tanks[n].getDistanceSquaredFromPoint(X,Y) < radius * radius)
					Tanks[n].kill();
	}

	function ClickCreateUnit(X,Y, makeBase, forceTypeInt)
	{
		var _randomTeam =  Teams[rndInt(0,NUM_TEAMS-1)];
		if(_randomTeam == undefined || _randomTeam == null) return; // bad team huh...

		var angle = Math.random() * 2 * Math.PI;
		var TypeToMake;
		var rand = Math.floor(Math.random() * TotalProb);
		for(var i = 0; i < TankTypes.length; i++){
			if(rand < TankTypes[i].Prob){
				TypeToMake = TankTypes[i];
				break;
			} else {
				rand -= TankTypes[i].Prob;
			}
		}
		var _teamNum = _randomTeam.getName();

		var _NewTank = new Tank(X, Y, _randomTeam, (makeBase) ? BaseType : (forceTypeInt != undefined) ? TankTypes[forceTypeInt] : TypeToMake, _teamNum);
		//console.log("turn speed: " + _NewTank.getTurnSpeed());
		Tanks.add(_NewTank);
	}

	function inArray(array, value)
	{
		var i;
		for(i=0;i<array.length;i++){
			if(array[i] === value)
				return true;
		}
		return false;
	}


	function array_merge()
	{
		var args = Array.prototype.slice.call(arguments),argl = args.length,arg,retObj = {},k = '', argil = 0,j = 0,i = 0,ct = 0,toStr = Object.prototype.toString,	retArr = true;

		for (i = 0; i < argl; i++)
			if (toStr.call(args[i]) !== '[object Array]'){
				retArr = false;
				break;}

		if (retArr){
			retArr = [];
			for (i = 0; i < argl; i++) retArr = retArr.concat(args[i]);
			return retArr;}

		for (i = 0, ct = 0; i < argl; i++)
		{
			arg = args[i];
			if (toStr.call(arg) === '[object Array]')
				for (j = 0, argil = arg.length; j < argil; j++)	retObj[ct++] = arg[j];
			else
				for (k in arg)
					if (arg.hasOwnProperty(k))
						if (parseInt(k, 10) + '' === k)	retObj[ct++] = arg[k]; else retObj[k] = arg[k];
		}

		return retObj;
	}

	// Javascript Extensions
	Array.Max = function(array){
		return Math.max.apply(Math,array);
	};


