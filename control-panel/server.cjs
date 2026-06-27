// Control panel API server — manages Spring Boot and UI processes
const http = require('http')
const net = require('net')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const PORT = 4174
const ROOT = path.resolve(__dirname, '..')

// --- Service definitions ---
const SERVICES = [
  {
    id: 'kafka',
    name: 'Kafka Broker',
    group: 'infrastructure',
    port: 9092,
    healthUrl: null,
    cmd: 'docker-compose up',
    args: [],
    stopCmd: 'docker-compose stop kafka',
    stopArgs: [],
    cwd: ROOT,
    color: '#f59e0b',
    icon: '⬡',
    description: 'Apache Kafka broker (KRaft mode)'
  },
  {
    id: 'kafka-ui',
    name: 'Kafka UI',
    group: 'infrastructure',
    port: 8080,
    healthUrl: 'http://localhost:8080',
    cmd: 'docker-compose up kafka-ui',
    args: [],
    stopCmd: 'docker-compose stop kafka-ui',
    stopArgs: [],
    cwd: ROOT,
    color: '#f59e0b',
    icon: '🖥',
    description: 'Provectus Kafka UI — browse topics'
  },
  {
    id: 'keycloak',
    name: 'Keycloak',
    group: 'infrastructure',
    port: 8180,
    healthUrl: 'http://localhost:8180/realms/techstore',
    cmd: 'docker-compose up keycloak',
    args: [],
    stopCmd: 'docker-compose stop keycloak',
    stopArgs: [],
    cwd: ROOT,
    color: '#22c55e',
    icon: '🔐',
    description: 'Identity Provider — OAuth2 / OIDC'
  },
  {
    id: 'kafka-training-app',
    name: 'kafka-training-app',
    group: 'backend',
    port: 8081,
    healthUrl: 'http://localhost:8081/actuator/health',
    cmd: '"C:\\apache-maven-3.9.12\\bin\\mvn.cmd" spring-boot:run',
    args: [],
    cwd: path.join(ROOT, 'kafka-training-app'),
    color: '#6366f1',
    icon: '🎓',
    description: 'Original Kafka training app (Dashboard tab)'
  },
  {
    id: 'product-service',
    name: 'product-service',
    group: 'backend',
    port: 8082,
    healthUrl: 'http://localhost:8082/actuator/health',
    cmd: '"C:\\apache-maven-3.9.12\\bin\\mvn.cmd" spring-boot:run',
    args: [],
    cwd: path.join(ROOT, 'product-service'),
    color: '#a78bfa',
    icon: '🛍',
    description: 'Product catalog REST API'
  },
  {
    id: 'order-service',
    name: 'order-service',
    group: 'backend',
    port: 8083,
    healthUrl: 'http://localhost:8083/actuator/health',
    cmd: '"C:\\apache-maven-3.9.12\\bin\\mvn.cmd" spring-boot:run',
    args: [],
    cwd: path.join(ROOT, 'order-service'),
    color: '#818cf8',
    icon: '📋',
    description: 'Creates orders, reacts to events'
  },
  {
    id: 'inventory-service',
    name: 'inventory-service',
    group: 'backend',
    port: 8084,
    healthUrl: 'http://localhost:8084/actuator/health',
    cmd: '"C:\\apache-maven-3.9.12\\bin\\mvn.cmd" spring-boot:run',
    args: [],
    cwd: path.join(ROOT, 'inventory-service'),
    color: '#34d399',
    icon: '📦',
    description: 'Checks and reserves stock'
  },
  {
    id: 'payment-service',
    name: 'payment-service',
    group: 'backend',
    port: 8085,
    healthUrl: 'http://localhost:8085/actuator/health',
    cmd: '"C:\\apache-maven-3.9.12\\bin\\mvn.cmd" spring-boot:run',
    args: [],
    cwd: path.join(ROOT, 'payment-service'),
    color: '#fbbf24',
    icon: '💳',
    description: 'Processes payments (90% success)'
  },
  {
    id: 'notification-service',
    name: 'notification-service',
    group: 'backend',
    port: 8086,
    healthUrl: 'http://localhost:8086/actuator/health',
    cmd: '"C:\\apache-maven-3.9.12\\bin\\mvn.cmd" spring-boot:run',
    args: [],
    cwd: path.join(ROOT, 'notification-service'),
    color: '#60a5fa',
    icon: '🔔',
    description: 'Aggregates all Kafka events'
  },
  {
    id: 'dispatch-service',
    name: 'dispatch-service',
    group: 'backend',
    port: 8087,
    healthUrl: 'http://localhost:8087/actuator/health',
    cmd: '"C:\\apache-maven-3.9.12\\bin\\mvn.cmd" spring-boot:run',
    args: [],
    cwd: path.join(ROOT, 'dispatch-service'),
    color: '#f472b6',
    icon: '🚚',
    description: 'Assigns couriers, simulates delivery'
  },
  {
    id: 'store-ui',
    name: 'Store UI',
    group: 'frontend',
    port: 5174,
    healthUrl: 'http://localhost:5174',
    cmd: 'npm run dev -- --port 5174',
    args: [],
    cwd: path.join(ROOT, 'store-ui'),
    color: '#4f46e5',
    icon: '🛒',
    description: 'TechStore customer frontend'
  },
  {
    id: 'kafka-training-ui',
    name: 'Kafka Training UI',
    group: 'frontend',
    port: 5173,
    healthUrl: 'http://localhost:5173',
    cmd: 'npm run dev -- --port 5173',
    args: [],
    cwd: path.join(ROOT, 'kafka-training-app-ui'),
    color: '#6366f1',
    icon: '📊',
    description: 'Training dashboard + event stream'
  }
]

