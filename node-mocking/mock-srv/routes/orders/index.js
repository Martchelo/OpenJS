'use strict'

module.exports = async function (fastify, opts) {
  function monitorMessages(socket) {
    socket.on('message', (data) => {
      try {
        const { cmd, payload } = JSON.parse(data)
        if (cmd === 'update-category') {
          sendCurrentOrders(payload.category, socket)
        }
      } catch (err) {
        fastify.log.warn(
          'WebSocket Message (data: %o) Error: %s',
          data,
          err.message
        )
      }
    })
  }

  function sendCurrentOrders(category, socket) {
    for (const order of fastify.currentOrders(category)) {
      socket.send(order)
    }
  }
  
  fastify.get(
    '/:category',
    { websocket: true },

    //conn.socket === undefined
    //In this case, changes follow.

    async (conn, request) => { //replaced 'socket' to 'conn'

      let open = true //created for control

      monitorMessages(conn)
      sendCurrentOrders(request.params.category, conn)
      for await (const order of fastify.realtimeOrders()) {
        if (!open) break //replaced for "if (socket.readyState >= socket.CLOSING) break"
        conn.send(order) //replaced 'socket' to 'conn'
      }

      //created API
      conn.on('close', () => {
        open = false
      })

    }
  )

  fastify.post('/:id', async (request) => {
    const { id } = request.params
    fastify.addOrder(id, request.body.amount)
    return { ok: true }
  })
}