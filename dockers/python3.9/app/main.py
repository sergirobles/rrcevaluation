import json
from typing import Optional
from typing import Union
import importlib
import sys
import os
import zipfile
import uuid
import shutil
import urllib.request as urllib2
import http.cookiejar as cookielib

sys.path.append("/code/scripts/")

from fastapi import FastAPI, File, UploadFile, Request, status, Form
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app1 = FastAPI()

app1.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9010"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = '/var/tmp/'
RESULTS_FOLDER = '/var/tmp/results/'
DOCKER_DOMAIN = 'http://host.docker.internal:9020'

@app1.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"result":False,"msg":"Error with parameters","errors":exc.errors()}),
    )

@app1.get('/', response_class=HTMLResponse)
async def index():
    return """
    <html>
    <head>
        <title>RRC Evaluation API</title>
    </head>
    <body>
    <h1>RRC Evaluation API</h1>
    <p>This docker version uses Python 3.9. If you have to change it, change the image in the Dockerfile.</p>
    <p>Edit the requirements.txt file adding the dependencies you need</p>
    <p>The docker will call the script.py file in the mounted volume 'scripts'. Implement the methods 'validate_data' and 'evaluate' on the script.</p>
    <p>API Methods</p>
    <ul><li><a href='/validate'>/validate</a></li><li><a href='/evaluate'>/evaluate</a></li><li><a href='/config'>/config</a></li></ul>
    </body>
    </html>""";


@app1.get("/config")
def config():
    contents = {}
    try :
        with open('/var/www/gt/config.json', encoding='utf8') as f:
            contents = json.loads(f.read())
            f.close()
    except Exception as e:   
        print(e) 
        contents = {}

    return contents

@app1.post("/validate")
def validate( gt:Optional[str] = Form(""), resultsFile: Union[UploadFile, None] = None, results:Optional[str]= Form("")):

    configDict = config()


    gt_path = gt
    if os.path.isfile(gt) == False:
        return {"result":False,"msg":"Ground Truth path not valid or not accesible (ground truth path must start with /var/www/gt)"}

    if resultsFile == None :
        if results == "":
            return {"result":False,"msg":"You have to specify the results path or add the results file"}

        if os.path.isfile(results) == False:
            return {"result":False,"msg":"Results path not valid or not accesible"}

        results_path = results

    else:

        file_ext = os.path.splitext(resultsFile.filename)[1][1:]
        if file_ext not in [configDict['res_ext']]:
            return {"result":False,"msg":"Not valid file extension: %s Valid ones are: %s" % (file_ext , " or ".join([configDict['res_ext']])) }

        results_path = os.path.join(UPLOAD_FOLDER, str(uuid.uuid4())) 
        contents = resultsFile.file.read()

        fd = open(results_path, "wb")
        fd.write(contents)
        fd.close()


    try:
        module = importlib.import_module("scripts.script" )
        return module.validate_data(gt_path, results_path)

    except Exception as err:
        resDict = {"result":False,"msg":"{0}".format(err)}
        return resDict
    

@app1.post("/evaluate")
def evaluate( gt:Optional[str] = Form(""), resultsFile: Union[UploadFile, None] = None,  results:Optional[str]= Form("")):
    
    """
    This process validates a method, evaluates it and if it succed generates a ZIP file with a JSON entry for each sample.
    Params:
    p: Dictionary of parmeters with the GT/submission locations. If None is passed, the parameters send by the system are used.
    default_evaluation_params_fn: points to a function that returns a dictionary with the default parameters used for the evaluation
    validate_data_fn: points to a method that validates the corrct format of the submission
    evaluate_method_fn: points to a function that evaluated the submission and return a Dictionary with the results
    """
    configDict = config()

    gt_path = gt
    if os.path.isfile(gt) == False:
        return {"result":False,"msg":"Ground Truth path not valid or not accesible (ground truth path must start with /var/www/gt)"}

    if resultsFile == None :
        if results == "":
            return {"result":False,"msg":"You have to specify the results path or add the results file"}

        if os.path.isfile(results) == False:
            return {"result":False,"msg":"Results path not valid or not accesible"}

        results_path = results
        
    else:

        file_ext = os.path.splitext(resultsFile.filename)[1][1:]
        if file_ext not in [configDict['res_ext']]:
            return {"result":False,"msg":"Not valid file extension: %s Valid ones are: %s" % (file_ext , " or ".join([configDict['res_ext']])) }

        results_path = os.path.join(UPLOAD_FOLDER, str(uuid.uuid4())) 
        contents = resultsFile.file.read()

        fd = open(results_path, "wb")
        fd.write(contents)
        fd.close()


    resDict={'result':True,'msg':'','method':{}}

    try:
        module = importlib.import_module("scripts.script")    

        resValidation = module.validate_data(gt_path, results_path)
        if resValidation['result'] == True:

            evalData = module.evaluate(gt_path, results_path)
            resDict['method'].update(evalData['method'])

            #generate a new zip file with the method results
            outputname = str(uuid.uuid4()) + ".zip"
            resultsOutputname = UPLOAD_FOLDER + "/" + outputname
            outZip = zipfile.ZipFile(resultsOutputname, mode='w', allowZip64=True)

            #provide the URL to download the file
            resDict['samplesUrl'] = DOCKER_DOMAIN + "/results/" + outputname

            #Add samples results
            outZip.writestr('method.json',json.dumps(resDict))            

            if configDict['samples']==True:

                #Add samples results
                if 'per_sample' in evalData.keys():
                    for k,v in evalData['per_sample'].items():
                        outZip.writestr( k + '.json',json.dumps(v))                     

                #Add other files
                if 'output_items' in evalData.keys():
                    for k, v in evalData['output_items'].items():
                        outZip.writestr( k,v) 

            outZip.close()

        else:
            resDict['msg'] = resValidation['msg']
            resDict['result'] = False
            return

    except Exception as e:
        resDict['msg']= str(e)
        resDict['result']=False

    return resDict


@app1.get( "/results/{item_id}.zip" )
async def read_sample(item_id: str):
    results_file = "/var/tmp/%s.zip" % item_id
    return FileResponse(results_file , media_type="application/zip") 