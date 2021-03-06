var assert = require('assert'),
    mocha  = require('mocha'),
    pd     = require('../src/probabilitydrive').probabilitydrive;

describe('probabilitydrive.js', function() {

    var pdInstance;

    beforeEach(function() {
        pdInstance = new pd();
    });

    describe('observe()', function() {
        var result;

        beforeEach(function() {
            navigatePaths('/');
            result = pdInstance.determine();
        });

        it('should return [] when it has no data', function() {
            assert.equal(result.length, 0);
        });
        it('should chain with other module functions', function() {
            assert.equal(typeof pdInstance.observe('/').determine, 'function');
            assert.equal(typeof pdInstance.observe('/test').determine, 'function');
        });
    });

    describe('determine()', function() {

        context('simple repeat path', function() {
            var result;

            beforeEach(function() {
                navigatePaths([
                    '/',
                    '/page1',
                    '/'
                ]);
                result = pdInstance.determine();
            });

            it('should predict the repeated path', function() {
                assert.equal(result.length, 1);
                assert.equal(result[0], '/page1');
            });
        });

        context('paths with equal weightings', function() {
            var result;

            beforeEach(function() {
                navigatePaths([
                    '/',
                    '/page1',
                    '/',
                    '/page2',
                    '/page3',
                    '/'
                ]);
                result = pdInstance.determine()
            });

            it('should predict the most repeated multiple paths', function() {
                assert.equal(result.length, 2);
                assert.equal(result[0], '/page1');
                assert.equal(result[1], '/page2');
            });
        });

        context('path with a higher count than others', function() {
            var result;

            beforeEach(function() {
                navigatePaths([
                    '/page1',
                    '/',
                    '/page2',
                    '/',
                    '/page2',
                    '/',
                    '/page3',
                    '/'
                ]);
                result = pdInstance.determine();
            });

            it('should predict the most visited path', function() {
                assert.equal(result.length, 1);
                assert.equal(result[0], '/page2');
            });
        });

        context('when a path is specified as context', function() {
            var result;

            beforeEach(function() {
                navigatePaths([
                    '/step1',
                    '/step2',
                    '/'
                ]);
                result = pdInstance.determine('/step1');
            });

            it('should predict within that context', function() {
                assert.equal(result.length, 1);
                assert.equal(result[0], '/step2');
            });
        });

        describe('with countThreshold() at 3', function() {
            beforeEach(function() {
                pdInstance.setCountThreshold(3);
            });

            context('and paths have not been observed 3 times', function() {
                var result;

                beforeEach(function() {
                    navigateBackForth('/page1', '/', 2);
                    result = pdInstance.determine();
                });

                it('should ignore those paths', function() {
                    assert.equal(result.length, 0);
                });
            });

            context('and paths have not been observed more than 3 times', function() {
                var result;

                beforeEach(function() {
                    navigateBackForth('/page1', '/', 2);
                    navigateBackForth('/page2', '/', 3);
                    result = pdInstance.determine();
                });

                it('should ignore those paths', function() {
                    assert.equal(result.length, 1);
                    assert.equal(result[0], '/page2');
                });
            });
        });

    });

    describe('percentile()', function() {
        beforeEach(function() {
            navigatePaths('/');
            navigateBackForth('/a', '/', 5);
            navigateBackForth('/b', '/', 4);
            navigateBackForth('/c', '/', 1);
        });

        it('should return the 100th percentile of results', function() {
            var result = pdInstance.percentile(100);
            assert.equal(result.length, 1);
            assert.equal(result[0], '/a');
        });
        it('should return the 80th percentile of results', function() {
            var result = pdInstance.percentile(80);
            assert.equal(result.length, 2);
            assert.equal(result[0], '/a');
            assert.equal(result[1], '/b');
        });
        it('should return the 25th percentile of results', function() {
            var result = pdInstance.percentile(25);
            assert.equal(result.length, 2);
            assert.equal(result[0], '/a');
            assert.equal(result[1], '/b');
        });

        context('when given a path', function() {
            it('should predict within that context', function() {
                var result = pdInstance.percentile(100, '/b');
                assert.equal(result.length, 1);
                assert.equal(result[0], '/');
            });
        });

        describe('with countThreshold() at 5', function() {
            beforeEach(function() {
                pdInstance.setCountThreshold(5);
            });

            it('should ignore URL data that has not been observed 5 times', function() {
                var result = pdInstance.percentile(80);
                assert.equal(result.length, 1);
                assert.equal(result[0], '/a');
            });
        });
    });

    describe('probability()', function() {
        beforeEach(function() {
            navigatePaths('/');
            navigateBackForth('/a', '/', 5);
            navigateBackForth('/b', '/', 4);
            navigateBackForth('/c', '/', 1);
        });

        describe('should return results over the probability threshold', function() {
            it('0.8', function() {
                var result = pdInstance.probability(0.8)
                assert.equal(result.length, 0);
            });
            it('0.5', function() {
                var result = pdInstance.probability(0.5)
                assert.equal(result.length, 1);
                assert.equal(result[0], '/a');
            });
            it('0.4', function() {
                var result = pdInstance.probability(0.4)
                assert.equal(result.length, 2);
                assert.equal(result[0], '/a');
                assert.equal(result[1], '/b');
            });
        });

        context('when given a path', function() {
            it('should predict within that context', function() {
                var result = pdInstance.probability(0.5, '/b')
                assert.equal(result.length, 1);
                assert.equal(result[0], '/');

                var result2 = pdInstance.probability(1, '/c')
                assert.equal(result2.length, 1);
                assert.equal(result2[0], '/');
            });
        });

        describe('with countThreshold() at 5', function() {
            beforeEach(function() {
                pdInstance.setCountThreshold(5);
            });

            it('should ignore URL data that has not been observed 5 times', function() {
                var result = pdInstance.probability(0.3)
                assert.equal(result.length, 1);
                assert.equal(result[0], '/a');
            });
        });
    });

    describe('routes()', function() {
        beforeEach(function() {
            pdInstance.routes([
                '/product/:id',
                '/account*',
                '/product/:id/info/*'
            ]);

            navigatePaths('/');
        });

        it('should combine parameterised paths', function() {
            navigatePaths([
                '/product/1',
                '/',
                '/product/2',
                '/',
                '/test',
                '/',
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0], '/product/:id');
        });

        it.skip('should combine wildcard matched paths', function() {
            navigatePaths([
                '/account',
                '/',
                '/account/profile',
                '/',
                '/test',
                '/'
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0], '/account*');
        });

        it.skip('should combine paramterised and wildcard matched paths', function() {
            navigatePaths([
                '/product/1/info/summary',
                '/',
                '/product/2/info',
                '/',
                '/product/2/info',
                '/',
                '/product/2/info/specs',
                '/',
                '/product/1/info/buying-options/delivery',
                '/'
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0], '/product/:id/info/*');
        });
    });

    describe('blacklist()', function() {
        beforeEach(function() {
            pdInstance.blacklist([
                '/about',
                '/product/:id'
            ]);

            navigatePaths('/');
        });

        it('should not count results for blacklisted pages', function() {
            navigateBackForth('/about', '/', 2);
            navigateBackForth('/page1', '/', 1);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0], '/page1');
        });

        it('should still record results from a blacklisted page to a leaf page', function() {
            navigatePaths([
                '/about',
                '/page1',
                '/about',
            ]);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0], '/page1');
        });

        it('should blacklist parameterised pages', function() {
            navigateBackForth('/product/1', '/', 1);
            navigateBackForth('/product/2', '/', 1);
            navigateBackForth('/page1', '/', 1);
            var result = pdInstance.determine();
            assert.equal(result.length, 1);
            assert.equal(result[0], '/page1');
        });
    });

    describe('constructor', function() {
        context('when count threshold is passed as first argument', function() {
            beforeEach(function() {
                pdInstance = new pd(5);
            });
            it('should use the count threshold');
        });
        context('when routes is passed as second argument', function() {
            beforeEach(function() {
                pdInstance = new pd(null, [
                    '/product/:id'
                ]);
            });
            it('should use the routes');
        });
        context('when blacklist is passed as third argument', function() {
            beforeEach(function() {
                pdInstance = new pd(null, null, [
                    '/404'
                ]);
            });
            it('should use the blacklist');
        });
    });

    describe('serialisation methods', function() {
        it('should have the same results before and after serialisation', function() {
            navigatePaths('/');
            navigateBackForth('/product/1', '/', 1);
            navigateBackForth('/product/2', '/', 1);
            navigateBackForth('/product/1', '/', 1);
            var results = {
                determine:   pdInstance.determine(),
                probability: pdInstance.probability(0.5),
                percentile:  pdInstance.percentile(50)
            }

            var data = pdInstance.getData();

            var newPdInstance = new pd();
            newPdInstance.setData(data);

            var newResults = {
                determine:   newPdInstance.determine(),
                probability: newPdInstance.probability(0.5),
                percentile:  newPdInstance.percentile(50)
            };

            assert.deepEqual(results, newResults);
        });
    });

    describe('error cases', function() {
        describe('when no observations have been made', function() {
            it('determine() should return an empty array', function() {
                var result = pdInstance.determine();
                assert.ok(Array.isArray(result));
                assert.equal(result.length, 0);
            });
            it('probability() should return an empty array', function() {
                var result = pdInstance.probability(0.5);
                assert.ok(Array.isArray(result));
                assert.equal(result.length, 0);
            });
            it('percentile() should return an empty array', function() {
                var result = pdInstance.percentile(50);
                assert.ok(Array.isArray(result));
                assert.equal(result.length, 0);
            });
        });
        describe('when the same observations are made multiple times', function() {
            beforeEach(function() {
                navigatePaths([
                    '/',
                    '/',
                    '/'
                ]);
            });
            it('should ignore repeat calls with the same data', function() {
                var result = pdInstance.determine();
                assert.equal(result.length, 0);
            });
        });
        describe('when called multiple times', function() {
            beforeEach(function() {
                navigateBackForth('/product/1', '/', 1);
                navigateBackForth('/product/2', '/', 1);
                navigateBackForth('/page1', '/', 1);
            });
            it('determine() should return the same result', function() {
                var results = [];
                for (var i = 0; i < 5; i++) {
                    results.push(pdInstance.determine());
                    assert.deepEqual(results[0], results[i]);
                }
            });
            it('probability() should return the same result', function() {
                var results = [];
                for (var i = 0; i < 5; i++) {
                    results.push(pdInstance.probability(0.5));
                    assert.deepEqual(results[0], results[i]);
                }
            });
            it('percentile() should return the same result', function() {
                var results = [];
                for (var i = 0; i < 5; i++) {
                    results.push(pdInstance.percentile(50));
                    assert.deepEqual(results[0], results[i]);
                }
            });
        });
        describe('when predictions are made for unknown paths', function() {
            beforeEach(function() {
                navigatePaths('/');
                navigateBackForth('/product/1', '/', 1);
            });
            it('should return an empty array', function() {
                var result = pdInstance.probability(0, 'undefined')
                assert.equal(result.length, 0);
            });
        });
    });

    /**
     * Helper function to simulate moving along the paths in the given array
     */
    function navigatePaths(steps) {
        if (typeof steps === 'string') {
            steps = [steps];
        }
        steps.forEach(function(url) {
            pdInstance.observe(url);
        });
    }

    /**
     * Helper function to simulate alternating back and forth between the two
     * given paths
     */
     function navigateBackForth(forth, back, repeat) {
        for (var i = 0; i < (repeat || 0); i++) {
            pdInstance.observe(forth);
            pdInstance.observe(back);
        }
     }


    function roundTo2DecimalPlaces(number) {
        return Math.round(number * 100) / 100;
    }
});
