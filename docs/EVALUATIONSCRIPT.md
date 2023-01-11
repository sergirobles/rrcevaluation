# Implement a Python evaluation script
Your script must implement 2 methods (validate_data and evaluate_method).

See an evaluation script example [here](./evaluation.py)

## def validate_data()
This method have to validate that the results file is correct validating all contents and format types. If the results file is a zip file, validate also the format of all files. 
If some error detected, raise an error eith information hellping the user to fix the error

INPUT:

| Parameter | Type | Description |
| --- | --- | --- |
| gtFilePath | String/required | Internal path of the Ground Truth. |
| submFilePath | String/required | Internal path with the results file. |
| evaluationParams | Dict | Dict with the parameters. If in your script you have defined the function default_evaluation_params, this paramter will return that function values updating them with the parameters defined in the task configuration. |

## def evaluate_method()
This method have to evaluate the submited method and fill an output dictionary

INPUT:

| Parameter | Type | Description |
| --- | --- | --- |
| gtFilePath | String/required | Internal path of the Ground Truth. |
| submFilePath | String/required | Internal path with the results file. |
| evaluationParams | Dict | Dict with the parameters. If in your script you have defined the function default_evaluation_params, this paramter will return that function values updating them with the parameters defined in the task configuration. |

OUTPUT:
A Dict with the following parameters:
| Parameter | Type | Description |
| --- | --- | --- |
| result | Boolean/optional | The evaluation have been completed |
| msg | String/optional | Error description if there's error on the evaluation  |
| method | Dict | Dict with the method results. At least all metrics defined in the configuration must be present here. |
| per_sample | Dict/optional | Dict with the results per sample. The keys are the sample IDs and the values are at least all metrics defined in the configuration. |
| output_items | Dict/optional | Dict with extra files that you can use on the visualization |