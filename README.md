probabilitydrive.js
======

Determines where a user is going to navigate to next on a website.

Visitors to a website will often make repeated journeys through the same set of pages, or repeat the journeys made by others. On this basis, if we can observe where a user has been, we can make a good guess at where they will go next.

This library will help to analyse which URLs have been visited previously and to make probabilistic predictions based on that knowledge. The accuracy of these predictions will depend upon the website in question, and the free will exhibited by its users!

## Examples
```js
// Hook it into your site
window.onload = function() {
    probabilitydrive.observe(window.location.href);
}

// or using jQuery
$(function() {
    probabilitydrive.observe(window.location.href);
});

// Get the most probable next page(s)
probabilitydrive.determine(); // returns ['/products']

// Get the most probable next pages within a given percentile
probabilitydrive.percentile(75); // returns ['/products', '/specials']

// Get the most probable next pages over a given probability threshold
probabilitydrive.threshold(0.3); // returns ['/products', '/specials', '/help']

// Tell probabilitydrive about your website's URL structure
probabilitydrive.routes([
    '/products/:id',
    '/products/:id/info'
]);

// Blacklist URLs you want to ignore
probabilitydrive.blacklist([
    '/users/:id',
    '/404'
]);
```

## Credits
Thanks to...
* [umdjs](https://github.com/umdjs/umd) for the AMD bootstrap
