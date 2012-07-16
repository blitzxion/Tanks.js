/* tanks2.js 
	Created By : Richard Shaw
*/

// Lets begin...
(function(){

	var stats = new Stats();
	stats.setMode(0);
	stats.domElement.style.position = "absolute";
	stats.domElement.style.left = "0px";
	stats.domElement.style.bottom = "20px";
	document.body.appendChild(stats.domElement);

	WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight - 40; // Bottom banner height

	window.onload = function(){

		STAGE = new Kinetic.Stage({
			container: "container",
			width: WIDTH,
			height: HEIGHT
		});
		document.getElementById("container").style.height = HEIGHT + "px"; // So the bottom banner can freaking appear

		LAYER = new Kinetic.Layer();
		BULLETLAYER = new Kinetic.Layer();
		SMOKELAYER = new Kinetic.Layer();
		MSGLAYER = new Kinetic.Layer();
		BOOMLAYER = new Kinetic.Layer();
		DEBRISLAYER = new Kinetic.Layer();
		HPLAYER = new Kinetic.Layer();

		// Order of these matter, think z-index starting from 0
		STAGE.add(LAYER); // z-index of 0 (most tanks, etc are here)
		STAGE.add(SMOKELAYER);
		STAGE.add(DEBRISLAYER);
		STAGE.add(BULLETLAYER);
		STAGE.add(BOOMLAYER);
		STAGE.add(HPLAYER);
		STAGE.add(MSGLAYER);

		Setup();

		STAGE.onFrame(function(){ draw(); });

		// Start the fight!
		restart();
		STAGE.start();
		draw();
	};

	window.onresize = function(event) {
		STAGE.stop();
		WIDTHPREV = WIDTH;
		HEIGHTPREV = HEIGHT;
		WIDTH = window.innerWidth; /* big bag of WTF on iOS with orientation changes */
		HEIGHT = window.innerHeight - 40; /* stable on iOS */
		document.getElementById("container").style.height = HEIGHT + "px";
		STAGE.setSize(WIDTH,HEIGHT); // w x h
		// Move Items
		var xRatio = WIDTH / WIDTHPREV, yRatio = HEIGHT / HEIGHTPREV; //shapes = LAYER.getChildren();
		for(var n in Tanks)
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n]))
			{
				var t = Tanks[n];
				t.setX(t.getX() * xRatio);	/* adjust every object to a given resize ratio */
				t.setY(t.getY() * yRatio);
			}

		STAGE.start();
		draw();
	};

	function Setup()
	{
		// This is where teams will get created
		var currcolor = rndInt(0,TeamColors.length-1);
		for(var i=0; i<=NUM_TEAMS-1; i++, currcolor= (currcolor +1) % TeamColors.length)
			Teams[i] = new Team(TeamColors[currcolor],getName(4,7,null,null));

		// Init Pools
		Bullets.init();
		Smokes.init();
		Explosions.init();
		FlyingDebris.init();
	}

	function restart()
	{
		ChangeTerrain(); // Start new terrain
		// Need to create the starting team bases.

		countTotalProbability();
		// Need a method that resets the pool
		Tanks.clear();

		/* put opposite corners in this list so bases start opposite each other */
		var quadrants =
		[
			[0, Math.floor(WIDTH / 2), 0, Math.floor(HEIGHT / 2)], /* left top */
			[Math.floor(WIDTH / 2), WIDTH, Math.floor(HEIGHT / 2), HEIGHT], /* right bottom */
			[Math.floor(WIDTH / 2), WIDTH, 0, Math.floor(HEIGHT / 2)], /* right top */
			[0, Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2), HEIGHT] /* left bottom */
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
					y = rnd(BASE_HEAL_RADIUS, HEIGHT - BASE_HEAL_RADIUS);
				}
				else /* try to get further away */
				{
					var quad = quadrants[i % quadrants.length];
					x = rnd(quad[0], quad[1]);
					y = rnd(quad[2], quad[3]);
				}

				if (x < BASE_HEAL_RADIUS) x += BASE_HEAL_RADIUS;
				else if (x > WIDTH - BASE_HEAL_RADIUS) x -= BASE_HEAL_RADIUS;

				if (y < BASE_HEAL_RADIUS) y += BASE_HEAL_RADIUS;
				else if (y > HEIGHT - BASE_HEAL_RADIUS) y -= BASE_HEAL_RADIUS;

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
			Teams[i].addUnit(BaseType.Kind);
		}

	}

	function draw()
	{
		stats.begin();
		document.getElementById("bottomBanner").getElementsByTagName("div")[0].innerHTML = getFPS() + " FPS";
		
		// Draw/Activate items
		for(var n in Tanks)
		{
			if (Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
				Tanks[n].draw(); // Based off this tanks type, it will draw them and their position
				Tanks[n].doStuff(); // Will either make them move, fire, retreat, go stupid, or appear.
			}
		}

		Bullets.use(); // Move/Draw bullets
		Smokes.use();
		Explosions.use();
		FlyingDebris.use();

		// Loop thru Smokes : From Missles/Explosions/Crashes (its all inbetween)
		// Loop thru Explosions : When missles/bullets/planes (crash)/tanks dying on their target location
		// Loop thru Debris : This is the from Explosion for planes crashing... 

		LAYER.draw();
		BULLETLAYER.draw();
		SMOKELAYER.draw();
		BOOMLAYER.draw();
		DEBRISLAYER.draw();
		BOOMLAYER.draw();
		HPLAYER.draw();

		// Setup for the FPS counter
		var thisFrameTime = (thisLoop=new Date) - lastLoop;
		frameTime+= (thisFrameTime - frameTime) / filterStrength;
		lastLoop = thisLoop;
		stats.end();
	}

})();