$(function() {

    $("#buttonMetrics,#buttonMetricsSample").click(function(){
        edit_json_method_metrics(this);
  
      });
  
      $("#buttonScriptRequirements").click(function(){
          edit_json_script_requirements(this);
      });
  
      $("#buttonUserParameters").click(function(){
          edit_json_user_params(this);
      });

      $("#btnSaveTask").click(function(){
        save_config();
  
      });
      $("#btnValidate").click(function(){
        validate_config();
  
      });   

      $("#sampleResults").change(function(){
        if($("#sampleResults").prop("checked")){
            $("#div_config_samples").removeClass("d-none");
          }else{
            $("#div_config_samples").addClass("d-none");
          }
      });

      $("#switchDocker").change(function(){
        if($("#switchDocker").prop("checked")){
            $("#div_docker").removeClass("d-none");
            $("#div_no_docker").addClass("d-none");
        }else{
            $("#div_docker").addClass("d-none");
            $("#div_no_docker").removeClass("d-none");
        }
      });
      $("#switchExtra").change(function(){
        if($("#switchExtra").prop("checked")){
            $("#div_extra").removeClass("d-none");
        }else{
            $("#div_extra").addClass("d-none");
        }
      });


      $("#selectSamplesListType").change(function(){
          if($("#selectSamplesListType").val() == "regexp" ){
              $("#divSamplesRegexp").removeClass("d-none");
            }else{
              $("#divSamplesRegexp").addClass("d-none");
            }
        });
  

      $("#div_task form input,#div_task form select").change(function(){
        $("#btnValidate").prop("disabled",true);
        $("#div_validation").html(alert_warning("Save config before validate.",true));
      });


      $("#buttonParameters").click(function(){
          edit_json_method_params(this);
    
        });

        load_config(function(data){

            if (data.methodMetrics == undefined) {
                data.methodMetrics = {}
            }

            if (data.sampleMetrics == undefined) {
                data.sampleMetrics = {}
            }

                
            $("#inputTitle").val(data.title);

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

            $("#switchDocker").prop("checked", data.docker);
            if(data.docker){
                $("#div_docker").removeClass("d-none");
                $("#div_no_docker").addClass("d-none");
            }else{
                $("#div_docker").addClass("d-none");
                $("#div_no_docker").removeClass("d-none");
            }

            
            $("#switchExtra").prop("checked", data.userParameters !={} ||  data.methodParameters !={} );
            if(data.userParameters !={} ||  data.methodParameters !={}){
                $("#div_extra").removeClass("d-none");
            }else{
                $("#div_extra").addClass("d-none");
            }


            $("#selectResultsExt").val(data.res_ext);

            $("#selectVisualization").val(data.visualization);

            $("#selectSamplesListType").val(data.samplesListType);

            $("#inputSamplesRegExp").val(data.samplesRegExp);

            
            $("#inputScriptRequirementsVal").val(JSON.stringify(data.scriptRequirements));
            $("#inputScriptRequirements").val(data.scriptRequirements!= null ? Object.keys(data.scriptRequirements).join(", ") : "");

            $("#inputMethodMetricsVal").val(JSON.stringify(data.methodMetrics));

            $("#inputMethodMetrics").val(Object.keys(data.methodMetrics).join(", "));

            $("#inputScript").val(data.script);

            $("#inputMethodParametersVal").val(JSON.stringify(data.methodParameters));

            $("#inputMethodParameters").val(data.methodParameters!= null ? Object.keys(data.methodParameters).join(", ") : "");

            $("#inputUserParametersVal").val(JSON.stringify(data.userParameters));

            $("#inputUserParameters").val(data.userParameters!= null ? Object.keys(data.userParameters).join(", ") : "");

            

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


function edit_json_script_requirements (el){
    var $input = $(el).closest("div").find("input");
    var $textarea = $(el).closest("div").find("textarea");
    show_html_modal("Configurate Parameters","<table class='table table-striped table-sm' id='div_fields'><thead>" + html_header() + "</thead><tbody></tbody></table><button class='btn btn-primary add'><i class='bi bi-plus'></i></button><div id='div_alert_wrap'></div>","<span></span>","json_props",false,function(){
        var $dialog = $("#json_props");
        var params = {};
        if ($input.val().length>0){
            params = JSON.parse($input.val());
        }
        for (var param in params) {
            $dialog.find("#div_fields tbody").append(html_new_param(param));
            $dialog.find("#div_fields tbody tr").last().find("input[name='value']").val( params[param] );
            
        }

        $dialog.find("button.add").click(function(){
            $dialog.find("#div_fields tbody").append(html_new_param(""));
        });

        $dialog.on("click","button.treure",function(){
            $(this).closest("tr.param").remove();
        });

        var $button = $("<button>Save</button>").addClass("btn btn-success").click(function(){

            $("#json_props #div_alert_wrap").html("");
            var result = {};
            $dialog.find("tr.param").not(".header").each(function(){
                if ($(this).find("input[name='name']").val()!=""){

                    var value = $(this).find("input[name='value']").val();

                    if( !value.match(/[0-9.]+/)){
                        show_error("Value not valid. Specify the script exact version.");
                        return;
                    }
                    result[$(this).find("input[name='name']").val()] = value;    
                    
                 }
            });
            $input.val(JSON.stringify(result)).trigger("change");
            $textarea.val(Object.keys(result).join(", "));

            $dialog.modal("hide");

        });
        $dialog.find("div.modal-footer").append($button);    
    });

    function addColumn(title,width,info){
        return "<th><span style='display:inline-block;width:" + width + "px;'>" + title + " <a href='#' data-toggle='tooltip' data-placement='bottom' title='" + info + "'><i class='bi bi-info-circle-fill'></i></a></span>";
    }
    function html_header(){
        var html = "<tr class='param header'>";
        html += addColumn("Package",90,"Package name");
        html += addColumn("Version",100,"Exact vesion");
        html += "<th><span style='display:inline-block;width:30px;'></span>";

        html += "</tr>";
        return html;
    }
    function html_new_param(name){
        var html = "<tr class='param form-inline input-group-sm sort'>";

        html += "<td><input class='form-control' type='text' class='form-control' name='name' value='" + name + "' maxlength='50' /></td>";
        html += "<td><input class='form-control' type='text' class='form-control' name='value' maxlength='45' /></td>";

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
function edit_json_method_params (el){
    var $input = $(el).closest("div").find("input");
    var $textarea = $(el).closest("div").find("textarea");
    show_html_modal("Configurate Parameters","<table class='table table-striped table-sm' id='div_fields'><thead>" + html_header() + "</thead><tbody></tbody></table><button class='btn btn-primary add'><i class='bi bi-plus'></i></button><div id='div_alert_wrap'></div>","<span></span>","json_props",false,function(){
        var $dialog = $("#json_props");
        var params = {};
        if ($input.val().length>0){
            params = JSON.parse($input.val());
        }
        for (var param in params) {
            
            $dialog.find("#div_fields tbody").append(html_new_param(param));
            if($.isNumeric(params[param]) && typeof params[param] == "string" ){
                $dialog.find("#div_fields tbody tr").last().find("input[name='value']").val(  "#str#" + params[param] );
            }else{
                $dialog.find("#div_fields tbody tr").last().find("input[name='value']").val( params[param] );
            }
            
        }

        $dialog.find("button.add").click(function(){
            $dialog.find("#div_fields tbody").append(html_new_param(""));
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
            $dialog.find("tr.param").not(".header").each(function(){
                if ($(this).find("input[name='name']").val()!=""){

                    var value = $(this).find("input[name='value']").val();
                    var name = $(this).find("input[name='name']").val();

                    if (value == "true" || value == "True"){
                        value = true;
                    }else if (value == "false" || value == "False"){
                        value = false;
                    }else if(value.substring(0,5)=="#str#"){
                        value = value.substring(5);
                    }else if ( $.isNumeric(value) ){
                        if (parseFloat(value)!= NaN){
                            value = parseFloat(value);
                        }else if (parseInt(value)!= NaN){
                            value = parseInt(value);
                        }
                    }

                    result[name] = value;

                 }
            });
            $input.val(JSON.stringify(result)).trigger("change");
            $textarea.val(Object.keys(result).join(", "));

            $dialog.modal("hide");

        });
        $dialog.find("div.modal-footer").append($button);    
    });

    function addColumn(title,width,info){
        return "<th><span style='display:inline-block;width:" + width + "px;'>" + title + " <a href='#' data-toggle='tooltip' data-placement='bottom' title='" + info + "'><i class='bi bi-info-circle-fill'></i></a></span>";
    }
    function html_header(){
        var html = "<tr class='param header'>";
        html += "<th><span style='display:inline-block;width:30px;'></span>";
        html += addColumn("Key",90,"Property reference as appears in the results of the evaluation");
        html += addColumn("Value",100,"Property value. By default, numeric values will be stored as numeric type. Prepend the value with #str# if you want to be stored as string.");
        html += "<th><span style='display:inline-block;width:30px;'></span>";

        html += "</tr>";
        return html;
    }
    function html_new_param(name){
        var html = "<tr class='param form-inline input-group-sm sort'>";

        html += "<td><span class='handle'><i class='bi bi-arrow-down-up'></i></span></td>";
        
        html += "<td><input class='form-control' type='text' class='form-control' name='name' value='" + name + "' maxlength='50' /></td>";
        html += "<td><input class='form-control' type='text' class='form-control' name='value' maxlength='45' /></td>";

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

function edit_json_user_params (el){
    var $input = $(el).closest("div").find("input");
    var $textarea = $(el).closest("div").find("textarea");
    show_html_modal("Configurate Parameters","<table class='table table-striped table-sm' id='div_fields'><thead>" + html_header() + "</thead><tbody></tbody></table><button class='btn btn-primary add'><i class='bi bi-plus'></i></button><div id='div_alert_wrap'></div>","<span></span>","json_props",true,function(){
        var $dialog = $("#json_props");
        var params = {};
        if ($input.val().length>0){
            params = JSON.parse($input.val());
        }

        for (var param in params) {

            $dialog.find("#div_fields tbody").append(html_new_param(param,false));

            let $tr = $dialog.find("#div_fields tbody tr.param").last();

            $tr.find("input[name='title']").val(  params[param].title  );

            let values = params[param].values;

            for (var i=0;i<values.length;i++){

                $tr.find("tbody").append(html_new_param_value());
                let $values_tr = $tr.find("tbody tr").last();
                $values_tr.find("input[name='param_name']").val(  values[i].name  );

                if($.isNumeric(values[i].value) && typeof values[i].value == "string" ){
                    $values_tr.find("input[name='param_value']").val(  "#str#" + values[i].value );
                }else{
                    $values_tr.find("input[name='param_value']").val( values[i].value );
                }
            }

            
        }

        $dialog.find("button.add").click(function(){
            $dialog.find("#div_fields > tbody").append(html_new_param("",true));
            $dialog.find("#div_fields > tbody").sortable({
                // items:'div.param.sort',
                // handle: ".handle"
             });
        });


        $dialog.on("click","button.add_value",function(){
            var $table = $(this).closest("div").find("table");
            $table.find("tbody").append(html_new_param_value());
        });        
        

        $dialog.on("click","button.treure",function(){
            $(this).closest("tr.param").remove();
        });
        $dialog.on("click","button.treure_value",function(){
            $(this).closest("tr.param_value").remove();
        });


        var $button = $("<button>Save</button>").addClass("btn btn-success").click(function(){

            $("#json_props #div_alert_wrap").html("");
            var result = {};
            $dialog.find("tr.param").not(".header").each(function(){

                let name = $(this).find("input[name='name']").val();

                if (name != ""){

                    var title = $(this).find("input[name='title']").val();

                    var values = [];

                    $(this).find("table tr.param_value").not(".header").each(function(){
                    
                        let param_name = $(this).find("input[name='param_name']").val();
                        var param_value = $(this).find("input[name='param_value']").val();
                        

                        if (param_value == "true" || param_value == "True" ){
                            param_value = true;
                        }else if (param_value == "false" || param_value == "False"){
                            param_value = false;
                        }else if(param_value.substring(0,5)=="#str#"){
                            param_value = param_value.substring(5);
                        }else if ( $.isNumeric(param_value) ){
                            if (parseFloat(param_value)!= NaN){
                                param_value = parseFloat(param_value);
                            }else if (parseInt(param_value)!= NaN){
                                param_value = parseInt(param_value);
                            }
                        }
                        values.push( {"name":param_name,"value":param_value} );    
                    });
                    result[name] = {"title":title,"values":values}

                 }
            });
            $input.val(JSON.stringify(result)).trigger("change");
            $textarea.val(Object.keys(result).join(", "));

            $dialog.modal("hide");

        });
        $dialog.find("div.modal-footer").append($button);    
    });

    function addColumn(title,width,info){
        return "<th><span style='display:inline-block;width:" + width + "px;'>" + title + " <a href='#' data-toggle='tooltip' data-placement='bottom' title='" + info + "'><i class='bi bi-info-circle-fill'></i></a></span>";
    }
    function html_header(){
        var html = "<tr class='param header'>";
        html += "<th><span style='display:inline-block;width:30px;'></span>";
        html += addColumn("Param",90,"Paramaeter name");
        html += addColumn("Title",100,"Parameter title");
        html += addColumn("Values",400,"Parameter Values");
        html += "<th><span style='display:inline-block;width:30px;'></span>";

        html += "</tr>";
        return html;
    }
    function html_new_param(name,addValues){
        var html = "<tr class='param form-inline input-group-sm sort'>";

        html += "<td><span class='handle'><i class='bi bi-arrow-down-up'></i></span></td>";
        
        html += "<td><input class='form-control' type='text' class='form-control' name='name' value='" + name + "' maxlength='30' /></td>";
        html += "<td><input class='form-control' type='text' class='form-control' name='title' maxlength='100' /></td>";


        html += "<td><div class='values'><table><thead>";
        html += addColumn("Option name",150,"Option name");
        html += addColumn("Option value",150,"Option value");
        html += "</thead><tbody>";
        if(addValues){
            html += html_new_param_value();
            html += html_new_param_value();
        }
        html += "</tbody></table><button class='btn btn-primary add_value'><i class='bi bi-plus'></i></button></div></td>";

        html += "<td><button class='btn btn-danger btn-xs treure'><i class='bi bi-trash'></i></button></td>";
        html += "</tr>";
        return html;
    }
    function html_new_param_value(){
        var html = "<tr class='param_value form-inline input-group-sm'>";
        html += "<td><input class='form-control' type='text' class='form-control' name='param_name' value='' maxlength='30' /></td>";
        html += "<td><input class='form-control' type='text' class='form-control' name='param_value' value='' maxlength='30' /></td>";
        html += "<td><button class='btn btn-danger btn-xs treure_value'><i class='bi bi-trash'></i></button></td>";
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


function edit_json_method_metrics(el){
    var $input = $(el).closest("div").find("input");
    var $textarea = $(el).closest("div").find("textarea");

    show_html_modal("Configurate Parameters","<table class='table table-striped table-sm' id='div_fields'><thead>" + html_header() + "</thead><tbody></tbody></table><button class='btn btn-primary add'><i class='bi bi-plus'></i></button><div id='div_alert_wrap'></div>","<span></span>","json_props",true,function(){
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
                $input.val(JSON.stringify(result)).trigger("change");
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



function save_config(){

    let fields = $("#div_task form").serializeArray();
    let out = {};

    $("#btnValidate").prop("disabled",true);

    for(var i=0;i<fields.length;i++){

        let field = fields[i];
        
        if(field.name=="methodMetrics" || field.name=="sampleMetrics" || field.name=="methodParameters" || field.name=="userParameters" || field.name=="scriptRequirements" ){
            var value = {};
            try{
                value = JSON.parse(field.value)
            }catch{
                value = {};
            }
            out[field.name] = value
        }else if (field.name=="uploadInstructions") {
            out[field.name] = CKEDITOR.instances.inputUploadInstructions.getData();
        }else if(field.name == "dockerPort"){
            if(field.value!=""){
                if (isNaN(field.value)) {
                    $("#div_task #div_msg").html("Docker port number not valid");
                }else{
                    out[field.name] = parseInt(field.value);
                }
            }
        }else if(field.name != "extra"){
            out[field.name] = field.value;    
        }
    }
    //changing to boolean
    out["samples"] = out["samples"]=="on";
    out["docker"] = out["docker"]=="on";

    $("#div_task #div_msg").html( alert_info(spinner() + " Saving configuration", true) );
    $.post("./save_config", {"config":JSON.stringify(out)},function(data){
        
        
        if(data.result){
            configuration = out;

            if(!configuration.docker){

                $("#div_task #div_msg").html( alert_info(spinner() + " Installing dependencies", true) );
                $.get("http://localhost:9020/install", function(data){
                    
                    if(data.result){

                        $("#div_task #div_msg").html(alert_success('Saved',true));
                        $("#div_validation").html("");
                        $("#btnValidate").prop("disabled",false);
            
                    }else{
                        $("#div_task #div_msg").html("Configuration saved but error installing dependecies. Error:" + data.msg + "  (try to install them manually loading http://localhost:9020/install or restarting the docker)");
                    }
            
                },"json");
            }else{
                $("#div_task #div_msg").html(alert_success('Saved',true));
                $("#div_validation").html("");
                $("#btnValidate").prop("disabled",false);
            }

        }else{
            $("#div_task #div_msg").html(data.msg);
        }

    },"json");
}

function validate_config(){
    $.get("./validate_config",function(data){
        if(data.result){
            html = alert_success('Configuration is correct',true);
        }else{
            html = alert_error('Error: ' + data.msg, true);
        }
        $("#div_validation").html(html);

    },"json");
}