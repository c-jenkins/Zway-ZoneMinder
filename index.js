/*** ZoneMinder Zway module *******************************************
 Version: 0.0.1
 -----------------------------------------------------------------------------
 Author: Chris Jenkins
 ******************************************************************************/

function ZoneMinder(id, controller) {
    ZoneMinder.super_.call(this, id, controller);
}

inherits(ZoneMinder, AutomationModule);

_module = ZoneMinder;


ZoneMinder.prototype.init = function (config) {

    ZoneMinder.super_.prototype.init.call(this, config);
    console.log('ZoneMinder: starting...');

    var self = this;
    self.config = config;
    self.authCookie = null;

    var service = config.zm_port == '443' ? "https" : "http";
    self.baseUrl = service + "://" + config.zm_host + ":" + config.zm_port;

    this.log = function (message) {
        console.log('[ZoneMinder] ' + message);
    };

    this.getMonitors = function (baseUrl) {
        http.request({
            url: baseUrl + "/zm/api/monitors.json",
            method: "GET",
            async: true,
            success: function (response) {
                self.log("Monitors: " + response.data);
            }
        });
    }

    this.authenticate = function (config, baseUrl) {
        var args = config.zm_username + " " + config.zm_password + " " + baseUrl;
        return system("/opt/z-way-server/automation/userModules/ZoneMinder/authenticateZoneMinder.sh " + args);
    }

    self.authCookie = self.authenticate(config, self.baseUrl);
    self.getMonitors(self.baseUrl);
};

