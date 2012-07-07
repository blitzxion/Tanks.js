//----- Color Class -----
	function Color (r, g, b)
	{
		this.R = r;
		this.G = g;
		this.B = b;
		var This = this;

		this.getString = function()
		{
			return "rgb(" + This.R + "," + This.G + "," + This.B + ")";
		};

		this.getStringAlpha = function(alpha)
		{
			return "rgba(" + This.R + "," + This.G + "," + This.B + ", " + alpha + ")";
		}

		this.getStringAlphaPreferred = function(alpha)
		{
			if (IS_MOBILE) return this.getString();
			else return this.getStringAlpha(alpha);
		}
	}