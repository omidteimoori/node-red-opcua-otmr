# Node-RED OPCUA-OTMR Node

The `@omidteimoori/node-red-opcua` Node-RED node allows seamless communication with OPC UA servers. It enables you to read, write, and subscribe to values from specific Node IDs — ideal for industrial automation and IoT applications.

## Features

- Connect to any OPC UA server via customizable endpoint URL and port  
- Read data from specific Node IDs  
- Write data to OPC UA tags  
- Subscribe to live changes  
- Suitable for use in SCADA, MES, and Industry 4.0 projects  

## Installation

Run the following command in your Node-RED user directory (typically `~/.node-red`):

```bash
npm install node-red-opcua-otmr
```

Then restart Node-RED. The node will appear in the **function** category as `opcua-otmr`.

## Usage

1. Drag the `opcua-otmr` node into your Node-RED workspace  
2. Configure:
   - Endpoint (e.g., `opc.tcp://192.168.0.10:4840`)
   - Node ID (e.g., `ns=2;s=Temperature`)  
   - Operation: Read, Write, or Subscribe  
3. Deploy the flow and monitor/debug results

## Example Use Cases

- Real-time temperature monitoring from a PLC  
- Writing setpoints to industrial devices  
- Live dashboards for machine data  

## Author

Developed by [Omid Teimoori](https://omidteimoori.com)  
[GitHub: omidteimoori](https://github.com/omidteimoori)

## GitHub Repository

[GitHub: node-red-opcua-otmr](https://github.com/omidteimoori/node-red-opcua-otmr/)

## NPM Package

[https://www.npmjs.com/package/node-red-opcua-otmr](https://www.npmjs.com/package/node-red-opcua-otmr)
