(function() {
    if (!window.localStorage) {
        console.warn('Sorry, this example needs localStorage support');
        return;
    }

    // Get ProbabilityDrive and a localStorage data store
    var probabilitydrive = new window.probabilitydrive;
    var cache = window.localStorage;

    // Retrieve and set the historical data from the data store
    var previousData;
    try {
        previousData = JSON.parse(cache.getItem('pd-data'));
    } catch (e) {
        // swallow the error - don't do this in real life!
    }

    log('setData', previousData);
    probabilitydrive.setData(previousData);

    // Observe the current path
    var pathname = window.location.pathname;
    log('observe', pathname);
    probabilitydrive.observe(pathname);

    // Save the updated data back to the data store
    var updatedData = probabilitydrive.getData('data');
    log('getData', updatedData);
    cache.setItem('pd-data', JSON.stringify(updatedData));

    // Make a prediction
    var prediction = probabilitydrive.determine();
    var info = getInfoFromPrediction(prediction);
    log('prediction', info);

    function getInfoFromPrediction(prediction) {
        var predictionsText = [];
        Object.keys(prediction).forEach(function(key) {
            var urlData = prediction[key];
            predictionsText.push(
                urlData.url + ' - probability: ' + urlData.probability
            );
        });
        return predictionsText;
    }

    function log(method, data) {
        console.log('probabilitydrive.' + method, data);
    }
})();
