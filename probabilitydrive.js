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
            route = stripAndBreakUrl(route, '/');
            this.routeUrls.push(route)
        }.bind(this));
    }

    ProbabilityDrive.prototype.blacklist = function(routes) {
        routes.forEach(function(route) {
            route = stripAndBreakUrl(route, '/');
            this.blacklistUrls.push(route)
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

        if (matchRoute(url, this.blacklistUrls)) {
            return;
        }

        var matchResult = matchRoute(url, this.routeUrls);
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
