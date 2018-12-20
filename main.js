(function(){
	//initialize web audio api
	var context;
	var audioList = {};
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();
	console.log("defined!");

	
	class Point{
		constructor(x,y){
			this.x = x;
			this.y = y;
		}
	}
	

	var canvas = document.getElementById("stage");
	var ctx = canvas.getContext("2d");

	var width = 1000;
	var height = 800;

	canvas.width = width;
	canvas.height = height;

	var mouse = new Point(0, 0);
	canvas.addEventListener("mousemove", function(event){
		mouse.x = event.x;
		mouse.y = event.y;
	});

	var mouseClickFlag = 0;
	var hVisibleList = [];
	canvas.addEventListener("mousedown", function(event){
		mouseClickFlag = 1;
		for(var i of hVisibleList){
			if(hits[i].clicked) continue;
			var h = hits[i];
			var r = hits[i].r;
			var x = event.x;
			var y = event.y;
			if(r*r <= (h.xx-x)*(h.xx-x) + (h.yy-y)*(h.yy-y)){
				hits[i].clicked = 1;
				console.log("clickcickickci!");
			}
		}
	});


	function readTextFile(func, file){
		var allText;
		var rawFile = new XMLHttpRequest();
		rawFile.open("GET", file, false);
		rawFile.onreadystatechange = function (){
			if(rawFile.readyState === 4){
				if(rawFile.status === 200 || rawFile.status == 0){
					allText = rawFile.responseText;
					func(allText);
				}
			}
		}
		rawFile.send(null);
	}

	var text;
	var osutext = "7850 Haru - March Handyman (Instrumental)/Haru - March Handyman (Instrumental) (Metroid) [Hard].osu";
	readTextFile(function(t){
			text = t.split("\n");
		}, osutext);
		
	console.log(text);	

	class HitObjects{
		constructor(x, y, time, type, hitSound){
			this.x = Number(x);
			this.y = Number(y);
			this.time = Number(time);
			this.type = Number(type);
			this.hitSound = Number(hitSound);	
			this.visible = 0;
			this.visibleprev = 0;	
			this.r = 50;
			this.point = 0;
			this.clicked = 0;
			this.duration = 30000;
			this.xx = this.x*(width/512);
			this.yy = this.y*(height/384);
		}

		locateOncanvas(){
			return new Point(
				this.x*(width/512),
				this.y*(height/384)
			);
		}
	}
	
	var hitobjs = [];
	{
		let flag = 0;
		for(var map of text){
			if(map.indexOf("[HitObjects]") != -1) flag = 1;
			if(map === "") flag = 0;
			if(flag) hitobjs.push(map);
		}
		hitobjs.shift();
	}

	hits = [];
	hitobjs.forEach(function(value, index, array){
		console.log(array[index]);
		var a = array[index].split(",");	
		var x = a[0];
		var y = a[1];
		var time = a[2];
		var type = a[3];
		var hitSound = a[4];
		hits.push(new HitObjects(x, y, time, type, hitSound));
	});
	console.log(hits);

	/*audio input!!*/
	function loadAudioSound(url, name) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';
	  
		// Decode asynchronously
		request.onload = function() {
		  context.decodeAudioData(request.response, function(buffer) {
			audioList[name] = buffer;
			console.log("loaded "+url+" -->"+name);
		  }, onError);
		}
		request.send();
	}

	function onError(){
		console.log("failed! to decodeAudioData");
	}

	function playSound(name, time=0) {
		var source = context.createBufferSource(); // creates a sound source
		source.buffer = audioList[name];                    // tell the source which sound to play
		source.connect(context.destination);       // connect the source to the context's destination (the speakers)
		source.start(time);                           // play the source now
												   // note: on older systems, may have to use deprecated noteOn(time);
	}

	loadAudioSound("test.mp3", "test");
	loadAudioSound("click.wav", "click");

	var playing = 0;
	var startTime;
	document.getElementById("Play").addEventListener("click", function(){
		playSound("test", 0);
		playing = 1;
		startTime = context.currentTime*1000;

		console.log(audioList);

		for(var h of hits){
			playSound("click", h.time/1000); 
		}
	}, false);

	document.getElementById("Click").addEventListener("click", function(){
		playSound("click");
		console.log("click");
	}, false);

	

	var t = 0;
	var num1 = 0;	
	var num2 = 0;
	//animating function
	function anime(){
		//only playing
		if(!playing) return;
		
		//now playing time
		t = context.currentTime*1000 - startTime;
		
		//clear rect
		ctx.clearRect(0,0,width,height);

		//loop each hitobjects
		hits.forEach(function(h, index, array){
			//store visible state
			h.visibleprev = h.visible;

			//judge visible
			if(t<h.time - h.duration || t>h.time){
				h.visible = 0;
			}
			else{
				h.visible = 1;
			}

			//recognize circle appearing
			if(h.visible==1 && h.visibleprev==0){	
				//push to visible list
				hVisibleList.push(index);
			}
			
			//recognize circle vanishing
			if(h.visible==0 && h.visibleprev==1){
				//pop from visible list
				hVisibleList.shift();

				//vanishing point zero drawing
				if(h.point==0){
					ctx.beginPath();
					var p = h.locateOncanvas();
					var x = p.x;
					var y = p.y;
					ctx.arc(x, y, h.r, 0,  2*Math.PI, true);
					ctx.fillStyle = "rgba(40, 40, 40, " + opacity +  ")";
					ctx.stroke();	
					return;
				}
			}	

			//continue if not visible
			if(!h.visible) return;

			//locating on canvas
			var p = h.locateOncanvas();
			var x = p.x;
			var y = p.y;

			//drawing circle
			if(h.point==0){
				ctx.beginPath();
				ctx.arc(x, y, h.r, 0,  2*Math.PI, true);
				var opacity = 1-(h.time-t)/h.duration;
				if(ctx.isPointInPath(mouse.x, mouse.y)){
					ctx.fillStyle = "rgba(0, 40, 40, " + opacity +  ")";
					if(mouseClickFlag){
						h.point = opacity;
						console.log(h.point);
					}
				}
				else{
					ctx.fillStyle = "rgba(255, 40, 40, " + opacity +  ")";
				}
				ctx.fill();	
				ctx.closePath();

				//drawing outer circle
				ctx.beginPath();
				var dr = h.r + (1-opacity)*h.r*1.5;
				ctx.arc(x, y, dr, 0,  2*Math.PI, false);
				ctx.stroke();
				ctx.closePath();
			}
			else{
				var pointText = "";
				var color = "black";
				if(h.point < 0.6){
					pointText = "Bad";
					color = "blue";
				}
				else if(h.point < 0.8){
					pointText = "Good";
					color = "green";
				}
				else if(h.point < 0.95){
					pointText = "Super";
					color = "orange";
				}
				else{
					pointText = "Excellent";
					color = "yellow";
				}
				ctx.fillStyle = color;
				ctx.fillText(pointText, x, y);
			}
			
		});

		mouseClickFlag = 0;
	}


	setInterval(anime ,1);

	/*
	setInterval(function(){
		playStart();
	}, 1000);
	*/

})();