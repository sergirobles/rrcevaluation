/* global web */

var v=null;
var canvas=null;
var context=null;
var xml1 = null;

var xml_det = null;
var xml_res = null;

var w=700;
var h=960/(1280/700);
var cr=700/1280;

var seeking=false;
var playing=false;

var manual_change = false;
var current_frame = 0;

var num_image=0;

var objects_id=new Array();
var objects_color=new Array();
var objects_sequence=new Array();

var video_details_loaded=false;

var sequence_loaded = false;

var videoInfo = {name:"",fps:0,width:1280,height:960};

function pad (str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

ClassVisualization.prototype.load_visualization = function(){

    var sampleData = this.sampleData;
    
    num_image = getUrlParameter("sample");
    var template = "<div id='div_image_detail' style='background-color:#fff;'>" + 
        "<input type='hidden' id='inp_image_num' value='" + num_image + "' />" + 
        "<input type='hidden' id='inp_submit' value='$id_submit' />" + 
        "<input type='hidden' id='inp_num_images' value='24' />" +
        "<input type='hidden' id='challenge' value='3' />" +
        "<div id='div_navigation'>" +
            "<input type='radio' name='view_type' id='filter_view_type_0' value='0' checked='checked'><label for='filter_view_type_0'>Video Frames</label>" +
            "<input type='radio' name='view_type' id='filter_view_type_1' value='1'><label for='filter_view_type_1'>Sequences</label>" +
            "<span id='span_video_filters'>" +
                "<input type='checkbox' id='chk_show_gt' value='1' checked='checked'><label for='chk_show_gt'>Show G.T.</label>" +
                "<input type='checkbox' id='chk_show_res' value='1' checked='checked'><label for='chk_show_res'>Show Results</label>" +
                "<button onclick='legend()' style='position:absolute;right:120px;top:4px;'>Legend</button>" +
                "<button onclick='fs()' style='position:absolute;right:10px;top:4px;'>Full Screen</button>" +
                "<span id='span_filters_results'>" +
                "<input type='radio' name='filter_result' id='filter_result_0' value='0'><label for='filter_result_0'>ID's</label>" +
                "<input type='radio' name='filter_result' id='filter_result_1' value='1' checked='checked'><label for='filter_result_1'>Bounding Box Level</label>" +
                "<input type='radio' name='filter_result' id='filter_result_2' value='2'><label for='filter_result_2'>Object Level</label>" +
                "</span>"+
            "</span>" +            
        "</div>" + 
        "<div id='div_video_legend'>" +
            "<span class='legend' >GT Objects quality: <span class='color detection' style='border:3px solid #333;'>low</span> <span class='color detection' style='border:3px solid blue;'>moderate or high</span> </span>" + //#<span class='color detection' style='border:3px solid green;'>high</span>
            "<span class='legend' style='display:none;' id='legend_0'>Each detected object have a different color</span>" +
            "<span class='legend' style='display:block;' id='legend_1'>Object in the current frame: <span class='color object' style='background-color:rgb(0,180,0)'>Correct</span> <span class='color object' style='background-color:#C62828'>Not Correct</span> <span class='color object' style='background-color:#2196f3'>Switch</span> <span class='color object' style='background-color:#333'>Don't care</span></span>" +
            "<span class='legend' style='display:none;' id='legend_2'>Object in the whole sequence: <span class='color object' style='background-color:rgb(0,180,0)'>Correct</span> <span class='color object' style='background-color:#C62828'>Not Correct</span> <span class='color object' style='background-color:#333'>Don't care</span></span>" +
        "</div>"+ 
        
        "<div id='div_container'>"+
            "<video id='v' style=''>"+
            "Your browser does not support the video tag."+
            "</video>" + 

            "<div id='div_container_video'>" +
                "<canvas id='c'></canvas>" +
            "</div>" +
            
            "<div id='div_sequence_gt'></div>" +
            
            "<div id='div_sequence_det'></div>" +

        "</div>" +

        "<div id='div_video_controls'>" +
            "<p><span id='info'></span><span id='info2'></span></p>" +
            "<button onclick='play()' id='button_play'>Play</button>" +
            "<button onclick='pause()' id='button_pause' style='display:none;'>Pause</button>" +
            "<span style='display:inline-block;width:500px;' id='slider'></span>" +
            "<button onclick='prev_frame()'>Prev</button>" +
            "<button onclick='next_frame()'>Next</button>" +
        "</div><div id='div_logs'></div>";

    
    $("#div_sample").html(template);

    sequence_loaded=false;

    var video_info_url = "/gt_video_info/?ch=" + getUrlParameter("ch") + "&task=" + getUrlParameter("task") + "&eval=" + getUrlParameter("eval") + "&file=" + getUrlParameter("file")
             + "&sample=" + num_image;
			 
    $.get(video_info_url,function(data){
        
        videoInfo.name = data.name;
        videoInfo.id = data.id;
        videoInfo.fps = data.fps;
        videoInfo.numFrames = data.frames;
		
        frames_images = new Array();
        for (var i=0;i<videoInfo.numFrames;i++){
                frames_images[i] = null;
        }

        visualization.init();
    },"json");
	
};


ClassVisualization.prototype.init = function(){
	var sampleData = this.sampleData;

	var video_src = "/gt_video/?ch=" + getUrlParameter("ch") + "&task=" + getUrlParameter("task") + "&eval=" + getUrlParameter("eval") + "&file=" + getUrlParameter("file")
			 + "&sample=" + videoInfo.name + ".mp4";
	var video = document.getElementById('v');
	
	video.setAttribute("src", video_src);

	fps = videoInfo.fps;
	
	$("#span_image_num").text(num_image);

	var video_gt = "/gt_file/?ch=" + getUrlParameter("ch") + "&task=" + getUrlParameter("task") + "&eval=" + getUrlParameter("eval") + "&file=" + getUrlParameter("file") + "&gtv=" + getUrlParameter("gtv") 
			 + "&sample=" + videoInfo.name + "_GT.xml";
	$.ajax({
		"url":video_gt,
		dataType:"xml",
		success:function(xml){
			xml1 = xml;
		},error:function(err){
			xml1 = null;
			console.log("Error");
		}

	});

	$("#chk_show_res,#chk_show_gt,#span_filters_results input").click(draw_frame);
	


	$("#button_play").attr("enabled",false);


	v = document.getElementById('v');
	if(v==null){
		return;
	}
	canvas = document.getElementById('c');
	context = canvas.getContext('2d');
	
	v.addEventListener('loadeddata', function(){
		$("#button_play").attr("enabled",true);
		videoInfo.width = v.videoWidth;
		videoInfo.height = v.videoHeight;
		update_screen();
		next_frame();
	});	
	
	update_screen();
	canvas.width = w;
	canvas.height = h;
	
	$("#div_container_method").css({"height": ($(window).height()-80)+ "px"});
	
	v.addEventListener('timeupdate', function(){
		//update_time();
	});

	//v.playbackRate = 0.01;

	v.addEventListener('seeking', function(){
		seeking=true;
	   if(playing){
		   $("#info2").text("seeking..");
	   }
	});

	v.addEventListener('seeked', function(){
		seeking=false;
		if(playing){
			$("#info2").text("");
			draw_frame();
		}
	});
	
	
	v.addEventListener('loadedmetadata', function(){
		$("#slider").slider({
			min:0,
			value:0,
			max:v.duration*fps,
			stop:function(event,ui){
				console.log("slider stop() " + ui.value);
				
				v.currentTime = ui.value/fps;
				//current_frame =  ui.value;
				draw_frame();
			}
		});
		//draw_frame();
		
	});
	
	v.addEventListener('ended', function(){
		clearInterval(interval);
		playing=false;
		$("#button_play").css("display","inline-block");
		$("#button_pause").css("display","none");
		v.pause();

	},false);	
	

	$("#filter_result_0,#filter_result_1,#filter_result_2").click(function(){

		$("#legend_0").css("display",($("#filter_result_0").is(":checked")? "block":"none"));
		$("#legend_1").css("display",($("#filter_result_1").is(":checked")? "block":"none"));
		$("#legend_2").css("display",($("#filter_result_2").is(":checked")? "block":"none"));

		if (!playing){
			draw_frame();
		}
	});
	
	$("#filter_view_type_0,#filter_view_type_1").change(function(){
	   show_hide_type(); 
	});


	$("#div_image_detail").css({"height":($(window).height()-185) + "px" });
	

        for(var dtId in sampleData.dt) {
            sampleData.dt[dtId].color = get_new_color();
        }

        var video_visible = $("#filter_view_type_0").is(":checked");
        if(video_visible){                    
            draw_frame();
        }else{
            draw_sequence();
        }

		
};


function legend(){
    $("#div_video_legend").toggleClass("hidden");
    
}
function play(){
    $("#button_pause").css("display","inline-block");
    $("#button_play").css("display","none");
    playing=true;
    //v.currentTime = (current_frame)/fps;
    //draw();
    //next_frame();
    //v.currentTime = 0.00001 ;
    v.play();
    interval = setInterval( function () {
    if (v.readyState === v.HAVE_ENOUGH_DATA) {
        draw_frame();
    }
    },1000/videoInfo.fps);

}

function show_hide_type(){
    var video_visible = $("#filter_view_type_0").is(":checked");
    
    if(video_visible){
        
        $("#div_container_video,#div_video_controls").css("display","block");
        $("#span_video_filters").css("display","inline-block");
        $("#div_sequence_gt,#div_sequence_det").css("display","none");
        $("#div_video_legend").css("display","block");
        
        
    }else{
        $("#div_container_video,#div_video_controls,#span_video_filters").css("display","none");
        $("#div_sequence_gt,#div_sequence_det").css("display","block");
        
        $("#div_video_legend").css("display","none");
        
        draw_sequence();
    }
    
}

function next_frame(){
    current_frame++;
    draw_frame();
}
function prev_frame(){
    current_frame--;
    draw_frame();

}


function pause(){

	playing=false;

	clearInterval(interval);
	v.pause();
	console.log("pause() current=" + current_frame );
	setTimeout(function(){
		
		$("#button_play").css("display","inline-block");
		$("#button_pause").css("display","none");
		draw_frame();
	},10);
}

function sort_func(a,b){
    if (a.left!=b.left) return(a.left?-1:1);
    if (a.left)
        return (a.y<b.y)?-1:(a.y==b.y? 0 : 1);
    else
        return (a.y>b.y)?-1:(a.y==b.y? 0 : 1);
}

function draw_sequence(){
    if(sequence_loaded){
        return;
    }
    //web.pantalla_espera("loading objects sequences detection.. please wait");
    $("#div_sequence_gt").html("");
    $("#div_sequence_det").html("");
    
    //setTimeout(function(){
        

        var gtObjects = visualization.sampleData.gt;

        for (var gtId in gtObjects){
            
            var $div = $("<div>").addClass("sequence");
            
            $("#div_sequence_gt").append($div);
            
            var $title = $("<div>").addClass("title");
            var $objects = $("<div>").addClass("objectFrames hidden");
            
            $div.append($title);
            $div.append($objects);
            
            var results_sum = {"DC":0,"MATCH":0,"MISS":0,"SWITCH":0};

            for (var numFrame in gtObjects[gtId]) {
                
                
                    var points = visualization.sampleData.frames[numFrame].gt[gtId].p;
                    var new_points = sort_pol_points(points);
                    
                    var p1 = new_points[0].x + "_" + new_points[0].y;
                    var p2 = new_points[1].x + "_" + new_points[1].y;
                    var p3 = new_points[2].x + "_" + new_points[2].y;
                    var p4 = new_points[3].x + "_" + new_points[3].y;
                    
                    var str_type= gtObjects[gtId][numFrame];
                    
                    results_sum[str_type]++;
                
                    var html = "<div class='object " + str_type + "' data-frame='" + numFrame + "' data-p1='" + p1 + "' data-p2='" + p2 + "' data-p3='" + p3 + "' data-p4='" + p4 + "'>";

                    html += "<span class='frame'>" + numFrame;
                    
                    if (str_type=="MATCH" || str_type=="SWITCH"){
                        html += " (DT: " + visualization.sampleData.frames[numFrame].gt[gtId].dtId + ")";
                    }
            
                    html += "</span>";
                    //html += str_type;
                    html += "</div>"; 
                    
                    
                    $objects.append(html);
                
            }
            
            var gtTrans = visualization.sampleData.GT_OBJ_TXT[gtId];
            if(gtTrans==undefined){
                gtTrans = "";
            }else{
                gtTrans = " (" + gtTrans + ")";
            }
            html = "<span class='objId'>G.T. ID: <b>" + gtId + "</b>" + gtTrans + "</span>";
            
            if ((results_sum.MATCH + results_sum.SWITCH+ results_sum.MISS)>0){
                var percentage_tracked = Math.round( (results_sum.MATCH + results_sum.SWITCH)/(results_sum.MATCH + results_sum.SWITCH+results_sum.MISS)*100 );
                
                var classe = percentage_tracked>=80? "mostly" : (percentage_tracked>=20? "partially":"lost");
                var nom = percentage_tracked>=80? "Tracked" : (percentage_tracked>=20? "Partially":"Lost");
                
                html += "<span class='type tracked " + classe + "'>" + nom + " (" + percentage_tracked + "%)</span>";
            }else{
                html += "<span class='type tracked'>Don't Care</span>";
            }
            
            for(var type in results_sum){
                if(results_sum[type]>0){
                    html += "<span class='type " + type + "'>" + type + ": " + results_sum[type] + "</span>";
                }
            }            
            
            html += "<button class='pure-button button-secondary btn btn-default' onclick='load_object_images(this)'>images</button>";
            html += "<button class='pure-button button-secondary btn btn-default' onclick='see_frames(this)'>frames</button>";
            
            html += "<div class='clear'></div>";
            
            $title.html(html);
        }
        
        
        var dtObjects = visualization.sampleData.dt;

        for (var dtId in dtObjects){
            
            var $div = $("<div>").addClass("sequence");
            
            $("#div_sequence_det").append($div);
            
            var $title = $("<div>").addClass("title");
            var $objects = $("<div>").addClass("objectFrames hidden");
            
            $div.append($title);
            $div.append($objects);
            
            
            
            var results_sum = {"DC":0,"MATCH":0,"FP":0,"SWITCH":0};

            for (var numFrame in dtObjects[dtId]) {
                
                if(numFrame=="color"){
                    continue;
                }

                    var points = visualization.sampleData.frames[numFrame].dt[dtId].p;
                    
                    var new_points = sort_pol_points(points);
                    
                    var p1 = new_points[0].x + "_" + new_points[0].y;
                    var p2 = new_points[1].x + "_" + new_points[1].y;
                    var p3 = new_points[2].x + "_" + new_points[2].y;
                    var p4 = new_points[3].x + "_" + new_points[3].y;
                    
                    var str_type= dtObjects[dtId][numFrame];
                    
                    results_sum[str_type]++;
                
                    var html = "<div class='object " + str_type + "' data-frame='" + numFrame + "' data-p1='" + p1 + "' data-p2='" + p2 + "' data-p3='" + p3 + "' data-p4='" + p4 + "'>";

                    html += "<span class='frame'>" + numFrame;
                    
                    if (str_type=="MATCH" || str_type=="SWITCH"){
                        html += " (GT: " + visualization.sampleData.frames[numFrame].dt[dtId].gtId + ")";
                    }
            
                    html += "</span>";
                    
                    
                    $objects.append(html);
                
            }
            
            var detTrans = visualization.sampleData.DET_OBJ_TXT[dtId];
            html = "<span class='objId'>Detection ID: <b>" + dtId + "</b> " + detTrans + "</span>";

            if ((results_sum.MATCH + results_sum.SWITCH+ results_sum.FP)>0){
                var percentage_tracked = Math.round( (results_sum.MATCH + results_sum.SWITCH)/(results_sum.MATCH + results_sum.SWITCH+results_sum.FP)*100 );
                
                var classe = percentage_tracked>=80? "mostly" : (percentage_tracked>=20? "partially":"lost");
                var nom = percentage_tracked>=80? "Tracked" : (percentage_tracked>=20? "Partially":"Lost");
                
                html += "<span class='type tracked " + classe + "'>" + nom + " (" + percentage_tracked + "%)</span>";
            }else{
                html += "<span class='type tracked'>Don't Care</span>";
            }

            for(var type in results_sum){
                if(results_sum[type]>0){
                    html += "<span class='type " + type + "'>" + type + ": " + results_sum[type] + "</span>";
                }
            }
            
            html += "<button class='pure-button button-secondary btn btn-default' onclick='load_object_images(this)'>images</button>";
            html += "<button class='pure-button button-secondary btn btn-default' onclick='see_frames(this)'>frames</button>";
            
            html += "<div class='clear'></div>";
            
            $title.html(html);
        }

        $("div.object").click(function(){
           var frame = $(this).data("frame");
           $("#filter_view_type_0").prop("checked",true);
           $("#filter_view_type_0").trigger("change");
           current_frame = frame;
           draw_frame();

        });
        sequence_loaded = true;
}


function load_frame_image(num_frame,callback){
    if(frames_images[num_frame-1]==null){
        var image = new Image();
        frames_images[num_frame-1] = image;
        image.onload = callback;
        
        image.src = "/gt_video_frame/?ch=" + getUrlParameter("ch") + "&task=" + getUrlParameter("task") + "&eval=" + getUrlParameter("eval") + "&file=" + getUrlParameter("file")
             + "&sample=" + videoInfo.name + ".mp4&frame=" + num_frame;
        $("#info").html( " <span style='color:#f00;text-decoration:blink;'>loading frame image..</span>");
    }else{
        if(frames_images[num_frame-1].complete){
            callback();
        }else{
           $("#info").html( " <span style='color:#f00;text-decoration:blink;'>loading frame image..</span>");
        }
    }    
}

var last_frame_drawed = 0;
function draw_frame(){
    
	if (playing){
        if (v.readyState === v.HAVE_ENOUGH_DATA) {
            //context.clearRect(0,0,w,h);
            var second = Math.floor(v.currentTime);
            var minutes = (second-second%60)/60;
            var seconds = second%60;
            var millis = Math.floor((v.currentTime-second)*1000);
            var num_frame = Math.floor(v.currentTime*videoInfo.fps);
			
			if (num_frame!=current_frame){
				current_frame=num_frame;
				$("#info").html("Time: " + minutes + ":"+seconds + ":" + millis + " Frame:" + num_frame + " [time:" + v.currentTime + "] <span style='color:#f00;'>reproduction might have certain displacements with the ground truth</span>");
				$("#slider").slider("value",num_frame);
				context.clearRect(0,0,w,h);
				context.drawImage(v,0,0,w,h);  
				visualization.draw_frame_objects();		
			}else{
				$("#info").html("Time: " + minutes + ":"+seconds + ":" + millis + " Frame:" + num_frame + " [time:" + v.currentTime + "] <span style='color:#f00;'>reproduction might have certain displacements with the ground truth</span>");
			}
		}else{
			//context.clearRect(0,0,w,h);
			//context.drawImage(v,0,0,w,h);  
		}
	}else{
        if(current_frame==0) return;
        $("#info").text("Frame:" + current_frame);
        
        $("#slider").slider("value",current_frame);
        
        load_frame_image(current_frame,function(){
               context.clearRect(0,0,w,h);
               context.drawImage(frames_images[current_frame-1],0,0,w,h);  
               visualization.draw_frame_objects();
               $("#info").html("Frame: " + current_frame);
        });
        
	}

}

function sort_pol_points(points){
    var new_points = Array();

    var accum_x=0;
    var accum_y=0;
    for(var j=0;j<points.length/2;j++){

        accum_x += points[j*2];
        accum_y += points[j*2+1];
        new_points.push( {"x":points[j*2],"y":points[j*2+1],"left":false});
    }
    var mid_x = accum_x/new_points.length;
    for(var j=0;j<new_points.length;j++){
        var point = new_points[j];
        if (point.x<mid_x) point.left=true;
    }
    new_points.sort(sort_func);
    return new_points;
}

ClassVisualization.prototype.draw_frame_objects = function(){
    
    var num_frame = current_frame;
    //context.drawImage(v,0,0,w,h);
    context.lineWidth=2;
    

    if ( $("#chk_show_gt").is(":checked")){
        var gtObjects = this.sampleData.frames[num_frame].gt;

        for (var gtId in gtObjects){
            var type = gtObjects[gtId].r;
            var points = gtObjects[gtId].p;
            
            context.strokeStyle= type=="DC" ? '#333333' : 'blue';
            switch(type){
                case 'DC' : context.fillStyle='rgba(51,51,51,0.5)'; break;
                case 'MATCH' : context.fillStyle='rgba(0,90,0,0.5)'; break;
                case 'MISS' : context.fillStyle='rgba(198,40,40,0.5)'; break;
                case 'SWITCH' : context.fillStyle='rgba(33,150,243,0.5)'; break;
            }

            var new_points = sort_pol_points(points);
            context.beginPath();
            var initialPoint = new_points[0];
            context.moveTo( initialPoint.x/cr, initialPoint.y/cr);
            for(var k=1;k<new_points.length;k++){
                point = new_points[k];
                context.lineTo( point.x/cr, point.y/cr);
            }            
            context.lineTo( initialPoint.x/cr, initialPoint.y/cr);
            context.fill(); 
            context.stroke(); 
            context.fillStyle='white';
            context.font = 'bold 12px Arial';
            if ($("#filter_result_0").is(":checked")){
                context.fillText(gtId, initialPoint.x/cr, initialPoint.y/cr+14);
            }            
            
        }
    }
    
    if ( $("#chk_show_res").is(":checked")){
        var dtObjects = this.sampleData.frames[num_frame].dt;
        for (var dtId in dtObjects){
            var type = dtObjects[dtId].r;
            var points = dtObjects[dtId].p;

            context.strokeStyle= '#333333';
            switch(type){
                case 'DC' : context.fillStyle='rgba(51,51,51,0.5)'; break;
                case 'MATCH' : context.fillStyle='rgba(0,90,0,0.5)'; break;
                case 'FP' : context.fillStyle='rgba(198,40,40,0.5)'; break;
                case 'SWITCH' : context.fillStyle='rgba(33,150,243,0.5)'; break;
            }
            if ($("#filter_result_0").is(":checked")){
                context.strokeStyle = context.fillStyle;
                var color = this.sampleData.dt[dtId].color;
                context.fillStyle='rgba(' + color[0] + ','+ color[1] + ',' + color[2] + ',0.5)';                
            }

            var new_points = sort_pol_points(points);
            context.beginPath();
            var initialPoint = new_points[0];
            context.moveTo( initialPoint.x/cr, initialPoint.y/cr);
            for(var k=1;k<new_points.length;k++){
                point = new_points[k];
                context.lineTo( point.x/cr, point.y/cr);
            }            
            context.lineTo( initialPoint.x/cr, initialPoint.y/cr);
            context.fill(); 
            context.stroke(); 
            context.fillStyle='white';
            context.font = 'bold 12px Arial';
            if ($("#filter_result_0").is(":checked")){
                context.fillText(dtId, initialPoint.x/cr, initialPoint.y/cr+14);
            }            
            
        }
    }
/*
    if ( $("#chk_show_gt").is(":checked")){

        var frame = $(xml1).find("frame")[num_frame-1];
        var objects = $(frame).find("object");
        if (objects.length){
            //console.log("frame " + num_frame + ": " +objects.length + " objects");
            for(var i=0;i<objects.length;i++){
                var object = objects[i];

                var quality = $(object).attr("Quality").toLowerCase();

                switch(quality){
                    case "low":context.strokeStyle= 'rgba(51,51,51,1)';break;
                    case "moderate":context.strokeStyle= 'blue';break;
                    case "high":context.strokeStyle= 'green';break;
                }

                var points = $(object).find("Point");
                var new_points = sort_pol_points(points);

                context.beginPath();
                var point = new_points[0];
                context.moveTo( point.x/cr, point.y/cr);
                for(var k=1;k<new_points.length;k++){
                    point = new_points[k];
                    context.lineTo( point.x/cr, point.y/cr);
                }
                var point = new_points[0];
                context.lineTo( point.x/cr, point.y/cr);
                context.stroke();
            }
            }
        }*/

};



function fs() {
    var navegador = navegador_pantalla_completa();
    if (navegador){
          if (!document.fullscreenElement &&    // alternative standard method
              !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
            if (document.getElementById("div_image_detail").requestFullscreen) {
              document.getElementById("div_image_detail").requestFullscreen();
            } else if (document.getElementById("div_image_detail").mozRequestFullScreen) {
              document.getElementById("div_image_detail").mozRequestFullScreen();
            } else if (document.getElementById("div_image_detail").webkitRequestFullscreen) {
              document.getElementById("div_image_detail").webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
          } else {
            if (document.cancelFullScreen) {
              document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
              document.webkitCancelFullScreen();
            }
          }
       }else{
           alert("your browser don't support Fullscreen");
       }
}

function see_frames(el){
    $(el).parent().parent().find("div.objectFrames").toggleClass("hidden");
}

function load_object_images(el){
    $(el).parent().parent().find("div.objectFrames").removeClass("hidden");
    
    var $objects = $(el).parent().parent().find("div.object");
    $(el).remove();
    $objects.each(function(){
        
        var frame = $(this).data("frame");
        
        var $object = $(this);
        
        load_frame_image(frame,function(){
            
                var p1 = $object.data("p1").split("_");
                var p2 = $object.data("p2").split("_");
                var p3 = $object.data("p3").split("_");
                var p4 = $object.data("p4").split("_");

                var left = Math.min(p1[0],p2[0],p3[0],p4[0]);
                var top = Math.min(p1[1],p2[1],p3[1],p4[1]);
                var right = Math.max(p1[0],p2[0],p3[0],p4[0]);
                var bottom = Math.max(p1[1],p2[1],p3[1],p4[1]);

                var width = right-left+1;
                var height = bottom-top+1;


                var canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                var context = canvas.getContext('2d');
                
                context.beginPath();
                context.moveTo(parseInt(p1[0])-left, parseInt(p1[1])-top);
                context.lineTo(parseInt(p2[0])-left, parseInt(p2[1])-top);
                context.lineTo(parseInt(p3[0])-left, parseInt(p3[1])-top);
                context.lineTo(parseInt(p4[0])-left, parseInt(p4[1])-top);
                context.lineTo(parseInt(p1[0])-left, parseInt(p1[1])-top);
                context.closePath();
                context.clip();                
                
                context.drawImage(frames_images[frame-1],left,top,width,height,0,0,width,height);  

                //context.fillRect(0,0,width,height);

                $object.append(canvas);
               //$("#info").html("Frame: " + current_frame);
        });
        

        
        
    });
    
}

function navegador_pantalla_completa(){
    var elem = document.getElementById("div_image_detail");
    return (elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen);
}

function update_screen(){

    setTimeout(function(){
            
        if (in_fs){
            $("#div_image_detail").css({"position":"absolute","left":"0px","top":"0px","right":"0px","bottom":"0px","width":"auto","height":"auto"});            
        }else{            
            $("#div_image_detail").css({"position":"relative","width":"auto","height":($(window).height()-185) + "px"   });
        }
        cr = Math.max(videoInfo.width/$("#div_container").width(),videoInfo.height/$("#div_container").height());
        
        w=videoInfo.width/cr;
        h=videoInfo.height/cr;

        canvas.width=w;
        canvas.height=h;
        
        //cr = 1/cr;
        //cr = 1;

        //$("#div_container").css("left",w)
        $("#div_container_video").css({"width":w + "px"});

        draw_frame();            
            
    },100);

}

var in_fs=false;
document.addEventListener("fullscreenchange", function () {
    in_fs = document.fullscreen;
    update_screen();
}, false);
document.addEventListener("mozfullscreenchange", function () {
    in_fs = document.mozFullScreen;
    update_screen();
}, false);
document.addEventListener("webkitfullscreenchange", function () {
    in_fs = document.webkitIsFullScreen;
    update_screen();
}, false);


function get_new_color(){
    var color = color_aleat_hsv(Math.random(),0.5,0.95);
    while ($.inArray(color,objects_color)>-1){
        color = color_aleat_hsv(Math.random(),0.5,0.95);
    }
    return color;
}


function color_aleat_hsv(h,s,v){
    var h_i = Math.round(h*5);
  var f = h*6 - h_i;
  var p = v * (1 - s);
  var q = v * (1 - f*s);
  var t = v * (1 - (1 - f) * s);

  var r,g,b;
  switch(h_i){
      case 0:r = v;g=t;b=p;break;
      case 1:r = q;g=v;b=p;break;
      case 2:r = p;g=v;b=t;break;
      case 3:r = p;g=q;b=v;break;
      case 4:r = t;g=p;b=v;break;
      case 5:r = v;g=p;b=q;break;
  }

    return ( new Array(Math.min(255,Math.round(r*255)),Math.min(255,Math.round(g*255)),Math.min(255, Math.round(b*255))) );
  //return ( rgbToHex(Math.min(255,Math.round(r*255)),Math.min(255,Math.round(g*255)),Math.min(255, Math.round(b*255))) );
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

