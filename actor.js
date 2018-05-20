
function cantmove(newX, newY, actor){
	return (actor.x == newX) && (actor.y == newY);
}

class actor
{

	constructor(x,y,type, maxhp, atk, def)
	{
		this.x = x;
		this.y = y;
		this.type = type;
		this.maxhp = maxhp;
		this.hp =  maxhp;
		this.atk = atk;
		this.def = def;
		this.dead = false;
	}

	draw(ctx)
	{
		var img = document.getElementById(this.type);
		ctx.drawImage(img, (this.x*64), (this.y*64));
		this.drawMaxHP(ctx);
		this.drawHealth(ctx);
	}

	drawMaxHP(ctx)
	{
		ctx.fillStyle = "#c5648f";
		ctx.fillRect(((this.x*64)+((64-this.maxhp)/2)), ((this.y*64)-5), this.maxhp, 10);
	}

	drawHealth(ctx)
	{
		ctx.fillStyle = "#ff6b7d";
		ctx.fillRect(((this.x*64)+((64-this.maxhp)/2)), ((this.y*64)-5), this.hp, 10);
	}

	drinkPotion(direction)
	{

		for (var i=0; i < allPotions.length; i++){
				if (this.x == allPotions[i].x && this.y == allPotions[i].y)
				{
					if (allPotions[i].dead == false){
						this.hp = this.maxhp;
						allPotions[i].dead = true;
					}
				}
		  	}

	}

	doAttack(direction){
		
		var newX = this.x;
		var newY = this.y;

		var other;

		// 0=right 1=left 2=down 3=up
		if (direction == 0)
		{
			newX += 1;
		}
		if (direction == 1)
		{
			newX += -1;
		}
		if (direction == 2)
		{
			newY += 1;
		}
		if (direction == 3)
		{
			newY += -1;
		}

		if (this.type == "hero")
		{
		  	for (var i=0; i < allSlimes.length; i++){
				if (cantmove(newX,newY,allSlimes[i]))
				{
					other = allSlimes[i];
				}
		  	}
		}
		else if (this.type == "slime")
		{
			if (cantmove(newX,newY,myHero))
				{
					other = myHero;
				}
		}  	

		if (other)
		{
			var damage = (Math.max((this.atk-other.def), 1)*Math.floor(Math.random() * 6) + 1)
			other.hp -= damage;
			if (other.hp <= 0)
			{
				other.dead = true;
			}
		}

	}

	update(direction)
	{
		if (this.type == "hero")
		{
			this.moveActor(direction);
			this.doAttack(direction);
			this.drinkPotion(direction);
		}
		else if (this.type == "slime")
		{
			var direction = Math.floor(Math.random() * 3) + 0;
			this.moveActor(direction);
			this.doAttack(direction);
		}
	}

	moveActor(direction)
	{
		var newX = this.x;
		var newY = this.y;

		var canmove = true;


		// 0=right 1=left 2=down 3=up
		if (direction == 0)
		{
			newX += 1;
		}
		if (direction == 1)
		{
			newX += -1;
		}
		if (direction == 2)
		{
			newY += 1;
		}
		if (direction == 3)
		{
			newY += -1;
		}

			for (var i=0; i < allObstacles.length; i++){
				if (cantmove(newX,newY,allObstacles[i]))
				{
					canmove =  false;
				}
		  	}
		  	
		  	for (var i=0; i < allSlimes.length; i++){
				if (cantmove(newX,newY,allSlimes[i]))
				{
					if (allSlimes[i].dead == false){
						canmove =  false;
					}
				}
		  	}

		  	if (cantmove(newX,newY,myHero))
				{
					canmove =  false;
				}

			if (newX < 0 || newX > 9 || newY < 0 || newY > 9)
				{
					canmove =  false;
				}	

		  	if (canmove == true){
		  		this.x = newX;
				this.y = newY;
		  	}

	}

}

class nonactor
{
	constructor(x,y,type)
	{
		this.x = x;
		this.y = y;
		this.type = type;
		this.dead = false;
	}

	draw(ctx)
	{
		var img = document.getElementById(this.type);
		ctx.drawImage(img, (this.x*64), (this.y*64));
	}

}
