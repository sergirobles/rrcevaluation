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
import re
from jinja2 import Environment, FileSystemLoader
sys.path.append("/code/scripts/")

from fastapi import FastAPI, File, UploadFile, Request, status, Form
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, Response
from pydantic import BaseModel

app1 = FastAPI()

env = Environment(loader=FileSystemLoader("items/templates/"))

UPLOAD_FOLDER = '/var/tmp/'

@app1.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"result":False,"msg":"Error with parameters","errors":exc.errors()}),
    )

class Item(BaseModel):
    id: str
    value: str

@app1.get( "/gtFile/{item_id}" )
async def read_sample(item_id: str):
    configDict = config()
    samples_file = "/var/www/gt/%s" % configDict['gt_path']
    archive = zipfile.ZipFile(samples_file, 'r')
    data = archive.read(item_id)
    archive.close()

    extension = os.path.splitext(item_id)[1][1:]
    if extension == 'jpg' or extension == 'jpeg':
        media_type = "image/jpeg"
    elif extension == 'png':
        media_type = "image/png"
    elif extension == 'mp4':
        media_type = "video/mp4"        
    elif extension == 'json':
        media_type = "application/json"

    return Response(content=data, media_type=media_type)   

@app1.get( "/methodFile/{item_id}" )
async def read_sample(item_id: str):
    configDict = config()
    samples_file = "/var/www/submits/method.%s" % configDict['res_ext']
    archive = zipfile.ZipFile(samples_file, 'r')
    data = archive.read(item_id)
    archive.close()

    extension = os.path.splitext(item_id)[1][1:]
    if extension == 'jpg' or extension == 'jpeg':
        media_type = "image/jpeg"
    elif extension == 'png':
        media_type = "image/png"
    elif extension == 'mp4':
        media_type = "video/mp4"        
    elif extension == 'json':
        media_type = "application/json"

    return Response(content=data, media_type=media_type)       

@app1.get( "/samples/{item_id}" )
async def read_sample(item_id: str):
    configDict = config()
    samples_file = "/var/www/gt/%s" % configDict['samples_path']
    archive = zipfile.ZipFile(samples_file, 'r')
    data = archive.read(item_id)
    archive.close()

    extension = os.path.splitext(item_id)[1][1:]
    if extension == 'jpg' or extension == 'jpeg':
        media_type = "image/jpeg"
    elif extension == 'png':
        media_type = "image/png"
    elif extension == 'mp4':
        media_type = "video/mp4"        
    elif extension == 'json':
        media_type = "application/json"

    return Response(content=data, media_type=media_type)    


@app1.get( "/items/{item_id}")
async def read_item(item_id: str):
    path = "/code/items/%s" % item_id
    if os.path.isfile(path) == False:
        return JSONResponse(status_code=404, content={"message": "Item not found"})

    extension = os.path.splitext(item_id)[1][1:]
    if extension == 'jpg' or extension == 'jpeg':
        media_type = "image/jpeg"
    elif extension == 'png':
        media_type = "image/png"
    elif extension == 'mp4':
        media_type = "video/mp4"        
    elif extension == 'css':
        media_type = "text/css"                
    elif extension == 'js':
        media_type = "text/javascript"

        if item_id[:7] == "modules" : 
            media_type = "application/javascript"
        
    return FileResponse(path , media_type=media_type)
@app1.get( "/items/visualization/{item_id}")
async def read_item(item_id: str):
    path = "/code/items/visualization/%s" % item_id
    if os.path.isfile(path) == False:
        return JSONResponse(status_code=404, content={"message": "Item not found"})

    extension = os.path.splitext(item_id)[1][1:]
    if extension == 'jpg' or extension == 'jpeg':
        media_type = "image/jpeg"
    elif extension == 'png':
        media_type = "image/png"
    elif extension == 'mp4':
        media_type = "video/mp4"        
    elif extension == 'css':
        media_type = "text/css"                
    elif extension == 'js':
        media_type = "application/javascript"

        
    return FileResponse(path , media_type=media_type)

@app1.get('/', response_class=HTMLResponse)
async def index():
    template = env.get_template("index.html")
    return template.render(page="instructions",config=config())

@app1.get('/index.html', response_class=HTMLResponse)
async def index():
    template = env.get_template("index.html")
    return template.render(page="instructions",config=config())

@app1.get('/results.html', response_class=HTMLResponse)
async def index():
    template = env.get_template("results.html")
    return template.render(page="results",config=config())

@app1.get('/api.html', response_class=HTMLResponse)
async def index():
    template = env.get_template("api.html")
    return template.render(page="api",config=config())

@app1.get('/configuration.html', response_class=HTMLResponse)
async def index():
    template = env.get_template("configuration.html")
    return template.render(page="configuration",config=config())

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

