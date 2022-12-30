/* global web, visualization, ClassVisualization */

ClassVisualization.prototype.load_visualization = function(){

    var self = this;
    
    var sampleData = this.sampleData;

    var urlImg = "/samples/img_" + samples.currentSample + ".jpg";

    var urlGtColor = "/gtFile/gt_color_" + samples.currentSample + ".png";
    var urlGtBW = "/gtFile/gt_bw_" + samples.currentSample + ".png";
    
    
    var urlDetImg = "/methodFile/res_img_" + samples.currentSample + ".png";
     
    var urlDetImgPx = "/methodResults/px_img" + samples.currentSample + ".png";
     
    var urlDetImgAt = "/methodResults/res_atoms_det_" + samples.currentSample + ".png";
     
    var urlGtImgAt = "/methodResults/res_atoms_gt_" + samples.currentSample + ".png";
     
     

    var template =  "<div class='im_filters'><input type='radio' name='gt' value='0' id='gt0'><label for='gt0'>Image</label>"+
                    "<input type='radio' name='gt' value='1' id='gt1'><label for='gt1'>Atoms GT</label>"+
                    "<input type='radio' name='gt' value='2' id='gt2'><label for='gt2'>Pixels GT.</label>"+
                    "<input type='radio' name='gt' value='3' id='gt3' checked='checked'><label for='gt3'>Atom Classif.</label></div>"+      
                    "<div class='container_canvas'>" +
                    "<h3>Ground Truth</h3>" +
                    "<div id='div_canvas_gt'></div>" +
                   "</div>"+
                   "<div class='im_filters det'>"+
                    "<input type='radio' name='det' value='0' id='det0'><label for='det0'>Image</label>"+
                    "<input type='radio' name='det' value='1' id='det1'><label for='det1'>Detection</label>"+
                    "<input type='radio' name='det' value='2' id='det2'><label for='det2'>Pixels Eval.</label>"+
                    "<input type='radio' name='det' value='3' id='det3' checked='checked'><label for='det3'>Atom Classif.</label>"+            
                   "</div>"+
                   "<div class='container_canvas'>" +
                    "<h3>Detection</h3>" +
                    "<div id='div_canvas_det'></div>" +
                   "</div>"+
                   "<img id='img_gt_image2'><img id='img_det'><img id='img_det_px'><img id='img_det_at'>"+
                   "<img id='img_color'><img id='img_bw'><img id='img_bg_at'>"+
                   "<div id='div_sample_info'>"+
                   "<div id='div_logs'><h3>Evaluation Log</h3><span class='red'>loading..</span></div>";
                    "</div>";
    
    $("#div_sample").html(template);
    
    //if(!this.image_details_loaded){
        this.image_details_loaded=true;
        this.init_image_details();
    //}   
    this.image_loaded = false;
    this.det_image_loaded = false;
    this.det_image_px_loaded = false;
    this.det_image_at_loaded = false;
    
    this.gt_color_loaded = false;
    this.gt_bw_loaded = false;
    this.gt_image_at_loaded = false;
    
    
    this.draw();
    
    $("#div_sample").find("input").change(function(){
        self.draw();
    });
    
    $("#img_gt_image2").attr("src",urlImg).one("load",function(){
        self.image_loaded = true;
        self.im_w = this.width;
        self.im_h = this.height;
        self.scale = Math.min($("#div_canvas_gt").width()/self.im_w,$("#div_canvas_det").height()/self.im_h );
        self.zoom_changed();
        self.correct_image_offset();
        self.draw();
    });
    $("#img_det").attr("src",urlDetImg).one("load",function(){
        self.det_image_loaded = true;
        self.draw();
    });
    $("#img_det_px").attr("src",urlDetImgPx).one("load",function(){
        self.det_image_px_loaded = true;
        self.draw();
    });
    $("#img_det_at").attr("src",urlDetImgAt).one("load",function(){
        self.det_image_at_loaded = true;
        self.draw();
    });
    $("#img_color").attr("src",urlGtColor).one("load",function(){
        self.gt_color_loaded = true;
        self.draw();
    });
    $("#img_bw").attr("src",urlGtBW).one("load",function(){
        self.gt_bw_loaded = true;
        self.draw();
    });    
    $("#img_bg_at").attr("src",urlGtImgAt).one("load",function(){
        self.gt_image_at_loaded = true;
        self.draw();
    });    

    $("#div_logs").html("<div class='div_log'><h3>Evaluation Log</h3>" + sampleData.evaluationLog.replace(new RegExp("\n", 'g'),"<br/>") + "</div>");

    this.draw();

};

ClassVisualization.prototype.draw = function(){

    this.ctx_gt.clearRect(0,0,this.canvas_gt.width,this.canvas_gt.height);
    this.ctx_det.clearRect(0,0,this.canvas_gt.width,this.canvas_gt.height);
    
    if(!this.image_loaded){
        this.ctx_det.fillStyle = "rgba(255,0,0,1)";
        this.ctx_det.font= "12px Verdana";
        this.ctx_det.fillText("Loading image..", 20,60);
        this.ctx_gt.fillStyle = "rgba(255,0,0,1)";
        this.ctx_gt.font= "12px Verdana";
        this.ctx_gt.fillText("Loading image..", 20,60);
        
        return;
    }
    
    var numGt = $("input[name='gt']:checked").val();
    if( numGt==0){
        this.ctx_gt.drawImage(img_gt_image2,this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
    }else if( numGt==1){
        if(this.gt_color_loaded){
            this.ctx_gt.drawImage(img_color,this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
        }
    }else if( numGt==2){
        if(this.gt_bw_loaded){
            this.ctx_gt.drawImage(img_bw,this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
        }
    }else if( numGt==3){
        if(this.gt_image_at_loaded){
            this.ctx_gt.drawImage(img_bg_at,this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
        }
    }

    if (this.sampleData==null){
        this.ctx_gt.fillStyle = "rgba(255,0,0,1)";
        this.ctx_gt.font= "12px Verdana";
        this.ctx_gt.fillText("Loading method..", 20,60);        
        this.ctx_det.fillStyle = "rgba(255,0,0,1)";
        this.ctx_det.font= "12px Verdana";
        this.ctx_det.fillText("Loading method..", 20,60);
        return;
    }
    
    this.ctx_det.clearRect(0,0,this.canvas_gt.width,this.canvas_gt.height);
    
    var numDet = $("input[name='det']:checked").val();
    
    if( numDet==0){
        this.ctx_det.drawImage(img_gt_image2,this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
    }else if( numDet==1){
        if(this.det_image_loaded){
            this.ctx_det.drawImage(img_det,this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
        }
    }else if( numDet==2){
        if(this.det_image_px_loaded){
            this.ctx_det.drawImage(img_det_px,this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
        }
    }else if( numDet==3){
        if(this.det_image_at_loaded){
            this.ctx_det.drawImage(img_det_at,this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
        }
    } 
    this.ctx_det.strokeStyle = "rgba(0,0,0,1)";
    this.ctx_det.strokeRect(this.offset_x,this.offset_y,this.curr_im_w,this.curr_im_h);
    this.draws++;
};
