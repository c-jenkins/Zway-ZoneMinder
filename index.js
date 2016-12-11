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
    self.authenticated = false;
    self.authenticationFailed = false;
    var service = config.zm_port == '443' ? "https" : "http";
    self.baseUrl = service + "://" + config.zm_host + ":" + config.zm_port;
    var moduleName = "ZoneMinder";
    
    this.getMonitors = function (config) {
        http.request({
            url: self.baseUrl + "/zm/api/monitors.json",
            method: "GET",
            async: true,
            success: function (response) {
                console.log("ZM Monitors: " + response.data);
            }
        });
    }

    this.authenticate = function (config) {
    
	this.log = function (message) {
            console.log('ZoneMinder: ' + message);
    	};

        http.request({
            url: self.baseUrl + "/zm/index.php",
            method: "POST",
            data: {
                username: config.zm_username,
                password: config.zm_password,
                action: "login",
                view: "console"
            },
            async: true,
            success: function (response) {
                console.log("ZM Auth successful");
                self.getMonitors(config);
            },
            error: function (response) {
                self.authenticationFailed = true;
                self.controller.addNotification("error", response.statusText, "module", moduleName);
            }
        });
    }

    this.authenticate(config);
};

