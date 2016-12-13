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
    console.log('[ZoneMinder] starting...');

    var self = this;
    self.config = config;
    self.authCookie = null;

    var service = config.zm_port == '443' ? "https" : "http";
    self.baseUrl = service + "://" + config.zm_host + ":" + config.zm_port;

    self.authCookie = self.authenticate(config, self.baseUrl)[1];
    self.getMonitors(self.baseUrl);

};

ZoneMinder.prototype..log = function (message) {
    console.log('[ZoneMinder] ' + message);
};

ZoneMinder.prototype..authenticate = function (config, baseUrl) {
    return system("/opt/z-way-server/automation/userModules/ZoneMinder/authenticateZoneMinder.sh",
        config.zm_username, config.zm_password, baseUrl);
}

ZoneMinder.prototype..getMonitors = function (baseUrl) {
    http.request({
        url: baseUrl + "/zm/api/monitors.json",
        method: "GET",
        async: true,
        headers: {
            "Cookie": self.authCookie
        },
        success: function (response) {
            self.log("Monitors data collected");
            self.configureMonitors(response.data);
        },
        error: function (response) {
            self.log("Error when getting monitors (" + response.status + ")");
        }
    });
}

ZoneMinder.prototype..configureMonitors = function (monitorConfig) {
    monitorConfig.monitors.forEach(function (m) {
        self.log("Monitor " + m.Monitor.Id + ", State: " + m.Monitor.Function);
    });
}


