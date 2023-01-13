# Samples
To show details of the results at per sample level, you will have to provide a ZIP file with your samples.

Include a compressed version of the samples (ex: JPG 1024px) as it's used only for the visualization part.

[Here](./compression.py) you have a Python Script to compress images on a ZIP file

You will have to add a relation between your samples and your GT keys.
To do so you have 2 options:

## Using a regular expression
Enter a regular expression on the task configuration that will filter files in the samples ZIP and also get the Identificator of each sample.
The Identificator will be the first capturing group of the regular expression.

Examples:

| Regular Expresion | Name | Match | ID |
| --- | --- | --- | --- |
| (.+).jpg | img_2232.jpg | True | img_2232 |
| (.+).png | img_2232.jpg | False |  |
| (.+).(jpg\|png) | img_2232.jpg | True | img_2232 |
| img_([0-9]+).jpg | img_2232.jpg | True | 2232 |
| (.+) | img_2232.jpg | True | img_2232.jpg |


Note that with regular expression you can only assign 1 image to a sample. If you need to assign more than 1 image to a GT sample, you have to add a samples.json file.


## Adding a samples.json file
Add a file named "samples.json" in your samples ZIP file that will contain the relation between the GT samples IDs and the images.

Following is the JSON format of the file:

```
[ 
    {
        "id":"sample1",
        "images":[ 
            "sample1-pic1.jpg",
            "sample1-pic2.jpg",
            ...
            ]
    }, {
        "id":"sample2",
        "images":[ 
            "sample2-pic1.jpg",
            "sample2-pic2.jpg",
            ...
            ]
    }
    ...

]
```
