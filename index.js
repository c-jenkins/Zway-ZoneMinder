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
    self.retries = 0;
    self.maxRetryAttempts = 3;

    var service = config.zm_port == '443' ? "https" : "http";
    self.baseUrl = service + "://" + config.zm_host + ":" + config.zm_port;

    self.authCookie = self.authenticate(config, self.baseUrl)[1].trim();
    self.getMonitors(self.configureMonitors);

};

ZoneMinder.prototype.log = function (message) {
    console.log('[ZoneMinder] ' + message);
};

ZoneMinder.prototype.authenticate = function () {
    return system("/opt/z-way-server/automation/userModules/ZoneMinder/authenticateZoneMinder.sh",
        self.config.zm_username, self.config.zm_password, self.baseUrl);
};

ZoneMinder.prototype.getMonitors = function (responseCallback) {
    var self = this;

    self.retries++;

    http.request({
        url: self.baseUrl + "/zm/api/monitors.json",
        method: "GET",
        async: true,
        headers: {
            "Cookie": self.authCookie
        },
        success: function (response) {
            self.log("Monitors data collected");
            self.retries = 0;

            if (responseCallback !== null) {
                responseCallback(response.data);
            }
        },
        error: function (response) {
            self.log("Error when getting monitors (" + response.status + ")");
            if (response.status === 401 && self.retries <= self.maxRetryAttempts) {
                self.log("Retrying getMonitors(), attempt " + self.retries);
                self.authenticate();
                self.getMonitors(responseCallback);
            }
        }
    });
};

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
                    icon: "switch"
                }
            },
            overlay: {},
            handler: function (command, args) {
                if (command === "off" || command === "on") {
                    self.setMonitorFunction(this, monitorId, command === "on" ? "Modect" : "Monitor");
                }
            }
        });
        self.updateStateMetric(vDev, currentFunction === "Modect" ? "on" : "off");
        self.monitors.push(monitorId);
    });
};

ZoneMinder.prototype.updateStateMetric = function (vDev, state) {
    vDev.set("metrics:level", state);
};

ZoneMinder.prototype.stop = function () {
    var self = this;
    this.monitors.forEach( function (monitorId) {
        self.controller.devices.remove("ZoneMinder_Monitor_" + monitorId + "_" + self.id);
    });
};

ZoneMinder.prototype.setMonitorFunction = function (vDev, monitorId, monitorFunction) {
    var self = this;

    self.retries++;

    http.request({
        url: self.baseUrl + "/zm/api/monitors/" + monitorId + ".json",
        method: "POST",
        data: "Monitor[Function]=" + monitorFunction + "&Monitor[Enabled]:true",
        async: true,
        headers: {
            "Cookie": self.authCookie
        },
        success: function (response) {
            self.updateStateMetric(vDev, monitorFunction === "Modect" ? "on" : "off");
            self.retries = 0;
        },
        error: function (response) {
            self.log("Error when attempting to set monitor function (" + response.status + ")");
            if (response.status === 401 && self.retries <= self.maxRetryAttempts) {
                self.log("Retrying setMonitorFunction(), attempt " + self.retries);
                self.authenticate();
                self.setMonitorFunction(vDev, monitorId, monitorFunction);
            }
        }
    });
};


