var configuration;

$(function() {

    load_config(function(){


    });

    $("[data-bs-toggle='tooltip']").each(function(){
        new bootstrap.Tooltip($(this)[0], [])
    });

    $("#sampleResults").change(function(){
      if($("#sampleResults").prop("checked")){
          $("#div_config_samples").removeClass("d-none");
        }else{
          $("#div_config_samples").addClass("d-none");
        }
    });

    $("#buttonMetrics,#buttonMetricsSample").click(function(){
      edit_json_method_params(this);

    });


    $(document).on("click","div.card.sample",function(){
        let num = $(this).data("num");
        let id = $(this).data("id");
        show_sample(num,id);

    });    
    

    let modalTask = document.getElementById("modalTask");

    $("#btnSaveTask").click(function(){
        save_config();
  
      });
      $("#btnValidate").click(function(){
        validate_config();
  
      });      
      
      

    $("#form_validate").submit(function(ev){

        ev.preventDefault();

        const output = document.querySelector("#div_validate_response");
        const formElement = document.querySelector("#form_validate");
        const request = new XMLHttpRequest();
        request.open("POST", "http://localhost:9020/validate");
        request.responseType = 'json';

        output.innerHTML = `<div class='alert alert-info'>Please wait, validating results..</div>`   

        request.onload = (progress) => {

            if( request.status === 200 ){

                var jsonResponse = request.response;

                if (jsonResponse.result){
                    output.innerHTML = `<div class='alert alert-success'><i class="bi bi-check-circle-fill"></i> The method is valid</div>`   
                }else{
                    output.innerHTML = `<div class='alert alert-danger'>Error. The method is not valid.<br><strong>${jsonResponse.msg}</strong></div>`   
                }

            }else{
                output.innerHTML = `<div class='alert alert-danger'>Error ${request.status} occurred when trying to upload your file</div>`   
            }
          };

        request.send(new FormData(formElement));

    });


    $("#form_evaluate").submit(function(ev){

        $("#form_evaluate input[type='submit']").prop("disabled",true);

        

        ev.preventDefault();

        const output = document.querySelector("#div_evaluate_response");
        const formElement = document.querySelector("#form_evaluate");
        const request = new XMLHttpRequest();
        request.open("POST", "http://localhost:9020/evaluate");
        request.responseType = 'json';

        output.innerHTML = `<div class='alert alert-info'>
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>Please wait, calculating results..</div>`   

        request.onload = (progress) => {

            if( request.status === 200 ){

                var jsonResponse = request.response;

                if (jsonResponse.result){

                    //if (!configuration.samples){
                    //    output.innerHTML = `<div class='alert alert-success'><i class="bi bi-check-circle-fill"></i> Method calculated.</div>`   
                    //}else{
                        

                        if(jsonResponse.samplesUrl!=undefined){
                            output.innerHTML = `<div class='alert alert-success'><i class="bi bi-check-circle-fill"></i> Method calculated. Downloading results..</div>`   
                            $.post("/download_results",{"url":jsonResponse.samplesUrl},function(data){
                                if(data.result){
                                    output.innerHTML = `<div class='alert alert-success'><i class="bi bi-check-circle-fill"></i> Method calculated & Sample Results Downloaded</div>`   
                                }else{
                                    output.innerHTML = `<div class='alert alert-danger'>Error downloading the results file. <br><strong>${jsonResponse.msg}</strong></div>`   
                                    $("#form_evaluate input[type='submit']").prop("disabled",false);
                                }
                            },"json");
                        }else{
                            output.innerHTML = `<div class='alert alert-danger'>Error. Parameter <strong>samplesUrl</strong> missing on the results</div>`   
                            $("#form_evaluate input[type='submit']").prop("disabled",false);
                        }
                    //}

                }else{
                    output.innerHTML = `<div class='alert alert-danger'>Error. The method is not valid.<br><strong>${jsonResponse.msg}</strong></div>`   
                    $("#form_evaluate input[type='submit']").prop("disabled",false);
                }

            }else{
                $("#form_evaluate input[type='submit']").prop("disabled",false);
                output.innerHTML = `<div class='alert alert-danger'>Error ${request.status} occurred when trying to upload your file</div>`   
            }
          };
        request.onerror = () => {
            output.innerHTML = `<div class='alert alert-danger'>Error ${request.status} occurred when evaluating your file</div>`   
            $("#form_evaluate input[type='submit']").prop("disabled",false);
        }

        try{
            request.send(new FormData(formElement));
        }catch(err){
            output.innerHTML = `<div class='alert alert-danger'>Error ${err} occurred when evaluating your file</div>`   
            $("#form_evaluate input[type='submit']").prop("disabled",false);
        }

    });    

    modalTask.addEventListener('shown.bs.modal', () => {
        load_config(function(data){

            if (data.methodMetrics == undefined) {
                data.methodMetrics = {}
            }

            if (data.sampleMetrics == undefined) {
                data.sampleMetrics = {}
            }

                $("#inputGroundTruth").val(data.gt_path);

                $("#sampleResults").prop("checked", data.samples);

                if($("#sampleResults").prop("checked")){
                    $("#div_config_samples").removeClass("d-none");
                  }else{
                    $("#div_config_samples").addClass("d-none");
                  }                

                if(data.samples){
                  $("#div_samples").removeClass("d-none");
                }else{
                  $("#div_samples").addClass("d-none");
                }

                $("#selectResultsExt").val(data.res_ext);

                $("#selectVisualization").val(data.visualization);


                $("#inputMethodMetricsVal").val(JSON.stringify(data.methodMetrics));

                $("#inputMethodMetrics").val(Object.keys(data.methodMetrics).join(", "));
                

                if (CKEDITOR.instances.inputUploadInstructions == undefined){
                    CKEDITOR.replace( 'inputUploadInstructions' );
                }
                
                CKEDITOR.instances.inputUploadInstructions.setData(data.uploadInstructions);

                if(Object.keys(data.sampleMetrics).length>0){
                    $("#inputSampleMetricsVal").val(JSON.stringify(data.sampleMetrics));
                    $("#inputSampleMetrics").val(Object.keys(data.sampleMetrics).join(", "));
                }else{
                    $("#inputSampleMetricsVal").val("{}");
                    $("#inputSampleMetrics").val("");
                }

                $("#inputSamples").val(data.samples_path);
                
            });
        });
});

