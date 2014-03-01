var assert = require('assert'),
    mocha  = require('mocha'),
    pd     = require('../probabilitydrive').probabilitydrive;

describe('probabilitydrive.js', function() {

    var pdInstance;

    beforeEach(function() {
        pdInstance = new pd();
    });

    describe('observe()', function() {
        beforeEach(function() {
            // Start each test from the root page
            doJourney([
                '/'
            ]);
        });

        it('should ignore repeat calls with the same data', function() {
            doJourney([
                '/',
                '/',
                '/',
            ]);

            var result = pdInstance.determine();
            assert.equal(result.length, 0);
        });
        it('should chain with other module functions', function() {
            assert.equal(typeof pdInstance.observe('/').determine, 'function');
            assert.equal(typeof pdInstance.observe('/test').determine, 'function');
        });
    });

    describe('determine()', function() {
        beforeEach(function() {
            // Start each test from the root page
            doJourney([
                '/'
            ]);
        });

        it('should predict a simple repeat path', function() {
            doJourney([
                '/page1',
                '/'
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0].url, '/page1');
        });
        it('should predict multiple paths when count weightings are equal', function() {
            doJourney([
                '/page1',
                '/',
                '/page2',
                '/page3',
                '/'
            ]);
            var result = pdInstance.determine()
            assert.equal(result.length, 2);
            assert.equal(result[0].url, '/page1');
            assert.equal(result[1].url, '/page2');
        });
        it('should prioritise paths that have a higher count weighting', function() {
            doJourney([
                '/page1',
                '/',
                '/page2',
                '/',
                '/page2',
                '/',
                '/page3',
                '/'
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0].url, '/page2');
        });

        describe('the probability calculation', function() {
            beforeEach(function() {
                // Start each test from the root page
                doJourney([
                    '/',
                    '/page1',
                    '/',
                    '/page2',
                    '/',
                    '/page1',
                    '/'
                ]);
            });

            it('should give the probability based on the known total', function() {
                var result = pdInstance.determine();
                assert.equal(result.length, 1);
                assert.equal(roundTo2DecimalPlaces(result[0].probability), 0.67);
            });
        });

    });

    describe('routes()', function() {
        beforeEach(function() {
            pdInstance.routes([
                '/product/:id'
            ]);

            // Start each test from the root page
            doJourney([
                '/'
            ]);
        });

        it('should combine parameterised URLs', function() {
            doJourney([
                '/product/1',
                '/',
                '/product/2',
                '/',
                '/test',
                '/',
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0].url, '/product/:id');
        });
    });

    describe('blacklist()', function() {
        beforeEach(function() {
            pdInstance.blacklist([
                '/about',
                '/product/:id'
            ]);

            // Start each test from the root page
            doJourney([
                '/'
            ]);
        });

        it('should not count results for blacklisted pages', function() {
            doJourney([
                '/about',
                '/',
                '/about',
                '/',
                '/page1',
                '/'
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0].url, '/page1');
        });

        it('should still record results from a blacklisted page to a leaf page', function() {
            doJourney([
                '/about',
                '/page1',
                '/about',
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0].url, '/page1');
        });

        it('should blacklist parameterised pages', function() {
            doJourney([
                '/product/1',
                '/',
                '/product/2',
                '/',
                '/page1',
                '/',
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0].url, '/page1');
        });
    });

    describe('alias functions', function() {
        describe('here()', function() {
            it('is an alias of observe()', function() {
                assert.equal(pdInstance.here, pdInstance.observe);
            });
        });
        describe('next()', function() {
            it('is an alias of determine()', function() {
                assert.equal(pdInstance.next, pdInstance.determine);
            });
        });
    });

    function doJourney(steps) {
        steps.forEach(function(url) {
            pdInstance.observe(url);
        });
    }

    function roundTo2DecimalPlaces(number) {
        return Math.round(number * 100) / 100;
    }
});
