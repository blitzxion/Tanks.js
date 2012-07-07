// Garage.js

var TotalProb;

var TankKindEnum = {
	TANK    : 0,
	BASE    : 1,
	BUILDER : 2,
	TURRET  : 3,
	PLANE   : 4
}

var TankStateEnum = {
	IDLE : 0,
	MOVE : 1,
	TARGET_AQUIRED : 2,
	TARGET_IN_RANGE : 3,
	CRASH_AND_BURN : 4,
	EVADE : 5,
	STOP_AND_GUARD : 6
}

// Shot Types
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

// Unit Types
var TankTypes = [];

//Small Tank:
TankTypes[0] = {
	Name : "SmallTank",
	Kind : TankKindEnum.TANK,
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
	EvaProb : .25,
	Shape : null
};

//Medium Tank
TankTypes[1] = {
	Name : "MediumTank",
	Kind : TankKindEnum.TANK,
	AttackingUnit :  true,
	Prob : 120,
	MoveSpeed : 1.0,
	TurnSpeed : .13,
	TurretTurnSpeed : .16,
	TurretAttackAngle : 5,
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
	Name : "LargeTank",
	Kind : TankKindEnum.TANK,
	AttackingUnit : true,
	Prob : 120,
	MoveSpeed : 0.8,
	TurnSpeed : .09,
	TurretTurnSpeed : .14,
	TurretAttackAngle : 5,
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
	Name : "ArtilleryTank",
	Kind : TankKindEnum.TANK,
	AttackingUnit : true,
	Prob : 60,
	MoveSpeed : 0.9,
	TurnSpeed : .07,
	TurretTurnSpeed : 0.12,
	TurretAttackAngle : 5,
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
	Name : "DoubleTank",
	Kind : TankKindEnum.TANK,
	AttackingUnit : true,
	Prob : 80,
	MoveSpeed : 0.7,
	TurnSpeed : .07,
	TurretTurnSpeed : 0.12,
	TurretAttackAngle : 5,
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
	Name : "MissileTank",
	Kind : TankKindEnum.TANK,
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
	Name : "DefenseTurret",
	Kind : TankKindEnum.TURRET,
	AttackingUnit : true,
	Prob : 40,
	MoveSpeed : 0,
	TurnSpeed : 0,
	TurretTurnSpeed : 0.16,
	TurretAttackAngle : 5,
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
	Name : "AATurret",
	Kind : TankKindEnum.TURRET,
	AttackingUnit : true,
	Prob : 70,
	MoveSpeed : 0,
	TurnSpeed : 0,
	TurretTurnSpeed : 0.14,
	TurretAttackAngle : 10,
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
	Name : "Builder",
	Kind : TankKindEnum.BUILDER,
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
	Name : "BomberPlane",
	Kind : TankKindEnum.PLANE,
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
	Name : "FighterJet",
	Kind : TankKindEnum.PLANE,
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
	Name : "MammothTank",
	Kind : TankKindEnum.TANK,
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
	Name : "UAVScout",
	Kind : TankKindEnum.PLANE,
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
	Name : "HealerTank",
	Kind : TankKindEnum.TANK,
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
	Name : "Base",
	Kind : TankKindEnum.BASE,
	AttackingUnit : false,
	Prob : 0,
	MoveSpeed : 0,
	TurnSpeed : 0,
	TurretTurnSpeed : 0,
	Radius : 10,
	HitPoints : 1000,
	CooldownTime : IS_MOBILE ? 100 : 500,
	MinRange : 0,
	AttackDistance : 0,
	AttackRange : 0,
	SightDistance : 200,
	BulletType : [ShotType.NONE],
	TurretSize : 0,
	BarrelLength :  0,
	DoubleTurret : false,
	CanGoEvasive : false,
	EvaProb : 0,
	Shape : null
};


