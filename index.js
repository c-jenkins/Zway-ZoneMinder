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

    const DIRECT_DEVICES = [
        'toggleButton'
    ];


    ZoneMinder.super_.prototype.init.call(this, config);
    console.log('ZoneMinder: starting...');

    var self = this;
    self.config = config;
    self.status = {};

    this.log = function (message) {
        console.log('ZoneMinder: ' + message);
    };

};

