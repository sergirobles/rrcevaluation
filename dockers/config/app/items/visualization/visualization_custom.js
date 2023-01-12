ClassVisualization.prototype.load_visualization = function(){

    /**
     * You can create you cutom visualization here, adding tems to the DIV with the ID 'div_sample'
     */

    $("#div_sample").html("");

    /*
        on the ClassVisualization you have the variables:

        sampleNum: The current sample number
        sampleId: The ID of the current sample
        sampleData: The data returned by the evaluation method (the contents of the file sampleId.json)

        Outside this function access it with the variable 'visualization' (ex: visualization.sampleId)


        You can load files from the user submited method (if it's a zip), form the results, from the global samples ZIP or from the GT file (if it's a zip).
        Use the following functions from the ClassVisualization class:

        getSamplesImageNum(sampleNum);
        getSamplesFile(file);
        getMethodFile(file);
        getMethodResultsFile(file);        
        getGTFile(file);

        The parameter file is the file you want to load from the zip.
    */

    var images = samples.data[visualization.sampleNum-1].images;
    for (var i=0;i<images.length;i++){
        let urlGtImg = this.getSamplesFile(images[i]);
        

        let html_info = `<ul>
                            <li>You can customize the visualization with Javascript and CSS (editing the 2 files mounted on the visualization folder).</li>
                            <li>Add items into the DIV with the ID 'div_sample'.</li>
                            <li>For CSS, use styles begining with #div_sample.</li>
                            <li>In this docker there's Bootstrap installed, but it's better to <b>DON'T USE</b> their classes and fill all your own custom styles in the CSS file (On the RRC website, currently there's a different Bootstrap version).</li>
                            <li>Don't import external files in CSS nor JavaScript.</li>
                        </ul>`;
        $("#div_sample").append(alert_info(html_info));

        $("#div_sample").append("<img class='your_img_class' src='" + urlGtImg + "'>");
    }

    for (var key in visualization.sampleData){
        $("#div_sample").append("<br>" + key + " = " + visualization.sampleData[key]);
    }

}