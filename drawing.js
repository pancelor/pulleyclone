class drawing
		{
			constructor()
			{

			}

			drawTree(x,y)
			{
					var c = document.getElementById("myCanvas");
		    		var ctx = c.getContext("2d");
		    		var img = document.getElementById("tree");
		    		ctx.drawImage(img, x,y);
			}

			drawBrick(x,y)
			{
					var c = document.getElementById("myCanvas");
		    		var ctx = c.getContext("2d");
		    		var img = document.getElementById("brick");
		    		ctx.drawImage(img, x,y);
			}

			drawMountain(x,y)
			{
					var c = document.getElementById("myCanvas");
		    		var ctx = c.getContext("2d");
		    		var img = document.getElementById("mountains");
		    		ctx.drawImage(img, x,y);
			}

			drawGrass(x,y)
			{
					var c = document.getElementById("myCanvas");
		    		var ctx = c.getContext("2d");
		    		var img = document.getElementById("grass");
		    		ctx.drawImage(img, x,y);
			}

			drawDirt(x,y)
			{
					var c = document.getElementById("myCanvas");
		    		var ctx = c.getContext("2d");
		    		var img = document.getElementById("dirt");
		    		ctx.drawImage(img, x,y);
			}

			drawBackground()
			{
				ctx.fillStyle = ("#cceefe");
				//Parematers are x,y, width and height
				ctx.fillRect(0,0,800,800);
			}

			drawMap(x,y)
			{
				for (var i=0; i < mapArray.length; i++){
					for (var j=0; j < mapArray[i].length; j++){
						if(mapArray[i][j]==0){
							var c = document.getElementById("myCanvas");
		    				var ctx = c.getContext("2d");
		    				var img = document.getElementById("grass");
		    				ctx.drawImage(img, posX, posY, 64, 64);

						}
						if(mapArray[i][j]==1){
							var c = document.getElementById("myCanvas");
		    				var ctx = c.getContext("2d");
		    				var img = document.getElementById("dirt");
		    				ctx.drawImage(img, posX, posY, 64, 64);
						}
						if(mapArray[i][j]==2){
							var c = document.getElementById("myCanvas");
		    				var ctx = c.getContext("2d");
		    				var img = document.getElementById("tree");
		    				ctx.drawImage(img, posX, posY, 64, 64);
						}
						if(mapArray[i][j]==3){
							var c = document.getElementById("myCanvas");
		    				var ctx = c.getContext("2d");
		    				var img = document.getElementById("brick");
		    				ctx.drawImage(img, posX, posY, 64, 64);
						}
						if(mapArray[i][j]==4){
							var c = document.getElementById("myCanvas");
		    				var ctx = c.getContext("2d");
		    				var img = document.getElementById("mountains");
		    				ctx.drawImage(img, posX, posY, 64, 64);
						}
						if(mapArray[i][j]==5){
							var c = document.getElementById("myCanvas");
		    				var ctx = c.getContext("2d");
		    				var img = document.getElementById("potion");
		    				ctx.drawImage(img, posX, posY, 64, 64);
						}
						if(mapArray[i][j]==6){
							var c = document.getElementById("myCanvas");
		    				var ctx = c.getContext("2d");
		    				var img = document.getElementById("slime");
		    				ctx.drawImage(img, posX, posY, 64, 64);
						}
						if(mapArray[i][j]==7){
							var c = document.getElementById("myCanvas");
		    				var ctx = c.getContext("2d");
		    				var img = document.getElementById("hero");
		    				ctx.drawImage(img, posX, posY, 64, 64);
						}
						posX+=64;
					}
					posX=0;
					posY+=64;
				}
				posX=0;
				posY=0;
			}

		} 