function load_config(callback){
    fetch('./config')
    .then((response) => {
        response.json().then((data) => { 
            configuration = data;
            $("input.gtField").val("/var/www/gt/" + configuration.gt_path);
            $("span.gtField").text("/var/www/gt/" + configuration.gt_path);

            callback(data);
        });
    })
    .catch((err) => { 
        console.log("Error reading config file.");
    });
}


function save_config(){

    let fields = $("#modalTask form").serializeArray();
    let out = {};

    for(var i=0;i<fields.length;i++){

        let field = fields[i];
        
        if(field.name=="methodMetrics" || field.name=="sampleMetrics"){
            var value = {};
            try{
                value = JSON.parse(field.value)
            }catch{
                value = {};
            }
            out[field.name] = value
        }else if (field.name=="uploadInstructions") {
            out[field.name] = CKEDITOR.instances.inputUploadInstructions.getData();
        }else{
            out[field.name] = field.value;    
        }
    }
    //changing to boolean
    out["samples"] = out["samples"]=="on";

    $("#modalTask #div_msg").html("");
    $.post("./save_config", {"config":JSON.stringify(out)},function(data){
        
        
        if(data.result){
            configuration = out;
            $("#modalTask").modal('hide');
        }else{
            $("#modalTask #div_msg").html(data.msg);
        }

    },"json");
}

function validate_config(){
    $.get("./validate_config",function(data){
        if(data.result){
            html = '<div class="alert alert-success">Configuration is correct</div>';
        }else{
            html = '<div class="alert alert-warning">Error: ' + data.msg + '</div>';
        }
        $("#div_validation").html(html);

    },"json");
}

