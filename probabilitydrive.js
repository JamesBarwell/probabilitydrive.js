(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.probabilitydrive = factory();
    }
}(this, function () {

    function ProbabilityDrive() {
        this.store = {};
        this.currentUrl;
        this.routeUrls = [];
        this.matchedUrlsMemo = {};
    }

    ProbabilityDrive.prototype.observe = function(url) {
        if (!this.currentUrl || this.currentUrl === url) {
            this.currentUrl = url;
            return this;
        }

        this.store[this.currentUrl] = this.store[this.currentUrl] || [];

        incrementUrl.call(this, url);

        this.currentUrl = url;

        return this;
    }

    ProbabilityDrive.prototype.determine = function(url) {
        url = url || this.currentUrl;

        analyse.call(this, url);

        var minCount = 0;
        var result = [];

        for (var i in this.store[url]) {
            if (minCount <= this.store[url][i].count) {
                result.push(this.store[url][i].url);
                minCount = this.store[url][i].count
            } else {
                break;
            }
        }

        return result.length === 1 && result[0] || result;
    }

    ProbabilityDrive.prototype.routes = function(routes) {
        routes.forEach(function(route) {
            route = stripInitialChar(route, '/');
            this.routeUrls.push(route.split('/'))
        }.bind(this));
    }

    ProbabilityDrive.prototype.getData = function() {
        return this.store;
    }

    ProbabilityDrive.prototype.setData = function(data) {
        this.store = data;
    }

    // Aliases
    ProbabilityDrive.prototype.here =
        ProbabilityDrive.prototype.observe
    ProbabilityDrive.prototype.next =
        ProbabilityDrive.prototype.determine

    function incrementUrl(url) {
        var found = false;

        var matchResult = matchRoute.call(this, url);
        if (matchResult) {
            url = matchResult;
        }

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
                count: 1
            });
        }
    }

    function analyse(url) {
        this.store[url].sort(function(a, b) {
            return a.count < b.count;
        });
    }

    function matchRoute(url) {
        if (this.matchedUrlsMemo[url]) {
            return this.matchedUrlsMemo[url];
        }

        var urlParts = stripInitialChar(url, '/').split('/');

        for (var i = 0; i < this.routeUrls.length; i++) {
            var routeUrlParts = this.routeUrls[i];
            for (var j = 0; j <  routeUrlParts.length; j++) {
                if (!urlParts[j] ||
                    (routeUrlParts[j] !== urlParts[j] &&
                    routeUrlParts[j].indexOf(':') === -1)
                ) {
                    break;
                }

                this.matchedUrlsMemo[url] = '/' + routeUrlParts.join('/');
                return this.matchedUrlsMemo[url];
            }
        }

        return false;
    }

    function stripInitialChar(string, character) {
        return string.charAt(0) !== character
            ? string : string.substring(1);
    }

    return ProbabilityDrive;

}));
