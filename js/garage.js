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

// ---- UNITS ----
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
		TurnSpeed : .14,
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

// OLD SHIT
var Tanks = new Set("tankIndex");

// NEW SHIT
var Bullets = new BulletPool(50);
var Smokes = new SmokePool(1000);
var Explosions = new ExplosionPool(100);
var FlyingDebris = new DebrisPool(50);

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

		SetupMyGuns(); // Setup and adjusts guns for each unit.

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
		this.attackingTarget = function(target){return Type.AttackingUnit ? target === Target : false;}
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
			

			if(SHAPE != null)
			{
				if(HPBAR == null)
				{
					console.log("Creating new HPBAR");

					HPBAR = new Kinetic.Group({x:X-22, y:Y-22 });

					var Shell = new Kinetic.Rect({
						width:42,
						height:4,
						fill:"rgba(0,0,0,.5)",
						stroke:"black",
						strokeWidth:1,
					});

					var Bar = new Kinetic.Rect({
						x:.5, y:.5,
						width:41,
						height:3,
						fill:"green"
					});

					HPBAR.add(Shell);
					HPBAR.add(Bar);

					HPLAYER.add(HPBAR);
					HPBAR.hide(); // We're at full health, no need!
				}
				else
				{
					HPBAR.setPosition(X-22,Y-22);

				  	if(HitPoints < Type.HitPoints && HitPoints != 0)
					{
					 	if(!HPBAR.isVisible()) HPBAR.show(); // We're less than 100%, go!
					 	HPBAR.getChildren()[1].setWidth(41*(HitPoints/Type.HitPoints));

					 	if((HitPoints/Type.HitPoints) <= .50 && (HitPoints/Type.HitPoints) >= .26)
					 		HPBAR.getChildren()[1].setFill("yellow");
					 	else if((HitPoints/Type.HitPoints) <= .25)
					 		HPBAR.getChildren()[1].setFill("red");
					 	else
					 		HPBAR.getChildren()[1].setFill("green");
					}
					else
						HPBAR.hide();
				}
			}
			else if(SHAPE == null && HPBAR != null)
				LAYER.remove(HPBAR);
		}

		this.getHealCircleShape = function() { return HEALCIRCLE;} 
		this.drawCircle = function(sX, sY, radius, alpha)
		{
			if(HEALCIRCLE == null) // Always add if null
			{
				HEALCIRCLE = new Kinetic.Ellipse({
					x: sX, y: sY,
					radius: radius,
					fill: Team.getColor().getStringAlpha(alpha)
				});
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

						group.add(this.drawCircle(0,0,BASE_HEAL_RADIUS,.2)); // Draw Healing Circle
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

						group.on("click",function(){die();});
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

						//SHAPE.setScale(1); // This is fun! 1 = default, 2 = Large, .5 = Small! (any number will work)

						LAYER.add(SHAPE);
					}
					else
					{
						SHAPE.setPosition(X,Y);
						SHAPE.setRotation((Type.Kind == TankKindEnum.TURRET) ? TurretAngle : BaseAngle); // This rotates the parent, needs to happen always

						if(Type.Kind != TankKindEnum.TURRET)
						{
							try { // Try to rotate the turret, if it has one. The CHILD's angle is relative to the parent, to pos. it right, you need the diff
								SHAPE.getChildren()[1].setRotation(getAngleDifference(BaseAngle,TurretAngle));
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
						
						SHAPE.on("click",function(){
							die();
						});
						SHAPE.on("mouseover",function(){ writeMessage(
							SHAPE.name +
							((Type.Kind == TankKindEnum.TURRET) ? "\nTurretA=" + TurretAngle : "\nBaseA=" + BaseAngle) +
							"\nState#=" + State +
							"\nTurretBaseA=" + TargetBaseAngle + 
							((Target != null) ? "\nTrgt=" + Target.getShape().name : "")
						)});
						SHAPE.on("mouseout",function(){ writeMessage(""); });
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

					Cooldown = Type.CooldownTime;

					if ((new Date().getTime() - Team.getLastTargetFoundDate().getTime()) / 1000 > 10)
						Team.resetLastTargetFoundDate();

					if(Team.getScore() < getMAX_UNITS_PER_FACTION_ON_MAP())
					{
						if(TypeToMake.Kind == TankKindEnum.BUILDER)
						{
							var _TotalOfUnit = Team.getNumOfUnits();// GetNumOfType(TypeToMake,Team);
							var _TotalBasesBuilt = Team.getNumOfUnit(BaseType.Kind); //GetNumOfType(BaseType,Team);

							if ((_TotalBasesBuilt + _TotalOfUnit) >= getMAX_BASE_UNITS()) return; // Maxed out Bases!
						}

						if(TypeToMake.Kind == TankKindEnum.TURRET)
							if ((Team.getNumOfUnit(TankTypes[6].Kind) + Team.getNumOfUnit(TankTypes[7].Kind)) >= getMAX_BASE_DEFENSES()) return; // Maxed out defenses!

						//if(TypeToMake.Special && GetNumOfSpecials() >= getMAX_SPECIAL_UNITS()) return;

						/* Checking if there are any other units out there before building a healer tank. */
						if(TypeToMake.Kind == TankKindEnum.TANK && inArray(TypeToMake.BulletType,ShotType.HEAL) 
							&& Tanks.filter(function(element,index,array){if(element.getTeam()==team&&element.isAttacker())return element;}) <= 0)
								return;

						Tanks.add(new Tank(outX, outY, Team, TypeToMake, teamnum));
						Team.addUnit(TypeToMake.Kind); // Start using this to quickly loop thru teams units (just the type for now...)
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
							State = TankStateEnum.MOVE;
							break;
						case TankStateEnum.STOP_AND_GUARD: // 6
							State = TankStateEnum.MOVE;
							break;
					}

					break;
				case TankKindEnum.PLANE:
					switch (State)
					{
						case TankStateEnum.IDLE:
						case TankStateEnum.MOVE:
						case TankStateEnum.EVADE:
							moveForward();
							if(Math.random() < MOVE_PROB) TargetBaseAngle = 2 * Math.PI * Math.random();
							turnTurret();

							// if(inArray(Type.BulletType,ShotType.NONE))
							// 	This.takeDamage(1,null);							
							findTargets();

							break;
						case TankStateEnum.TARGET_AQUIRED:
							moveForward();
							if(Math.random() < MOVE_PROB) TargetBaseAngle = 2 * Math.PI * Math.random();
							turnTurret();
							State = TankStateEnum.MOVE;
							break;
						case TankStateEnum.CRASH_AND_BURN:
							moveForward();
							if(Math.random() < MOVE_PROB) TargetBaseAngle = 2 * Math.PI * Math.random();
							turnTurret();
							die();
							break;
					}
					if(Cooldown > 0) Cooldown--;

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
		this.takeDamage = function(damage, shooter)
		{
			HitPoints -= damage;

			Team.addTaken(damage);

			if(HitPoints <= 0)
			{
				if(Type.Kind === TankKindEnum.PLANE) State = TankStateEnum.CRASH_AND_BURN;
				else die();
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

			DRAW_TARGET_LINE = false; // True for now...
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
			DRAW_FOV = false;
			if(DRAW_FOV)
			{
				if(this.isBase() || this.isPlane()) return;

				var useThisAngle = TurretAngle;
				var useAttackAngle = Type.TurretAttackAngle;

				if(!Type.AttackingUnit)
				{
					useThisAngle = BaseAngle;
					useAttackAngle = 45;
				}
				else if(this.isPlane() && Target == null)
					useThisAngle = BaseAngle;

				if(debug.fov != null && debug.fov != undefined)
					LAYER.remove(debug.fov);
				
				debug.fov = new Kinetic.Shape({
					drawFunc: function(){
						var canvasContext = this.getContext();
						canvasContext.beginPath();
						canvasContext.strokeStyle = Team.getColor().getStringAlpha(.5);
						canvasContext.moveTo(X,Y);
						canvasContext.arc(X,Y,Type.SightDistance,useThisAngle - (Math.PI / 180) * useAttackAngle,useThisAngle + (Math.PI / 180) * useAttackAngle,false);
						canvasContext.closePath();
						canvasContext.stroke();
					}
				});

				LAYER.add(debug.fov);
				



			}
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
						movespeed = Target.getMoveSpeed();
				}

				X += movespeed * Math.cos(BaseAngle);
				Y += movespeed * Math.sin(BaseAngle);

				
				if (X > WIDTH) X -= WIDTH; // if you reach the right side
				else if (X < 0) X += WIDTH; // if you reach the left side

				if (Y > HEIGHT) Y = Math.abs(Y - HEIGHT); // If you reach the bottom... set you back at the top
				else if (Y < 0) Y = Math.abs(Y + HEIGHT); // If you reach the top (this works)... set you back at the bottom
				
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
			var gun, gunAmmo;
			
			if(Cooldown <= 0) // This unit is ready to fire!
			{
				for(b=0;b<=Type.BulletType.length;b++) // Loop thru all weapons
				{
					gun = Type.BulletType[b]; // Get this gun type

					if(gun == undefined || gun == ShotType.HEAL) continue;

					gunAmmo = Type.Gun[b]; // This lines up the BulletType wih the updated Gun

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

						//TurretSeparation
						if(Type.DoubleTurret) {
							Bullets.get(X + Math.cos(TurretAngle) * Type.BarrelLength + Math.cos(TurretAngle + Math.PI / 4) * Type.TurretSeparation, Y + Math.sin(TurretAngle) * Type.BarrelLength + Math.sin(TurretAngle + Math.PI / 4) * Type.TurretSeparation, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), gunAmmo.timetolive, Team, gunAmmo.damage, This, gun, Target, Type.AntiAircraft);
							Bullets.get(X + Math.cos(TurretAngle) * Type.BarrelLength + Math.cos(TurretAngle - Math.PI / 4) * Type.TurretSeparation, Y + Math.sin(TurretAngle) * Type.BarrelLength + Math.sin(TurretAngle - Math.PI / 4) * Type.TurretSeparation, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), gunAmmo.timetolive, Team, gunAmmo.damage, This, gun, Target, Type.AntiAircraft);
						} else {
							Bullets.get(
								X + Math.cos(TurretAngle) * Type.BarrelLength,
								Y + Math.sin(TurretAngle) * Type.BarrelLength, 
								speed * Math.cos(TurretAngle), 
								speed * Math.sin(TurretAngle), 
								gunAmmo.timetolive, 
								Team, 
								gunAmmo.damage, 
								This, 
								gun, 
								Target, 
								Type.AntiAircraft
							);
						}
						
						Cooldown = Type.CooldownTime;
						//Type.Gun[b].reloadtime = 100;
					}
				}
			}
			else
				Cooldown--;
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
				Explosions.get(X + Math.random() * 14 - 7, Y + Math.random() * 14 - 7, i * 2, 12 + Math.random() * 10);
			}

			var debris = Math.floor(3 + Math.random() * 4);
			if (IS_MOBILE || getFPS < FPS_TOO_LOW) debris = 2;

			for(i = 0; i < debris; i++) {
				var angle = Math.random() * 2 * Math.PI;
				var speed = Math.random() * 4 + .2;
				FlyingDebris.get(X, Y, Math.cos(angle) * speed + This.getDx(), Math.sin(angle) * speed + This.getDy(), Math.random() * 10 + 20);
			}
			
			LAYER.remove(SHAPE); // Bye!
			HPLAYER.remove(HPBAR);
			Team.setScore(Team.getScore() - 1);
			Team.removeUnit(Type.Kind);
			Tanks.remove(This);
		}

		Team.setScore(Team.getScore() + 1);
		Team.addScore(1);
		Team.addTicket();
	}

