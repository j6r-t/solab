"use strict";
module.exports = function (_module: { exports: unknown }, _exports: unknown) {
    ;(globalThis as Record<string, unknown>).exports = _exports
    ;(globalThis as Record<string, unknown>).module = _module
}
