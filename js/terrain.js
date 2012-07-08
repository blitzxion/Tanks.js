// terrain.js
var tcIndex,
	terrainColors = [
		//[148, 92, 18], // Mud
		[39,40,34], //darkness
		// [57,118,40], // Tundra
		// [216, 213, 201], // Desert
		// [177,173,165], // Snow
		// [175, 128, 74], //mars
		// [112, 128, 144],  // Moon
		// [0,0,0], // space!
		// [98,146,134], //rain
		// [198, 191, 165], //slate
		// [117, 113, 75], //field
		// [181, 144, 92], //wood
		// [145, 158, 88], //greenish
		// [32, 22, 12], //darkish brown
		// [83, 64, 60], //chocolate
		// [77, 52, 21], //poop
		// [47, 1, 73], //galaxy purple
		// [13, 44, 75], //blue ocean
		// [46, 68, 94] //ocean 2
	];

	function ChangeTerrain()
	{
		tcIndex = Math.floor(Math.random()*terrainColors.length); // Change up the next map terrain
		document.getElementsByTagName('body')[0].style.backgroundColor = "rgb("+terrainColors[tcIndex].toString()+")";
	}

	