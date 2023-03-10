# Creating a Task for a RRC Competition

To create a task for a competition held on the RRC site you have to:
- Provide the Ground Truth
- Implement a [Python evaluation script](docs/EVALUATIONSCRIPT.md) (the simplest way) or provide a [Docker](docs/EVALUATIONDOCKER.md) implementing a REST service
- Provide a [task configuration file](docs/CONFIGURATION.md)
- If you want to show detailed information for every test sample:
    - Provide a [samples Zip](docs/SAMPLES.md)
    - Enter details on the configuration file, such as the type of [visualization](docs/VISUALIZATION.md) to be used

In this project we have included a utility to create the configuration file, test your evaluation and see the results as they would appear on the RRC site.

## Set-up
[Install Docker](https://docs.docker.com/get-docker/) (and Docker-Compose)

Start the docker project
```
docker-compose up
```

In linux you will need root permisions. You can add permsisions to your user adding your current user to docker group
```
sudo usermod -aG docker $USER
```

And refresh permissions in the current session
```
newgrp docker
```


[Acess to the utility (http://localhost:9010)](http://localhost:9010)


## Packing files
When you have all your scripts and configuration ready, use the **Export** button on the utility to create a ZIP with all the files needed.

If you have implemented a new docker, send also to the RRC another file with your docker folder.
