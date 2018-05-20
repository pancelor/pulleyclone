		const mapping = {
		    0: "grass",
		    1: "dirt",
		    2: "tree",
		    3: "brick",
		    4: "mountains",
		    5: "potion",
		    6: "slime",
		    7: "hero",
		}

class actor
{

	constructor(x,y,type)
	{
		this.x = x;
		this.y = y;
		this.type = mapping[type];
	}

	draw(ctx)
	{
		var img = document.getElementById(this.type);
		ctx.drawImage(img, (this.x*64), (this.y*64));
	}

	update(playerdX,playerdY)
	{
		if (this.type == "hero")
		{
			if (playerdX == 1)
			{
				this.x += 1
				console.log(this.x,this.y)
			}
			if (playerdX == -1)
			{
				this.x += -1
				console.log(this.x,this.y)
			}
			if (playerdY == 1)
			{
				this.y += 1
				console.log(this.x,this.y)
			}
			if (playerdY == -1)
			{
				this.y += -1
				console.log(this.x,this.y)
			}
		}
		else if (this.type == "slime")
		{
			//console.log("goodbye")
		}
	}

}
