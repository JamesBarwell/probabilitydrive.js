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

    return ProbabilityDrive;

}));
