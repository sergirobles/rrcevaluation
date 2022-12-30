
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

        $("#btnImport").prop("disabled",true);
        $("#div_msg_example").html("<div class='alert alert-info'>Downloading example..</div>");

        $.post("./load_example", {"example":$("#selectExample").val()},function(data){
        
            $("#btnImport").prop("disabled",false);
        
            if(data.result){
                

                $("#div_msg_example").html("<div class='alert alert-success'>Example loaded</div>");

            }else{
                
                $("#div_msg_example").html("<div class='alert alert-danger'>" + data.msg + "</div>");

            }
    
        },"json");

    });

})
