'use strict';


class AppBootHook {
  constructor(app) {
    this.app = app;
  }
  configWillLoad() {
    require('./lib/load_schema_v2')(this.app);
    // require('./lib/load_connector')(this.app);
  }
}
module.exports = AppBootHook;

