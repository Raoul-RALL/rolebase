// y-websocket server (like `npx y-websocket`) that syncs a room only once it
// is loaded from LevelDB. Otherwise a client can find a saved room empty and
// seed it again from the database, duplicating its content.
const http = require('http')
const WebSocket = require('ws')
const {
  docs,
  getYDoc,
  getPersistence,
  setPersistence,
  setupWSConnection,
} = require('y-websocket/bin/utils')

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || 1234

// Loading of each room from LevelDB
const roomLoadings = new WeakMap()

const persistence = getPersistence()
if (persistence) {
  setPersistence({
    ...persistence,
    bindState(docName, doc) {
      const loading = persistence.bindState(docName, doc)
      roomLoadings.set(doc, loading)
      return loading
    },
  })
}

// Loads the room, again if it was unloaded meanwhile (last client gone)
async function loadRoom(docName) {
  let doc
  do {
    doc = getYDoc(docName)
    await roomLoadings.get(doc)
  } while (docs.get(docName) !== doc)
}

// Unloads a room that failed to load, so that the next client retries
function unloadRoom(docName) {
  const doc = docs.get(docName)
  if (!doc || doc.conns.size > 0) return
  docs.delete(docName)
  doc.destroy()
}

const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', async (conn, req) => {
  const docName = req.url.slice(1).split('?')[0]

  // Keep the client's messages (sync step 1) until the room is loaded
  const pendingMessages = []
  const handleMessage = (message) => pendingMessages.push(message)
  conn.on('message', handleMessage)

  try {
    await loadRoom(docName)
  } catch (error) {
    console.error(`Failed to load room "${docName}"`, error)
    unloadRoom(docName)
    conn.close()
    return
  }

  conn.off('message', handleMessage)
  setupWSConnection(conn, req, { docName })
  for (const message of pendingMessages) conn.emit('message', message)
})

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (conn) => {
    wss.emit('connection', conn, request)
  })
})

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`)
})