function escapeQuotes (string) {
    return string.replace(/'/g, "&#39;");
}

    function uniqId() {
      var id = Math.round(new Date().getTime() + (Math.random() * 100));
      while($("#" + id).length){
          id = Math.round(new Date().getTime() + (Math.random() * 100));
      }
      return id;
  }
  function html_modal_content(id,large,title,html,html_footer){


    var modal_html = '<div class="modal fade" id="' + id + '" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">' +
    '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable' + (large? ' modal-xl' : '') + '">' +
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h1 class="modal-title fs-5" id="staticBackdropLabel">' + title + '</h1>' +
          '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'+
        '</div>' +
        '<div class="modal-body">' + html + '</div>';

 if(html_footer!=""){
    modal_html += "<div class='modal-footer'>" + html_footer + "</div>";
}
modal_html += '</div>'+
  '</div>'+
'</div>';    
return modal_html;
};
function mostrar_modal_html(title,html,html_footer,id,large,callback){
    if (id==undefined){
        id = uniqId();
    }else if (id==""){
        id = uniqId();
    }
    if(large==undefined){
        large=false;
    }
    if(!$("#" + id).length){
        $("body").append(html_modal_content(id,large,title,html,html_footer));
    }

    $("#" + id).find('[data-toggle="tooltip"]').tooltip();


    const myModalEl = document.getElementById(id)
    const myModal = new bootstrap.Modal(myModalEl, {})
        
    myModalEl.addEventListener('hidden.bs.modal', event => {
        $("#" + id).remove();
    });

        myModal.show();

    if(callback!=undefined){
        callback();
    } 

    return id;
};
    function edit_json_method_params(el){
        var $input = $(el).closest("div").find("input");
        var $textarea = $(el).closest("div").find("textarea");

        mostrar_modal_html("Configurate Parameters","<table class='table table-striped table-sm' id='div_fields'><thead>" + html_header() + "</thead><tbody></tbody></table><button class='btn btn-primary add'><i class='bi bi-plus'></i></button><div id='div_alert_wrap'></div>","<span></span>","json_props",true,function(){
            var $dialog = $("#json_props");
            var params = {};
            if ($input.val().length>0){
                params = JSON.parse($input.val());
            }
            for (var param in params) {
                $dialog.find("#div_fields tbody").append(html_new_param(param,params[param]));
            }

            $dialog.find("button.add").click(function(){
                $dialog.find("#div_fields tbody").append(html_new_param("",""));
                $dialog.find("#div_fields tbody").sortable({
                    // items:'div.param.sort',
                    // handle: ".handle"
                 });
            });




            $dialog.on("click","button.treure",function(){
                $(this).closest("tr.param").remove();
            });

            var $button = $("<button>Save</button>").addClass("btn btn-success").click(function(){

                $("#json_props #div_alert_wrap").html("");
                var result = {};
                var count_order_graphic = [0,0,0,0,0,0];
                var error = false;
                $dialog.find("tr.param").not(".header").each(function(){
                    if ($(this).find("input[name='name']").val()!=""){
                        if($(this).find("select[name='order']").val()!=""){

                            var graphic_num = $(this).find("select[name='grafic']").val();
                            if(graphic_num!=""){
                                count_order_graphic[graphic_num-1]++;
                            }
                        }
                        result[$(this).find("input[name='name']").val()] = {
                            "long_name":$(this).find("input[name='long_name']").val(), 
                            "type":$(this).find("select[name='type']").val(),
                            "order":$(this).find("select[name='order']").val(),
                            "grafic":$(this).find("select[name='grafic']").val(),
                            "format":$(this).find("select[name='format']").val(), 
                            "groupby":$(this).find("select[name='groupby']").val(),
                            "separation":$(this).find("select[name='separation']").val(),
                            "table_group_name":$(this).find("input[name='table_group_name']").val(),
                            "graphic_name":$(this).find("input[name='graphic_name']").val(),
                            //"formula":$(this).find("input[name='formula']").val()
                        };
                    }
                });
                var any = false;
                for (var i=0;i<6;i++){
                    if(count_order_graphic[i]>0){
                        any = true;
                    }
                    if(count_order_graphic[i]>1){
                        show_error("Select only one parameter order for each grafic");
                        error=true;
                        return;
                    }
                }
                if (!any){
                    show_error("Select one parameter order");
                    error=true;
                    return;
                }
                if(!error){
                    $input.val(JSON.stringify(result));
                    $textarea.val(Object.keys(result).join(", "));

                    $dialog.modal("hide");
                }

            });
            $dialog.find("div.modal-footer").append($button);    
        });

        function addColumn(title,width,info){
            return "<th><span style='display:inline-block;width:" + width + "px;'>" + title + " <a href='#' data-toggle='tooltip' data-placement='bottom' title='" + info + "'><i class='bi bi-info-circle-fill'></i></a></span>";
        }
        function html_header(){
            var html = "<tr class='param header'>";
            html += "<th><span style='display:inline-block;width:30px;'></span>";
            html += addColumn("Reference",90,"Property reference as appears in the results of the evaluation");
            html += addColumn("Title",100,"Property name");
            html += addColumn("Type",80,"Type of the parameter. (int/double/string)");
            html += addColumn("Order",70,"This field is used to rank the methods in Ascending or Descending order. Only one paramter for grafic is allowed.");
            html += addColumn("Show",110,"not in grafic / grafic1 / grafic 2<br>The methods ranking page allow to display one or 2 graphics plotting the methods results values. You must select at least one paramter for ‘graphic 1’ and optionally one parameter for ‘graphic 2’. These parameters are the only ones that must have the field ‘order’ specified.");
            html += addColumn("Format",110,"Normal / percentage. If set to percentage, the results will be showed in percent. (Result of that field should be float values from 0-1)");
            html += addColumn("Grup by",90,"Method / Property. Decides if the results graphic are grouped by methods or properties");
            html += addColumn("Separator",80,"None / Left / Right . Shows a vertical separator on the results table");
            html += addColumn("Table group name",90,"Used to group similar properties (Repeat the same title on each property). If defined, it appears on a row over the property tile. ");
            html += addColumn("Graphic title",90,"If defined, this title will be shown on the header of graphic");
            html += "<th><span style='display:inline-block;width:30px;'></span>";
            //html += addColumn("Formula",100,"Field value is calculated with a math formula. Paramter names inside brackets. Ex: ([Recall]+[Precision]/2)");

            html += "</tr>";
            return html;
        }
        function html_new_param(name,properties){
            var html = "<tr class='param form-inline input-group-sm sort'>";

            console.log(properties);
            html += "<td><span class='handle'><i class='bi bi-arrow-down-up'></i></span></td>";
            
            html += "<td><input class='form-control' type='text' class='form-control' name='name' value='" + name + "' maxlength='50' /></td>";
            html += "<td><input class='form-control' type='text' class='form-control' name='long_name' maxlength='45' value='" + escapeQuotes(properties.long_name!= undefined ? properties.long_name : "") + "' /></td>";
            html += "<td><select class='form-control' name='type'>";
            var types = ['integer','double','string'];
            for(var i=0;i<types.length;i++){
                var selected = (properties.type == types[i] ? " selected='selected'" : "");
                html += "<option" + selected + " value='" + types[i] + "'>" + types[i] + "</option>";    
            }
            html += "</select></td>";
            var orders = ['','asc','desc'];
            html += "<td><select class='form-control' name='order'>";
            for(var i=0;i<orders.length;i++){
                var selected = (properties.order == orders[i] ? " selected='selected'" : "");
                html += "<option" + selected + " value='" + orders[i] + "'>" + orders[i] + "</option>";    
            }
            html += "</select></td>";
            var grafic = ['','1','2','3','4','5','6'];
            var grafic_names = ['not in grafic','grafic 1','grafic 2','grafic 3','grafic 4','grafic 5','grafic 6'];
            html += "<td><select class='form-control' name='grafic'>";
            for(var i=0;i<grafic.length;i++){
                var selected = (properties.grafic == grafic[i] ? " selected='selected'" : "");
                html += "<option" + selected + " value='" + grafic[i] + "'>" + grafic_names[i] + "</option>";    
            }
            html += "</select></td>";
            var format = ['','perc'];
            var format_names = ['normal','percentage'];
            html += "<td><select class='form-control' name='format'>";
            for(var i=0;i<format.length;i++){
                var selected = (properties.format == format[i] ? " selected='selected'" : "");
                html += "<option" + selected + " value='" + format[i] + "'>" + format_names[i] + "</option>";    
            }
            html += "</select></td>";
            var groupby = ['','perc'];
            var groupby_names = ['method','property'];
            html += "<td><select class='form-control' name='groupby'>";
            for(var i=0;i<groupby.length;i++){
                var selected = (properties.groupby == groupby[i] ? " selected='selected'" : "");
                html += "<option" + selected + " value='" + groupby[i] + "'>" + groupby_names[i] + "</option>";    
            }
            html += "</select></td>";        
            var separation = ['','left','right'];
            var separation_names = ['none','left','right'];
            html += "<td><select class='form-control' name='separation'>";
            for(var i=0;i<separation.length;i++){
                var selected = (properties.separation == separation[i] ? " selected='selected'" : "");
                html += "<option" + selected + " value='" + separation[i] + "'>" + separation_names[i] + "</option>";    
            }
            html += "</select></td>";
            html += "<td><input class='form-control' type='text' class='form-control' name='table_group_name' maxlength='45' value='" + escapeQuotes(properties.table_group_name!= undefined ? properties.table_group_name : "") + "' /></td>";
            html += "<td><input class='form-control' type='text' class='form-control' name='graphic_name' maxlength='45' value='" + escapeQuotes(properties.grafic_name!= undefined ? properties.grafic_name : "") + "' /></td>";

            //html += "<input class='form-control' type='text' class='form-control' name='formula' style='width:100px;' maxlength='150' value='" + escapeQuotes(properties.formula!= undefined ? properties.formula : "") + "' />";

            html += "<td><button class='btn btn-danger btn-xs treure'><i class='bi bi-trash'></i></button></td>";
            html += "</tr>";
            return html;
        }

        function show_error(error){

            let html = '<div class="alert alert-warning alert-dismissible fade show" role="alert">' +
            '<strong>' + error + '</strong></div>';
            setTimeout(function(){
                $("#json_props #div_alert_wrap").html(html);
            },100);
            
        }    
        
    }





function number_format (number, decimals, dec_point, thousands_sep) {
    // Strip all characters but numerical ones.
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}


jQuery.cachedScript = function( url, options ) {
 
    // Allow user to set any option except for dataType, cache, and url
    options = $.extend( options || {}, {
      dataType: "script",
      cache: true,
      url: url
    });
   
    // Use $.ajax() since it is more flexible than $.getScript
    // Return the jqXHR object so we can chain callbacks
    return jQuery.ajax( options );
  };