game.module(
	'game.main'
)
.require(
	'engine.core',
	'game.objects'
)
.body(function() {

	SceneGame = game.Scene.extend({
		backgroundColor: 0x808080,

		init: function() {

			// Display the tank on the field
			var newTank = new BaseTank(200,200);

			this.addTimer(1000,function(){
				// Start moving the tank to this location
				newTank.move(randomIntFromInterval(200,500), randomIntFromInterval(200,500));
			});
		}


	});

	game.start();

});


function randomIntFromInterval(min,max) { return Math.floor(Math.random()*(max-min+1)+min); }