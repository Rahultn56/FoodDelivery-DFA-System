import { Router } from 'express';
import os from 'os';
import { getNetworkMetrics } from '../socket.js';

const router = Router();

/**
 * GET /api/network-info/stats
 * Demonstrates Computer Networks concepts:
 * Reports live transport layer metrics, socket states, and TCP/IP server parameters.
 */
router.get('/stats', (req, res) => {
  const metrics = getNetworkMetrics();

  // Network interfaces inspection
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (!net.internal && net.family === 'IPv4') {
        addresses.push({ interface: name, address: net.address, netmask: net.netmask });
      }
    }
  }

  res.json({
    protocol: req.protocol.toUpperCase(),
    httpVersion: `HTTP/${req.httpVersion}`,
    method: req.method,
    headers: {
      host: req.headers.host,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin || 'Same-origin / direct',
      accept: req.headers.accept
    },
    transport: {
      layer: 'Layer 4 - Transport (TCP)',
      listeningPort: Number(process.env.PORT || 4000),
      ipFamily: 'IPv4 / IPv6 Dual Stack',
      activeWebSocketSockets: metrics.connectedSockets,
      socketTransport: 'WebSocket / Engine.IO'
    },
    metrics: {
      totalHttpRequestsServed: metrics.totalHttpRequests,
      totalWebSocketFramesDispatched: metrics.totalWebSocketEvents,
      serverUptimeSeconds: metrics.uptimeSeconds,
      serverUptimeHuman: `${Math.floor(metrics.uptimeSeconds / 60)}m ${metrics.uptimeSeconds % 60}s`,
      processMemoryUsageMB: (process.memoryUsage().rss / (1024 * 1024)).toFixed(2)
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      networkInterfaces: addresses
    },
    educationalContext: {
      osiModel: {
        layer7: 'Application: HTTP REST API, JSON, WebSocket protocol (ws://)',
        layer6: 'Presentation: JSON serialization / deserialization, UTF-8 character encoding',
        layer5: 'Session: JWT bearer token sessions, Socket.io rooms & connection state',
        layer4: 'Transport: TCP (Transmission Control Protocol) reliable byte stream on port 4000',
        layer3: 'Network: IP routing (IPv4 127.0.0.1 / localhost)',
        layer2: 'Data Link: Ethernet / Wi-Fi frames (MAC addressing)',
        layer1: 'Physical: Network cables / wireless radio signals'
      },
      threeWayHandshake: '1. SYN (Client -> Server) -> 2. SYN-ACK (Server -> Client) -> 3. ACK (Client -> Server). Established before any HTTP or WebSocket data exchange.'
    }
  });
});

export default router;