//----- Bullet Class -----
	//function Bullet(x,y,dx,dy,time,team,damage,shooter,type,target,airAttack)
	function Bullet()
	{
		var X, Y, Dx, Dy, Time, Team, Damage, Shooter, Type, Target, AirAttack, LastX, LastY, This, LastAngle, bShape;
		var exploded = false;
		this.inUse = false; 

		//Privileged:
		this.init = function()
		{
			bShape = new Kinetic.Rect({ width:1.5, height:1.5, fill: "yellow", visible : false });
			BULLETLAYER.add(bShape);
		}

		this.clear = function(){ this.inUse = false; };

		// Sets the obj's params and makes it usefull
		this.spawn = function(x,y,dx,dy,time,team,damage,shooter,type,target,airAttack)
		{
			X = x, Y = y, Dx = dx, Dy = dy, Time = time, Team = team, Damage = damage, Shooter = shooter, Type = type, Target = target;
			AirAttack = airAttack;
			LastX = x, LastY = y;
			This = this;
			LastAngle;
			exploded = false; // Just in case

			Damage = Damage * DAMAGE_MULTIPLIER;
			Damage = Math.floor(Damage); // Ensure we are only using whole numbers

			if(Damage <= 0) Damage = 1; // So the weak peeps can still attack

			if(Target != null && Tanks.contains(Target) && Type === ShotType.MISSLE)
				LastAngle = getAngleFromPoint(Target.getX(), Target.getY(), X, Y);

			this.inUse = true; // Important
		}

		this.use  = function(){
			if(exploded) return true;
			this.move();
			this.draw();
			return false;
		};

		this.move = function() {
			
			if(bShape == null || exploded) return;

			X += Dx;
			Y += Dy;
			Time--;

			if (X > WIDTH) X -= WIDTH; // if you reach the right side
			else if (X < 0) X += WIDTH; // if you reach the left side

			if (Y > HEIGHT) Y = Math.abs(Y - HEIGHT); // If you reach the bottom... set you back at the top
			else if (Y < 0) Y = Math.abs(Y + HEIGHT); // If you reach the top (this works)... set you back at the bottom

			if(Type === ShotType.MISSLE) {
				Smokes.get(X, Y, 2, 3, 20, 150);
				Smokes.get((X + LastX) / 2, (Y + LastY) / 2, 1, 3, 20, 150);
				//Smokes.add(new Smoke(X, Y, 2, 3, 20, 150));
				//Smokes.add(new Smoke((X + LastX) / 2, (Y + LastY) / 2, 1, 3, 20, 150));

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

			if(Time <= 0) explode();

			if(Type != ShotType.SHELL && Type != ShotType.BOMB)
			{
				// FOR LOOP! Need to loop thru units != to my team (instead of EVERYONE)
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

		this.draw = function()
		{
			if(exploded) return;
			if(!bShape.isVisible()) bShape.show();
			bShape.setPosition(X,Y);
		};

		this.getAngleFromPoint = function(x, y) { return getAngleFromPoint(x, y, X, Y); }

		//Private:
		function explode()
		{
			if(!exploded)
			{
				exploded = true; // This will give back this bullet to the pool!

				if(Type === ShotType.SHELL) {
					AreaDamage(X, Y, Damage, SHELL_DAMAGE_RADIUS * SHELL_DAMAGE_RADIUS, Shooter);
					Explosions.get(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, SHELL_DAMAGE_RADIUS);
				} else if(Type === ShotType.BOMB) {
					AreaDamage(X, Y, Damage, BOMB_DAMAGE_RADIUS * BOMB_DAMAGE_RADIUS, Shooter);
					Explosions.get(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, BOMB_DAMAGE_RADIUS);
				} else {
					Explosions.get(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, 6 + Math.random() * 3);
				}

				if(bShape != null && bShape != undefined) bShape.hide();
			}
		};
	}

//----- Smoke Class -----
	function Smoke()
	{
		var X, Y, StartSize, EndSize, TotalTime, Redness, Time;
		var sShape;
		var smoked = false;
		this.inUse = false; // True if the object is currently in use

		this.init = function(){
			Time = 0;
			sShape = new Kinetic.Ellipse({
				radius: 1,
				visible : false
			});
			SMOKELAYER.add(sShape);
		};

		this.clear = function(){
			this.inUse = false;
		};

		this.spawn = function(x, y, startSize, endSize, time, redness){
			X = x, Y = y, StartSize = startSize, EndSize = endSize, TotalTime = time, Redness = redness;
			smoked = false;
			Time = 0; // Always on spawn!
			sShape.setPosition(X,Y); // Only on spawn, no need to update all the time
			this.inUse = true;
		};

		this.use = function(){
			if(smoked) return true;
				this.update();
				this.draw();
				return false;
			};    

		this.update = function(){        
			if(sShape == null || smoked) return;

			if(Time < TotalTime) Time++;
			else SmokedOut();

		};

		this.draw = function(){
			if(smoked) return;

			if(!sShape.isVisible()) 
				sShape.show();

			var TimeRatio = Time / TotalTime;
			var color = Math.floor(25 + 75 * TimeRatio);
			var red = Math.floor(Redness * (1 - 4 * TimeRatio));

			if(red < 0) red = 0;
			if(red + color > 255) red = 255 - color;

			sShape.setFill("rgba("+(red+color)+","+color+","+color+","+(1-TimeRatio)+")");
			sShape.setRadius(StartSize + (EndSize - StartSize) * Time / TotalTime);
		};

		function SmokedOut()
		{
			if(!smoked)
			{
				smoked = true;
				if(sShape != null && sShape != undefined)
					sShape.hide();
			}
		}
	}

//----- Explosion Class -----
	function Explosion()
	{
		var X,Y,PreDisplayTime,TargetSize,Size,GrowMode;
		var eShape;
		var finished = false;
		this.inUse = false; // True if the object is currently in use

	this.init = function(){
		GrowMode = true;
		Size = 0;
		eShape = new Kinetic.Ellipse({
			radius: 10,
			visible : false
		});
		BOOMLAYER.add(eShape);
	};

	this.clear = function(){
		this.inUse = false;
	};

	this.spawn = function(x, y, preDisplayTime, size){
		X = x, Y = y, PreDisplayTime = preDisplayTime, 
		TargetSize = size, Size = 0, GrowMode = true;
		finished = false;
		eShape.setPosition(X,Y); // Only on spawn, no need to update all the time
		this.inUse = true;
	};

	this.use = function(){
		if(finished) return true;
		this.update();
		this.draw();
		return false;
	};    

	this.update = function(){        
		if(eShape == null || finished) return;

		if(PreDisplayTime > 0) {
			PreDisplayTime--;
		}else if(GrowMode) {
			if(Size < TargetSize) Size++;
			else GrowMode = false;
		}else if(Size > 0) {
			Size--;
		}else{
			ExplodedOut();
		}

	};

	this.draw = function(){
		if(finished) return;

		if(!eShape.isVisible()) eShape.show();

		if(PreDisplayTime <= 0 && Size > 0)
		{
			eShape.setFill({ 
				start: {x:0,y:0,radius:0},
				end: {x:0,y:0,radius:(Size/2)},
				colorStops : [0,'yellow',1,'red']
			});
			eShape.setRadius(Size/2);
		}

	};

		function ExplodedOut()
		{
			if(!finished)
			{
				finished = true;
				if(eShape != null && eShape != undefined)
					eShape.hide();
			}
		}
	}

//----- Debris Class -----
	function Debris()
	{
		var X,Y,Dx,Dx,Time,TotalTime;
		var smoked = false;
		this.inUse = false; // True if the object is currently in use

		this.init = function(){
			// Nothing for Debris at the moment
		};

		this.clear = function(){
			this.inUse = false;
		};

		this.spawn = function(x, y, dx, dy, time, redness){
			X = x, Y = y, Dx = dx, Dy = dy, Time = time, TotalTime = time;
			smoked = false;
			this.inUse = true;
		};

		this.use = function(){
			if(smoked) return true;
			this.update();
			return false;
		};    

		this.update = function(){        
			if(smoked) return;

			if(Time-- > 0)
			{
				X += Dx;
				Y += Dy;
				if(X > WIDTH) X -= WIDTH;
				else if(X < 0) X += WIDTH;

				if(Y > HEIGHT) Y = Math.abs(Y - HEIGHT);
				else if(Y < 0) Y = Math.abs(Y + HEIGHT);

				Smokes.get(X,Y,1,7,7,150 * (Time/TotalTime));
			}
			else
				SmokedOut();

		};

		function SmokedOut()
		{
			if(!smoked)
				smoked = true;
		}
	}

// Global Functions

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

