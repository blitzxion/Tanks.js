// utils.js

var STAGE,
	LAYER,
	MSGLAYER,
	WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight;
	WIDTHPREV = WIDTH,
	HEIGHTPREV = HEIGHT,
	ANIMATION_ID = null,
	FPS_TOO_LOW = 45;

var IS_IPAD = navigator.platform === 'iPad',
	IS_IPHONE = navigator.platform === 'iPhone',
	IS_ANDROID = navigator.userAgent.toLowerCase().indexOf("android") != -1,
	IS_IOS = IS_IPAD || IS_IPHONE || navigator.userAgent.indexOf("iPod") != -1,
	IS_MOBILE = IS_IOS || IS_ANDROID;

var ROUND = 0, // func RESET() increases this on new rounds.
	NUM_TEAMS = IS_MOBILE ? 2 : IS_IPAD ? 3 : 5, // This is the max amount on the playing field.
	TEAMS_ALIVE = NUM_TEAMS,
	RANDOM_COLORS = true,
	RANDOM_TERRAIN = true,
	GOD_MODE = false, // While enabled, click methods will fire
	DRAW_GOD_MODE_HELP = false,
	MAP_MIN_LOC = 20,
	SCORE_TO_WIN = IS_MOBILE ? 2000 : 30000,
	WINNING_TEAMS = [],
	DAMAGE_MULTIPLIER = 1, // 1 is normal, 0 will screw up the unit! increase/decrease for desired output
	WORLD_WRAP = true, // AWESOME, when this is off the tanks will bounce on the edges... LEAVE IT ON!
	IN_SPACE = false; // Looks best if RANDOM_TERRAIN is disabled

// Variable properties for some of the tanks, or all of them, i don't care
var MAX_UNITS_ON_SCREEN = IS_MOBILE ? 10 : 80,
	getMAX_UNITS_PER_FACTION_ON_MAP = function() { return Math.floor(MAX_UNITS_ON_SCREEN / TEAMS_ALIVE); },
	getMAX_BASE_UNITS		        = function() { return Math.floor((getMAX_UNITS_PER_FACTION_ON_MAP() * .1)) }, 		/* 10% can be bases */
	getMAX_BASE_DEFENSES			= function() { return Math.floor((getMAX_UNITS_PER_FACTION_ON_MAP() * .3)) }, 		/* 30% can be defenses */
	getMAX_SPECIAL_UNITS			= function() { var max = Math.floor((getMAX_UNITS_PER_FACTION_ON_MAP() * .1) / 2); if (max <1) return 1; return max; },
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
	MAX_MISSLE_ROTATION = .4,
	MIN_BASE_DISTANCE_SQUARE =  MIN_SEPERATION_OF_STARTING_BASES + (WIDTH / 5);

var TotalProb;

// FPS Related Vars
var filterStrength = 20,
	frameTime = 0, lastLoop = new Date, thisLoop,
	roundStartTime;

console.log("MAX Units (of all teams): " + getMAX_UNITS_PER_FACTION_ON_MAP());

// DEBUG Stuff
var DRAW_TARGET_LINE = false,
	DRAW_RANGE_CIRCLE = false,
	DRAW_DISTANCE_CIRCLE = false,
	DRAW_FOV = false;

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

//----- Set class  -----
	function Set(indexName)
	{
		var IndexName = indexName;
		var Index = 0;
		this.length = 0;

		this.add = function(item) {
			if(this.contains(item))
				return;
			item[IndexName] = Index;
			this[Index] = item;
			Index++;
			this.length++;
		};

		this.clear = function() {
			for(var n in this)
			if(this.contains(this[n]))
				this.remove(this[n]);
			Index = 0;
			this.length = 0;
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
			this.length--;
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

//----- Utils -----

	function countTotalProbability()
	{
		TotalProb = 0;
		for(var i = 0; i < TankTypes.length; i++)
			TotalProb += TankTypes[i].Prob;
	}

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

	// This is new. Since groups will persiste the parent (the group) angle, the children's angels are RELATIVE to that, so you might need to do this...
	// http://www.codeproject.com/Articles/59789/Calculate-the-real-difference-between-two-angles-k
	function getAngleDifference(a1,a2)
	{
		var diff = a2 - a1;
		while(diff < -180) diff += 360;
		while(diff > 180) diff -= 360;
		return diff;
	}

//----- JS Utils -----

	function rnd(min, max) { return Math.random() * (max - min) + min; } /* Returns a random number between min and max */

	function rndInt(minv, maxv) { if (maxv < minv) return 0; return +Math.floor(Math.random()*(maxv-minv+1)) + minv; } /* Returns a random integer between min and max */

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

	function writeMessage(message) {
		MSGLAYER.removeChildren();
		MSGLAYER.clear();
		if(message != "")
		{
			var text = new Kinetic.Text({
				x: 10, y: 10,
				stroke: '#555', strokeWidth: 5, fill: '#ddd',
				text : message,
				fontSize: 18, fontStyle: "italic", textFill: "#555",
				width: 400, padding: 20,
				shadow: { color: 'black', blur: 1, offset: [10, 10], alpha: 0.2 }
			});
			MSGLAYER.add(text);
		}
		MSGLAYER.draw();
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

	function getFPS(){ return (1000/frameTime).toFixed(1); }

	Array.Max = function(array){ return Math.max.apply(Math,array); };

	Array.prototype.compare = function(testArr){
		if(this.length != testArr.length) return false;
		for(var i = 0; i < testArr.length; i++){
			if(this[i].compare){
				if(!this[i].compare(testArr[i])) return false;
			}
			if(this[i] !== testArr[i]) return false;
		}
		return true;
	};