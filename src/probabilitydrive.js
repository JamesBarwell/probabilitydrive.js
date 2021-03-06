(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.probabilitydrive = factory();
    }
}(this, function () {

    function ProbabilityDrive(countThreshold, routes, blacklist) {
        this.currentPath;
        this.store          = {};
        this.countThreshold = countThreshold || 0;
        this.routePaths     = routes || [];
        this.blacklistPaths = blacklist || [];
    }

    /**
     * Observe a specified path, to track a user's journey
     *
     * @param {string} path
     *
     * @return ProbabilityDrive
     */
    ProbabilityDrive.prototype.observe = function(path) {
        if (path !== this.currentPath &&
            this.currentPath !== undefined
        ) {
            incrementPath.call(this, path);
        }

        this.currentPath = path;
        return this;
    }

    /**
     * Get the most likely next paths in the user's journey
     *
     * @param {string} path
     *
     * @return string[]
     */
    ProbabilityDrive.prototype.determine = function(path) {
        path = path || this.currentPath;

        var minCount = 0;
        var result   = [];

        iterateStore.call(this, path, function(pathData) {
            if (minCount > pathData.count) {
                return false;
            }
            result.push(pathData.path);
            minCount = pathData.count
        });

        return result;
    }

    /**
     * Get all the paths whose probability is in the given percentile and above
     *
     * @param {number} percentile
     * @param {string} path
     *
     * @return string[]
     */
    ProbabilityDrive.prototype.percentile = function(percentile, path) {
        percentile = percentile / 100;
        path = path || this.currentPath;

        var data = this.store[path];
        if (!data || !data[0]) {
            return [];
        }

        var multiplier = 1 / data[0].probability;
        var result = [];

        iterateStore.call(this, path, function(pathData, i) {
            if (i !== 0 &&
                pathData.probability * multiplier < percentile
            ) {
                return false;
            }
            result.push(pathData.path);
        });

        return result;
    }

    /**
     * Get all the paths whose probability is over the specified amount
     *
     * @param {number} probability
     * @param {string} path
     *
     * @return string[]
     */
    ProbabilityDrive.prototype.probability = function(probability, path) {
        path = path || this.currentPath;
        var result = [];

        iterateStore.call(this, path, function(pathData, i) {
            if (pathData.probability < probability) {
                return false;
            }
            result.push(pathData.path);
        });

        return result;
    }

    /**
     * Set a threshold for path observations which unless met will exclude them
     * from predictions
     *
     * @param {number} threshold
     *
     * @return ProbabilityDrive
     */
    ProbabilityDrive.prototype.setCountThreshold = function(threshold) {
        this.countThreshold = threshold;
        return this;
    }

    /**
     * Parameterise paths so that they will be bundled together
     *
     * @param {string[]} routes
     *
     * @return ProbabilityDrive
     */
    ProbabilityDrive.prototype.routes = function(routes) {
        for (var i = 0; i < routes.length; i++) {
            this.routePaths.push(
                stripAndBreakPath(routes[i], '/')
            )
        }
        return this;
    }

    /**
     * Blacklist paths so that they will never be returned in predictions
     *
     * @param {string[]} routes
     *
     * @return ProbabilityDrive
     */
    ProbabilityDrive.prototype.blacklist = function(routes) {
        for (var i = 0; i < routes.length; i++) {
            this.blacklistPaths.push(
                stripAndBreakPath(routes[i], '/')
            )
        }
        return this;
    }

    /**
     * Serialise the observation data
     *
     * @return string[]
     */
    ProbabilityDrive.prototype.getData = function() {
        return {
            currentPath: this.currentPath,
            store:      this.store
        };
    }

    /**
     * Deserialise the observation data
     *
     * @param {string[]} data
     *
     * @return ProbabilityDrive
     */
    ProbabilityDrive.prototype.setData = function(data) {
        data = data || {};

        this.currentPath = data.currentPath;
        this.store      = data.store || {};

        return this;
    }

    /**
     * Convenience method to iterate through the store under a URL
     *
     * Can optionally filter count threshold; defaults to global threshold
     * Returning false from the callback will terminate the loop early.
     */
    function iterateStore(path, callback, countThreshold) {
        if (countThreshold === undefined) {
            countThreshold = this.countThreshold;
        }

        for (var i in this.store[path]) {
            var pathData = this.store[path][i];

            if (countThreshold && pathData.count < countThreshold) {
                continue;
            }

            if (false === callback.call(this, pathData, i)) {
                return;
            }
        }
    }

    function incrementPath(path) {
        if (matchRoute(path, this.blacklistPaths)) {
            // Route is blacklisted
            return;
        }

        var matchResult = matchRoute(path, this.routePaths);
        if (matchResult) {
            // Use parameterised route
            path = matchResult;
        }

        this.store[this.currentPath] = this.store[this.currentPath] || [];

        var found = false;

        iterateStore.call(this, this.currentPath, function(pathData, i) {
            if (pathData.path === path) {
                found = true;
                pathData.count++;
            }
        }, 0);

        if (!found) {
            this.store[this.currentPath].push({
                path:   path,
                count: 1,
                probability: 0
            });
        }

        analyse.call(this, this.currentPath);
    }

    function analyse(path) {
        if (!this.store[path]) {
            return;
        }

        var total = 0;

        iterateStore.call(this, path, function(pathData, i) {
            total += pathData.count;
        }, 0);

        iterateStore.call(this, path, function(pathData, i) {
            pathData.probability = pathData.count / total;
        }, 0);

        this.store[path].sort(function(a, b) {
            return a.count < b.count;
        });
    }

    function matchRoute(path, list) {
        var pathParts = stripAndBreakPath(path, '/');

        for (var i = 0; i < list.length; i++) {
            var routePathParts = list[i];
            if (isMatchRouteParts(pathParts, routePathParts)) {
                return '/' + routePathParts.join('/');
            }
        }

        return false;
    }

    function isMatchRouteParts(pathParts, routePathParts) {
        for (var i = 0; i < routePathParts.length; i++) {
            if (!pathParts[i] ||
                (routePathParts[i] !== pathParts[i] &&
                routePathParts[i].indexOf(':') === -1)
            ) {
                break;
            }

            return true;
        }
        return false;
    }

    function stripAndBreakPath(string, character) {
        string = string.charAt(0) !== character ? string : string.substring(1);
        return string.split('/');
    }

    return ProbabilityDrive;

}));
