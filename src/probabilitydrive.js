(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.probabilitydrive = factory();
    }
}(this, function () {

    function ProbabilityDrive() {
        this.currentUrl;
        this.store           = {};
        this.routeUrls       = [];
        this.blacklistUrls   = [];
        this.countThreshold  = 0;
    }

    ProbabilityDrive.prototype.observe = function(url) {
        if (!this.currentUrl || this.currentUrl === url) {
            this.currentUrl = url;
            return this;
        }

        incrementUrl.call(this, url);
        analyse.call(this, this.currentUrl);

        this.currentUrl = url;

        return this;
    }

    ProbabilityDrive.prototype.determine = function() {
        url = this.currentUrl;

        var minCount = 0;
        var result = [];

        iterateStore.call(this, url, function(urlData) {
            if (minCount > urlData.count) {
                return false;
            }
            result.push(urlData.url);
            minCount = urlData.count
        });
        return result;
    }

    ProbabilityDrive.prototype.percentile = function(percentile) {
        percentile = percentile / 100;

        var data = this.store[this.currentUrl];
        if (!data) {
            return [];
        }

        var first = data[0];

        var multiplier = 1 / first.probability;

        var results = [];
        results.push(first.url);

        iterateStore.call(this, url, function(urlData, i) {
            if (i == 0) {
                return;
            }

            if (urlData.probability * multiplier < percentile) {
                return false;
            }

            results.push(urlData.url);
        });
        return results;
    }

    ProbabilityDrive.prototype.probability = function(probability) {
        var data = this.store[this.currentUrl];
        var result = [];

        iterateStore.call(this, url, function(urlData, i) {
            if (urlData.probability < probability) {
                return false;
            }
            result.push(urlData.url);
        });
        return result;
    }

    ProbabilityDrive.prototype.setCountThreshold = function(threshold) {
        this.countThreshold = threshold;
    }

    ProbabilityDrive.prototype.routes = function(routes) {
        for (var i = 0; i < routes.length; i++) {
            this.routeUrls.push(
                stripAndBreakUrl(routes[i], '/')
            )
        }
    }

    ProbabilityDrive.prototype.blacklist = function(routes) {
        for (var i = 0; i < routes.length; i++) {
            this.blacklistUrls.push(
                stripAndBreakUrl(routes[i], '/')
            )
        }
    }

    ProbabilityDrive.prototype.getData = function() {
        return {
            currentUrl: this.currentUrl,
            store: this.store
        };
    }

    ProbabilityDrive.prototype.setData = function(data) {
        data = data || {};
        this.currentUrl = data.currentUrl;
        this.store = data.store || {};
    }

    // Aliases
    ProbabilityDrive.prototype.here =
        ProbabilityDrive.prototype.observe

    /**
     * Convenience method to iterate through the store under a URL
     *
     * Will always respect countThreshold
     * Returning false from the callback will terminate the loop early.
     */
    function iterateStore(url, callback) {
        for (var i in this.store[url]) {
            var urlData = this.store[url][i];

            if (urlData.count < this.countThreshold) {
                continue;
            }

            if (false === callback.call(this, urlData, i)) {
                return;
            }
        }
    }

    function incrementUrl(url) {
        if (matchRoute(url, this.blacklistUrls)) {
            // Route is blacklisted
            return;
        }

        var matchResult = matchRoute(url, this.routeUrls);
        if (matchResult) {
            // Use parameterised route
            url = matchResult;
        }

        this.store[this.currentUrl] = this.store[this.currentUrl] || [];

        var found = false;
        for (var i in this.store[this.currentUrl]) {
            if (this.store[this.currentUrl][i].url === url) {
                found = true;
                this.store[this.currentUrl][i].count += 1;
                break;
            }
        }

        if (!found) {
            this.store[this.currentUrl].push({
                url:   url,
                count: 1,
                probability: 0
            });
        }
    }

    function analyse(url) {
        if (!this.store[url]) {
            return;
        }

        var total = this.store[url].reduce(function(total, urlData) {
            return total += urlData.count;
        }, 0);

        this.store[url].forEach(function(urlData) {
            urlData.probability = urlData.count / total;
        });

        this.store[url].sort(function(a, b) {
            return a.count < b.count;
        });
    }

    function matchRoute(url, list) {
        var urlParts = stripAndBreakUrl(url, '/');

        for (var i = 0; i < list.length; i++) {
            var routeUrlParts = list[i];
            if (isMatchRouteParts(urlParts, routeUrlParts)) {
                return '/' + routeUrlParts.join('/');
            }
        }

        return false;
    }

    function isMatchRouteParts(urlParts, routeUrlParts) {
        for (var i = 0; i < routeUrlParts.length; i++) {
            if (!urlParts[i] ||
                (routeUrlParts[i] !== urlParts[i] &&
                routeUrlParts[i].indexOf(':') === -1)
            ) {
                break;
            }

            return true;
        }
        return false;
    }

    function stripAndBreakUrl(string, character) {
        string = string.charAt(0) !== character ? string : string.substring(1);
        return string.split('/');
    }

    return ProbabilityDrive;

}));