@app1.get( "/methodResults/{item_id}" )
def read_method_result(item_id: str):
    file = '/var/www/submits/results.zip'
    if os.path.isfile(file) == False:
        return JSONResponse(status_code=404, content={"message": "Item not found"})   

    archive = zipfile.ZipFile(file, 'r')
    if item_id in archive.namelist() == False:
        return JSONResponse(status_code=404, content={"message": "Item not found"})    

    data = archive.read(item_id)
    archive.close()

    extension = os.path.splitext(item_id)[1][1:]
    if extension == 'jpg' or extension == 'jpeg':
        media_type = "image/jpeg"
    elif extension == 'png':
        media_type = "image/png"
    elif extension == 'mp4':
        media_type = "video/mp4"        
    elif extension == 'json':
        media_type = "application/json"

    return Response(content=data, media_type=media_type)    

@app1.get("/methodResults")
def methodResults():
    return read_method_result('method.json')

@app1.get("/samplesList")
def samplesList():
    contents = []
    try :

        configDict = config()

        samples_file = "/var/www/gt/%s" % configDict['samples_path']

        archive = zipfile.ZipFile(samples_file, 'r')

        if configDict['samplesListType'] == 'samples':
            contents = json.loads(archive.read('samples.json'))
            
        else:

            listOfiles = archive.namelist()

            for file in listOfiles:

                output = re.search(configDict['samplesRegExp'], file)

                if output is not None:
                    contents.append( {"id": output.group(1),"images":[file]})

        archive.close()

        return contents

    except Exception as e:   
        print(e)
        return []


error_msg = ""

@app1.get("/validate_config")
def validate_config():
    try :

        configDict = config()

        if not 'gt_path' in configDict:
            return {"result":False,"msg":"Ground truth file not specified"}

        gt_file = "/var/www/gt/%s" % configDict['gt_path']

        if os.path.isfile(gt_file) == False:
            return {"result":False,"msg":"Ground truth file not exists"}

        if not 'methodMetrics' in configDict:
            return {"result":False,"msg":"Configuration error: Missing 'methodMetrics' key"}

        resMethodMetrics = validate_method_params(configDict['methodMetrics'])
        if not resMethodMetrics['result']:
            return resMethodMetrics

        if configDict['script'] != "":
            script_file = "/code/scripts/%s.py" % configDict['script']
            if os.path.isfile(script_file) == False:
                return {"result":False,"msg":"Script file not found"}


        if not 'samples' in configDict:
            return {"result":False,"msg":"Configuration error: Missing 'samples' key"}

        if configDict['samples'] :
            if not 'samples_path' in configDict:
                return {"result":False,"msg":"Configuration error: Missing 'samples_path' key"}

            samples_file = "/var/www/gt/%s" % configDict['samples_path']

            if os.path.isfile(samples_file) == False:
                return {"result":False,"msg":"Samples file not exists"}

            archive = zipfile.ZipFile(samples_file, 'r')

            if configDict['samplesListType'] == 'samples':
                if not "samples.json" in archive.namelist():
                    archive.close()
                    return {"result":False,"msg":"File samples.json not present in the samples zip"}

                json_obj = json.loads(archive.read('samples.json'))
                if not isinstance(json_obj, list) :
                    archive.close()
                    return {"result":False,"msg":"File samples.json not valid. Root element must be an array. [ {\"id\":\"sample1\",\"images\":[\"f1.jpg\",...]}, ... ]"}

            else:
                listOfiles = archive.namelist()
                hasFiles = False
                for file in listOfiles:
                    output = re.search(configDict['samplesRegExp'], file)
                    if output is not None:
                        hasFiles = True
                        break
                if hasFiles == False:
                    return {"result":False,"msg":"No files in the samples ZIP match the regular expresion"}

            archive.close()

        return {"result":True}

    except Exception as e:    
        print(e)
        return {"result":False,"msg":e}

@app1.post("/save_config")
def save_config( config: Optional[str] = Form("")):

    #try :
    jsonVar = json.loads(config)
    fd = open('/var/www/gt/config.json', "w")
    fd.write(json.dumps(jsonVar, indent=4))
    fd.close()

    if os.path.exists('/var/www/submits/results.zip'):
        os.unlink('/var/www/submits/results.zip')

    fd = open('/code/scripts/requirements.txt', "w")
    for item,value in jsonVar['scriptRequirements'].items():
        fd.write("%s==%s\n" % (item,value))
    fd.close()

    #Install PIP requirements
    try:
        urllib2.urlopen("http://host.docker.internal:9020/install")
    except Exception as e:    
        print(e)    

    return {"result":True}

    #except Exception as e:    
    #    print(e)
    #    return {"result":False,"msg":e}

@app1.post("/download_results")
def download_results( url: Optional[str] = Form("")):
    results_path = '/var/www/submits/results.zip'

    try :
        with urllib2.urlopen(url) as response, open(results_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)

        return {"result":True}

    except Exception as e:    
        print(e)
        return {"result":False,"msg":e}        


def validate_method_params(params):
    for key in params.keys():
        if not validate_method_metric_params(params[key]) :
            return {"result":False,"msg":"Configuration error: 'methodParams' key '%s' has incorrect parameters" % key}    
    return {"result":True}

def validate_method_metric_params(params):
    #TODO: validate params
    return True

   
