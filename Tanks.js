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
	NUM_TEAMS = IS_MOBILE ? 2 : 4, // This is the max amount on the playing field.
	RANDOM_COLORS = true,
	RANDOM_TERRAIN = true,
	GOD_MODE = false, // While enabled, click methods will fire
	DRAW_GOD_MODE_HELP = false,
	DEFAULT_UAV_COOLDOWN = 15,
	MAP_MIN_LOC = 20;

// Fun stuff!
var SCORE_TO_WIN = IS_MOBILE ? 1000 : 30000,
	WINNING_TEAMS = [],
	
	DAMAGE_MULTIPLIER = 1, // 1 is normal, 0 will screw up the unit! increase/decrease for desired output
	WORLD_WRAP = true, // AWESOME, when this is off the tanks will bounce on the edges... LEAVE IT ON!
	HARD_MODE = false, // Experimental!
	HARD_MODE_TICKETS = 100, // Once this runs out for each faction, no more units can be built
	HARD_MODE_DAMAGE_REDUCTION = .10, // Reduces damage output by this amount
	HARD_MODE_MAX_UNIT_REDUCTION = 2, // Max Units divided by this number
	IN_SPACE = false; // Looks best if RANDOM_TERRAIN is disabled

// Important (can be changed from above)
var MAX_UNITS_PER_FACTION_ON_MAP = (HARD_MODE) ? Math.floor((NUM_TEAMS * 10 * .5) / HARD_MODE_MAX_UNIT_REDUCTION) : Math.floor((NUM_TEAMS * (IS_MOBILE ? 5 : 10) * .5)),
	MAX_BASE_UNITS		= Math.floor((MAX_UNITS_PER_FACTION_ON_MAP * .1)), 		/* 10% can be bases */
	MAX_BASE_DEFENSES	= Math.floor((MAX_UNITS_PER_FACTION_ON_MAP * .3)), 		/* 30% can be defenses */
	MAX_SPECIAL_UNITS	= Math.floor((MAX_UNITS_PER_FACTION_ON_MAP * .1) / 2),
	MAX_SPECIAL_UNITS	= (MAX_SPECIAL_UNITS <= 0) ? 1 : MAX_SPECIAL_UNITS, 	/* I required at least one. */
	BASE_HEAL_RADIUS	= (IS_MOBILE ? 35 : 65),
	HEALTH_COOLDOWN		= 100;

// DEBUG Stuff
var DRAW_TARGET_LINE = false,
	DRAW_RANGE_CIRCLE = false;

var TankStateEnum = {
	IDLE : 0,
	MOVE : 1,
	TARGET_AQUIRED : 2,
	TARGET_IN_RANGE : 3,
	CRASH_AND_BURN : 4,
	EVASIVE_ACTION : 5, // New : Moving units can take evasive actions to retreat and heal
	STOP : 6 // New : Makes the units stop at their position, can start move again if attacked
}

var ShotTypeEnum = {
	NONE   : 0,
	BULLET : 1,
	SHELL  : 2,
	MISSLE : 3,
	BOMB   : 4
}

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
	MIN_SEPERATION_OF_STARTING_BASES = (BASE_HEAL_RADIUS * 2) + 30,
	SHELL_DAMAGE_RADIUS = 30,
	BOMB_DAMAGE_RADIUS = 20,
	MISSLE_ACCELERATION = 0.3,
	MISSLE_ROTATION = 1.5,
	MAX_MISSLE_ROTATION = .4,
	MIN_BASE_DISTANCE_SQUARE =  MIN_SEPERATION_OF_STARTING_BASES + (WIDTH / 5),
	ANIMATION_ID = null,
	DRAW_BANNER_HEIGHT = 20;

//////////
// Init //
//////////
var canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
var ctx = canvas.getContext("2d");

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

