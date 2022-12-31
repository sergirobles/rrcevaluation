$(function() {

    load_config(function(config){

        html_ranking(config);

        if (config.samples) {

            if(configuration.samples_path == ""){
                $("#div_sample_visualization").addClass("d-none");
                $("#div_samples_visualization").html("<div class='alert alert-warning'>The samples ZIP file not defined in the configuration</div>");        
            }else{
                samplesList();
            }

            
        }else{
            $("#div_samples_visualization").html("<div class='alert alert-warning'>You don't have defined samples on the task configuration.</div>");
            $("#div_sample_visualization").addClass("d-none");
        }
        

    })

})


var samples = {"data":{},"total":0,"page":"0","pageTotal":0,"currentSample":0};
var numSamplesPage = 20;

function samplesList(){
    $.get("./samplesList",function(data){
        samples.data = data;
        samples.total = data.length;
        samples.page = 1;
        samples.pageTotal = Math.ceil(samples.total/numSamplesPage);
        show_samples();
    },"json");
}

function show_sample(num,id){

    samples.currentSample = num;

    $("#div_samples_visualization").addClass("d-none");
    $("#div_sample_visualization").removeClass("d-none");

    $("#span_current_sample").html( num + " / " + samples.total);


    $.get("./methodResults/" + id + ".json",function(data){
        visualization.load_sample_info(data,num,id);
    });
}

function nextSample(){
    if(samples.currentSample<samples.total){
        samples.currentSample++;
    }
    show_sample(samples.currentSample,samples.data[samples.currentSample-1].id)
}
function prevSample(){
    if(samples.currentSample>1){
        samples.currentSample--;
    }
    show_sample(samples.currentSample,samples.data[samples.currentSample-1].id)
}

function nextPage(){
    if(samples.page<samples.pageTotal){
        samples.page++;
    }
    show_samples();
}
function prevPage(){
    if(samples.page>1){
        samples.page--;
    }
    show_samples();
}


function show_samples(){

    

    $("#div_sample_visualization").addClass("d-none");

    if(samples.total==0){
        html = "<div class='alert alert-danger'>No samples defined. The zip file must contain the entry <b>samples.json</b> with the samples relation. [ {\"id\":\"sample1\",\"images\":[\"f1.jpg\",...]}, ... ]</div>"
    }else{

        var start = (samples.page-1) * numSamplesPage + 1;
        var end = Math.min(samples.total, (samples.page) * numSamplesPage);

        $("#span_current_page").html( "Page: " + samples.page + " / " + samples.pageTotal + " Showing samples: " + start + " to " + end);

        var html = "<div class='row'>";
        for(var i=start;i<=end;i++){

            let sample = samples.data[i-1];

            html += "<div class='col-6 col-md-4 col-lg-3 col-xxl-2'>";
                html += "<div class='card sample' data-num='" + i + "' data-id='" + sample.id + "' role='button'>";

    
                html += "<img src='samples/" + sample.images[0] + "' class='card-img-top'></img>";

                html += "<div class='card-body'>";

                html += "<h5 class='card-title'>#" + i + " " + sample.id + "</h5>";

                html += "<div class='results'>";

                html += "</div>"; //.results
                
                html += "</div>"; //.card-body

                html += "</div>";//.card
            html += "</div>"; //.col
        }
        html += "</div>"; //.row
    }

    $("#div_samples").html(html);

    $("#div_samples_visualization").removeClass("d-none");

    

    const required_sample_parameters = Object.keys(configuration.sampleMetrics);

    $("#div_samples .card").each(function(){
        const id = $(this).data("id");
        const $dest = $(this).find(".results");
        $.get("./methodResults/" + id + ".json",function(data){
            
            html = "";

            for (var i=0;i<required_sample_parameters.length;i++){
                const $parameter_name = required_sample_parameters[i];
                const $parameter_options = configuration.sampleMetrics[$parameter_name];


                if (data[$parameter_name]== null || data[$parameter_name]== undefined ) {

                    html = "<div class='alert alert-danger'>The Required metric <b>" + $parameter_name + "</b> is not present on the results. Make sure your evaluation script outputs all the required metrics.</div>";
                    break;

                }else{

                    let $parameter_value = data[$parameter_name]

                    html += "<div class='param'>";
                    html += $parameter_options.long_name;



                    if ($parameter_options.format=="perc"){
                        html += "<span class='value'>" + number_format($parameter_value*100,2) + "%</span>";
                    }else if ($parameter_options.type=="double"){
                        html += "<span class='value'>" + number_format($parameter_value,2) + "</span>";
                    }else{
                        html += "<span class='value'>" + $parameter_value + "</span>";
                    } 

                    html += "</div>";
                }

            }

            $dest.html(html);

        },"json");
    });


}

