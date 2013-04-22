$(document).ready(function(){
	StartFalldown();
	iphone.init();
});

// Falldown
var Falldown;
function StartFalldown(){
Falldown = "";
document.getElementById("game").getContext("2d").clearRect(0,0,320,198);	// Clear canvas
document.getElementById("bolt-img").style.opacity = "";
document.getElementById("clock-img").style.opacity = "";
document.getElementById("reverse-img").style.opacity = "";
Controls = document.getElementById("controls").getElementsByTagName("div"); Controls[0].id = "Left"; Controls[2].id = "Right";	// Make sure controls are the right way round
// Get HiScore
if(!localStorage.getItem("high-score")){ localStorage.setItem("high-score",0); }
document.getElementById("tag-line").innerHTML = "High Score: "+localStorage.getItem("high-score");

Falldown = {
	Canvas		:	document.getElementById("game"),
	GameStarted	:	false,
	Score		:	0,
	HighScore	:	localStorage.getItem("high-score"),
	HighScoreAnnounced:	false,
	Difficulty	:	20,	// pixels/s
	dDifficulty	:	0.3,	// pixels/s^2
	Bounce		:	0.5,
	Items		:	[],
	Floors		:	[],
	Intervals	:	[],
	UpdateTime	:	new Date().getTime(),
	Ball		:	{
		r	:	7,
		x	:	160,	// pixels
		y	:	100,	// pixels
		vx	:	0,	// pixels/s
		vy	:	0,	// pixels/s
		ax	:	600,	// pixels/s^2
		ay	:	400,	// pixels/s^2
		vxc	:	300,	// const. (|vx| limit)
		vyc	:	200	// const. (|vy| limit)
	},
	Start		:	function(){
		if(this.GameStarted){ this.Resume(); return; }
		this.GameStarted = true;
		var h = this.Canvas.height+10;
		for(var i = 0; i < 5; i++){
			this.Floors.push(new this.Floor(this, h*(1+i/5)));
		}
		this.Items = [new this.Item("bolt"), new this.Item("clock"), new this.Item("reverse")];
		this.UpdateTime = new Date().getTime();
		this.Interval = setInterval(this.Update,1,this);
	},
	Resume		:	function(){
		this.UpdateTime = new Date().getTime();
		this.Interval = setInterval(this.Update,0,this);
	},
	Pause		:	function(){
		clearInterval(this.Interval);
		document.getElementById("tag-line").innerHTML = "PAUSED<br/><br/>Score: "+Math.floor(this.Score)+"<br/>High Score: "+this.HighScore;
		iphone.lock();
	},
	Announce	:	function(s){
        document.getElementById("announce").innerHTML = s;
        document.getElementById("announce").style["-webkit-animation"] = "Fade 1s ease-in-out";
        setTimeout(function(){
            document.getElementById("announce").style["-webkit-animation"] = "";
            document.getElementById("announce").innerHTML = "";
        },990);
	},
	Item		:	function(name){
		this.Active = false;
		this.Timer = 7000;
		this.Name = name;
		switch(name){
			case "bolt":
				this.Started	= function(fd){ fd.Ball.vxc *= 2; fd.Ball.ax *= 2; };
				this.Completed 	= function(fd){ fd.Ball.vxc /= 2; fd.Ball.ax /= 2; };
				this.AnnounceText = "Speedup!";
			break;
			case "clock":
				this.Started	= function(fd){ return; };
				this.Completed 	= function(fd){ return; };
				this.AnnounceText = "Slowmo!";
			break;
			case "reverse":
				this.Started	= function(fd){ var Controls = document.getElementById("controls").getElementsByTagName("div"); Controls[2].id = "Left"; Controls[0].id = "Right"; };
				this.Completed 	= function(fd){ var Controls = document.getElementById("controls").getElementsByTagName("div"); Controls[0].id = "Left"; Controls[2].id = "Right"; };
				this.AnnounceText = "Reverse!";
			break;
		}
	},
	ActivateItem:	function(name,id,fd){
		fd.Items[id].Timer = 7000;
		if(!fd.Items[id].Active){
			fd.Items[id].Started(fd);
			fd.Items[id].Active = true;
			//fd.Announce(fd.Items[id].AnnounceText);
		}
	},
	Floor		:	function(fd,y){
		this.y = y;
		this.Width = 6;
		this.Color = "rgb(50,50,50)";
		var GapWidth = 50, StarWidth = 20, BoltWidth = 20, ReverseWidth = 20, ClockWidth = 20;
		this.Gaps = [];
		this.Stars = [];
		this.Bolts = [];
		this.Reverses = [];
		this.Clocks = [];
		
		// Randomly add gaps and stars
		for(var i = 5, l = fd.Canvas.width-GapWidth-5; i < l; i+=5){
			var r = Math.random();
			if(r < 0.05){
				this.Gaps.push([i,i+GapWidth]);
				i += GapWidth+5;
			} else if(r < 0.06){
				this.Stars.push(i);
				i += StarWidth+5;
			} else if(r < 0.065){
				this.Clocks.push(i);
				i += ClockWidth+5;
			} else if(r < 0.07){
				this.Bolts.push(i);
				i += BoltWidth+5;
			} else if(r < 0.074){
				this.Reverses.push(i);
				i += ReverseWidth+5;
			}
		}
		if(this.Gaps.length == 0){	// Add one random gap if none added above
			var GapStartingPoint = Math.floor(Math.random()*(fd.Canvas.width-GapWidth-5))+5;
			this.Gaps = [[GapStartingPoint,GapStartingPoint+GapWidth]];
			this.Stars = []; this.Bolts = []; this.Reverses = []; this.Clocks = [];
		}
		
		this.Ascend	= function(Y){
			if(Y > 5){ Y = 5; }	// If it's moving more than 5 pixels/frame it might overtake the ball
			this.y -= Y;
		};
		
		this.Draw = function(Canvas,Color){
			var Context = Canvas.getContext("2d");
			Context.fillStyle = this.Color;
			Context.fillRect(0, this.y, this.Gaps[0][0], 6);
			for(var i = 1, l = this.Gaps.length; i < l; i++){
				Context.fillRect(this.Gaps[i-1][1], this.y, this.Gaps[i][0]-this.Gaps[i-1][1], this.Width);
			}
			Context.fillRect(this.Gaps[this.Gaps.length-1][1], this.y, Canvas.width-this.Gaps[this.Gaps.length-1][1], this.Width);
			for(var i = 0, l = this.Stars.length; i < l; i++){ 
				Context.drawImage(document.getElementById("star-img"),this.Stars[i],this.y-17,20,20);
			}
			for(var i = 0, l = this.Bolts.length; i < l; i++){ 
				Context.drawImage(document.getElementById("bolt-img"),this.Bolts[i],this.y-17,20,20);
			}
			for(var i = 0, l = this.Reverses.length; i < l; i++){ 
				Context.drawImage(document.getElementById("reverse-img"),this.Reverses[i],this.y-17,20,20);
			}
			for(var i = 0, l = this.Clocks.length; i < l; i++){ 
				Context.drawImage(document.getElementById("clock-img"),this.Clocks[i],this.y-17,20,20);
			}
		}
	},	
	Update		:	function(fd){
		var Time = new Date().getTime();
		if(Time - fd.UpdateTime > 100){ fd.UpdateTime = Time-10; }
		var dt = (Time-fd.UpdateTime)/1000;
		
		// Update ball velocity
		var vx = fd.Ball.vx, vy = fd.Ball.vy, ax = fd.Ball.ax, ay = fd.Ball.ay;
		if(document.getElementById("Left")["data-down"]){
			if(vx - ax*dt <= -fd.Ball.vxc){
				fd.Ball.vx = -fd.Ball.vxc;
			} else {
				fd.Ball.vx -= ax*dt;
			}
		}
		if(document.getElementById("Right")["data-down"]){
			if(vx + ax*dt >= fd.Ball.vxc){
				fd.Ball.vx = fd.Ball.vxc;
			} else {
				fd.Ball.vx += ax*dt;
			}
		}
		if(!document.getElementById("Right")["data-down"] && !document.getElementById("Left")["data-down"] && vx != 0){
			if(Math.abs(vx) <= ax*dt){
				fd.Ball.vx = 0;
			} else {
				fd.Ball.vx -= ax*vx/Math.abs(vx)*dt;
			}
		}
		if(vy != fd.Ball.vyc){
			if(vy + ay*dt >= fd.Ball.vyc){
				fd.Ball.vy = fd.Ball.vyc;
			} else {
				fd.Ball.vy += ay*dt;
			}
		}
		
		// Update floors
		for(var i = 0, l = fd.Floors.length; i < l; i++){
			fd.Floors[i].Color = "rgb("+Math.floor(255*(1-Math.abs(fd.Ball.y)/fd.Canvas.height))+","+Math.floor(255*Math.abs(fd.Ball.y)/fd.Canvas.height)+",0)";
			var Y = fd.Items[1].Active?fd.Difficulty/2:fd.Difficulty;
			fd.Floors[i].Ascend(Y*dt);
			if(fd.Floors[i].y <= -6){
				var floors = fd.Floors;
				var LowestFloor = floors.reduce(function(a, b) { return a.y > b.y ? a : b; });
				fd.Floors[i] = new fd.Floor(fd, LowestFloor.y+fd.Canvas.height/5+10)
			}
		}
		
		// Update difficulty
		fd.Difficulty += fd.dDifficulty*dt;
		
		// Check collisions
		var CollisionX = false, CollisionY = false;
		var x0 = fd.Ball.x, y0 = fd.Ball.y;
		var x1 = x0 + fd.Ball.vx*dt, y1 = y0 + fd.Ball.vy*dt;
		/*Context.fillStyle = "rgb(0,0,255)";
		Context.fillRect(x0, y0, 1, 1);
		Context.fillRect(x1, y1, 1, 1);*/
		var rx = fd.Ball.r;
		var ry = fd.Ball.r;
		for(var i = -1, l = fd.Floors.length; i < l; i++){
			var Floor = i==-1?{y:fd.Canvas.height,Gaps:[],Width:Infinity}:fd.Floors[i];
			//Check if relevant floor
			if(y1 > Floor.y-fd.Canvas.height/10 && y1 < Floor.y + Floor.Width + fd.Canvas.height/10){
				//Check if in gap
				var InGap = false;
				for(var j = 0, jl = Floor.Gaps.length; j < jl; j++){
					if(x0 > Floor.Gaps[j][0] && x0 < Floor.Gaps[j][1]){
						InGap = true;
						break;
					}
				}
				if(InGap){
					if(y0 + ry > Floor.y + Floor.Width && y0 - ry < Floor.y){
						//Inside gap
						if(x1-rx < Floor.Gaps[j][0]){
							//Hit side of gap from left
							fd.Ball.x = Floor.Gaps[j][0]+rx;
							fd.Ball.vx *= -fd.Bounce;
							break;
						}
						if(x1+rx > Floor.Gaps[j][1]){
							//Hit side of gap from right
							fd.Ball.x = Floor.Gaps[j][1]-rx;
							fd.Ball.vx *= -fd.Bounce;
							break;
						}
					}
				} else {
					if(y1+ry >= Floor.y && y0+ry < Floor.y){
						//Land on floor from above
						fd.Ball.y = Floor.y-ry + (i==-1?0.3:0);
						fd.Ball.vy *= -fd.Bounce;
						//console.log("Bounce")
					}
					if(y0+ry >= Floor.y && y0 + ry < Floor.y + Floor.Width){
						//Intersecting floor
						CollisionY = true;
						fd.Ball.y = Floor.y-ry + (i==-1?0.3:0);
						fd.Ball.vy = 0;
						//console.log("Adjust");
					}
				}
				if(i!=-1){ break; }
			}
		}
		if(x1+rx >= fd.Canvas.width){
			CollisionX = true;
			fd.Ball.x = fd.Canvas.width-rx;
			fd.Ball.vx *= -fd.Bounce;
		}
		if(x1-rx <= 0){
			CollisionX = true;
			fd.Ball.x = rx;
			fd.Ball.vx *= -fd.Bounce;
		}
		
		if(!CollisionX){ fd.Ball.x += fd.Ball.vx*dt; }
		if(!CollisionY){ fd.Ball.y += fd.Ball.vy*dt; }
			
		// Update item timers and check if expired
		for(var i = 0, l = fd.Items.length; i < l; i++){
			if(fd.Items[i].Active){
				fd.Items[i].Timer -= (Time-fd.UpdateTime);
				document.getElementById(fd.Items[i].Name+"-img").style.opacity = fd.Items[i].Timer/7000;
				if(fd.Items[i].Timer <= 0){
					// Timer completed
					fd.Items[i].Active = false;
					fd.Items[i].Completed(fd);
				}
			}
		}
		
		// Check if items collected
		for(var i = 0, l = fd.Floors.length; i < l; i++){
			Floor = fd.Floors[i];
			for(var j = 0, jl = Floor.Stars.length; j < jl; j++){
				if(fd.Ball.y >= Floor.y - 2*ry && fd.Ball.y - ry <= Floor.y && fd.Ball.x + rx >= Floor.Stars[j] && fd.Ball.x <= Floor.Stars[j] + 3*rx){
					Floor.Stars.splice(j,1);
					fd.Score += 50;
					fd.Announce("+50")
				}
			}
			for(var j = 0, jl = Floor.Bolts.length; j < jl; j++){
				if(fd.Ball.y >= Floor.y - 2*ry && fd.Ball.y - ry <= Floor.y && fd.Ball.x + rx >= Floor.Bolts[j] && fd.Ball.x <= Floor.Bolts[j] + 3*rx){
					Floor.Bolts.splice(j,1);
					fd.ActivateItem("bolt",0,fd);
				}
			}
			for(var j = 0, jl = Floor.Clocks.length; j < jl; j++){
				if(fd.Ball.y >= Floor.y - 2*ry && fd.Ball.y - ry <= Floor.y && fd.Ball.x + rx >= Floor.Clocks[j] && fd.Ball.x <= Floor.Clocks[j] + 3*rx){
					Floor.Clocks.splice(j,1);
					fd.ActivateItem("clock",1,fd);
				}
			}
			for(var j = 0, jl = Floor.Reverses.length; j < jl; j++){
				if(fd.Ball.y >= Floor.y - 2*ry && fd.Ball.y - ry <= Floor.y && fd.Ball.x + rx >= Floor.Reverses[j] && fd.Ball.x <= Floor.Reverses[j] + 3*rx){
					Floor.Reverses.splice(j,1);
					fd.ActivateItem("reverse",2,fd);
				}
			}
		}
		
		// Draw floors + ball
		var Context = fd.Canvas.getContext("2d");
		Context.clearRect(0, 0, fd.Canvas.width, fd.Canvas.height);
		for(var i = 0, l = fd.Floors.length; i < l; i++){
			fd.Floors[i].Draw(fd.Canvas);
		}
		Context.fillStyle = "rgb(255,0,0)";
		Context.beginPath();
		Context.arc(fd.Ball.x, fd.Ball.y, fd.Ball.r, 0, Math.PI*2, true); 
		Context.closePath();
		Context.fill();
		
		fd.Score += 10*dt;
		if(Math.floor(fd.Score) > fd.HighScore){
			fd.HighScore = Math.floor(fd.Score);
			if(!fd.HighScoreAnnounced){
				if(fd.HighScore > 0){ fd.Announce("HiScore!"); }
				fd.HighScoreAnnounced = true;
			}
		}
		//document.getElementById("Scoreboard").innerHTML = Math.round(100/dt)/100; //fps
		if(Math.floor(fd.Score) != document.getElementById("scoreboard").innerHTML){ document.getElementById("scoreboard").innerHTML = Math.floor(fd.Score); }
		
		if(fd.Ball.y + ry < 0){
			// Game Over
			clearInterval(fd.Interval);	// Stop game
			StartFalldown();	// Clear out Falldown object
			if(fd.HighScore > localStorage.getItem("high-score")){
				localStorage.setItem("high-score", fd.HighScore);
				document.getElementById("tag-line").innerHTML = "WELL DONE!<br/><br/>New High Score:<br/>"+fd.HighScore;
			} else {
				document.getElementById("tag-line").innerHTML = "GAME OVER!<br/><br/>Score: "+Math.floor(fd.Score)+"<br/>High Score: "+fd.HighScore;
			}
			iphone.lock();	// Return to splash
			return;
		}
		
		fd.UpdateTime = Time;
	}
}
}