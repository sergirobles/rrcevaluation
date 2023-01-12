var configuration;

function updateMethodParameters($form){
    values = configuration.methodParameters;

    $form.find("select.userParameter").each(function(){
        values[$(this).prop("name")] = $(this).val();
    });

    $("input[name='methodParams'").val(JSON.stringify(values));

    $form.find("span.methodParameters").html(JSON.stringify(values));
}

$(function() {

    load_config(function(){
        $("#form_evaluate,#form_validate").each(function(){
            updateMethodParameters($(this));
        })

    });

    $("[data-bs-toggle='tooltip']").each(function(){
        new bootstrap.Tooltip($(this)[0], [])
    });


      $(document).on("change","select.userParameter",function(){
        
            let $form = $(this).closest("form");
            updateMethodParameters($form);

      });


    



    $(document).on("click","div.card.sample",function(){
        let num = $(this).data("num");
        let id = $(this).data("id");
        show_sample(num,id);

    });    
    

   
    function download_results(url,output){
        $.ajax({
            url: url,
            cache: false,
            xhr: function () {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 2) {
                        if (xhr.status == 200) {
                            xhr.responseType = "blob";
                        } else {
                            xhr.responseType = "text";
                        }
                    }
                };
                return xhr;
            },success: function (data) {
                //Convert the Byte Data to BLOB object.
                var blob = new Blob([data], { type: "application/octetstream" });

                const request = new XMLHttpRequest();
                request.open("POST", "http://localhost:9020/save_results");
                request.responseType = 'json';
        
                output.innerHTML = alert_info(spinner() + "Saving results..")
        
                request.onload = (progress) => {        

                    var response = request.response;

                    if (response.result){
                        output.innerHTML = alert_success(spinner() + `Method calculated & Sample Results saved` )
                    }else{
                        output.innerHTML = alert_error( `Error saving the results file: ${response.msg}` );
                        $("#form_evaluate input[type='submit']").prop("disabled",false);
                    }

                }

                request.onerror = () => {
                    output.innerHTML = alert_error(`An undefined error occurred when saving the results file.`)
                    $("#form_evaluate input[type='submit']").prop("disabled",false);
                }                

                try{

                    let form = new FormData();
                    form.append("blob", blob, "results.zip");
                    request.send(form);

                }catch(err){
                    output.innerHTML = `<div class='alert alert-danger'>Error ${err} occurred when downloading results</div>`   
                    $("#form_evaluate input[type='submit']").prop("disabled",false);
                }

            }
        });      

    }
      

    $("#form_validate").submit(function(ev){

        ev.preventDefault();

        const output = document.querySelector("#div_validate_response");
        const formElement = document.querySelector("#form_validate");
        const request = new XMLHttpRequest();
        request.open("POST", "http://localhost:9020/validate");
        request.responseType = 'json';

        output.innerHTML = `<div class='alert alert-info'>` + spinner() + `Please wait, validating results..</div>`   

        request.onload = (progress) => {

            if( request.status === 200 ){

                var jsonResponse = request.response;

                if (jsonResponse.result){
                    output.innerHTML = alert_success(`<i class="bi bi-check-circle-fill"></i> The method is valid`)   
                }else{
                    output.innerHTML = alert_error(`Error. The method is not valid.<br><strong>${jsonResponse.msg}</strong>`)
                }

            }else{
                output.innerHTML =  alert_error(`Error ${request.status} occurred when trying to upload your file`)
            }
          };

          request.onerror =  (progress) =>{
            output.innerHTML = alert_error(`An undefined error occurred when trying to upload your file. Seems a problem with the evaluation docker (see the docker logs).`)
          }

          try{
            request.send(new FormData(formElement));
        }catch(err){
            output.innerHTML = alert_error(`Error ${err} occurred when validating your file`)
            $("#form_evaluate input[type='submit']").prop("disabled",false);
        }          

    });


    $("#form_evaluate").submit(function(ev){

        $("#form_evaluate input[type='submit']").prop("disabled",true);

        

        ev.preventDefault();

        const output = document.querySelector("#div_evaluate_response");
        const formElement = document.querySelector("#form_evaluate");
        const request = new XMLHttpRequest();
        request.open("POST", "http://localhost:9020/evaluate");
        request.responseType = 'json';

        output.innerHTML = alert_info(spinner() + "Please wait, calculating results..")

        request.onload = (progress) => {

            if( request.status === 200 ){

                var jsonResponse = request.response;

                if (jsonResponse.result){
                    if(jsonResponse.samplesUrl!=undefined){
                        output.innerHTML = alert_info(spinner() + "Method calculated. Downloading results..")

                        download_results(jsonResponse.samplesUrl,output);
        
                    }else{
                        output.innerHTML = alert_error("Error. Parameter <strong>samplesUrl</strong> missing on the results");
                        $("#form_evaluate input[type='submit']").prop("disabled",false);
                    }
                }else{
                    output.innerHTML = alert_error(`Error. The method is not valid.<br><strong>${jsonResponse.msg}</strong>`)
                    $("#form_evaluate input[type='submit']").prop("disabled",false);
                }

            }else{
                $("#form_evaluate input[type='submit']").prop("disabled",false);
                output.innerHTML = alert_error(`Error ${request.status} occurred when trying to upload your file`)
            }
          };
        request.onerror = () => {
            output.innerHTML = alert_error(`An undefined error occurred when evaluating your file. Seems a problem with the evaluation docker (see the docker logs).`)
            $("#form_evaluate input[type='submit']").prop("disabled",false);
        }

        try{
            request.send(new FormData(formElement));
        }catch(err){
            output.innerHTML = alert_error(`Error ${err} occurred when evaluating your file`)
            $("#form_evaluate input[type='submit']").prop("disabled",false);
        }

    });    

});

function load_config(callback){
    fetch('./config')
    .then((response) => {
        response.json().then((data) => { 
            configuration = data;
            $("input.gtField").val("/var/www/gt/" + configuration.gt_path);
            $("span.gtField").text("/var/www/gt/" + configuration.gt_path);

            $("input.methodParams").val( JSON.stringify(configuration.methodParameters));
            

            callback(data);
        });
    })
    .catch((err) => { 
        console.log("Error reading config file.");
    });
}


function alert_success(msg,compact){
    return '<div class="alert alert-success' + (compact!= undefined && compact? " p-2" : "") + '">' + msg + '</div>';
}
function alert_error(msg,compact){
    return '<div class="alert alert-danger' + (compact!= undefined && compact? " p-2" : "") + '">' + msg + '</div>';
}
function alert_info(msg,compact){
    return '<div class="alert alert-info' + (compact!= undefined && compact? " p-2" : "") + '">' + msg + '</div>';
}
function alert_warning(msg,compact){
    return '<div class="alert alert-warning' + (compact!= undefined && compact? " p-2" : "") + '">' + msg + '</div>';
}

function spinner(){
    return '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        
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
function show_html_modal(title,html,html_footer,id,large,callback){
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