// --- Process registry ---
const procs = {}   // id -> { proc, logs[], status }

function getState(id) {
  return procs[id] || { status: 'stopped', logs: [] }
}

function pushLog(id, line) {
  if (!procs[id]) return
  procs[id].logs.push({ t: Date.now(), line: line.replace(/\x1b\[[0-9;]*m/g, '') })
  if (procs[id].logs.length > 300) procs[id].logs.shift()
}

function isPortInUse(port) {
  // Connect to the port — if something is listening the connection succeeds.
  // This works regardless of whether the server binds to 127.0.0.1, 0.0.0.0 or :: (IPv6).
  return new Promise(resolve => {
    const socket = new net.Socket()
    socket.setTimeout(1000)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('error',   () => { socket.destroy(); resolve(false) })
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
    socket.connect(port, '127.0.0.1')
  })
}

function killPort(port) {
  return new Promise(resolve => {
    if (!port) return resolve()
    // Step 1: get all PIDs listening on this port via netstat
    const finder = spawn(`netstat -ano`, [], { shell: true, windowsHide: true })
    let output = ''
    finder.stdout.on('data', d => output += d.toString())
    finder.on('exit', () => {
      const pids = new Set()
      for (const line of output.split('\n')) {
        // Match lines like "  TCP  0.0.0.0:8082  ... LISTENING  1234"
        if (!line.includes('LISTENING')) continue
        const portMatch = line.match(/:(\d+)\s/)
        if (!portMatch || parseInt(portMatch[1]) !== port) continue
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid)
      }
      if (pids.size === 0) return setTimeout(resolve, 300)
      // Step 2: kill each PID and its child tree
      let pending = pids.size
      const done = () => { if (--pending === 0) setTimeout(resolve, 1500) }
      for (const pid of pids) {
        const k = spawn('taskkill', ['/F', '/T', '/PID', pid], { shell: true, windowsHide: true })
        k.on('exit', done)
        k.on('error', done)
      }
    })
    finder.on('error', () => setTimeout(resolve, 300))
    setTimeout(resolve, 10000)
  })
}

