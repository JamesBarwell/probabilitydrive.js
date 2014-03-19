probabilitydrive.js
======

Determines where a user is going to navigate to next on a website.

Visitors to a website will often make repeated journeys through the same set of pages, or repeat the journeys made by others. On this basis, if we can observe where a user has been, we can make a good guess at where they will go next.

This library will help to analyse which URLs have been visited previously and to make probabilistic predictions based on that knowledge. The accuracy of these predictions will depend upon the website in question, and the free will exhibited by its users!

Please note that this library leaves open the choice of how data will be persisted, and therefore offers no default implementation. The examples given below are not sufficient to track a user's journey on their own, as data is only stored in memory and will be lost when the user navigates to another page. See the included example code for a simple way to persist data using the Web Storage API.

## Analysis examples
```js
// Create a new instance
var probabilitydrive = new ProbabilityDrive();

// Hook it into your site
window.onload = function() {
    probabilitydrive.observe(window.location.href);
}

// or hook it in using jQuery
$(function() {
    probabilitydrive.observe(window.location.href);
});

// Predict the most likely next URL(s)
probabilitydrive.determine();
[
    { url:'/products', count: 6, probability: 0.46153846153846156 }
]

// Predict the next URL(s) greater than equal to a given probability threshold
probabilitydrive.probability(0.4);
[
    { url:'/products', count: 6, probability: 0.46153846153846156 }
]

// Predict the next URL(s) that, in the range of URL probabilities, have a probability in the given percentile or above
probabilitydrive.percentile(40);
[
    { url:'/products', count: 6, probability: 0.46153846153846156 },
    { url:'/events', count: 5, probability: 0.38461538461538464 }
]
```

## Setup examples

```js
// Inform it about your website's URL structure using :foo to parameterise them, so that observations along these routes are bundled together
probabilitydrive.routes([
    '/products/:id',
    '/products/:id/info'
]);

// These will now all increase the probability count for '/products/:id'
probabilitydrive.observe('/products/1');
probabilitydrive.observe('/products/2');
probabilitydrive.observe('/products/3');

// and these will both increase the probability count for '/products/:id/info'
probabilitydrive.observe('/products/1/info');
probabilitydrive.observe('/products/2/info');

probabilitydrive.determine();
[ { url:'/products/:id', count: 42, probability: 0.5 } ]


// Blacklist URLs you want to ignore entirely
probabilitydrive.blacklist([
    '/users/:id',
    '/404'
]);

// Ignore URLs when making predictions until they have been observed at least a specified number of times
probabilitydrive.setCountThreshold(10);
```

## Utility Examples

```js
// Get the current analysis data
var data = probabilitydrive.getData();

// Set previously retrieved data
probabilitydrive.setData(data);

// You can chain calls from observe()
probabilitydrive.observe('/example').determine();
```

## Credits
Thanks to...
* [umdjs](https://github.com/umdjs/umd) for the AMD bootstrap
