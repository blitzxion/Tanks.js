// teams.js

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


//----- Team Class -----
	function Team(color, name)
	{
		var Color = color,
			Name = name,
			Score = 0,
			TotalScore = 0,
			Taken = 0,
			Given = 0,
			UsedTickets = 0, // Used in Hard Mode
			LastTargetFound = new Date(),
			Units = new Set("UnitsIndex");

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
		this.getUnits = function(){return Units;}
		this.addUnit = function(unit){Units.add(unit);};
		this.removeUnit = function(unit){Units.remove(unit);};
		this.getNumOfUnits = function() {return Units.length;};
		this.getNumOfUnit = function(kind)
		{
			var i = 0;
			for(var t in Units) 
				if(Units[t] == kind)
					i++;

			return i;
		}

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
			Units = new Set("UnitsIndex");
		}
	}