async function startService(id) {
  const svc = SERVICES.find(s => s.id === id)
  if (!svc) return { ok: false, error: 'Unknown service' }
  if (procs[id] && procs[id].status === 'running') return { ok: false, error: 'Already running' }

  procs[id] = { status: 'starting', logs: [], pid: null }

  // Check if port is already occupied
  if (svc.port && !svc.cmd.startsWith('docker')) {
    const occupied = await isPortInUse(svc.port)
    if (occupied) {
      pushLog(id, `[port ${svc.port} in use — killing existing process…]`)
      await killPort(svc.port)
      // Verify it's actually free now
      const stillOccupied = await isPortInUse(svc.port)
      if (stillOccupied) {
        pushLog(id, `[ERROR] Port ${svc.port} still in use after kill — cannot start`)
        procs[id].status = 'error'
        return { ok: false, error: `Port ${svc.port} still in use` }
      }
      pushLog(id, `[port ${svc.port} cleared — starting…]`)
    }
  }

  const opts = { cwd: svc.cwd, shell: true, windowsHide: true,
                 env: { ...process.env, FORCE_COLOR: '0' } }
  const proc = spawn(svc.cmd, svc.args, opts)

  procs[id].pid = proc.pid

  const onData = (data) => {
    const text = data.toString()
    text.split('\n').filter(l => l.trim()).forEach(l => pushLog(id, l))
    if (!procs[id]) return
    // Spring Boot ready: "Started XxxApplication in N seconds"
    if (/Started \w+Application in/.test(text)) {
      procs[id].status = 'running'
    }
    // Vite ready
    if (text.includes('Local:') || text.includes('ready in')) {
      procs[id].status = 'running'
    }
    // Docker compose attach lines
    if (/Container \S+ Running/.test(text) || /Container \S+ Started/.test(text)) {
      procs[id].status = 'running'
    }
  }

  proc.stdout.on('data', onData)
  proc.stderr.on('data', onData)

  proc.on('exit', (code) => {
    pushLog(id, `[process exited with code ${code}]`)
    if (procs[id]) procs[id].status = 'stopped'
  })

  proc.on('error', (err) => {
    pushLog(id, `[spawn error: ${err.message}]`)
    if (procs[id]) procs[id].status = 'error'
  })

  procs[id].proc = proc

  // For docker services, mark running after brief delay since output is sparse
  if (svc.cmd.startsWith('docker')) {
    setTimeout(() => {
      if (procs[id] && procs[id].status === 'starting') procs[id].status = 'running'
    }, 8000)
  }

  // Port-ping fallback: for Spring Boot services that take > 10s (e.g. dispatch-service),
  // poll the port every 2s for up to 60s and flip to running as soon as it answers.
  if (svc.port && !svc.cmd.startsWith('docker')) {
    let attempts = 0
    const pingInterval = setInterval(async () => {
      attempts++
      if (!procs[id] || procs[id].status === 'running' || procs[id].status === 'stopped' || procs[id].status === 'error') {
        clearInterval(pingInterval)
        return
      }
      if (attempts > 30) { clearInterval(pingInterval); return } // give up after 60s
      const up = await isPortInUse(svc.port)
      if (up && procs[id] && procs[id].status === 'starting') {
        procs[id].status = 'running'
        pushLog(id, `[port ${svc.port} is now responding — service is up]`)
        clearInterval(pingInterval)
      }
    }, 2000)
  }

  return { ok: true }
}

async function stopService(id) {
  const svc = SERVICES.find(s => s.id === id)
  if (!svc) return { ok: false, error: 'Unknown service' }

  const state = procs[id]
  if (!state || state.status === 'stopped' || state.status === 'stopping') {
    return { ok: false, error: 'Not running' }
  }

  // Mark as stopping immediately so detectRunning doesn't race
  procs[id].status = 'stopping'
  pushLog(id, '[stopping…]')

  // Docker services: use docker-compose stop
  if (svc.stopCmd) {
    await new Promise(resolve => {
      const opts = { cwd: svc.cwd, shell: true, windowsHide: true }
      const stopper = spawn(svc.stopCmd, [], opts)
      stopper.on('exit', resolve)
      stopper.on('error', resolve)
      setTimeout(resolve, 10000)
    })
  }

  // Kill tracked process tree (Maven parent)
  if (state.proc) {
    try {
      spawn('taskkill', ['/PID', String(state.proc.pid), '/T', '/F'],
            { shell: true, windowsHide: true })
    } catch {}
  }

  // Kill by port — catches child JVMs not parented to Maven PID
  if (svc.port && !svc.cmd.startsWith('docker')) {
    await killPort(svc.port)
  }

  procs[id].status = 'stopped'
  pushLog(id, '[stopped by user]')
  return { ok: true }
}

