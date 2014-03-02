game.module(
	'game.objects'
)
.body(function(){

	// Add in game assets here
	game.addAsset('media/tankBody.png','tank');

	// Add in custom classes here

	// Base Tank Class
	BaseTank = game.Class.extend({

		init : function(x, y){

			this.sprite = new game.Sprite(x, y, 'tank');
			this.sprite.anchor.x = this.sprite.anchor.y = 0.5; // Center of tank
			this.sprite.position.x = x;
			this.sprite.position.y = y;

			// Will determine random heading (rotation) here at somepoint
			//this.sprite.rotation = 0.2; //Math.random();


			game.scene.stage.addChild(this.sprite);
		},

		//
		move : function(x, y) {
			// based off the next x,y, we should rotate the body of the tank towards to the new heading

			heading = GetHeading(this.sprite.position.x, this.sprite.position.y, x, y);
			console.log(heading);

			// Change heading (face our new direction)
			var tRotation = new game.Tween(this.sprite);
			tRotation.to({rotation:heading});

			// Go towards our new position
			var tPosition = new game.Tween(this.sprite);
			tPosition.to({x:x, y:y}, 2000);
			tPosition.easing(game.Tween.Easing.Cubic.InOut);

			// I want to face my new direction first, then go to it
			tRotation.chain(tPosition);

			// Start moving
			tRotation.start();
		}

	});


	// Helpers
	function mod(x,y) {
		return (y - x) * Math.floor(y/x);
	}

	function GetHeading(x, y, dx, dy) { //(lon1, lat1, lon2, lat2) {
		//return mod( Math.atan2( Math.sin(lon2-lon1) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2-lon1) ), 2 * Math.PI);

		var deltaX = dx - x;
		var deltaY = dy - y;
		return Math.tan(deltaX/deltaY);

	}

	function randomIntFromInterval(min,max) {
        return Math.floor(Math.random()*(max-min+1)+min);
    }



});