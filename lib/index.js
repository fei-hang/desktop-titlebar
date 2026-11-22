// src/index.ts
/**
* Host half of the desktop title bar plugin.
*
* The bar is browser presentation: the client bundle registers it into the
* frame's `shell.overlay` seat. This module exists so the profile loader has a
* plugin to activate and the bundle patch has a row to insert.
* @module index
*/
/** Row name this package answers to. */
const name = "desktop-titlebar";
/** The host half requires no services. */
const inject = [];
/** Nothing to do on the host side. */
function apply() {}
export { apply, inject, name };

//# sourceMappingURL=index.js.map