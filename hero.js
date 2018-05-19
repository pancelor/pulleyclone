class hero
{

	constructor()
	{
		this.heroposx = 0;
		this.heroposy = 0;
	}

	findPositionX()
	{
		for (var i=0; i < mapArray.length; i++){
					for (var j=0; j < mapArray[i].length; j++){
						if(mapArray[i][j]==7){
							this.heroposx = i;
						}
						posX+=64;
					}
					posX=0;
					posY+=64;
				}
				posX=0;
				posY=0;
				return this.heroposx;
	}
				

	findPositionY()
	{
		for (var i=0; i < mapArray.length; i++){
					for (var j=0; j < mapArray[i].length; j++){
						if(mapArray[i][j]==7){
							this.heroposy = j;
						}
						posX+=64;
					}
					posX=0;
					posY+=64;
				}
				posX=0;
				posY=0;
				return this.heroposy;
	}

	move(hmove)
	{
		this.storetile = 0;
		hx = findPositionX();
		hy = findPositionY();

		if (hmove == "up")
		{
			hy -= 1;
			this.storetile = mapArray[hx][hy];
			mapArray[hx][hy];

		}
	}

}