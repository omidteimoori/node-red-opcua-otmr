module.exports = function (RED) {
    function OpcuaOtmrNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.endpoint = config.endpoint;
        node.operation = config.operation || "read";
        node.port = parseInt(config.port);
        node.nodeIds = config.nodeIds ? config.nodeIds.split(",").map(id => id.trim()) : [];
        node.dataType = config.dataType;

        const opcua = require("node-opcua");
        let client = opcua.OPCUAClient.create();
        let session = null;

        async function connectToServer() {
            try {
                const endpointUrl = `${node.endpoint}:${node.port}`;
                await client.connect(endpointUrl);
                node.log("Connected to OPC UA server");
                session = await client.createSession();
                node.log("Session created");
            } catch (err) {
                node.error("Failed to connect to OPC UA server", err);
                node.status({ fill: "red", shape: "ring", text: "connection failed" });
            }
        }

        async function disconnectFromServer() {
            if (session) {
                try {
                    await session.close();
                    node.log("Session closed");
                } catch (closeError) {
                    node.error("Failed to close session", closeError);
                }
                session = null;
            }
            await client.disconnect();
            node.log("Disconnected from OPC UA server");
        }

        function inferDataType(value) {
            const type = typeof value;
            if (type === "number") return "Double";
            if (type === "boolean") return "Boolean";
            if (type === "string") return "String";
            return null;
        }

        node.on('input', async function (msg) {
            const nodeId = node.nodeIds[0];
            const configuredType = node.dataType;
            const payload = msg.payload;

            if (!node.endpoint || isNaN(node.port) || node.port < 0 || node.port > 65535 || !nodeId) {
                node.error("Endpoint URL, port, and a Node ID must be configured.");
                node.status({ fill: "red", shape: "ring", text: "missing configuration" });
                return;
            }

            if (!client || !session) {
                await connectToServer();
            }

            try {
                if (node.operation === "write") {
                    const resolvedType = configuredType || inferDataType(payload);
                    if (!resolvedType || !opcua.DataType.hasOwnProperty(resolvedType)) {
                        node.error(`Unsupported or missing data type: ${resolvedType}`);
                        node.status({ fill: "red", shape: "ring", text: "invalid data type" });
                        return;
                    }

                    const variant = new opcua.Variant({
                        dataType: opcua.DataType[resolvedType],
                        value: payload
                    });

                    const itemToWrite = {
                        nodeId: nodeId,
                        attributeId: opcua.AttributeIds.Value,
                        value: { value: variant }
                    };

                    const results = await session.write([itemToWrite]);
                    const statusCode = results?.[0]?.statusCode;

                    msg.payload = {
                        nodeId: nodeId,
                        value: payload,
                    };

                    if (statusCode && statusCode.name === "Good") {
                        node.log(`Wrote ${payload} (${resolvedType}) to ${nodeId} [${statusCode.name}]`);
                        node.status({ fill: "green", shape: "dot", text: "value written" });
                    } else if (statusCode && statusCode.name.startsWith("Bad")) {
                        const statusText = statusCode.toString();
                        node.warn(`Write failed for ${nodeId}: ${statusText}`);
                        node.status({ fill: "red", shape: "ring", text: statusText });
                    } else {
                        node.log(`Write completed with status: ${statusCode ? statusCode.toString() : "unknown"}`);
                        node.status({ fill: "grey", shape: "dot", text: "unknown status" });
                    }

                    node.send(msg);

                } else {
                    const dataValue = await session.readVariableValue(nodeId);
                    msg.payload = {
                        nodeId: nodeId,
                        value: dataValue.value.value
                    };
                    node.send(msg);
                    node.status({ fill: "green", shape: "dot", text: "value read" });
                }
            } catch (err) {
                const errorDetails = (typeof err === "object")
                    ? JSON.stringify(err, Object.getOwnPropertyNames(err))
                    : String(err);
                node.error("OPC UA operation failed: " + errorDetails);
                node.status({ fill: "red", shape: "ring", text: "operation error" });
            }
        });

        node.on('close', async function () {
            await disconnectFromServer();
        });

        process.on('SIGINT', async function () {
            await disconnectFromServer();
            process.exit();
        });
    }

    RED.nodes.registerType("opcua-otmr", OpcuaOtmrNode);
};