// --- HTTP server ---
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function json(res, data, code = 200) {
  cors(res)
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', c => data += c)
    req.on('end', () => { try { resolve(JSON.parse(data)) } catch { resolve({}) } })
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return }

  const url = req.url.split('?')[0]

  // GET /ctrl/services — list all with current status
  if (req.method === 'GET' && url === '/ctrl/services') {
    const list = SERVICES.map(s => {
      const state = getState(s.id)
      return {
        id: s.id, name: s.name, group: s.group,
        port: s.port, healthUrl: s.healthUrl,
        color: s.color, icon: s.icon, description: s.description,
        status: state.status,
        pid: state.pid || null
      }
    })
    return json(res, list)
  }

  // GET /ctrl/logs/:id
  const logsMatch = url.match(/^\/ctrl\/logs\/(.+)$/)
  if (req.method === 'GET' && logsMatch) {
    const state = getState(logsMatch[1])
    return json(res, state.logs || [])
  }

  // POST /ctrl/start/:id
  const startMatch = url.match(/^\/ctrl\/start\/(.+)$/)
  if (req.method === 'POST' && startMatch) {
    const result = await startService(startMatch[1])
    return json(res, result, result.ok ? 200 : 400)
  }

  // POST /ctrl/stop/:id
  const stopMatch = url.match(/^\/ctrl\/stop\/(.+)$/)
  if (req.method === 'POST' && stopMatch) {
    const result = await stopService(stopMatch[1])
    return json(res, result, result.ok ? 200 : 400)
  }

  // POST /ctrl/start-all
  if (req.method === 'POST' && url === '/ctrl/start-all') {
    const results = {}
    for (const svc of SERVICES) {
      results[svc.id] = await startService(svc.id)
      await new Promise(r => setTimeout(r, 1500))
    }
    return json(res, results)
  }

  // POST /ctrl/stop-all
  if (req.method === 'POST' && url === '/ctrl/stop-all') {
    const results = {}
    for (const svc of SERVICES.slice().reverse()) {
      results[svc.id] = await stopService(svc.id)
    }
    return json(res, results)
  }

  cors(res); res.writeHead(404); res.end('Not found')
})

async function detectRunning() {
  for (const svc of SERVICES) {
    if (!svc.port) continue
    const current = procs[svc.id]
    // Never interfere with services we're actively managing
    if (current && ['starting', 'stopping'].includes(current.status)) continue
    // Don't re-detect services we already have a live proc handle on
    if (current && current.status === 'running' && current.pid !== null) continue

    const occupied = await isPortInUse(svc.port)

    if (occupied && (!current || current.status === 'stopped' || current.status === 'error')) {
      // Port in use but we don't have it tracked — must be externally started
      procs[svc.id] = {
        status: 'running',
        logs: [{ t: Date.now(), line: `[detected already running on port ${svc.port}]` }],
        pid: null
      }
      console.log(`  ✓ ${svc.id} detected on :${svc.port}`)
    } else if (!occupied && current && current.status === 'running' && current.pid === null) {
      // Was externally detected, port now gone — mark stopped
      procs[svc.id].status = 'stopped'
      console.log(`  ✗ ${svc.id} no longer on :${svc.port} — marking stopped`)
    }
  }
}

server.listen(PORT, async () => {
  console.log(`Control Panel API listening on http://localhost:${PORT}`)
  console.log(`Open http://localhost:4173 after running: npm run dev`)
  console.log('Scanning for already-running services…')
  await detectRunning()
  // Re-scan every 5s to pick up services started outside the control panel
  setInterval(detectRunning, 5000)
})
