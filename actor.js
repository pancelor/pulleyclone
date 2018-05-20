
function cantmove(newX, newY, actor){
	return (actor.x == newX) && (actor.y == newY);
}

class actor
{

	constructor(x,y,type)
	{
		this.x = x;
		this.y = y;
		this.type = type;
		this.HP
	}

	draw(ctx)
	{
		var img = document.getElementById(this.type);
		ctx.drawImage(img, (this.x*64), (this.y*64));
	}

	update(playerdX,playerdY)
	{
		var newX = this.x;
		var newY = this.y;

		var canmove = true;

		if (this.type == "hero")
		{
			if (playerdX == 1)
			{
				newX += 1;
			}
			if (playerdX == -1)
			{
				newX += -1;
			}
			if (playerdY == 1)
			{
				newY += 1;
			}
			if (playerdY == -1)
			{
				newY += -1;
			}

			for (var i=0; i < allObstacles.length; i++){
				if (cantmove(newX,newY,allObstacles[i]))
				{
					canmove =  false;
				}
		  	}
		  	

		  	if (canmove == true){
		  		this.x = newX;
				this.y = newY;
		  	}

		  	console.log(this.x);
			console.log(this.y);
		}
		else if (this.type == "slime")
		{
			//console.log("goodbye")
		}
	}

}
