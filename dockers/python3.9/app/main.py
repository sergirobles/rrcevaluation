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
from pydantic import BaseModel

app1 = FastAPI()

UPLOAD_FOLDER = '/var/tmp/'

@app1.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"result":False,"msg":"Error with parameters","errors":exc.errors()}),
    )

@app1.get('/', response_class=HTMLResponse)
async def index():
    return "<html><head><title>RRC Evaluation API</title></head><body><h1>RRC Evaluation API</h1><p>Methods</p><ul><li><a href='/validate'>/validate</a></li><li><a href='/evaluate'>/evaluate</a></li><li><a href='/config'>/config</a></li></ul></body></html>";


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
def evaluate( gt:Optional[str] = Form(""), resultsFile: Union[UploadFile, None] = None,  output:Optional[str]= Form(""), results:Optional[str]= Form("")):

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

    if output != "":
        if os.path.isdir(output) == False:
            return {"result":False,"msg":"Output path not valid or not accesible (output path must start with /var/www/submits)"}


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

    samples_file = "/var/www/submits/method.%s" % configDict['res_ext']
    shutil.copyfile(results_path, samples_file)


    resDict={'result':True,'msg':'','method':'{}','per_sample':'{}'}    

    try:
        module = importlib.import_module("scripts.script")    

        resValidation = module.validate_data(gt_path, results_path)
        if resValidation['result'] == True:

            evalData = module.evaluate(gt_path, results_path)
            resDict.update(evalData)
        else:
            resDict['msg'] = resValidation['msg']
            resDict['result'] = False

    except Exception as e:
        resDict['msg']= str(e)
        resDict['result']=False

    if output != "":

        resultsOutputname = output + '/results.zip'
        outZip = zipfile.ZipFile(resultsOutputname, mode='w', allowZip64=True)

        del resDict['per_sample']
        if 'output_items' in resDict.keys():
            del resDict['output_items']

        outZip.writestr('method.json',json.dumps(resDict))
        
    if not resDict['result']:
        if output != "":
            outZip.close()
        return resDict
    
    if output != "":
        if 'per_sample' in evalData.keys():
            for k,v in evalData['per_sample'].items():
                outZip.writestr( k + '.json',json.dumps(v)) 

        if 'output_items' in evalData.keys():
            for k, v in evalData['output_items'].items():
                outZip.writestr( k,v) 

        outZip.close()
    
    return resDict


def file_get_contents(url):
    url = str(url).replace(" ", "+") # just in case, no space in url
    hdr = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
           'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
           'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
           'Accept-Encoding': 'none',
           'Accept-Language': 'en-US,en;q=0.8',
           'Connection': 'keep-alive'}
    req = urllib2.Request(url, headers=hdr)
    try:
        page = urllib2.urlopen(req)
        return page.read()
    except urllib2.HTTPError as e:
        print(e.fp.read())
    return ''