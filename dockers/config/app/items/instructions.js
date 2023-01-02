
$(function() {


    examples = {
        "https://www.hipicgest.com/med/rrc/IST.zip":"RRC Incidental Scene Text 2015",
        "https://www.hipicgest.com/med/rrc/FST.zip":"RRC Focused Scene Text (Segmentation task)",
        "https://www.hipicgest.com/med/rrc/SimpleExample.zip":"Simple Example"
    }

    for( example in examples){
        $('#selectExample').append(new Option(examples[example], example))
    }
    


    $("#btnImport").click(function(){

        if($("#selectExample").val()==""){
            $("#div_msg_example").html("<div class='alert alert-danger'>Select the example</div>");
        }
        $("#btnImport").prop("disabled",true);
        $("#div_msg_example").html(`<div class='alert alert-info'>
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>Please wait, downloading example..</div>`);

        $.post("./load_example", {"example":$("#selectExample").val()},function(data){
        
            $("#btnImport").prop("disabled",false);
        
            if(data.result){
                

                $("#div_msg_example").html("<div class='alert alert-success'>Example loaded</div>");

            }else{
                
                $("#div_msg_example").html("<div class='alert alert-danger'>" + data.msg + "</div>");

            }
    
        },"json");

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
        </div>Please wait, downloading example..</div>`);

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
