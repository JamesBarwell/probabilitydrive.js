var assert = require('assert'),
    mocha  = require('mocha'),
    pd     = require('../src/probabilitydrive').probabilitydrive;

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

        describe('with countThreshold() at 3', function() {
            beforeEach(function() {
                pdInstance.setCountThreshold(3);
            });

            it('should ignore URL data that has not been observed 3 times', function() {
                doJourney([
                    '/page1',
                    '/',
                    '/page1',
                    '/'
                ]);
                var result = pdInstance.determine();
                assert.equal(result.length, 0);
            });

            it('should still predict URLs that have met the count threshold', function() {
                doJourney([
                    '/page1',
                    '/',
                    '/page1',
                    '/',
                    '/page2',
                    '/',
                    '/page2',
                    '/',
                    '/page2',
                    '/'
                ]);
                var result = pdInstance.determine();
                assert.equal(result.length, 1);
                assert.equal(result[0].url, '/page2');
            });
        });

    });

    describe('percentile()', function() {
        beforeEach(function() {
            // Start each test from the root page
            doJourney([
                '/',
                // 5 visits to /a
                '/a',
                '/',
                '/a',
                '/',
                '/a',
                '/',
                '/a',
                '/',
                '/a',
                '/',
                // 4 visits to /b
                '/b',
                '/',
                '/b',
                '/',
                '/b',
                '/',
                '/b',
                '/',
                // 1 visit to /c
                '/c',
                '/',
            ]);
        });

        it('should return the 100th percentile of results', function() {
            var result = pdInstance.percentile(100);
            assert.equal(result.length, 1);
            assert.equal(result[0].url, '/a');
        });
        it('should return the 80th percentile of results', function() {
            var result = pdInstance.percentile(80);
            assert.equal(result.length, 2);
            assert.equal(result[0].url, '/a');
            assert.equal(result[1].url, '/b');
        });
        it('should return the 25th percentile of results', function() {
            var result = pdInstance.percentile(25);
            assert.equal(result.length, 2);
            assert.equal(result[0].url, '/a');
            assert.equal(result[1].url, '/b');
        });

        describe('with countThreshold() at 5', function() {
            beforeEach(function() {
                pdInstance.setCountThreshold(5);
            });

            it('should ignore URL data that has not been observed 5 times', function() {
                var result = pdInstance.percentile(80);
                assert.equal(result.length, 1);
                assert.equal(result[0].url, '/a');
            });
        });
    });

    describe('probability()', function() {
        beforeEach(function() {
            // Start each test from the root page
            doJourney([
                '/',
                // 5 visits to /a
                '/a',
                '/',
                '/a',
                '/',
                '/a',
                '/',
                '/a',
                '/',
                '/a',
                '/',
                // 4 visits to /b
                '/b',
                '/',
                '/b',
                '/',
                '/b',
                '/',
                '/b',
                '/',
                // 1 visit to /c
                '/c',
                '/',
            ]);
        });

        describe('should return results over the probability threshold', function() {
            it('0.8', function() {
                var result = pdInstance.probability(0.8)
                assert.equal(result.length, 0);
            });
            it('0.5', function() {
                var result = pdInstance.probability(0.5)
                assert.equal(result.length, 1);
                assert.equal(result[0].url, '/a');
            });
            it('0.3', function() {
                var result = pdInstance.probability(0.3)
                assert.equal(result.length, 2);
                assert.equal(result[0].url, '/a');
                assert.equal(result[1].url, '/b');
            });
        });

        describe('with countThreshold() at 5', function() {
            beforeEach(function() {
                pdInstance.setCountThreshold(5);
            });

            it('should ignore URL data that has not been observed 5 times', function() {
                var result = pdInstance.probability(0.3)
                assert.equal(result.length, 1);
                assert.equal(result[0].url, '/a');
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
