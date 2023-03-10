# Implementing your own docker
As working with docker, you can opt for your preferred programming language. The calculations but must be implemented on the same machine, you can’t call any external service for that purpose.

With the provided utility, an evaluation docker with Python it's runing on port 9020 (folder dockers/python3.9). **Don't modify** that docker, create a new one and enter the new port number on the configuration.

Your docker must implement a REST service implementing the following 2 methods:

## Submition validation [POST] /validate
This method must validate the submition file/s and verify that all files have the correct format (all required fields are present and have to correct type) and the sample IDs match the Ground Truth ones.

INPUT:

| Parameter | Type | Description |
| --- | --- | --- |
| gt | String/required | Internal path of the Ground Truth. If not specified the Ground Truth has to be inside the docker. (/var/www/gt/test.json in the example) |
| results | String | Internal path with the results file. (* Required if resultsFile param is not specified.) RRC will call it with a value starting with /var/www/submits (the docker mounted folder) |
| resultsFile | File | File with the results |
| methodParams | String/optional | Method params in JSON |
| evaluationScript | String/optional | The name of the primary evaluation script used for the evaluation |
| resultsExtension | String | The extension requested for the file with results |

OUTPUT:
A JSON string with the following Dict:

| Key | Type | Description |
| --- | --- | --- |
| result | Boolean | The results file is valid or not. |
| msg | String | If the results file is not valid, should return information here. |




## Results calculation [POST] /evaluate
This method evaluates the submition and calculates the results. If you want to show per sample information, the method has to generate a ZIP file with the file ‘method.json’ containing the method metrics results and also add individual sample information, adding the file {Sample ID}.json for each sample. Also, if your visualization requires extra information, you can add more files to the ZIP file so you can use it in your visualization.


INPUT:
| Parameter | Type | Description |
| --- | --- | --- |
| gt | String/required | Internal path of the Ground Truth. If not specified the Ground Truth has to be inside the docker. (/var/www/gt/test.json in the example) |
| results | String | Internal path with the results file. (* Required if resultsFile param is not specified.) RRC will call it with a value starting with /var/www/submits (the docker mounted folder) |
| resultsFile | File | File with the results |
| methodParams | String/optional | Method params in JSON |
| evaluationScript | String/optional | The name of the primary evaluation script used for the evaluation |
| resultsExtension | String | The extension requested for the file with results |
| calculateSamplesInfo | int | Indicates if the evaluation has to generate per sample information (1:yes) |

OUTPUT:
A JSON string with the following Dict:
| Key | Type | Description |
| --- | --- | --- |
| result | Boolean | The evaluation has been completed succesfully. |
| msg | String | Information about the error on the evaluation. |
| method | dict | Results for the whole method. Metric and score. |
| samplesUrl | String * | URL to download the results ZIP file with samples information. *Required if you want to show samples information. |


OUTPUT (ZIP file):
Your evaluation method must generate a ZIP file with the results. The contents of the ZIP file are:
| Filename | Type | Description |
| --- | --- | --- |
| method.json | Required | JSON dictionary with the method results. At least all keys defined in the configuration must be present here. |
| \[SAMPLE_ID\].json | Optional  | JSON dictionary with the sample results. At least all keys defined in the configuration must be present here. * Required if the configuration **samples** option is enabled. |
| *.* | Optional | The ZIP can include other files that you need for the visualization. |
