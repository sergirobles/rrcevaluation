$(function() {

    $("#btnClear").click(function(){
        var html = alert_error("Are you sure to remove all files on the mounted folders and clear configuration?");
        var html_footer = `<button type="button" class="card-link btn btn-danger" id="btnClear">Clear</button>`

        show_html_modal("Clear items and config",html,html_footer,"modal_clear",false,function(){
            $("#modal_clear #btnClear").click(function(){

                $("#modal_clear").modal("hide");
                
                $("#div_msg_example").html( alert_info( spinner() + "Please wait, removing files."));

                $.post("./clear", {},function(data){

                    

                    if(data.result){

                        $("#div_msg_example").html( alert_success('<i class="bi bi-check-circle-fill text-success"></i> Done'));
        
                    }else{
                        $("#div_msg_example").html( alert_error(data.msg));
        
                    }
            
                },"json");
            });
        });

    });

    $("#btnImportRRC").click(function(){

        var html = "<ul id='ul_examples' class='list-group'></ul>";
        var html_footer = `<button type="button" class="card-link btn btn-warning" id="btnImport">Load</button>`

        show_html_modal("Import an RRC example",html,html_footer,"modal_import",false,function(){

            examples = {
                "https://www.hipicgest.com/med/rrc/IST.zip":"RRC Incidental Scene Text 2015 (45Mb.)",
                "https://www.hipicgest.com/med/rrc/FST.zip":"RRC Focused Scene Text (Segmentation task) (125Mb.)",
                "https://www.hipicgest.com/med/rrc/Text_in_Videos_E2E.zip":"RRC Text in Videos E2E Task (1.47Gb.)",
                "https://www.hipicgest.com/med/rrc/SimpleExample.zip":"Simple Example"
            }
        
            for( example in examples){
                $('#ul_examples').append("<li class='list-group-item'>" + examples[example] + "</li>");
            }

            $('#ul_examples li').on("click",function(){
                $('#ul_examples li').not($(this)).removeClass("active");
                $(this).toggleClass("active");
            });

            $("#btnImport").click(function(){

                if( !$("#ul_examples li.active").length ){
                    $("#div_msg_example").html("<div class='alert alert-danger'>Select the example</div>");
                    return;
                }
                $("#btnImport").prop("disabled",true);

                $("#div_msg_example").html( alert_info( spinner() + "Please wait, <span class='msg'>downloading example..</span>"));

                startProgress();

                var url = Object.keys(examples)[$("#ul_examples li.active").index()];

                $("#modal_import").modal("hide");
        
                $.post("./load_example", {"example": url  },function(data){

                    stopProgress();
                
                    if(data.result){

                        $("#div_msg_example").html( alert_info(spinner() + " Installing dependencies", true) );
                        $.get("http://localhost:9020/install", function(data){
                            
                            if(data.result){
            
                                $("#div_msg_example").html( alert_success('<i class="bi bi-check-circle-fill text-success"></i> Example loaded'));
                    
                            }else{
                                $("#div_msg_example").html( alert_warning('<i class="bi bi-check-circle-fill text-success"></i> Example loaded but error loading dependencies. (try to install them manually loading http://localhost:9020/install or restarting the docker)'));
        
                            }
                    
                        },"json");                        
                        

                    }else{
                        $("#div_msg_example").html( alert_error(data.msg));
        
                    }
            
                },"json");
        
            });            

        });
    });

    var processInterval = null;
    function startProgress(){
        processInterval = setInterval(function(){

            $.get("/progress",function(data){
                $("#div_msg_example span.msg").html(data.msg);
            },"json");

        },1000);
    }

    function stopProgress(){
        clearInterval(processInterval);
    }





    $('#formFile').on("change", function(){ 
        var fileName = $(this).val();

        if (fileName == ""){
            return;
        }

        $("#btnImportFile").prop("disabled",true);

        $("#div_msg_example").html( alert_info( spinner() + "Please wait, uplading example.."));

        startProgress();

        const request = new XMLHttpRequest();
        request.open("POST", "http://localhost:9010/load_example");
        request.responseType = 'json';

        const formElement = document.querySelector("#form_example_local");        

        request.onload = (progress) => {

            stopProgress();

            if( request.status === 200 ){

                $("#btnImportFile").prop("disabled",false);

                var data = request.response;

                if(data.result){

                    $("#div_msg_example").html( alert_info(spinner() + " Installing dependencies", true) );
                    $.get("http://localhost:9020/install", function(data){
                        
                        if(data.result){
        
                            $("#div_msg_example").html( alert_success('<i class="bi bi-check-circle-fill text-success"></i> Example loaded'));
                
                        }else{
                            $("#div_msg_example").html( alert_warning('<i class="bi bi-check-circle-fill text-success"></i> Example loaded but error loading dependencies. (try to install them manually loading http://localhost:9020/install or restarting the docker)'));
    
                        }
                
                    },"json");                        
                    

                }else{
                    $("#div_msg_example").html( alert_error(data.msg));
    
                }


            }else{
                $("#btnImportFile").prop("disabled",false);
                $("#div_msg_example").html(`<div class='alert alert-danger'>Error ${request.status} occurred when trying to upload your file</div>`);   
            }
          };
        request.onerror = () => {
            stopProgress();
            $("#div_msg_example").html(`<div class='alert alert-danger'>Error ${request.status} occurred when trying to upload your file</div>`);   
            $("#btnImportFile").prop("disabled",false);
        }

        try{
            request.send(new FormData(formElement));
        }catch(err){
            stopProgress();
            $("#div_msg_example").html(`<div class='alert alert-danger'>Error ${request.status} occurred when trying to upload your file</div>`);   
            $("#btnImportFile").prop("disabled",false);
        }
    
    });



})
