const { merge } = require('loumbru');

const startUmbruCore = require('dp-services-ctl/lib/services/umbruCore/startUmbruCore');
const startInsightUi = require('./service-ctl/startInsightUI');

async function remove(services) {
  const insightDeps = [
    services.umbruCore,
  ];
  await Promise.all(insightDeps.map(instance => instance.remove()));
}

/**
 * @typedef InsightUI
 * @property {DapiCore} insightUi
 * @property {UmbruCore} umbruCore
 * @property {Promise<void>} clean
 * @property {Promise<void>} remove
 */

/**
 * Create Insight UI instance
 *
 * @param {object} [options]
 * @returns {Promise<InsightUI>}
 */
async function startInsightUI(options) {
  const instances = await startInsightUi.many(1, options);
  return instances[0];
}

/**
 * Create Insight UI instances
 *
 * @param {Number} number
 * @param {object} [options]
 * @returns {Promise<InsightUI[]>}
 */
startInsightUI.many = async function many(number, options = {}) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }
  if (number > 1) {
    throw new Error("We don't support more than 1 instance");
  }


  const umbruCoreInstancesPromise = startUmbruCore.many(number, options.umbruCore);
  const [umbruCoreInstances] = await Promise.all([
    umbruCoreInstancesPromise,
  ]);

  const instances = [];

  for (let i = 0; i < number; i++) {
    const umbruCore = umbruCoreInstances[i];


    const insightUIOptions = {
      container: {},
      config: {},
      ...options.insightUI,
    };

    merge(insightUIOptions.config, {
      servicesConfig: {
        umbrud: {
          connect: [{
            rpchost: `${umbruCore.getIp()}`,
            rpcport: `${umbruCore.options.getRpcPort()}`,
            rpcuser: `${umbruCore.options.getRpcUser()}`,
            rpcpassword: `${umbruCore.options.getRpcPassword()}`,
            zmqpubrawtx: `tcp://host.docker.internal:${umbruCore.options.getZmqPorts().rawtx}`,
            zmqpubhashblock: `tcp://host.docker.internal:${umbruCore.options.getZmqPorts().hashblock}`,
          }],
        },
      },
    });


    const insightUIPromise = await startInsightUI(insightUIOptions);

    const [insightUi] = await Promise.all([
      insightUIPromise,
    ]);


    const instance = {
      insightUi,
      umbruCore,
      async clean() {
        await remove(instance);

        const newServices = await startInsightUI(options);

        Object.assign(instance, newServices);
      },
      async remove() {
        await remove(instance);
      },
    };

    instances.push(instance);
  }

  return instances;
};

module.exports = startInsightUI;