window.onresize = function(event) {

	pauseAnimation();

	WIDTHPREV = WIDTH;
	HEIGHTPREV = HEIGHT;
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	
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
window.onkeydown = function(event) {
  if(event == null) keyCode = window.event.keyCode; 
  else keyCode = event.keyCode; 

  switch (keyCode)
  {
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
  	default: break;
  }
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
	
	console.log(msX + "," + msY);
	
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
	
	if(GOD_MODE)
	{
		if(evt.shiftKey)
			ClickExplodeUnit(msX,msY,10);
		else if(evt.ctrlKey)
			ClickCreateUnit(msX,msY,true);
		else if(evt.altKey)
			ClickExplodeUnit(msX,msY,300);
		else
			ClickCreateUnit(msX,msY,false);
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
		new Color(0, 0, 0),
		new Color(0, 0, 255),
		new Color(255, 255, 255)
	];

for(i=0;i<=NUM_TEAMS-1;i++)
	Teams[i] = new Team(TeamColors[i],getName(4,7,null,null));

var TankTypes = [];
//Small Tank:
TankTypes[0] = {Kind : TankKindEnum.TANK, 
				Special : false,
				AttackingUnit :  true, 
				Prob : 120, 
				MoveSpeed : 1.4, 
				TurnSpeed : .18, 
				TurretTurnSpeed : .19, 
				Radius : 10, 
				HitPoints : 30, 
				CooldownTime :  25,
				MinRange : 10, 
				AttackDistance : 100, 
				AttackRange : 125, 
				SightDistance : 200, 
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 30, 
				BulletSpeed : 6, 
				BulletDamage : 3, 
				TurretSize : 5, 
				BarrelLength : 10,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : .25};
//Medium Tank
TankTypes[1] = {Kind : TankKindEnum.TANK, 
				Special : false,
				AttackingUnit :  true, 
				Prob : 120, 
				MoveSpeed : 1.0, 
				TurnSpeed : .13, 
				TurretTurnSpeed : .16, 
				Radius : 10, 
				HitPoints : 50, 
				CooldownTime : 35, 
				MinRange : 25, 
				AttackDistance : 115, 
				AttackRange : 140, 
				SightDistance : 200, 
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 34, 
				BulletSpeed : 6, 
				BulletDamage : 4, 
				TurretSize : 6, 
				BarrelLength : 12,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : .25};
//Large Tank
TankTypes[2] = {Kind : TankKindEnum.TANK, 
				Special : false,
				AttackingUnit : true,
				Prob : 120,
				MoveSpeed : 0.8, 
				TurnSpeed : .09, 
				TurretTurnSpeed : .14,
				Radius : 10, 
				HitPoints : 75,
				CooldownTime : 50, 
				MinRange : 25, 
				AttackDistance : 130, 
				AttackRange : 155, 
				SightDistance : 200, 
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 38, 
				BulletSpeed : 6, 
				BulletDamage : 6, 
				TurretSize : 7,
				BarrelLength : 14,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : .25};
//Artillery
TankTypes[3] = {Kind : TankKindEnum.TANK, 
				Special : false,
				AttackingUnit : true, 
				Prob : 60, 
				MoveSpeed : 0.9, 
				TurnSpeed : .07, 
				TurretTurnSpeed : 0.12, 
				Radius : 10, 
				HitPoints : 25, 
				CooldownTime : 75, 
				MinRange : 50, 
				AttackDistance : 175,
				AttackRange : 180,
				SightDistance : 180, 
				BulletType : ShotTypeEnum.SHELL,
				BulletTime :  41, 
				BulletSpeed : 4, 
				BulletDamage : 15, 
				TurretSize : 0, 
				BarrelLength :  16,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : .25};
//Double Tank
TankTypes[4] = {Kind : TankKindEnum.TANK,
				Special : false,
				AttackingUnit : true,
				Prob : 80,
				MoveSpeed : 0.7,
				TurnSpeed : .07, 
				TurretTurnSpeed : 0.12, 
				Radius : 10, 
				HitPoints : 85, 
				CooldownTime : 70,
				MinRange : 25,
				AttackDistance : 130,
				AttackRange : 155,
				SightDistance : 200,
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 42, 
				BulletSpeed : 6, 
				BulletDamage : 5,
				TurretSize : 7,
				BarrelLength : 14,
				DoubleTurret : true,
				TurretSeparation : 1.25,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : .25};

//Missle Launcher
TankTypes[5] = {Kind : TankKindEnum.TANK,
				Special : false,
				AttackingUnit : true,
				Prob : 90,
				MoveSpeed : 1.0,
				TurnSpeed : .07, 
				TurretTurnSpeed : 0.13, 
				Radius : 10, 
				HitPoints : 35, 
				CooldownTime : 70,
				MinRange : 25,
				AttackDistance : 130,
				AttackRange : 155,
				SightDistance : 200,
				BulletType : ShotTypeEnum.MISSLE,
				BulletTime : 40, 
				BulletSpeed : 6, 
				BulletDamage : 8,
				TurretSize : 0,
				BarrelLength : 5,
				DoubleTurret : true,
				TurretSeparation : 2.5,
				AntiAircraft : true,
				CanGoEvasive : true,
				EvaProb : .7
				};
//Turret
TankTypes[6] = {Kind : TankKindEnum.TURRET,
				Special : false,
				AttackingUnit : true,
				Prob : 40,
				MoveSpeed : 0,
				TurnSpeed : 0, 
				TurretTurnSpeed : 0.16, 
				Radius : 7, 
				HitPoints : 200, 
				CooldownTime : 25,
				MinRange : 10,
				AttackDistance : 150,
				AttackRange : 150,
				SightDistance : 150,
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 30, 
				BulletSpeed : 6, 
				BulletDamage : 4,
				TurretSize : 6,
				BarrelLength : 12,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : false,
				EvaProb : 0};				
//AA Turret
TankTypes[7] = {Kind : TankKindEnum.TURRET,
				Special : false,
				AttackingUnit : true,
				Prob : 70,
				MoveSpeed : 0,
				TurnSpeed : 0, 
				TurretTurnSpeed : 0.14, 
				Radius : 7, 
				HitPoints : 45, 
				CooldownTime : 7,
				MinRange : 10,
				AttackDistance : 130, //130
				AttackRange : 130, //130
				SightDistance : 130, //130
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 30, 
				BulletSpeed : 10, 
				BulletDamage : 1,
				TurretSize : 4,
				BarrelLength : 6,
				DoubleTurret : true,
				TurretSeparation : 4,
				AntiAircraft : true,
				CanGoEvasive : false,
				EvaProb : 0};				

//Builder
TankTypes[8] = {Kind : TankKindEnum.BUILDER, 
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
				BulletType : ShotTypeEnum.NONE,
				BulletTime :  0, 
				BulletSpeed : 0, 
				BulletDamage : 0, 
				TurretSize : 0, 
				BarrelLength :  0,
				DoubleTurret : false,
				CanGoEvasive : true,
				EvaProb : .8};

//Bomber
TankTypes[9] = {Kind : TankKindEnum.PLANE, 
				Special : false,
				AttackingUnit : true, 
				Prob : 40, 
				MoveSpeed : 2.5, 
				TurnSpeed : .065, 
				TurretTurnSpeed : .5, 
				Radius : 12, 
				HitPoints : 80, 
				CooldownTime : 6, 
				MinRange : 10, 
				AttackDistance : 60,
				AttackRange : 60,
				SightDistance : 250, 
				BulletType : ShotTypeEnum.BOMB,
				BulletTime :  40, 
				BulletSpeed : 1, 
				BulletDamage : 6,
				BarrelLength :  0,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : false,
				EvaProb : 0};

//Fighter
TankTypes[10] = {Kind : TankKindEnum.PLANE, 
				Special : false,
				AttackingUnit : true, 
				Prob : 40, 
				MoveSpeed : 3.5, 
				TurnSpeed : .12, 
				TurretTurnSpeed : .15, 
				Radius : 12, 
				HitPoints : 160, 
				CooldownTime : 100, 
				MinRange : 10, 
				AttackDistance : 350,
				AttackRange : 350,
				SightDistance : 500, 
				BulletType : ShotTypeEnum.MISSLE,
				BulletTime :  60, 
				BulletSpeed : 10, 
				BulletDamage : 10, 
				BarrelLength :  0,
				DoubleTurret : true,
				TurretSeparation : 4,
				AntiAircraft : true,
				CanGoEvasive : false,
				EvaProb : 0};

// Special
TankTypes[11] = {Kind : TankKindEnum.TANK,
				Special : true,
				AttackingUnit : true,
				Prob : 20, // 20
				MoveSpeed : 1.35, 
				TurnSpeed : .12, 
				TurretTurnSpeed : 0.27, 
				Radius : 10, 
				HitPoints : 200, //500 
				CooldownTime : 40,
				MinRange : 25,
				AttackDistance : 130,
				AttackRange : 155,
				SightDistance : 300,
				BulletType : ShotTypeEnum.MISSLE,
				BulletTime : 30, 
				BulletSpeed : 10, 
				BulletDamage : 8, // 20
				TurretSize : 10,
				BarrelLength : 20,
				DoubleTurret : true,
				TurretSeparation : 3.5,
				AntiAircraft : true,
				CanGoEvasive : true,
				EvaProb : .3};

// UAV (Scout)
TankTypes[12] = {Kind : TankKindEnum.PLANE, 
				Special : false,
				AttackingUnit : false, 
				Prob : 20, 
				MoveSpeed : 4.5, 
				TurnSpeed : .12, 
				TurretTurnSpeed : .15, 
				Radius : 12, 
				HitPoints : 400, // This will automatically drain
				CooldownTime : 100, 
				MinRange : 10,
				SightDistance : 600, 
				BulletType : ShotTypeEnum.NONE,
				};
				
//Base
var BaseType = {Kind : TankKindEnum.BASE, 
				Special : false,
				AttackingUnit : false, 
				Prob : 0, 
				MoveSpeed : 0, 
				TurnSpeed : 0, 
				TurretTurnSpeed : 0, 
				Radius : 10,
				HitPoints : 1000, 
				CooldownTime : 200, 
				MinRange : 0, 
				AttackDistance : 0, 
				AttackRange : 0, 
				SightDistance : 200, 
				BulletType : ShotTypeEnum.NONE,
				BulletTime : 0, 
				BulletSpeed : 0, 
				BulletDamage : 0, 
				TurretSize : 0, 
				BarrelLength :  0,
				DoubleTurret : false,
				CanGoEvasive : false,
				EvaProb : 0};


var TotalProb;
var TotalUnits;

var Tanks = new Set("tankIndex");
var Bullets = new Set("bulletIndex");
var Explosions = new Set("explosionIndex");
var Smokes = new Set("smokeIndex");
var DebrisSet = new Set("debrisIndex");

//Start:
restart();
animate();

console.log("Welcome to Tanks!");
console.log("Number of Teams Playing: " + NUM_TEAMS);
console.log("Random Map Terrain? " + RANDOM_TERRAIN.toString());
console.log("Max Units per Faction: " + MAX_UNITS_PER_FACTION_ON_MAP);
console.log("Max Bases per Faction: " + MAX_BASE_UNITS);
console.log("Max Bases defenses per Faction: " + MAX_BASE_DEFENSES);
console.log("Max Special units per Faction: " + MAX_SPECIAL_UNITS);
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
		HitPoints = Type.HitPoints,
		Cooldown = Type.Kind === TankKindEnum.BASE ? Math.random() * Type.CooldownTime : Type.CooldownTime,
		Target = null,
		TargetEvasive = null,
		Specail = false,
		BaseAngle = 0,
		TargetBaseAngle = 0,
		TurretAngle = 0,
		TargetTurretAngle = 0,
		HealCooldown = (Math.floor(Math.random()*2)+ 1) * HEALTH_COOLDOWN, // Random time the health regen will occur
		CanEvade = Type.CanGoEvasive,
		EvadeProb = Type.EvaProb,
		State = TankStateEnum.IDLE,
		This = this;
	
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
				
				if(!HARD_MODE)
				{
					if(HealCooldown > 0)
						HealCooldown--;
					else
					{
						heal();
						HealCooldown = (Math.floor(Math.random()*2)+ 1) * HEALTH_COOLDOWN;
					}
				}
				else
					if(Team.getUsedTickets() >= HARD_MODE_TICKETS)
					{
						// need to blow up the base if there are no more units to defend it!
						if(Team.getScore() <= 1)
						{
							die();
							return;
						}
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
				if(((new Date() - Team.getLastTargetFoundDate()) / 1000 > 10) && Team.setUAVCooldown(-1) <= 0)
				{
					Tanks.add(new Tank(X + 25 * Math.cos(angle), Y + 25 * Math.sin(angle), Team, TankTypes[12], teamnum));
					Team.resetUAVCooldown();
				}


				if(Team.getScore() < MAX_UNITS_PER_FACTION_ON_MAP)
				{
					//console.log(getTeamnum() + "is making a " + TypeToMake.Kind + ". There are " + _TotalOfUnit);
					
					if(TypeToMake.Kind == TankKindEnum.BUILDER)
					{ 
						var _TotalOfUnit = GetNumOfType(TypeToMake,Team);
						var _TotalBasesBuilt = GetNumOfType(BaseType,Team);
					
						if (HARD_MODE || (_TotalBasesBuilt + _TotalOfUnit) >= MAX_BASE_UNITS) return; // Maxed out Bases!					
					}
					
					if(TypeToMake.Kind == TankKindEnum.TURRET)
						if (GetNumOfType(TankTypes[6]) + GetNumOfType(TankTypes[7],Team) >= MAX_BASE_DEFENSES) return; // Maxed out defenses!			
					
					if(TypeToMake.Special && GetNumOfSpecials() >= MAX_SPECIAL_UNITS) return;
	
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
						
						Team.resetLastTargetFoundDate();

						findTargets(); /* see if there is a better target to fire on*/
											
						if(Target != null) {
							var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);
							
							if(TargetDistanceSquared <= Type.MinRange * Type.MinRange) {
								TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X) + Math.PI;
								moveForward();		
								
								this.moveTurretAndAttack();				
							} else if(TargetDistanceSquared <= Type.AttackDistance * Type.AttackDistance) {
								State = TankStateEnum.TARGET_IN_RANGE;
								
								if(IN_SPACE) moveForward();
							} else {
								TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
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
							if(Target.getDistanceSquaredFromPoint(X, Y) > Type.AttackDistance * Type.AttackDistance) {
								State = TankStateEnum.TARGET_AQUIRED;
							} else {
								this.moveTurretAndAttack();
							}
						}
						if(IN_SPACE) moveForward();
						break;
					case TankStateEnum.EVASIVE_ACTION:

						
						// need to get one of the bases and move to it!
						var dist = null;
						for(var n in Tanks)
							if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
								if(Tanks[n].getTeam() == Team && Tanks[n].isBase())
								{
									/* find closest base */
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
						
						if (TargetEvasive != null)
						{
							/* keep moving towards base, we havent finished healing */
							if((HitPoints / Type.HitPoints) <= rnd(.3,.5))
							{
								var TargetEvasiveDistanceSquared = TargetEvasive.getDistanceSquaredFromPoint(X, Y);
								if(TargetEvasiveDistanceSquared > (BASE_HEAL_RADIUS * BASE_HEAL_RADIUS) - rnd(-1 * BASE_HEAL_RADIUS, BASE_HEAL_RADIUS))
								{
									TargetBaseAngle = Math.atan2(TargetEvasive.getY() - Y, TargetEvasive.getX() - X);
									moveForward();
								}
								else
									State = TankStateEnum.STOP;
							}
							else State = TankStateEnum.IDLE; /* get out of EVASIVE, random chance */
						}
						else
							State = TankStateEnum.IDLE; /* no base to run to */
											
						break;
					case TankStateEnum.STOP:
						
						// Check their HP. If is over 60%, get back out there and fight!
						if((HitPoints / Type.HitPoints) >= rnd(.6,1))
							State = TankStateEnum.IDLE;
						else
						{
							/* move randomly in the healing circle */
							if(false && Math.random() < MOVE_PROB) {
	
								if(Math.random() < MOVE_PROB)
									TargetBaseAngle = Math.atan2(TargetEvasive.getY() + rnd(-1 * BASE_HEAL_RADIUS, BASE_HEAL_RADIUS) - Y, 
										TargetEvasive.getX() + rnd(-1 * BASE_HEAL_RADIUS, BASE_HEAL_RADIUS) - X)
								moveForward();
	
								/* moved outside of circle randomly, get back into fight! */
								if (X > TargetEvasive.X + BASE_HEAL_RADIUS || X < TargetEvasive.X - BASE_HEAL_RADIUS ||
									Y > TargetEvasive.Y + BASE_HEAL_RADIUS || Y < TargetEvasive.Y - BASE_HEAL_RADIUS)
									State = TankStateEnum.IDLE;
							}
	
							findTargets();
							/* Look for a target to help shoot */							
							if(Target != null && !Target.isBase())						
								this.moveTurretAndAttack();
							else if(Math.random() < MOVE_PROB)
							{
								TargetBaseAngle = 2 * Math.PI * Math.random();
								TargetTurretAngle = TargetBaseAngle;
								turnTurret();
							}
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
						if(Tanks[n].isBase() && Tanks[n].getDistanceSquaredFromPoint(X, Y) < MIN_BASE_DISTANCE_SQUARE) {
							dontBuild = true;
							break;
						}
					}
				}
				if(dontBuild) {
					Cooldown += 5;
				} else {
					
					// Need to prevent bases from building so close to the edges!				
					if(X > WIDTH - BASE_HEAL_RADIUS || X < BASE_HEAL_RADIUS || Y > HEIGHT - BASE_HEAL_RADIUS - (DRAW_BANNER_HEIGHT * 2) || Y < BASE_HEAL_RADIUS - (DRAW_BANNER_HEIGHT * 2) )
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
						moveForward();
						if(Math.random() < MOVE_PROB)
							TargetBaseAngle = 2 * Math.PI * Math.random();

						if(Type.BulletType == ShotTypeEnum.NONE) 
							This.takeDamage(1,null);

						turnTurret();
						findTargets();
						break;
					case TankStateEnum.TARGET_AQUIRED:
						Team.resetLastTargetFoundDate(); // Update the last found time
						moveForward();

						if(Type.BulletType == ShotTypeEnum.NONE)
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
								var angle = Math.atan2(Target.getY() - Y, Target.getX() - X);
								if(Math.cos(BaseAngle - angle) > 0)
									TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
	
								attack();
							} else {
								//Search for a better target:
								var TargetQualityFunction = function(target) {
									var angle = Math.atan2(target.getY() - Y, target.getX() - X);
									var distance = Math.sqrt(target.getDistanceSquaredFromPoint(X, Y));
									return Math.cos(BaseAngle - angle) * (Type.SightDistance-Math.abs((Type.AttackDistance + Type.MinRange) / 2 - distance));
								}
								var TargetQuality = TargetQualityFunction(Target);
								for(var n in Tanks) {
									if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
										if(Tanks[n].getTeam() != Team && Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance 
											&& (Type.AntiAircraft || !Tanks[n].isPlane())) {
												var quality = TargetQualityFunction(Tanks[n]);
												if(quality > TargetQuality) {
													TargetQuality = quality;
													Target = Tanks[n];
												}
										}
									}
								}
	
								if(TargetDistanceSquared > Type.MinRange * Type.MinRange)
									TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
							}
						}
						
						break;
					case TankStateEnum.CRASH_AND_BURN:
						if(Time-- > 0) {
							if(!(Target === null || !Tanks.contains(Target))) 
								TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
							
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
				
				this.drawHPBar(canvasContext,X,Y);
				
				// Draw Healing Circle
				{
					var pointArray = calcPointsCirc(X, Y, BASE_HEAL_RADIUS,1);
					canvasContext.beginPath();
					
					canvasContext.arc(X, Y, BASE_HEAL_RADIUS-4, 0, 2 * Math.PI, false)
					canvasContext.fillStyle = Team.getColor().getColorStringWithAlpha(.2);
					canvasContext.fill();
					canvasContext.closePath();
				}
							
			};
			break;
		case TankKindEnum.TANK:
		case TankKindEnum.BUILDER:
		case TankKindEnum.TURRET:
			this.draw = function(canvasContext) {
				this.drawHPBar(canvasContext,X,Y);
				//Base:
				if(!(Type.Kind === TankKindEnum.TURRET))
				{
					canvasContext.save();
					canvasContext.translate(X, Y);
					canvasContext.rotate(BaseAngle);
					canvasContext.beginPath();
					canvasContext.rect (-14, -8, 28, 16);
					canvasContext.fillStyle = Team.getColor().getColorStringWithAlpha(.2);
					canvasContext.fill();
					canvasContext.lineWidth = 1;
					canvasContext.strokeStyle = Team.getColor().getColorString();
					canvasContext.stroke();								
					canvasContext.restore();
				}
	
				//Turret:
				canvasContext.save();
				canvasContext.translate(X, Y);
				canvasContext.rotate(TurretAngle);
				canvasContext.strokeStyle = Team.getColor().getColorString();
				canvasContext.fillStyle = Team.getColor().getColorString();
	
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
				canvasContext.fill();
				canvasContext.restore();
				this.doDebug(canvasContext);
			};
			break;
		case TankKindEnum.PLANE:
			this.draw = function(canvasContext)
			{
				this.drawHPBar(canvasContext,X,Y);
				canvasContext.save();
				canvasContext.translate(X, Y);
				canvasContext.rotate(BaseAngle);
				canvasContext.strokeStyle = Team.getColor().getColorString();
				canvasContext.beginPath();

				if(Type.BulletType == ShotTypeEnum.BOMB)
				{
					// B-2 Bomber
					// Inspired by: http://en.wikipedia.org/wiki/File:NORTHROP_B-2.png

					// BODY!
					canvasContext.moveTo(15,0);
					canvasContext.lineTo(-15,40);
					canvasContext.lineTo(-22,30);
					canvasContext.lineTo(-12,15);
					canvasContext.lineTo(-22,0);


					canvasContext.moveTo(15,0);
					canvasContext.lineTo(-15,-40);
					canvasContext.lineTo(-22,-30);
					canvasContext.lineTo(-12,-15);
					canvasContext.lineTo(-22,0);
				}
				else if(Type.BulletType == ShotTypeEnum.MISSLE)
				{
					// F-16 Fighter

					// Nose (backside is -5)
					canvasContext.lineWidth = 1;
					canvasContext.moveTo(10,0);
					canvasContext.lineTo(-5,2);
					canvasContext.moveTo(10,0);
					canvasContext.lineTo(-5,-2);

					// Body (backside is -12)
					canvasContext.moveTo(-5,2);
					canvasContext.lineTo(-10,10);
					canvasContext.lineTo(-12,10);
					canvasContext.lineTo(-12,2);

					canvasContext.moveTo(-5, -2);
					canvasContext.lineTo(-10,-10);
					canvasContext.lineTo(-12,-10);
					canvasContext.lineTo(-12,-2);

					// Tail
					canvasContext.moveTo(-12,2);
					canvasContext.lineTo(-17,2);
					canvasContext.lineTo(-20,5);
					canvasContext.lineTo(-22,5);
					canvasContext.lineTo(-20,0);

					canvasContext.moveTo(-12,-2);
					canvasContext.lineTo(-17,-2);
					canvasContext.lineTo(-20,-5);
					canvasContext.lineTo(-22,-5);
					canvasContext.lineTo(-20,0);

				}
				else /* Scout Plane! */
				{
					canvasContext.moveTo(-12, 0);
					canvasContext.lineTo(12, 0);
					canvasContext.moveTo(0, 0);
					canvasContext.lineTo(-5, -8);
					canvasContext.moveTo(0, 0);
					canvasContext.lineTo(-5, 8);
				}

				canvasContext.fillStyle = Team.getColor().getColorStringWithAlpha(.2);
				canvasContext.fill();

				canvasContext.stroke();
				canvasContext.restore();
				this.doDebug(canvasContext);
				
			}
			break;
	}	
		
	this.isBase = function(){return Type.Kind == TankKindEnum.BASE;}
	this.isSpecial = function (){ return Type.Special; }	
	this.isPlane = function() {return Type.Kind == TankKindEnum.PLANE;};
	this.isTurret = function() { return Type.Kind == TankKindEnum.TURRET; }
	this.getKind = function() { return Type.Kind; }
	this.getTeam = function() {return Team;};
	this.getTeamnum = function(){return Teamnum;}
	this.getDistanceSquaredFromPoint = function(x, y) {return (X - x) * (X - x) + (Y - y) * (Y - y);};
	this.getRadiusSquared = function() {return Type.Radius * Type.Radius;};
	this.getX = function() {return X;}
	this.getY = function() {return Y;}	
	this.setX = function(x){X = x; return X;};
	this.setY = function(y){Y = y; return Y;};
	this.kill = function(){die();}	

	this.getDx = function()
	{
		if(State === TankStateEnum.MOVE || State === TankStateEnum.TARGET_AQUIRED || State === TankStateEnum.CRASH_AND_BURN) {
			if(Math.abs(TargetBaseAngle - BaseAngle) < MAX_MOVE_ANGLE)
				return Type.MoveSpeed * Math.cos(BaseAngle);
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
				return Type.MoveSpeed * Math.sin(BaseAngle);
			else
				return 0;
		} else {
			return 0;
		}
	}

	this.startEvading = function()
	{
		if(State == TankStateEnum.EVASIVE_ACTION) return true;
		if (CanEvade && (HitPoints / Type.HitPoints) <= rnd(.1,.5) && Math.random() <= EvadeProb)
		{
			State = TankStateEnum.EVASIVE_ACTION;
			return true;
		}
		return false;
	}

	this.attackingTarget = function(target){return Type.AttackingUnit ? target === Target : false;}
	
	this.takeDamage = function(damage, shooter) 
	{
		HitPoints -= damage;
		Team.addTaken(damage);
		if(shooter !== null && shooter.getTeam() !== Team)
		{
			shooter.getTeam().addGiven(damage);

			if(Tanks.contains(shooter)){ //Make sure the shooter of this bullet isn't already dead!
				if(Type.AntiAircraft || !shooter.isPlane()) {

					if (State === TankStateEnum.EVASIVE_ACTION) /* random change to leave evasive */
						if (Math.random() < EvadeProb) State = TankStateEnum.IDLE;

					if(State != TankStateEnum.EVASIVE_ACTION)
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

		if(HitPoints <= 0)
			if(Type.Kind === TankKindEnum.PLANE)
				State = TankStateEnum.CRASH_AND_BURN;
			else	
				die();
			
		
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
						
		if(State == TankStateEnum.IDLE || State == TankStateEnum.MOVE || State == TankStateEnum.EVASIVE_ACTION) {
			Target = target;
			if(State != TankStateEnum.EVASIVE_ACTION)
				State = TankStateEnum.TARGET_AQUIRED;
		}
	}
	
	this.drawHPBar = function (ctx, X,Y)
	{
		// Hide the HP bar until units health drops.
		if(HitPoints < Type.HitPoints)
		{
			ctx.save();
			ctx.beginPath();
			ctx.rect(X-10,Y-20,25*(HitPoints/Type.HitPoints),3);
			ctx.fillStyle = (new Color(0, 130, 0)).getColorString();
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = (new Color(0, 0, 0)).getColorString();
			ctx.stroke();
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
	
	this.doDebug = function(canvasContext)
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
		
		if(DRAW_TARGET_LINE && Target != null && Tanks.contains(Target))
		{
			canvasContext.beginPath();
			canvasContext.moveTo(X, Y);
			canvasContext.lineTo(Target.getX(), Target.getY());
			canvasContext.strokeStyle = Team.getColor().getColorStringWithAlpha(.5);
			canvasContext.stroke();
			canvasContext.closePath();
		}
	}
	
	//Private:
	function heal(){ AreaHeal(X,Y, BASE_HEAL_RADIUS * BASE_HEAL_RADIUS, This); };
	
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
				}
			}
		}
	}
	
	function findTargets()
	{
		if (Target != null && !Tanks.contains(Target)) Target = null;
		
		for(var n in Tanks) {
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
			{
				if(Tanks[n].getTeam() != Team && 
					Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance && 
					(Type.AntiAircraft || !Tanks[n].isPlane()))
				{
					/* choose a better target if we found one closer/more damaged */
					if (Target == null || 
						(Target.isBase() && !Tanks[n].isBase()) ||  /*attack something else if we are targetting a base*/
						(Tanks[n].getDistanceSquaredFromPoint(X, Y) < Target.getDistanceSquaredFromPoint(X, Y) ||  /* closer*/
						Tanks[n].HitPoints < Target.HitPoints)) /* more damaged */
					{
						Target = Tanks[n];
						
						/* don't switch state if we are running away */
						if (State != TankStateEnum.EVASIVE_ACTION)
							State = TankStateEnum.TARGET_AQUIRED;

						if(Type.AntiAircraft && Tanks[n].isPlane()) //AA tanks try to attack planes first of all
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
		//Find heading towards destination:
		
		while(TargetBaseAngle > Math.PI)
			TargetBaseAngle -=  2 * Math.PI;
		while(TargetBaseAngle < -Math.PI)
			TargetBaseAngle += 2 * Math.PI;

		//Turn towards heading:
		angleDiff = TargetBaseAngle - BaseAngle;
		if(Math.abs(angleDiff) > Math.PI) {
			if(angleDiff > 0)
				BaseAngle -= Type.TurnSpeed;
			else
				BaseAngle += Type.TurnSpeed;
		} else {
			if(Math.abs(angleDiff) > Type.TurnSpeed) {
				if(angleDiff > 0)
					BaseAngle += Type.TurnSpeed;
				else
					BaseAngle -= Type.TurnSpeed;
			} else {
				BaseAngle = TargetBaseAngle;
			}
		}
		if(BaseAngle > Math.PI)
			BaseAngle -=  2 * Math.PI;
		if(BaseAngle < -Math.PI)
			BaseAngle += 2 * Math.PI;

		//Move along current heading:
		if(Math.abs(TargetBaseAngle - BaseAngle) < MAX_MOVE_ANGLE || Type.Kind == TankKindEnum.PLANE)
		{
			X += Type.MoveSpeed * Math.cos(BaseAngle);
			Y += Type.MoveSpeed * Math.sin(BaseAngle);

			if (WORLD_WRAP)
			{
				if (X > WIDTH) X -= WIDTH; // if you reach the right side
				else if (X < 0) X += WIDTH; // if you reach the left side

				if (Y > HEIGHT - DRAW_BANNER_HEIGHT) Y -= HEIGHT - DRAW_BANNER_HEIGHT; // If you reach the bottom
				else if (Y - DRAW_BANNER_HEIGHT < 0) Y += (HEIGHT - DRAW_BANNER_HEIGHT); // If you reach the top (this works)
			}
			else
			{

				/* reverse direction if we hit the wall */
				if(X > WIDTH - MAP_MIN_LOC || X < MAP_MIN_LOC || 
					Y > HEIGHT - MAP_MIN_LOC - DRAW_BANNER_HEIGHT || Y < MAP_MIN_LOC + DRAW_BANNER_HEIGHT)
				{				
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
		}
	};

	function setTargetTurretAngle(target)
	{
		var Tx = target.getX(), Ty = Target.getY();
		var ShotTime = Math.sqrt(Target.getDistanceSquaredFromPoint(X, Y)) / Type.BulletSpeed;
		Tx += Target.getDx() * ShotTime;
		Ty += Target.getDy() * ShotTime;
		TargetTurretAngle = Math.atan2(Ty - Y, Tx - X);

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
		if(Cooldown <= 0) {
			if(TurretAngle === TargetTurretAngle || Type.BulletType === ShotTypeEnum.MISSLE) {
				var speed = Type.BulletSpeed;
				if(Type.BulletType === ShotTypeEnum.SHELL) {
					speed = (0.95 + Math.random() * .1) * (Math.sqrt(Target.getDistanceSquaredFromPoint(X, Y)) - Type.BarrelLength) / Type.BulletTime;
				}
				if(Type.DoubleTurret) {
					//TurretSeparation
					Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength + Math.cos(TurretAngle + Math.PI / 4) * Type.TurretSeparation, Y + Math.sin(TurretAngle) * Type.BarrelLength + Math.sin(TurretAngle + Math.PI / 4) * Type.TurretSeparation, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), Type.BulletTime, Team, Type.BulletDamage, This, Type.BulletType, Target, Type.AntiAircraft));
					Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength + Math.cos(TurretAngle - Math.PI / 4) * Type.TurretSeparation, Y + Math.sin(TurretAngle) * Type.BarrelLength + Math.sin(TurretAngle - Math.PI / 4) * Type.TurretSeparation, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), Type.BulletTime, Team, Type.BulletDamage, This, Type.BulletType, Target, Type.AntiAircraft));
					
				} else {
					Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength, Y + Math.sin(TurretAngle) * Type.BarrelLength, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), Type.BulletTime, Team, Type.BulletDamage, This, Type.BulletType, Target, Type.AntiAircraft));
				}
				Cooldown = Type.CooldownTime;
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
		
		Damage = (!HARD_MODE) ? (Damage * DAMAGE_MULTIPLIER) : ((Damage * DAMAGE_MULTIPLIER) * HARD_MODE_DAMAGE_REDUCTION);
		Damage = Math.floor(Damage); // Ensure we are only using whole numbers
		
		if(Damage <= 0)
			Damage = 1; // So the weak peeps can still attack
		
		if(Target != null && Tanks.contains(Target) && Type === ShotTypeEnum.MISSLE)
			LastAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
		
		//Privileged:
		this.move = function() {
			
			X += Dx;
			Y += Dy;
			Time--;
			
			if(Type === ShotTypeEnum.MISSLE) {
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
									LastAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);						
									BestDotProduct = DotProduct;
								}
							}
						}
					}
				}
	
				if(Target != null && Tanks.contains(Target)) {
					var speed = MISSLE_ACCELERATION + Math.sqrt(Dx * Dx + Dy * Dy);
					var angle = Math.atan2(Dy, Dx);
					var angleToTarget = Math.atan2(Target.getY() - Y, Target.getX() - X);
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
	
			if(Type != ShotTypeEnum.SHELL && Type != ShotTypeEnum.BOMB)
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
	
		this.draw = function(canvasContext)
		{
			canvasContext.beginPath();
			canvasContext.fillStyle = "rgb(255, 255,0)";
			canvasContext.fillRect (X - .5, Y -.5, 1.5, 1.5);		
		};
	
		//Private:
		function explode()
		{
			if(Type === ShotTypeEnum.SHELL) {
				AreaDamage(X, Y, Damage, SHELL_DAMAGE_RADIUS * SHELL_DAMAGE_RADIUS, Shooter);
				Explosions.add(new Explosion(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, SHELL_DAMAGE_RADIUS));		
			} else if(Type === ShotTypeEnum.BOMB) {
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
			var TimeRatio = Time / TotalTime;
			var color = Math.floor(25 + 75 * TimeRatio);		
			var red = Math.floor(Redness * (1 - 4 * TimeRatio));
			if(red < 0)
				red = 0;
			if(red + color > 255)
				red = 255 - color;
			canvasContext.beginPath();
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
			LastTargetFound = new Date(),
			UAVCooldown = DEFAULT_UAV_COOLDOWN;
	
		this.getColor = function() {return Color;}
		this.getName = function() {return Name;}
		this.getScore = function() {return Score;}
		this.getTotalScore = function(){return TotalScore;}
		this.setScore = function(score) {Score = score;}
		this.getTaken = function() {return Taken;}
		this.getGiven = function() {return Given;}
		this.getUsedTickets = function(){return UsedTickets;}
		this.getUAVCooldown = function(){return UAVCooldown;}
		this.setUAVCooldown = function(d){UAVCooldown += d; return UAVCooldown;}
		this.resetUAVCooldown = function(){UAVCooldown == DEFAULT_UAV_COOLDOWN; return UAVCooldown;}
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
		for ( teamnum in Teams)
		{
			var t = Teams[teamnum];
			var hoff = 5 /* left padding */ + (NUM_TEAMS * (smallscreen ? 20 : 35) * teamnum);
			if (teamnum > 0) hoff + 23;
			var voff = 14;			
			ctx.fillStyle = t.getColor().getColorString();
			ctx.fillText((smallscreen ? "" : t.getName() + " - ") + t.getScore() + " units, "+ t.getGiven(),hoff,voff);
		}
		
		// Display What Round it is
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillRect (0,HEIGHT-DRAW_BANNER_HEIGHT,WIDTH,DRAW_BANNER_HEIGHT);
		ctx.fillStyle = "rgb(255,255,255)";

		var rSecs = (+new Date - roundStartTime) / 1000,
			rMins = Math.floor(rSecs / 60);
		rSecs = Math.floor(rSecs % 60);
		ctx.fillText("Round: " + ROUND + "  -  " + (rMins > 0 ? rMins + " min" + (rMins > 1 ? "s" : "" ) + ", ": "") + 
			rSecs + " secs",5,HEIGHT - 5);

		// FPS
		ctx.fillText(getFPS() + " fps",WIDTH-65,HEIGHT - 5);
		
		// Show the winners roster 
		/*
		if(WINNING_TEAMS.length >= 1)
		{
			winners = WINNING_TEAMS;
			
			var bw = WIDTH-250;
			var bh = 0;
			
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect (bw,bh,250,60+(17*NUM_TEAMS));
			
			ctx.fillStyle = "rgb(255,255,255)"; //Teams[6].getColor().getColorString();
			ctx.font = "8pt Arial";
			ctx.fillText("Winner Roster",bw+10,15);
			ctx.fillText("Team",bw+10,30);
			ctx.fillText("Score",bw+70,30);
			ctx.fillText("Units",bw+120,30);
			ctx.fillText("Last Standing?",bw+160,30);
						
			for(i=0;i<=WINNING_TEAMS.length-1;i++)
			{				
				var voff = 30 + (15*(i+1));
				ctx.fillStyle = WINNING_TEAMS[i][5];
				
				var TotalVictory = (WINNING_TEAMS[i][2] < SCORE_TO_WIN) ? "Yes" : "";
				
				ctx.fillText(WINNING_TEAMS[i][1],bw+10,voff);
				ctx.fillText(WINNING_TEAMS[i][2],bw+70,voff);
				ctx.fillText(WINNING_TEAMS[i][4],bw+120,voff);
				ctx.fillText(TotalVictory,bw+160,voff);
			}
		}
		*/

		/* Show Debug Toggles */
		{
			ctx.fillStyle = (!DRAW_RANGE_CIRCLE) ? "rgba(255,255,255,.8)" : "rgba(42,225,96,.8)";
			ctx.fillRect(WIDTH-95,0,20,DRAW_BANNER_HEIGHT);
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillText("R",WIDTH-90,14);
			
			ctx.fillStyle = (!DRAW_TARGET_LINE) ? "rgba(255,255,255,.8)" : "rgba(42,225,96,.8)";
			ctx.fillRect(WIDTH-70,0,20,DRAW_BANNER_HEIGHT);
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillText("T",WIDTH-65,14);
		}
		
		// Draw button for GOD MODE
		ctx.fillStyle = (!GOD_MODE) ? "rgba(255,255,255,.8)" : "rgba(42,225,96,.8)";
		ctx.fillRect(WIDTH-45,0,40,DRAW_BANNER_HEIGHT);
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillText("GOD",WIDTH-40,14);
		
		// Show a little helper for the GOD_MODE button
		if(DRAW_GOD_MODE_HELP)
		{
			ctx.fillStyle = "rgba(0,0,0,.5)";
			ctx.fillRect(WIDTH-400,25,400,100);
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillText("GOD MODE is " + ((GOD_MODE) ? "Enabled!" : "Disabled..."),WIDTH-395,36)
			ctx.fillStyle = "rgb(255,255,255)";
			ctx.fillText("Ctrl+LClick = Instant Random Base (for random faction as well)",WIDTH-395,60);
			ctx.fillText("Shift+LClick = Destroys the unit clicked on.",WIDTH-395,80);
			ctx.fillText("Alt+LClick = Destroys lots of units within a large radius.",WIDTH-395,100);
			ctx.fillText("LClick = Instant Random Unit (for random faction as well)",WIDTH-395,120);
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
		console.log(terrainColors[tcIndex].toString());
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
				[0, Math.floor(WIDTH / 2), DRAW_BANNER_HEIGHT, Math.floor(HEIGHT / 2)],
				[Math.floor(WIDTH / 2), WIDTH, DRAW_BANNER_HEIGHT, Math.floor(HEIGHT / 2)],
				[0, Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2), HEIGHT - DRAW_BANNER_HEIGHT],
				[Math.floor(WIDTH / 2), WIDTH, Math.floor(HEIGHT / 2), HEIGHT - DRAW_BANNER_HEIGHT]
			];
				
		for(var i = 0; i < Teams.length; i++) {
			Teams[i].reset();
			//MIN_SEPERATION_OF_STARTING_BASES
			var TooClose = true;
			var attempts = 0;
			while(TooClose && attempts++ < 100) {
				TooClose = false;

				var quad = quadrants[i % quadrants.length];
				x = rnd(quad[0], quad[1]);
				y = rnd(quad[2], quad[3]);

				//console.log(x +", " + y);

				/*x = rnd(BASE_HEAL_RADIUS, WIDTH - BASE_HEAL_RADIUS);
				y = rnd(BASE_HEAL_RADIUS, HEIGHT - BASE_HEAL_RADIUS - (DRAW_BANNER_HEIGHT * 2));*/

				if (x < BASE_HEAL_RADIUS) x += BASE_HEAL_RADIUS;
				else if (x > WIDTH - BASE_HEAL_RADIUS) x -= BASE_HEAL_RADIUS;

				if (y < BASE_HEAL_RADIUS + DRAW_BANNER_HEIGHT) y += BASE_HEAL_RADIUS;
				else if (y > HEIGHT - BASE_HEAL_RADIUS - DRAW_BANNER_HEIGHT) y -= BASE_HEAL_RADIUS;

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
		
		if(WINNING_TEAMS.length > 0)
			console.log(WINNING_TEAMS);
		
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
		
	function rnd(minv, maxv)
	{
		if (maxv < minv) return 0;
		return Math.floor(Math.random()*(maxv-minv+1)) + minv;
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
			c = touse.charAt(rnd(0, touse.length - 1));
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
		var _team = teamList;
		var TeamInfo = [];
		var TeamScores = [];
		var TeamUnits = [];
	
		for(var i = 0; i < _team.length; i++) {
			TeamInfo.push([
				i,										//0
				_team[i].getName(),						//1
				_team[i].getGiven(),					//2
				_team[i].getScore(),					//3
				_team[i].getTotalScore(),				//4
				_team[i].getColor().getColorString()	//5
			]);
			TeamScores.push(_team[i].getGiven()); //Push Scores
			TeamUnits.push(_team[i].getScore()); //Push Units
		}
		
		var _highScore = Math.max.apply(Math,TeamScores);
		var _highMax = Math.max.apply(Math,TeamUnits);
		
		if(_highScore == 0 || _highScore == undefined)
			return;
		
		for(var i=0;i<TeamInfo.length;i++)
		{
			if(TeamInfo[i][2] == _highScore || TeamInfo[i][3] == _highMax)
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
	
	function ClickCreateUnit(X,Y, makeBase)
	{		
		var _randomTeam =  Teams[rnd(0,NUM_TEAMS)];
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
			
		var _NewTank = new Tank(X, Y, _randomTeam, (makeBase) ? BaseType : TypeToMake, _teamNum);
		Tanks.add(_NewTank);
	}
	
	// Javascript Extensions
	Array.Max = function(array){
		return Math.max.apply(Math,array);
	};
	
	Object.size = function(obj)
	{
		var size = 0, key;
		for(key in obj)
			if(obj.hasOwnProperty(key)) size++;
		
		return size;
	}
	