var Tanks = new Set("tankIndex");
var Bullets = new Set("bulletIndex");
var Explosions = new Set("explosionIndex");
var Smokes = new Set("smokeIndex");
var DebrisSet = new Set("debrisIndex");


//----- Tanks Class -----
	function Tank(x_init, y_init, team, type, teamnum)
	{
		var Color = team.getColor(),
			X = x_init,
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
			BaseAngle = 0,
			TargetBaseAngle = 0,
			TurretAngle = 0,
			TargetTurretAngle = 0,
			HealCooldown = (Math.floor(Math.random()*2)+ 1) * HEALTH_COOLDOWN, // Random time the health regen will occur
			CanEvade = Type.CanGoEvasive,
			EvadeProb = Type.EvaProb,
			State = TankStateEnum.IDLE,
			Weapons = null,
			This = this,
			SHAPE = null, // IMPORTANT!
			HEALCIRCLE = null,
			HPBAR = null,
			DRAGGING = false,
			debug = {}
			;

		var getColor = function(){return Color;}
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
	    this.getAngleFromPoint = function(x, y) { return getAngleFromPoint(x, y, X, Y); }
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

		this.getHPBar = function() { return HPBAR; }
		this.drawHPBar = function()
		{
			if(HPBAR == null)
			{
				HPBAR = new Kinetic.Rect({
					x: X - 10, // Offset it to the left a bit
					y: Y - 10, // Offset it just above the unit
					width: 40,
					height: 3,
					fill: "green",
					stroke: "black",
					strokeWidth: 1
				});
				LAYER.add(HPBAR);
				HPBAR.hide(); // We're at full health, no need!
			}
			else
			{
				if(HitPoints <= 0) 
					HPBAR.hide(); // Since the health dropped below 0, hide it
				else
					if(HitPoints < Type.HitPoints && HitPoints != 0)
					{
						HPBAR.show(); // We're less than 100%, go!
						HPBAR.setPosition(X-10,Y-10);
						HPBAR.setWidth(40*(HitPoints/Type.HitPoints));

						if((HitPoints/Type.HitPoints) <= .35) HPBAR.fill("red");
						else HPBAR.fill("green");
					}
			}
		}

		this.getHealCircleShape = function() { return HEALCIRCLE;} 
		this.drawCircle = function(sX, sY, radius, alpha)
		{
			if(HEALCIRCLE == null) // Always add if null
			{
				HEALCIRCLE = new Kinetic.Circle({
					x: sX,
					y: sY,
					radius: radius,
					fill: Team.getColor().getStringAlpha(alpha)
				});

				//LAYER.add(HEALCIRCLE);
				//HEALCIRCLE.moveToBottom();
			}
			else if(Type != TankKindEnum.BASE)
				HEALCIRCLE.setPosition(sX,sY); // This is for the healing tanks.

			return HEALCIRCLE;
		}

		// Draws the unit to the canvas
		this.getShape = function() {return SHAPE;}
		this.draw = function()
		{
			var _c = Team.getColor().getString();
			var _cA = Team.getColor().getStringAlpha(.2);

			// Unit Draw methods
			switch(Type.Kind)
			{
				case TankKindEnum.BASE:

					if(SHAPE == null)
					{
						// NOTE: IF you add items to a group, dont give fucking items parent X/Y coors. This will make them fly off screen!
						var group = new Kinetic.Group({ x:X, y:Y }); // This places all objects correctl
						var _shape;

						_shape = KBaseShape(); // This unit now has a shape
						_shape.setFill(Team.getColor().getString()); // Sets the unit to the correct color

						group.add(this.drawCircle(10,10,BASE_HEAL_RADIUS,.2)); // Draw Healing Circle
						group.add(_shape);

						group.name = "Base_" + teamnum;
						group.on("mouseover",function(){ writeMessage(SHAPE.name); });
						group.on("mouseout",function(){ writeMessage(""); });

						SHAPE = group; // Since this has more than one part

						LAYER.add(group);
						group.moveToBottom();
					}
					else
						SHAPE.setPosition(X,Y); // For the resize event
					
					break;
				case TankKindEnum.TANK:
				case TankKindEnum.BUILDER:
				case TankKindEnum.TURRET:
				
					var identicalTanks = ["SmallTank","MediumTank","LargeTank","DoubleTank","ArtilleryTank","MissileTank","Builder"];

					if(SHAPE == null)
					{
						var group = new Kinetic.Group({x:X, y:Y});// This places all objects correctly
						var _shape;
						var _turret = null;

						if(inArray(identicalTanks,Type.Name))
							_shape = KTankShape(_c,_cA);
						else if(Type.Name == "HealerTank")
							_shape = KHealerTank(_c,_cA);
						else if(Type.Name == "MammothTank")
							_shape = KMammothTank(_c,_cA);
						else if(Type.Kind == TankKindEnum.TURRET) // Turrets
							_shape = KStandardTurret(Type, _c);
						
						group.add(_shape); // Adds the unit to the group

						// Now we can add turrets to tanks.
						if(Type.Kind != TankKindEnum.TURRET) // Turrets don't get turrets!
						{
							if(inArray(identicalTanks,Type.Name))
								_turret = KStandardTurret(Type,Team.getColor().getString());

							if(Type.Name == "MammothTank")
								_turret = KStandardTurret(Type,Team.getColor().getString());
							
							if(_turret != null)
								group.add(_turret);
						}

						group.on("mouseover",function(){ writeMessage(
							SHAPE.name + 
							((Type.Kind == TankKindEnum.TURRET) ? " TurretA=" + TurretAngle : " BaseA=" + BaseAngle) +
							" State#=" + State +
							" TurretBaseA=" + TargetBaseAngle + 
							((Target != null) ? " Trgt=" + Target.getShape().name : "")
						)});
						group.on("mouseout",function(){ writeMessage(""); });
						group.name = Type.Name + "_" + teamnum + "_" + rndInt(10,100000);

						SHAPE = group;
						SHAPE.setPosition(X,Y); // Default starting point
						SHAPE.rotate(2 * Math.PI * Math.random()); // Random starting angle

						SHAPE.setScale(1); // This is fun! 1 = default, 2 = Large, .5 = Small! (any number will work)

						LAYER.add(SHAPE);
					}
					else
					{
						SHAPE.setPosition(X,Y);
						SHAPE.setRotation((Type.Kind == TankKindEnum.TURRET) ? TurretAngle : BaseAngle); // This rotates the parent, needs to happen always

						if(Type.Kind != TankKindEnum.TURRET)
						{
							try { // Try to rotate the turret, if it has one
								SHAPE.getChildren()[1].setRotation(TurretAngle);
							} catch(err) { /* Just leave, no turret on this sucker */ }
						}
						
					}
					
					break;
				case TankKindEnum.PLANE:
					
					if(SHAPE == null)
					{
						if(Type.Name == "UAVScout")
							SHAPE = KDronePlane(_c,_cA);
						else if(Type.Name == "FighterJet")
							SHAPE = KFighterPlane(_c,_cA);
						else if(Type.Name == "BomberPlane")
							SHAPE = KBomberPlane(_c,_cA);

						SHAPE.setPosition(X,Y);
						SHAPE.rotate(2 * Math.PI * Math.random());
						
						//SHAPE.on("mousedown",function(){ writeMessage(SHAPE.name); });
						//SHAPE.on("mouseup",function(){ writeMessage(""); });
						SHAPE.name = Type.Name + "_" + teamnum + "_" + rndInt(10,100000);
						LAYER.add(SHAPE);
						SHAPE.moveToTop();
					}
					else
					{
						SHAPE.setPosition(X,Y);
						SHAPE.setRotation(BaseAngle);
					}

					break;
			}

			this.drawHPBar(); // Everyone gets an HP bar!
			this.drawDebugExtras(); // Debug stuffs
		}

		// The Guts of the operation, this makes the unit move/fire/etc
		this.doStuff = function()
		{
			switch(Type.Kind)
			{
				case TankKindEnum.BASE:
					
					// If within cooldown, exit out and wait...
					if(Cooldown > 0) { Cooldown--; return; }
					
					if(Team.getScore() >= getMAX_UNITS_PER_FACTION_ON_MAP()) return;

					var angle = Math.random() * 2 * Math.PI,
						outX = X + 25 * Math.cos(angle),
						outY = Y + 25 * Math.sin(angle);

					var TypeToMake;
					var rand = Math.floor(Math.random() * TotalProb);

					for(var i = 0; i < TankTypes.length; i++){
						if(rand < TankTypes[i].Prob) { TypeToMake = TankTypes[i]; break; }
						else rand -= TankTypes[i].Prob;
					}

					if (!TypeToMake) return;

					//Tanks.add(new Tank(outX, outY, Team, TypeToMake, teamnum)); // Test
					Cooldown = Type.CooldownTime;

					if ((new Date().getTime() - Team.getLastTargetFoundDate().getTime()) / 1000 > 10)
						Team.resetLastTargetFoundDate();

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

						Tanks.add(new Tank(outX, outY, Team, TypeToMake, teamnum));
						Cooldown = Type.CooldownTime;
					}
					else
						return; // Maxed out units!


					break;
				case TankKindEnum.TANK:
					switch(State)
					{
						case TankStateEnum.IDLE: // 0
							if(Math.random() < MOVE_PROB) {
								TargetBaseAngle = 2 * Math.PI * Math.random();
								State = TankStateEnum.MOVE;
							}
							TargetTurretAngle = TargetBaseAngle;
							turnTurret();
							break;
						case TankStateEnum.MOVE: // 1
							moveForward();
							if(Math.random() < MOVE_PROB)
								State = TankStateEnum.IDLE;
							if(Math.random() < MOVE_PROB)
								TargetBaseAngle = 2 * Math.PI * Math.random();

							TargetTurretAngle = TargetBaseAngle;
							turnTurret();
							findTargets();
							break;
						case TankStateEnum.TARGET_AQUIRED: // 2
								// if (!This.isHealer())
								// 	Team.resetLastTargetFoundDate();

								findTargets(); /* see if there is a better target to fire on*/

								if(Target != null) {
									var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);

									if(TargetDistanceSquared <= Type.MinRange * Type.MinRange) {
										TargetBaseAngle = this.getAngleFromPoint(Target.getX(), Target.getY()) + Math.PI;
										moveForward();
										this.moveTurretAndAttack();
									} else if(TargetDistanceSquared <= Type.AttackDistance * Type.AttackDistance) {
										State = TankStateEnum.TARGET_IN_RANGE;
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
						case TankStateEnum.TARGET_IN_RANGE: // 3
								if(Target === null || !Tanks.contains(Target)) {
									State = TankStateEnum.IDLE;
									DestX = X;
									DestY = Y;
									Target = null;
								} else {
									// if (!This.isHealer())
									// 	Team.resetLastTargetFoundDate();

									if(Target.getDistanceSquaredFromPoint(X, Y) > Type.AttackDistance * Type.AttackDistance) {
										State = TankStateEnum.TARGET_AQUIRED;
									} else {
										this.moveTurretAndAttack();
									}
								}
							break;
						case TankStateEnum.EVADE: // 5
							break;
						case TankStateEnum.STOP_AND_GUARD: // 6
							break;
					}

					break;
				case TankKindEnum.PLANE:
					
					break;

				case TankKindEnum.TURRET:
					switch (State)
					{
						case TankStateEnum.IDLE:
							if(Math.random() < MOVE_PROB)
								TargetTurretAngle = 2 * Math.PI * Math.random() - Math.PI;

							turnTurret();
							findTargets();
							break;
						case TankStateEnum.TARGET_AQUIRED:
							//Team.resetLastTargetFoundDate(); // Update the last found time
							findTargets();
							this.moveTurretAndAttack();

							if(Target === null || !Tanks.contains(Target)
								|| Target.getDistanceSquaredFromPoint(X, Y) > Type.AttackRange * Type.AttackRange) {
								State = TankStateEnum.IDLE;
								Target = null;
							}
							break;
					}
					break;
			}
		}

		this.moveTurretAndAttack = function()
		{
			if(Target != null)
			{
				setTargetTurretAngle(Target);
				turnTurret();
				var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);
				if (TargetDistanceSquared <= Type.AttackDistance * Type.AttackDistance) {
					/* Fire at the target while running away! */
					//this.startEvading();
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

			if(State !== TankStateEnum.TARGET_AQUIRED && State !== TankStateEnum.TARGET_IN_RANGE)
			{ 
				Target = target;
				if(!this.isEvading()) 
					State = TankStateEnum.TARGET_AQUIRED;
			}
		}
		this.drawDebugExtras = function()
		{
			// Draw ATTACK RANGE Circle
			// if(DRAW_RANGE_CIRCLE)
			// {
			// 	var pointArray = calcPointsCirc(X, Y, Type.AttackDistance,1);
			// 	canvasContext.beginPath();
			// 	canvasContext.arc(X, Y, Type.AttackDistance, 0, 2 * Math.PI, false)
			// 	canvasContext.strokeStyle = Team.getColor().getColorStringWithAlpha(.2);
			// 	canvasContext.stroke();
			// 	canvasContext.closePath();
			// }

			// if(DRAW_DISTANCE_CIRCLE)
			// {
			// 	var pointArray = calcPointsCirc(X, Y, Type.SightDistance,1);
			// 	canvasContext.beginPath();
			// 	canvasContext.arc(X, Y, Type.SightDistance, 0, 2 * Math.PI, false)
			// 	canvasContext.strokeStyle = Team.getColor().getColorStringWithAlpha(.2);
			// 	canvasContext.stroke();
			// 	canvasContext.closePath();
			// }
			DRAW_TARGET_LINE = true; // True for now...
			if(DRAW_TARGET_LINE && Target != null && Tanks.contains(Target) && Type.Kind != TankKindEnum.TURRET)
			{
				var mX = this.getX(), mY = this.getY(),
					x = Target.getX(), y = Target.getY(),
					dx = x - X,
					dy = y - Y,
					w2 = WIDTH * 0.5,
					h2 = HEIGHT * 0.5,
					x2 = x, y2 = y;

				if (dx < -w2) x2 = x + WIDTH;
				if (dx > w2)  x2 = x - WIDTH;
				if (dy < -h2) y2 = y + HEIGHT;
				if (dy > h2)  y2 = y - HEIGHT;

				// Line's basics:
				if(debug.targetLine == null || debug.targetLine == undefined){
					debug.targetLine = new Kinetic.Line({
						stroke : Team.getColor().getStringAlpha(.5),
						strokeWidth : 1,
						dashArray: [rndInt(10,35), rndInt(5,10)]
					});

					LAYER.add(debug.targetLine);
				}

				// I know this is breaking the two line thing, just haven't gotten to it yet...
				/* if line cuts through edge of world we need to draw two lines on each side of screen to simulate
				*  target wrapping.  law of sines to figure out what the lines will be (creating triangles) */
				var iX = (x == x2) ? x : x2;
				var iY = (y == y2) ? y : y2;
				var iPoints = [mX,mY,iX,iY];

				if(!debug.targetLine.getPoints().compare(iPoints)) // Prevents the line from constantly being repositioned if the two are the same!
					debug.targetLine.setPoints(iPoints);

			}
			else
			{
				if(debug.targetLine != null || debug.targetLine != undefined)
				{
					LAYER.remove(debug.targetLine); // No need to draw it any longer
					debug.targetLine = null; // Readies the line for next time a target is found
				}
			}


			// Draw FOV
			// if(DRAW_FOV)
			// {
			// 	var useThisAngle = TurretAngle;
			// 	var useAttackAngle = Type.TurretAttackAngle;
			// 	if(!Type.AttackingUnit)
			// 	{
			// 		useThisAngle = BaseAngle;
			// 		useAttackAngle = 45;
			// 	}
			// 	else if(this.isPlane() && Target == null)
			// 		useThisAngle = BaseAngle;

			// 	canvasContext.beginPath();
			// 	canvasContext.strokeStyle = Team.getColor().getColorStringWithAlpha(.5);
			// 	canvasContext.moveTo(X,Y);
			// 	canvasContext.arc(X,Y,Type.SightDistance,useThisAngle - (Math.PI / 180) * useAttackAngle,useThisAngle + (Math.PI / 180) * useAttackAngle,false);
			// 	canvasContext.closePath();
			// 	//canvasContext.fillStyle = Team.getColor().getColorStringWithAlpha(.05);
			// 	//canvasContext.fill();
			// 	canvasContext.stroke();

			//}
		}

		// Private Method
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
				if(angleDiff > 0) TurretAngle -= Type.TurretTurnSpeed;
				else TurretAngle += Type.TurretTurnSpeed;
			} 
			else
			{
				if(Math.abs(angleDiff) > Type.TurretTurnSpeed) {
					if(angleDiff > 0) TurretAngle += Type.TurretTurnSpeed;
					else TurretAngle -= Type.TurretTurnSpeed;
				} 
				else
					TurretAngle = TargetTurretAngle;				
			}
			if(TurretAngle > Math.PI) TurretAngle -=  2 * Math.PI;
			if(TurretAngle < -Math.PI) TurretAngle += 2 * Math.PI;
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

					if (Y > HEIGHT) Y = Math.abs(Y - HEIGHT); // If you reach the bottom... set you back at the top
					else if (Y < 0) Y = Math.abs(Y + HEIGHT); // If you reach the top (this works)... set you back at the bottom
				}
				else
				{

					/* reverse direction if we hit the wall */
					if(X > WIDTH - MAP_MIN_LOC || X < MAP_MIN_LOC ||
						Y > HEIGHT - MAP_MIN_LOC || Y < MAP_MIN_LOC)
					{
						BaseAngle += Math.PI + rnd(0, Math.PI * .5); /* do a reverse with some random added in */

						if(X > WIDTH - MAP_MIN_LOC)
							X = WIDTH - MAP_MIN_LOC;
						else if(X < MAP_MIN_LOC)
							X = MAP_MIN_LOC;
						if(Y > HEIGHT - MAP_MIN_LOC)
							Y = HEIGHT - MAP_MIN_LOC;
						else if(Y < MAP_MIN_LOC)
							Y = MAP_MIN_LOC;
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

			if(Target != null) callFriendlies(Target);
		}

		function attack()
		{
			return; // Stop this from doing anything....

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

					if(!gunAmmo.attackaironly && Target.isPlane() && !Type.AntiAircraft) continue; // If your weapon ground only, and you are targeting a plane and you're not AA, skip
					if(gunAmmo.attackaironly && !Target.isPlane()) continue; // If your weapon is AA only, and you're targeting a ground unit, skip
					if(This.isPlane() && !gunAmmo.attackaironly && Target.isPlane()) continue;

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

		

		Team.setScore(Team.getScore() + 1);
		Team.addScore(1);
		Team.addTicket();
	}

//----- Motor Class -----
	function Motor(type)
	{

	}

//----- Bullet Class -----
	function Bullets()
	{

	}

//----- Smoke Class -----
	function Smoke()
	{
		// var X = x, Y = y, StartSize = startSize, EndSize = endSize, TotalTime = time, Redness = redness;
		// if (IS_MOBILE || getFPS() < FPS_TOO_LOW) TotalTime = TotalTime / 5;

		var This = this;
		var Time = 0;
		this.update = function () {
			// if(Time < TotalTime)
			// 	Time++;
			// else
			// 	Smokes.remove(This);
		}

		this.draw = function (canvasContext) {
			// if (IS_MOBILE && getFPS() < FPS_TOO_LOW) return; /* don't show smoke, we are going too slow */

			// var TimeRatio = Time / TotalTime;
			// var color = Math.floor(25 + 75 * TimeRatio);
			// var red = Math.floor(Redness * (1 - 4 * TimeRatio));
			// if(red < 0)
			// 	red = 0;
			// if(red + color > 255)
			// 	red = 255 - color;
			// canvasContext.beginPath();
			// if (IS_MOBILE)
			// 	canvasContext.fillStyle = "rgb(" + (red + color) + "," + color + "," + color + ")";
			// else
			// 	canvasContext.fillStyle = "rgba(" + (red + color) + "," + color + "," + color + "," + (1 - TimeRatio) + ")";
			// canvasContext.arc(X, Y, StartSize + (EndSize - StartSize) * Time / TotalTime, 0, 2 * Math.PI, false);
			// canvasContext.fill();
		}
	}

//----- Explosion Class -----
	function Explosions()
	{
		// var X = x, Y = y, PreDisplayTime = preDisplayTime, TargetSize = size, Size = 0, GrowMode = true;
		// if (IS_MOBILE || getFPS() < FPS_TOO_LOW) { TargetSize = TargetSize / 5; PreDisplayTime  = PreDisplayTime / 5; }

		this.update = function () {
			// if(PreDisplayTime > 0) {
			// 	PreDisplayTime--;
			// }else if(GrowMode) {
			// 	if(Size < TargetSize)
			// 		Size++;
			// 	else
			// 		GrowMode = false;
			// }else if(Size > 0) {
			// 	Size--;
			// }else{
			// 	Explosions.remove(this);
			// }
		};
		this.draw = function (canvasContext) {
			// if(PreDisplayTime <= 0) {
			// 	if(Size > 0)
			// 	{
			// 		var grad = canvasContext.createRadialGradient(X, Y, 0, X, Y, Size / 2);
			// 		grad.addColorStop(0, "rgb(255, 255, 0)");
			// 		grad.addColorStop(1, "rgb(255, 0, 0)");
			// 		canvasContext.beginPath();
			// 		canvasContext.fillStyle = grad;
			// 		canvasContext.arc(X, Y, Size / 2, 0, 2 * Math.PI, false);
			// 		canvasContext.fill();
			// 	}
			// }
		};
	}

//----- Debris Class -----
	function Debris()
	{
		// var X = x, Y = y, Dx = dx, Dy = dy, Time = time, TotalTime = time;
		// if (IS_MOBILE || getFPS() < FPS_TOO_LOW) TotalTime = TotalTime / 5;

		var This = this;
		this.update = function () {
			// if(Time-- > 0) {
			// 	X += Dx;
			// 	Y += Dy;

			// 	if (WORLD_WRAP)
			// 	{
			// 		if (X > WIDTH) X -= WIDTH; // if you reach the right side
			// 		else if (X < 0) X += WIDTH; // if you reach the left side

			// 		if (Y > HEIGHT - DRAW_BANNER_HEIGHT) Y = Math.abs(Y - HEIGHT); // If you reach the bottom... set you back at the top
			// 		else if (Y - DRAW_BANNER_HEIGHT < 0) Y = Math.abs(Y + (HEIGHT - DRAW_BANNER_HEIGHT) - 20); // If you reach the top (this works)... set you back at the bottom
			// 	}

			// 	Smokes.add(new Smoke(X, Y, 1, 7, 15, 150 * (Time / TotalTime)));
			// } else {
			// 	DebrisSet.remove(This);
			// }
		}
	}


