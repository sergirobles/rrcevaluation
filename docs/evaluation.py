#!/usr/bin/env python
# -*- coding: utf-8 -*-


import json


def validate_data(gtFilePath, submFilePath, evaluationParams):
    """
    Method validate_data: validates that all files in the results folder are correct (have the correct name contents).
                            Validates also that there are no missing files in the folder.
                            If some error detected, raise the error
    """

    try:
        gtJson = json.load(open(gtFilePath,'rb'));

    except Exception as e:
        raise Exception('GT Not valid Json file')


    try:
        submJson = json.load(open(submFilePath,'rb'));
    except Exception as e:
        raise Exception('Submition Not valid Json file')
    

    gtKeys = gtJson['data'].keys()

    if not 'data' in submJson :
        raise Exception('primary "data" key not found on results dict')

    submKeys = submJson['data'].keys()
    if(len(gtKeys) != len(submKeys) ):
        raise Exception('Ground truth And detection samples must match')

    for file in submJson['data']:
        props = submJson['data'][file]
        if not 'type' in props:
            raise Exception('type attribute not found on results')

        det_type = submJson['data'][file]['type']

        if not det_type in ['ring','bracelet','earring','necklace','bracelet']:
            raise Exception('Parameter type (%s) not valid. Must be on of: ["ring","bracelet","earring","necklace","bracelet"]' % det_type)



def evaluate_method(gtFilePath, submFilePath, evaluationParams):
    """
    Method evaluate: evaluate the submited method and fill the output dictionary
    """

    
    gtJson = json.load(open(gtFilePath,'rb'));
    submJson = json.load(open(submFilePath,'rb'));

    # Dict with per sample results
    perSampleMetrics = {}

    totalScore = 0

    for file in submJson['data']:

        gt_type = gtJson['data'][file]['type']
        det_type = submJson['data'][file]['type']

        result = 1 if gt_type == det_type else 0

        totalScore += result

        perSampleMetrics[str(file)] = {'correct':result,'gt':gt_type,'detected':det_type}

    # Dict with the Method Metrics results
    methodMetrics = {'score':totalScore / len(gtJson['data']) }

    # Dict with extra files
    output_items = {}

    resDict = {'result':True,'msg':'','method': methodMetrics,'output_items':output_items,'per_sample':perSampleMetrics}
    return resDict
