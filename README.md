probabilitydrive.js
======

Determines where a user is going to navigate to next on a website.

[![Build Status](https://travis-ci.org/JamesBarwell/probabilitydrive.js.svg?branch=master)](https://travis-ci.org/JamesBarwell/probabilitydrive.js)

Visitors to a website will often make repeated journeys through the same set of pages, or repeat the journeys made by others. On this basis, if we can observe where a user has been, we can make a good guess at where they will go next.

This library will help to analyse which paths have been visited previously and to make probabilistic predictions based on that knowledge. The accuracy of these predictions will depend upon the website in question, and the free will exhibited by its users!

Please note that this library leaves open the choice of how data will be persisted, and therefore offers no default implementation. The examples given below are not sufficient to track a user's journey on their own, as data is only stored in memory and will be lost when the user navigates to another page. See the included example code for a simple way to persist data using the Web Storage API.

## Install

### server-side with npm:
    npm install probabilitydrive

### client-side with bower:
    bower install probabilitydrive

or just copy the built, or built & minified file, to your project.

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

// Predict the most likely next paths(s)
probabilitydrive.determine();
[ '/products' ]

// Predict the next paths(s) greater than equal to a given probability threshold
probabilitydrive.probability(0.4);
[ '/products' ]

// Predict the next paths(s) that are in the given probability percentile or above
probabilitydrive.percentile(40);
[ '/products', '/events' ]
```

## Setup examples

```js
// Inform it about your website's path structure using :foo to parameterise them, so that observations along these routes are bundled together
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
[ '/products/:id' ]


// Blacklist paths you want to ignore entirely
probabilitydrive.blacklist([
    '/users/:id',
    '/404'
]);

// Ignore paths when making predictions until they have been observed at least a specified number of times
probabilitydrive.setCountThreshold(10);
```

## Utility Examples

```js
// Get the current analysis data
var data = probabilitydrive.getData();

// Set previously retrieved data
probabilitydrive.setData(data);

// i.e. the above are serialise and unserialise - you will need these if you wish to persist data.

// You can chain calls from observe()
probabilitydrive.observe('/example').determine();
```

## Credits
Thanks to...
* [umdjs](https://github.com/umdjs/umd) for the AMD bootstrap
