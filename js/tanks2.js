/* tanks2.js 
	Created By : Richard Shaw
*/

// Lets begin...
(function(){

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
		MSGLAYER = new Kinetic.Layer();
		STAGE.add(LAYER);
		STAGE.add(BULLETLAYER);
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
	}

	function restart()
	{
		ChangeTerrain(); // Start new terrain
		// Need to create the starting team bases.

		countTotalProbability();
		Tanks.clear();
		Bullets.clear();
		Explosions.clear();
		Smokes.clear();

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

				//console.log(x +", " + y);


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
		}

	}

	function draw()
	{
		document.getElementById("bottomBanner").getElementsByTagName("div")[0].innerHTML = getFPS() + " FPS";
		
		// Draw/Activate items
		for(var n in Tanks)
		{
			if (Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
				Tanks[n].draw(); // Based off this tanks type, it will draw them and their position
				Tanks[n].doStuff(); // Will either make them move, fire, retreat, go stupid, or appear.
			}
		}

		for(var n in Bullets)
		{
			if (Bullets.hasOwnProperty(n) && Bullets.contains(Bullets[n])) {
				Bullets[n].draw();
				Bullets[n].move();

			}
		}
		// Loop thru Bullets : Bullets are constaly moving between source/destination. They have a end State of MetDestination
		// Loop thru Smokes : From Missles/Explosions/Crashes (its all inbetween)
		// Loop thru Explosions : When missles/bullets/planes (crash)/tanks dying on their target location
		// Loop thru Debris : This is the from Explosion for planes crashing... 

		LAYER.draw();
		BULLETLAYER.draw();

		// Setup for the FPS counter
		var thisFrameTime = (thisLoop=new Date) - lastLoop;
		frameTime+= (thisFrameTime - frameTime) / filterStrength;
		lastLoop = thisLoop;
	}

})();