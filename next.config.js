const { i18n } = require('./next-i18next.config');

/** @type {import('next').nextconfig} */
const nextconfig = {
  reactstrictmode: true,
  i18n,
};

module.exports = nextconfig;
