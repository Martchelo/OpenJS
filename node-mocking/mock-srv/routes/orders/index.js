'use strict'

module.exports = async function (fastify, opts) {
  fastify.get(
     '/:category',
    { websocket: true },

    //conn.socket === undefined
    //In this case, changes follow.

    async (conn, request) => { //replaced 'socket' to 'conn'

      let open = true //created for control

      //created API
      conn.on('close', () => {
        open = false
      })

      for (const order of fastify.currentOrders(request.params.category)) {
        if (!open) return //inserted to control
        conn.send(order) //replaced 'socket' to 'conn'
      }
      for await (const order of fastify.realtimeOrders()) {
        if (!open) break //replaced for "if (socket.readyState >= socket.CLOSING) break"
        conn.send(order) //replaced 'socket' to 'conn'
      }
    }
  )
}