// logger.js

function getTimestamp() {
    const now = new Date();
    return now.toISOString();
}

function log(message, ...optionalParams) {
    console.log(`${getTimestamp()} [LOG]  `, message, ...optionalParams);
}

function warn(message, ...optionalParams) {
    console.warn(`${getTimestamp()} [WARN] `, message, ...optionalParams);
}

function error(message, ...optionalParams) {
    console.error(`${getTimestamp()} [ERROR]`, message, ...optionalParams);
}

module.exports = {
    log,
    warn
};