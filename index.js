const express = require('express')
const config = require('config')

const app = express()

app.get('/', (req, res) => {
    res.send('Your server is working')
})


const action = require('./action')


app.get('/contest', action.contest)
app.post('/notification', action.admin_only, action.set_notification)
app.post('/message', action.admin_only, action.set_message)
app.get('/notification', action.admin_only, action.get_notification)
app.get('/message', action.admin_only, action.get_message)
app.post('/server-state', action.admin_only, action.server_state)


app.listen(process.env.PORT || config.get('PORT'), () => {
    console.log('app started')
})