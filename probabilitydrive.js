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
    }

    ProbabilityDrive.prototype.observe = function(url) {
        if (!this.currentUrl || this.currentUrl === url) {
            this.currentUrl = url;
            return this;
        }

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
                result.push(this.store[url][i]);
                minCount = this.store[url][i].count
            } else {
                break;
            }
        }
        return result;
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
        string = string.charAt(0) !== character
            ? string : string.substring(1);
        return string.split('/');
    }

    return ProbabilityDrive;

}));
