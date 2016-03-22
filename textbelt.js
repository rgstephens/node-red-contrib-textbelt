module.exports = function (RED) {
    var request = require('request');

    function TextbeltNode(config) {
        RED.nodes.createNode(this, config);
        this.field = config.field || "payload";
        var node = this;
        RED.log.debug('--- TextbeltNode ---');
        RED.log.debug('TextbeltNode node: ' + JSON.stringify(node));
        RED.log.debug('TextbeltNode config: ' + JSON.stringify(config));


        //var node = this;
        node.on('input', function (msg) {
            RED.log.debug('--- textbelt.on(input) ---');
            var value;
            if (config.field) {
                value = RED.util.getMessageProperty(msg, config.field);
            } else {
                value = msg.payload;
            }
            if (!value) {
                RED.log.debug('TextbeltNode typeof(value): ' + typeof(value));
                node.status({fill: "red", shape: "dot", text: RED._("textbelt.status.msgEmpty")});
                return;
            }
            RED.log.debug('TextbeltNode typeof(value): ' + typeof(value));
            RED.log.debug('TextbeltNode value: ' + JSON.stringify(value));
            var URL = 'http://textbelt.com/' + config.country;
            RED.log.debug('TextbeltNode URL: ' + URL);
            RED.log.debug('TextbeltNode Phone: ' + config.phone + ', msg: ' + msg);
            node.status({fill: "blue", shape: "ring", text: RED._("textbelt.status.connecting")});
            request({
                url: URL,
                method: "POST",
                json: true,
                timeout: 20000,
                form: { number: config.phone, message: value }
            }, function (error, response, body) {
                //RED.log.debug('Textbelt error: ' + JSON.stringify(error));
                if (response) {
                    switch (response.statusCode) {
                        case 200:
                            if (response.body.success) {
                                node.status({fill: "green", shape: "dot", text: RED._("textbelt.status.success")});
                                RED.log.debug('Textbelt response: ' + JSON.stringify(response));
                            } else {
                                RED.log.debug('Textbelt error: ' + response.body.message);
                                node.status({fill: "red", shape: "dot", text: RED._("textbelt.status.failed") + ', ' + response.body.message});
                            }
                            break;
                        case 404:
                            RED.log.debug('Textbelt 404 error: ' + response.body.message);
                            node.status({fill: "red", shape: "dot", text: RED._("textbelt.status.failed") + ', page not found'});
                            break;
                        default:
                            RED.log.debug('Textbelt response: ' + JSON.stringify(response));
                            node.status({fill: "red", shape: "dot", text: RED._("textbelt.status.failed")});
                    } // switch
                } else {
                    RED.log.debug('Textbelt error response: ' + JSON.stringify(response));
                    switch (error.code) {
                        case 'ENOTFOUND':
                            errorMsg = RED._("textbelt.status.notfound");
                            node.status({ fill: "red", shape: "dot", text: errorMsg });
                            break;
                        case 'ETIMEDOUT':
                            errorMsg = RED._("textbelt.status.timeout");
                            node.status({ fill: "red", shape: "dot", text: errorMsg });
                            break;
                        default:
                            RED.log.debug('Textbelt error: ' + error.code);
                            node.status({fill: "red", shape: "dot", text: RED._("textbelt.status.failed")});
                    }
                }
            });
        });

    }

    RED.nodes.registerType("textbelt", TextbeltNode);
};