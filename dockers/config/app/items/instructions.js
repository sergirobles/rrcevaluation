
$(function() {




    html_modal_content
    
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
                $("#div_msg_example").html(`<div class='alert alert-info'>
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>Please wait, downloading example..</div>`);

                var url = Object.keys(examples)[$("#ul_examples li.active").index()];

                $("#modal_import").modal("hide");
        
                $.post("./load_example", {"example": url  },function(data){
                
                    if(data.result){
                        
        
                        $("#div_msg_example").html("<div class='alert alert-success'>Example loaded</div>");
        
                    }else{
                        
                        $("#div_msg_example").html("<div class='alert alert-danger'>" + data.msg + "</div>");
        
                    }
            
                },"json");
        
            });            

        });
    });





    $('#formFile').on("change", function(){ 
        var fileName = $(this).val();

        if (fileName == ""){
            return;
        }

        $("#btnImportFile").prop("disabled",true);
        $("#div_msg_example").html(`<div class='alert alert-info'>
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>Please wait, loading example..</div>`);

        const request = new XMLHttpRequest();
        request.open("POST", "http://localhost:9010/load_example");
        request.responseType = 'json';

        const formElement = document.querySelector("#form_example_local");        

        request.onload = (progress) => {

            if( request.status === 200 ){

                $("#btnImportFile").prop("disabled",false);

                var jsonResponse = request.response;
                if (jsonResponse.result){
                    $("#div_msg_example").html("<div class='alert alert-success'>Example loaded</div>");
                }else{
                    $("#div_msg_example").html("<div class='alert alert-danger'>" + jsonResponse.msg + "</div>");                    
                    
                }

            }else{
                $("#btnImportFile").prop("disabled",false);
                $("#div_msg_example").html(`<div class='alert alert-danger'>Error ${request.status} occurred when trying to upload your file</div>`);   
            }
          };
        request.onerror = () => {
            $("#div_msg_example").html(`<div class='alert alert-danger'>Error ${request.status} occurred when trying to upload your file</div>`);   
            $("#btnImportFile").prop("disabled",false);
        }

        try{
            request.send(new FormData(formElement));
        }catch(err){
            $("#div_msg_example").html(`<div class='alert alert-danger'>Error ${request.status} occurred when trying to upload your file</div>`);   
            $("#btnImportFile").prop("disabled",false);
        }
    
    });

})