@app1.post("/load_example")
def load_example( example:Optional[str] = Form(""), exampleFile: Union[UploadFile, None] = None ):

    example_path = UPLOAD_FOLDER + str(uuid.uuid4())
    os.mkdir(example_path)

    zip_path = example_path + "/" + str(uuid.uuid4()) + ".zip"

    if exampleFile != None :
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        zip_path = os.path.join(UPLOAD_FOLDER, str(uuid.uuid4())) 
        contents = exampleFile.file.read()

        fd = open(zip_path, "wb")
        fd.write(contents)
        fd.close()

    else:
        with urllib2.urlopen(example) as response, open(zip_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)

    with zipfile.ZipFile(zip_path) as zf:

        zf.extractall(example_path)

        zf.close()

        config_path = example_path + '/config.json'
        if os.path.exists(config_path) == False or os.path.isfile(config_path) == False :
            return {"result":False,"msg":"Config file folder not found %s" % config_path}

        
        for file_name in os.listdir('/code/scripts'):
            # construct full file path
            file = '/code/scripts/' + file_name
            if os.path.isfile(file):
                print('Deleting file:', file)
                os.remove(file)
            elif os.path.isdir(file):
                shutil.rmtree('/code/scripts/%s' % file_name)

        for file_name in os.listdir('/var/www/submits/'):
            # construct full file path
            file = '/var/www/submits/' + file_name
            if os.path.isfile(file):
                print('Deleting file:', file)
                os.remove(file)            

        for file_name in os.listdir('/var/www/gt/'):
            # construct full file path
            file = '/var/www/gt/' + file_name
            if os.path.isfile(file):
                print('Deleting file:', file)
                os.remove(file)                                 

        shutil.copyfile(config_path, '/var/www/gt/config.json')

        configDict = config()

        for file_name in os.listdir(example_path + '/scripts'):
            src = example_path + '/scripts/' + file_name
            dest = '/code/scripts/' + file_name
            if os.path.isfile(src):
                shutil.copyfile(src, dest)

        results_path = '/var/www/submits/results.zip'
        example_results_path = example_path + '/submits/results.zip'
        if os.path.exists(example_results_path) == True and os.path.isfile(example_results_path) == True :
            shutil.copyfile(example_results_path, results_path)

        method_path = '/var/www/submits/method.%s' % configDict["res_ext"]
        example_method_path = example_path + '/submits/method.%s' % configDict["res_ext"]
        if os.path.exists(example_method_path) == True and os.path.isfile(example_method_path) == True :
            shutil.copyfile(example_method_path, method_path)     

        samples_path = '/var/www/gt/%s' % configDict["samples_path"]
        example_samples_path = example_path + '/gt/' + configDict["samples_path"]
        if os.path.exists(example_samples_path) == True and os.path.isfile(example_samples_path) == True :
            shutil.copyfile(example_samples_path, samples_path)

        gt_path = '/var/www/gt/%s' % configDict["gt_path"]
        example_gt_path = example_path + '/gt/' + configDict["gt_path"]
        shutil.copyfile(example_gt_path, gt_path)        

        #Install PIP requirements
        try:
            urllib2.urlopen("http://host.docker.internal:9020/install")
        except Exception as e:    
            print(e)

        return {"result":True}


@app1.get("/export")
def export():

    #try :

        configDict = config()

        example_path = UPLOAD_FOLDER + str(uuid.uuid4())
        os.mkdir(example_path)

        zip_path = example_path + "/" + str(uuid.uuid4()) + ".zip"

        with zipfile.ZipFile(zip_path,'w') as zf:

            #add config file

            zf.write('/var/www/gt/config.json','config.json');

            gt_path = '/var/www/gt/%s' % configDict["gt_path"]
            zf.write(gt_path,'/gt/%s' % configDict["gt_path"]);

            if configDict["samples"] == True:
                samples_path = '/var/www/gt/%s' % configDict["samples_path"]
                zf.write(samples_path,'/gt/%s' % configDict["samples_path"])

            for file_name in os.listdir('/code/scripts'):
                if file_name != '__pycache__':
                    if os.path.isfile('/code/scripts/%s' % file_name) == True:
                        zf.write('/code/scripts/%s' % file_name,'/scripts/%s' % file_name)
                    elif os.path.isdir('/code/scripts/%s' % file_name) == True:
                        folder = file_name
                        for file_name in os.listdir('/code/scripts/%s' % folder):
                            if file_name != '__pycache__' and os.path.isfile('/code/scripts/%s/%s' % (folder,file_name)) == True:
                                zf.write('/code/scripts/%s/%s' % (folder,file_name),'/scripts/%s/%s' % (folder,file_name) )


            results_path = '/var/www/submits/results.zip'
            if os.path.exists(results_path) == True and os.path.isfile(results_path) == True :
                zf.write(results_path,'/submits/results.zip' )

            method_path = '/var/www/submits/method.%s' % configDict["res_ext"]
            if os.path.exists(method_path) == True and os.path.isfile(method_path) == True :
                zf.write(method_path,'/submits/method.%s' % configDict["res_ext"] )

            zf.close()

            return FileResponse(zip_path , media_type="application/zip") 

    #except Exception as e:    

    #    return {"result":False,"msg":e}     

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