function html_ranking(config){


        $.get("./methodResults",function(methodResults){
            
            const required_method_parameters = Object.keys(config.methodMetrics);

            var arr_group_name = {};

            for (var i=0;i<required_method_parameters.length;i++){

                const parameter_name = required_method_parameters[i];

                if(methodResults.method== undefined ){
                    $("#div_ranking").html("<div class='alert alert-danger'>The 'method' key is not found on the results (method.json)</div>");
                    return;
                }

                if (methodResults.method[parameter_name]== null || methodResults.method[parameter_name]== undefined ) {

                    $("#div_ranking").html("<div class='alert alert-danger'>The Required metric <b>" + parameter_name + "</b> is not present on the results.  Make sure your evaluation script outputs all the required metrics</div>");
                    return;

                }else{
                    const parameter_options = config.methodMetrics[parameter_name];
                    if(parameter_options.table_group_name != "" ){
                        arr_group_name[parameter_name] = parameter_options.table_group_name;
                    }
                }
            }


            var html = "<table class='table table-condensed'>";
            html += "<thead>";

            if ( Object.keys(arr_group_name).length>0){ //we need a higher row for grouping properties
                html += "<tr><th></th>";
                
                var num_times = 0;
                var last_title = "-";
                for (var i=0;i<required_method_parameters.length;i++){
                    const parameter_name = required_method_parameters[i];
                    const parameter_options = config.methodMetrics[parameter_name];
                    
                    title = arr_group_name[parameter_name];
                    if (title != last_title){
                        if( last_title != "-"){
                            html += "<th colspan='" + num_times + "' class='text-center " + (last_title!=""? " left right" : "") + "'>" + last_title + "</th>";
                        }
                        last_title = title;
                        num_times = 1;
                    }else{
                        num_times++;
                    }
                }
                html += "<th colspan='" + num_times + "' class='text-center " + (last_title!=""? " left right" : "") + "'>" + last_title + "</th>";
                html += "</tr>";
            }

            html += "<th>Method</th>";

            var $sort_name = ["","","","","",""];
            var $sort_name_long = ["","","","","",""];
            var $sort_order = ["","","","","",""];
            var $sort_format = ["","","","","",""];
            var $sort_type = ["","","","","",""];
            var $graphic_title = ["","","","","",""];
            
            var $arr_separators = [];
    
            var $num_graphics = 0;

            for (var i=0;i<required_method_parameters.length;i++){
                const $parameter_name = required_method_parameters[i];
                const $parameter_options = config.methodMetrics[$parameter_name];

                var $th_class = "";

                if($parameter_options.separation!="" && $parameter_options.separation!=null){
                    $arr_separators[$parameter_name] = $parameter_options.separation;
                    $th_class = $parameter_options.separation;
                }
                    
                html += "<th class='pv " + $th_class + "' data-n='" + $parameter_name + "'>" + $parameter_options.long_name + "</th>";                
                    
                if($parameter_options.order!=""){
                    $num_graphics = Math.max($num_graphics,$parameter_options.grafic);
                    let $num_grafic = $parameter_options.grafic - 1;//!="2"? 0 : 1;
                    $sort_name[$num_grafic] = $parameter_name;
                    $sort_name_long[$num_grafic] = $parameter_options.long_name;
                    $sort_order[$num_grafic] = $parameter_options.order;
                    $sort_format[$num_grafic] = $parameter_options.format;
                    $sort_type[$num_grafic] = $parameter_options.type;
                    $graphic_title[$num_grafic] = ($parameter_options.graphic_name!=null? $parameter_options.graphic_name : "");
                }


            }

            html += "</tr>";
            html += "</thead><tbody data-sort0='" + $sort_name[0] + "' data-st0='" + $sort_order[0] + "' data-sort1='" + $sort_name[1] + "' data-st1='" + $sort_order[1] + "'>";

            $graphics_data = {"1":[],"2":[],"3":[],"4":[],"5":[],"6":[]};

            $data = [[],[],[],[],[],[]];
            var $html_row = "<tr><td>Result</td>";

            for (var i=0;i<required_method_parameters.length;i++){
                const $parameter_name = required_method_parameters[i];
                const $parameter_options = config.methodMetrics[$parameter_name];

                let $parameter_value = methodResults.method[$parameter_name]

                var $td_class = "";
                if ( $arr_separators[$parameter_name] != undefined){
                    $td_class = $arr_separators[$parameter_name];
                }

                if ($parameter_options.format=="perc"){
                    $html_row += "<td class='" + $td_class + "'>" + number_format($parameter_value*100,2) + "%</td>";
                }else if ($parameter_options.type=="double"){
                    $html_row += "<td class='" + $td_class + "'>" + number_format($parameter_value,4) + "</td>";
                }else{
                    $html_row += "<td class='" + $td_class + "'>" + $parameter_value + "</td>";
                } 
                
                if($parameter_value ==""){
                    $valor_grafic = 0;
                }else{
                    if ($parameter_options.format=="perc"){
                        $valor_grafic = "{v:" + $parameter_value + ", f:'" + number_format($parameter_value*100,2) + "%'}";
                    }else if ($parameter_options.type=="double"){
                        $valor_grafic = "{v:" + $parameter_value + ", f:'" + number_format($parameter_value,4) + "'}";
                    }else{
                        $valor_grafic =  $parameter_value;
                    }
                }                        
                if ($parameter_options.grafic!=""){
                    $data[$parameter_options.grafic-1].push($valor_grafic);
                }
            }
                
            $html_row += "</tr>";

            html += $html_row;
            
            html += "</tbody></table>";
        

            $("#div_ranking").html(html);
        

            if($("th.pv").length){

                var $table = $("th.pv").first().closest("table");
                var $tbody = $table.find("tbody");        
                var current_order = $tbody.data("sort0");
                var current_direction = $tbody.data("st0");
                $table.find("th.pv").removeClass("sort_desc sort_asc");
                $table.find("th.pv i").remove();
                $table.find("th.pv[data-n=" + current_order + "]").addClass("primary sort_" + current_direction);
                $table.find("th.pv[data-n=" + current_order + "]").append("<i class='fa fa-sort-" + current_direction + "'></i>");        
            }            


        },"json").fail(function() {
            $("#div_ranking").html("<div class='alert alert-warning'>You have to evaluate a method before from the API functions tab.</div>");
            return;
        });


    
}
