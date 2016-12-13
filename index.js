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
    self.monitors = [];

    var service = config.zm_port == '443' ? "https" : "http";
    self.baseUrl = service + "://" + config.zm_host + ":" + config.zm_port;

    self.authCookie = self.authenticate(config, self.baseUrl)[1];
    self.getMonitors(self.baseUrl);

};

ZoneMinder.prototype.log = function (message) {
    console.log('[ZoneMinder] ' + message);
};

ZoneMinder.prototype.authenticate = function (config, baseUrl) {
    return system("/opt/z-way-server/automation/userModules/ZoneMinder/authenticateZoneMinder.sh",
        config.zm_username, config.zm_password, baseUrl);
}

ZoneMinder.prototype.getMonitors = function (baseUrl) {
    var self = this;

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

ZoneMinder.prototype.configureMonitors = function (monitorConfig) {
    var self = this;
    monitorConfig.monitors.forEach(function (m) {
        var monitorId = m.Monitor.Id;
        var currentFunction = m.Monitor.Function;

        self.log("Monitor " + monitorId + ", Current Function: " + currentFunction);

        vDev = self.controller.devices.create({
            deviceId: "ZoneMinder_Monitor_" + monitorId + "_" + self.id,
            defaults: {
                deviceType: "switchBinary",
                metrics: {
                    title: "ZoneMinder Monitor " + monitorId,
                    icon: ""
                }
            },
            overlay: {},
            handler: function (command, args) {
                self.setMonitorFunction(monitorId, command === "on" ? "Modect" : "Monitor");
            }
        });
        self.monitors.push(monitorId);
    });
}

ZoneMinder.prototype.stop = function () {
    var self = this;
    this.monitors.forEach( function (monitorId) {
        self.controller.devices.remove("ZoneMinder_Monitor_" + monitorId + "_" + self.id);
    });
}

ZoneMinder.prototype.setMonitorFunction = function (monitorId, monitorFunction) {
    var self = this;

    http.request({
        url: self.baseUrl + "/zm/api/monitors/" + monitorId + ".json",
        method: "POST",
        data: "Monitor[Function]=" + monitorFunction + "&Monitor[Enabled]:true",
        async: true,
        headers: {
            "Cookie": self.authCookie
        },
        error: function (response) {
            self.log("Error when attempting to set monitor function (" + response.status + ")");
        }
    });
}


