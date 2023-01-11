# HOSTING COMPETITION ON RRC

To hold a competition on the RRC site you have to:
- Implement a Python evaluation script or provide a Docker implementing a REST service
- Provide the Ground Truth
- Provide a task configuration file
- If you want to show samples information:
    - Provide samples Zip
    - Enter details on the configuration file

In this project we have included an utility to create the configuration file, test the calls to you evaluation and see the results as it will appear on the RRC site.

## Set-up
[Install Docker](https://docs.docker.com/get-docker/) (and Docker-Compose)

Start the docker project
```
docker-compose up
```

Acess to the utility
```
http://localhost:9010
```


## Evaluation

The simplest way to create your evaluation is to create a Python evaluation script implementing 2 methods (validate_data and evaluate_method).

[Evaluation script info](docs/EVALUATIONSCRIPT.md)

If your evaluation is not in Python, you have to provide a Docker implementing a REST fucntion.

[Evaluation docker info](docs/EVALUATIONDOCKER.md)

