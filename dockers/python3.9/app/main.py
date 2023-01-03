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
import time
import sys
import subprocess

sys.path.append("/code/scripts/")

from fastapi import FastAPI, File, UploadFile, Request, status, Form
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


UPLOAD_FOLDER = '/var/tmp/results/'
DOCKER_CONFIG_DOMAIN = 'http://localhost:9010'
DOCKER_DOMAIN = 'http://host.docker.internal:9020'

app1 = FastAPI()

#Enable CORS allowing configuration docker make API calls
app1.add_middleware(
    CORSMiddleware,
    allow_origins=[DOCKER_CONFIG_DOMAIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    <p>The docker will call a script (script.py by default) in the mounted volume 'scripts'. Implement the methods 'validate_data' and 'evaluate_method' on that script.</p>
    <p>API Methods</p>
    <ul><li><a href='/validate'>/validate</a></li><li><a href='/evaluate'>/evaluate</a></li><li><a href='/config'>/config</a></li></ul>
    </body>
    </html>""";


@app1.post("/validate")
def validate( gt:Optional[str] = Form(""), resultsFile: Union[UploadFile, None] = None, results:Optional[str]= Form(""), methodParams: Optional[str] = Form("")):

    try:
        configDict = config()

        gt_path = gt
        if os.path.isfile(gt) == False:
            return {"result":False,"msg":"Ground Truth path not valid or not accesible (ground truth path must start with /var/www/gt)"}

        #Validate the results params and get the results path
        results_path = validate_results_file(resultsFile, results, [configDict['res_ext']])

        #Loading the script module
        
        script_name = configDict['script'] if 'script' in configDict and len(configDict['script'])>0  else 'script'

        module = importlib.import_module("scripts.{0}".format(script_name))

        try:
            evaluationParams = module.default_evaluation_params()
        except Exception as err:
            evaluationParams = {}

        if methodParams:
            evaluationParams.update( json.loads(methodParams) )

        #Validate the results
        module.validate_data(gt_path, results_path, evaluationParams )

        return {"result" : True}

    except Exception as err:
        resDict = {"result":False,"msg":"{0}".format(err)}
        return resDict
    

@app1.post("/evaluate")
def evaluate( gt:Optional[str] = Form(""), resultsFile: Union[UploadFile, None] = None,  results:Optional[str]= Form(""), methodParams: Optional[str] = Form("")):
    
    try:

        configDict = config()

        gt_path = gt
        if os.path.isfile(gt) == False:
            return {"result":False,"msg":"Ground Truth path not valid or not accesible (ground truth path must start with /var/www/gt)"}

        #Validate the results params and get the results path
        results_path = validate_results_file(resultsFile, results, [configDict['res_ext']])

        resDict = {'result':True,'method':{}}

        #Loading the script module

        script_name = configDict['script'] if 'script' in configDict and len(configDict['script'])>0  else 'script'

        module = importlib.import_module("scripts.{0}".format(script_name))

        try:
            evaluationParams = module.default_evaluation_params()
        except Exception as err:
            evaluationParams = {}

        if methodParams:
            evaluationParams.update( json.loads(methodParams) )

        #Validate the results
        module.validate_data(gt_path, results_path, evaluationParams)

        #If no exception, results are valid. Evaluate and get results
        evalData = module.evaluate_method(gt_path, results_path, evaluationParams)

        #Compatibility for old scripts
        if 'calculated' in evalData:
            evalData['result'] = evalData['calculated']
            del evalData['calculated']

        if 'Message' in evalData:
            evalData['msg'] = evalData['Message']
            del evalData['Message']

        if 'result' in evalData and evalData['result'] == False:
            return {"result":False,"msg": evalData['msg'] if 'msg' in evalData else 'Unknown Error on calculation' }

        if not 'method' in evalData:
            return {"result":False,"msg": "Result from script has no method key" }

        resDict['method'].update(evalData['method'])

        #generate a new zip file with the method results
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

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

        return resDict
            
    except Exception as e:
        return {"result":False,"msg":"{0}".format(e)}


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

def validate_results_file(resultsFile,results,validExtensions):

    if resultsFile == None :
        if results == "":
            raise Exception("You have to specify the results path or add the results file.")

        if os.path.isfile(results) == False:
            raise Exception("Results path not valid or not accesible.")

        results_path = results

    else:

        file_ext = os.path.splitext(resultsFile.filename)[1][1:]
        if file_ext not in validExtensions:
            raise Exception("Not valid file extension: %s Valid ones are: %s" % (file_ext , " or ".join(validExtensions)))

        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        results_path = os.path.join(UPLOAD_FOLDER, str(uuid.uuid4())) 
        contents = resultsFile.file.read()

        fd = open(results_path, "wb")
        fd.write(contents)
        fd.close()

    return results_path            

@app1.get( "/results/{item_id}.zip" )
async def read_sample(item_id: str):
    delete_older_submits()
    results_file = os.path.join(UPLOAD_FOLDER, "%s.zip" % item_id)  
    return FileResponse(results_file , media_type="application/zip") 


def delete_older_submits():
    """
    This func deletes the submits / results older than 4 hours
    """

    folder = UPLOAD_FOLDER

    if not os.path.exists(UPLOAD_FOLDER):
        return

    os.chdir(os.path.join(os.getcwd(), folder))

    list_of_files = os.listdir()

    current_time = time.time()

    for i in list_of_files:

        file_location = os.path.join(os.getcwd(), i)

        file_time = os.stat(file_location).st_mtime

        if(file_time < current_time - 4*3600):

            print(f" Delete : {i}")
            
            os.remove(file_location)


@app1.get("/install")
def install():
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', '/code/scripts/requirements.txt'])

        # process output with an API in the subprocess module:
        reqs = subprocess.check_output([sys.executable, '-m', 'pip','freeze'])
        installed_packages = [r.decode().split('==')[0] for r in reqs.split()]

        return {"result" : True, "packages": installed_packages}

    except Exception as err:
        resDict = {"result":False,"msg":"{0}".format(err)}
        return resDict